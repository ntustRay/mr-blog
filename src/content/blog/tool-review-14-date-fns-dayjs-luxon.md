---
title: "[Review] date-fns、Day.js、Luxon：日期處理與 Picker 怎麼選"
description: "日期 API 最容易混淆 UTC Instant、Local Date、Timezone 與 Range End Inclusive/Exclusive。先定義資料契約，再選操作 Library；Picker UI 是另一層問題。"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 14
tags:
  - "TypeScript"
  - "Date Time"
  - "React"
draft: false
references:
  - title: "date-fns Repository"
    url: "https://github.com/date-fns/date-fns"
  - title: "Day.js Repository"
    url: "https://github.com/iamkun/dayjs"
  - title: "Luxon Repository"
    url: "https://github.com/moment/luxon"
  - title: "React Day Picker Repository"
    url: "https://github.com/gpbl/react-day-picker"
  - title: "date-fns Docs"
    url: "https://date-fns.org/"
  - title: "Day.js Docs"
    url: "https://day.js.org/"
  - title: "Luxon Docs"
    url: "https://moment.github.io/luxon/"
---

日期 API 最容易混淆 UTC Instant、Local Date、Timezone 與 Range End Inclusive/Exclusive。先定義資料契約，再選操作 Library；Picker UI 是另一層問題。

## 結論

以純函式搭配 Date 操作可先選 date-fns；需要鏈式輕量 API 可選 Day.js；需要明確 Zone 與 DateTime 模型可選 Luxon。React Day Picker 是 UI 層，不應拿來跟前三者比日期解析速度。

## 比較表

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [date-fns](https://github.com/date-fns/date-fns) | 36,657 | 函式組合、TypeScript 友善 | 需自己約定 timezone/data model | 純 Date 運算 |
| [Day.js](https://github.com/iamkun/dayjs) | 48,657 | 簡潔鏈式 API、插件模式 | Plugin 與 timezone 設定需一致 | 簡單日期顯示 |
| [Luxon](https://github.com/moment/luxon) | 16,456 | DateTime/Zone API 清楚 | 物件抽象與 bundle 成本 | 時區密集需求 |
| [React Day Picker](https://github.com/gpbl/react-day-picker) | 6,864 | Calendar UI、鍵盤互動 | 不是日期儲存與查詢引擎 | Date Picker 視覺元件 |

*Stars：2026-11-03 官方 GitHub Repository 快照。工具、API、框架和服務的 Repository 範圍不同；「—」表示無可直接比較的獨立 Repository。Stars 並非效能、穩定性或市場佔有率。比較對象不代表作者全部使用過。*

## 核心 Trade-offs

- 資料庫/圖表的 Range 建議用 timestamp 或 ISO instant 明確表示上下界；顯示時區只在 UI 做轉換。
- 跨 DST 的日期加一天不一定是 24 小時，應先明確業務意義是 calendar day 還是 duration。
- Date Picker 的輸入驗證、可及性與 time zone 行為需和日期工具庫分開測。

## 實際應用

[react-datetime-range-picker](https://github.com/ntustRay/react-datetime-range-picker) 採 timestamp-first 設計，適用於 Analytics Range Filter；文內不假稱該專案使用所有候選日期 Library。

## 導入前驗收

1. 測 DST 切換、跨月、月底、閏年與 UTC offset。
2. 測 inclusive/exclusive range、同日開始結束與未設上限。
3. 檢查 Keyboard 操作、Locale、輸入合法性及 bundle size。

## 何時改選？

若只需 format 一兩個日期，原生 Intl API 可能足夠；加入多個日期 Library 反而增加 bundle 與規格衝突。

此文是依官方文件與公開 Repo 的選型評估，不含所有候選方案的同條件效能實測。新版本發佈或負載改變時，需重新執行驗收。
