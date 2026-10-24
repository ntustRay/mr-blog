---
title: "[Guide] Blog SEO Checklist：上線前後要檢查什麼？AI 常漏掉哪些？"
description: "從網站架構、Sitemap、Canonical、文章內容到 Google Search Console 的可勾選 SEO 清單，另外整理 AI Agent 容易忽略的部署與索引驗證。"
pubDate: 2026-10-24
category: Blogging
tags:
  - SEO
  - Checklist
  - Astro
  - Blog
draft: false
relatedPostIds:
  - what-makes-a-good-blog
references:
  - title: "Google Search Central — SEO Starter Guide"
    url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide"
  - title: "Google — 建立並提交 Sitemap"
    url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-TW"
  - title: "Google — Search Console Sitemap 報表"
    url: "https://support.google.com/webmasters/answer/7451001?hl=zh-Hant"
  - title: "Google — Article Structured Data"
    url: "https://developers.google.com/search/docs/appearance/structured-data/article"
  - title: "Google — robots.txt 說明"
    url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro"
---

SEO 驗收可以照 **Build → Crawl → Content → Measure** 的順序執行。這份清單用在一般技術部落格；我的部落格使用 Astro + GitHub Pages，因此補上 Base Path 和部署驗證的注意事項。

<img src="../../images/seo-release-checklist.webp" alt="部落格 SEO 上線驗收流程圖：網站上線、搜尋引擎、文章品質、成效追蹤四階段，以及 AI 常漏驗的項目" width="1440" height="820" loading="lazy" decoding="async" />

## 一般 SEO Checklist

### 1. 網站上線與架構

