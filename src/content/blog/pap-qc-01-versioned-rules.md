---
title: '[Insight] PAP 品管工作台 01｜為什麼報表要記下規則版本'
description: 從兩份來源表格的比對談起，拆解規則設定、瀏覽器運算和報表如何保留可追溯的依據。
pubDate: 2026-11-26
category: Data & Visualization
tags: [CSV, Web Worker, Data Quality]
series: pap-qc
seriesOrder: 1
references:
  - title: PAP 品管工作台專案說明
    url: https://github.com/ntustRay/pap-qc-workbench/blob/5c1ef8291316746dee3bc4452b6adf0156eda377/README.md
  - title: 預設規則與審核表
    url: https://github.com/ntustRay/pap-qc-workbench/blob/5c1ef8291316746dee3bc4452b6adf0156eda377/docs/BUSINESS_RULES.md
---

同一份 PAS、PATH 表格跑出兩份不同的統計，第一個問題應該是「哪個條件變了」。來源檔的欄位對應、資料完整截止日和規則版本都會影響輸出。只有一個合計數字，無法判斷差異來自哪一步。

PAP 品管工作台處理的是抹片與切片資料的品管整理。輸入是兩份表格，輸出包含配對明細、資料檢查紀錄和報表。專案選擇把配對條件、期間與分類規則移出畫面，交給獨立的規則檔和運算程式。示範規則屬待覆核草稿，系列全程使用虛構資料。

## 一份報表要能回到當時使用的資料

假設把截止日往前調一個月。同一筆虛構資料的採檢日沒有變，但工作台可能會對「追蹤是否期滿」給出不同狀態。如果只保存結果，後續就得猜是追蹤條件、輸入檔或截止日造成差異。

目前的做法把這幾件事放在不同位置。畫面管理檔案、欄位和輸出格式。規則 JSON 保存版本與可調整的條件。Domain engine 負責解析後的比對與計算，由 Web Worker 執行。結果會保留當次的規則快照，方便回頭核對。實作位置與資料界線可從專案說明核對。

## 規則可以用表格討論

讓熟悉業務的人直接改 JavaScript，會把程式細節一併帶進覆核。專案另提供 Excel／CSV 審核表，列出系統現行做法、條件和虛構案例，讓覆核者寫下期望輸出。審核意見交回維護者後，仍要更新設定、用合成案例重跑，再發布新版。

瀏覽器內運算減少了上傳檔案和維護後端的需求。代價是工作記錄留在該瀏覽器，跨人覆核要有明確的交接檔案。下一篇用內建示範走一次流程，從欄位、截止日一路對到 CSV。從那一列就能看到工作台保存了哪些依據。

[下一篇｜用虛構資料完成比對與 CSV 匯出](../pap-qc-02-synthetic-demo/)
