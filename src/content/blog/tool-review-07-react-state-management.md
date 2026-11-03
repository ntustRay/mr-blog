---
title: "[Review] React State Management：Zustand、Redux Toolkit、Jotai 還是 Context"
description: "先把 state 分成 Server Data、URL State、Form State 和跨元件 Client State。把全部東西放進全域 Store 會提高訂閱與同步成本。"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 7
tags:
  - "React"
  - "Zustand"
  - "State Management"
  - "TypeScript"
draft: false
references:
  - title: "Zustand Repository"
    url: "https://github.com/pmndrs/zustand"
  - title: "Redux Toolkit Repository"
    url: "https://github.com/reduxjs/redux-toolkit"
  - title: "Jotai Repository"
    url: "https://github.com/pmndrs/jotai"
  - title: "Zustand Docs"
    url: "https://zustand.docs.pmnd.rs/"
  - title: "Redux Toolkit Docs"
    url: "https://redux-toolkit.js.org/"
  - title: "Jotai Docs"
    url: "https://jotai.org/"
---

先把 state 分成 Server Data、URL State、Form State 和跨元件 Client State。把全部東西放進全域 Store 會提高訂閱與同步成本。

## 結論

中小型 Client State 與簡單共用動作可先評估 Zustand；大型事件流程、需要標準化 middleware 與 DevTools 的團隊評估 Redux Toolkit；細粒度訂閱適合 Jotai；低頻、小範圍共用值用 Context 即可。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Zustand](https://github.com/pmndrs/zustand) | 58,893 | API 精簡、selector 訂閱、容易漸進採用 | Store 邊界與規範要自行制定 | 中小型共享狀態 |
| [Redux Toolkit](https://github.com/reduxjs/redux-toolkit) | 11,239 | 事件與資料流明確、tooling 充足 | Reducer/Action 模型有樣板成本 | 大型協作應用 |
| [Jotai](https://github.com/pmndrs/jotai) | 21,306 | Atom 層級拆分與依賴組合 | Atom 數量與依賴圖要管理 | 細粒度互動 |
| Context | — | React 原生、不需新增套件 | Provider value 更新可能影響 Consumer | 低頻設定與主題 |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- 訂閱範圍比 Store 名稱更重要；大規模資料要避免每次 Pan/Zoom 都重新建立物件或通知整棵樹。
- Server cache、URL filter 與 Client UI state 是不同生命週期，重複保存容易產生同步 bug。
- Persist、DevTools、transaction、多 tab 同步屬獨立需求，不可假設每個工具都有相同保證。

## 實際應用

公開的 [React 分析練習](https://github.com/ntustRay/analysis-react-vite-tailwind-zustand) 使用 Zustand；實務上應先測 selector 是否只讓受影響 Component 更新，再決定是否需要更複雜模式。

## 導入前驗收

1. 刻意修改不相關欄位，確認 React Profiler 不產生多餘 Commit。
2. 測試 Reset、Derived State、非同步錯誤、Strict Mode 與切頁返回。
3. 保留真實 UI fixture，比較跨頁同步與 debugging 成本。

## 何時改選？

若 Context 足夠而更新頻率低，不需要導入全域 Store；若狀態與後端同步複雜，先確認是否該由 Server Query/Cache 處理。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
