---
title: "[Review] 百萬筆資料渲染：Canvas、SVG、WebGL、WebGPU 怎麼選"
description: "這是 Browser Rendering API 的架構選型，不是四個 GitHub 套件的流行度比較。資料量、畫面像素、可見點數與每次縮放變動的工作量，決定瓶頸是否在 JS、Rasterization 或 GPU。"
pubDate: 2026-11-03
category: "Data & Visualization"
series: tech-stack-comparisons
seriesOrder: 11
tags:
  - "Canvas"
  - "SVG"
  - "WebGL"
  - "WebGPU"
draft: false
references:
  - title: "Canvas API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API"
  - title: "WebGL API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API"
  - title: "WebGPU API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API"
---

這是 Browser Rendering API 的架構選型，不是四個 GitHub 套件的流行度比較。資料量、畫面像素、可見點數與每次縮放變動的工作量，決定瓶頸是否在 JS、Rasterization 或 GPU。

## 結論

中量、高自訂 2D 可先用 Canvas；需要 DOM/Accessibility 與元素級互動時選 SVG；高密度平面批次繪圖可評估 WebGL；GPU Compute 需求明確且支援矩陣可控才評估 WebGPU。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| Canvas 2D | — | 2D API 直觀、瀏覽器支援普遍 | 大量 draw call 和 hit testing 需自建 | 中高密度 2D |
| SVG | — | DOM 結構、可選取與語意性 | 每個元素節點有 DOM 成本 | 少量可互動節點 |
| WebGL | — | GPU 批次與 Shader 處理 | Buffer/Context/Shader 需維護 | 高密度點線 |
| WebGPU | — | 新式 GPU Pipeline 與 Compute | 相容性、fallback、限制與成本高 | 需 GPU Compute |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- 10M 個原始點也不代表 10M 個畫面像素；可先做 LOD/Decimation 與 viewport culling，降低任何 Renderer 的工作。
- Canvas 的 DPR 應根據實際 backing store 設定 Transform；放大縮小不應無限制累乘 Transform 而產生偏差。
- GPU 不會替資料處理免費加速；資料上傳、Buffer 生成、shader 編譯和 pointer hit testing 都有成本。

## 實際應用

實務上要先保留可重現的資料集、操作腳本與 Performance Budget。這篇是 Renderer 原理與驗收法，不公開非公開圖表系統的資料、效能紀錄或內部介面。

## 導入前驗收

1. 建立可控的 10k/1M/10M 點 Fixtures，記錄可見點數。
2. 分開量 Data Transform、Upload、Draw、Hit Test、Zoom/Pan P95。
3. 在 DPR 1/2、不同 Browser、GPU fallback 驗證座標與記憶體。

## 何時改選？

如果大部分時間花在資料 Query 或 Tick Layout，換 WebGL/WebGPU 可能不會改進體驗；先由 Trace 找根因。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
