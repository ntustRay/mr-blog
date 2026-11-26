---
title: '[Guide] 用 GA4 做 GitHub Pages 瀏覽量：串接 Apps Script 與 GitHub Actions'
description: 跟著實際畫面，把 GA4 正式瀏覽量放到 Astro 網站。從找 ID、跑第一份唯讀報表到部署，算清楚每天台灣時間幾點更新、查幾次，以及兩站怎麼在不綁帳單下運作。
pubDate: 2026-11-26
category: 'Web Publishing & SEO'
tags: [GA4, Apps Script, GitHub Actions, GitHub Pages]
draft: false
references:
  - title: Google Analytics 標準版與資料更新間隔
    url: https://support.google.com/analytics/answer/11198161?hl=zh-Hant
  - title: Analytics Data API 配額與計算方式
    url: https://developers.google.com/analytics/devguides/reporting/data/v1/quotas
  - title: Apps Script 進階服務與預設 Cloud 專案
    url: https://developers.google.com/apps-script/guides/services/advanced
  - title: Apps Script 部署網頁應用程式
    url: https://developers.google.com/apps-script/guides/web
  - title: GitHub Actions 計費
    url: https://docs.github.com/en/billing/concepts/product-billing/github-actions
  - title: MR Coding 正式部署紀錄
    url: https://github.com/ntustRay/mr-blog/actions/runs/45841401453
  - title: MR Financial 正式部署紀錄
    url: https://github.com/ntustRay/mr-financial-blog/actions/runs/45841218347
---

部落格首頁被看了幾次？如果把每篇文章都算進來，整個站又被看了幾次？我想讓 MR Coding 和 MR Financial 的讀者打開首頁就能看到這兩個數字。兩個站本來就有裝 GA4，數字已經收在那裡。我給自己的條件是 Google Cloud 先不綁帳單，而且讀者點開文章時，不必等 Google 查完報表才能看內文。

兩站現在都由 GitHub Actions 在**每天台灣時間 12:17** 排一次更新。它請 Apps Script 拿一份報表，把數字寫進網頁，再交給 GitHub Pages 發布。假設你 12:18 讀了本文，頁上的數字可能跟你進來前一樣。這次瀏覽要先進 GA4 的報表，再碰上下一次成功部署，你才看得到它。

<figure>
  <img src="../../images/ga4-page-views-flow.svg" width="480" height="420" alt="GA4 收集瀏覽事件，Apps Script 唯讀取回報表，GitHub Actions 把數字寫進網頁，GitHub Pages 發布給讀者。" decoding="async" />
  <figcaption>箭頭表示數字怎麼走。每天看時間、發出查詢的是第三格 GitHub Actions。</figcaption>
</figure>

## 這篇的重點

- **更新時間**定在每天台灣時間 12:17。GitHub 可能排隊，網站要等部署成功才換數字。推送到 `main` 或手動執行同一個 workflow，也會額外觸發一次更新。
- **查詢次數**可以這樣算。一次更新查一站的整份報表，裡面已經有每個頁面的瀏覽量。只算排程，每站每天 1 次，兩站合計 2 次。讀者開文章會送出瀏覽事件，額外查報表 0 次。
- **費用**取決於你用的服務和方案。這兩個公開網站用 GA4 標準版、Apps Script 的預設專案、GitHub 的標準 Linux 執行器和 Pages，在沒有綁 Google Cloud 帳單的情況下跑通了。下面把免費的條件和用量上限分開算。

## 先算一下，一個月會查幾次、要不要付錢？

用 30 天舉例。假設所有排程都正常跑到更新步驟，這段期間也沒有發文，MR Coding 查 30 份，MR Financial 查 30 份，合計 **60 份**。如果今天我另外把兩次改稿推上 MR Coding 的 `main`，又手動更新一次，今天就是 **Coding 4 次、Financial 1 次，共 5 次**。Apps Script 編輯器裡每按一次下文的 `verifyGa4`，也會另外查一份測試報表。

