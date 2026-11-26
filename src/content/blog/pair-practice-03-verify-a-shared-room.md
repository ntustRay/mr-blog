---
title: "[Insight] 共編同步以後，遠端解題房間還要驗哪些事？"
description: "從晚加入、斷線和輸出差異回看房間的同步與測試責任。"
pubDate: 2026-11-26
category: "System Design"
tags: ["Yjs", "WebRTC", "Testing"]
series: pair-practice
seriesOrder: 3
references:
  - title: "Yjs Document Updates"
    url: "https://docs.yjs.dev/api/document-updates"
  - title: "Broadcast Channel API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API"
---

上篇的本機範例可以檢查後開的分頁能否補到測資，兩邊加入文字是否都會同步，以及更新後能不能重跑測試。如果三件事都過了，才有一組可拿去驗遠端房間的基本行為。

跨裝置時可以用同一題繼續驗。A 先加入房間並寫一筆測資，B 晚一點加入，先確認測資內容一致。接著讓 B 短暫斷線，A 改一個輸入，等 B 連回來再檢查遺漏的更新有沒有補上。測資一致後，兩邊各跑一次，核對語言、輸入、預期輸出和實際輸出。

若文字一直對不上，先沿同步的傳輸和重連流程追。若輸入一致、輸出不同，再看 Runner 的版本、輸入格式或超時條件。這條驗收線可以從短題開始，也能留給日後加入唯讀或更多語言時重跑。共編、房間權限與 Runner 可以各自改進，驗收時仍能對回使用者手上的那一筆題目。
