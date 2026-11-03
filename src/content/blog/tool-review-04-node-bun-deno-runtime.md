---
title: "[Review] Node.js、Bun、Deno：JavaScript Runtime 要換嗎"
description: "Runtime、Package Manager、Test Runner 要拆開。使用 bun install 並不代表 Server Runtime 已切換 Bun；先確認運行的程式及部署環境。"
pubDate: 2026-11-03
category: "Full-stack"
series: tech-stack-comparisons
seriesOrder: 4
tags:
  - "Node.js"
  - "Bun"
  - "Deno"
  - "Runtime"
draft: false
relatedPostIds:
  - "stop-using-npm-install-why-we-use-bun"
references:
  - title: "Node.js — official repository"
    url: "https://github.com/nodejs/node"
  - title: "Bun — official repository"
    url: "https://github.com/oven-sh/bun"
  - title: "Deno — official repository"
    url: "https://github.com/denoland/deno"
  - title: "Node.js API"
    url: "https://nodejs.org/api/"
  - title: "Bun Runtime"
    url: "https://bun.com/docs/runtime"
  - title: "Deno Runtime"
    url: "https://docs.deno.com/runtime/"
---

Runtime、Package Manager、Test Runner 要拆開。使用 bun install 並不代表 Server Runtime 已切換 Bun；先確認運行的程式及部署環境。

## 結論先說

Node.js 是需要最大相容性的基準線；Bun 對腳本與工具鏈適合先局部導入；Deno 可評估權限模型與 Web API 取向，前提是平台相容。

## 選項比較

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Node.js](https://github.com/nodejs/node) | 123,202 | 成熟的 npm 與 native addon 生態 | 工具組合需自行管理 | 既有 Server |
| [Bun](https://github.com/oven-sh/bun) | 96,521 | Runtime/PM/Test 整合 | Node API 與 native module 要驗證 | TS CLI、工具鏈 |
| [Deno](https://github.com/denoland/deno) | 108,794 | Permission model、Web API、TypeScript | 相依套件與部署差異 | 權限邊界明確的工具 |

*Stars：2026-11-03 公開 GitHub Repository 快照。不同 Repository 的範圍不完全相同；「—」代表沒有可直接對應的獨立 Repo。Stars 不是效能、穩定性、授權或採用率排名。表中的候選工具不代表作者全部使用過。*

## 核心原理與 Trade-offs

- 安裝速度不是 Server Throughput；要分別量 CI Install、Cold Start、長時間記憶體與 API Latency。
- 需盤點 child_process、native binary、OS file permission 與 postinstall；少一個 Runtime Bug 就可能抵銷速度收益。
- Deployment 支援、CI Runner、可觀測性與 Debugger 同樣是 Runtime 選型成本。

## 實際專案的選型依據

[engineer-stock-data](https://github.com/ntustRay/engineer-stock-data) 公開使用 Bun 的測試與資料腳本；[mr-blog](https://github.com/ntustRay/mr-blog) 採 Node/npm 建置。不同工作負載不必統一 Runtime。

## 導入前的驗收步驟

1. 列出正式執行的入口、依賴與 native add-on。
2. 固定 lockfile，在 CI 跑 TypeScript、Tests、Build、Deployment Smoke。
3. 分開量 Install、Cold Start、IO 與常駐 Memory；保留回退方案。

## 什麼時候改選其他方案？

部署平台若只保證 Node.js 相容性，或關鍵依賴使用未驗證的 native binding，維持 Node 更穩妥。

本文依公開 Repository、官方文件及可公開的專案設定分析，**未針對所有候選執行相同條件的 Benchmark**。新增的比較表應隨版本與需求更新，不宜把單次快照視為長期結論。
