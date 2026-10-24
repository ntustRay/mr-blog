# MR Blog SEO 維運

## Google Search Console（需站長帳戶操作）

1. 以 **URL-prefix** 方式加入 `https://ntustray.github.io/mr-blog/`。
2. 在 GitHub Repo 的 **Settings → Secrets and variables → Actions → Variables** 新增 `PUBLIC_GOOGLE_SITE_VERIFICATION`（Google 提供的 meta tag content，**僅填 token，不要貼整個 `<meta>`**）。部署工作流會將此變數傳給 Astro build。重新執行 Deploy workflow 後完成驗證。
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

## 作者與來源

- `WebSite` 使用站點首頁的 `#website` 作為穩定 ID；作者 `Person` 使用 About URL 的 `#person`。正式 `/mr-blog/` 與 CI 的 `/` fixture 都從 Astro base 產生完整 URL。
- 每篇文章顯示通往 About 的作者連結，`BlogPosting.author` 與 `publisher` 指向同一位作者；About 的 `ProfilePage.mainEntity` 也連回該 `Person`。GitHub 保留為公開身分的 `sameAs`，導覽連結仍使用 GitHub URL。
- `references` 同時產生可閱讀的來源清單與 `citation` 結構化資料。只標示文章實際列出的來源，不自動建立背書、評分或 AI 引用紀錄。
- HTML 的語言使用 `zh-Hant`；Open Graph 的 locale 使用 `zh_TW`。

## AEO／GEO 的維護範圍

文章應直接回答標題中的主要問題，交代適用條件、限制與來源，並以一般 HTML 輸出。新系列以三篇文章分別處理答案內容的組織、生成式搜尋的來源與觀測，以及 SEO／AEO／GEO 的差異；使用相關閱讀連結串接，避免三篇重複相同段落。

本站的技術檢查涵蓋內容能否讀取、canonical、作者與來源的一致性。這些檢查通過後，仍須觀察正式網址的收錄、曝光、流量及實際答案中的連結；無法從本機 build 或 JSON-LD 推導排名、AI 引用率或營收提升。

觀測 AI 答案時，保留查詢原文、日期、服務與可辨識的模型／介面、語言或地區、答案截圖與被引用的完整 URL，並檢查引述是否符合原文。固定問題集的重複觀測只代表該樣本，不能外推為所有使用者的引用機率。Search Console 的數據與自行記錄的 AI 答案樣本也應分開保留。

## CI

品質工作流會先用正式 `/mr-blog/` base build，再執行 `npm run check:seo`；其後改用 `/` root fixture 建置，讓既有 Lighthouse CI 能正常用 `staticDistDir` 測試。前者驗證 canonical、描述、單一 H1、Open Graph URL／locale、搜尋索引排除、作者與站點 ID、文章／ProfilePage Schema、可見的來源連結及 Sitemap；後者是 Lighthouse 基礎檢查，**不能取代正式 GitHub Pages URL 的 Core Web Vitals 實測**。
