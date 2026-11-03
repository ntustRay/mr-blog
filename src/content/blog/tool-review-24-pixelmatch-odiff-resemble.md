---
title: "[Review] Pixelmatch、odiff、Resemble.js：圖片差異比對怎麼選"
description: "圖片比對要先定義 Difference Contract：RGBA 像素差、感知色差、抗鋸齒、忽略區域及容差計算方式。速度高不代表輸出等價。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 24
tags:
  - "Pixelmatch"
  - "Visual Regression"
  - "Image Diff"
  - "Performance"
draft: false
relatedPostIds:
  - "visual-regression-01-nextjs-bun-biome"
references:
  - title: "Pixelmatch Repository"
    url: "https://github.com/mapbox/pixelmatch"
  - title: "odiff Repository"
    url: "https://github.com/dmtrKovalenko/odiff"
  - title: "Resemble.js Repository"
    url: "https://github.com/rsmbl/Resemble.js"
  - title: "Pixelmatch README"
    url: "https://github.com/mapbox/pixelmatch"
  - title: "odiff README"
    url: "https://github.com/dmtrKovalenko/odiff"
  - title: "Resemble.js README"
    url: "https://github.com/rsmbl/Resemble.js"
---

圖片比對要先定義 Difference Contract：RGBA 像素差、感知色差、抗鋸齒、忽略區域及容差計算方式。速度高不代表輸出等價。

## 先說結論

純 JS、在 Browser 做簡單對比可先用 Pixelmatch；需要大量圖片批次與 Native Binary 可評估 odiff；需要不同視覺差異分析方式可研究 Resemble.js。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Pixelmatch](https://github.com/mapbox/pixelmatch) | 7,007 | 輕量、像素級比較 API 清楚 | 需先 Decode、逐像素 CPU 計算 | Browser/小批次 |
| [odiff](https://github.com/dmtrKovalenko/odiff) | 3,288 | Zig/SIMD Native Diff，批次效能潛力 | Binary 安裝/平台/輸出語意需驗證 | Node 批次比較 |
| [Resemble.js](https://github.com/rsmbl/Resemble.js) | 4,608 | 差異分析與圖像視覺化選項 | 演算法參數與輸出一致性需核對 | 可視化比較 |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- odiff README 的速度是維護者特定硬體/圖片的 Benchmark；不可直接宣稱在自己的 10,000 張測試也快相同倍數。
- 總工作量包含 Decode、Resize/Normalize、Image IO、Diff、Encoding/Artifact Write；比較時要拆開記錄。
- 容差、抗鋸齒和 Ignore Regions 會改變 False Positive/False Negative，應以同一組人眼標記資料驗證。

## 實際使用案例

[Visual Regression Hub 教學系列](https://ntustray.github.io/mr-blog/series/visual-regression/) 以小型公開範例解釋比較流程。此處不引用私人正式產品的程式、業務圖片或未經公開驗證的吞吐數據。

## 導入驗收

1. 建立同圖、位移、字型抗鋸齒、透明度、尺寸錯誤共 5 種 Fixture。
2. 相同 CPU/圖片/格式，跑 100/1k/10k 組並記錄 IO 與 Diff 耗時。
3. 驗證 Error Rate、Memory RSS、Output Pixel Definition 與重跑一致性。

## 什麼時候不要換工具

若使用者每次只比較兩張小圖，Native Binary 分發成本可能超過節省的時間；可留在 Pixelmatch。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
