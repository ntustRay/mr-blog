---
title: "[Review] Playwright、Cypress、Puppeteer：E2E 怎麼選"
description: "E2E 的價值是驗證瀏覽器實際行為，不是把所有 unit scenarios 搬進 UI。需要先區分 Cross-browser、Network Intercept、Auth Session、Visual Snapshot 與並行執行。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 22
tags:
  - "Playwright"
  - "Cypress"
  - "E2E"
  - "Testing"
draft: false
references:
  - title: "Playwright Repository"
    url: "https://github.com/microsoft/playwright"
  - title: "Cypress Repository"
    url: "https://github.com/cypress-io/cypress"
  - title: "Puppeteer Repository"
    url: "https://github.com/puppeteer/puppeteer"
  - title: "Playwright Docs"
    url: "https://playwright.dev/docs/intro"
  - title: "Cypress Docs"
    url: "https://docs.cypress.io/"
  - title: "Puppeteer Docs"
    url: "https://pptr.dev/"
---

E2E 的價值是驗證瀏覽器實際行為，不是把所有 unit scenarios 搬進 UI。需要先區分 Cross-browser、Network Intercept、Auth Session、Visual Snapshot 與並行執行。

## 先說結論

需要 Chromium/Firefox/WebKit、多角色隔離與 CI trace 可優先 Playwright；已有 Cypress workflow 且開發者熟悉可維持；以瀏覽器自動化、爬取或流程腳本為主可評估 Puppeteer。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Playwright](https://github.com/microsoft/playwright) | 99,136 | 多瀏覽器、BrowserContext、Trace | 平行測試與 fixture 設計有成本 | 產品級 E2E |
| [Cypress](https://github.com/cypress-io/cypress) | 51,018 | 互動式 Test Runner 與 Debug 體驗 | 執行模型/多瀏覽器需求需核對 | Cypress 既有團隊 |
| [Puppeteer](https://github.com/puppeteer/puppeteer) | 95,792 | Chrome Automation API 直接 | 測試框架/Assertion/Retry 需自建 | 瀏覽器操作工具 |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- Test Isolation 要隔離 Cookie、LocalStorage、DB Fixture，僅開兩個 Tab 不等於不同登入身分。
- Retry 不應掩蓋 Race Condition；應等待可觀測條件而不是 sleep 固定秒數。
- Screenshots、Trace、Video 可能含 Session/PII，CI Artifact 必須套資料保留與權限策略。

## 實際使用案例

[react-datetime-range-picker](https://github.com/ntustRay/react-datetime-range-picker) 使用 Playwright 測跨瀏覽器與互動行為；每個專案應依風險挑最重要的 E2E，而非測試越多越好。

## 導入驗收

1. 以登入、表單、上傳、錯誤回復做 4 個關鍵流程。
2. 用 2 個帳號及不同 BrowserContext 驗證隔離。
3. 在 CI 重跑 20 次，記錄失敗原因、Trace 與總耗時。

## 什麼時候不要換工具

若專案是純演算法或靜態 Script，unit/integration 即可；引入 Browser E2E 只會增加維護時間。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
