---
title: "[Review] Vercel、Cloudflare、Netlify、GitHub Pages：前端部署平台怎麼選"
description: "部署不只是 Static Hosting。先列出 SSG/SSR、Server Runtime、Cron、Env Secrets、Preview、Cache、Logs 與 Bandwidth；同一個 Next.js App 在不同平台不"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 28
tags:
  - "Vercel"
  - "Cloudflare"
  - "Netlify"
  - "Deployment"
draft: false
references:
  - title: "Vercel CLI/Platform Repository"
    url: "https://github.com/vercel/vercel"
  - title: "Cloudflare Workers SDK Repository"
    url: "https://github.com/cloudflare/workers-sdk"
  - title: "Netlify CLI Repository"
    url: "https://github.com/netlify/cli"
  - title: "Vercel Docs"
    url: "https://vercel.com/docs"
  - title: "Cloudflare Pages Docs"
    url: "https://developers.cloudflare.com/pages/"
  - title: "Netlify Docs"
    url: "https://docs.netlify.com/"
  - title: "GitHub Pages Docs"
    url: "https://docs.github.com/en/pages"
---

部署不只是 Static Hosting。先列出 SSG/SSR、Server Runtime、Cron、Env Secrets、Preview、Cache、Logs 與 Bandwidth；同一個 Next.js App 在不同平台不一定有完全相同的功能與限制。

## 先說結論

Next.js 與 Server 功能高度整合可從 Vercel 起步；Edge Workers 與全球分佈需求可評估 Cloudflare；一般 Static/Serverless 工作流可看 Netlify；純靜態 Blog 或文件可選 GitHub Pages。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Vercel CLI/Platform](https://github.com/vercel/vercel) | 16,506 | Next.js Deployment/Preview 整合 | 平台限制、功能成本與可移植性需核對 | Next.js 全端 |
| [Cloudflare Workers SDK](https://github.com/cloudflare/workers-sdk) | 4,700 | Workers/Pages/Edge 體系 | Node API 相容和部署語意不同 | Edge 驅動產品 |
| [Netlify CLI](https://github.com/netlify/cli) | 1,935 | Git Deploy/Functions 工作流 | Framework Adapter 和 Function 限制要驗證 | Static + Functions |
| GitHub Pages | — | 簡單靜態 Hosting、Git 整合 | 不能直接執行 Server API/DB | Blog/Docs |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- GitHub Stars 是 CLI/SDK 的 Repo 數字，不是 Hosting 服務的用戶數；Pages 無單一可比的產品 Repo。
- Cache/ISR/SSR 與 Edge 的執行時語意要在 Production Preview 驗證；Local dev 成功不代表正式部署相同。
- 費用包含 Function Invocation、Bandwidth/Egress、Build Minutes、Storage、Logs 與 Domain，不只看 Free Tier。

## 實際使用案例

公開 [mr-blog](https://github.com/ntustRay/mr-blog) 透過靜態建置發布到 GitHub Pages；此網站的部署需求與需要 Auth/Server Runtime 的 Next.js 產品不同。

## 導入驗收

1. 為相同專案列 Route/SSR/Edge/Storage/Cache/Secrets 的必要功能矩陣。
2. 做 Preview、Rollback、Env、SEO、404 與資產路徑驗證。
3. 使用預估請求量、Egress 與 Build 頻率估算每月成本。

## 什麼時候不要換工具

如果只有靜態 HTML/JS/CSS，沒必要為了 Serverless 功能使用複雜平台；需要高度可移植性時，標準 Node/container Self Hosting 也是選項。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
