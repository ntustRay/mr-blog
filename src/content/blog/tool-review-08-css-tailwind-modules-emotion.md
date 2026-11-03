---
title: "[Review] Tailwind、CSS Modules、Emotion：樣式策略怎麼選"
description: "樣式方案的核心差異是設計規則放在哪：utility classes、局部 CSS class，還是 JavaScript Style Runtime。別把 Tailwind 的 Utility 以及 CSS Modules 的 S"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 8
tags:
  - "CSS"
  - "Tailwind CSS"
  - "Frontend"
draft: false
references:
  - title: "Tailwind CSS Repository"
    url: "https://github.com/tailwindlabs/tailwindcss"
  - title: "CSS Modules Repository"
    url: "https://github.com/css-modules/css-modules"
  - title: "Emotion Repository"
    url: "https://github.com/emotion-js/emotion"
  - title: "Tailwind Docs"
    url: "https://tailwindcss.com/docs"
  - title: "CSS Modules Specification"
    url: "https://github.com/css-modules/css-modules"
  - title: "Emotion Docs"
    url: "https://emotion.sh/docs/introduction"
---

樣式方案的核心差異是設計規則放在哪：utility classes、局部 CSS class，還是 JavaScript Style Runtime。別把 Tailwind 的 Utility 以及 CSS Modules 的 Scope 當成互斥能力。

## 結論

需要快速組合設計 Tokens 的團隊可用 Tailwind；重視原生 CSS 與元件封裝時 CSS Modules 更容易保持樣式語意；Emotion 適合已依賴 CSS-in-JS 和動態 Theme 的既有產品。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | 98,055 | Utility 與設計 tokens 集中，減少命名溝通 | Markup classes 可能冗長 | 大量重複 UI |
| [CSS Modules](https://github.com/css-modules/css-modules) | 18,040 | 原生 CSS、編譯後 local scope | 需維持 CSS 檔與 class mapping | 設計系統與靜態頁 |
| [Emotion](https://github.com/emotion-js/emotion) | 18,024 | JS 動態樣式與 Theme 組合 | Runtime/SSR/CSP 與 Bundle 成本 | 既有 CSS-in-JS 系統 |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- Tailwind 的 class 仍會影響 CSS cascade，設計規範必須定義 token/variant 與覆寫方式。
- CSS Modules 是規格/慣例及多種實作的集合，Repository Stars 不能當成單一軟體下載量。
- CSS-in-JS 應驗證 SSR 輸出、Style 插入順序與 CSP，不能只比較編碼行數。

## 實際應用

公開的 [analysis-react-vite-tailwind-zustand](https://github.com/ntustRay/analysis-react-vite-tailwind-zustand) 有 Tailwind 與 Emotion/MUI 組合經驗；新專案應避免同一個 UI token 被多套系統重複定義。

## 導入前驗收

1. 做按鈕、表單、Dialog、Dark Mode 與 RWD 的相同頁面。
2. 檢查 build CSS size、unused CSS、初次渲染與 CSP。
3. 確認 Design Token 與 component API 的改動範圍。

## 何時改選？

已有成熟 CSS Modules/Emotion 系統，且沒有實際維護痛點時，不需為了流行度全面重寫。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
