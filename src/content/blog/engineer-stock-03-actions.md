---
title: '[Guide] 工程師選股網 03：讓 GitHub Actions 更新股票資料'
description: 手動操作既有 Workflow，對照 validate、publish、data branch 與資料日期，理解失敗時為何保留前版。
pubDate: 2026-11-02
category: Web Development
tags:
- GitHub Actions
- Bun
- TypeScript
draft: false
relatedPostIds:
- engineer-stock-02-json
- engineer-stock-04-nextjs-data
references:
- title: 資料 Pipeline（本文對照版本）
  url: https://github.com/ntustRay/engineer-stock-data/tree/c1633aeffe68d4ad95e88ea403d1bfbc1585f70e
- title: GitHub Workflow events
  url: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- title: 已核對的 Publish data run
  url: https://github.com/ntustRay/engineer-stock-data/actions/runs/41200225595
---

系列：[1 本機啟動](../engineer-stock-01-local/) · [2 股票 JSON](../engineer-stock-02-json/) · [3 Actions](../engineer-stock-03-actions/) · [4 Next.js 資料流](../engineer-stock-04-nextjs-data/) · [5 篩選與圖表](../engineer-stock-05-screener-charts/) · [6 註冊登入](../engineer-stock-06-auth/) · [7 追蹤與 RLS](../engineer-stock-07-rls/) · [8 Vercel 部署](../engineer-stock-08-vercel/)

完成這篇：看懂一次資料更新，分辨「Workflow 成功」「資料有更新」「資料是哪一天」。

<figure>
  <a href="../../images/engineer-stock-series/03-actions-flow.svg"><img src="../../images/engineer-stock-series/03-actions-flow.svg" alt="資料發布流程示意：驗證與必要來源成功才更新 data；失敗保留前版 SHA。" loading="lazy" decoding="async" /></a>
  <figcaption>資料發布流程示意：驗證與必要來源成功才更新 data；失敗保留前版 SHA。</figcaption>
</figure>

## 1. 開啟既有 Workflow

進入資料 Repo 的 **Actions → Publish data**。對照 `.github/workflows/publish-data.yml`。

<figure>
  <a href="../../images/engineer-stock-series/03-actions.webp"><img src="../../images/engineer-stock-series/03-actions.webp" alt="GitHub Actions 實拍；這是既有執行紀錄，非本次重新觸發發布。" loading="lazy" decoding="async" /></a>
  <figcaption>GitHub Actions 實拍；這是既有執行紀錄，非本次重新觸發發布。</figcaption>
</figure>

有寫入權限時，點 **Run workflow**，branch 選 `main`。`targetDate` 先留空、`forceRefresh` 保持 false，再送出。本文沒有代你觸發股票更新；這一步留給自己操作。

## 2. 看兩個 job 的責任

| Job | 執行內容 | 成功後 |
| --- | --- | --- |
| `validate` | 安裝、Biome、TypeScript、unit tests | 才會開始 `publish` job |
| `publish` | 讀官方來源、驗證快照、發布 | 可能更新 `data` branch，也可能合法略過 |

`publish` 透過 `needs: validate` 等待檢查；只有這個 job 有 `contents: write`。`concurrency` 搭配發布程式的 lease 檢查，避免更新互相覆蓋。

## 3. 對照排程與台北時間

既有設定使用 UTC：

```yaml title=".github/workflows/publish-data.yml（節錄）"
schedule:
  - cron: '10 11 * * 1-5'
  - cron: '10 14 * * 1-5'
```

| UTC | 台北時間 |
| --- | --- |
| 週一至週五 11:10 | 週一至週五 19:10 |
| 週一至週五 14:10 | 週一至週五 22:10 |

[GitHub 排程可能延遲](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)；來源日期、交易日曆仍由程式檢查。排程到點不代表來源已經更新。

## 4. 打開執行紀錄中的 JSON

在 publish step 或 Summary 找：

| 欄位／訊息 | 代表什麼 |
| --- | --- |
| `asOfDate` | 行情所屬交易日 |
| `snapshotId` | 這批資料的識別 |
| `commitSha` | 發布後網站會讀取的版本 |
| `stage: skip`、`reason: unchanged` | 內容相同，這次不重發 |
| `reason: non_trading_day` | 交易日判斷後略過 |

核對 [既有成功發布紀錄](https://github.com/ntustRay/engineer-stock-data/actions/runs/41200225595)。本次查到的這筆 run 為 success；沒有把它當成本次重新發布的結果。

## 5. 到 data branch 核對結果

切換 branch 為 `data`，開 `manifest.json`，核對 `latestTradingDate`、`snapshotId`、`counts`。再確認網站的資料日期。

本專案以新的 root commit 替換 `data`，只保留一個可達版本；GitHub 不保證立即清除不可達 objects。要研究歷史變化，需另外保存快照。

## 6. 自己判讀一次失敗

先看最後一個通過的階段，再對照：

| 卡住位置 | 查哪裡 |
| --- | --- |
| validate | unit test、Biome 或 TypeScript 的第一個錯誤 |
| 來源讀取／日期 | `config/sources.yml`、交易日曆、來源實際日期 |
| 快照驗證 | `src/verify.ts`、manifest 的 hash 與資料期間 |
| push lease | 是否已有人發布另一版；先重新讀取遠端版本 |

確認失敗時 `data` 的 SHA 沒有被換掉，再修正原因。完整資料檢查在 `verify-data.yml`；它與「抓新資料」是不同任務。

[下載系列程式片段、圖片與驗證紀錄](../../downloads/engineer-stock-series.zip)
