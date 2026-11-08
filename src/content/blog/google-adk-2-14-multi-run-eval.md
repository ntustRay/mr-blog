---
title: "[News] Google ADK 2.14：Agent Eval 為什麼不能只跑一次？"
description: "Google ADK 2.14 新增 multi-run evaluation。整理 mean、pass rate、worst run 與 crash policy 如何改變 Agent 測試的通過條件。"
pubDate: 2026-11-08
category: "AI & Agents"
tags: [AI Agents, Testing, Harness]
draft: false
references:
  - title: "Google ADK Python v2.14.0"
    url: "https://github.com/google/adk-python/releases/tag/v2.14.0"
  - title: "Google ADK：EvalConfig and the eval config file"
    url: "https://github.com/google/adk-python/blob/v2.14.0/docs/guides/evaluation/eval_config/index.md"
  - title: "Google ADK：multi-run evaluation implementation"
    url: "https://github.com/google/adk-python/commit/7f3517e43d7b6012f51438cffb60e6d7983e4217"
  - title: "PyPI：google-adk 2.14.0"
    url: "https://pypi.org/project/google-adk/2.14.0/"
relatedPostIds:
  - coding-agent-harness-176-configurations
  - gemini-4-argon-adk-review
  - agent-monitoring-coverage-compaction
---

Google 在 11 月 7 日正式發布 ADK Python 2.14.0。這次最值得注意的改動不是多一個模型或 tool，而是 **同一個 Agent 測試案例可以重跑多次，再用跨次數規則判斷是否通過**。

> **TL;DR：** Agent 的單次結果有隨機性。ADK 2.14 的 multi-run evaluation 讓團隊把「這次有成功」改成「重跑後仍達到可靠度門檻」。平均值適合觀察整體品質；pass rate 適合可靠度目標；高風險操作則應考慮最差一次與 crash policy。

這篇依據官方 release、文件與實作 commit 整理，沒有自行重跑 ADK benchmark，也還缺少獨立團隊的 production 驗證。版本 changelog 標示 11 月 4 日，GitHub release 與 PyPI 的正式發布時間則是 11 月 7 日，本文以後者作為事件日期。

## 2.14 解決的是「同一題，答案不一定一樣」

LLM Agent 即使收到相同輸入，仍可能選不同 tool、產生不同參數，或在中途遇到 timeout。單次 eval 通過，只能證明那一次成功。

ADK 2.14 的 `multi_run_config` 可以指定：

- 同一案例執行幾次；
- 最多同時跑幾次；
- 各 run 要用平均、最差結果或通過率聚合；
- 最多允許幾次 crash。

每次 run 會建立新的 session，並保留 `repetition_index`。這讓失敗可以追到特定 repetition，而不是只看到最後一個總分。

官方也把 evaluation、A2A、execution environments 與部分 core runtime API 從 experimental 升為 stable。不過新增的 `ToolArgsMatcher` 仍標示 experimental；它雖然預設開啟，API 仍可能改動。

## 聚合方式會改變「通過」的意思

假設一個案例跑 5 次，分數是 `1.0、1.0、1.0、0.4、0.0`。同一組結果可以得到完全不同的結論：

| 方法 | 回答的問題 | 適合情境 | 主要風險 |
| --- | --- | --- | --- |
| mean | 平均品質是否夠好？ | 探索性品質、文字輸出 | 嚴重失敗可能被高分平均掉 |
| pass rate | 有多少比例達標？ | SLA、tool 使用可靠度 | 門檻設定會大幅影響結果 |
| min over runs | 最差一次能否接受？ | 權限、付款、刪除等高風險操作 | 對偶發 infrastructure 問題很敏感 |
| max crashed runs | 最多容忍幾次 crash？ | timeout、服務不穩定 | 若設定太寬鬆，會掩蓋系統性故障 |

ADK 預設會把所有 run 的 per-invocation score 放在一起取 mean。這對一般品質觀察合理，對「每次都必須正確」的操作則可能過度樂觀。

例如 4 次安全、1 次呼叫錯誤 tool，平均仍可能過關。這類案例應改用 `pass_rate` 或 `min_over_runs`，並把 crash 明確算進失敗條件。

## 一份可開始討論的 eval 設定

以下是依官方 schema 整理的設定方向，尚未在本站環境實跑：

```json
{
  "criteria": {
    "tool_trajectory_avg_score": 1.0,
    "response_match_score": 0.8
  },
  "parallelism": 4,
  "multi_run_config": {
    "num_runs": 5,
    "cross_run_scoring_by_metric": {
      "tool_trajectory_avg_score": {
        "method": "pass_rate",
        "threshold": 0.8
      },
      "response_match_score": "mean_of_runs"
    },
    "cross_run_criteria": [
      {
        "method": "pass_rate",
        "threshold": 0.8
      }
    ],
    "max_crashed_runs": 0
  }
}
```

這份設定把 tool trajectory 視為可靠度問題：5 次至少 4 次要達到單次門檻。文字回覆品質則看平均，避免一個措辭差異讓整組測試直接失敗。

實際導入時，至少要再回答三個問題：

1. 失敗的代價多高？高風險 action 不該只看平均。
2. 變異來自模型、tool、網路，還是測試資料？先保留每次 run 的 trace 才能定位。
3. 預算能否支撐重跑？若 judge metric 使用 `num_samples: 5`，再搭配 5 次 multi-run，評分模型呼叫量會明顯增加。

## 工程上有用，但先留意四個邊界

第一，`adk eval` 可以讀取 `multi_run_config`，`AgentEvaluator` 則由呼叫端傳入 `num_runs`；`adk web` 目前不會套用這段設定。CLI、測試程式與 Web UI 的結果可能因此不同。

第二，每次 run 會使用新的 session。若測試依賴固定 session ID 或前一輪狀態，multi-run 不會照原本方式重現。

第三，官方文件提醒，最外層 `multi_run_config` 若拼錯，可能因相容性處理而被忽略；`MultiRunConfig` 內部的未知欄位才會被拒絕。CI 應額外檢查實際載入的設定。

第四，平行執行會壓縮等待時間，也會同時放大 model、tool API 與 rate limit 壓力。官方 local eval service 的預設 parallelism 是 4，並不代表每個環境都適合直接使用。

## 成熟度：核心能力已進 stable，驗證仍偏官方

ADK 2.14 的 multi-run implementation 不只加 CLI 參數，也新增 aggregator、config、scoring method 與 local eval service 的測試。這比只有示範 notebook 的功能更接近可採用狀態。

同一版本還有幾個 migration 風險：

- Enum tool arguments 改為傳入 Enum member，不再是 raw string；
- Firestore session 一旦由 2.14 寫入，回滾到 2.13 或更舊版本可能無法讀取；
- environment mode 的 `RunSkillScriptTool` 改為驗證 script path 與 arguments，不再接受任意 command string；
- `ToolArgsMatcher` 仍是 experimental。

官方另報告一個 30-node、200-turn workflow 改善約 23% 執行時間與 9% peak memory。這是單一官方 workload，尚不能外推到所有 Agent。

## 實際採用建議

若團隊已經有 Agent eval，最有價值的下一步不是把所有案例一律改跑 10 次。可以先挑三類高變異或高代價案例：

- tool 選擇與參數容易漂移；
- 依賴外部 API、browser 或長鏈 tool calls；
- 涉及權限、資料寫入與 irreversible action。

先跑 3 至 5 次，保留每次 trace，再決定用 mean、pass rate 或 worst run。這能把模型隨機性、工具不穩定與測試本身的問題分開，避免用一個漂亮平均分數掩蓋真正需要修的失敗。
