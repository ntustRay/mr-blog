# MR Blog taxonomy v3

This migration replaces the former mixed Category/Tag homepage controls with a Category-first index.

## Canonical Categories

The main six Categories: AI & Agents, Frontend, Full-stack, Data & Visualization, Dev Tools & Quality, System Design.

Four additional first-class Categories: Programming & Algorithms, Game Development, Web Publishing & SEO, Career & Life.

All 259 existing Markdown posts retain their filenames, publication dates and article permalinks. Articles are classified by their primary problem rather than by every technology mentioned.

## Four orthogonal dimensions

- Category: exactly one broad domain for each post
- Tags: technology and concepts, with aliases normalized on index and article links
- Content Type: title prefix, one of [News], [Guide], [Insight], [Review]
- Series: optional `series` and `seriesOrder` for ordered tutorials

The `interview` Tag remains a filter, not a fifth Content Type.

## Series

- `engineer-stock`: 10 parts
- `visual-regression`: 6 parts
- `shade-lab`: 6 parts, displayed as Shade Lab

A series may span Categories. The Series pages link to each article by its unchanged ID, and articles show series-specific prev/next navigation.

## Old URL compatibility

Former Category URLs (`ai`, `engineering`, `web-development`, `blogging`, `life`) stay available as noindex compatibility pages with links to the new relevant Categories.

Known Tag aliases retain simple compatibility pages. The original article URLs are unchanged.

## New-post workflow

Use `templates/article.md`, check `src/config/taxonomy.ts` and `src/config/series.ts`, then run:

```sh
npm run check:taxonomy
npm run build
npm run check:seo
```

The quality CI workflow validates the taxonomy and build for every pull request and push.
