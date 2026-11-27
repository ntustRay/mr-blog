---
title: '[Guide] 用 GA4 做 GitHub Pages 瀏覽量（2）：程式架構、JSON 快取與自動部署'
description: 拆解 GA4、Apps Script、GitHub Actions 與 Astro 的實際程式，從瀏覽事件、報表轉換、JSON 快照到靜態頁面，最後附上可交給 Coding Agent 的完整實作 Prompt。
pubDate: 2026-11-27
category: 'Web Publishing & SEO'
tags: [GA4, Apps Script, GitHub Actions, GitHub Pages]
relatedPostIds: [ga4-apps-script-page-views]
draft: false
references:
  - title: GA4 Data API 指標與維度
    url: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
  - title: GA4 Data API runReport
    url: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
  - title: GA4 資料更新間隔
    url: https://support.google.com/analytics/answer/11198161?hl=zh-Hant
  - title: Google Apps Script Web Apps
    url: https://developers.google.com/apps-script/guides/web
  - title: GitHub Actions Cache
    url: https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows
  - title: MR Coding 同步程式
    url: https://github.com/ntustRay/mr-blog/blob/879aec620dbdd2f5c166b4384d1be9a4cdf324a7/scripts/sync-ga4-views.mjs
  - title: MR Financial 同步程式
    url: https://github.com/ntustRay/mr-financial-blog/blob/fe96f4b56c66e070dd92f3af3c98f4b21621b514/scripts/sync-ga4-views.mjs
---

上一篇把 GA4 的瀏覽量接到了 GitHub Pages。但這個數字到底存在哪裡？每天部署時，程式是把今天的瀏覽量加到昨天的數字上，還是重新計算？如果我現在打開一篇文章，為什麼數字不會馬上加一？

答案藏在 GitHub Actions 建置期間產生的 `.cache/ga4-views.json`。GA4 保存原始統計，GitHub Actions 定期取出累計報表並保存快照，Astro 再把數字寫入靜態網頁。整個網站不必另外維護一套資料庫。

這篇以 2026 年 11 月 27 日 MR Coding 與 MR Financial 的 Repository 實作為基礎，拆解每一步的程式。私人 Apps Script 的部分以上一篇記錄的正式架構及公開單站範例說明，並非直接公開私人專案的原始碼。

如果還沒設定 GA4 或 Apps Script，可以先看[第一篇：串接 Apps Script 與 GitHub Actions](../ga4-apps-script-page-views/)。

## 這篇的重點

- 原始瀏覽量存在 GA4；部署用的快照是 `.cache/ga4-views.json`，跨執行保存於 GitHub Actions Cache。
- `pageViews` 記錄各頁瀏覽量，`totalViews` 是本站符合查詢條件的所有頁面瀏覽量加總。每次同步都重新查詢累計數字。
- Astro 在 Build Time 讀取快照，前端不用呼叫 Apps Script 或 GA4 報表 API。代價是數字有延遲，而 Cache 也可能被清除。

## 1. 整體架構與檔案分工

系統有兩條獨立的資料流。讀者進入網站時，Google Analytics Tag 將瀏覽事件送到 GA4；到了部署時間，GitHub Actions 才會查詢報表。

<figure>
  <img src="../../images/ga4-page-views-flow.svg" width="480" height="420" alt="GA4 收集瀏覽事件，Apps Script 唯讀取回報表，GitHub Actions 整理資料並建置，GitHub Pages 發布靜態網頁。" decoding="async" />
  <figcaption>讀者的瀏覽事件與部署時的報表查詢是兩條不同的流程。發出報表請求的是 GitHub Actions。</figcaption>
</figure>

以 MR Coding 為例，相關檔案如下：

```text
mr-blog/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .cache/
│   └── ga4-views.json   # 執行期間產生
├── scripts/
│   └── sync-ga4-views.mjs
├── src/
│   ├── components/
│   │   └── ViewCount.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── home-feed.json.ts
│   │   └── posts/
│   │       └── [id].astro
│   └── utils/
│       ├── viewCounts.mjs
│       └── homeFeed.ts
└── .gitignore
```

