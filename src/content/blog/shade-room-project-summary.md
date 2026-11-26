---
title: '[Insight] Shade Lab 做完後，怎麼分辨試妝效果和追蹤問題？'
description: 用同一張照片拆開定位、渲染與匯出的驗收，再說明相機、裝置相容性與色彩校準各需要哪些證據。
pubDate: 2026-11-26
category: 'Frontend'
series: shade-lab
seriesOrder: 7
tags: [MediaPipe, WebGL, Web Worker, Playwright]
relatedPostIds: [shade-room-01-architecture, shade-room-04-webgl-lipstick, shade-room-06-testing-deploy]
references:
  - title: Shade Lab Demo
    url: https://shade-room.vercel.app/
  - title: MediaPipe Face Landmarker Web
    url: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
  - title: MDN getUserMedia
    url: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
---

試妝頁面遇到「口紅沒有畫在嘴唇上」，可以用一張靜態照片先拆成兩個問題。遮罩輪廓有沒有跟著嘴唇？如果輪廓正確，改濃度時顏色有沒有只在遮罩裡變？這比在相機模式同時調顏色、光線和人臉角度更容易定位問題。

<figure>
  <a href="../../images/shade-room-series/05-compare.webp"><img src="../../images/shade-room-series/05-compare.webp" alt="Shade Lab 實際 A/B 比較介面，同一張臉在分隔線兩側呈現原圖和試妝結果。" loading="lazy" decoding="async" /></a>
  <figcaption>用同一張範例照拉動 A/B 分隔線，可以直接比較變色範圍。</figcaption>
</figure>

## 完成版可以這樣驗收

1. 開啟 [Shade Lab](https://shade-room.vercel.app/)，用一張能清楚看到嘴唇的照片或內建範例開始。先固定縮放，選一個容易辨認的唇色。
2. 拉動比較線，檢查改色是否留在唇部，並觀察嘴巴張開時中間的開口。若位置偏移，回到[定位](../shade-room-03-face-worker/)和[遮罩](../shade-room-04-webgl-lipstick/)的步驟分開看。
3. 將濃度移到零，比較區兩側應回到同一張原圖。恢復濃度後下載 PNG，確認匯出呈現完整妝效，畫面上的分隔線仍留在操作介面。
4. 照片穩定後再進相機。拿實機走一遍允許、拒絕、離開頁面和返回流程，再另外驗收低光源與臉離開畫面的情況。

## 為什麼分開量

目前用 Worker 做臉部定位，WebGL 負責合成。色號、質地和濃度都是渲染設定，改這些值可以重用同一張照片的座標。相機則需要處理排隊的影格和舊回應。即使桌面截圖的妝效正確，還是要在實機驗證定位延遲、鏡頭切換、螢幕旋轉和權限。

如果需求是比較輸出效果，固定範例照、對照濃度零與有妝版本，就能把座標和混色問題逐步拆開。如果要拿畫面預測實體商品上臉的色彩，還得處理光源、相機白平衡、螢幕和商品色彩校準。目前的妝效適合探索搭配，實體色彩仍需要另外驗證。

[回 Shade Lab 系列](../../series/shade-lab/) · [測試與部署](../shade-room-06-testing-deploy/)
