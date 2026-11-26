---
title: '[Insight] Dev Map Lab 做完之後，哪些資料該留在本機？'
description: 回看 IndexedDB、可攜備份、題目規準及程式隔離的取捨，整理可驗收的本機與雲端邊界。
pubDate: 2026-11-26
category: System Design
series: dev-map
seriesOrder: 4
tags: [IndexedDB, Web Worker, PostgreSQL, Testing]
references:
  - title: Dev Map Lab 架構與各層責任
    url: https://github.com/ntustRay/dev-map-lab/blob/main/docs/ARCHITECTURE.md
  - title: Dev Map Lab 會員與備份
    url: https://github.com/ntustRay/dev-map-lab/blob/main/docs/MEMBERSHIP.md
  - title: Dev Map Lab 評分規則
    url: https://github.com/ntustRay/dev-map-lab/blob/main/docs/GRADING.md
---

跑完一題後重新整理，段落筆記和作答仍在。這表示同一個瀏覽器能讀回資料。把同一個網址開在另一台電腦時，該裝置沒有這份 IndexedDB，得用 JSON 匯入才能接著做。這兩種情境用不同驗收方式，才能知道哪一層需要改。

## 自學先求能回到當下卡住的例子

筆記和程式草稿預設放本機，所以沒有帳號也能使用教材。這個做法把帳號與寄信故障隔離在會員功能，代價是瀏覽器清資料、換裝置或從 `localhost` 移到正式網域前，需要先匯出備份。平常要把理解記到 Obsidian，可以匯出單元 Markdown；打算把進度、草稿及作答一併移動，就存 JSON，並在另一個瀏覽器設定檔實際還原一次。

會員支援手動雲端備份。依公開會員文件，若已有雲端資料，先合併再上傳，備份 revision 可擋住舊版本直接覆蓋。一個合理的雙裝置驗收，是用 A 裝置上傳新筆記，再由持有舊資料的 B 裝置嘗試備份，看它是否先提示合併。正式信箱驗證、不同帳號的資料權限、同題草稿衝突，都要各自確認。

## 測資與規準回答不同的問題

程式題可比對輸入、實際輸出和預期輸出。以加總正數為例，付出最少就能補上的測資，是你真的曾寫錯的情況。測資可在前端查看，因此適合練習和規格說明；要正式評分時，需要另設受控執行與測資供應方式。

簡答題靠得分點、詞組和常見錯誤規則給參考分數。正確答案換個說法，可能漏掉分數。若要評估一個本機語意模型，先挑同一題的正確改寫、部分正確與帶關鍵詞的錯誤敘述，對照人工判斷再看誤判。否則只是把看不到的規則換成看不到的分數。

QuickJS WASM 放在 Worker，讓練習程式的運算可以離開主執行緒，並提供每筆時間、記憶體限制與取消。這套契約適合接受同步 `solve(...)` 與 JSON 值的題目。要支援 DOM、網路或任意 npm 套件，執行環境與風險一併改變。回顧這個專案時，可以先問下一個單元是否真的需要那些能力。只為多一道 TypeScript 純函式題，增加測資就足夠。
