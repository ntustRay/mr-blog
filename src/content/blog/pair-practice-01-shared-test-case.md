---
title: "[Insight] Pair Practice 為什麼把共編和測資放在一起"
description: "用雙人解題的邊界案例說明，為什麼共用題目、程式和輸出有不同責任。"
pubDate: 2026-11-26
category: "System Design"
tags: ["Yjs", "WebRTC", "Testing"]
series: pair-practice
seriesOrder: 1
references:
  - title: "Yjs Document Updates"
    url: "https://docs.yjs.dev/api/document-updates"
  - title: "Broadcast Channel API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API"
---

兩個人結對解題，一個人正在改程式，另一個人可能在想「連續兩個空格要算幾個單字」。如果題目、編輯器和測資各在不同視窗，雙方容易看著不同一版的輸入。Pair Practice 將題目、共編和測資放在同一個房間，讓討論能落在一組雙方都看得到的資料。

共編和執行是兩件具體的事。兩個分頁收到同一段文字，只能驗證共享狀態有更新。執行時還要確認使用同一組輸入、規則和預期輸出。兩步分開檢查，出錯時就知道該先追文字更新、測試資料或執行結果。

Pair Practice 目前是 Alpha。接下來會用公開技術做一個可以自己啟動的小範例，用同一台電腦的兩個分頁同步輸入，再跑一筆單字計數測試。
