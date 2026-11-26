---
title: '[Insight] Framecheck 做完後，圖片比對工具還要驗收什麼？'
description: 從差異可信、操作順暢與跨帳號存取三個方向驗收圖片比對工具，說明何時要再做批次 CLI 或分享。
pubDate: 2026-11-26
category: 'Dev Tools & Quality'
series: visual-regression
seriesOrder: 8
tags: [Visual Regression, pixelmatch, Web Worker, Supabase]
relatedPostIds: [visual-regression-project-intro, visual-regression-05-web-worker, visual-regression-06-correctness-and-access]
references:
  - title: Framecheck 公開 Demo
    url: https://visual-regression-hub.vercel.app/demo
  - title: Framecheck 架構說明
    url: https://visual-regression-hub.vercel.app/source
  - title: MDN Transferable objects
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
---

把兩張圖交給工具之後，審核者要能回答「差在哪裡？」、「為什麼判成有差？」和「結果可以交給誰看？」。教學把像素比對做成可驗證的流程，也讓圖片歷史記錄能以私人帳號存取。要把它拿來交付多人審核，還有獨立的權限與結果生命週期要驗。

![本機教學實際畫面，選兩張相同圖片後顯示零個變動像素。](../../assets/visual-regression-series/local/04-identical-images.webp)

| 要驗收的事 | 觀察的結果 |
| --- | --- |
| 比對沒有誤判 | 同一張圖的差異為零。已知變更區塊能在 Diff 找到。不同尺寸顯示錯誤，並能換圖恢復。 |
| Worker 搬移維持相同結果 | 固定圖片和容差，比對像素數與百分比一致。在 Performance 記錄中可追到計算移至 Worker。 |
| 私人結果不會跨帳號 | A 登入後可重開歷史，B 查不到 A 的結果。短效圖片連結到期後失效。 |

Worker 可以把重的計算移出 Main Thread，啟動與搬資料仍需時間和記憶體。這篇系列的結果也很適合拿來區分兩種問題。如果主要是滑動或點擊卡住，就看 Main Thread 的工作；如果大量圖片從讀檔到產出報告都太慢，就先分開量讀檔、解碼、Diff 與寫報告。單組畫面的測試覆蓋不到批次吞吐量。

同樣地，登入後才能看到私人圖片，還要再設計完整的分享。正式產品的可撤銷分享會牽涉連結權限和到期後的行為。要實作到自己的系統時，先定義撤銷後的新請求要怎麼判、已取得的短效 URL 幾時失效，以及清理失敗怎麼重試和留下紀錄。

回到[正式 Demo](https://visual-regression-hub.vercel.app/demo)，用分隔線與放大檢查同一個差異區塊。若要用程式驗收，下載[獨立教學範例](../../downloads/visual-regression-series.zip)，從[正確性與權限的步驟](../visual-regression-06-correctness-and-access/)逐項檢查。
