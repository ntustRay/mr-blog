---
title: "[Insight] Model Routing 省下 64% 成本，先看清楚它怎麼衡量品質"
description: "LangChain 在 973 個 Open SWE threads 測試 Model Routing。省成本的結果很明確，但 merged PR rate 有它的測量邊界。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: AI
tags: [AI Agents, Coding Agents, Harness]
draft: false
references:
  - title: "LangChain：How to Build a Model Router in the Harness"
    url: "https://www.langchain.com/blog/how-to-build-a-model-router-in-the-harness"
---

改字、找檔案和分析跨模組架構，對模型能力的需求不同。若想透過 routing 降低成本，需要先定義哪些交付品質不能退步。

LangChain 在 Open SWE 的實驗比較 routing 與固定模型。以下解讀原始報告，沒有自行重跑實驗；重點是成本下降時，品質指標究竟涵蓋哪些結果。

## 973 個 Threads 的測量範圍

依 [LangChain 的原始報告](https://www.langchain.com/blog/how-to-build-a-model-router-in-the-harness)，A/B test 共包含 973 個 threads，比較 router 與固定使用最強模型的對照組：

| 指標 | Routing | 固定使用高能力模型 |
| --- | ---: | ---: |
| 每個 thread 的 median cost | $0.94 | $2.61 |
| 最後有 PR merged 的 thread 比例 | 29.2% | 27.3% |
| 有開 PR 的 thread 比例 | 38.9% | 39.6% |

median cost 降低 64%；merged PR rate 的差異沒有達到統計顯著，報告中的 p-value 是 0.49。

**沒有測到顯著差異，不能推成品質完全相等。** PR merge 會受到任務類型、reviewer 與採用意願影響，也沒有直接涵蓋每個 bug、可維護性或上線後的問題。

這個結果支持「這批流量中，routing 省下成本，交付指標未測到明顯退步」。它沒有證明所有專案都能照同樣比例省錢。

## Router 只在 thread 開頭選一次

這次實作讀取第一則 human message，選 fast、balanced 或 performance tier，之後整個 thread 維持同一模型。[原文](https://www.langchain.com/blog/how-to-build-a-model-router-in-the-harness)列出的分配為 balanced 56%、fast 34%、performance 10%。

這種設計容易觀察與 debug：每個 thread 有一個可追蹤的選擇，也比較少處理模型切換後的 context 與 cache 問題。

代價是任務可能變難。最初只問「這個函數在哪裡」，後來卻要求修改跨模組 API，開頭的選擇未必還合適。

## Routing criteria 要有專案的脈絡

以下是可以試驗的分類，屬於工程設計建議，並非原實驗的分類規則：

| Tier | 起步時可分配的工作 | 升級訊號 |
| --- | --- | --- |
| Fast | 已知位置的文案、機械式修改 | 需要理解跨檔案行為 |
| Balanced | 有 reproduction 的局部 bug、新增一般測試 | 多次修改仍無法解釋失敗 |
| Performance | 公開 API、ownership、跨模組設計 | 仍缺必要需求或可驗證證據 |

最後一格尤其重要。模型再強，也不能補出使用者沒提供的需求。這種情況該補資訊，而不是繼續加推理成本。

Harness 知道 repository、工具與任務的限制，適合提供 routing 的訊號。如果只根據輸入長度選模型，一句很短的「修掉偶發資料錯亂」，也可能被送到最便宜的 tier。

## 先記錄成本與返工，再決定要不要加 Router

起步可以先用單一模型，對一批真實任務記錄：

- 任務類型與最終是否採用。
- 完成耗時、模型成本，以及失敗後重試成本。
- 人工 review 與返工的時間。
- 合併後是否要 revert 或補修。

等到看得出簡單與複雜任務的差異，再試少量 routing。預先寫下可接受的退步範圍，並保留回到 baseline 的方式。

如果一個便宜模型讓 reviewer 多花半小時，token 帳單可能下降，團隊成本卻上升。**Routing 應該優化完成工作的總成本；模型單價只是其中一項。**
