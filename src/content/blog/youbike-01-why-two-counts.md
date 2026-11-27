---
title: "[Insight] 做一張 YouBike 地圖，先搞懂一個站的兩個數字"
description: "從政府 JSON 到 Leaflet 地圖，先決定借還數、缺值與更新時間各自代表什麼。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Data & Visualization
series: youbike
seriesOrder: 1
tags: [YouBike, Leaflet, Open Data]
references:
  - title: "臺北市資料大平臺的資料網址與欄位定義"
    url: https://data.taipei/dataset/detail?id=c6bc8aed-557d-41d5-bfb1-8da24f78f2fb
  - title: "Leaflet 地圖初始化、圖層與標記"
    url: https://leafletjs.com/reference-1.9.4.html
  - title: "台北 YouBike 公開版架構"
    url: https://youbike-map-ixxc.vercel.app/docs/architecture.md
---

臺北市政府站有 20 輛可借、33 個空位可還。兩個數字同時出現在地圖上，準備出發的人和快到站的人各看一個。把同一個站畫成一個綠點，兩種情境就很難分辨。

![公開版的臺北市政府站，地圖標記顯示可借與可還數，清單保留站點時間。](../../assets/project-series/youbike/nearby.webp)

圖中數值屬於截圖當下。這個系列會從空資料夾寫出自己的信義區小地圖，先用兩筆固定資料釐清三件容易弄錯的事，再換成即時來源。

| 收到什麼 | 畫面該怎麼說 | 原因 |
| --- | --- | --- |
| `available_rent_bikes: 0` | 可借 0 | 站點真的沒有可借車輛 |
| 還車欄位沒有值 | 可還 — | 缺值不能證明空位已滿 |
| `infoTime` 與按更新的時間不同 | 保留站點回報時間 | 瀏覽器剛拿到的回應也可能包含舊資料 |

資料分成兩條路。瀏覽器向市府的 JSON 取站名、數量與座標，再把座標交給 Leaflet。底圖則來自 OpenStreetMap 的圖磚。站點清單正常、地圖只剩空白方格時，可以分別檢查這兩種 Network 請求。

第二篇會完成可獨立執行的清單和失敗提示；第三篇替相同資料加上地圖，部署到自己的 Vercel 網址。這個練習只顯示最新狀態，用靜態檔案便能完成。要回答「昨天早上八點有幾台車」，才需要定時收集歷史資料與資料庫。
