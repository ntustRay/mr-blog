---
title: "[Insight] Pixel Workbench 做完後，哪些資料該留、哪些畫完就該放掉"
description: "用透明角落、ZIP 內實際像素和 Vercel 的靜態檔案回顧整條 pipeline，指出單張與批次各自的記憶體成本。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Frontend
series: pixel
seriesOrder: 4
tags:
- Canvas
- Image Processing
- Web Workers
references:
- title: Pixel Workbench 正式站
  url: https://pixel-workbench-eta.vercel.app/
- title: MDN OffscreenCanvas
  url: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- title: MDN ImageData
  url: https://developer.mozilla.org/en-US/docs/Web/API/ImageData/data
---

我們可以從 ZIP 開回最初的那個問題。兩張來源都能成功輸出 WebP，並不代表第一張的四個角還透明，也不代表第二張的白邊完整。上一課刻意解碼輸出的 Blob，正是為了把「檔案寫出去了」和「輸出的像素符合要求」分開驗。

![練習的原圖與貼紙，各自重新解碼後列出的尺寸和 MIME。](../../assets/project-series/pixel/03-webp-lab.webp)

| 留下什麼 | 什麼時候需要 | 對應程式 |
| --- | --- | --- |
| 原始 File 與預覽 URL | 改參數後從頭重算、回到原圖 | src/core/files.ts、src/ui/App.tsx |
| 當次工作設定 | 確保整批使用同一個 tool、尺寸與格式 | App.tsx 傳給 archiveResults 的 snapshot |
| 單張圖的像素與工作畫布 | 選工具、畫輪廓、縮圖、輸出 Blob | image.worker.ts、pipeline.ts、features/sticker.ts |
| 封裝完的 ZIP chunks | 產生最終可下載的 Blob | files.ts 的 archiveResults |

如果輸入是 4000 × 3000、以 8-bit RGBA 展開，單份像素約 48 MB（4000 × 3000 × 4 bytes）。原圖、輪廓與結果若同時存在，最高占用還會增加。Worker 讓主執行緒可繼續回應，逐張處理控制同時工作的數量；ZIP 最終仍會保留已編碼的內容直到下載。用兩張小圖跑出來的結果，無法推算手機整批大圖的峰值。

部署的責任也比較清楚了。Vercel 提供 `dist` 的 JavaScript、模型、WASM；真的圖片處理發生在使用者瀏覽器。當一般貼紙成功、只有人像工具出錯，先查模型資產；若本機與正式站都把透明角落變白，就回 pipeline 查輸出格式和畫布合成。這兩種故障需要的證據不同。

[回 Pixel Workbench 系列](../../series/pixel/)
