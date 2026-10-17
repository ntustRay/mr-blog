# AGENTS.md

## Project

- This repository is a personal technical blog built with Astro and TypeScript.
- The author's public positioning is **Full-Stack Engineer**. Do not narrow the site identity to frontend-only wording unless the user explicitly asks to change that positioning.
- Blog posts live under `src/content/blog/`.
- Site-wide metadata and homepage focus topics live in `src/config/site.ts`; update that file instead of duplicating those values across pages.
- The site is static-first and deployed to GitHub Pages.
- Prefer simple, maintainable solutions appropriate for a content-focused blog.

## Editorial Mission and Topic Selection

- The blog primarily serves the author's learning, engineering decisions, and future challenges. Reader usefulness is welcome, but traffic, SEO, and news volume must not override that purpose.
- Before drafting, state briefly in the working response or draft notes: the author's relevant problem or learning goal, the article's main question, and the intended outcome. Do not add editorial process notes to the published article by default.
- Prioritize current problems, upcoming challenges, and knowledge that could change the author's approach. Relevant news is a source of ideas; it is not a publishing quota.
- Use the user's current task and confirmed interests to establish relevance. Do not freeze the blog's scope to the author's current stack or silently invent future plans.
- If relevance is unclear, explain the possible connection and suggest a topic before producing a full article.
- Research radar items do not automatically become articles. Do not force a daily news digest into a post without a relevant learning question or explicit user request.
- Keep one main question per article. Remove tangents or propose a separate article.
- An unresolved exploration is valid when it identifies what is known, what remains uncertain, and a concrete next validation step.

## Article Types

- For new articles, and existing articles whose titles the user explicitly asks to change, begin the frontmatter `title` with exactly one of `[News]`, `[Insight]`, `[Review]`, or `[Guide]`, followed by a space.
- Select the type after identifying the article's primary purpose. Do not balance type counts or force topics to fill a type.
- `[News]`: a time-sensitive release or event. State the event date, what changed, its relevance to the author's work or learning, and any adoption limits.
- `[Insight]`: an interpretation, engineering judgment, or reflection. Support the reasoning, distinguish inference from evidence, and identify conditions that could change the judgment.
- `[Review]`: evaluate a tool or compare choices. State the use case, evaluation basis (documentation, external benchmarks, or actual hands-on tests), trade-offs, and conditions that change the recommendation. Never imply hands-on testing when none occurred.
- `[Guide]`: complete a concrete task. Provide necessary prerequisites, focused steps or examples, and a way to verify the result. Do not imply commands were executed when they were only reviewed.
- Classify research interpretation as `[Insight]` when its main value is a lasting engineering judgment; reserve `[News]` for reporting the event itself.
- The title prefix describes article type. Keep `category` for broad subject areas and `tags` for technologies/topics; do not add a frontmatter field or change the schema just to represent the prefix.
- Do not change existing titles, slugs, URLs, or published article classifications in bulk unless explicitly requested.

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
- Each section must add evidence, an explanation, a constraint, an example, or a useful next step. Merge sections that only repeat the same conclusion.
- Keep connected reasoning in paragraphs; use lists and tables when they improve scanning or comparison. Avoid turning every sentence into its own paragraph.
- Use bold selectively. Avoid stock phrasing such as 「不是……而是……」、「這不只是……更是……」, generic opening announcements, and formulaic conclusions unless the wording is necessary and precise.

## Technical Content

- Prefer concrete explanations, examples, constraints, and trade-offs over abstract advice.
- For meaningful technical choices, include relevant pros, cons, and trade-offs.
- When enough information exists, state a clear decision and explain why it fits the specific use case.
- The agent may strengthen a technical conclusion when reliable evidence supports it, but must not make claims stronger than the evidence.
- If a factual claim cannot be reasonably verified, omit it or explicitly retain it as an open question; never present it as established.
- Distinguish source facts, author-confirmed experience or opinions, and agent-proposed interpretations or recommendations. Label unconfirmed first-person conclusions for author review in drafts.
- Quantitative claims must include the relevant version/date, environment, workload, scope, and source where available. Disclose missing conditions and limit the conclusion accordingly.
- Label hypothetical calculations and their assumptions. Fixed time savings per run accumulate linearly; use a compounding claim only when a supported reinvestment mechanism is explained.
- Stars, downloads, and community attention are signals of attention or usage, not proof of performance, maturity, or suitability.
- Clearly distinguish the author's own measurements or experience, official documentation or benchmarks, and third-party observations.
- Never turn external information into fabricated first-person experience.
- Never invent statements such as 「我測試後發現……」、「我遇到這個問題……」 or 「我最後選擇……」 unless the user actually provided that experience.
- Use official or primary sources for version-specific behavior, benchmarks, APIs, specifications, or other claims where freshness matters.
- Stable, uncontroversial general explanations do not require citations.
- When an article materially depends on external documentation, benchmarks, specifications, or third-party research, add those sources to the optional `references` frontmatter and cite them inline where the claim needs local context.

