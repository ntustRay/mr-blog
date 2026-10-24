---
title: "[Guide] GEO 怎麼做？讓技術文章成為 AI 搜尋可查證的來源"
description: "用實作驗收表、WebP 來源範例與引用量測表，整理 GEO 的內容證據、作者、抓取與結構化資料工作，並區分能驗證的改善與 AI 引用限制。"
pubDate: 2026-10-24
category: Web Development
tags:
  - SEO
  - GEO
  - Blog
draft: false
relatedPostIds:
  - aeo-answer-engine-optimization-guide
  - seo-vs-aeo-vs-geo
  - blog-seo-release-checklist-ai-review
references:
  - title: "GEO 研究作者專案 — Generative Engine Optimization 與 GEO-BENCH"
    url: "https://github.com/GEO-optim/GEO"
  - title: "Google — Robots.txt Parser and Matcher Library"
    url: "https://github.com/google/robotstxt"
  - title: "Jeremy Howard — The llms.txt file proposal（原始文件）"
    url: "https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd"
  - title: "MR Blog — WebP OG 圖片端點的來源程式"
    url: "https://github.com/ntustRay/mr-blog/blob/3bc18af4b516409c0d538d22805d4462c8d8f846/src/pages/og/%5Bid%5D.webp.ts"
  - title: "Google Search Central — AI features and your website"
    url: "https://developers.google.com/search/docs/appearance/ai-features"
---

GEO（Generative Engine Optimization）關心內容在生成式搜尋回答中的來源可見度。以下三張表整理技術部落格的實作、證據與觀察方法；可取得、可查證是能驗收的改善，被 AI 引用仍需另行量測。[研究定義](https://github.com/GEO-optim/GEO)不等於商用產品的成效保證。

## GEO 實作表：先完成哪些工作？

<div class="table-scroll" role="region" aria-label="GEO 實作與驗收表" tabindex="0">

| 工作 | 具體動作 | 交付與驗收 | 限制與優先序 |
| --- | --- | --- | --- |
| 鎖定問題 | 選一個讀者會實際提出的工程問題 | 標題、開頭與正文回答同一題 | 先做；避免大量同義問句頁 |
| 原創材料 | 提供範例、程式碼、測試方法或有條件的判斷 | 讀者能重做檢查，或追到原始資料 | 沒實測就標明文件／程式碼分析 |
| 結論與條件 | 把版本、適用環境、限制放在結論附近 | 單獨讀這一段，仍知道何時適用 | 避免截取後只剩無條件建議 |
| 來源證據 | 關鍵主張旁連到官方文件、原始研究或程式碼 | 每個數字與版本行為有對應依據 | 研究 benchmark 不代表今日產品效果 |
| 作者與日期 | 提供作者連結、發布日與實質更新日 | 正文、About 與 metadata 一致 | 部署日期不等於內容更新日 |
| 正式 HTML | 排除登入、錯誤狀態碼與正文缺漏 | 正式 URL 回傳預期文章，原始 HTML 有正文 | 本機 build 成功不足以代替正式檢查 |
| 發現與索引 | 排除誤設 `noindex`，對齊站內連結、canonical 與 Sitemap | 正式網址、`/mr-blog/` 與文章路徑一致 | 可取得不等於已索引；需另查索引狀態 |
| Google AI 來源資格 | 成為 AI Overviews／AI Mode 的支援連結，頁面需已索引且有資格顯示摘要 | 使用 Search Console 檢查目標頁面 | [官方條件](https://developers.google.com/search/docs/appearance/ai-features)沒有額外技術要求；符合條件仍不保證呈現 |
| 抓取規則 | 確認服務規則與自己能控制的 host／路徑 | 檢查 host 根目錄的 `robots.txt` 與正式回應 | `/mr-blog/robots.txt` 不能代替根目錄規則；搜尋與訓練權限分開確認 |
| 結構化資料 | 用 `BlogPosting` 描述實際作者、日期與文章 | JSON-LD 可解析，且與可見頁面一致 | [Google AI 搜尋](https://developers.google.com/search/docs/appearance/ai-features)不要求專用 schema 或額外 AI 檔案 |
| `llms.txt`（選做） | 用精簡導覽連到重要文件，保持連結更新 | 檔案可讀、連結有效，能觀察工具是否採用 | [提案](https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd)允許子路徑；不是存取控制，也不保證引用 |

</div>

## 來源段落範例：分享圖回傳 200 就夠了嗎？

<div class="table-scroll" role="region" aria-label="GEO 可查證來源段落範例" tabindex="0">

| 元素 | 資訊不足的寫法 | 可以回查的寫法 |
| --- | --- | --- |
| 判斷與條件 | 圖片網址能開就好了 | 預期輸出 WebP 時，200 只證明這次請求成功；還要核對 Content-Type、實際格式／尺寸，以及 `og:image` 指向的檔案 |
| 證據與驗證 | 已經優化圖片 | [此專案端點](https://github.com/ntustRay/mr-blog/blob/3bc18af4b516409c0d538d22805d4462c8d8f846/src/pages/og/%5Bid%5D.webp.ts)呼叫 sharp 的 `webp()` 並設定 `image/webp`；發布後取得正式圖片，查回應標頭，再用影像解析器確認檔案 |

</div>

## GEO 觀察表：引用、提及與流量怎麼分？

<div class="table-scroll" role="region" aria-label="GEO 指標定義與量測限制" tabindex="0">

| 觀察項目 | 定義／記錄方式 | 要保留的證據 | 判讀限制 |
| --- | --- | --- | --- |
| 本文量測口徑 | 下列比率是本文的樣本觀察定義，非官方通用指標 | 有效回答：預設模式下成功回應，包含沒有引用的回答 | 技術失敗另列；不能因未引用就剔除回答 |
| 測試條件 | 固定問題原句、產品、可見版本／模式與語言，重複觀察 | 日期、完整問題、回答與是否啟用搜尋 | 不把換問法或換產品後的結果混成同一組 |
| 品牌提及率 | 提到網站／作者的回答數 ÷ 該組有效回答數 | 提及文字與完整上下文 | 提到名字不等於採用了文章 |
| 可點擊引用率 | 帶有本站來源連結的回答數 ÷ 該組有效回答數 | 回答、引用 URL 與目標文章 | 連到首頁、文章或無關頁面應分開記錄 |
| 引用正確性 | 逐筆核對被引用段落是否支持相鄰主張 | 原文、回答中的說法與遺失的限制 | 沒有引用就無從判斷；格式正確也可能曲解內容 |
| 實際導流 | 查看能辨識來源的造訪與落地頁 | 分析工具或伺服器可取得的紀錄 | 來源資料可能缺漏，引用次數不能直接換算造訪 |
| Google 搜尋成效 | Search Console 的 Web 曝光、點擊與頁面變化 | 相同期間、查詢與頁面的報表 | [Google AI 功能併入 Web](https://developers.google.com/search/docs/appearance/ai-features)，不能把一般變化都歸因於 GEO |
| 修改前後差異 | 保留修改內容與時間，再比較同條件觀察 | 基準資料、更新紀錄與多次結果 | 少量樣本無法排除產品更新、檢索變化或其他來源的影響 |

</div>

延伸：[AEO 實作指南](../aeo-answer-engine-optimization-guide/)、[SEO／AEO／GEO 差別](../seo-vs-aeo-vs-geo/)、[SEO 上線驗收](../blog-seo-release-checklist-ai-review/)。
