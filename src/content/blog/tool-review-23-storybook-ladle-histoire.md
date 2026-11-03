---
title: "[Review] Storybook、Ladle、Histoire：Component 開發與測試怎麼選"
description: "Component Workbench 的主要價值是可重現 UI State、Document Controls、Interactions 與 Visual Regression。不是每個元件都需要獨立 Story，先從重用或複雜互動的"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 23
tags:
  - "Storybook"
  - "Components"
  - "Vitest"
  - "Testing"
draft: false
references:
  - title: "Storybook Repository"
    url: "https://github.com/storybookjs/storybook"
  - title: "Ladle Repository"
    url: "https://github.com/tajo/ladle"
  - title: "Histoire Repository"
    url: "https://github.com/histoire-dev/histoire"
  - title: "Storybook Docs"
    url: "https://storybook.js.org/docs"
  - title: "Ladle Docs"
    url: "https://ladle.dev/"
  - title: "Histoire Docs"
    url: "https://histoire.dev/"
---

Component Workbench 的主要價值是可重現 UI State、Document Controls、Interactions 與 Visual Regression。不是每個元件都需要獨立 Story，先從重用或複雜互動的元件開始。

## 先說結論

跨團隊 Design System 與長期 Story 維護可選 Storybook；想輕量化 React Stories 可評估 Ladle；Vue/多框架元件情境可評估 Histoire。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Storybook](https://github.com/storybookjs/storybook) | 91,428 | 成熟 Addons、Docs、Interaction | Config/Build/Upgrade 有額外成本 | Design System |
| [Ladle](https://github.com/tajo/ladle) | 2,996 | 輕量 React Stories，啟動簡單 | 較少整合與插件 | 小型 React 元件庫 |
| [Histoire](https://github.com/histoire-dev/histoire) | 3,590 | Component Stories 與多框架方案 | 生態/版本相容要測 | Vue/多框架 Story |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- Story 必須保持資料與時鐘可重現；不能把正式 API 不穩定造成的錯誤當成 Component Bug。
- 與 Playwright/Vitest 的角色應分清：Story 表達狀態、Unit 檢查業務邏輯、E2E 驗證端到端行為。
- Visual Snapshot 要處理 Font、DPR、Animation、Time Zone 和 Baseline Approval，否則大量差異只是雜訊。

## 實際使用案例

公開的 [react-datetime-range-picker](https://github.com/ntustRay/react-datetime-range-picker) 則可用作元件 API 與交互驗收案例。

## 導入驗收

1. 先做 Default、Disabled、Loading、Error、Responsive 五種 Story。
2. 驗證型別、安全預設值、鍵盤操作與無障礙。
3. 用固定資料抓 Baseline，測升版、部署及 Review 流程。

## 什麼時候不要換工具

只有一兩個簡單靜態元件時，獨立 Demo 與 Unit Test 更省成本；Storybook 的治理收益來自規模。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
