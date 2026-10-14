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
