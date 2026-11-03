---
title: "[Review] Next.js 還有誰？主流 Web Framework 怎麼選"
description: "先區分內容網站與需要 Auth、Server 資料處理的應用。SSR 是回應 HTML 的時機，RSC 是 Component 在哪裡執行；兩者不是同義詞。"
pubDate: 2026-11-03
category: "Full-stack"
series: tech-stack-comparisons
seriesOrder: 1
tags:
  - "Next.js"
  - "Astro"
  - "React"
  - "Web Framework"
draft: false
relatedPostIds:
  - "engineer-stock-09-architecture"
references:
  - title: "Next.js — official repository"
    url: "https://github.com/vercel/next.js"
  - title: "Astro — official repository"
    url: "https://github.com/withastro/astro"
  - title: "Nuxt — official repository"
    url: "https://github.com/nuxt/nuxt"
  - title: "React Router — official repository"
    url: "https://github.com/remix-run/react-router"
  - title: "SvelteKit — official repository"
    url: "https://github.com/sveltejs/kit"
  - title: "Next.js App Router"
    url: "https://nextjs.org/docs/app"
  - title: "Astro Islands"
    url: "https://docs.astro.build/en/concepts/islands/"
  - title: "React Router Modes"
    url: "https://reactrouter.com/start/modes"
---

先區分內容網站與需要 Auth、Server 資料處理的應用。SSR 是回應 HTML 的時機，RSC 是 Component 在哪裡執行；兩者不是同義詞。

## 結論先說

內容為主、少量互動的頁面優先評估 Astro；有會員、資料處理及 React 互動流程的產品，可從 Next.js 開始；Vue 團隊則應先評估 Nuxt。

## 選項比較

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Next.js](https://github.com/vercel/next.js) | 143,235 | App Router、RSC、Route Handler 整合 | Server/Client 邊界與 Cache 需學習 | React 全端產品 |
| [Astro](https://github.com/withastro/astro) | 63,679 | Islands、Content Collections，靜態輸出自然 | 重互動與跨頁狀態需自行整合 | Blog、文件網站 |
| [Nuxt](https://github.com/nuxt/nuxt) | 61,030 | Vue 全端生態完整 | React 元件無法直接沿用 | Vue 產品 |
| [React Router](https://github.com/remix-run/react-router) | 56,632 | Framework/Data/Declarative 多種模式 | 需決定 Mode 與責任分工 | React 路由導向產品 |
| [SvelteKit](https://github.com/sveltejs/kit) | 20,895 | Server 功能搭配 Svelte | 既有 React 生態需替代 | Svelte 新專案 |

*Stars：2026-11-03 公開 GitHub Repository 快照。不同 Repository 的範圍不完全相同；「—」代表沒有可直接對應的獨立 Repo。Stars 不是效能、穩定性、授權或採用率排名。表中的候選工具不代表作者全部使用過。*

## 核心原理與 Trade-offs

- 渲染選型應以路由為單位；SSG 可以降低 request-time 成本，但不能把個人化資料建置成公開 HTML。
- RSC 能減少某些 Client JS，但資料查詢、Streaming、hydration 和 Cache invalidation 仍要分開驗證。
- 跨框架轉換包含共用 UI、狀態管理、測試與人才成本，不是重新寫 JSX 就結束。

## 實際專案的選型依據

[mr-blog](https://github.com/ntustRay/mr-blog) 使用 Astro；公開的 [ssr-csr-calculator](https://github.com/ntustRay/ssr-csr-calculator) 採 Next.js。兩者需求不同，所以沒有單一勝出者。

## 導入前的驗收步驟

1. 列出每條 Route 的 SSG、SSR、CSR、Auth 與 Cache 需求。
2. 以相同首頁、搜尋、會員頁建立 PoC，量 JS bundle、build 和 first interaction。
3. 在目標 Hosting 核對 Cookie、SEO metadata 與重新驗證策略。

## 什麼時候改選其他方案？

若現成 API 已解決業務邏輯，且介面主要是 SPA，Vite + React Router 可能更簡單；若內容為主，維持 Astro 不必為了全端名聲改 Next.js。

本文依公開 Repository、官方文件及可公開的專案設定分析，**未針對所有候選執行相同條件的 Benchmark**。新增的比較表應隨版本與需求更新，不宜把單次快照視為長期結論。
