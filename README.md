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

## Public view counters

Busuanzi displays **Total views** in the footer and **Views** in each
article's metadata. No account, API key, or database is required.

- Counts are page views (PV), not unique visitors. Reloads may count again.
- Counts begin when tracking is enabled; earlier visits cannot be recovered.
- The service groups the site total by hostname. Other sites on the same
  hostname using Busuanzi share that total; article counts are URL-specific.
- Tracking loads only on the configured production origin and base path,
  so local development, previews, and Lighthouse do not increment it.
- An unavailable or blocked counter stays as `—`, rather than a misleading `0`.
- GitHub Pages only serves the static site; the totals are stored by the
  third-party service and depend on its availability.

Integration: `src/components/ViewCount.astro` and
`src/components/ViewCountLoader.astro`.
Provider documentation: https://ibruce.info/2015/04/04/busuanzi/

## Article comments

Every published post uses `ArticleComments.astro`, rendered after post navigation.
The giscus widget loads **only after the reader opens the comments panel**.
There is no giscus preconnect, script, iframe, or request on the initial page load.
This avoids adding the third-party widget to the initial rendering workload;
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
