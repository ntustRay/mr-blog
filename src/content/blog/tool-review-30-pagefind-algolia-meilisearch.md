---
title: "[Review] Pagefind、Algolia、Meilisearch：網站搜尋怎麼選"
description: "搜尋要先分辨 Build-time Static Index 與 Server Search Service。資料是否公開、更新頻率、全文檢索品質、索引大小和維運責任，會決定方案。"
pubDate: 2026-11-03
category: "Web Publishing & SEO"
series: tech-stack-comparisons
seriesOrder: 30
tags:
  - "Pagefind"
  - "Search"
  - "Astro"
  - "SEO"
draft: false
references:
  - title: "Pagefind Repository"
    url: "https://github.com/Pagefind/pagefind"
  - title: "Algolia JS Client Repository"
    url: "https://github.com/algolia/algoliasearch-client-javascript"
  - title: "Meilisearch Repository"
    url: "https://github.com/meilisearch/meilisearch"
  - title: "Pagefind Docs"
    url: "https://pagefind.app/"
  - title: "Algolia Docs"
    url: "https://www.algolia.com/doc/"
  - title: "Meilisearch Docs"
    url: "https://www.meilisearch.com/docs"
---

搜尋要先分辨 Build-time Static Index 與 Server Search Service。資料是否公開、更新頻率、全文檢索品質、索引大小和維運責任，會決定方案。

## 我的選型結論

Blog/Docs 的 HTML 已在 Build 時產生，可先用 Pagefind 做靜態搜尋；需要即時更新、進階排名與雲端服務可比較 Algolia；要自架全文檢索服務可評估 Meilisearch。

## 比較表

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Pagefind](https://github.com/Pagefind/pagefind) | 5,546 | 產生靜態 Index、免 Server 運作 | 每次改內容需 Build，Index/Filtering 有邊界 | Blog、Docs |
| [Algolia JS Client](https://github.com/algolia/algoliasearch-client-javascript) | 1,385 | 托管搜尋、索引和排名工具 | 費用、請求與第三方服務依賴 | Hosted Search |
| [Meilisearch](https://github.com/meilisearch/meilisearch) | 59,760 | 自架搜尋引擎、可控索引 | 需要 Server、更新與監控 | 動態資料搜尋 |

*Stars 依 2026-11-03 官方公開 Repository 的快照；不同 Platform/SDK/CLI/概念不具直接可比性，「—」表示無合適的獨立 Repository。Stars 不能證明效能、採用率或品質。列入候選不等於作者實際使用。*

## Trade-offs

- 這張 Stars 對應 Pagefind Repo、Algolia JS Client 與 Meilisearch Server，不是同層級產品或市場份額比較。
- Static Search 能省 Request-time Service，但索引更新跟著 Build；內容很大時需量 Initial JS、Index Chunk 與查詢延遲。
- Hosted Search 要處理 Public/Private Index、Credential Scoping、Synonyms、Ranking 與成本上限。

## 可公開的實際案例

[mr-blog](https://github.com/ntustRay/mr-blog) 的 Build 指令含 Pagefind，因此此文可用公開的 Blog Pipeline 示範靜態 Index；並不代表有自行實測 Algolia/Meilisearch。

## 實作或遷移前驗收

1. 用 100、1k、10k 篇文章建立相同 searchable fields。
2. 測中英文、大小寫、Tag Filter、同義詞與排序。
3. 量 Index Build、下載 bytes、P95 Search、公開內容權限。

## 何時不要採用

若只是少量文件，瀏覽器原生搜尋或簡單索引可能足夠；若要求會員私人資料，靜態 Pagefind 不可直接索引不應公開的內容。

本文依官方文件與公開 Repository 的可驗證資訊整理，沒有聲稱完成各種工具的等條件 Benchmark；版本、平台與負載條件不同時需重新評估。
