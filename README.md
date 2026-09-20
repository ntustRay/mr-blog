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
tags:
  - Astro
draft: false
---
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`.

GitHub repository settings must use **Settings → Pages → Source → GitHub Actions**.

Published URL:

https://ntustray.github.io/mr-blog/
