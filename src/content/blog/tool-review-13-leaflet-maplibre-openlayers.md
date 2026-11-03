---
title: "[Review] Leaflet、MapLibre GL、OpenLayers：地圖 Library 怎麼選"
description: "地圖選型要分開看 Renderer、圖磚來源、Marker 數量、互動需求與授權。Map Library 本身開源，不代表圖磚 API 可以免費無限制使用。"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 13
tags:
  - "Leaflet"
  - "MapLibre"
  - "Maps"
  - "Frontend"
draft: false
references:
  - title: "Leaflet Repository"
    url: "https://github.com/Leaflet/Leaflet"
  - title: "MapLibre GL JS Repository"
    url: "https://github.com/maplibre/maplibre-gl-js"
  - title: "OpenLayers Repository"
    url: "https://github.com/openlayers/openlayers"
  - title: "Leaflet Docs"
    url: "https://leafletjs.com/reference.html"
  - title: "MapLibre GL JS Docs"
    url: "https://maplibre.org/maplibre-gl-js/docs/"
  - title: "OpenLayers Docs"
    url: "https://openlayers.org/doc/"
---

地圖選型要分開看 Renderer、圖磚來源、Marker 數量、互動需求與授權。Map Library 本身開源，不代表圖磚 API 可以免費無限制使用。

## 結論

一般站點地圖、DOM Marker 和 2D 操作可從 Leaflet 開始；向量圖磚、大量圖層與 GPU Style 可評估 MapLibre；複雜 GIS 投影與地理功能可評估 OpenLayers。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Leaflet](https://github.com/Leaflet/Leaflet) | 45,809 | 易用、2D 點圖與 plugin 成熟 | 大量 DOM Markers 需 culling/cluster | 站點、簡易地圖 |
| [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) | 12,002 | Vector Tile、WebGL、樣式控制 | Style、GPU 與 Token Source 配置較複雜 | 大量圖層 |
| [OpenLayers](https://github.com/openlayers/openlayers) | 12,640 | 投影、Vector/GIS 功能完整 | 學習成本與 API 較高 | GIS 專業情境 |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- Marker 優化不等於單純換 Map Library：viewport culling、marker reuse、cluster 和列表摘要通常要配合產品行為。
- OSM Tile 使用政策不等於開源授權，正式服務要核對供應商的 rate、attribution 與 caching 限制。
- 地理座標距離與真實步行路徑不同；若產品要 ETA，還需要 Routing Provider。

## 實際應用

公開網站 [台北 YouBike 地圖](https://youbike-map-ixxc.vercel.app/) 用 Leaflet，站點直接顯示可借與可還，並做可視範圍更新。其原始 Repository 非公開，因此這裡僅連公開網站和一般技術原理。

## 導入前驗收

1. 用 100、1k、10k Markers 量 Pan/Zoom 與 Memory。
2. 確認各圖層 attribution、Tile Policy、CORS 與手機觸控。
3. 測試 offline、資料刷新、無效數量與 Marker Reuse。

## 何時改選？

只有當需要向量式圖層、複雜符號化或 GIS 編輯，才讓 MapLibre/OpenLayers 的學習成本變得合理。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
