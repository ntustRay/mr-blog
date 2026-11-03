---
title: '[Guide] 工程師選股網 11：GitHub Actions 跨午夜抓錯資料日期的除錯紀錄'
description: 從兩筆失敗的 Actions logs，定位執行日期與行情日期混用的問題。修正自動日期判定、加入有限重試，再以 53 個 unit tests、CI 與正式快照確認結果。
pubDate: 2026-11-03
category: 'Dev Tools & Quality'
series: engineer-stock
seriesOrder: 11
tags:
  - GitHub Actions
  - TypeScript
  - Testing
draft: false
relatedPostIds:
  - engineer-stock-10-workflow-api-sources
  - engineer-stock-03-actions
  - engineer-stock-02-json
references:
  - title: 第一筆失敗：兩市場行情日期不同步
    url: https://github.com/ntustRay/engineer-stock-data/actions/runs/41521825195
  - title: 第二筆失敗：要求 2026-11-03 行情
    url: https://github.com/ntustRay/engineer-stock-data/actions/runs/41539878452
  - title: 修正 commit 與 regression tests
    url: https://github.com/ntustRay/engineer-stock-data/commit/a528d94292c51e85be113e42800ec073a9d5f57e
  - title: 修正後的正式發布紀錄
    url: https://github.com/ntustRay/engineer-stock-data/actions/runs/41570913973
  - title: 修正後的 CI
    url: https://github.com/ntustRay/engineer-stock-data/actions/runs/41570913865
  - title: 本次發布的固定 data 版本
    url: https://github.com/ntustRay/engineer-stock-data/tree/872b5eadadfbfa9df55d6b9e58fac5d1f7b52a65
  - title: GitHub Docs：schedule 事件與延遲限制
    url: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
---

`engineer-stock-data` 的兩筆定時更新都在 `publish` 階段失敗，`data` 仍停在 2026-10-30。第二筆的程式在台北 11 月 3 日清晨執行，卻直接要求 `2026-11-03` 行情。

修正後，自動模式依兩市場共同的官方行情日期發布，再檢查日期是否可接受。這次實際發布的是 **2026-11-02、1,986 檔普通股**。

## 這篇的重點

- 分開檢查排程時間、實際執行時間與來源資料日期。
- 自動模式使用官方共同日期；手動指定日期仍須完全相符。
- 兩市場日期不一致時有限重試，驗證失敗仍保留原快照。

