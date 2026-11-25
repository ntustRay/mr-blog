---
title: "[News] Pydantic AI 2.63：Agent 卡在迴圈時，怎麼在預算燒完前停下來？"
description: "拿重複工具結果、多個 worker 和卡住的 eval 各舉一例，解釋 Pydantic AI 2.63 的三種停止條件。"
pubDate: 2026-10-29
category: "AI & Agents"
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

一個 Agent 反覆查同一張工單，工具一直回同一個錯誤，它卻再查一次。另一邊有十個 worker，每個都覺得離每日預算還很遠。兩種情況看起來都是任務不停跑，第一種要看有沒有進展，第二種要看整組花了多少。Pydantic AI 於 2026 年 10 月 28 日發布 2.63.0，加入處理這兩件事的功能，也替 eval 的單次嘗試補上 timeout。[v2.63.0 release](https://github.com/pydantic/pydantic-ai/releases/tag/v2.63.0)

## 精確重複看行為，預算看所有 worker

`DetectLoops` 可看同樣的工具和參數、連續相同結果、A-B 交替或重複文字。它抓的是規則符合的重複。原本就得固定查詢進度的 polling，要給到期條件或合理窗口；否則正常查詢也會撞到門檻。參數一直變的迴圈則仍需使用時間或 request 上限。下方以 `action="error"` 示意偵測到時如何停止，未執行模型請求。[DetectLoops 文件](https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/harness/detect-loops.md)

```python
from pydantic_ai import Agent
from pydantic_ai_harness import DetectLoops

agent = Agent(
    "openai:gpt-5",
    capabilities=[DetectLoops(action="error")],
)
```

若十個 worker 各設每日 100 美元，部署上限可能變成十份。`PostgresSpendStore` 讓多個 worker 走共用的花費紀錄。導入前可故意在額度附近同時開幾個測試 run，確認並行中的請求、等待額度後的拒絕，以及 store 一時連不到時的行為。[Spend 文件](https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/harness/spend.md)｜[PostgresSpendStore 變更](https://github.com/pydantic/pydantic-ai/pull/11527)

## 評測卡住，別讓整批等它

`task_timeout` 是 Pydantic Evals 裡每次 task attempt 的期限。如果也有 retry，要一起算超時後最多再跑幾次。可以做一題固定逾時和一題正常完成的測試，確認報告會分辨 timeout，正常題仍能產出結果。這和 production 的 run 上限各自生效。Harness 裡的 capability 仍要按實際採用版本驗證。[Eval retry 與 timeout](https://github.com/pydantic/pydantic-ai/blob/v2.63.0/docs/evals/how-to/retry-strategies.md)

下方假設已有 `dataset` 和任務函式 `call_agent`。每次最多 30 秒，上限三次嘗試。這組 retry 規則把 `TimeoutError` 排除，避免一題持續逾時拖長整批。

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
