---
title: '[Insight] Framecheck 為什麼先把截圖比對做成一個工具？'
description: 從審查截圖改動的問題出發，拆開像素比對、互動檢視、私人儲存與結果交付的責任。
pubDate: 2026-11-26
category: 'Dev Tools & Quality'
series: visual-regression
seriesOrder: 1
tags: [Visual Regression, Next.js, pixelmatch, Web Worker]
relatedPostIds: [visual-regression-01-nextjs-bun-biome, visual-regression-05-web-worker, visual-regression-project-summary]
references:
  - title: Framecheck 公開 Demo
    url: https://visual-regression-hub.vercel.app/demo
  - title: Framecheck 架構說明
    url: https://visual-regression-hub.vercel.app/source
  - title: pixelmatch
    url: https://github.com/mapbox/pixelmatch
---

兩張截圖都能打開，還是常看不出哪裡變了。像素比對先標出差異，審核者才有辦法放大，看這是預期變更、字型渲染差異，還是意外改到了其他區塊。Framecheck 想解決的是從找到差異到審完結果的過程。

![本機教學實際比對畫面，並列 Before、After、差異圖與變動像素數。](../../assets/visual-regression-series/local/03-comparison-result.webp)

## 為什麼先做本機版

一組圖加上一個已知會變動的區塊，就能檢查 Before、After 與 Diff 是否對得起來。如果圖片尺寸不同，工具要指出讀入條件有誤。如果兩邊是同一張，差異應回到零。這些條件在瀏覽器內就能測，前面不用先接帳號、資料庫和部署。

比對結果要回來看或交給別人審，才會需要辨識誰有權讀圖、怎麼保存，以及連結什麼時候失效。把這些責任後移，能讓教學先穩住正確性，再處理跨帳號、儲存和效能問題。

## 教學做哪一段

[正式站的 Demo](https://visual-regression-hub.vercel.app/demo)可以先看同步縮放與不同檢視模式。本系列用可下載的獨立練習專案，從單組圖片開始做，再接 Vercel、Supabase、CI 和 Web Worker。正式產品的多人審核、可撤銷分享，以及舊資料清理，有另外的服務流程與驗收條件。

先到[本機原型](../visual-regression-01-nextjs-bun-biome/)用 Bun 和 Next.js 跑起第一個比對，或看[完整系列目錄](../../series/visual-regression/)。
