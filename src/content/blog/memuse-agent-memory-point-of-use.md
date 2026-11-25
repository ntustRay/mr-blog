---
title: "[News] MemUse：Agent 取回記憶後，真的有用上嗎？"
description: "用 MemUse 追記憶送進 context 後，有沒有影響操作和結果。回讀 8,000 次 coding episode 的證據與限制。"
pubDate: 2026-11-04
category: "AI & Agents"
tags: [AI Agents, Memory, Evaluation]
draft: false
references:
  - title: "Delivered, Not Used: Evaluating Agent Memory at Its Point of Use"
    url: "https://arxiv.org/abs/2611.01718"
  - title: "MemUse paper — arXiv HTML"
    url: "https://arxiv.org/html/2611.01718"
  - title: "MemUse — Hugging Face Papers"
    url: "https://huggingface.co/papers/2611.01718"
relatedPostIds:
  - memhub-shared-memory-data-lifecycle
  - librarian-agents-query-independent-workspace
  - agent-monitoring-coverage-compaction
---

Memory 回傳「先看 parser 的邊界」，Agent 後來也去改 parser。這還有幾種解釋：它可能照記憶提示走，也可能原本已從測試輸出看到同一條線索。2026 年 11 月 1 日發布的《Delivered, Not Used》提出 MemUse，希望把這兩種情況分開觀察。[MemUse 論文](https://arxiv.org/abs/2611.01718)

## 追到 action，才看得出記憶在哪裡有用

研究在 model API 邊界標記哪些內容由 memory 加入，比對原本看得到的內容，再連到後續工具動作和可觀察效果。假如每輪都重塞同一段提醒，要扣掉在 context 已可見的重複。若 Agent 真按這段建議改了檔，再看後續測試是改善、無影響或變差。這些是紀錄中能看到的結果，想證明移除某一筆後結果一定不同，還需要另外做對照。[MemUse 方法](https://arxiv.org/html/2611.01718)

作者用 500 個 SWE-bench Verified 任務、12 個 Python repos、mini-SWE-agent 與 gpt-6-luna，四種 memory 設定加上無 memory，各跑四次。這給出 8,000 次含 memory 的 episode 與 2,000 次基準。解題率都接近 73%，但實驗報告記憶設定的成本增幅從 8.8% 到 293.2%，相關條目有 51.3% 到 79.7% 沒被用上。平均成功率看不出哪些資訊重複塞入，也看不出正確提醒被忽略的地方。[實驗設計與結果](https://arxiv.org/html/2611.01718)

若團隊已經有工具 trace，可以先從一批固定任務記三樣東西：真正送入的記憶、它是否早就在畫面或 prompt 裡、後續有沒有採取相關動作。先加無記憶基準，才知道增加成本換到了什麼。這個研究集中在特定 coding benchmark，客服或 browser agent 要用各自的資料重測。
