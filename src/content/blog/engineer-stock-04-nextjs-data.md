---
title: "[Guide] 工程師選股網 04：在 Next.js 接公開行情，讓網頁與 API 共用同一份 manifest"
description: "在公開教學專案新增 Server 讀取函式、頁面與 Route Handler，再用 502 驗證失敗路徑。"
pubDate: 2026-11-02
updatedDate: 2026-11-27
category: "Full-stack"
series: engineer-stock
seriesOrder: 5
tags:
- Next.js
- TypeScript
draft: false
relatedPostIds:
- engineer-stock-03-actions
- engineer-stock-05-screener-charts
references:
- title: 公開的 Next.js 選股練習與測試資料
  url: https://ntustray.github.io/mr-blog/downloads/stock-fixture-lab.zip
- title: Next.js Server and Client Components
  url: https://nextjs.org/docs/app/getting-started/server-and-client-components
- title: Next.js unstable_cache
  url: https://nextjs.org/docs/app/api-reference/functions/unstable_cache
---

從[第一課的公開練習專案](../../downloads/stock-fixture-lab.zip)開始。首頁與 `/api/v1/screener` 已能讀同一份 fixture。這次新增兩個入口，讓網頁與 JSON API 都能回答「這批行情是哪一天」。你只需要 Node.js 24 和可連上 GitHub 的網路。

## 1. 在 Server 讀一份公開快照

從[公開的 data branch](https://github.com/ntustRay/engineer-stock-data/tree/data)打開根目錄的 `manifest.json`，找 `latestTradingDate` 和 `snapshotId`。分別記下日期和批次識別值。新增下面的檔案。

```ts title="src/lib/latest-market.ts"
export async function readLatestMarket() {
  const origin = "https://raw.githubusercontent.com/ntustRay/engineer-stock-data";
  const response = await fetch(origin + "/data/manifest.json", { cache: "no-store" });
  if (!response.ok) throw new Error("行情來源回傳 " + response.status);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" ||
      !("latestTradingDate" in data) || typeof data.latestTradingDate !== "string" ||
      !("snapshotId" in data) || typeof data.snapshotId !== "string") {
    throw new Error("manifest 缺少日期或版本");
  }
  return { date: data.latestTradingDate, snapshot: data.snapshotId };
}
```

`cache: "no-store"` 方便比對這次讀到哪批。這個練習只讀一個檔。正式站一次讀索引和多個個股檔時，先解析 commit SHA，後續讀取固定在同一個 SHA，才能避開發布期間兩個檔案來自不同批次的情況。

## 2. 用同一支函式接網頁和 API

新增頁面。它是 Server Component，Server 可以直接等資料，不需要先呼叫自己的 API。

```tsx title="src/app/market/page.tsx"
import { readLatestMarket } from "@/lib/latest-market";

export default async function Market() {
  const { date, snapshot } = await readLatestMarket();
  return <main><h1>行情快照</h1><p>交易日 {date}</p><p>批次 {snapshot}</p></main>;
}
```

再新增一個 Route Handler，給想拿 JSON 的呼叫端。公開來源讀取失敗時回傳 502，讓呼叫端有明確的錯誤狀態。

```ts title="src/app/api/market/route.ts"
import { readLatestMarket } from "@/lib/latest-market";

export async function GET() {
  try {
    return Response.json(await readLatestMarket());
  } catch {
    return Response.json({ error: "無法讀取行情快照" }, { status: 502 });
  }
}
```

## 3. 比對兩個入口，再故意讀錯路徑

執行 `npm run dev`，先開 `http://localhost:3000/market`，再開 `http://localhost:3000/api/market`。把畫面的「交易日」和「批次」對照 API 的 `date` 和 `snapshot`。在同一批資料發布期間，兩者應一致。圖中是正式程式讀取資料的路徑，練習先接通左邊的 Server 分工。

<figure><img src="../../images/engineer-stock-series/04-nextjs-flow.svg" alt="正式網站的畫面與 API 各自呼叫共同讀取層，正式快照再由固定版本讀取。" loading="lazy" decoding="async" /></figure>

將 `/data/manifest.json` 暫時改成 `/data/does-not-exist.json`，重新整理 API，在 DevTools 的 Network 確認 HTTP 502。首頁的虛構股票仍能查，因為它使用本機 fixture。把檔名改回去，再確認 API 恢復 200。正式站如果頁面正常但標出舊行情，也要先看資料日期和來源。

<figure><img src="../../images/engineer-stock-series/04-production-search.webp" alt="正式站股票搜尋的日期與資料狀態，供核對實際網站如何揭露舊行情。" loading="lazy" decoding="async" /></figure>
