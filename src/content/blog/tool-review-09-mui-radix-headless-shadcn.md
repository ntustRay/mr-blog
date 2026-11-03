---
title: "[Review] MUI、Radix、Headless UI、shadcn/ui：UI Library 怎麼選"
description: "先區分完整視覺元件庫、無樣式 Primitives，及複製到專案中的元件原始碼。這三種交付形式的版本與維護責任完全不同。"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 9
tags:
  - "React"
  - "UI Library"
  - "Accessibility"
  - "MUI"
draft: false
references:
  - title: "MUI Repository"
    url: "https://github.com/mui/material-ui"
  - title: "Radix UI Repository"
    url: "https://github.com/radix-ui/primitives"
  - title: "Headless UI Repository"
    url: "https://github.com/tailwindlabs/headlessui"
  - title: "shadcn/ui Repository"
    url: "https://github.com/shadcn-ui/ui"
  - title: "MUI Docs"
    url: "https://mui.com/material-ui/getting-started/"
  - title: "Radix Primitives"
    url: "https://www.radix-ui.com/primitives"
  - title: "Headless UI Docs"
    url: "https://headlessui.com/"
  - title: "shadcn Docs"
    url: "https://ui.shadcn.com/"
---

先區分完整視覺元件庫、無樣式 Primitives，及複製到專案中的元件原始碼。這三種交付形式的版本與維護責任完全不同。

## 結論

希望現成企業風格與大量元件選 MUI；要自訂視覺、保持無障礙互動，選 Radix 或 Headless UI；想持有元件原始碼並自行維護可選 shadcn/ui。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [MUI](https://github.com/mui/material-ui) | 99,298 | 元件完整、主題與文件成熟 | 客製化與 bundle 需管理 | 內部工具 |
| [Radix UI](https://github.com/radix-ui/primitives) | 19,466 | 互動與無障礙 Primitives | 樣式與 Design System 自負 | 高度客製化 |
| [Headless UI](https://github.com/tailwindlabs/headlessui) | 28,805 | 無樣式互動元件，易配 Tailwind | 完整元件組合仍需自建 | Tailwind 專案 |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | 127,210 | 把可修改原始碼放進專案 | 更新與一致性由團隊維護 | 需要掌控元件程式碼 |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- 可存取性不是安裝套件就完成，還要測 Keyboard Navigation、Focus Trap、Label、Screen Reader。
- shadcn/ui 是元件散佈模式，不是完全等價於安裝即維護的單一 UI Package；GitHub Stars 表示不同意義。
- 客製化越多，維持 Theme Token、跨產品 UI 一致性、升版回歸測試的成本越高。

## 實際應用

[analysis-react-vite-tailwind-zustand](https://github.com/ntustRay/analysis-react-vite-tailwind-zustand) 曾採 MUI；對公開練習專案，可直接觀察其組件整合方式，不需捏造元件庫之間的效能排行。

## 導入前驗收

1. 實作 Dialog、Combobox、DatePicker、Table 的同一需求。
2. 用鍵盤與 Screen Reader 跑 focus/label/escape/scroll lock。
3. 盤點 Theme override、CSS output、升版 Diff 與維護人力。

## 何時改選？

單純的 HTML controls 可以維持原生元素；只有在需要穩定互動語意時才值得增加 UI Library。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
