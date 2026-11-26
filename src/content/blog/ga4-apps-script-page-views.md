---
title: '[Guide] 用 GA4 做 GitHub Pages 瀏覽量：串接 Apps Script 與 GitHub Actions'
description: 從 GA4 Property ID、唯讀報表到 GitHub Pages 部署，實作首頁、文章與全站瀏覽量，並保留最近一次成功的快照。
pubDate: 2026-11-26
category: 'Web Publishing & SEO'
tags: [GA4, Apps Script, GitHub Actions, GitHub Pages]
draft: false
references:
  - title: Google Analytics Data API 指標定義
    url: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
  - title: Apps Script 的 Analytics Data 進階服務
    url: https://developers.google.com/apps-script/advanced/analyticsdata
  - title: Apps Script 進階服務與預設 Cloud 專案
    url: https://developers.google.com/apps-script/guides/services/advanced
  - title: Apps Script Web App 部署
    url: https://developers.google.com/apps-script/guides/web
  - title: GitHub Actions Secrets
    url: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
  - title: MR Coding 正式部署紀錄
    url: https://github.com/ntustRay/mr-blog/actions/runs/45841401453
  - title: MR Financial 正式部署紀錄
    url: https://github.com/ntustRay/mr-financial-blog/actions/runs/45841218347
---

MR Coding 和 MR Financial 都用 GitHub Pages。我想讓首頁能看到首頁和全站瀏覽量，也讓每篇文章有自己的數字。兩站已經用 GA4 收資料，接下來要解決的是怎麼把 GA4 的正式報表讀進靜態網站。

我先試了用 GitHub Actions 的 Workload Identity Federation 取權杖。這次專用 Cloud 專案在啟用 Analytics Data API 時跳到帳單頁，API 沒有啟用。我想先維持不綁帳單，就改用 Apps Script 的預設 Cloud 專案。它負責讀報表，GitHub Actions 在每次部署前把數字寫進快照，Astro 建置時再把數字放進 HTML。

<figure>
  <img src="../../images/ga4-page-views-flow.svg" width="480" height="420" alt="瀏覽量依序經過四個階段。GA4 收集瀏覽事件，Apps Script 唯讀查詢報表，GitHub Actions 驗證報表並將瀏覽量快照寫入網站建置，GitHub Pages 發布含瀏覽量的靜態頁面。" decoding="async" />
  <figcaption>瀏覽量會在 GitHub Actions 建置時寫入 HTML，部署完成後才會出現在網站上。</figcaption>
</figure>

## 這篇的重點

- 先在 Apps Script 讓唯讀報表跑通，再接部署。這樣遇到空值時，可以先排除 GA4 資源與授權問題。
- 每站用自己的 Property ID 和讀取憑證。GitHub Actions 抓到資料後先驗證，成功才更新快照。
- 範例從已裝 Google tag、且能在 GA4 看見資料的靜態站開始。你需要能讀報表的 Google 帳號，以及可以設定 Actions 變數和 Secrets 的 repo 權限。

## 1. 找出 GA4 資源與正式站路徑

到 GA4 的 **管理 → 資源詳細資料** 記下數字 Property ID。再到 **資料串流**，用網站 URL 和評估 ID 核對是否選對資源。網站原始碼中 `G-` 開頭的評估 ID 用於送出事件，`runReport` 所需的 ID 在資源詳細資料。GA4 的資源名稱也可能跟站名不同，例如 MR Coding 的資源叫 **MingRay**。

兩站共用 `ntustray.github.io`，所以報表同時過濾 host 和路徑。以 MR Coding 為例，保留 `/mr-blog` 和 `/mr-blog/` 底下的頁面。全站加總才會落在自己的站。這裡讀的是 `screenPageViews`，同一頁重複瀏覽會累計。 [GA4 指標定義](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)

## 2. 在 Apps Script 跑一筆唯讀報表

