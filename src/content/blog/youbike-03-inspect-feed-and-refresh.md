---
title: '[Guide] 查 YouBike 開放資料，驗證更新失敗會保留哪一份資料'
description: 用 Chrome DevTools 核對 JSON 欄位、模擬上游請求失敗，再驗證解除封鎖後的恢復流程。
pubDate: 2026-11-26
category: Data & Visualization
series: youbike
seriesOrder: 3
tags: [YouBike, Open Data, Chrome DevTools]
references:
  - title: 臺北市 YouBike 2.0 即時資訊
    url: https://data.taipei/dataset/detail?id=c6bc8aed-557d-41d5-bfb1-8da24f78f2fb
  - title: 台北 YouBike 地圖設計筆記
    url: https://youbike-map-ixxc.vercel.app/docs/architecture.md
  - title: Chrome DevTools Request Conditions
    url: https://developer.chrome.com/docs/devtools/request-conditions
---

用桌面 Chrome 開啟[台北 YouBike 地圖](https://youbike-map-ixxc.vercel.app/)，先確認地圖已經列出站點。接著只封鎖這個分頁讀取站點 JSON 的請求，測試更新失敗時地圖怎麼呈現。底圖仍可載入。

## 1. 對照畫面與回應值

1. 打開 DevTools，點「Network」，在 Filter 輸入 `youbike_immediate.json`。
2. 在地圖按「更新資料」，點剛出現的請求，再打開「Response」。用搜尋在回應裡找 `500112029`，這是臺北市政府站的 ID。
3. 回到地圖輸入 `臺北市政府`，點該站，對照三個欄位。

| JSON 欄位 | 畫面用途 |
| --- | --- |
| `available_rent_bikes` | 可借車輛數 |
| `available_return_bikes` | 可還空位數 |
| `infoTime` | 站點來源更新時間，可在 popup 查看 |

原始資料的 `sna` 會帶 `YouBike2.0_`；列表上顯示的是去掉前綴後的站名。兩個設備各自更新時，取得的回應可能時間不同，對照同一個分頁最近的一筆請求即可。

## 2. 只攔下站點 JSON

1. 在剛才的 Network 請求上按右鍵，選「Block request」。部分舊版選單顯示「Block request URL」。封鎖規則會出現在「Request conditions」，操作期間保持 DevTools 開啟。
2. 保留目前分頁，按地圖頁尾「更新資料」。在 Network 確認剛才的請求被封鎖。列表及原本選中的站點仍可看，頁尾會出現「更新失敗，保留上次資料；數量可能已變動」。
3. 取消勾選或刪除該規則，再按「更新資料」。成功時警示會消失。站點數字也可能與上一筆相同，可以用 Network 回應成功及頁尾的取得時間確認更新。

![封鎖站點資料請求後，臺北市政府站仍顯示前一次借還數量，頁尾改為更新失敗警示。](../../assets/project-series/youbike/offline.webp)

正式站操作截圖。只攔截當次站點資料請求，既有站點資料與底圖都留在畫面上。

如果封鎖後直接重整，這一頁就沒有載入成功的快照可以保留，頁尾會提示無法取得資料。測完記得移除封鎖規則，重試一次正常更新。
