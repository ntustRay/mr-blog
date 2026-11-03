---
title: "[Review] Tauri、Electron、Wails：Desktop App 怎麼選"
description: "Desktop App 架構選型要先問：要部署哪些 OS、需要多少原生功能、是否離線，以及要不要維護獨立 Runtime。單看安裝包大小不能代表整體資源成本。"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 29
tags:
  - "Tauri"
  - "Electron"
  - "Desktop"
  - "TypeScript"
draft: false
references:
  - title: "Tauri Repository"
    url: "https://github.com/tauri-apps/tauri"
  - title: "Electron Repository"
    url: "https://github.com/electron/electron"
  - title: "Wails Repository"
    url: "https://github.com/wailsapp/wails"
  - title: "Tauri Docs"
    url: "https://v2.tauri.app/"
  - title: "Electron Docs"
    url: "https://www.electronjs.org/docs/latest/"
  - title: "Wails Docs"
    url: "https://wails.io/docs/"
---

Desktop App 架構選型要先問：要部署哪些 OS、需要多少原生功能、是否離線，以及要不要維護獨立 Runtime。單看安裝包大小不能代表整體資源成本。

## 我的選型結論

偏好 Web UI、需要小型系統 WebView 與 Rust Backend 可評估 Tauri；已熟悉 Node + Chromium、需要一致 Renderer 環境可以考慮 Electron；偏好 Go Backend 的團隊可看 Wails。

## 比較表

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Tauri](https://github.com/tauri-apps/tauri) | 112,447 | WebView 與 Rust 能力，權限 API 可限制 | 各 OS WebView 差異、Rust 打包需理解 | 跨平台工具 App |
| [Electron](https://github.com/electron/electron) | 123,727 | Chromium/Node 生態、桌面整合成熟 | Bundle、Memory 與安全硬化成本 | 較複雜桌面產品 |
| [Wails](https://github.com/wailsapp/wails) | 36,921 | Go Backend + Web UI | 插件、打包流程與平台能力需核對 | Go 開發者 |

*Stars 依 2026-11-03 官方公開 Repository 的快照；不同 Platform/SDK/CLI/概念不具直接可比性，「—」表示無合適的獨立 Repository。Stars 不能證明效能、採用率或品質。列入候選不等於作者實際使用。*

## Trade-offs

- WebView 系統版本會影響 CSS/Browser API；Electron 自帶 Chromium 可以減少差異，但帶來二進位體積。
- Desktop Security 必須管 IPC、檔案權限、Remote Content、Auto Update 簽章，不因框架選型就自動安全。
- 跨平台 App 要在 Windows/macOS/Linux 真的打包驗證，不能只看開發機成功。

## 可公開的實際案例

公開的 [markdown-file-reader](https://github.com/ntustRay/markdown-file-reader) 使用 Tauri、Marked 與 Vite；可直接核對讀取檔案與桌面殼層的分工。

## 實作或遷移前驗收

1. 三個 OS 的 Installer、開檔、儲存、URI scheme 與更新流程。
2. 量 Startup、Memory RSS、Installer Size 與 Idle CPU。
3. 針對惡意 Markdown/URL、File Permission 與 IPC Boundary 做安全測試。

## 何時不要採用

如果產品只需瀏覽器功能，不需要原生檔案/Tray/通知，PWA 可降低維護跨平台 Installer 的成本。

本文依官方文件與公開 Repository 的可驗證資訊整理，沒有聲稱完成各種工具的等條件 Benchmark；版本、平台與負載條件不同時需重新評估。
