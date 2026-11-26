---
title: "[Insight] 為什麼 DateTime Range Picker 用毫秒當輸入輸出"
description: "從跨時區的 Log 查詢出發，區分 epoch 毫秒、畫面時區，以及使用者按 Apply 的時機。"
pubDate: 2026-11-26
category: Frontend
tags: ["React", "TypeScript", "Timezone"]
series: datetime
seriesOrder: 1
references:
  - title: React DateTime Range Picker 公開 API
    url: https://github.com/ntustRay/react-datetime-range-picker/blob/cefadde623e4260ae1235363ae501da7d57c7cec/docs/PUBLIC_API.md
  - title: React DateTime Range Picker Playground
    url: https://ntustray.github.io/react-datetime-range-picker/
---

台北的工程師選今天 16:00 到 17:00 查 Log，UTC 的同事要重查相同區間，畫面可以顯示 08:00 到 09:00。兩邊給 API 的查詢參數應代表同一段時間。如果區間只留下 `16:00` 和 `17:00`，伺服器還要知道那是誰的時區，才知道要查哪兩個瞬間。

React DateTime Range Picker 的值是兩個 Unix epoch 毫秒。IANA timezone，例如 `Asia/Taipei`，用於顯示和解析使用者輸入。切換顯示時區後，畫面上的時刻可以改變，epoch 毫秒維持原值。這讓前端能換輸入語境，API 仍可以使用一致的整數單位。

## 一個元件有兩種時間值

使用者先改開始，再調結束，可能還要把輸入修正一次。如果每次 `onChange` 都重查圖表，每次中間值都會產生查詢。Picker 把這些草稿事件交給 `onChange`，等合法且完整的區間按下 Apply 才觸發 `onCommit`。頁面可以在草稿變動時更新提示，查資料則留在 commit。

這個拆法特別適合查 Log、事件或圖表這種「使用者挑完範圍才往下查」的介面。如果只是跳到某一天看日曆，介面可保留日期字串，並在應用決定怎麼處理日界線。要保存每天本地 09:00 開始的週期排程，還需要保留當地時刻、時區和重複規則。單一 timestamp 只能表示一次發生的瞬間。

## 從畫面一路查到資料邊界

下一篇在 Playground 改結束時間、看 Draft 和 Committed 分開，再把同樣的資料流接到 React。之後用實際的紐約夏令時間案例檢查不存在和重複的本地時刻。最後回到查詢條件，驗證剛好落在區間端點的事件應該去哪一側。
