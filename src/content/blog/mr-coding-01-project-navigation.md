---
title: "[Insight] 用兩篇 Markdown 做一個能上線的 Astro 系列"
description: "拆開文章網址、章節順序與部署路徑，規劃下一篇要從空目錄做出的技術部落格。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: "Web Publishing & SEO"
tags: ["Astro","Markdown","GitHub Pages"]
series: mr-coding
seriesOrder: 1
references:
  - title: "MR Coding 的系列路由"
    url: "https://github.com/ntustRay/mr-blog/blob/main/src/pages/series/%5Bseries%5D.astro"
  - title: "系列排序與上下篇"
    url: "https://github.com/ntustRay/mr-blog/blob/main/src/utils/series.ts"
  - title: "MR Coding 的 Pages workflow"
    url: "https://github.com/ntustRay/mr-blog/blob/main/.github/workflows/deploy.yml"
---

同一門課先寫「部署」，隔天才補「本機開發」。如果用發文日期排，讀者第一步就得部署一個手上還沒有的應用。MR Coding 把網址交給檔名，把閱讀順序交給 Markdown 的 `seriesOrder`。之後移動章節，原本分享出去的文章連結也能保留。

![MR Coding 現有 Framecheck 系列頁，篇號和文章標題分開顯示。](../../assets/project-series/mr-coding/framecheck-series.webp)

下一篇會從空目錄做一個只有兩章的小站。驗收時，首頁先列「在本機預覽」，再列「發到 GitHub Pages」。點任一章會打開自己的 HTML。把同一份原始碼推到自己的 GitHub repository 後，別人也能開這兩個網址。

| 要決定的事 | 在練習裡放哪裡 | 改了會影響什麼 |
| --- | --- | --- |
| 哪一篇先讀 | Markdown 的 `seriesOrder` | 首頁順序 |
| 文章網址 | Markdown 檔名 | 外部書籤與既有連結 |
| 網站掛在哪裡 | Astro 的 `base` | GitHub Pages 專案網站底下的所有內部路徑 |

正式站在建置時才讀文章。Astro 把內容和路徑寫成檔案，GitHub Pages 負責送出 HTML。搜尋另有一道工序，Pagefind 讀取建置結果並產生索引。練習先做完文章到公開網址這條路，好讓第一次發生 404 時，能分清楚是文章沒產生，還是連結漏了專案前綴。
