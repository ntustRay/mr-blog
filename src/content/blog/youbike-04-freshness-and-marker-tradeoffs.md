---
title: '[Insight] YouBike 地圖做完後，怎麼處理 0、舊資料和重疊標記？'
description: 回看資料快照、站點時間與 Leaflet 可視範圍策略，從讀者的判斷整理下一輪可驗證的改進。
pubDate: 2026-11-26
category: System Design
series: youbike
seriesOrder: 4
tags: [YouBike, Leaflet, Open Data]
references:
  - title: 台北 YouBike 地圖架構與取捨
    url: https://youbike-map-ixxc.vercel.app/docs/architecture.md
  - title: Leaflet 1.9.4 API Reference
    url: https://leafletjs.com/reference-1.9.4.html
  - title: OpenStreetMap Tile Usage Policy
    url: https://operations.osmfoundation.org/policies/tiles/
---

找到一個可還空位大於 0 的站後，還要知道站點資料有多新，以及附近有沒有第二個選擇。台北 YouBike 用 popup 補上單站時間，更新斷線時保留當前快照，同時在頁尾提醒舊資料。兩個訊號放在不同位置，能分開描述「這一站更新慢」和「這一輪整份資料更新失敗」。

| 畫面訊號 | 這次可以判斷什麼 |
| --- | --- |
| 可借 `0` 或可還 `0` | 該站這筆資料中的對應數量為零 |
| `—` | 來源沒有提供可用的數量 |
| 暫停營運 | 這個站目前不列為可借還的選項 |
| 更新時間需確認 | 單站時間已過顯示門檻，或時間不符合判斷條件 |
| 更新失敗，保留上次資料 | 這一輪沒有取得可用的快照，畫面沿用上一輪 |

設計文件記錄，頁面在前景每分鐘觸發更新，單站時間超過 5 分鐘會標成需確認。5 分鐘是 UI 判斷門檻；它跟使用者到站前，還有幾台車或空位，是不同的問題。日常使用可以先留主站及備用站，出發前看一次兩站的數量與時間。

## 可視範圍少畫一些 DOM，遠景仍需要取捨

產品用 Leaflet 畫站點。全部資料保留在記憶體，搜尋時仍可比對每站；地圖只替符合條件且在可視範圍內的站建立 marker，留在畫面上的站用同一個 ID 重用。這省下了視窗外的 DOM，第一個要驗證的是平移前後的 marker 數量與更新耗時。設計文件沒有正式壓測數字，因此無法由這套做法估算速度提升。

如果縮小到市中心時出現大量重疊，下一步可用同一份資料和固定縮放層級比較兩種做法：保留單站但避開相鄰標記，或在較遠層級改顯示站群。讀者只想找一個能還車的地址時，以能否順利找到符合需求的單站做驗收，比單看 marker 總數更貼近問題。

靜態網站直接讀公開資料，省下維護資料 API 的工作。要加入跨縣市資料、歷史查詢或穩定服務配額時，再拆資料代理與快取層，也要分開處理圖磚供應。地圖底圖和 YouBike 站點 JSON 有各自的來源，任一邊有問題都可能改變使用者看到的畫面。
