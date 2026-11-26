---
title: "[Insight] MR Coding 為什麼把專案和工程文章放在不同入口"
description: "用同一篇圖片比對文章說明時間、主題、產品和教學順序各自怎麼找。"
pubDate: 2026-11-26
category: "Web Publishing & SEO"
tags: ["Astro", "Markdown", "Pagefind"]
series: mr-coding
seriesOrder: 1
references:
  - title: "MR Coding"
    url: "https://ntustray.github.io/mr-blog/"
  - title: "MR Coding 原始碼"
    url: "https://github.com/ntustRay/mr-blog"
---

一個專案做了六篇文章，首頁按日期排時，它們可能分散在不同位置。過幾個月想把圖片比對工具重做一次，時間排序幫不上忙。Series 需要先知道哪一篇建立好本機環境、哪一篇才開始接儲存。要直接看成品時，Projects 的產品卡又需要讓讀者先找到 Demo。

MR Coding 的文章同時保存 Category、Tags 和系列順序。找同一種技術走 Topics 或 Search，要照順序完成一個專案走 Series。已經知道專案名稱時，Projects 可以直接進產品和配套教學。這幾種路徑共用文章網址，所以讀者把一篇連結分享出去後，站內重新整理順序也能沿用。

文章寫在 Markdown，Astro 依 frontmatter 產生索引和內頁。站內全文搜尋由 Pagefind 在建置時收錄。下一篇從 Framecheck 的產品卡開始走一次，分辨正式產品 Demo、教學文章和可下載範例各能做什麼。
