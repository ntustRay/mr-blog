---
title: "[Review] tsdown、tsup、Rollup、Vite Library Mode：TS Library 怎麼打包"
description: "Library 發布重點是 exports、CJS/ESM、.d.ts、CSS Side Effects、Peer Dependencies 與 Consumer Compatibility；打包速度只是其中一項。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 26
tags:
  - "TypeScript"
  - "Bundler"
  - "npm"
  - "Library"
draft: false
references:
  - title: "tsdown Repository"
    url: "https://github.com/rolldown/tsdown"
  - title: "tsup Repository"
    url: "https://github.com/egoist/tsup"
  - title: "Rollup Repository"
    url: "https://github.com/rollup/rollup"
  - title: "Vite Library Mode Repository"
    url: "https://github.com/vitejs/vite"
  - title: "tsdown Guide"
    url: "https://tsdown.dev/"
  - title: "Rollup Docs"
    url: "https://rollupjs.org/"
  - title: "Vite Library Mode"
    url: "https://vite.dev/guide/build"
---

Library 發布重點是 exports、CJS/ESM、.d.ts、CSS Side Effects、Peer Dependencies 與 Consumer Compatibility；打包速度只是其中一項。

## 先說結論

TypeScript Library 可先評估 tsdown；已使用 tsup 且穩定時未必需要遷移；需要精細 Plugin/Chunk Control 可選 Rollup；既有 Vite Stack 可用 Vite Library Mode。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [tsdown](https://github.com/rolldown/tsdown) | 4,330 | TS Library 導向、與 Rolldown 生態整合 | 升版與產物契約需核對 | 新建 TS Package |
| [tsup](https://github.com/egoist/tsup) | 11,300 | 設定簡單、TS Bundle 工作流熟悉 | 維護策略與更新需追蹤 | 既有 tsup Library |
| [Rollup](https://github.com/rollup/rollup) | 26,303 | Plugin/Output 自訂能力高 | 配置和型別聲明流程較多 | 進階 Library |
| [Vite Library Mode](https://github.com/vitejs/vite) | 83,682 | 共用 Vite config/plugins | 不是所有 Package Export 情境都零設定 | 有 Vite App 的 Library |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- 正確的 package exports 比 bundling 單純成功更重要；type import、Node ESM、bundlerResolution 與 CSS import 都應由實際 Consumer 驗證。
- Tree shaking 需要 sideEffects metadata 與輸出形式配合，不可只看 Bundle Size 就判斷。
- 同時輸出 CJS/ESM 的 Dual Package Hazard 應按 Runtime 需求評估，不必盲目產生兩份。

## 實際使用案例

[react-datetime-range-picker](https://github.com/ntustRay/react-datetime-range-picker) 公開採用 tsdown、Type Declarations、Peer Dependencies 與 Consumer Checks，適合作為可檢查的 npm Library 案例。

## 導入驗收

1. 打包後在乾淨 Vite、Next.js、Node Consumer 分別 import。
2. 確認 .d.mts、exports、sideEffects、CSS 與 Peer React 不重複。
3. npm pack 後安裝 Tarball，避免只測 workspace local link。

## 什麼時候不要換工具

已有穩定 Rollup/tsup Pipeline，且實際瓶頸不在打包時，遷移後維護收益可能不高。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
