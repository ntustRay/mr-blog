---
title: "[Review] Lighthouse CI、PageSpeed Insights、WebPageTest：Web 效能驗證怎麼選"
description: "Performance Audit 需要區分 Lab Data 與 Real User Monitoring。單次 Lighthouse Score 不是全體使用者的 LCP/INP/CLS，也不能拿兩次不同網路環境的分數直接比較。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 32
tags:
  - "Lighthouse"
  - "Performance"
  - "CI/CD"
  - "Core Web Vitals"
draft: false
references:
  - title: "Lighthouse Repository"
    url: "https://github.com/GoogleChrome/lighthouse"
  - title: "Lighthouse CI Repository"
    url: "https://github.com/GoogleChrome/lighthouse-ci"
  - title: "sitespeed.io Repository"
    url: "https://github.com/sitespeedio/sitespeed.io"
  - title: "Lighthouse CI Docs"
    url: "https://github.com/GoogleChrome/lighthouse-ci"
  - title: "PageSpeed Insights Docs"
    url: "https://developers.google.com/speed/docs/insights/v5/about"
  - title: "WebPageTest Docs"
    url: "https://docs.webpagetest.org/"
---

Performance Audit 需要區分 Lab Data 與 Real User Monitoring。單次 Lighthouse Score 不是全體使用者的 LCP/INP/CLS，也不能拿兩次不同網路環境的分數直接比較。

## 我的選型結論

在 CI 做可重現的基礎品質 Gate 可用 Lighthouse CI；PageSpeed Insights 可查詢 Page Experience 相關資料；深入 Network Waterfall/Filmstrip 可用 WebPageTest 或 sitespeed.io。

## 比較表

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Lighthouse](https://github.com/GoogleChrome/lighthouse) | 31,004 | Audits 和測量標準有文件 | Lab 模擬與現場情況有落差 | 頁面基礎 Audits |
| [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | 7,126 | CI Regression Gate、Baseline 比較 | 跑分波動需控制 | Pull Request 檢查 |
| [sitespeed.io](https://github.com/sitespeedio/sitespeed.io) | 5,047 | 自動化效能分析工具鏈 | 執行環境與報告管理成本 | 自動化專項分析 |
| WebPageTest | — | Waterfall/Filmstrip/多測試情境 | 第三方服務設定與資料處理成本 | 網路載入深度診斷 |

*Stars 依 2026-11-03 官方公開 Repository 的快照；不同 Platform/SDK/CLI/概念不具直接可比性，「—」表示無合適的獨立 Repository。Stars 不能證明效能、採用率或品質。列入候選不等於作者實際使用。*

## Trade-offs

- Lighthouse/LHCI 是不同 Repo，但從同一測量生態延伸；WebPageTest 的服務功能不適合用某個 fork 的 Stars 代表。
- TTFB/LCP/INP/CLS 都受 Route、Cache、CPU、Network 與交互影響；原始 Log 比單一總分重要。
- 應保留 Lab Budget + RUM 指標；Lab 可以穩定重現，RUM 才是使用者真實環境的分布。

## 可公開的實際案例

[mr-blog](https://github.com/ntustRay/mr-blog) 的 package.json 與品質流程包含 Lighthouse CI，是可公開的建置驗證案例。

## 實作或遷移前驗收

1. 固定 Chrome、CPU Throttle、Network、Cache 和測量次數。
2. 至少測首頁、文章頁、搜尋互動三條 Route。
3. 追蹤 P75/P95 指標，分析最差模板並保存 Trace 與 Network 紀錄。

## 何時不要採用

網站沒有使用者流量或 RUM 數據時，先用 Lab 找大瓶頸，別把漂亮的 Lighthouse Score 當成產品目標。

本文依官方文件與公開 Repository 的可驗證資訊整理，沒有聲稱完成各種工具的等條件 Benchmark；版本、平台與負載條件不同時需重新評估。
