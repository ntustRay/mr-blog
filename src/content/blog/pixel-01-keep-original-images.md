---
title: '[Insight] Pixel Workbench 為什麼保留原圖，再把結果接到下一步'
description: 用透明貼紙、裁切和批次匯出解釋原圖、處理結果與輸出格式應該怎麼分開。
pubDate: 2026-11-26
category: Frontend
series: pixel
seriesOrder: 1
tags:
- Canvas
- Image Processing
- Web Workers
references:
- title: Pixel Workbench 正式站
  url: https://pixel-workbench-eta.vercel.app/
- title: MDN Canvas toBlob
  url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
---

一張貼紙要裁正方形，還要另出一張長版。假如第一次裁切就覆蓋原圖，長版需要的邊緣可能已經丟了。Pixel Workbench 將原圖留在清單裡，想修改設定時可以重跑，想沿用已經完成的外框時，才把處理結果加成另一個輸入。

![Pixel Workbench 並排顯示內建植物原圖與加上外框的貼紙](../../assets/project-series/pixel/02-compare.webp)

## 預覽、接續、匯出做的是三件事

| 操作 | 接下來會看到什麼 |
| --- | --- |
| 套用處理 | 用選取的圖片和目前設定重做預覽。 |
| 接續編輯 | 把剛做出的結果加入清單，原圖仍留在原位。 |
| 批次處理並下載 ZIP | 以目前工具和設定重新處理清單裡的每個檔案。 |

在加外框後想接著裁切時，第二步很有用。要把一堆已完成的照片統一變小時，則應先看清單有沒有混進來源或中間版本，因為批次處理會把它們一併匯出。

基本裁切、轉檔、沿用透明度做貼紙都能在瀏覽器內完成。人像去背等工具需要模型資產。影像留在裝置上省去處理後端，但大圖解碼和打包的記憶體仍由裝置負擔。先用站上的透明植物範例確認單張輸出，再把圖量加到兩張。

[下一篇：從透明貼紙到正方形裁切](../pixel-02-transparent-sticker/)
