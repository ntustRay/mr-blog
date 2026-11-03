---
title: "[Review] React 還是 Vue？四種 UI Library 的取捨"
description: "UI Framework 牽涉變更追蹤模型、Component 心智負擔、工具鏈與團隊現有元件。不該只用 Todo App 的執行速度決定。"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 2
tags:
  - "React"
  - "Vue"
  - "Svelte"
  - "Frontend"
draft: false
references:
  - title: "React — official repository"
    url: "https://github.com/react/react"
  - title: "Vue — official repository"
    url: "https://github.com/vuejs/core"
  - title: "Svelte — official repository"
    url: "https://github.com/sveltejs/svelte"
  - title: "Solid — official repository"
    url: "https://github.com/solidjs/solid"
  - title: "React Docs"
    url: "https://react.dev/learn"
  - title: "Vue Docs"
    url: "https://vuejs.org/guide/introduction.html"
  - title: "Svelte Docs"
    url: "https://svelte.dev/docs/svelte/overview"
---

UI Framework 牽涉變更追蹤模型、Component 心智負擔、工具鏈與團隊現有元件。不該只用 Todo App 的執行速度決定。

## 結論先說

現有 React/TypeScript 共用元件成熟就優先 React；Vue 的 SFC + Composition API 適合偏好 Template 與直觀 reactivity 的團隊；Svelte、Solid 適合以小規模實作核對需求。

## 選項比較

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [React](https://github.com/react/react) | 251,878 | Hooks 生態大、整合成熟 | Effect/依賴與 re-render 易誤用 | 既有 React 團隊 |
| [Vue](https://github.com/vuejs/core) | 54,820 | SFC、Composition API、reactivity 完整 | React 套件要尋找替代 | Vue 生態 |
| [Svelte](https://github.com/sveltejs/svelte) | 88,537 | 編譯器與精簡元件寫法 | 第三方整合需逐項驗證 | 新產品 |
| [Solid](https://github.com/solidjs/solid) | 36,211 | 細粒度 reactive 更新 | API、生態不同於 React | 高頻互動實驗 |

*Stars：2026-11-03 公開 GitHub Repository 快照。不同 Repository 的範圍不完全相同；「—」代表沒有可直接對應的獨立 Repo。Stars 不是效能、穩定性、授權或採用率排名。表中的候選工具不代表作者全部使用過。*

## 核心原理與 Trade-offs

- React 更新模型不是所有 state 變動都直接改 DOM；Profiler 必須分辨 render、commit 與實際 Layout/Paint。
- Fine-grained reactivity 可降低某些更新成本，但也會影響如何設計 data flow、memo 與訂閱。
- TypeScript API、表單、無障礙、測試、開發者工具的可維護性，通常比單項 benchmark 更重要。

## 實際專案的選型依據

可參照公開的 [React 分析範例](https://github.com/ntustRay/analysis-react-vite-tailwind-zustand) 與 [Vue3 範例](https://github.com/ntustRay/vue3-demo-zustand-tailwind)。比較前要先確保兩份需求等價。

## 導入前的驗收步驟

1. 同樣資料建立 filter、editable list 與大表格。
2. 量 profiler commit、首次互動與 JS parse，而非只記 FPS。
3. 檢查符合現有 Design System、Routing、Accessibility、Testing 的成本。

## 什麼時候改選其他方案？

新框架帶來的效能收益若無法超過既有業務元件重寫成本，維持原框架比較合理。

本文依公開 Repository、官方文件及可公開的專案設定分析，**未針對所有候選執行相同條件的 Benchmark**。新增的比較表應隨版本與需求更新，不宜把單次快照視為長期結論。
