---
title: "[News] Pydantic AI 2.63：Agent 卡在迴圈時，怎麼在預算燒完前停下來？"
description: "Pydantic AI 2.63 加入 DetectLoops、PostgresSpendStore 與 eval task timeout。整理重複行動、跨 worker 花費與卡死案例該如何分層停止。"
pubDate: 2026-10-29
category: AI
tags:
  - AI Agents
  - Harness
  - Python
draft: false
references:
  - title: Pydantic AI v2.63.0 release
    url: https://github.com/pydantic/pydantic-ai/releases/tag/v2.63.0
  - title: Detect Loops documentation
    url: https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/harness/detect-loops.md
  - title: DetectLoops pull request #11471
    url: https://github.com/pydantic/pydantic-ai/pull/11471
  - title: Spend documentation
    url: https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/harness/spend.md
  - title: PostgresSpendStore pull request #11527
    url: https://github.com/pydantic/pydantic-ai/pull/11527
  - title: Pydantic Evals retry and timeout documentation
    url: https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/evals/how-to/retry-strategies.md
  - title: Eval task timeout pull request #10291
    url: https://github.com/pydantic/pydantic-ai/pull/10291
relatedPostIds:
  - coding-agent-harness-176-configurations
  - agent-monitoring-coverage-compaction
  - deepseek-search-fetch-agent-budget
---

自主 Agent 出問題時，不一定會立刻丟出錯誤。更麻煩的情況是它仍在「正常運作」：重複呼叫同一個工具、持續收到同一個失敗結果，或讓多個 worker 各自以為預算還沒用完。

Pydantic AI 在 2026 年 10 月 28 日發布的 2.63.0，剛好把三種常見失控情境放進同一個版本：`DetectLoops` 偵測精確重複的執行軌跡、`PostgresSpendStore` 讓多個 worker 共用花費上限，Pydantic Evals 則新增每次 task 的逾時設定。

這三項功能值得一起看，因為它們各自處理不同層級的問題。單靠一個「最大步數」很難同時解決迴圈、分散式預算與卡死的評測工作。

> **TL;DR**：Pydantic AI 2.63 把 Agent 的停止條件拆成三層。`DetectLoops` 處理重複行動，`SpendLimits` 搭配 PostgreSQL 處理跨 worker 花費，`task_timeout` 處理 eval case 卡死。它們比較像 runtime brake，不是完整的安全或帳務系統；正式採用前仍要驗證誤判、併發超支與同步函式無法被中止等邊界。

## 三種煞車，處理三種故障

| 機制 | 它看到的訊號 | 適合阻止什麼 | 主要限制 |
| --- | --- | --- | --- |
| `DetectLoops` | 工具名稱、參數、結果與回覆文字 | 同一工具反覆失敗、A-B 交替、重複文字 | 只抓精確重複；刻意 polling 可能誤判 |
| `SpendLimits` + `PostgresSpendStore` | 每個 model response 的 token／價格 | 多個 worker 共用日／月／租戶預算 | 跨線的 request 仍會完成；併發時可能超出上限 |
| `task_timeout` | 每次 eval task 的執行時間 | 網路呼叫或 Agent case 無限等待 | 只限制 task；同步函式的背景 thread 不會被殺掉 |

這個拆法比單一全域 timeout 更實用。開發者可以判斷「Agent 沒有進展」、「部署已經花太多錢」與「評測 case 沒有回來」究竟是哪一類問題，再決定要提醒模型、直接終止或記錄失敗後繼續跑其他案例。

## DetectLoops：先辨識「沒有進展」，再決定要不要停

`DetectLoops` 是 Pydantic AI Harness 的 capability。官方文件列出四種偵測模式：

- 同一工具與相同參數在最近的 window 內重複呼叫，預設 5 次。
- 同一工具呼叫連續得到相同結果，預設 3 次。
- 兩個工具形成 A-B-A-B 交替，預設 3 個循環。
- 沒有工具呼叫時，模型連續輸出相同文字，預設 3 次。

最直接的用法，是在達到門檻時丟出 `LoopDetectedError`：

```python
from pydantic_ai import Agent
from pydantic_ai_harness import DetectLoops

agent = Agent(
    "openai:gpt-5",
    capabilities=[DetectLoops(action="error")],
)
```

預設 action 其實是 `nudge`：它會在下一次 model request 加入 system prompt，要求模型改變方法。這適合保留一次自我修正機會，但不是硬性停止。模型若忽略提醒，request 還是會繼續發出；需要明確上限時，仍應搭配 `UsageLimits`，或再加一個門檻較高、action 為 `error` 的 `DetectLoops`。

這項設計有兩個工程細節值得注意。第一，工具參數會先轉成 canonical JSON 再比較，所以物件欄位順序不同不會躲過偵測。第二，它在 compaction 改寫訊息以前記錄呼叫與結果，因此壓縮舊 context 不會把不同呼叫誤判成相同。

但它不是語意層級的 trajectory judge。Agent 若每次稍微改一個參數，實際上仍在原地打轉，精確比對可能看不出來。它也只比較 function tools，不涵蓋供應商執行的 native tools；從舊 `message_history` 延續的紀錄也不會回溯計算。

另一個常見誤判是 polling。Agent 若固定用相同參數查詢非同步工作狀態，三次都得到 `pending`，就可能被當成 repeated result。導入時要提高門檻、關閉該模式，或讓工具回傳 elapsed time 等會變動的欄位。

## PostgresSpendStore：讓所有 worker 看同一本預算

