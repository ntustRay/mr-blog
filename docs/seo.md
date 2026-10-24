# MR Blog SEO 維運

## Google Search Console（需站長帳戶操作）

1. 以 **URL-prefix** 方式加入 `https://ntustray.github.io/mr-blog/`。
2. 在部署環境設定 `PUBLIC_GOOGLE_SITE_VERIFICATION`（Google 提供的 meta tag content），重新部署後完成驗證。
3. 提交 `https://ntustray.github.io/mr-blog/sitemap-index.xml`，並用 URL Inspection 抽查新文、2019–2021 舊文與 Category 頁。
4. 每 28 天觀察 Impressions、Clicks、CTR、Indexed / Not indexed，將「已發現但未收錄」與「已收錄但曝光少」分開處理。

**注意：** GitHub Pages project site 的 `/mr-blog/robots.txt` 不等於 host 根目錄的 `/robots.txt`，無法代替 Search Console 提交 Sitemap。網域主機根目錄由 GitHub Pages 服務，請勿宣稱子目錄 robots.txt 有全域效力。

## 舊文索引原則

2026-10-23 匯入的 196 篇 MRcoding 舊文已保留原始 `pubDate`，不可因為文章舊或簡短就批次 `noindex`。依 Search Console 中的實際收錄、曝光、重複內容與時效性，逐篇決定保留、補充、合併或移除。需要刪除時先盤點外部連結和舊 URL，再決定 301 / 404 / 410，勿未查證就自動 Redirect。

## Metadata 與連結

- `seoTitle` 是文章在搜尋結果使用的選用標題，原本 H1 不變。未設定時仍使用文章 `title`。
- `relatedPostIds` 可指定相關閱讀的文章 ID，使用既有文章路由；其他位置以 Category / Tag 配對補足三篇。
- 文章自動輸出 `BlogPosting` 與 `BreadcrumbList` JSON-LD。
- 站內搜尋頁帶 `noindex, follow` 且排除 Sitemap，Category / Tag 頁仍保持可索引；等有數據再決定哪些頁值得排除。
- `updatedDate` 僅在內容有實質更新時調整，不應隨每次部署刷新。

## CI

品質工作流會先用正式 `/mr-blog/` base build，再執行 `npm run check:seo`；其後改用 `/` root fixture 建置，讓既有 Lighthouse CI 能正常用 `staticDistDir` 測試。前者驗證 canonical、描述、搜尋索引排除、文章 Schema 與 Sitemap；後者是 Lighthouse 基礎檢查，**不能取代正式 GitHub Pages URL 的 Core Web Vitals 實測**。
