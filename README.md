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

## GA4 瀏覽量

首頁上方顯示首頁與全站瀏覽量，每篇文章在分類右側顯示各自的瀏覽量。文章頁的瀏覽量顯示於標題下方，其餘頁面顯示於頁尾。GitHub Pages 部署時使用 GA4 Data API 讀取這個網站的累計瀏覽量，每天安排一次更新。GA4 暫時無法連線時，沿用快取內最近一次成功取得的資料。首次同步前顯示「暫無資料」，首頁文章列以「—」表示。

1. 在 Google Cloud 啟用 [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart)，建立服務帳戶，並在此站的 GA4 資源授予該帳戶 **Viewer**。
2. [設定 GitHub Actions 的 Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)，將信任範圍限於此 repo 的 `refs/heads/main`，並授予該工作負載 `roles/iam.workloadIdentityUser` 以使用服務帳戶。
3. 在 GitHub repo 的 Settings → Secrets and variables → Actions → Variables 設定 `GA4_PROPERTY_ID`（GA4 資源的數字 ID）、`GA4_WORKLOAD_IDENTITY_PROVIDER` 與 `GA4_SERVICE_ACCOUNT`。在 Actions 執行 **Deploy to GitHub Pages**，確認 **Refresh public view counts** 成功。

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

## 專案與教學系列

在 [Projects](https://ntustray.github.io/mr-blog/projects/) 找專案、Demo 與原始碼，從 [Series](https://ntustray.github.io/mr-blog/series/) 依序閱讀專案介紹、分步實作與總結。

## Financial

金錢與純生活文章移至 [Financial](https://ntustray.github.io/mr-financial-blog/)。本次搬移租屋清單與 2020 年加碼券兩篇，舊文章網址提供 canonical 與自動轉址。求職、面試、code 與工程師選股網的全部技術教學仍在此站。

轉址清單：`src/config/moved-posts.json`。giscus 與 Financial 共用 public Discussions backend，保留搬移文章的討論 term。