工具：[Chrome DevTools](https://developer.chrome.com/docs/devtools/)、[PageSpeed Insights](https://pagespeed.web.dev/)。

- [ ] **HTTPS**：正式網站採 HTTPS，憑證有效。
- [ ] **HTTP Status**：首頁與文章頁回傳 `200`，沒有意外的 404 / 5xx。
- [ ] **URL Structure**：網址簡短、可讀，發布後盡量保持穩定。
- [ ] **Canonical URL**：每頁指向正確的偏好網址。
- [ ] **Mobile**：手機閱讀不會橫向溢出、遮住文章或難以操作。
- [ ] **Core Web Vitals**：檢查 LCP、INP、CLS，先修實測有問題的頁面。
- [ ] **JavaScript Rendering**：主要內容可被搜尋引擎取得。
- [ ] **Navigation**：重要文章可透過導覽、分類或站內連結找到。
- [ ] **404 / Redirect**：文章搬移時處理舊網址與失效連結。

**檢查畫面：** DevTools → Network 中正式文章的 Status、PageSpeed Insights 的 Mobile 結果。

### 2. 搜尋引擎檢索與索引設定

工具：[Google Search Console](https://search.google.com/search-console/)、View Page Source。

- [ ] **robots.txt**：沒有意外禁止檢索重要內容。
- [ ] **noindex**：希望收錄的頁面沒有被標記 `noindex`。
- [ ] **Sitemap**：XML Sitemap 可開啟，且格式正確。
- [ ] **Sitemap URL**：URL 包含完整 Domain 與 Base Path。
- [ ] **Sitemap Content**：不列入 404、Redirect 或明確 `noindex` 的頁面。
- [ ] **Canonical Consistency**：Sitemap、Canonical、站內連結使用一致的偏好網址。
- [ ] **Googlebot Access**：不受登入、權限、CDN 或伺服器規則意外阻擋。
- [ ] **Indexing Status**：透過 Search Console 區分「可索引」與「已索引」。

GitHub Pages 的專案網站可能部署在 `/repo-name/`。例如我的部落格位於 `https://ntustray.github.io/mr-blog/`，不能在 Sitemap 和 Canonical 中漏掉 `/mr-blog/`。

`robots.txt` 的有效位置是 Host 根目錄。放在 `/mr-blog/robots.txt` 的檔案不能取代 `https://ntustray.github.io/robots.txt`；也不能把 Disallow 當作 `noindex`。

**檢查畫面：** 開啟 `sitemap-index.xml`、`sitemap-0.xml`，確認 `<loc>` 都指向正式文章網址。

### 3. 文章內容與 Metadata

工具：View Page Source、[Rich Results Test](https://search.google.com/test/rich-results)。

- [ ] **Title**：每篇文章有獨立、清楚的標題。
- [ ] **Meta Description**：描述文章解決什麼問題，避免套用重複文案。
- [ ] **H1 / H2 / H3**：標題層級合理，方便讀者尋找段落。
- [ ] **Search Intent**：內文回答標題提出的問題。
- [ ] **Original Content**：有自己的分析、實作，或能追溯的研究與判斷。
- [ ] **Internal Links**：連向真正相關的文章，連結文字清楚。
- [ ] **References**：會變動的 API、版本、Benchmark 等主張附可靠來源。
- [ ] **Image Alt**：有意義的圖片提供描述，裝飾圖不必塞關鍵字。
- [ ] **Image Optimization**：合理壓縮圖片、設定尺寸，避免布局跳動。
- [ ] **Structured Data**：依內容使用 `BlogPosting`、`BreadcrumbList`，並驗證資料與頁面一致。
- [ ] **Dates**：`datePublished`、`dateModified` 反映真實發布與更新時間。
- [ ] **Category / Tags**：分類可用，避免自動產生大量沒有獨立價值的分類頁。
- [ ] **Content Freshness**：舊 API、過期版本、歷史數字標示適用條件。

**檢查畫面：** View Page Source 中的 Title、Description、Canonical，以及 Rich Results Test 的結果。Structured Data 不保證額外的搜尋呈現或排名。

### 4. Google Search Console 與成效追蹤

工具：[Google Search Console](https://search.google.com/search-console/)。

- [ ] **新增資源**：選對 Domain 或 URL-prefix，網址包含正確的路徑。
- [ ] **驗證所有權**：使用 HTML File、HTML Tag 或 DNS 驗證。
- [ ] **保留驗證方式**：部署後不要移除 HTML 驗證檔。
- [ ] **提交 Sitemap**：提交正確的 Sitemap Index 網址。
- [ ] **檢查處理狀態**：確認 Google 是否成功讀取，而不只是顯示「已提交」。
- [ ] **URL Inspection**：抽查首頁、最新文章與重要舊文。
- [ ] **Live Test**：檢查特定網址當下是否可取得，但不把它當成已收錄證明。
- [ ] **Page Indexing**：查看 Indexed / Not indexed 及其原因。
- [ ] **Performance**：觀察 Impressions、Clicks、CTR、Search Queries。
- [ ] **Core Web Vitals**：有真實使用者資料後，追蹤實際體驗問題。

**檢查畫面：** 「所有權驗證成功」、「Sitemap 狀態」、「網址審查」、「網頁索引」、「搜尋成效」。

Sitemap 提交只是提示，Google 不保證會立即下載、檢索或收錄。詳見 [Google 官方 Sitemap 文件](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-TW)。

## AI Agent 容易漏掉的 SEO Checklist

這份清單適合加進 Agent 的驗收條件。讓 AI 回報**實際檢查結果與證據**，不要只報「已修改完成」。

### 部署與路徑

- [ ] 只檢查了 `localhost`，沒有驗證正式網站？
- [ ] 忘記 GitHub Pages 的 `/repo-name/` Base Path？
- [ ] 只看 Astro 原始碼，沒有檢查 Build 後輸出的 HTML？
- [ ] 沒有確認 GitHub Actions / 部署流程真的成功？
- [ ] 只測 Desktop，沒看 Mobile 和圖片布局？
- [ ] 產生錯誤的 Canonical、OG Image 或靜態資源路徑？

### 檢索與索引

- [ ] 把「產生 Sitemap」當成「Google 已收錄」？
- [ ] 把 URL Inspection 的「即時測試成功」當成「已索引」？
- [ ] 忽略 `robots.txt` 應位於 Host 根目錄？
- [ ] 混淆 `robots.txt` 的 Disallow 和 `noindex`？
- [ ] 意外把文章加入 `noindex` 或 Sitemap 排除清單？
- [ ] 只檢查 Sitemap Index，沒有打開子 Sitemap？
- [ ] 一看到「無法擷取」就重寫設定，沒有先檢查 URL 與 HTTP Response？

### 文章品質

- [ ] 所有文章用了相同 Title 或 Description？
- [ ] 為了 SEO 塞入不自然的關鍵字？
- [ ] 生成與頁面內容不符的 FAQ / JSON-LD？
- [ ] 每次部署都把全部文章的 `dateModified` 改成今天？
- [ ] 沒有實際查證，就批次將舊文設成 `noindex` 或刪除？
- [ ] 搬移文章時，沒有保留舊 URL 的 Redirect 規劃？
- [ ] 把外部 Benchmark 誤寫成自己的實測結果？
- [ ] 忘記圖片 Alt、尺寸及第三方 Script 的載入成本？

### 驗證與交付

- [ ] 只回報 Lighthouse SEO 分數，沒有註明測試網址？
- [ ] `npm run build` 通過就宣布 SEO 全面完成？
- [ ] 只抽查首頁，沒有文章、分類和舊網址樣本？
- [ ] 沒有列出修改的檔案、測試命令和結果？
- [ ] 沒有 Search Console 證據，卻聲稱文章已收錄？
- [ ] 沒有說明哪些結果仍需要部署後或後續觀察？

## SEO 修改的 Definition of Done

讓 AI 每次修改後回覆以下項目：

- [ ] 修改檔案與目的。
- [ ] Build、內部連結檢查、SEO Check 的結果。
- [ ] 正式 URL 與 HTTP Status。
- [ ] Canonical、Sitemap、Robots、Metadata 的檢查結果。
- [ ] Structured Data 驗證結果（如適用）。
- [ ] Mobile / Desktop 檢查結果。
- [ ] Search Console 的實際狀態（若有權限）。
- [ ] 尚未驗證的項目與下一次檢查方式。

我的部落格目前可執行：

```bash
npm run build
npm run check:seo
```

這兩個指令確認的是建置與既有 SEO 規則，**不能代替 Google 的收錄結果**。執行指令後仍應檢查正式網站；若 AI 沒有 Search Console 權限，就應標示「尚未驗證收錄」，不要自行推測。
