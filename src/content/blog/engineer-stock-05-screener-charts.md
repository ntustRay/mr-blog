---
title: '[Guide] 工程師選股網 05：接上篩選、個股與圖表'
description: 用 URL 重現篩選結果，追到篩選函式、個股資料與 ECharts，並驗證缺值與比較條件。
pubDate: 2026-11-02
category: "Data & Visualization"
series: engineer-stock
seriesOrder: 5
tags:
- Next.js
- React
- TypeScript
draft: false
relatedPostIds:
- engineer-stock-04-nextjs-data
- engineer-stock-06-auth
references:
- title: 網站程式（本文對照版本）
  url: https://github.com/ntustRay/engineer-stock-web/tree/23b2d914017adb6f6a7029f53314839e6db235be
- title: ECharts K 線資料格式
  url: https://echarts.apache.org/en/option.html#series-candlestick.data
---

系列：[1 本機啟動](../engineer-stock-01-local/) · [2 股票 JSON](../engineer-stock-02-json/) · [3 Actions](../engineer-stock-03-actions/) · [4 Next.js 資料流](../engineer-stock-04-nextjs-data/) · [5 篩選與圖表](../engineer-stock-05-screener-charts/) · [6 註冊登入](../engineer-stock-06-auth/) · [7 追蹤與 RLS](../engineer-stock-07-rls/) · [8 Vercel 部署](../engineer-stock-08-vercel/) · [9 核心架構與選型](../engineer-stock-09-architecture/) · [10 Workflow 與 API 來源](../engineer-stock-10-workflow-api-sources/)

完成這篇：從一個篩選條件，追到查詢參數、資料列與圖表。先在 fixture 模式練習，正式站畫面作為操作對照。

<figure>
  <a href="../../images/engineer-stock-series/05-query-flow.svg"><img src="../../images/engineer-stock-series/05-query-flow.svg" alt="查詢流程示意：URL 保存條件，Server 篩選資料；圖表在 Client 繪製，缺值與不可比較資料另行處理。" loading="lazy" decoding="async" /></a>
  <figcaption>查詢流程示意：URL 保存條件，Server 篩選資料；圖表在 Client 繪製，缺值與不可比較資料另行處理。</figcaption>
</figure>

## 1. 讓 URL 記住條件

以第 1 篇的 fixture 設定啟動網站。在本機依序開啟：

| 路徑 | 預期結果 |
| --- | --- |
| `/screener?per_max=15` | 只剩 `9001 測試電子` |
| `/stocks?sort=close&direction=asc` | 先顯示收盤價 51 的 `9002`，再顯示 129 的 `9001` |
| `/stocks?q=notfound` | 找不到符合條件的股票 |

重整頁面，條件仍可從 URL 還原。正式站實拍操作是名稱 `2330`、本益比最大值 `30`；數值只用來示範表單。

<figure>
  <a href="../../images/engineer-stock-series/05-screener.webp"><img src="../../images/engineer-stock-series/05-screener.webp" alt="正式站篩選表單實拍：q=2330、per_max=30。可用資料與結果會隨來源更新。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站篩選表單實拍：q=2330、per_max=30。可用資料與結果會隨來源更新。</figcaption>
</figure>

## 2. 找到篩選函式

開 `src/lib/stock-data/screener.ts`，依序找 `parseFilters` → `screen`。

`parseFilters` 把 URL 轉成條件；`screen` 依序篩選、排序、分頁。多個條件以 AND 組合。

| 原始值 | `per_max=15` 結果 |
| --- | --- |
| `12` | 保留 |
| `18` | 排除 |
| `null` | 排除 |

fixture 的 `9002` 本益比是 `null`。若轉成 0，就會錯誤通過這個條件。可調整 `per_max` 自己驗證。

## 3. 從個股頁追到圖表

開本機 `/stocks/TWSE/9001`，對照這三個位置：

| 檔案／函式 | 責任 |
| --- | --- |
| `src/app/stocks/[market]/[symbol]/page.tsx` | 讀取 market、symbol 與資料 |
| `src/lib/stock-data/client.ts` → `getStockPageData` | 固定快照版本，讀個股與財報 |
| `src/components/price-chart.tsx` → `PriceChart` | Client 繪圖，缺少開高低收的日期不畫 K 線 |

K 線餵給 ECharts 的順序是：

```ts
data: complete.map((d) => [d.open, d.close, d.low, d.high])
```

對照 `price-chart.tsx` 的 `'use client'` 與 `dynamic(..., { ssr: false })`。Server 準備資料，Client 處理互動繪圖；數值表可用來對照圖上的數字。

<figure>
  <a href="../../images/engineer-stock-series/05-stock.webp"><img src="../../images/engineer-stock-series/05-stock.webp" alt="正式站個股頁實拍：累計營收圖與各資料集日期。這張不是 K 線圖；累計 EPS 也不能當作 EPS TTM。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站個股頁實拍：累計營收圖與各資料集日期。這張不是 K 線圖；累計 EPS 也不能當作 EPS TTM。</figcaption>
</figure>

保留 30 個日曆天是上限；來源只有一個交易日時，就只有一個交易日可畫。fixture 的長度也不代表正式歷史已回補。

## 4. 比較兩家公司

開本機：

```text
/compare?stock=TWSE%3A9001&stock=TPEX%3A9002
```

應顯示兩檔的指標，財報區顯示「沒有可安全比較的同期間財報」。這是 fixture 沒有同期間財報的預期結果。

<figure>
  <a href="../../images/engineer-stock-series/05-compare.webp"><img src="../../images/engineer-stock-series/05-compare.webp" alt="正式站比較實拍：選取兩家公司。欄位可能顯示缺值，不能補成 0。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站比較實拍：選取兩家公司。欄位可能顯示缺值，不能補成 0。</figcaption>
</figure>

看 `src/lib/stock-data/compare-financials.ts`：季度、幣別、會計準則與合併／個別編制需一致，才會產生可比資料。

## 5. 跑完再自己改條件

```sh
npm test -- tests/screener.test.ts tests/compare-financials.test.ts
```

把 `per_max=15` 改成 `per_max=10`，應剩 0 筆。能指出這個判斷在 `screen`，再改排序方向，確認只是順序改變。

[下載系列程式片段、圖片與驗證紀錄](../../downloads/engineer-stock-series.zip)