這是[第 10 篇 Workflow 與 API 來源](../engineer-stock-10-workflow-api-sources/)的後續除錯，程式對照版本固定為 [`a528d94`](https://github.com/ntustRay/engineer-stock-data/commit/a528d94292c51e85be113e42800ec073a9d5f57e)。

## 1. 先定位失敗階段

打開 **Actions → Publish data → 失敗的 run → publish → Fetch, validate and atomically publish the official snapshot**。

兩筆紀錄的 `validate` 都成功，代表 Biome、TypeScript 與既有 unit tests 已通過；失敗點在讀取正式來源後的日期判斷，還沒走到更新 `data` branch。

以下是錯誤發生時間，台北時間由原始 UTC log 換算：

| 紀錄 | UTC | 台北時間 | 錯誤 |
| --- | --- | --- | --- |
| [第一筆](https://github.com/ntustRay/engineer-stock-data/actions/runs/41521825195) | 2026-11-02 20:44:26 | 2026-11-03 04:44:26 | `TWSE and TPEx quote dates do not match` |
| [第二筆](https://github.com/ntustRay/engineer-stock-data/actions/runs/41539878452) | 2026-11-02 22:45:59 | 2026-11-03 06:45:59 | `Official quotes are not ready for 2026-11-03` |

第一筆只記錄「兩市場不同日」，沒有印出各自的日期，不能據此判定是哪一個來源落後。第二筆則明確顯示程式要求 `2026-11-03`；舊 log 同樣沒有印出它實際收到的共同行情日。

## 2. 日期為什麼會抓錯

Workflow 原有兩個排程，未設定 `timezone`，依預設 UTC 解讀：

```yaml title=".github/workflows/publish-data.yml（節錄）"
schedule:
  - cron: '10 11 * * 1-5'
  - cron: '10 14 * * 1-5'
```

對應台北週一至週五 19:10、22:10。但這兩筆失敗的程式實際在隔天清晨執行。

[GitHub 官方文件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)說明 `schedule` 可能延遲；文件列出的高負載情境不能直接當成本次平台延遲的已確認原因。這裡能從 logs 確認的是實際執行時間已跨日。

原本 `src/production.ts` 的自動模式先把台北當天當成 `targetDate`，只有休市才往前找交易日。`2026-11-03` 是交易日，所以清晨執行也會要求當天資料。

| 值 | 責任 | 可以直接當作行情日期嗎？ |
| --- | --- | --- |
| cron 排程 | 決定何時嘗試啟動 | 不可以，執行可能延遲 |
| `now`／台北當天 | 判斷未來與資料新鮮度 | 不可以，來源不一定已更新 |
| 兩市場 `quoteDate` | 表示官方回應的行情日 | 一致且通過日曆檢查後才可用 |
| `asOfDate` | 對外發布的快照資料日 | 必須與驗證後的行情日一致 |

更改時區或把排程再往後移，都不能處理下一次延遲跨日。需要改的是 `targetDate` 的來源。

## 3. 用官方共同日期，保留日期邊界

<figure>
  <a href="../../images/engineer-stock-series/11-actions-date-debug.svg"><img src="../../images/engineer-stock-series/11-actions-date-debug.svg" width="1120" height="1040" alt="行情日期驗證流程：讀兩市場行情；日期不同時最多重試兩次；一致後檢查日期、快照與發布條件，失敗保留原 SHA。" loading="lazy" decoding="async" /></a>
  <figcaption>修正版流程示意。來源日期決定自動模式的資料日，驗證決定能否發布。</figcaption>
</figure>

在兩市場日期一致後，取回 `quoteDate`。以下是[修正版 `src/production.ts`](https://github.com/ntustRay/engineer-stock-data/blob/a528d94292c51e85be113e42800ec073a9d5f57e/src/production.ts)的核心節錄；`batches`、`calendars` 與 `today` 由前面的抓取、正規化與台北日期處理產生。

```ts title="src/production.ts（日期判斷節錄）"
const quoteDate = assertSameTradingDay(batches);
const targetDate = args.targetDate ?? quoteDate;

if (targetDate > today)
  throw new Error('Official quotes have a future trading date');
if (!isJointTradingDay(calendars, targetDate))
  throw new Error(`Official quotes have a non-trading date: ${targetDate}`);
if (
  !args.targetDate &&
  targetDate < previousJointTradingDay(calendars, today)
)
  throw new Error(`Official quotes are stale: ${targetDate}`);
if (quoteDate !== targetDate)
  throw new Error(`Official quotes are not ready for ${targetDate}`);
```

`previousJointTradingDay()` 查兩市場已核實的交易日曆。週一的前一個交易日可能是週五；遇到假日或補交易日，不能直接減 24 小時。

日期規則如下：

| 情況 | 處理 |
| --- | --- |
| 未指定日期，兩市場共同日期為台北當天或前一個已核實交易日 | 以該日建立快照 |
| 兩市場日期不同 | 先重試；仍不同就失敗 |
| 自動模式收到比前一交易日更舊的日期 | 視為 stale，停止發布 |
| 來源共同日期是未來或休市日 | 停止發布 |
| 手動要求 11 月 3 日，來源只有 11 月 2 日 | 不替換指定日期，停止發布 |
| 手動指定休市日 | 沿用既有行為，略過更新 |
| 新快照日期比既有快照更早 | 由既有 merge 檢查拒絕 |

這個自動模式容許來源落後一個已核實交易日，因此收盤後來源仍延遲時，也可能沿用前一日資料。`asOfDate` 必須保留真實日期，不能把舊行情標成今天；超過這個範圍才失敗。

公司名錄也改用解析後的 `targetDate` 篩選上市日。例如在 11 月 3 日建立 11 月 2 日快照時，不能把 11 月 3 日才開始交易的公司算進應有行情範圍。

## 4. 兩市場不同步，只重試日期不一致

日期不同時，每隔 30 秒重新抓取兩市場行情，最多重試 2 次，加上第一次共 3 輪。固定等待合計最多 60 秒；HTTP 逾時與網路重試另計。

修正版會印出兩市場日期，下面是 regression test 控制來源日期後的 log 節錄，**不是原始失敗 run 的日期證據**：

```json
{
  "stage": "quote-readiness",
  "status": "retry",
  "attempt": 1,
  "dates": [
    { "market": "TWSE", "asOfDate": "2026-10-30" },
    { "market": "TPEX", "asOfDate": "2026-10-29" }
  ]
}
```

Schema 不符、單一市場混入多個日期等錯誤仍立即失敗，不會用這個等待機制跳過驗證。重試耗盡後也不採用其中一個市場的日期；原快照保持不變。

## 5. 用固定時間重現，再跑 regression tests

原有 ingestion test 的 `now` 是週六 `2026-10-31T12:00:00Z`，fixture 行情是週五 10 月 30 日。舊程式會在週末往前推，所以這個案例無法涵蓋「隔天仍是交易日」的錯誤。

新增測試使用固定 fixture 與注入的 `now`、`fetchImpl`、`sleep`，不等待真實排程，也不連正式 API：

| 測試條件 | 預期 |
| --- | --- |
| 台北 11 月 2 日 23:59:59，兩市場都是 11 月 2 日 | 發布日維持 11 月 2 日 |
| 台北 11 月 3 日 00:00:00／06:45，兩市場仍是 11 月 2 日 | 發布日仍是 11 月 2 日 |
| 明確指定 11 月 3 日，來源只有 11 月 2 日 | 拒絕 |
| 一個市場第一次落後，第二輪追上 | 重抓兩市場一次後成功 |
| 三輪日期都不一致 | 固定等待兩次後拒絕 |
| 未來、休市、超過新鮮度範圍的來源日期 | 拒絕 |
| 公司到隔天才上市 | 不加入前一天快照 |

完整測試在 [`tests/production.test.ts`](https://github.com/ntustRay/engineer-stock-data/blob/a528d94292c51e85be113e42800ec073a9d5f57e/tests/production.test.ts) 與 [`tests/calendar.test.ts`](https://github.com/ntustRay/engineer-stock-data/blob/a528d94292c51e85be113e42800ec073a9d5f57e/tests/calendar.test.ts)。在資料 Repo 安裝依賴後，可重跑：

```sh
bun run check
bun run typecheck
bun test tests
bun run fixture
bun run verify
bun run schema
git diff --exit-code -- schemas/
```

本次本機結果為 **53 pass、0 fail**。Biome、TypeScript、fixture 快照驗證及 Schema 差異檢查通過；[修正後 CI](https://github.com/ntustRay/engineer-stock-data/actions/runs/41570913865) 也成功。unit tests 的成功範圍是這些固定案例，正式來源仍須另外驗證。

## 6. 確認真的發布，不能只看綠勾

推送 `main` 後，[Publish data run](https://github.com/ntustRay/engineer-stock-data/actions/runs/41570913973) 的 `validate`、`publish` 都成功。正式來源在這次執行中解析出的日期如下：

```json
{
  "stage": "quote-date",
  "today": "2026-11-03",
  "targetDate": "2026-11-02",
  "mode": "latest-official"
}
```

再對照 `stage: publish`、本次固定 `data` 版本的 `manifest.json` 與遠端驗證：

| 項目 | 實際結果 |
| --- | --- |
| 行情日期 | 2026-11-02 |
| 普通股數 | 1,986 |
| `data` commit | `872b5eadadfbfa9df55d6b9e58fac5d1f7b52a65` |
| `manifest.counts.tradingDates` | 2，保留的有效日期由原本 1 日增加為 2 日 |
| 遠端快照驗證 | `status: verified`，日期與股票數一致 |

遠端驗證命令：

```sh
bun src/verify-remote.ts
```

本次讀回結果的欄位節錄：

```json
{
  "status": "verified",
  "securities": 1986,
  "asOfDate": "2026-11-02"
}
```

這次成功由 **push** 觸發，確認修正版能抓正式來源、驗證並更新快照；尚不能據此宣稱未來的 `schedule` 都會準時，或所有來源日期不同步都能在 60 秒內恢復。後續遇到相同錯誤，先對照 `quote-readiness.dates` 與 `quote-date`，再決定是來源延遲、資料過舊，還是程式規則需要調整。
