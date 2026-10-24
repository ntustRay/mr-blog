---
title: "[Insight] SEO、AEO、GEO 差在哪？技術部落格該先做什麼？"
description: "從被搜尋到、問題被回答，到成為生成式回覆的引用來源，拆解 SEO、AEO、GEO 的重疊與差異，整理技術部落格可實作的優先順序及驗證方式。"
pubDate: 2026-10-24
category: Web Development
tags: [SEO, AEO, GEO, Blog]
draft: false
relatedPostIds:
  - aeo-answer-engine-optimization-guide
  - geo-generative-engine-optimization-guide
  - blog-seo-release-checklist-ai-review
references:
  - title: "GEO 研究作者：Generative Engine Optimization"
    url: "https://github.com/GEO-optim/GEO"
  - title: "Google：Robots.txt Parser and Matcher Library"
    url: "https://github.com/google/robotstxt"
  - title: "GoogleChrome：Lighthouse Scores"
    url: "https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md"
---

技術部落格要改善 SEO、AEO 和 GEO，可以先問三個問題：**讀者找得到這篇文章嗎？文章能直接回答他的問題嗎？生成式服務採用內容時，能正確指出來源與適用條件嗎？**

這三個問題對應不同的觀察重點，也共用很多工作。對維護資源有限的部落格，合理順序是先確保頁面能被取得、網址與內容一致，再改善答案與證據的品質，最後觀察搜尋和 AI 服務實際如何呈現內容。

## 這篇的重點

- SEO 關注搜尋中的可見性；AEO 關注內容如何回答具體問題；GEO 關注內容在生成式回覆中如何被採用與歸屬來源。
- 三者可以作用在同一篇文章。清楚的問題、可讀的 HTML、穩定網址與可靠證據，都值得優先維護。
- 建置、結構化資料與 Lighthouse 只能驗證一部分技術條件。實際收錄、答案呈現、引用與流量需要另外觀察。

## 三個名詞，分別在優化什麼？

SEO 是 Search Engine Optimization，關注網站在搜尋中的發現與呈現。對工程團隊而言，工作包含可取得的頁面、正確網址、內容描述、站內連結與閱讀體驗；成效則要回到搜尋曝光、查詢、點擊，以及讀者進站後是否完成需要的事。

AEO 是 Answer Engine Optimization，常用來描述「讓內容適合回答問題」的工作。這個詞涵蓋的介面可能包括搜尋中的直接答案或對話式問答；本文用它來檢查答案是否完整、清楚、有上下文。寫成問句標題只是起點，讀者還需要知道答案適用在哪個環境、有哪些例外，以及怎麼確認。

GEO 是 Generative Engine Optimization。[GEO 研究作者的專案](https://github.com/GEO-optim/GEO)把問題放在生成式搜尋回覆中的來源可見性：服務可能整理多個來源後產生答案，內容作者需要關心自己的資料有沒有被採用，以及如何呈現。這個研究方向不能直接換算成某個現行產品的排名規則或本站可獲得的引用增幅。

這裡的 SEO／AEO／GEO 是實務上的分工方式。不同文章或服務可能把 AEO 和 GEO 的範圍畫得不一樣，選工具前仍要先定義目標介面與要觀察的結果。

| 面向 | SEO | AEO | GEO |
| --- | --- | --- | --- |
| 主要問題 | 這篇內容能否在相關搜尋中被找到？ | 這段內容能否完整回答問題？ | 生成式回覆如何採用並標示這個來源？ |
| 內容工作 | 主題、標題、描述、內部連結與讀者需求一致 | 直接答案、適用條件、例外與驗證步驟 | 可追溯的主張、原始資料、方法與引用上下文 |
| 技術工作 | 可取得的 HTML、canonical、Sitemap、閱讀體驗 | 清楚的標題層級，答案在頁面中可直接閱讀 | 穩定來源 URL、可識別作者，以及可取得的證據 |
| 可觀察結果 | 曝光、點擊、查詢與進站後行為 | 目標問題的答案呈現及內容正確性 | 引用 URL、引述是否正確、實際推薦流量 |
| 單項檢查的限制 | HTTP 200 不代表已收錄 | 寫了答案不代表會被選用 | 出現品牌名稱不代表引用本站 |

## 用同一篇 Astro 搜尋教學看差別

假設要寫一篇「為什麼 Astro 開發環境沒有 Pagefind 搜尋結果？」。

SEO 的工作，是讓標題、描述和實際問題對得上，並讓文章能從相關教學、分類與站內連結找到。正式網址應能取得完整內容，canonical 和 Sitemap 也要指向同一個 URL。

AEO 的工作，是把關鍵答案放在讀者需要的位置。例如在採用建置後索引的專案中，先交代「索引由 build 產生，應用建置後的 preview 驗證搜尋」，再提供對應指令和例外。若只寫「請重新 build」，讀者仍不知道索引在哪裡產生，也無法判斷自己的專案是否適用。

GEO 的工作，則是讓這個答案被引用時仍保留必要條件。文章可以列出實際工具版本、建置流程、相關文件，以及排查結果；如果只適用某種整合方式，就把限制寫在結論附近。這些內容能增加讀者查核的依據，是否影響某個 AI 服務的採用仍需觀察。

三種工作最後都回到同一篇有用的教學。沒有必要為了三個縮寫製作三份近乎相同的頁面，讓讀者分不清該看哪一份。

## 工程時間有限時，先處理哪一層？

先排除會讓後續工作失去基礎的問題：文章回傳錯誤狀態、主要內容無法取得、錯誤的 canonical、站內斷鏈，或部署路徑遺漏。Crawler 存取規則也要依實際部署確認；[Google 公開的 robots.txt parser](https://github.com/google/robotstxt)處理的是自動化客戶端對 URL 的存取規則，允許取得內容和已被搜尋服務收錄是不同狀態。

接著挑一篇真的有人需要的文章，檢查標題的問題是否在前幾段得到回答。把適用條件、失敗情境、可重現步驟與來源補完整，比批次加入一套新名詞更容易驗收。作者與更新日期也應能在頁面上閱讀，結構化資料則對應同一份可見內容。

最後才建立觀測。SEO 可以從站長工具的曝光與點擊切入；AEO／GEO 可先選固定問題，記錄服務、日期、語言或地區、回覆內容和完整引用 URL。品牌被提及、本站 URL 被連結、有人點進來，應分開計數。即使同一個問題多次出現本站，也只能描述該組查詢與測試條件，還不足以證明某次改版造成成長。

## 怎麼驗收，才不會把工具分數當成成效？

把驗收拆成兩份記錄會比較清楚。一份是網站可直接控制的項目：正式頁面、HTML 內容、標題、canonical、連結、作者和來源一致性。另一份是服務實際產生的結果：是否收錄、哪些查詢有曝光、答案引用了哪個 URL，以及引用是否忠於原文。

Lighthouse 適合做自動化基礎檢查，但它的 SEO 分數不包含所有搜尋條件。[官方計分文件](https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md)也把 Structured Data 列為不計分的人工檢查項目。因此，分數通過後仍應另外檢查 JSON-LD 和正式網站，更不能用分數推估 AI 引用機率。

要開始動手，可以先用既有的 [Blog SEO Checklist](../blog-seo-release-checklist-ai-review/)確認部署與索引條件，再用 [AEO 實作指南](../aeo-answer-engine-optimization-guide/)整理一篇答案，或用 [GEO 實作指南](../geo-generative-engine-optimization-guide/)建立來源與觀測記錄。這個順序的價值在於每一步都有具體產物，也能分辨下一個問題究竟出在網站、內容，還是尚待觀察的服務選擇。
