---
title: '[Guide] 工程師選股網 04：Next.js 怎麼把 JSON 顯示成網頁'
description: 從 Server Component 追到 GitHub SHA、快照驗證與快取，並用 API 回應核對資料模式。
pubDate: 2026-11-02
category: Web Development
tags:
- Next.js
- TypeScript
draft: false
relatedPostIds:
- engineer-stock-03-actions
- engineer-stock-05-screener-charts
references:
- title: 網站程式（本文對照版本）
  url: https://github.com/ntustRay/engineer-stock-web/tree/23b2d914017adb6f6a7029f53314839e6db235be
- title: Next.js Server and Client Components
  url: https://nextjs.org/docs/app/getting-started/server-and-client-components
- title: Next.js unstable_cache
  url: https://nextjs.org/docs/app/api-reference/functions/unstable_cache
---

系列：[1 本機啟動](../engineer-stock-01-local/) · [2 股票 JSON](../engineer-stock-02-json/) · [3 Actions](../engineer-stock-03-actions/) · [4 Next.js 資料流](../engineer-stock-04-nextjs-data/) · [5 篩選與圖表](../engineer-stock-05-screener-charts/) · [6 註冊登入](../engineer-stock-06-auth/) · [7 追蹤與 RLS](../engineer-stock-07-rls/) · [8 Vercel 部署](../engineer-stock-08-vercel/)

完成這篇：從首頁追到 JSON，知道哪些程式在 Server 執行，哪些回應能證明資料來源。

<figure>
  <a href="../../images/engineer-stock-series/04-nextjs-flow.svg"><img src="../../images/engineer-stock-series/04-nextjs-flow.svg" alt="Next.js 資料流示意：首頁與 API 共用讀取模組；同次讀取固定在一個 SHA，驗證後才使用。" loading="lazy" decoding="async" /></a>
  <figcaption>Next.js 資料流示意：首頁與 API 共用讀取模組；同次讀取固定在一個 SHA，驗證後才使用。</figcaption>
</figure>

## 1. 先找首頁的 await

回到網站 Repo，開 `src/app/page.tsx`：

```tsx title="src/app/page.tsx（節錄）"
const snapshot = await getSnapshot();
const rows = await getRows(snapshot);
```

這是 Server Component。`getSnapshot` 在 Server 執行，首頁不需要先呼叫自己的 `/api/v1/stocks`。API 是另一個入口，共用同一組資料函式。

## 2. 用固定資料看 API 結構

保留第 1 篇的 fixture 設定、執行 `npm run dev`。另開終端機：

```sh
curl -s 'http://localhost:3000/api/v1/stocks?q=9001'
```

對照這三個位置：

```json
{
  "data": { "total": 1 },
  "meta": { "source": "fixture", "fixture": true },
  "error": null
}
```

這是回應節錄，完整 `data` 還有 `rows`、`page`、`pageSize`。`source: fixture` 才能確認這次是測試資料；首頁有資料不能證明讀到正式來源。

## 3. 切到 GitHub 股票快照

停止 dev server。在根目錄 `.env.local` 改這些值，同名欄位直接改值：

```dotenv title=".env.local（股票資料設定）"
STOCK_DATA_MODE=
STOCK_DATA_OWNER=ntustRay
STOCK_DATA_REPO=engineer-stock-data
STOCK_DATA_BRANCH=data
STOCK_DATA_REF_TTL_SECONDS=900
```

重新 `npm run dev`，搜尋正式資料內的公司，再查 `/api/v1/manifest`。可用時，meta 應為 `source: verified_snapshot`、`fixture: false`。需要能連上 GitHub；連線或驗證失敗時，頁面會顯示資料狀態。

本次已驗證 fixture 的 API；正式站實拍使用的是公開快照，畫面會顯示其資料日期。

<figure>
  <a href="../../images/engineer-stock-series/04-production-search.webp"><img src="../../images/engineer-stock-series/04-production-search.webp" alt="正式站搜尋實拍；顯示日期與舊資料提示，不能把有回應解讀成當日資料。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站搜尋實拍；顯示日期與舊資料提示，不能把有回應解讀成當日資料。</figcaption>
</figure>

## 4. 追讀取與快取

在 `src/lib/stock-data/client.ts` 搜尋：

| 名稱 | 讀什麼／做什麼 |
| --- | --- |
| `freshSnapshot` | 先解析 `data` branch 的 SHA，再讀該 SHA 的 manifest 與 screener |
| `verifyDataset` | 檢查 bytes、SHA-256、Schema、snapshotId |
| `unstable_cache` | 保存已驗證的快照；SHA 重新解析的設定上限 900 秒 |
| `readConsistently` | 舊版本檔案 404 時，整批改用新 SHA 重讀一次 |

commit SHA 是版本位置，SHA-256 是檔案完整性檢查；用途不同。快取可能被平台逐出，不保證永久保有備份。

## 5. 讓測試證明版本不會混用

```sh
npm test -- tests/reader.test.ts
```

開 `tests/reader.test.ts`，找 `discards a partially read revision`。測試先讀舊版再遇到 404，應丟棄部分結果，重新讀新版 screener 與 stock；不能把舊資料列配上新個股資料。

再看 hash mismatch 的案例：完整性錯誤直接失敗，不當成 404 無限重試。本次這組測試包含在 21 個通過的 Web unit tests 中。

[下載系列程式片段、圖片與驗證紀錄](../../downloads/engineer-stock-series.zip)
