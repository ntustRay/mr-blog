---
title: "[Review] Vite、Webpack、Rspack、Turbopack：Bundler 怎麼選"
description: "Bundler 的工作包含 Module Graph、HMR、轉譯與 Production Chunk。Dev Server 起得快，不代表 TypeScript typecheck 與部署都會快。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 3
tags:
  - "Vite"
  - "Webpack"
  - "Rspack"
  - "Build Tools"
draft: false
references:
  - title: "Vite — official repository"
    url: "https://github.com/vitejs/vite"
  - title: "Webpack — official repository"
    url: "https://github.com/webpack/webpack"
  - title: "Rspack — official repository"
    url: "https://github.com/web-infra-dev/rspack"
  - title: "Vite 8 Release"
    url: "https://vite.dev/blog/announcing-vite8"
  - title: "Rspack Docs"
    url: "https://rspack.dev/"
  - title: "Turbopack Docs"
    url: "https://nextjs.org/docs/app/api-reference/turbopack"
---

Bundler 的工作包含 Module Graph、HMR、轉譯與 Production Chunk。Dev Server 起得快，不代表 TypeScript typecheck 與部署都會快。

## 結論先說

新建 SPA 優先 Vite；既有 Webpack 重度 plugin 系統要評估遷移驗證成本；Rspack 可以作為 Webpack 類專案的候選；Turbopack 是 Next.js 整合型路線。

## 選項比較

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Vite](https://github.com/vitejs/vite) | 83,682 | 開發回饋與 plugin 整合清楚 | Node 版本與插件需要對齊 | SPA、Demo |
| [Webpack](https://github.com/webpack/webpack) | 65,984 | 成熟 loader/plugin 配置 | 大型設定的可讀性和維護成本 | 歷史大型系統 |
| [Rspack](https://github.com/web-infra-dev/rspack) | 12,970 | Rust 核心，Webpack 遷移導向 | Plugin 等價性不可直接假定 | Webpack 專案 PoC |
| Turbopack | — | Next.js 內建開發與建置選項 | 非獨立替換 Vite 的通用工具 | Next.js |

*Stars：2026-11-03 公開 GitHub Repository 快照。不同 Repository 的範圍不完全相同；「—」代表沒有可直接對應的獨立 Repo。Stars 不是效能、穩定性、授權或採用率排名。表中的候選工具不代表作者全部使用過。*

## 核心原理與 Trade-offs

- Vite 8（2026-03-12）已採 Rolldown 做統一 Bundler；舊的「dev esbuild / build Rollup」解釋要依版本修正。
- Loader／Plugin 兼容性要用 CSS、SVG、Worker、Source Map、Dynamic Import 真實 Fixture 驗證。
- Cold build、warm build、HMR、typecheck 必須分開測；測量數字沒有控制 Cache/CPU/版本就無法比較。

## 實際專案的選型依據

[vite-ts-basic-template](https://github.com/ntustRay/vite-ts-basic-template) 與 [markdown-file-reader](https://github.com/ntustRay/markdown-file-reader) 都能作為 Vite 使用案例；不代表已有同環境 Rspack Benchmark。

## 導入前的驗收步驟

1. 固定平台版本與相同 commit，比較 cold、warm build。
2. 逐步遷移一個真實入口，核對 import、CSS、Worker 與 Source Map。
3. 在 CI 驗證部署後的 asset path、dynamic chunk 與錯誤堆疊。

## 什麼時候改選其他方案？

若大部分 CI 時間來自測試或 dependency install，換 Bundler 的回報可能很小，應先拆解耗時。

本文依公開 Repository、官方文件及可公開的專案設定分析，**未針對所有候選執行相同條件的 Benchmark**。新增的比較表應隨版本與需求更新，不宜把單次快照視為長期結論。