在 Apps Script 建立私人專案。到 **專案設定** 確認 GCP 顯示 **預設**，勾選顯示 `appsscript.json`。以下是完整的最小資訊清單。使用預設 Cloud 專案時，加入進階服務會自動啟用對應 API。 [Apps Script 進階服務](https://developers.google.com/apps-script/guides/services/advanced)

```json title="appsscript.json"
{
  "timeZone": "Asia/Taipei",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "AnalyticsData",
        "version": "v1beta",
        "serviceId": "analyticsdata"
      }
    ]
  },
  "runtimeVersion": "V8",
  "oauthScopes": ["https://www.googleapis.com/auth/analytics.readonly"]
}
```

把下面的範例貼進 `程式碼.gs`，換成自己的 Property ID、host 和路徑。範例用一個站演示，`verifyGa4` 可以直接在編輯器跑。第一次執行時，以能讀該資源的帳號完成授權，回到 **執行記錄** 看有沒有回傳 `screenPageViews`。如果回傳 0，先確認那段日期有資料，再核對篩選條件。

```js title="程式碼.gs"
const SITE = {
  propertyId: '123456789',
  hostname: 'example.github.io',
  sitePath: '/my-blog/',
};

function verifyGa4() {
  const report = readViews('7daysAgo', 'yesterday', false);
  if (report.metricHeaders?.[0]?.name !== 'screenPageViews') {
    throw new Error('GA4 report is missing screenPageViews');
  }
  console.log({
    screenPageViews: Number(report.rows?.[0]?.metricValues?.[0]?.value ?? 0),
  });
}

function doPost(event) {
  try {
    const post = event?.postData;
    if (!post || post.length > 512) return json({ error: 'Invalid request' });

    const { sitePath, token } = JSON.parse(post.contents);
    const expected = PropertiesService.getScriptProperties()
      .getProperty('GA4_APPS_SCRIPT_TOKEN');

    if (sitePath !== SITE.sitePath || !matchesToken(token, expected)) {
      return json({ error: 'Unauthorized' });
    }

    const report = readViews('2020-01-01', 'today', true);
    return json({ sitePath, propertyId: SITE.propertyId, report });
  } catch {
    return json({ error: 'Report unavailable' });
  }
}

function readViews(startDate, endDate, byPath) {
  const filter = (fieldName, matchType, value) => ({
    filter: { fieldName, stringFilter: { matchType, value, caseSensitive: true } },
  });

  return AnalyticsData.Properties.runReport({
    ...(byPath ? { dimensions: [{ name: 'pagePath' }], limit: '250000' } : {}),
    metrics: [{ name: 'screenPageViews' }],
    dateRanges: [{ startDate, endDate }],
    dimensionFilter: { andGroup: { expressions: [
      filter('hostName', 'EXACT', SITE.hostname),
      { orGroup: { expressions: [
        filter('pagePath', 'EXACT', SITE.sitePath.slice(0, -1)),
        filter('pagePath', 'BEGINS_WITH', SITE.sitePath),
      ] } },
    ] } },
  }, 'properties/' + SITE.propertyId);
}

function matchesToken(input, expected) {
  if (typeof input !== 'string' || typeof expected !== 'string'
      || input.length !== 64 || expected.length !== 64) return false;

  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
```

正式報表從 `2020-01-01` 查到今天，這個起日可換成你開始收資料的日期。查詢只能累計 GA4 這段期間實際收到的事件。 [Analytics Data 進階服務](https://developers.google.com/apps-script/advanced/analyticsdata)

## 3. 部署 Web App，讓 Actions 用憑證讀取

1. 在自己的終端機用 `openssl rand -hex 32` 產生 64 碼十六進位憑證。在 Apps Script 的 **專案設定 → 指令碼屬性**新增 `GA4_APPS_SCRIPT_TOKEN`，把剛產生的值存進去。
2. 在 Apps Script 選 **部署 → 新增部署作業 → 網頁應用程式**。執行身分選自己，存取選 **所有人**，讓沒有登入 Google 的 Actions runner 能連線。這也讓外部可以呼叫網址，因此 `doPost` 先驗證站點和憑證，通過後才查 GA4。把部署後的 `/exec` 網址留給 Actions。 [Apps Script Web App 部署](https://developers.google.com/apps-script/guides/web)
3. 到 GitHub repo 的 **Settings → Secrets and variables → Actions**，照下表設定。憑證放 **Secrets**，另外兩個值放 **Variables**。憑證只隨 HTTPS POST 送出，避開網址、Git 歷史和執行記錄。 [GitHub Actions Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)

| 位置 | 名稱 | 填入的值 |
| --- | --- | --- |
| Variables | `GA4_PROPERTY_ID` | GA4 資源的數字 ID |
| Variables | `GA4_APPS_SCRIPT_URL` | Web App `/exec` 網址 |
| Secrets | `GA4_APPS_SCRIPT_TOKEN` | 同一站存在指令碼屬性的憑證 |

兩站共用一支 Apps Script 時，把 `SITE` 改成站點清單。每筆放自己的 `sitePath`、`propertyId` 和指令碼屬性名稱。由 `doPost` 根據 `sitePath` 找出站點，拿該站的屬性驗證後，再使用預先登記的 Property ID 查詢。MR Coding 和 MR Financial 就是這樣分開配置憑證。

## 4. 在建置前寫入快照

在 MR Coding，`sync-ga4-views.mjs` 用 Node.js POST 報表，核對回傳的站點路徑和 Property ID，再檢查維度、指標、列數和 GA4 的資料完整性訊號。驗證通過後先寫暫存檔，再用 rename 更新 `.cache/ga4-views.json`。Astro 在建置時用這份檔案渲染個別頁面和全站的瀏覽量。 [完整同步腳本](https://github.com/ntustRay/mr-blog/blob/879aec620dbdd2f5c166b4384d1be9a4cdf324a7/scripts/sync-ga4-views.mjs) · [Astro 的快照讀取程式](https://github.com/ntustRay/mr-blog/blob/879aec620dbdd2f5c166b4384d1be9a4cdf324a7/src/utils/viewCounts.mjs)

下面是部署 workflow 的接線位置。若要移植到自己的專案，先把同步腳本和它依賴的快照工具放進 repo，換掉最後一行的正式站 URL，並把這個步驟放在 checkout 之後、網站建置之前。

```yaml title=".github/workflows/deploy.yml（節錄）"
- name: Refresh public view counts
  id: ga4_views
  continue-on-error: true
  env:
    GA4_PROPERTY_ID: ${{ vars.GA4_PROPERTY_ID }}
    GA4_APPS_SCRIPT_URL: ${{ vars.GA4_APPS_SCRIPT_URL }}
    GA4_APPS_SCRIPT_TOKEN: ${{ secrets.GA4_APPS_SCRIPT_TOKEN }}
  run: node scripts/sync-ga4-views.mjs https://example.github.io/my-blog/
```

完整 workflow 會先還原上次成功的快取，`ga4_views.outcome` 為 `success` 時才寫入新快取。遇到 API 錯誤，網站可用舊快照繼續部署。第一次就失敗、手上還沒有快照時，畫面會顯示「暫無資料」。 [完整部署 workflow](https://github.com/ntustRay/mr-blog/blob/879aec620dbdd2f5c166b4384d1be9a4cdf324a7/.github/workflows/deploy.yml)

## 5. 從 Actions 和正式站驗證

手動執行一次 **Deploy to GitHub Pages**。到 **build → Refresh public view counts** 確認該步驟成功，然後開正式首頁核對首頁和全站數字。Workflow 整體綠燈時也要看這一步，因為更新失敗可以走舊快照。

2026 年 11 月 26 日，兩站都先用 Apps Script 跑過最近 7 個完整日的唯讀查詢。之後部署使用累計區間，以下是當時從正式首頁讀到的公開數字。

| 網站 | 首頁累計瀏覽量 | 全站累計瀏覽量 | 正式部署紀錄 |
| --- | ---: | ---: | --- |
| MR Coding | 8 | 43 | [Actions](https://github.com/ntustRay/mr-blog/actions/runs/45841401453) |
| MR Financial | 3 | 4 | [Actions](https://github.com/ntustRay/mr-financial-blog/actions/runs/45841218347) |

這套流程適合能接受隨部署更新的靜態站。頁面上的數字會等到下一次建置才變動。要排查「GA4 明明有數字，網站卻沒變」，就依序看唯讀報表、Actions 快照更新、以及正式頁面這三個位置。
