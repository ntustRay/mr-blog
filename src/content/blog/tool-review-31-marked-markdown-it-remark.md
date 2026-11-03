---
title: "[Review] Marked、markdown-it、remark：Markdown 解析與渲染怎麼選"
description: "Markdown Parser 和 HTML Sanitizer 是不同職責。任何把第三方文字轉成 HTML 的 Pipeline，都要控制 Raw HTML、URL Scheme、Code Highlighting 與 XSS；Par"
pubDate: 2026-11-03
category: "Web Publishing & SEO"
series: tech-stack-comparisons
seriesOrder: 31
tags:
  - "Markdown"
  - "Marked"
  - "remark"
  - "Security"
draft: false
references:
  - title: "Marked Repository"
    url: "https://github.com/markedjs/marked"
  - title: "markdown-it Repository"
    url: "https://github.com/markdown-it/markdown-it"
  - title: "remark Repository"
    url: "https://github.com/remarkjs/remark"
  - title: "Marked Docs"
    url: "https://marked.js.org/"
  - title: "markdown-it Docs"
    url: "https://markdown-it.github.io/"
  - title: "remark Docs"
    url: "https://remark.js.org/"
---

Markdown Parser 和 HTML Sanitizer 是不同職責。任何把第三方文字轉成 HTML 的 Pipeline，都要控制 Raw HTML、URL Scheme、Code Highlighting 與 XSS；Parse 成功不代表安全。

## 我的選型結論

純 Markdown → HTML 且需要簡單 API 可用 Marked；想靠插件擴充語法可考慮 markdown-it；需要 AST 轉換、Lint、Markdown/MDX Pipeline 可選 remark/Unified。

## 比較表

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Marked](https://github.com/markedjs/marked) | 37,279 | API 直接、Markdown → HTML 方便 | 原始輸出需額外 Sanitization | Markdown Viewer |
| [markdown-it](https://github.com/markdown-it/markdown-it) | 22,024 | Plugin/Token 處理擴充靈活 | Render 安全策略要自行補齊 | 擴充語法 |
| [remark](https://github.com/remarkjs/remark) | 9,038 | AST Pipeline、Plugin、轉換能力 | Unified 生態需理解、配置較多 | 文件處理流程 |

*Stars 依 2026-11-03 官方公開 Repository 的快照；不同 Platform/SDK/CLI/概念不具直接可比性，「—」表示無合適的獨立 Repository。Stars 不能證明效能、採用率或品質。列入候選不等於作者實際使用。*

## Trade-offs

- Syntax Highlight 與 Parser 分離；highlight.js 等渲染插件產生的 HTML 也必須按信任層級處理。
- Sanitization 不只過濾 script tag；javascript: URL、event handler、SVG 與 iframe 也要管控。
- AST 轉換對文件工具很有價值，但一般閱讀器若沒有轉換需求，無需付出完整 Pipeline 成本。

## 可公開的實際案例

[markdown-file-reader](https://github.com/ntustRay/markdown-file-reader) 使用 Marked、marked-highlight 和 highlight.js。公開 Repo 可核對程式依賴，但本文不把使用 Parser 說成具備完整 HTML Sanitization。

## 實作或遷移前驗收

1. 用 GFM Table、Code Fence、連結、圖片、Frontmatter Fixture 檢查語法。
2. 用 XSS Fixture 檢查外部 Markdown 的 HTML 與 URL。
3. 測 1MB 文件、滾動效能、TOC Anchor 與轉義。

## 何時不要採用

若內容只有受控的純文字，不需要完整 Markdown Pipeline；若要系統性 AST 轉換，才有理由使用 remark。

本文依官方文件與公開 Repository 的可驗證資訊整理，沒有聲稱完成各種工具的等條件 Benchmark；版本、平台與負載條件不同時需重新評估。
