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

## Optional AdSense setup

The AdSense script is disabled unless a valid client ID is provided:

```bash
PUBLIC_GOOGLE_ADSENSE_CLIENT=ca-pub-1234567890123456 npm run build
```

After AdSense approval, also replace the comment in `public/ads.txt` with
the exact publisher record from Google. The planned placement is limited to
one in-article slot after the introduction and one slot before post navigation;
avoid sticky or interstitial ads that interrupt reading.

The current site does not use non-essential cookies, so it does not show a
consent banner. Review this again before enabling AdSense or analytics.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`.

GitHub repository settings must use **Settings → Pages → Source → GitHub Actions**.

Published URL:

https://ntustray.github.io/mr-blog/