## Code Examples

- Prefer TypeScript unless another language is required by the topic.
- Keep examples minimal and focused on the point being explained.
- Avoid unrelated boilerplate.
- Do not introduce architecture or patterns merely to make an example look production-grade.
- Examples should be correct enough to use as a practical reference.
- Specify the fenced-code language whenever it is known.
- When a filename materially improves context, use code fence metadata such as `title="src/utils/example.ts"`; omit filenames that are only decorative.

## Article Structure

- Long articles should usually include one concise opening summary labeled 「這篇的重點」. Short articles may omit it when it would only duplicate their opening.
- Adapt the summary to the type: what changed and why it matters (`News`), the current judgment (`Insight`), recommendation and conditions (`Review`), or outcome and prerequisites (`Guide`). Keep essential caveats with the claim.
- Use the site's existing supported summary markup/component; inspect the current implementation before choosing syntax. Do not invent unsupported directives or use ordinary blockquotes solely as a styling workaround.
- When the user requests summary styling, make its label, background/border, and text hierarchy visibly distinct while keeping body-sized readable text. Verify the actual desktop/mobile rendering. Documentation updates alone do not authorize CSS or layout changes.
- Long technical articles should provide a usable result where appropriate: a minimal example, verification command, decision table, migration checklist, or concrete failure analysis. Short opinion pieces do not need artificial code examples.
- Do not force every article into an identical outline. Use headings that naturally fit the topic.
- For technical comparisons, a useful structure is often: Problem → Options → Trade-offs → Decision → Implementation / Example.
- Add images, screenshots, charts, or diagrams only when they materially improve understanding.
- Keep references as structured frontmatter when possible so the article layout can render them consistently.

## Images

- Use WebP for all raster images by default, including article images, screenshots, `coverImage`, the default OG image, and generated per-post OG images.
- `coverImage` frontmatter values must reference a `.webp` file.
- Image-generation endpoints must output WebP with the correct `image/webp` content type.
- Do not add PNG, JPEG, or GIF files unless WebP cannot satisfy a documented technical or compatibility requirement.
- Keep SVG for vector assets such as icons when it is smaller and more appropriate than a raster image.

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
references:
draft:
```

- `references` is an optional list of `title` + absolute `url` objects used for meaningful external sources.
- Fields without a meaningful value may remain optional where supported by the schema.
- Never invent fake metadata just to populate a field.

## Tags and Categories

- Every published article must have one broad `category`.
- Use categories for stable top-level sections and tags for narrower technologies or topics.
- Reuse existing tags whenever they accurately describe the article.
- Do not create minor spelling, casing, or naming variations of an existing tag.
- Add a new tag only when it has meaningful long-term classification value.
- Reuse an existing category unless a new top-level section has meaningful long-term value.
- Keep the number of top-level categories small; do not split closely related topics into separate categories without a clear long-term need.

## SEO

- Write titles for humans first.
- Titles should be natural technical titles, not forced SEO templates.
- Include useful search terms naturally in the title and description when appropriate.
- Do not keyword-stuff.
- Avoid content-farm wording and exaggerated clickbait.
- Catchy titles are acceptable occasionally when they still accurately represent the article.
- SEO may improve the presentation of an already relevant topic, but must not override the author's learning priorities or distort the technical conclusion.

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
- When the user says 「先討論」, discuss the direction, central claim, evidence, and unresolved choices without editing repository files or producing a complete article.
- Authorization to update repository instructions or prepare a project guide applies to those documents; it does not authorize publishing articles, rewriting existing posts, or changing the site UI.

## Pre-Publish Check

Before publishing an article, check the relevant items:

- Frontmatter is valid and consistent with the schema.
- The article has a clear connection to the author's confirmed goal and answers one main question.
- The title has one valid article-type prefix, and the title/description match the actual content and strength of evidence.
- The selected type's evidence or verification requirements are met; missing evidence is disclosed without inventing tests or experience.
- Recommendations state the conditions that could change them; unresolved explorations identify a next validation step.
- The opening summary, when included, preserves the main conclusion and its essential limitations without repeating it throughout the article.
- Existing tags are reused where appropriate.
- Links are valid where reasonably checkable.
- Code examples have no obvious errors.
- No fabricated personal experiences or benchmark results were introduced.
- No unsupported factual claims remain.
- Obvious typos and formatting problems are fixed.
- Run the relevant project build before treating code/configuration changes as complete.
- Do not claim a verification passed unless it was actually run.
