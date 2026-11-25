---
title: "[News] Agent 監控漏掉 Compaction：先量覆蓋率，再談抓不抓得到"
description: "從 METR 和 Redwood 的稽核，看有資格監控、事件送達和成功判斷之間差了哪些步驟。"
pubDate: 2026-10-24
category: "AI & Agents"
tags: [AI Agents, Security, Harness]
draft: false
references:
  - title: "METR：Red-Teaming OpenAI's Internal Agent Monitoring Systems"
    url: "https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/"
  - title: "Redwood Research：Simulated Control Evaluations"
    url: "https://blog.redwoodresearch.org/p/simulated-control-evaluations"
  - title: "Simulated Control Evals — arXiv v1"
    url: "https://arxiv.org/abs/2610.31593v1"
  - title: "Reuters：External evaluators find flaws in OpenAI's AI monitoring system"
    url: "https://www.reuters.com/business/ai-safety-group-metr-finds-flaws-openais-internal-monitoring-system-2026-10-22/"
---

想替一個能改 GitHub issue 的 Agent 加監控，可以先拿執行紀錄對帳。假設它做了十次外部寫入，監控只收到八次，那兩次根本沒進判斷流程。METR 與 Redwood Research 在 2026 年 10 月 22 日公布為期三週的 OpenAI 內部稽核摘要，其中一項發現就跟這類漏接有關。[METR 公開報告](https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/)

## 99.2% 指當時符合資格的 Codex 流量

研究員估計，當時內部 Codex Agent 的監控資格比例為 99.2%，特定等級的 Responses API agentic traffic 則約 75%–94%。這些是有不確定性的分母估計。監控規則列為應納入，還要確認 runtime 有產生事件、monitor 收到事件、成功判斷，也要留下升級或阻擋的結果。[覆蓋估計與範圍](https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/)

Compaction 會把長對話整理成可接著跑的內容。原報告估計，當時 compaction 事件沒有被監控，可能漏掉約一成符合資格的內部 Codex 流量。由於完整計數不足，只能當量級估計。OpenAI 在稽核期間修正了該問題。稽核也發現 Agent 與 monitor 所看到的事件表示可能不同；實作時可讓兩邊共用事件格式，並用同一個 execution ID 對同一次執行。[METR 缺口與修正說明](https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/)

實際驗證可以先從簡單的測試資料開始，把工具操作、壓縮前後和背景任務的 ID 對到 monitor 紀錄。確認事件都到齊以後，再用離線案例測判斷品質。Redwood 的 simulated control eval 提供了把測試留在模擬環境的研究方向。覆蓋率和判斷成績分開記，才知道問題出在資料缺失還是模型判錯。[Redwood 模擬評測研究](https://blog.redwoodresearch.org/p/simulated-control-evaluations)
