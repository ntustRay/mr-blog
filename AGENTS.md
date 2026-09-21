# AGENTS.md

## Project

- This repository is a personal technical blog built with Astro and TypeScript.
- Blog posts live under `src/content/blog/`.
- The site is static-first and deployed to GitHub Pages.
- Prefer simple, maintainable solutions appropriate for a content-focused blog.

## Engineering

- Follow the existing architecture, naming, and project conventions.
- Make the smallest clear change required for the task.
- Do not introduce unnecessary dependencies, abstractions, runtime JavaScript, or infrastructure.
- Keep TypeScript strict and do not introduce `any`.
- Run the relevant verification before considering a code or configuration change complete.

## Writing Style

- Write primarily in Traditional Chinese.
- Keep established technical terms in English when that is clearer, such as `hydration`, `tree shaking`, `SSR`, or `Content Collection`.
- Use a natural engineer-to-engineer tone: conversational, precise, and practical.
- Prefer direct explanations over formal or academic prose.
- Start with the actual problem and conclusion instead of long background sections.
- First-person writing is allowed only when it represents the author's real experience, decision, or opinion.
- Subjective opinions are allowed, but explain the reasoning behind them.
- Avoid generic AI-style filler, unnecessary introductions, summaries, transitions, or conclusions that do not add information.
- Do not increase article length merely to make it look comprehensive.

## Technical Content

- Prefer concrete explanations, examples, constraints, and trade-offs over abstract advice.
- For meaningful technical choices, include relevant pros, cons, and trade-offs.
- When enough information exists, state a clear decision and explain why it fits the specific use case.
- The agent may strengthen a technical conclusion when reliable evidence supports it, but must not make claims stronger than the evidence.
- If a factual claim cannot be reasonably verified, omit it rather than guessing.
- Clearly distinguish the author's own measurements or experience, official documentation or benchmarks, and third-party observations.
- Never turn external information into fabricated first-person experience.
- Never invent statements such as 「我測試後發現……」、「我遇到這個問題……」 or 「我最後選擇……」 unless the user actually provided that experience.
- Use official or primary sources for version-specific behavior, benchmarks, APIs, specifications, or other claims where freshness matters.
- Stable, uncontroversial general explanations do not require citations.

## Code Examples

- Prefer TypeScript unless another language is required by the topic.
- Keep examples minimal and focused on the point being explained.
- Avoid unrelated boilerplate.
- Do not introduce architecture or patterns merely to make an example look production-grade.
- Examples should be correct enough to use as a practical reference.

## Article Structure

- Long articles should usually include a short TL;DR. Short articles do not need one.
- Do not force every article into an identical outline. Use headings that naturally fit the topic.
- For technical comparisons, a useful structure is often: Problem → Options → Trade-offs → Decision → Implementation / Example.
- Add images, screenshots, charts, or diagrams only when they materially improve understanding.

## Frontmatter

Use the project frontmatter schema consistently:

```yaml
title:
description:
pubDate:
updatedDate:
tags:
category:
coverImage:
draft:
```

- Fields without a meaningful value may remain optional where supported by the schema.
- Never invent fake metadata just to populate a field.

## Tags and Categories

- Reuse existing tags whenever they accurately describe the article.
- Do not create minor spelling, casing, or naming variations of an existing tag.
- Add a new tag only when it has meaningful long-term classification value.
- Do not add categories merely because the schema supports them.

## SEO

- Write titles for humans first.
- Titles should be natural technical titles, not forced SEO templates.
- Include useful search terms naturally in the title and description when appropriate.
- Do not keyword-stuff.
- Avoid content-farm wording and exaggerated clickbait.
- Catchy titles are acceptable occasionally when they still accurately represent the article.
- SEO may influence topic selection and presentation, but must not distort the technical conclusion.

## Monetization

- AdSense or other monetization must remain secondary to the content.
- Do not lengthen articles, duplicate information, or publish low-value content merely to increase page views or ad inventory.
- Advertising placement should not significantly interfere with reading or navigation.

## Existing Articles

- Do not modify an existing published article unless the user explicitly asks to modify that article.
- Do not opportunistically rewrite, clean up, or modernize unrelated published posts.
- For small updates to an explicitly selected article, update it directly when appropriate.
- When a major framework, API, or behavior change would make the historical article misleading, preserve relevant historical context and clearly note the update and applicable version/date.

## Drafting and Publishing

Writing an article and publishing an article are separate actions.

Requests such as 「幫我寫一篇」, 「整理成文章」, or 「把這些筆記變成文章」 do not automatically authorize publishing.

- The agent may create or prepare a draft.
- Publishing requires explicit intent such as 「發布」, `publish`, 「上線」, `commit push`, or another equally clear instruction.
- TODOs and unfinished sections are allowed in drafts, but they must be clearly marked.

## Pre-Publish Check

Before publishing an article, check the relevant items:

- Frontmatter is valid and consistent with the schema.
- Title and description match the actual article.
- Existing tags are reused where appropriate.
- Links are valid where reasonably checkable.
- Code examples have no obvious errors.
- No fabricated personal experiences or benchmark results were introduced.
- No unsupported factual claims remain.
- Obvious typos and formatting problems are fixed.
- Run the relevant project build before treating code/configuration changes as complete.
- Do not claim a verification passed unless it was actually run.
