---
title: "[Review] Sharp、Jimp、ImageMagick：Node.js 圖片處理怎麼選"
description: "Resize、Crop、色彩管理與轉檔會牽涉 Decode Pipeline、原生二進位、Metadata/EXIF 與記憶體。影像品質、IO 和處理速度要分開測試。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 25
tags:
  - "Sharp"
  - "Image Processing"
  - "Node.js"
draft: false
references:
  - title: "Sharp Repository"
    url: "https://github.com/lovell/sharp"
  - title: "Jimp Repository"
    url: "https://github.com/jimp-dev/jimp"
  - title: "ImageMagick Repository"
    url: "https://github.com/ImageMagick/ImageMagick"
  - title: "Sharp Docs"
    url: "https://sharp.pixelplumbing.com/"
  - title: "Jimp Repository"
    url: "https://github.com/jimp-dev/jimp"
  - title: "ImageMagick Docs"
    url: "https://imagemagick.org/"
---

Resize、Crop、色彩管理與轉檔會牽涉 Decode Pipeline、原生二進位、Metadata/EXIF 與記憶體。影像品質、IO 和處理速度要分開測試。

## 先說結論

Server 批次縮圖、格式轉換與資源效率可先評估 Sharp；想保持純 JS 可看 Jimp；需要成熟 CLI 操作與眾多影像格式可評估 ImageMagick。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Sharp](https://github.com/lovell/sharp) | 32,816 | libvips 處理流水線、Server 使用廣 | Native Binary/部署平台要驗證 | Server Image Pipeline |
| [Jimp](https://github.com/jimp-dev/jimp) | 14,671 | 以 JavaScript 為主、API 直接 | 大圖/大量圖片效能需實測 | 簡單 JS Image Ops |
| [ImageMagick](https://github.com/ImageMagick/ImageMagick) | 17,787 | CLI、格式、操作類型完整 | 程序啟動與安全 Policy 要管理 | Batch/CLI 轉檔 |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- 總耗時包含上傳、Decode、Transform、Encode 和 Storage Write；只跑 CPU Transform 不是完整 Request Benchmark。
- Color Profile、Orientation/EXIF 與 Alpha Channel 改變可能是正確性問題，不能用像素差推成壓縮品質一定較差。
- Native Dependency 導入需要固定平台/architecture、Image Size Limit、Timeout 及資源上限。

## 實際使用案例

[mr-blog](https://github.com/ntustRay/mr-blog) 的開發依賴包含 Sharp，可用於 Blog 圖像資產處理的公開案例；其他候選只做文件對照。

## 導入驗收

1. 同一組 JPEG/PNG/WebP 大小、Alpha、EXIF Fixtures。
2. 比較產物品質、尺寸、Format、Memory RSS 與 P95。
3. 測惡意超大圖片、壞檔、Timeout、Path Sanitization。

## 什麼時候不要換工具

只做瀏覽器 Canvas Resize 時，未必需要 Server Image Library；有可靠的外部影像服務可直接交由服務處理。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
