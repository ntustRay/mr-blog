---
title: "[Insight] 技術文章發布後，怎麼驗證讀者找得到？"
description: "用同一篇教學核對產品入口、章節順序、文章網址與 Pagefind 索引。"
pubDate: 2026-11-26
category: "Web Publishing & SEO"
tags: ["Astro", "GitHub Pages", "Pagefind"]
series: mr-coding
seriesOrder: 3
references:
  - title: "MR Coding"
    url: "https://ntustray.github.io/mr-blog/"
  - title: "MR Coding 原始碼"
    url: "https://github.com/ntustRay/mr-blog"
---

看得到一篇文章，跟能照順序走完系列是兩個驗收項目。加一篇教學後，可以從產品卡找到對應系列，先開介紹，再跟到該篇教學，最後用前後篇導覽確認沒有跳章。舊文章移進系列時保留原本網址，外部連結就能繼續進到同一篇內容。

在這個 Astro repo，`npm run check:taxonomy` 檢查文章分類、產品的系列對應與章節序號。接著跑 `npm run build`，產出 HTML、Pagefind 索引並檢查內部連結。部署後，還可以從 Search 查一個該篇特有的詞，驗證公開索引含有它。

如果文章已經可讀，搜尋還找不到，先區分部署的 HTML 和索引是不是同一次建置。若文章能搜尋到，Products 卻找不到它對應的系列，就檢查產品的 series ID 和文章的系列欄位。這樣找問題比重新發布整站更容易確認改到哪一層。
