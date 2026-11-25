# MR Blog

Personal blog built with Astro, TypeScript, Markdown, and GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Site configuration

Site-wide metadata and the homepage focus topics live in:

```text
src/config/site.ts
```

Update that file instead of duplicating the site name, author, description, locale, or focus topics across pages.

## Write a post

Create a Markdown file in:

```text
src/content/blog/
```

Example frontmatter:

```yaml
---
title: "Post title"
description: "Short description"
pubDate: 2026-09-20
category: Web Development
tags:
  - Astro
references:
  - title: "Astro documentation"
    url: "https://docs.astro.build/"
draft: false
---
```

For a ready-to-use draft, copy `templates/article.md` into
`src/content/blog/`, rename it to the final slug, and keep `draft: true`
until the article is ready to publish.

Raster images, including `coverImage`, must use WebP.

## Verification

```bash
npm run build
npm run lighthouse
```

The build also generates the Pagefind index and checks internal links.
Pull requests and pushes to `main` run the quality workflow, including
Lighthouse CI.

## 公開瀏覽量

公開瀏覽量來自 GA4 的 `screenPageViews`。每日部署會依本站正式網址抓取累計瀏覽量，將數字寫進靜態頁面。報表讀取失敗時沿用已發布的快照，首次同步前顯示「待更新」。`pageviews.json` 只發布本站總量、統計截止日及已發布頁面的瀏覽量。

首次設定：

1. 在 Google Cloud 啟用 Google Analytics Data API，設定 GitHub Actions 的 Workload Identity Federation 和服務帳戶。把可使用該服務帳戶的 GitHub 身分限制在本 repository 的 `main` 部署 workflow。
2. 在 GA4 的資源存取權管理中給服務帳戶 **Viewer**。
3. 新增 GitHub Actions repository variables：`GA4_PROPERTY_ID`（GA4 的數字資源 ID）、`GA4_WORKLOAD_IDENTITY_PROVIDER`（完整 provider 路徑）及 `GA4_SERVICE_ACCOUNT`（服務帳戶 Email）。
4. 執行一次 **Deploy to GitHub Pages**，確認 Refresh public pageviews 成功，且正式首頁、文章頁和一般頁面有數字。

## Article comments

Every published post uses `ArticleComments.astro`, rendered after post navigation.
The giscus widget loads when the comments panel comes within 200px of the
viewport, or when the reader opens it manually. Its official metadata messages
automatically expand discussions with at least one comment. Empty discussions
stay collapsed, and an explicit reader toggle takes precedence over later
metadata updates. Replies belong to existing top-level comments.

There is no unconditional giscus script, iframe, or preconnect on page load.
Short articles can load it immediately if the panel is already near the viewport.
Browsers without IntersectionObserver retain manual loading. Provider failures
leave the manual retry and GitHub fallback available. No API proxy or tokens
are required; metadata is accepted only from this widget's iframe and giscus.app.
Lighthouse scores still depend on the full page and measurement conditions.

### One-time GitHub setup

1. Enable **Settings → General → Features → Discussions** for `ntustRay/mr-blog`.
2. Install https://github.com/apps/giscus on **only this repository**.
3. Select the `Announcements` category in https://giscus.app/zh-TW and copy its
   `data-category-id` into `src/config/comments.ts`. Confirm the repository ID,
   set `enabled: true`, and rebuild. These IDs are public, not credentials.

Until setup is complete, comments remain hidden; no broken widget is published.
Never put a GitHub token, App private key, or OAuth secret in the frontend.

Each post maps to a stable `posts/<post.id>` discussion term with strict
matching. Changing a title does not move the comments. Keep that term unchanged
when changing the site base path or hosting domain.

`giscus.json` restricts the allowed embedding origin to the production site.
It is an embedding restriction, not a replacement for GitHub permissions or
moderation. Visitors sign in with GitHub to comment; moderation lives in GitHub
Discussions. Use an announcement-type category so ordinary visitors cannot
create unrelated threads directly. Installations should be limited to this repo.

The official hosted service receives security updates from its maintainers.
Built-in `dark_dimmed` styling is used; no third-party theme CSS is loaded.
For local UI tests, mock the provider instead of opening production comments.
On OAuth returns, an inline head script stores the session using the official
client's format and removes the `giscus` URL parameter before external resources
load. This prevents the existing view counter from receiving it in a Referer.

Provider documentation: https://giscus.app/zh-TW
Advanced configuration: https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md

## Optional AdSense setup

The AdSense script is disabled unless a valid client ID is provided:

```bash
PUBLIC_GOOGLE_ADSENSE_CLIENT=ca-pub-1234567890123456 npm run build
```

After AdSense approval, also replace the comment in `public/ads.txt` with
the exact publisher record from Google. The planned placement is limited to
one in-article slot after the introduction and one slot before post navigation;
avoid sticky or interstitial ads that interrupt reading.

The view-counter integration is disclosed on the privacy page. Review that
policy and any consent requirements again before enabling AdSense or
additional analytics.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`.

GitHub repository settings must use **Settings → Pages → Source → GitHub Actions**.

Published URL:

https://ntustray.github.io/mr-blog/

## 工程師選股網自學系列

[從第 1 篇開始](https://ntustray.github.io/mr-blog/posts/engineer-stock-01-local/)：共 10 篇，涵蓋本機、股票 JSON、Actions、Next.js 資料流、篩選圖表、Auth、RLS、Vercel、核心架構與面試用技術選型，以及 Workflow 與官方 API 來源。每篇含流程／結果圖、操作與驗證；附件只含教學片段及驗證範圍。

## 線上試妝自學系列

[從第 1 篇開始](https://ntustray.github.io/mr-blog/posts/shade-room-01-architecture/)：共 6 篇，依序拆解影像輸入、MediaPipe 與 Worker、WebGL 唇部遮罩、互動與匯出，以及像素驗證與 CI。包含實際畫面、定位與質地診斷圖、流程圖及驗證限制。

## Financial

金錢與純生活文章移至 [Financial](https://ntustray.github.io/mr-financial-blog/)。本次搬移租屋清單與 2020 年加碼券兩篇，舊文章網址提供 canonical 與自動轉址。求職、面試、code 與工程師選股網的全部技術教學仍在此站。

轉址清單：`src/config/moved-posts.json`。giscus 與 Financial 共用 public Discussions backend，保留搬移文章的討論 term。