MR Financial 也使用同一套同步程式與 JSON 格式，前端元件則依各自的頁面結構調整。

## 2. GA4 如何收集瀏覽量？

在 `src/layouts/BaseLayout.astro` 裡，網站載入 Google Analytics Tag。核心概念可以簡化成：

```js
window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

gtag('js', new Date());
gtag('config', measurementId);
```

搭配載入 Google 的 `gtag.js`，GA4 預設會收集 `page_view` 事件。這段只是說明機制，不是可直接取代正式版的完整程式。

正式版還會檢查 Production 網域、網站根路徑、canonical URL、Do Not Track、Global Privacy Control、GA 停用旗標及 URL 的 query/hash 等條件，再決定是否載入標籤。這樣可以避免把本機預覽和不適合追蹤的瀏覽計入，並降低 URL 參數中的資訊被送往第三方的風險。

因此瀏覽次數不等於 HTTP Request 次數，也不等於訪客人數。廣告阻擋、隱私設定或網路傳輸失敗，都可能讓一次瀏覽沒有被 GA4 記錄。

[查看 BaseLayout.astro](https://github.com/ntustRay/mr-blog/blob/main/src/layouts/BaseLayout.astro)。

## 3. Apps Script 怎麼取得 GA4 報表？

Apps Script 提供一個唯讀 Web App Endpoint，讓 GitHub Actions 在部署時取得 GA4 報表，不需要將 Google 帳號的存取權限交給瀏覽器。

GitHub Actions 發送的 POST Body 如下，Token 以示意值代替：

```json
{
  "sitePath": "/mr-blog/",
  "token": "YOUR_SECRET_TOKEN"
}
```

公開的單站 `Code.gs` 範例使用 `doPost()` 處理這個請求：

```js
function doPost(event) {
  try {
    const body = event?.postData?.contents;
    if (typeof body !== 'string' || body.length > 512) {
      return json({ error: 'Invalid request' });
    }

    const { sitePath, token } = JSON.parse(body);
    const expected = PropertiesService
      .getScriptProperties()
      .getProperty('GA4_APPS_SCRIPT_TOKEN');

    if (sitePath !== SITE.sitePath ||
        !matchesToken(token, expected)) {
      return json({ error: 'Unauthorized' });
    }

    const report = readViews('2020-01-01', 'today', true);
    return json({
      sitePath,
      propertyId: SITE.propertyId,
      report,
    });
  } catch {
    return json({ error: 'Report unavailable' });
  }
}
```

這個入口要先驗證 Token 和站點路徑，才能用 Apps Script 執行身分的 GA4 唯讀權限查詢。呼叫端不能任意指定 Property ID。完整範例包含 `matchesToken()`、`json()`、`readViews()` 和 `verifyGa4()`，可以直接從[公開的 Code.gs.txt](../../examples/ga4-page-views/Code.gs.txt) 取得。

MR Coding 和 MR Financial 的正式版共用一個私人 Apps Script 專案，依 `sitePath` 對應各自的 Property ID 與憑證。一般人要接第二站，也可以沿用單站範例，建立另一個 Apps Script 專案。

### GA4 查詢的兩個重要欄位

```js
dimensions: [{ name: 'pagePath' }],
metrics: [{ name: 'screenPageViews' }],
dateRanges: [{
  startDate: '2020-01-01',
  endDate: 'today',
}],
```

`pagePath` 代表網頁路徑；`screenPageViews` 代表瀏覽次數。同一個人多次瀏覽同一頁，只要事件都有被收集，就可能被計為多次。

因為兩個 Blog 共用 `ntustray.github.io` 網域，查詢時同時限制 `hostName` 和 `pagePath`。例如 MR Coding 只接受 `/mr-blog` 或以 `/mr-blog/` 開頭的路徑。

查詢從 2020 年 1 月 1 日到 GA4 資源時區的今天，實際只包含 GA4 有收集且可供報表查詢的資料。這不是每天新增的差額。

## 4. GA4 回傳的 JSON 長什麼樣？

Apps Script 包裝回傳的 `report` 裡面，是 GA4 的原始報表。假設只有兩個路徑，簡化的示意資料會長這樣：

```json
{
  "dimensionHeaders": [
    { "name": "pagePath" }
  ],
  "metricHeaders": [
    { "name": "screenPageViews" }
  ],
  "rows": [
    {
      "dimensionValues": [
        { "value": "/mr-blog/" }
      ],
      "metricValues": [
        { "value": "80" }
      ]
    },
    {
      "dimensionValues": [
        { "value": "/mr-blog/posts/ga4-apps-script-page-views/" }
      ],
      "metricValues": [
        { "value": "120" }
      ]
    }
  ],
  "rowCount": 2
}
```

瀏覽次數在 Response 中是字串。要先確認格式合法，再轉成 Number 做加總，否則 `"80" + "120"` 會得到 `"80120"`。

## 5. Node.js 如何整理瀏覽量？

負責同步的是 `scripts/sync-ga4-views.mjs`。

GitHub Actions 執行：

```bash
node scripts/sync-ga4-views.mjs \
  https://ntustray.github.io/mr-blog/
```

程式讀取環境變數，取得 Apps Script URL、Token、GA4 Property ID，再送出請求：

```js
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sitePath, token: secret }),
  signal: AbortSignal.timeout(45_000),
});

const payload = await response.json();
```

正式程式會先驗證 Endpoint 格式、HTTP Response、`payload.sitePath`、`payload.propertyId` 與 `report`。報表的 dimension、metric、列數也要正確；若出現 `dataLossFromOtherRow` 或 `subjectToThresholding`，就拒絕使用可能不完整的數字。

接下來建立兩個變數：

```js
const pageViews = new Map();
let totalViews = 0;
```

每筆路徑與瀏覽次數通過驗證後，執行以下加總。這是原始同步程式的核心迴圈：

```js
for (const row of rows) {
  const path = normalizeViewPath(row.dimensionValues?.[0]?.value);
  const value = row.metricValues?.[0]?.value;
  const views = Number(value);

  if (!path.startsWith(sitePath) ||
      typeof value !== 'string' ||
      !/^\d+$/u.test(value) ||
      !Number.isSafeInteger(views)) {
    throw new Error('GA4 Data API returned an invalid page-view row.');
  }

  pageViews.set(path, (pageViews.get(path) ?? 0) + views);
  totalViews += views;
}
```

為什麼用 Map？因為 GA4 可能將不同的 URL 格式分成幾筆。`src/utils/viewCounts.mjs` 有一個共用函式負責整理：

```js
export function normalizeViewPath(pathname) {
  const path = new URL(pathname, 'https://example.invalid').pathname;
  return `${path.replace(/(?:\/index\.html|\/+)$/u, '')}/`;
}
```

例如以下三個路徑：

```text
/mr-blog
/mr-blog/
/mr-blog/index.html
```

都會整理成 `/mr-blog/`。假設報表有三筆 10、20、30 次瀏覽，整理後該頁就是 60 次。這並不是任意 URL 都能安全合併；大小寫、不同 slug、網站轉址等情況仍需依站點規則處理。

每次執行同步都重新建立 Map，並把 `totalViews` 初始化為 0。昨天的累計是 500，今天重新查到 520，新快照就是 520，而不是 1,020。

[查看完整同步程式](https://github.com/ntustRay/mr-blog/blob/main/scripts/sync-ga4-views.mjs)。

## 6. 瀏覽量到底存在哪裡？

整理完成後，程式將 Map 轉成一般 Object：

```js
const snapshot = {
  sitePath,
  updatedAt: new Date().toISOString(),
  totalViews,
  pageViews: Object.fromEntries(pageViews),
};
```

產生的檔案是 `.cache/ga4-views.json`。假設網站有三個頁面，示意 JSON 如下：

```json
{
  "sitePath": "/mr-blog/",
  "updatedAt": "2026-11-27T04:20:00.000Z",
  "totalViews": 300,
  "pageViews": {
    "/mr-blog/": 80,
    "/mr-blog/posts/ga4-apps-script-page-views/": 120,
    "/mr-blog/projects/": 100
  }
}
```

| 欄位 | Type | 用途 |
| --- | --- | --- |
| `sitePath` | string | 確認快照屬於哪個站 |
| `updatedAt` | string | 成功建立快照的時間 |
| `totalViews` | number | 本站符合查詢條件的累計瀏覽量 |
| `pageViews` | Record<string, number> | 依正規化路徑保存各頁瀏覽量 |

`updatedAt` 不是 GA4 已經處理完所有事件的時間。全站瀏覽量也包含報表中符合條件但目前可能已經下架的頁面，不一定等於目前文章列表中數字的總和。

### 為什麼不直接覆蓋 JSON？

正式程式先寫入暫存檔，再替換原有快照：

```js
const temporaryPath = `${viewSnapshotPath}.tmp`;
await mkdir(dirname(viewSnapshotPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(snapshot)}\n`);
await rename(temporaryPath, viewSnapshotPath);
```

這樣即使查詢、驗證或寫入暫存檔的過程失敗，也比較不容易讓舊快照變成一份只寫到一半的 JSON。

兩個 Blog 的 `.gitignore` 都排除了：

```gitignore
.cache/ga4-views.json*
```

所以在 GitHub Repository 裡找不到這個檔案是正常的。它不是 GitHub Actions Variable，也不是 GitHub Secret。

## 7. GitHub Actions Cache 怎麼跨部署保存 JSON？

每次 Workflow 通常會取得新的 GitHub-hosted Runner，上一個 Runner 的檔案不能直接拿來使用。部署程式必須先從 Actions Cache 恢復快照。

```yaml
- name: Restore last GA4 totals
  uses: actions/cache/restore@v5
  continue-on-error: true
  with:
    path: .cache/ga4-views.json
    key: ga4-views-v1-${{ github.run_id }}-${{ github.run_attempt }}
    restore-keys: ga4-views-v1-
```

同步成功才將新快照保存起來：

```yaml
- name: Cache latest GA4 totals
  if: steps.ga4_views.outcome == 'success'
  uses: actions/cache/save@v5
  continue-on-error: true
  with:
    path: .cache/ga4-views.json
    key: ga4-views-v1-${{ github.run_id }}-${{ github.run_attempt }}
```

為了方便閱讀，這兩段使用版本標籤；正式 Workflow 將 Action 固定到特定 Commit SHA。

GitHub Cache 的內容不會透過相同 Key 直接更新。因此每次執行使用不同的 `run_id` 和 `run_attempt`，再透過 `restore-keys` 尋找相容的先前快照。實際可恢復哪份快照仍受 GitHub 的分支可見範圍與 Cache 保留規則限制。

Cache 可能遭到淘汰，但 GA4 仍是原始報表的來源，下次成功同步就可以重新建立當時可取得的統計快照。

在 Repository 的 Actions → Caches 可以查看 Cache Key、大小及使用狀態：

- [MR Coding Caches](https://github.com/ntustRay/mr-blog/actions/caches)
- [MR Financial Caches](https://github.com/ntustRay/mr-financial-blog/actions/caches)

這個畫面不是 JSON 瀏覽器。如果要查看完整檔案，可以在受控的 Workflow 中恢復並讀取快照，或在本機使用已授權的連線設定同步。不要把憑證輸出到 Log，也不要為了查看數字就將完整報表放進 public 目錄。

## 8. GitHub Actions 每天做什麼？

兩站的 `.github/workflows/deploy.yml` 都有以下設定：

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '17 4 * * *'
```

`17 4 * * *` 代表每天 UTC 04:17，也就是台灣時間 12:17。Push 到 main 或手動執行同一個 Workflow 也會觸發更新。

同步步驟接收以下設定：

| 名稱 | 位置 | 用途 |
| --- | --- | --- |
| `GA4_PROPERTY_ID` | Repository Variables | GA4 資源 ID |
| `GA4_APPS_SCRIPT_URL` | Repository Variables | Apps Script Web App URL |
| `GA4_APPS_SCRIPT_TOKEN` | Repository Secrets | 驗證請求的憑證 |

Apps Script 的 Script Properties 保存對應的 Token，這些欄位都不存放瀏覽量。Workflow 會依設定決定是否執行報表更新；未設定必要連線資訊的排程不會照常建置。

在正常同步情況下，一次部署向 Apps Script 取得本站的一份報表，裡面已經有各頁的瀏覽量。如果有 10,000 次讀者瀏覽但只部署一次，就不必為這 10,000 次瀏覽個別查報表。資料收集事件的用量和報表查詢用量要分開看。

實際發布時間還會受到 GitHub Actions 排隊、建置及 GA4 報表資料處理延遲影響。一般報表可能落後即時事件數小時，不能保證每天 12:17 的數字已包含中午以前的所有瀏覽。

[查看正式 Workflow](https://github.com/ntustRay/mr-blog/blob/main/.github/workflows/deploy.yml)。

## 9. Astro 怎麼讀取 JSON 並顯示數字？

`src/utils/viewCounts.mjs` 在 Build Time 使用 Node.js 讀檔：

```js
import { readFileSync } from 'node:fs';

export const viewSnapshotPath = '.cache/ga4-views.json';

function readViewSnapshot() {
  try {
    const snapshot = JSON.parse(
      readFileSync(viewSnapshotPath, 'utf8')
    );

    if (typeof snapshot?.sitePath !== 'string' ||
        !Number.isFinite(Date.parse(snapshot.updatedAt)) ||
        !Number.isSafeInteger(snapshot.totalViews) ||
        snapshot.totalViews < 0 ||
        !snapshot.pageViews ||
        typeof snapshot.pageViews !== 'object' ||
        Array.isArray(snapshot.pageViews)) return null;

    return snapshot;
  } catch {
    return null;
  }
}
```

這是目前的基本結構驗證，並非完整 JSON Schema 驗證。例如它還沒有逐一驗證 `pageViews` 中所有值的型別。若未來需要接受外部匯入的快照，可以再強化這一層。

MR Coding 會在模組中讀取快照，再確認 `sitePath` 與 Astro 的 Base Path 一致：

```js
const viewSnapshot = readViewSnapshot();

export function getViewSnapshot(basePath) {
  return viewSnapshot?.sitePath === normalizeViewPath(basePath)
    ? viewSnapshot
    : null;
}

export function getPageViewCount(snapshot, pathname) {
  return snapshot
    ? snapshot.pageViews[normalizeViewPath(pathname)] ?? 0
    : null;
}
```

這裡刻意區分 `0` 和 `null`。有快照、但其中沒有這個頁面的紀錄，就顯示 0；沒有可用的快照，就顯示「暫無資料」。0 只能代表快照中沒有這個路徑的統計值，不能保證完全沒有人瀏覽過。

### ViewCount Component

首頁的兩個數字透過 `src/components/ViewCount.astro` 顯示：

```astro
<ViewCount scope="page" label="首頁瀏覽量" />
<ViewCount scope="site" />
```

MR Coding 的元件會依 `scope` 選擇數字：

```js
if (props.scope === 'post') {
  count = props.count;
} else if (props.scope === 'site') {
  count = snapshot?.totalViews ?? null;
} else {
  count = getPageViewCount(snapshot, Astro.url.pathname);
}
```

單篇文章在 `src/pages/posts/[id].astro` 使用 `<ViewCount scope="page" />`，其餘非首頁也會在 BaseLayout 顯示適當的本頁或全站瀏覽量。元件把快照更新日期放在 title 屬性中。

### 首頁文章列表的瀏覽量

首頁要一次顯示多篇文章，不能只使用 `Astro.url.pathname`，因為那樣只會取得首頁的數字。

MR Coding 的 `src/utils/homeFeed.ts` 會依每篇文章 ID 組合路徑：

```ts
viewCount: getPageViewCount(
  snapshot,
  `${base}posts/${id}/`,
),
```

然後交給 Component：

```astro
<ViewCount scope="post" count={post.viewCount} />
```

MR Coding 另外將文章列表輸出成靜態的 `home-feed.json`，裡面有 `viewCount`，讓讀者切換篩選條件或載入更多文章時，也能取得建置時的統計結果。

`.cache/ga4-views.json` 本身留在建置環境。GitHub Pages 收到的是包含公開統計數字的 HTML，以及首頁需要的靜態 Feed，而不是整份原始 GA4 報表。這也說明了重新整理網頁為什麼不會直接更新瀏覽量：HTML 裡的數字要等下一次成功建置並發布才會改變。

原始碼：[viewCounts.mjs](https://github.com/ntustRay/mr-blog/blob/main/src/utils/viewCounts.mjs) · [ViewCount.astro](https://github.com/ntustRay/mr-blog/blob/main/src/components/ViewCount.astro) · [homeFeed.ts](https://github.com/ntustRay/mr-blog/blob/main/src/utils/homeFeed.ts)。

## 10. 如果 GA4 或 Apps Script 掛掉了怎麼辦？

Workflow 的同步步驟允許失敗後繼續執行：

```yaml
continue-on-error: true
```

查詢之前已先 Restore Cache，因此失敗時仍可能有一份之前成功取得的資料可以使用。

| 情境 | 網站行為 |
| --- | --- |
| 查詢成功 | 使用新的快照 |
| Apps Script 連線失敗或逾時 | 有效的舊快照存在就沿用 |
| GA4 報表不完整 | 拒絕覆蓋舊快照 |
| Cache 不存在且查詢失敗 | 顯示暫無資料 |
| 有快照但沒有新文章的紀錄 | 顯示 0 |
| GitHub Pages 部署失敗 | 正式網站維持上次成功發布的版本 |

因為瀏覽量只是 Blog 的輔助資訊，沒必要為了拿不到這個數字，就讓文章也無法發布。也要注意整個 Workflow 顯示綠勾，不一定代表 GA4 同步成功；必須另外查看 `Refresh public view counts` 的結果。

Workflow 還保留 Workload Identity Federation（WIF）直接查詢 GA4 Data API 的路徑。當 Apps Script URL 未設定，而且 WIF 相關設定完整時，可以用 Google 的短期唯讀 Access Token 查詢。Apps Script 查詢失敗時並不會自動切換到 WIF，這是兩條可選的連線方式。

## 11. 為什麼不使用 Database？

| 方案 | 優點 | 代價 |
| --- | --- | --- |
| GA4 + Actions Cache | 不需額外資料庫，讀取靜態頁面即可 | 數字有延遲，Cache 可能被淘汰 |
| GA4 + Database | 可以自行保存每日快照，統整歷史趨勢 | 需要管理資料同步、權限與儲存 |
| 即時 Counter API | 可以更即時地更新數字 | 需要 Backend、防濫用與額外維護 |
| JSON Commit 到 Repository | 有 Git 歷史紀錄 | 定期產生 Commit、增加 Repository 雜訊 |

目前兩個 Blog 只需要顯示累計瀏覽量，GA4 加上 Cache 就已經能滿足需求。用它當作每日歷史快照的永久儲存空間則不合適。

如果未來需要自行保存每日流量、集中管理十幾個網站的 Dashboard，或者在報表來源之外保留長期趨勢資料，再依這些需求決定是否加入持久化儲存。若只需要 GA4 本身已有的日期報表，也可以先直接查 GA4，不必立刻建立資料庫。

## 12. 如何確認自己的實作沒有問題？

1. 在 GA4 的「網頁和畫面」報表確認正式網站路徑及對應的瀏覽量。
2. 在 GitHub Actions 手動執行 Deploy to GitHub Pages，查看 `Refresh public view counts`。
3. 確認 Log 出現 `Synced GA4 views for N page paths.`，這裡的 N 是合併後的頁面路徑數。
4. 確認 `Cache latest GA4 totals` 成功、建置及部署完成。
5. 打開首頁、文章頁及文章列表，對照相同日期區間的 GA4 報表。
6. 在 Browser DevTools 的 Network 確認讀者開啟文章不會額外呼叫 Apps Script 或 GA4 報表 API。GA4 資料收集請求本身仍可能出現。
7. 在本機或隔離的測試環境模擬同步失敗、快照損壞或快照不存在，確認顯示舊值或「暫無資料」，並且網站仍可建置。

這些是驗收方法，不代表這篇文章已實際執行所有故障測試。正式首次部署驗證與截圖可參考[上一篇](../ga4-apps-script-page-views/)。

## 13. AI 一鍵實作 Prompt

如果你也有自己的 GitHub Pages 網站，可以把下面整段貼給 Codex、Claude Code 或其他能讀寫 Repository 的 Coding Agent。先讓它依你的 Framework 和現有部署流程實作，Google 帳號授權及 Secret 設定等需要本人操作的部分，請依它整理的步驟完成。

```text
你是一位資深 Full-Stack Engineer。

請分析目前的 Repository，為我的靜態網站建立
GA4 + Google Apps Script + GitHub Actions 瀏覽量統計系統。

目標：
- 首頁顯示首頁瀏覽量與全站累計瀏覽量。
- 每篇文章及其他公開頁面顯示個別瀏覽量。
- 文章列表可顯示每篇文章的瀏覽量。
- 不使用額外 Database。
- 不在瀏覽器直接呼叫 GA4 Data API。
- 保留既有 UI、文章內容與網站功能。

參考教學：
https://ntustray.github.io/mr-blog/posts/ga4-apps-script-page-views/
https://ntustray.github.io/mr-blog/posts/ga4-apps-script-page-views-2/

參考 Repository：
https://github.com/ntustRay/mr-blog

1. 分析現有網站
   - 閱讀 AGENTS.md、README 和 package.json（若存在）。
   - 確認 Framework、Build Command、正式 URL、Base Path、
     文章路由與部署流程。
   - 優先沿用既有 GA4 Tracking，不要重複發送 page_view。
   - 遵守既有隱私設定；避免將敏感 URL 參數傳給 GA4。
   - 如果不是 Astro，使用現有 Framework 的靜態建置機制，
     不要為此更換 Framework。

2. Google Apps Script
   - 提供完整 Code.gs 與 appsscript.json。
   - 啟用 Analytics Data API Advanced Service，
     只要求 analytics.readonly 權限。
   - 建立 doPost Endpoint，限制 Request Body 大小，
     使用存放於 Script Properties 的隨機 Token 驗證。
   - 根據 hostname 和 sitePath 限制查詢範圍；
     多站點使用明確的 allowlist 和各站設定。
   - 不允許呼叫端任意指定 GA4 Property ID，
     不回傳憑證或私人資料。
   - 提供 verifyGa4() 測試函式。

3. GA4 Report
   - Dimension: pagePath。
   - Metric: screenPageViews。
   - 查詢累計瀏覽量，起始日期可設定。
   - 檢查報表欄位、列數、資料門檻及資料損失。
   - 若超過單次報表列數上限，實作完整分頁或拒絕更新。
   - 不使用不完整報表覆蓋有效快照。

4. Node.js Sync Script
   - 建立 scripts/sync-ga4-views.mjs。
   - 從 Environment Variables 取得連線設定。
   - 使用 Fetch POST 呼叫 Apps Script，設定 Timeout。
   - 驗證 Endpoint、HTTP Response、Property ID、
     sitePath 和每筆路徑及非負安全整數。
   - Normalize URL Path，使用 Map 合併同頁統計。
   - 計算 totalViews 並檢查加總是否超過安全整數範圍。
   - 每次重新取得累計報表，不和舊快照重複累加。
   - 儲存至 .cache/ga4-views.json。
   - 先寫入暫存檔，再替換正式快照。
   - 將快照及暫存檔加入 .gitignore。

5. JSON Schema（示意）
   {
     "sitePath": "/my-blog/",
     "updatedAt": "2026-11-27T04:20:00.000Z",
     "totalViews": 0,
     "pageViews": {
       "/my-blog/": 0
     }
   }

6. GitHub Actions
   - 整合到現有部署 Workflow。
   - 每日台灣時間 12:17 觸發（UTC cron: 17 4 * * *）。
   - 保留 Push 和 workflow_dispatch 等既有觸發條件。
   - Build 前先 Restore 上一份 Cache。
   - 執行 Sync Script，只有成功才 Save 新 Cache。
   - 每次使用唯一 Cache Key，搭配共用 restore-keys。
   - 同步失敗時保留舊快照，首次失敗則顯示暫無資料。
   - 使用最小權限與適當的 Action 版本固定策略。
   - 最後 Build 並依既有流程部署 GitHub Pages。

7. GitHub Settings
   Repository Variables：
   - GA4_PROPERTY_ID
   - GA4_APPS_SCRIPT_URL

   Repository Secrets：
   - GA4_APPS_SCRIPT_TOKEN

   不可將 Secret 放入公開原始碼、前端 Bundle、
   GitHub Actions Log 或公開 JSON。
   不要新增需要綁定帳單的服務而未取得授權。

8. Frontend
   - 建立共用 ViewCount Component。
   - 在 Build Time 讀取並驗證瀏覽量快照。
   - 驗證快照 sitePath、時間、totalViews 與所有 pageViews 值。
   - 顯示首頁、全站、各頁及文章列表的個別瀏覽量。
   - 沒有快照時顯示「暫無資料」。
   - 有快照但沒有該頁紀錄時顯示 0。
   - 顯示快照更新日期，勿將其當作 GA4 資料完整時間。
   - 不加入額外 Runtime 報表 Fetch 或不必要的依賴。
   - 沿用現有 UI Design System。

9. 測試與驗證
   使用測試資料驗證：
   - URL Path Normalization 及同頁多筆紀錄合併。
   - totalViews 計算與不同站點的資料隔離。
   - 驗證 Token、API Response、錯誤 Property ID。
   - API Timeout、空報表、不完整報表及非法數值。
   - Cache 不存在、快照損壞及查詢失敗保留舊快照。
   - 首頁、文章頁及列表的正常、零值與無資料狀態。

   執行 Repository 既有 Build、Lint、Type Check 及相關測試。
   不要把測試資料送入正式 GA4 或覆蓋正式 Cache。

10. 交付
   - 列出新增與修改的檔案。
   - 提供完整 Apps Script 設定步驟與 GitHub
     Variables / Secrets 設定位置。
   - 說明瀏覽量的儲存位置、更新時間與錯誤處理。
   - 提供手動執行 Workflow 的驗證方式。
   - 若需要我操作 Google 或 GitHub 帳號，列出必要步驟。
   - 未執行的測試不可宣稱通過；不能存取正式環境就說明限制。
   - 未獲授權前，不要自動發布或啟用追蹤。

遵循既有 Repository 的工程規範，
優先使用簡單、容易維護的實作，
不要為了這項功能引入不必要的 Backend 或 Database。

請直接開始分析與實作。
```
