---
title: "[Review] Three.js、Babylon.js、PlayCanvas：Web 3D 怎麼選"
description: "3D Engine 的真正負擔是場景生命週期、材質與資產 Pipeline、Physics、Camera、Texture Memory，而非只看能否畫出一台車。"
pubDate: 2026-11-03
category: "Game Development"
series: tech-stack-comparisons
seriesOrder: 12
tags:
  - "Three.js"
  - "WebGL"
  - "Game Development"
draft: false
references:
  - title: "Three.js Repository"
    url: "https://github.com/mrdoob/three.js"
  - title: "Babylon.js Repository"
    url: "https://github.com/BabylonJS/Babylon.js"
  - title: "PlayCanvas Repository"
    url: "https://github.com/playcanvas/engine"
  - title: "Three.js Docs"
    url: "https://threejs.org/docs/"
  - title: "Babylon.js Docs"
    url: "https://doc.babylonjs.com/"
  - title: "PlayCanvas Docs"
    url: "https://developer.playcanvas.com/"
---

3D Engine 的真正負擔是場景生命週期、材質與資產 Pipeline、Physics、Camera、Texture Memory，而非只看能否畫出一台車。

## 結論

需要自行控管 Renderer、Scene 與低速車輛模擬時可選 Three.js；希望有更完整 Engine 與 Editor 能力可評估 Babylon.js、PlayCanvas。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | 117,447 | 場景、幾何與 Renderer 使用廣 | Physics、關卡、資產流程要另組 | 自訂互動與 3D 練習 |
| [Babylon.js](https://github.com/BabylonJS/Babylon.js) | 26,281 | 引擎整合工具多 | 抽象與建置體系需學習 | 完整 3D App |
| [PlayCanvas](https://github.com/playcanvas/engine) | 17,182 | Editor 與 Web 3D 工作流可整合 | 平台與資料流程需驗證 | 多人製作場景 |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- Simulation 的 fixed timestep 與 Rendering frame rate 要分離，否則裝置刷新率可能改變物理結果。
- 多相機、後照鏡與陰影會增加 draw call；GPU profiler 與 frame time 才能說明負荷。
- GLB 模型的尺寸、坐標、材質命名與貼圖大小，要先建立可替換的 Asset Contract。

## 實際應用

公開的 [parallel-parking-lab](https://github.com/ntustRay/parallel-parking-lab) 使用 Three.js，並把 Physics、Camera、Renderer 與 GLB 模型拆開。這是已有公開依據的選型案例。

## 導入前驗收

1. 同一場景實作一台車、兩種鏡頭、車位與 GLB Asset。
2. 以固定 delta time 驗證碰撞與方向盤動作。
3. 在中階手機量 CPU/GPU frame time、GPU memory 與 context loss。

## 何時改選？

若需求是大型場景協作、內建工具與動畫編輯，團隊可能比起薄渲染庫更需要完整 Engine；但把現有可運作的 Three.js 專案重寫需明確收益。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
