---
title: '[Insight] Dev Map Lab 為什麼把教材、測資和筆記放在同一個單元？'
description: 從 JavaScript 讀完卻寫不出來的情境，拆解學習路線、瀏覽器執行器和本機筆記怎麼接起來。
pubDate: 2026-11-26
category: Full-stack
series: dev-map
seriesOrder: 1
tags: [TypeScript, Next.js, IndexedDB, Web Worker]
references:
  - title: Dev Map Lab 公開程式碼與使用說明
    url: https://github.com/ntustRay/dev-map-lab
  - title: Dev Map Lab 架構
    url: https://github.com/ntustRay/dev-map-lab/blob/main/docs/ARCHITECTURE.md
---

理解兩個 JavaScript 變數可以共用同一個物件，和寫出一支不會修改原始陣列的函式，中間還有一段要練。把教材、習題、筆記分開讀，當下做錯的空陣列或負數案例，很容易只留在某次作答裡。Dev Map Lab 把三個動作放在同一個學習單元：讀完一段，跑測資，把沒想到的情況記回原段落。

一開始就能用「值、參照與不修改輸入」這個單元驗證。教材先放物件共用參照的例子，實作題要求保留原始輸入，測資再帶到陣列為空或全部是負數時該回傳什麼。筆記可以直接連回「用輸入與輸出描述資料處理」的段落。下次重讀時，看得到題意、曾寫過的程式，以及出錯時漏想的是哪一筆資料。

## 教材、程式和學習紀錄各有一個地方

| 要做的事 | Dev Map Lab 的做法 | 這樣做的代價 |
| --- | --- | --- |
| 新增路線和題目 | Markdown 放教材，JSON 放題目與測資 | 檔案需維護穩定 ID，格式和關係要跑驗證 |
| 直接跑 JS／TS 程式 | QuickJS WASM 在 Web Worker 執行，TypeScript 先經轉譯 | 題型限制在同步函式和 JSON 資料，沒有完整的瀏覽器或 Node.js 環境 |
| 留下自己的筆記和進度 | 用 IndexedDB 存在該瀏覽器 | 換網址或裝置需要匯出並帶走備份 |

學習路線列出建議先讀的單元，已經熟悉一個概念的人也可以直接跳去練習。把 Markdown 和題庫拉出 React 元件之外，改例子時只要動內容。也因此單元 ID、段落 ID 與題目版本會影響既有資料：改標題通常可以留著原 ID，換 ID 就可能讓筆記找不到原文。

接下來先用原有單元跑一次程式和匯出筆記，再加一個自己的單元。前者驗證學習流程，後者驗證這個架構能換教材而不用寫新頁面。
