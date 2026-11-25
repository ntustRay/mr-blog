---
title: "[News] Google ADK 2.14：Agent Eval 為什麼不能只跑一次？"
description: "ADK 2.14 讓一個 Agent 案例重跑多次。用五次結果比較平均、通過率、最差結果和例外如何影響驗收。"
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

同一個 Agent 測試跑五次，分數是 1.0、1.0、1.0、0.4、0.0。每次權重相同時，平均是 0.68。單次以 0.8 為門檻時，通過率是 60%，最差一次是 0。若這題是要防止 Agent 改錯工單，最後那一次值得單獨看。Google 於 2026 年 11 月 7 日發布 ADK Python 2.14.0，讓同一案例重跑，再按各個 metric 的規則決定是否過關。[ADK 2.14.0](https://github.com/google/adk-python/releases/tag/v2.14.0)

## 先定義不能忍受的失敗，再選聚合方式

`multi_run_config` 能設定重跑次數、跨次計分與 crash 上限。每次用新的 session，結果可透過 `repetition_index` 找回哪一輪失敗。如果只是觀察答覆口吻，平均分可能夠用。若是「不得呼叫錯誤工具」，可看分次通過率或最差一輪，並把 crash 算入驗收。以下沿用官方 schema 的示意設定，原文未實跑。[EvalConfig 文件](https://github.com/google/adk-python/blob/v2.14.0/docs/guides/evaluation/eval_config/index.md)｜[實作及測試](https://github.com/google/adk-python/commit/7f3517e43d7b6012f51438cffb60e6d7983e4217)

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

`adk eval` 可讀這份設定，程式裡用 `AgentEvaluator` 時要依介面傳入次數，當時 `adk web` 不套用同一段設定。CI 可先驗證實際寫出的重跑數，避免外層欄位拼錯卻只跑一次。原本靠固定 session ID 或先前狀態的測試，也要改成每輪從可重現的狀態開始。[設定載入與限制](https://github.com/google/adk-python/blob/v2.14.0/docs/guides/evaluation/eval_config/index.md)