| 這筆用量算在哪裡 | 兩站怎麼用 | 什麼情況要重算 |
| --- | --- | --- |
| GA4 與 Data API | 標準版免費。每個資源的 Core 報表每日有 200,000 個配額單位（tokens）。 | 一份報表消耗幾個單位，跟日期跨度、列數和篩選複雜度有關。60 份報表無法直接換算成 60 個單位。[GA4 標準版](https://marketingplatform.google.com/about/analytics/) · [Data API 配額](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas) |
| Apps Script | 私人指令碼用預設 Cloud 專案，加入進階服務後即可查詢。我在這條路徑沒有綁帳單。 | Apps Script 單次執行上限是 6 分鐘。遇到配額錯誤，先查是哪個服務達到限制。[進階服務](https://developers.google.com/apps-script/guides/services/advanced) · [執行配額](https://developers.google.com/apps-script/guides/services/quotas) |
| GitHub Actions 與 Pages | 兩站都是公開儲存庫，用標準 `ubuntu-latest` 執行器。這個組合免執行分鐘費，GitHub Free 也支援公開儲存庫的 Pages。 | 換成私人儲存庫或較大型的執行器，要重新看方案。快取、成品儲存和 Pages 流量也各有上限。[Actions 計費](https://docs.github.com/en/billing/concepts/product-billing/github-actions) · [Pages 方案](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) · [Pages 用量限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) |

## 1. 先在 GA4 找對網站，抄下三個值

下面用已經能部署到 GitHub Pages 的 **Astro 靜態網站**示範。你需要能讀 GA4 報表的 Google 帳號（該資源有「檢視者」即可），以及可以管理該 GitHub 儲存庫設定的權限。如果剛裝 Google tag，可以先用另一個分頁開一次正式網站，再到 GA4 **報表 → 即時總覽**確認有收到活動，之後再來查歷史報表。[Google tag 安裝與資料收集](https://support.google.com/analytics/answer/9304153?hl=zh-Hant)

1. 打開 [Google Analytics](https://analytics.google.com/)，看右上角頭像確認 Google 帳號。按左上角的資源選擇器選網站。MR Coding 的資源名稱叫 **MingRay**，只看名稱很容易選錯。
<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/ga4-admin-navigation.webp"><img src="../../images/ga4-guide/ga4-admin-navigation.webp" width="254" height="400" alt="GA4 管理左側先展開「資料收集和修改」找「資料串流」，「資源」裡另有「資源詳細資料」。" loading="lazy" decoding="async" /></a>
  <figcaption>管理頁左側有兩個入口。下方的「資料串流」用來核對網站，上方的「資源詳細資料」用來抄資源 ID。點本文的截圖可看原尺寸。</figcaption>
</figure>

2. 點左下角齒輪 **管理 → 資料收集和修改 → 資料串流**，點進「網頁」串流。把網站網址和 `G-` 開頭的**評估 ID** 跟網站上安裝的標籤對一次。如果你有兩個站，現在就分兩列記下來。[尋找評估 ID](https://support.google.com/analytics/answer/12270356?hl=zh-Hant)

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/ga4-web-stream.webp"><picture><source media="(max-width: 600px)" srcset="../../images/ga4-guide/ga4-web-stream-detail.webp" width="514" height="98" /><img src="../../images/ga4-guide/ga4-web-stream.webp" width="1247" height="98" alt="MR Coding 網頁串流詳情並列網站網址、串流 ID 和以 G 開頭的評估 ID。" loading="lazy" decoding="async" /></picture></a>
  <figcaption>這一列先對網址，再對最右邊的評估 ID。本文 Google 畫面取自兩站的實際設定，帳號和部分識別碼已遮蔽。</figcaption>
</figure>

3. 回到 **管理**，在「資源」欄點 **資源詳細資料**，記下純數字的 **Property ID（資源 ID）**。稍後 Apps Script 要填這串數字。串流詳情裡另外有一個純數字的「串流 ID」，請看清楚欄位名稱。

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/ga4-property-id.webp"><picture><source media="(max-width: 600px)" srcset="../../images/ga4-guide/ga4-property-id-detail.webp" width="250" height="63" /><img src="../../images/ga4-guide/ga4-property-id.webp" width="1190" height="156" alt="MingRay 資源詳細資料畫面，右上角是資源 ID。" loading="lazy" decoding="async" /></picture></a>
  <figcaption>要貼到程式的是右上角「資源 ID」旁的數字。左下的資源名稱 MingRay 對應 MR Coding。</figcaption>
</figure>

把你自己的正式網址拆開。假設網站是 `https://example.github.io/my-blog/`，稍後把這三格換成你的值即可。

| 要填的欄位 | 示範值 | 對照方式 |
| --- | --- | --- |
| `propertyId` | `123456789` | GA4 資源詳細資料裡的數字，保留外面的引號 |
| `hostname` | `example.github.io` | 網域，不含 `https://` 和斜線 |
| `sitePath` | `/my-blog/` | 正式站首頁的路徑，頭尾都留 `/`。網站就在網域首頁時填 `/` |

MR Coding 和 MR Financial 共用 `ntustray.github.io`，分別在 `/mr-blog/` 和 `/mr-financial-blog/`。所以報表同時比對網域和路徑。這篇用的 `screenPageViews` 是瀏覽**次數**，同一個人今天讀三次，只要 GA4 收到三筆瀏覽事件，就會算三次。[GA4 指標定義](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)

## 2. 先讓 Apps Script 印出你的第一個數字

先把 GitHub 放一邊。這一步做到能在 Google 自己的畫面讀到瀏覽量，就知道帳號、資源和篩選條件有沒有接對。

1. 用剛才查看 GA4 的同一個帳號開 [Apps Script](https://script.google.com/home)，按 **新增專案**，把專案取名為自己認得的名稱，例如 `我的網站瀏覽量`。
2. 點左邊齒輪 **專案設定**，保留預設的 Google Cloud 專案，勾選「在編輯器中顯示 appsscript.json 資訊清單檔案」。回左邊的 **編輯器**，點 `appsscript.json`，將內容換成下面這段，再儲存。這一步會加入 Analytics Data 服務，也把這個指令碼對 GA4 的權限限制在唯讀。

```json title="appsscript.json"
{
  "timeZone": "Asia/Taipei",
  "runtimeVersion": "V8",
  "dependencies": {
    "enabledAdvancedServices": [
      { "userSymbol": "AnalyticsData", "version": "v1beta", "serviceId": "analyticsdata" }
    ]
  },
  "oauthScopes": ["https://www.googleapis.com/auth/analytics.readonly"]
}
```

3. 確認編輯器左邊的 **服務** 底下出現 `AnalyticsData`。打開下方完整程式，複製全部文字，回編輯器點 `程式碼.gs`（英文介面叫 `Code.gs`），取代預設的 `myFunction`。在最上方填入步驟 1 記下的三個值，再按儲存。[開啟完整 Code.gs 純文字，可直接複製](../../examples/ga4-page-views/Code.gs.txt)

```js title="Code.gs 開頭，只有這三個值要換成你的"
const SITE = {
  propertyId: '123456789',
  hostname: 'example.github.io',
  sitePath: '/my-blog/',
};
```

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/apps-script-services.webp"><img src="../../images/ga4-guide/apps-script-services.webp" width="231" height="244" alt="Apps Script 編輯器左側顯示 appsscript.json、程式碼.gs 和服務 AnalyticsData。" loading="lazy" decoding="async" /></a>
  <figcaption>如果左側跟這張一樣，編輯器已經認得 AnalyticsData。往上點「程式碼.gs」，就可以選函式執行。</figcaption>
</figure>

4. 在編輯器上方的函式選單選 **verifyGa4**，按 **執行**。第一次會請你授權，確認是你自己剛建立的專案、帳號正確，而且要求的是讀取 Analytics 資料。完成後回編輯器，必要時再按一次執行。
5. 打開上方 **執行記錄**。成功會看到 `前 7 個完整日的瀏覽量 = …`。測試查的是 GA4 資源時區的七天前到昨天，故意跳過仍在累計的今天。

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/apps-script-execution-log.webp"><picture><source media="(max-width: 600px)" srcset="../../images/ga4-guide/apps-script-execution-log-detail.webp" width="510" height="67" /><img src="../../images/ga4-guide/apps-script-execution-log.webp" width="1610" height="150" alt="Apps Script 正式執行記錄。2026 年 11 月 19 日至 25 日，MR Coding 有 12 次瀏覽，MR Financial 有 4 次。" loading="lazy" decoding="async" /></picture></a>
  <figcaption>這是兩站正式版的執行記錄。手機上分兩列顯示，點圖可看完整記錄。11 月 19 日至 25 日，MR Coding 是 12 次、MR Financial 是 4 次。上面的單站範例會把同一個指標印成一行中文。</figcaption>
</figure>

**看到 0 也是一個結果。** 如果你知道站上有流量，先在 GA4 的「網頁和畫面」報表選同七天，對照網站路徑與瀏覽次數。看到權限錯誤，就回去核對執行帳號和 Property ID。先在這一步看到符合預期的數字，再接 GitHub，問題會好找很多。

## 3. 部署 Web App，替這個站配一把鑰匙

GitHub 部署時沒有登入你的 Google 帳號。接下來會讓它用一組隨機憑證呼叫 Web App。範例的 `doPost` 會先核對站點路徑和憑證，兩者都對才以專案擁有者的唯讀權限執行查詢。

1. 在自己電腦的終端機執行下面這行。它用 Node.js 產生一組 64 碼的隨機值。你可以在有安裝 Node.js 的 PowerShell 或 macOS 終端機執行。複製結果，等一下 Google 和 GitHub 要填同一組。請只貼到這兩個設定頁。

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

2. 回 Apps Script **專案設定 → 指令碼屬性 → 新增指令碼屬性**。名稱填 `GA4_APPS_SCRIPT_TOKEN`，值貼入剛剛的 64 碼，按 **儲存指令碼屬性**。
3. 右上角 **部署 → 新增部署作業**。點「選取類型」旁的齒輪，選 **網頁應用程式**。執行身分選 **我**，誰可以存取選 **所有人**，按 **部署**。這讓 GitHub 的機器能呼叫網址，程式本身仍會驗證憑證。若公司帳號沒有「所有人」選項，先確認管理員是否允許這類部署。[Google 的 Web App 部署說明](https://developers.google.com/apps-script/guides/web)
4. 複製部署結果裡的 **網頁應用程式網址**，最後一段應是 `/exec`。稍後把這個網址填到 GitHub。直接用瀏覽器開網址會送出 GET，我們寫的入口是 POST，請用步驟 6 的 Actions 做測試。

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/apps-script-web-app.webp"><img src="../../images/ga4-guide/apps-script-web-app.webp" width="756" height="487" alt="新增部署作業中的網頁應用程式設定，執行身分為我，誰可以存取為所有人。" loading="lazy" decoding="async" /></a>
  <figcaption>部署前對一下這兩格。「我」決定用誰的 GA4 權限查報表，「所有人」讓 GitHub 可以送出請求。</figcaption>
</figure>

要接第二個站，照著做最簡單的方式是再建一個私人指令碼專案，換成第二站的三個值，另產生一把鑰匙。兩個範例專案都可以用同一個有權限的 Google 帳號。MR Coding 和 MR Financial 的正式版共用一個私人專案，由程式把兩個路徑對應到各自的 Property ID 和憑證。

## 4. 把網址和鑰匙填到 GitHub 的兩個分頁

打開**要顯示瀏覽量的那個網站**的 GitHub 儲存庫。進 **Settings → Secrets and variables → Actions**，頁面上有 **Secrets** 和 **Variables**。先在 Secrets 建一筆，再切到 Variables 建兩筆。三筆都放在 Repository 層級，名稱照表複製。

| 分頁及按鈕 | Name | Value 或 Secret |
| --- | --- | --- |
| Secrets → New repository secret | `GA4_APPS_SCRIPT_TOKEN` | 步驟 3 貼進指令碼屬性的那組 64 碼 |
| Variables → New repository variable | `GA4_APPS_SCRIPT_URL` | 部署得到的完整 `/exec` 網址 |
| Variables → New repository variable | `GA4_PROPERTY_ID` | 這一站純數字的資源 ID，例如 `123456789` |

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/actions-secrets-variables.webp"><img src="../../images/ga4-guide/actions-secrets-variables.webp" width="680" height="166" alt="GitHub Actions 設定頁並排的 Secrets 與 Variables 分頁，橘框圈住 Secrets。" loading="lazy" decoding="async" /></a>
  <figcaption>憑證放橘框裡的 Secrets，網址和數字 ID 放右邊的 Variables。截圖取自 <a href="https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-a-repository">GitHub Docs</a>，依 <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> 轉存為 WebP。</figcaption>
</figure>

存好後，Secrets 分頁應該看得到名稱，GitHub 會隱藏內容。以後忘了原值，可以產生新的一組，同時更新 Google 和 GitHub 兩邊。這三個值都留在建置環境，不要把憑證加進網站前端或公開的程式碼。[GitHub 的 Actions Secrets 說明](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)

## 5. 讓 Astro 建置時把數字放到網頁上

接下來先把報表存成檔案，再讓頁面讀檔，最後把這兩件事排進部署流程。以下路徑都從你網站的儲存庫根目錄算起。

**先放兩個檔。** 分別開啟下表的原始檔，在 GitHub 的檔案檢視器複製內容，放進自己網站的相同路徑。用 GitHub 網頁編輯時，可在 **Add file → Create new file** 直接把連同資料夾的完整路徑貼進檔名欄。這兩個檔只用 Node.js 內建功能。

| 存成 | 它會做什麼 |
| --- | --- |
| [scripts/sync-ga4-views.mjs](https://github.com/ntustRay/mr-blog/blob/879aec620dbdd2f5c166b4384d1be9a4cdf324a7/scripts/sync-ga4-views.mjs) | 向 Web App 發 POST。站點、資源 ID、指標和列數都核對成功後，寫出 `.cache/ga4-views.json`。 |
| [src/utils/viewCounts.mjs](https://github.com/ntustRay/mr-blog/blob/879aec620dbdd2f5c166b4384d1be9a4cdf324a7/src/utils/viewCounts.mjs) | 在 Astro 建置時讀取快照，可分別取出單頁和全站的數字。 |

**再讓首頁顯示兩個數字。** 打開 `src/pages/index.astro`，把下面頭三行 JavaScript 合併進檔案最上方既有的 `---` 區塊，把兩個 `<p>` 放到希望顯示數字的位置。同樣的做法放進文章版型，就會按該篇的網址取出它的瀏覽量。若版型在別的資料夾，記得調整 `import` 的相對路徑。

```astro title="src/pages/index.astro"
---
import { getPageViewCount, getViewSnapshot } from '../utils/viewCounts.mjs';
const snapshot = getViewSnapshot(import.meta.env.BASE_URL);
const homeViews = getPageViewCount(snapshot, Astro.url.pathname);
---
<p>首頁瀏覽量 {homeViews ?? '暫無資料'}</p>
<p>全站瀏覽量 {snapshot?.totalViews ?? '暫無資料'}</p>
```

**最後接上部署。** 打開下面完整的 Astro workflow 範本，把 `https://example.github.io/my-blog/` 改成自己的正式首頁。使用子路徑的 Astro 站，確認 `astro.config` 的 `base` 也是你的站點路徑，例如 `/my-blog`。如果原本已經有部署 workflow，保留原有的建置和發布步驟，把範本的三個步驟 **Restore last GA4 totals → Refresh public view counts → Cache latest GA4 totals** 放在 checkout 之後、建置之前，再把需要的觸發條件合併進既有的 `on`。第一次設定 Astro 部署的人，可以把整份範本存為 `.github/workflows/deploy.yml`，並到 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。[開啟可複製的完整 deploy.yml](../../examples/ga4-page-views/deploy.yml.txt)

```yaml title="deploy.yml 裡決定何時更新的地方"
on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '17 4 * * *'
```

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/actions-schedule.webp"><img src="../../images/ga4-guide/actions-schedule.webp" width="426" height="266" alt="MR Coding 部署設定列出 push、workflow_dispatch、schedule 及 17 4 的排程。" loading="lazy" decoding="async" /></a>
  <figcaption>這是 MR Coding 實際執行的設定。要找一天自動跑幾次，看 schedule 底下有幾條排程，以及每條寫的時間。</figcaption>
</figure>

`17 4` 表示 UTC 的 **04:17**，台灣快 8 小時，所以是 **12:17**。如果你希望每天台灣晚上 8:30 再更新，把這行改成 `'30 12 * * *'`，仍然一天一次。請把設定合併到預設分支。公開儲存庫若 60 天都沒有活動，GitHub 會自動停用排程，之後可到 Actions 重新啟用。[GitHub 排程說明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## 6. 現在就手動跑，不用等明天中午

1. 把上一步的檔案提交到 `main`。推送本身就會觸發部署，直接看那次即可。如果想單獨測一次，打開儲存庫 **Actions → Deploy to GitHub Pages → Run workflow**，分支選 `main`，按下執行。接著點清單裡剛出現的那一筆。

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/actions-workflow-runs.webp"><img src="../../images/ga4-guide/actions-workflow-runs.webp" width="673" height="323" alt="GitHub Actions 的 Deploy to GitHub Pages 執行清單。" loading="lazy" decoding="async" /></a>
  <figcaption>點執行清單裡對應這次提交的那一列，才會進到這次建置的記錄。</figcaption>
</figure>

2. 點 **build**，找 **Refresh public view counts**，打開這一步的記錄。成功會印出 `Synced GA4 views for N page paths.`，`N` 是報表裡有幾條網頁路徑。再看 **Cache latest GA4 totals** 是否成功，這樣下次查詢暫時失敗，還有機會取回這份快照。

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/actions-refresh-and-cache.webp"><img src="../../images/ga4-guide/actions-refresh-and-cache.webp" width="445" height="390" alt="build 工作中 Refresh public view counts 和 Cache latest GA4 totals 兩步都成功。" loading="lazy" decoding="async" /></a>
  <figcaption>從上往下看，「Refresh」是讀到報表，「Cache」是存好快照。這張正式站截圖裡灰色的 Get read-only GA4 access 是另一種連線方式，走 Apps Script 時會略過。</figcaption>
</figure>

3. 回到這次執行的總覽，等 **deploy** 也出現綠勾，從部署網址打開正式首頁。看到「首頁瀏覽量」和「全站瀏覽量」就能對數字了。要和 GA4 對帳，正式版查的期間是 `2020-01-01` 到今天，只包含實際收集到的事件。編輯器的 `verifyGa4` 則只查前七個完整日。

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/actions-deployment-summary.webp"><img src="../../images/ga4-guide/actions-deployment-summary.webp" width="673" height="355" alt="Actions 總覽中的 build 與 deploy 依序完成，deploy 方塊內有正式網站連結。" loading="lazy" decoding="async" /></a>
  <figcaption>右側 deploy 成功後，點方塊內的連結開啟正式網站。</figcaption>
</figure>

<figure style="margin: 1.25em 0">
  <a href="../../images/ga4-guide/pages-homepage-views.webp"><img src="../../images/ga4-guide/pages-homepage-views.webp" width="454" height="215" alt="MR Coding 手機版首頁的文章分類下方，顯示首頁瀏覽量 8、全站瀏覽量 43。" loading="lazy" decoding="async" /></a>
  <figcaption>同一個首頁上有兩個數字。左邊只算首頁，右邊合計本站各個頁面。</figcaption>
</figure>

2026 年 11 月 26 日首次驗證時，MR Coding 的首頁是 **8**、全站 **43**，MR Financial 的首頁是 **3**、全站 **4**。這些是當時正式首頁顯示的累計值。拿自己的站做時，能在指定期間、同一個路徑查到對應瀏覽次數，就是你的驗收結果。[MR Coding 當次執行](https://github.com/ntustRay/mr-blog/actions/runs/45841401453) · [MR Financial 當次執行](https://github.com/ntustRay/mr-financial-blog/actions/runs/45841218347)

## 卡在哪裡，就從那一層查

| 你看到的情況 | 先做這件事 |
| --- | --- |
| 我剛打開文章，GA4 即時有活動，網頁還是舊數字 | GA4 標準版一般資源的當日報表通常要 **2–6 小時**，較完整的資料處理可能要 **24–48 小時**。等一般報表已有該頁瀏覽，再手動跑一次部署。一直重新整理網頁只會讀到同一份 HTML。[Google 的資料更新間隔](https://support.google.com/analytics/answer/11198161?hl=zh-Hant) |
| 編輯器說找不到 `AnalyticsData` 或沒有存取權 | 找不到服務時，回步驟 2 檢查資訊清單是否已儲存。權限錯誤則回步驟 1 確認 Google 帳號能開那個資源的報表，並核對純數字的 Property ID。 |
| 編輯器查得到，Actions 卻讀不到 | 再看一次 `/exec` 網址、Web App 的「所有人」、兩端憑證和 `sitePath`。程式改過後，到 **部署 → 管理部署作業 → 編輯 → 新版本 → 部署**，讓原本的網址開始執行新程式。 |
| Actions 整體是綠的，首頁卻顯示「暫無資料」或數字一直沒變 | 展開 **build → Refresh public view counts**。這一步允許失敗後繼續建站。有舊快照時沿用舊值，首次失敗可能沒有檔案。若更新已成功，核對 Astro 的 `base` 跟快照的 `sitePath`，並確認 **deploy** 成功。 |
| 頁面顯示 `0`，但全站有數字 | 快照存在，而該頁可能還沒有紀錄。檢查該文章的正式網址和 GA4 的網頁路徑是否相同，再對照日期。 |
