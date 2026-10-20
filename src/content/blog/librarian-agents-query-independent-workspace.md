---
title: "[News] Librarian Agents：讓 Agent 先整理文件，再回答問題"
description: "Librarian Agents 用強化學習訓練文件整理者，在問題到來前建立可重用的工作區。從公開評分紀錄看它的效果，以及原文回查、目錄階層與文件更新的限制。"
pubDate: 2026-10-20
category: AI
tags: [AI Agents, Harness]
draft: false
references:
  - title: "Librarian Agents：論文 v1"
    url: "https://arxiv.org/html/2610.22273v1"
  - title: "arXiv：版本與提交時間"
    url: "https://arxiv.org/abs/2610.22273v1"
  - title: "Librarian Agents：研究程式碼"
    url: "https://github.com/teresaz05/librarian-agents/tree/27c9d86391b5da9c04e88b920076fa3867782bb9"
  - title: "Librarian Agents：評分紀錄與結果"
    url: "https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/RESULTS.md"
  - title: "Librarian Agents：重現範圍與設定"
    url: "https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/REPRODUCING.md"
  - title: "Librarian Agents：checkpoint 設定"
    url: "https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/CHECKPOINTS.md"
---

同一批文件會被反覆提問時，有些跨文件整理工作可以先做。Librarian Agents 探索的就是這個切入點：訓練一個 builder，在還沒看到未來問題之前，先建立回答 Agent 能使用的文件工作區。

[論文 v1](https://arxiv.org/abs/2610.22273v1)於 UTC 2026 年 10 月 15 日提交，換算台灣時間是 **10 月 16 日凌晨**。本文納入近 7 天的研究，沒有把後續報導日期當成新發布日期。

## 這篇的重點

- Builder 學習建立摘要、跨文件連結與階層，成效由下游回答品質決定；目前公開的是研究程式碼。
- 作者附帶的評分紀錄可以重算，本文已完成一致性檢查；沒有重新訓練模型或執行回答評測。
- 值得借用的是「預先整理後，用未見問題驗收」的設計。它尚未解決持續更新文件的問題，也沒有證明能全面取代既有 RAG。

## 整理者學的是什麼？

依[論文的方法章節](https://arxiv.org/html/2610.22273v1)，builder 能建立合成文件、合併相關內容、刪除冗餘的合成文件，或停止整理。原始文件會保留；刪除操作不會刪掉原文，讓回答 Agent 仍能沿著來源連結回查細節。

這裡的差異在訓練目標。摘要看起來是否流暢，並不足以決定工作區好不好。研究用強化學習更新 builder，透過固定的回答 Agent 衡量整理後的文件能否支持正確回答。用於驗收的問題不會交給 builder，也不參與所報 checkpoint 的選擇。

主實驗獎勵的是可回答程度與最終正確性，沒有另外加入目錄形狀或建置成本的獎勵。因此，不宜把它描述成「直接訓練出最省 token 的資料夾」。

這和先前介紹的 [Orbit 程式碼索引](../gitlab-orbit-duckdb-code-context/)有不同的問題設定。Orbit 用解析器建立定義、引用等程式關係；Librarian Agents 則讓模型決定，跨文件資訊應該如何被重新整理成可閱讀的中介資料。

## 可以重算紀錄，還不能算獨立重現

本文檢查的程式碼版本是 `27c9d86`。在該 repository 執行：

```bash
bash scripts/reproduce_results.sh
```

腳本會讀取作者附帶的評分紀錄，重算統計並檢查設定與報告是否一致。這次檢查通過；例如 BrowseComp+ reuse 的答對率為 Librarian **63.66%**、未微調 builder **24.15%**。

這組對照涵蓋 50 組文件、443 題，問題由模型產生並固定下來。它比較的是有無微調的 builder，不能直接拿來宣稱「勝過所有 RAG 39.5 個百分點」。不同實驗的對照組與問題集必須分開看，詳見[重現說明](https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/REPRODUCING.md)。

重算紀錄也不會重新呼叫回答模型或 judge，無法驗證原始答案與評分是否正確。完整端到端重跑還需要模型、資料、服務與 checkpoint；[checkpoint 文件](https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/CHECKPOINTS.md)要求自行提供可用路徑，不能把上述一行指令當成完整重現流程。目前未取得獨立重跑的證據。

## 目錄有幫助，但答對率沒有跟著全面上升

[公開的階層消融結果](https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/RESULTS.md)更能幫助工程判斷。作者針對有完整快照的 49 組文件、435 題，保持文件內容不變，修改階層關係後重新評估：

| 工作區 | 答對率 | 每題平均導覽 token |
| --- | ---: | ---: |
| 原始階層 | 55.86% | 3,634.79 |
| 攤平階層 | 57.70% | 5,497.08 |
| 打亂階層 | 51.72% | 3,611.66 |

攤平後需要讀取更多 token，答對率的點估計卻略高。這支持保留階層有導覽效益，沒有證明原始階層的正確率一定最高；也不能只看資料夾是否整齊就判定整理成功。

這是另一組實驗，不能與前面的 reuse 答對率直接相減。上述數字都來自作者評分紀錄，本文只重算了統計。

## 先用一批固定文件試，不急著換掉檢索系統

它對工程師最直接的用途，是提供一種文件問答的實驗設計：同一批產品文件、設計紀錄或操作手冊會被反覆查詢時，先測預先整理能否改善跨文件回答。原論文以靜態文件為主；文件改版後，如何更新合成內容仍是開放問題。

以下是建議的試驗方向，**尚未執行，也不是官方範例格式**。可以先用一般模型整理少量文件，驗證工作區設計；這不等於重現論文的 RL builder。

| 情境 | 應記錄的結果 |
| --- | --- |
| 多份文件共同決定答案 | 是否正確整合，來源是否支持結論 |
| 摘要漏掉一個關鍵例外 | 能否回到原文，而非直接猜答案 |
| 原文修改一項限制 | 是否仍引用舊摘要，能否辨識版本 |

先保留一批不給整理者看的驗收題，再固定回答模型與預算，比較原始檢索和整理後的工作區。除了答對率，也記錄建置成本、導覽量與人工查證時間。

衍生文件最好能追到來源 ID、版本與產生時間，原文維持唯讀。這些是試驗時的工程防護，並非論文已驗證的安全保證；不可信文件中的指令，也不應因為被寫進摘要就取得工具執行權限。

目前適合把 Librarian Agents 當成文件整理的研究方向。若文件更新頻繁、來源權限差異大，或每批資料只問一次，應先處理更新、權限與建置負擔，再考慮導入這種工作區。