單一 process 內的 request 上限很好做；分散式 Agent 比較棘手。假設 queue 上有十個 worker，各自把每日 100 美元當成自己的上限，整個服務實際上可能放大成十份預算。

Pydantic AI 的 `SpendLimits` 原本已有 run、conversation、day、month、total 等視窗，以及 Redis store。2.63.0 新增 `PostgresSpendStore`，適合本來就以 PostgreSQL 跑應用或 durable execution、不想再多維護 Redis 的團隊。

```python
from decimal import Decimal

import asyncpg
from pydantic_ai_harness import SpendLimits
from pydantic_ai_harness.spend import Budget, PostgresSpendStore

pool = await asyncpg.create_pool("postgres://localhost/app")
limits = SpendLimits(
    budgets=[Budget(usd=Decimal("100"), window="day")],
    store=PostgresSpendStore(pool),
)
```

官方實作會在同一筆 transaction 內更新一個 response 涉及的所有 budget windows，並一併寫入去重 marker。相同 response 在 recovery 時再次出現，concurrent replay 會等前一筆 transaction 完成，再依 marker 跳過；marker 與 counter 的鎖定順序固定，用來降低 deadlock 風險。

這是可靠的「煞車」設計，卻不能當成精準帳本。文件明確指出：

- 讓花費跨過上限的那次 request 仍會完成，下一次 request 才被拒絕。
- 多個 concurrent runs 可能同時通過檢查，之後才各自記帳，因此仍可能超支。
- 部分 provider 或中斷的 stream 沒有完整 usage，累計值只能視為下限。
- PostgreSQL 在 commit 後掉線時，client 無法確定 transaction 是否已提交；實作不會自動重試，以免重複計費。

因此實務上仍要保留 provider 端的硬上限與帳務對帳。`SpendLimits` 比較適合阻止 runaway loop 的下一步，或把租戶、日／月視窗的花費控制放進 Agent runtime。

## task_timeout：別讓一個 case 卡住整批 eval

第三個改動不在 production runtime，而是在 Pydantic Evals。`evaluate()` 與 `evaluate_sync()` 現在可以設定 `task_timeout`，限制每一次 task attempt 的執行時間：

```python
from tenacity import retry_if_not_exception_type, stop_after_attempt

report = dataset.evaluate_sync(
    task=call_agent,
    task_timeout=30,
    retry_task={
        "stop": stop_after_attempt(3),
        "retry": retry_if_not_exception_type(TimeoutError),
        "reraise": True,
    },
)
```

逾時會被記成 case failure，其他案例可以繼續。若沒有排除 `TimeoutError`，timeout 也會像其他例外一樣觸發 retry，而且每一次 attempt 都會重新計算自己的 timeout。

邊界也很明確：這個設定不涵蓋 lifecycle hooks 與 evaluators。同步 `def` task 會在 worker thread 執行，Python 無法強制中止該 thread；報告雖然會準時把 case 標成失敗，背景工作仍可能繼續跑，只是結果被丟棄。真正會卡住的網路或模型呼叫，最好改成 async，並在 HTTP／model client 層也設定 timeout。

## 工程上該怎麼組合

如果 Agent 會長時間自主執行，我會把停止條件分成以下幾層，而不是只設一個最大回合數：

1. **Action 層**：用 `DetectLoops` 抓精確重複，先 nudge，再以較高門檻 hard stop。
2. **Run 層**：用 `UsageLimits` 限制單次 run 的 request、token 或 cost。
3. **Deployment 層**：以共享的 `PostgresSpendStore` 或 Redis store 管理日／月與租戶預算。
4. **Eval 層**：以 `task_timeout` 隔離卡住的案例，並明確決定 timeout 是否要 retry。
5. **權限與可觀測性**：另外保留工具權限、sandbox、trace 與告警。迴圈偵測不會取代這些安全邊界。

導入前至少應做四組驗證：重複失敗工具、合法 polling、兩個 worker 同時逼近預算，以及 async／sync task timeout。觀察的重點不只「有沒有停」，還要記錄停在第幾次 request、已花費多少、是否重複執行有副作用的工具，以及 recovery 會不會再記一次帳。

這篇沒有重跑供應商模型或 PostgreSQL 壓力測試；上述行為來自 2.63.0 文件、合併的 PR 與專案測試說明。正式環境仍應用自己的模型、工具與併發量做 PoC。

## 採用判斷

`DetectLoops` 與 `PostgresSpendStore` 都位於仍是 0.x 的 Pydantic AI Harness，API 可能在 minor release 調整。適合已使用 Pydantic AI、正在處理長任務或多 worker 成本控制的團隊先放入 staging；若要當成跨框架的通用安全層，目前成熟度還不夠。

這個版本真正有價值的地方，是把「Agent 何時該停」從一句 prompt 拉回可測試的 runtime policy。精確重複、共用預算與 case 逾時仍是三個不同問題，但現在可以各自設門檻、留下 telemetry，並把失敗行為寫進測試。

## References

- [Pydantic AI v2.63.0 release](https://github.com/pydantic/pydantic-ai/releases/tag/v2.63.0)
- [Detect Loops documentation](https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/harness/detect-loops.md)
- [DetectLoops pull request #11471](https://github.com/pydantic/pydantic-ai/pull/11471)
- [Spend documentation](https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/harness/spend.md)
- [PostgresSpendStore pull request #11527](https://github.com/pydantic/pydantic-ai/pull/11527)
- [Pydantic Evals retry and timeout documentation](https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/evals/how-to/retry-strategies.md)
- [Eval task timeout pull request #10291](https://github.com/pydantic/pydantic-ai/pull/10291)
