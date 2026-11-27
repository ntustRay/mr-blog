---
title: '[Insight] 工程師選股網做完後，怎麼確認資料和權限都可信？'
description: 用行情日期、快照版本與跨帳號測試驗收選股網，說明靜態快照的適用條件與下一個擴充時機。
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: 'System Design'
series: engineer-stock
seriesOrder: 13
tags: [Next.js, GitHub Actions, Supabase, RLS]
relatedPostIds: [engineer-stock-project-intro, engineer-stock-07-rls, engineer-stock-11-actions-date-debug]
references:
  - title: 工程師選股網正式站
    url: https://engineer-stock-web.vercel.app/
  - title: 公開資料 Pipeline
    url: https://github.com/ntustRay/engineer-stock-data
  - title: Supabase Row Level Security
    url: https://supabase.com/docs/guides/database/postgres/row-level-security
---

選股網有三個不同的成功條件。首頁開得出來，代表網站有回應。搜尋與個股資料能對上同一快照，代表這次讀取的資料一致。帳號 A 看不到帳號 B 的追蹤清單，才證明會員資料隔離有發揮作用。這三件事要各自留下證據。

| 想驗收的結果 | 要留下的證據 |
| --- | --- |
| 正式行情確實刷新 | 工作流程結果、發布 SHA、快照 manifest 的 `asOfDate`。畫面上的行情日期也要跟著核對。 |
| 更新途中不混到兩版 | 同一次讀取使用同一版本的索引與個股檔。可以先在 fixture 上驗證，保留來源或快照讀取失敗時的結果。 |
| 追蹤清單只屬於同一人 | 用兩個測試帳號建立、讀取和移除資料。再從資料層檢查跨帳號寫入，避免只靠 UI 隱藏。 |

<figure>
  <a href="../../images/engineer-stock-series/10-publish-run.webp"><img src="../../images/engineer-stock-series/10-publish-run.webp" alt="公開資料 Pipeline 的 GitHub Actions 發布畫面。" loading="lazy" decoding="async" /></a>
  <figcaption>系列教學保留的公開發布紀錄。工作流程完成後，還要追到實際資料版本。</figcaption>
</figure>

## 怎麼使用這個架構

只要網站主要提供同一批公開行情的查閱，快照就能同時服務首頁、篩選與個股。兩市場晚到時，可以先留住上一批完整資料，顯示它的真實日期，讓使用者知道正在看哪天的報價。[跨午夜的除錯紀錄](../engineer-stock-11-actions-date-debug/)留有一個具體例子。排程原本定在晚上，執行延到隔天清晨後，必須用來源行情日期判斷該發哪一天。

快照有重抓與解碼的成本。若篩選變成頻繁重算、個股資料大量膨脹，或者要加入盤中更新，可以先量索引大小、解析時間與更新延遲，再決定是否把高頻查詢拆進資料庫或獨立服務。這樣能指出是哪個操作撐不住，也能留下改架構前後可比較的基準。

## 完成後去哪裡操作

打開[正式站](https://engineer-stock-web.vercel.app/)，找一檔股票，檢查清單和個股頁的日期。若要研究資料來源，從[公開 Pipeline 的 Workflow](../engineer-stock-10-workflow-api-sources/)回查一份快照，或下載[系列的程式片段與驗證紀錄](../../downloads/engineer-stock-series.zip)照著跑固定樣本。會員隔離的實作與測法放在[RLS 教學](../engineer-stock-07-rls/)。
