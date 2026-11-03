---
title: "[Review] ECharts、Chart.js、D3、Recharts：圖表 Library 怎麼選"
description: "圖表選型不能只看圖表類型數量。X 軸縮放、資料聚合、百萬筆資料與 Tooltip 互動會決定渲染模型、資料索引與可擴充性。"
pubDate: 2026-11-03
category: "Data & Visualization"
series: tech-stack-comparisons
seriesOrder: 10
tags:
  - "Canvas"
  - "ECharts"
  - "D3"
  - "Data Visualization"
draft: false
references:
  - title: "ECharts Repository"
    url: "https://github.com/apache/echarts"
  - title: "Chart.js Repository"
    url: "https://github.com/chartjs/Chart.js"
  - title: "D3 Repository"
    url: "https://github.com/d3/d3"
  - title: "Recharts Repository"
    url: "https://github.com/recharts/recharts"
  - title: "MUI X Charts Repository"
    url: "https://github.com/mui/mui-x"
  - title: "Apache ECharts Handbook"
    url: "https://echarts.apache.org/handbook/en/get-started/"
  - title: "Chart.js Docs"
    url: "https://www.chartjs.org/docs/latest/"
  - title: "D3 Docs"
    url: "https://d3js.org/"
---

圖表選型不能只看圖表類型數量。X 軸縮放、資料聚合、百萬筆資料與 Tooltip 互動會決定渲染模型、資料索引與可擴充性。

## 結論

常見 Dashboard 圖可先用 ECharts；中小型標準圖可考慮 Chart.js 或 Recharts；需要掌握尺度、轉換與 DOM/Canvas 控制選 D3；極大資料量需要先做可見範圍與 LOD，並非靠換 Library 就解決。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [ECharts](https://github.com/apache/echarts) | 67,668 | 豐富圖表、Canvas/SVG 與互動整合 | 大資料與封裝配置需管理 | 一般 Dashboard |
| [Chart.js](https://github.com/chartjs/Chart.js) | 67,773 | 學習曲線低、Canvas 圖表直接 | 複雜視覺需 plugin 與自訂 | 標準圖表 |
| [D3](https://github.com/d3/d3) | 113,858 | Scale、Layout、資料轉換的組合能力 | 需自己處理 Renderer 與互動 | 高度自訂圖表 |
| [Recharts](https://github.com/recharts/recharts) | 27,681 | React Component 宣告式 API | 大量 DOM/SVG 路徑需評估 | 中小型 React Dashboard |
| [MUI X Charts](https://github.com/mui/mui-x) | 5,871 | MUI Design System 整合 | MUI 生態耦合與功能層級差異 | MUI 產品 |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- Canvas 與 SVG 佔用的 DOM、hit testing、Pixel Ratio 策略不同；切換 Renderer 必須驗證 Tooltip 與 Accessibility。
- 單次傳入 10M 點不等於能在 200ms 內 Zoom/Pan；先量資料篩選、坐標變換、LOD、draw call 與 pointer interaction。
- D3 不是 ECharts 的 1:1 替代；它是低階組件工具集合，自訂能力換來更多工程責任。

## 實際應用

公開 [analysis-react-vite-tailwind-zustand](https://github.com/ntustRay/analysis-react-vite-tailwind-zustand) 使用 MUI X Charts。高密度繪圖需要另外設計 Range Query 與資料摘要，不能以此 Repo 推論百萬點 Benchmark。

## 導入前驗收

1. 以 1k、100k、1M 點使用同一資料與相同交互需求。
2. 分開量資料準備、第一次渲染、Hover 與 Zoom/Pan P95。
3. 驗證時間軸、缺值、NaN、DPR 與切頁清理。

## 何時改選？

若圖表種類固定、數據量小，現有 Library 夠用；只有特殊視覺或性能目標才值得自建 Canvas Renderer。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
