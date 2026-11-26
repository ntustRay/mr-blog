---
title: "[Insight] DateTime Range Picker 接到查詢後，怎麼驗證兩端的毫秒"
description: "用半開區間驗證連續查詢，回顧時間值、顯示時區和 Apply 事件各自要測的契約。"
pubDate: 2026-11-26
category: Data & Visualization
tags: ["React", "TypeScript", "Timezone"]
series: datetime
seriesOrder: 4
references:
  - title: React DateTime Range Picker 的範圍契約
    url: https://github.com/ntustRay/react-datetime-range-picker#range-contract
  - title: Picker Demo 的 E2E 測試
    url: https://github.com/ntustRay/react-datetime-range-picker/blob/cefadde623e4260ae1235363ae501da7d57c7cec/e2e/demo.spec.ts
---

把 Picker 接到圖表之後，最先驗證兩筆相鄰的區間。以 UTC 09:00 到 10:00、10:00 到 11:00 為例，10:00 整的事件只應出現在第二段。條件寫成 `start <= timestamp && timestamp < end`，就是包含開始、排除結束的半開區間 `[start, end)`。若兩段都把結束算進去，10:00 會出現兩次。

以下用毫秒欄位查詢。若資料庫用 `timestamptz`，在綁定參數時把毫秒值轉成時間型別，仍保留相同的不等式。

```sql
SELECT event_id, timestamp_ms
FROM events
WHERE timestamp_ms >= $1
  AND timestamp_ms < $2
ORDER BY timestamp_ms, event_id;
```

## 先固定資料，再切換畫面時區

測試資料放在 09:59:59.999、10:00:00.000 和 10:00:00.001。第一段只應回傳 09:59:59.999，第二段應回傳另外兩筆。在瀏覽器把顯示時區從 UTC 改成 Asia/Taipei，重新套用同一組 instants，API 參數和查詢結果也應相同。這個測試能拆開兩類問題：畫面顯示的時刻不對，或者實際送到 API 的查詢值變了。

再編輯一次開始時間，先別 Apply。Draft 可以改，網路面板應看不到因這次操作發出的圖表請求。按下 Apply 後再核對 request 裡兩個數字。若查詢允許連按兩次 Apply，各請求還要處理回應次序，避免較舊的結果晚回來覆蓋畫面。

## 把夏令時間和查詢邊界分開測

兩個紐約本地時間都寫成 `2024/11/03 01:30:00`，但一個是 `UTC−04:00`，一個是 `UTC−05:00`。若 UI 讓人選了 offset，測試要讀回精確的 UTC instant；碰到春天跳過的時刻，則要確認錯誤顯示後沒帶著上一個合法值誤送查詢。

epoch 毫秒適合事件、Log 和圖表區間，前提是兩端統一單位和邊界規則。若需求是「每個工作日台北時間 09:00」這種當地排程，就要在排程設計保留時區與本地時間，等計算某一次執行時才轉成 instant。這兩種資料即使共用同一套顯示元件，後端保存的資訊也有不同責任。
