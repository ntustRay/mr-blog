---
title: '[Insight] MR Financial 為什麼把財金日報放在另一個網站？'
description: '用技術教學和財金日報不同的閱讀順序，解釋兩站分流、同日雙版與共同導覽的取捨。'
pubDate: 2026-11-26
category: 'Web Publishing & SEO'
tags: [Astro, GitHub Pages, Content Architecture]
series: mr-financial
seriesOrder: 1
draft: false
references:
- title: MR Financial 正式站
  url: https://ntustray.github.io/mr-financial-blog/
- title: MR Financial 首頁的日期索引實作
  url: https://github.com/ntustRay/mr-financial-blog/blob/main/src/pages/index.astro
---

找一篇技術教學時，通常先找主題，再確認舊步驟是否還能用。讀財金日報時，日期得先對上，因為同一天的台灣收盤、海外交易與文章截點可能各有時間。兩種文章共用一份首頁時，日更的日報會往前排，教學系列也因此更難從最近文章找到。

MR Financial 把日報放在自己的首頁。右側的 **Daily editions** 依日期並列台灣與國際版。想查比較久以前的文章，可以開 **Archive**。要找房市或生活主題，從 **Topics** 進去。回 MR Coding 的入口保留在相同的網站導覽。

![MR Financial 正式站首頁，左側是 Latest posts，右側有 Topics 和 Daily editions。](../../assets/project-series/mr-financial/01-home.webp)

## 分站後，日期可以直接拿來找一組文章

在首頁實作裡，日報的文章 ID 形式是 `finance-YYYY-MM-DD-taiwan` 或 `finance-YYYY-MM-DD-global`。Astro 建置時從 ID 讀出日期與版別，讓一份日期表可以同時指向兩篇文章。一般文章繼續顯示在最近文章與分類入口。首頁原始碼在[專案的 index.astro](https://github.com/ntustRay/mr-financial-blog/blob/main/src/pages/index.astro)。

另外維護兩站會多一份導覽、部署和連結檢查。若只偶爾發布財金文章，在原站做分類就能提供入口。當台灣與國際版本固定成對出現，獨立首頁可以保留日報需要的日期索引，也讓技術站的首頁繼續以主題與系列為主。

下一篇用正式站一組歷史文章練習，從 Archive 找同一天的兩篇日報，再跟到文內的來源。
