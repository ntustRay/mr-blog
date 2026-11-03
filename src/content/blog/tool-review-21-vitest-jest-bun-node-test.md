---
title: "[Review] Vitest、Jest、Bun Test、Node Test：Unit Test 怎麼選"
description: "Test Runner 的差異不只啟動速度：ESM/TS 轉譯、Mock/Timer、DOM 模擬、Snapshot、Coverage 以及 CI 重現性，都會改變整體成本。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 21
tags:
  - "Vitest"
  - "Jest"
  - "Bun"
  - "Testing"
draft: false
references:
  - title: "Vitest Repository"
    url: "https://github.com/vitest-dev/vitest"
  - title: "Jest Repository"
    url: "https://github.com/jestjs/jest"
  - title: "Bun Test Repository"
    url: "https://github.com/oven-sh/bun"
  - title: "Node Test Repository"
    url: "https://github.com/nodejs/node"
  - title: "Vitest Features"
    url: "https://vitest.dev/guide/features"
  - title: "Jest Docs"
    url: "https://jestjs.io/docs/getting-started"
  - title: "Node Test Runner"
    url: "https://nodejs.org/api/test.html"
---

Test Runner 的差異不只啟動速度：ESM/TS 轉譯、Mock/Timer、DOM 模擬、Snapshot、Coverage 以及 CI 重現性，都會改變整體成本。

## 先說結論

Vite/TS 專案可以先採 Vitest；既有 Jest Suite 保留 Jest 直到遷移收益明確；Bun Script 可用 bun test；純 Node 的基礎模組可先評估 node:test。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Vitest](https://github.com/vitest-dev/vitest) | 17,322 | Vite config 復用、ESM/TS、Browser Mode | 環境差異與 mock 行為要核對 | Vite/TS 專案 |
| [Jest](https://github.com/jestjs/jest) | 45,471 | 生態、Mock/Snapshot 成熟 | ESM/轉譯配置需管理 | 既有 React/Jest |
| [Bun Test](https://github.com/oven-sh/bun) | 96,521 | 與 Bun Runtime 整合、TS Script 方便 | 執行環境不是 Node，API 相容需測 | Bun 工具專案 |
| [Node Test](https://github.com/nodejs/node) | 123,202 | Node 內建、零額外 Runner | DOM/Mock/Coverage 生態需自行補齊 | Node 核心模組 |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- Bun/Node 的 Stars 屬 Runtime Monorepo，不代表其 Test Runner 的使用者數；四個數字不是相同抽樣母體。
- Unit Test 要先分清 Domain Logic、DOM Component、SQL/IO Integration；同一個工具未必適合所有層級。
- 性能比較需固定 test count、transform/cache、worker count 與 coverage 模式，不可把只測 TypeScript 的速度拿來比真實 DOM Suite。

## 實際使用案例

[react-datetime-range-picker](https://github.com/ntustRay/react-datetime-range-picker) 使用 Vitest；[vite-ts-basic-template](https://github.com/ntustRay/vite-ts-basic-template) 使用 Jest；[engineer-stock-data](https://github.com/ntustRay/engineer-stock-data) 使用 Bun Test，可見三種不同脈絡。

## 導入驗收

1. 用相同 30 個 unit cases，含 mock、timer、snapshot 和 async failure。
2. 在 CI 跑 cold/warm、coverage、watch，記錄中位數與 flakiness。
3. 檢查 Transform、ESM、DOM、path alias、fake timers 的實際相容性。

## 什麼時候不要換工具

舊 Jest Suite 已穩定且不拖慢 CI 時，不必全面遷移；Node 內建 runner 足夠時，也沒有必要硬裝整套測試平台。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
