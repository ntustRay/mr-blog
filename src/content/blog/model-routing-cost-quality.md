---
title: "[News] Model Routing 省下 64% 成本，先看清楚它怎麼衡量品質"
description: "LangChain 測了 973 個 Open SWE threads，median cost 低 64%。讀懂 merged PR rate 能衡量多少品質。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, Coding Agents, Harness]
draft: false
references:
  - title: "LangChain：How to Build a Model Router in the Harness"
    url: "https://www.langchain.com/blog/how-to-build-a-model-router-in-the-harness"
---

「改 README 的一句話」和「找偶發的資料錯亂」都可能只有一句 prompt。前者也許用便宜模型就夠；後者得花時間還原因果。如果 router 只覺得兩句都很短，很可能從一開始就把第二件事判輕了。

LangChain 2026 年公開 Open SWE 的 A/B 實驗，共收 973 個 threads。跟每次都用最高 tier 的對照組比，router 組的成本中位數低 64%。兩組 PR 合併率的差異未達統計顯著，報告給出 p-value 0.49。這個結果說明在這次樣本裡沒有測出差異，若要主張相同品質，還需要先定義能接受的差距，再確認樣本足以辨認它。[LangChain 原始報告](https://www.langchain.com/blog/how-to-build-a-model-router-in-the-harness)

## 第一則訊息選完，整串都用同一個模型

這次 router 讀第一則 human message，在 fast、balanced、performance 三層中選一個。報告中三者約占 34%、56% 和 10%。整個 thread 固定同一個模型，查問題時很容易追到當初的選擇。代價是讀完 repo 才發現改動跨模組時，這套設計不會自動升級。[模型選擇與分配](https://www.langchain.com/blog/how-to-build-a-model-router-in-the-harness)

如果想在自己的團隊試，先替同一批待辦記錄使用成本與人工時間。合併的 PR 也可以拆成一次過、review 後大改、合併後補修。這樣某個 tier 即使讓帳單變小，只要 reviewer 多做半小時，就能在同一張紀錄看出成本轉到哪裡。
