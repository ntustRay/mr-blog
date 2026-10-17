# MR Blog 維護指南

本文件收錄第三方服務與部署細節。[回到 README](../README.md)

## 環境與指令

需要 Node.js 22.12.0 以上，CI 使用 Node.js 24。

```bash
npm ci
npm run dev
```

```bash
npm run build
npm run preview
npm run lighthouse
```

`build` 依序執行 Astro Build、Pagefind 索引產生與內部連結檢查。Pull Request 與推送到 `main` 會觸發 [Quality workflow](../.github/workflows/quality.yml)，執行 Build 與 Lighthouse CI。實際分數仍受頁面內容與量測條件影響。

## 站點設定與撰文

站名、作者、description、locale 與首頁主題集中在 [src/config/site.ts](../src/config/site.ts)。修改時使用這個來源，避免跨頁複製設定。

新增文章時，複製 [templates/article.md](../templates/article.md) 到 `src/content/blog/`，再以檔名設定最終 slug。文章 schema 見 [src/content.config.ts](../src/content.config.ts)，寫作規範見 [AGENTS.md](../AGENTS.md)。

```yaml
---
title: "[Guide] 文章標題"
description: "說明讀者會解決的問題與適用範圍。"
pubDate: 2026-10-17
category: Web Development
tags:
  - TypeScript
references:
  - title: "Astro documentation"
    url: "https://docs.astro.build/"
draft: true
---
```

日期應改為實際預定發布日期。新稿保留 `draft: true`，確認可發布後再變更。Raster images 與 `coverImage` 使用 WebP；適合向量的品牌與 Icon 資產保留 SVG。

## 公開瀏覽計數

Busuanzi 在頁尾顯示 Total views，文章 metadata 顯示 Views，不需要帳號、API key 或 Database。

- 數字是 Page Views（PV），並非不重複訪客；重新整理可能再次計數。
- 從啟用時計算，無法補回更早的瀏覽紀錄。
- 網站總數以 hostname 分組；同一 hostname 下其他使用 Busuanzi 的網站會共用總數。文章計數則依 URL 區分。
- 只有設定的正式 origin 與 base path 會載入追蹤，本機、預覽與 Lighthouse 不計入。
- 服務不可用或被封鎖時顯示 `—`，不以 `0` 代替。
- GitHub Pages 僅提供靜態網站；數字儲存在第三方服務，依賴其可用性。

實作：[ViewCount.astro](../src/components/ViewCount.astro)、[ViewCountLoader.astro](../src/components/ViewCountLoader.astro)。

服務文件：[Busuanzi](https://ibruce.info/2015/04/04/busuanzi/)。

## 文章留言

每篇公開文章在上一篇／下一篇導覽之後顯示 [ArticleComments.astro](../src/components/ArticleComments.astro)。留言面板接近 viewport 200px 內，或讀者手動開啟時，才載入 giscus。

收到該 widget 的官方 metadata，且頂層留言至少一則時，面板會自動展開；空討論維持收合。讀者明確開關後，後續 metadata 不會覆蓋其選擇。回覆附屬於既有頂層留言。

頁面載入時不會無條件加入 giscus script、iframe 或 preconnect；短文章的面板若已接近 viewport，可能立即載入。瀏覽器不支援 IntersectionObserver 時，仍可手動載入。服務失敗時保留重試與 GitHub 入口。

不需要 API proxy 或 token。Metadata 只接受來自該 widget iframe、origin 為 `https://giscus.app` 的訊息。

### GitHub 初次設定

本站目前的 [comments.ts](../src/config/comments.ts) 已啟用留言。新部署或更換 repo 時，依序確認：

1. 在 repo 的 **Settings → General → Features** 啟用 Discussions。
2. 安裝 [giscus GitHub App](https://github.com/apps/giscus)，範圍限定該 repository。
3. 在 [giscus 設定頁](https://giscus.app/zh-TW) 選擇 `Announcements` 類別，把 repository ID 與 `data-category-id` 填入 `src/config/comments.ts`。
4. 確認 `enabled: true` 後重新 Build。這些 ID 是公開設定，並非憑證。

設定不完整時，元件不顯示。不要把 GitHub token、App private key 或 OAuth secret 放進前端。

### 討論對應與權限

每篇文章使用固定的 `posts/<post.id>` term，並啟用 strict matching。修改標題不會搬動留言；更換 base path 或網域時也應保留這個 term。

[giscus.json](../giscus.json) 限制正式站點的嵌入 origin，但不能取代 GitHub 權限與 moderation。訪客使用 GitHub 登入留言，管理在 GitHub Discussions 進行。使用 announcement 類型的 category，可限制一般訪客直接建立無關討論串。

使用官方 hosted service 與內建 `dark_dimmed` 樣式，不載入第三方 theme CSS。本機 UI 測試應 mock provider，避免操作正式留言。

OAuth 返回時，[GiscusSession.astro](../src/components/GiscusSession.astro) 的 inline head script 依官方 client 格式儲存 session，並在外部資源載入前移除 URL 的 `giscus` 參數，避免既有計數服務透過 Referer 收到該參數。

文件：[giscus](https://giscus.app/zh-TW)、[Advanced usage](https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md)。

## 選用 AdSense

未提供有效 client ID 時，不載入 AdSense script。

```bash
PUBLIC_GOOGLE_ADSENSE_CLIENT=ca-pub-1234567890123456 npm run build
```

Google 核准後，需將 [public/ads.txt](../public/ads.txt) 的註解替換為 Google 提供的精確 publisher record。預定位置僅限文章引言後一處，以及文章導覽前一處；避免干擾閱讀的 sticky 或 interstitial 廣告。

瀏覽計數已在[隱私權頁面](../src/pages/privacy.astro)揭露。啟用 AdSense 或新增 Analytics 前，應重新檢查該政策與所需的同意機制。

## 部署

推送到 `main` 會觸發 [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)。GitHub repository 的 **Settings → Pages → Source** 應選 GitHub Actions。

正式網址：<https://ntustray.github.io/mr-blog/>

## README 圖像

[readme/](readme/) 放置 README 專用的靜態 SVG。這些資產透過 GitHub 相對路徑顯示，不進入網站的 `public/`，也不增加網站執行時的 JavaScript。

- `hero.svg` 使用本站的 MingRay 品牌圖形。
- `topic-*.svg` 是三個主題的圖文卡片。
- `icons/` 的 Icon 來自 Lucide，完整授權見 [LICENSE-lucide.txt](readme/LICENSE-lucide.txt)。

SVG 使用純向量與文字，沒有 script、外部字型請求或追蹤。修改時保留 `viewBox`、`title`、`desc` 與 README 的替代文字。
