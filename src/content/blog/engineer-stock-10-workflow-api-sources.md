---
title: '[Guide] 工程師選股網 10：用 GitHub Actions 定時抓 API，資料來源從哪裡來？'
description: 從官方 OpenAPI 找到股票資料來源，對照 15 個 endpoint、來源登記、TypeScript 抓取範例與 GitHub Workflow 排程，驗證資料日期、快照與發布結果。
pubDate: 2026-11-02
category: Web Development
tags:
- GitHub Actions
- TypeScript
- Bun
draft: false
relatedPostIds:
- engineer-stock-03-actions
- engineer-stock-02-json
- engineer-stock-09-architecture
references:
- title: 資料 Repo（本文對照版本）
  url: https://github.com/ntustRay/engineer-stock-data/tree/c1633aeffe68d4ad95e88ea403d1bfbc1585f70e
- title: 來源登記 sources.yml
  url: https://github.com/ntustRay/engineer-stock-data/blob/c1633aeffe68d4ad95e88ea403d1bfbc1585f70e/config/sources.yml
- title: 現有 Publish data Workflow
  url: https://github.com/ntustRay/engineer-stock-data/blob/c1633aeffe68d4ad95e88ea403d1bfbc1585f70e/.github/workflows/publish-data.yml
- title: TWSE OpenAPI
  url: https://openapi.twse.com.tw/
- title: TWSE Swagger specification
  url: https://openapi.twse.com.tw/v1/swagger.json
- title: TPEx OpenAPI
  url: https://www.tpex.org.tw/openapi/
- title: TPEx OpenAPI specification
  url: https://www.tpex.org.tw/openapi/swagger.json
- title: TDCC OpenAPI
  url: https://openapi.tdcc.com.tw/
- title: TDCC 股權分散表說明
  url: https://www.tdcc.com.tw/portal/zh/smWeb/qryStock
- title: 上市日成交資料集
  url: https://data.gov.tw/dataset/11549
- title: 上櫃行情資料集
  url: https://data.gov.tw/dataset/11370
- title: 集保戶股權分散資料集
  url: https://data.gov.tw/dataset/11452
- title: GitHub schedule events
  url: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- title: 已核對的 Publish data push run
  url: https://github.com/ntustRay/engineer-stock-data/actions/runs/41200225595
- title: 已核對的每週驗證 schedule run
  url: https://github.com/ntustRay/engineer-stock-data/actions/runs/41291592723
- title: 本文固定讀取的 data commit
  url: https://github.com/ntustRay/engineer-stock-data/tree/ac352597ddb64be31db63af46fd4bbfeb489016e
---

系列：[1 本機啟動](../engineer-stock-01-local/) · [2 股票 JSON](../engineer-stock-02-json/) · [3 Actions](../engineer-stock-03-actions/) · [4 Next.js 資料流](../engineer-stock-04-nextjs-data/) · [5 篩選與圖表](../engineer-stock-05-screener-charts/) · [6 註冊登入](../engineer-stock-06-auth/) · [7 追蹤與 RLS](../engineer-stock-07-rls/) · [8 Vercel 部署](../engineer-stock-08-vercel/) · [9 核心架構與選型](../engineer-stock-09-architecture/) · [10 Workflow 與 API 來源](../engineer-stock-10-workflow-api-sources/)

有。`engineer-stock-data` 已有定時抓官方 API、驗證資料，再發布 JSON 的 Workflow。目前設定為**週一至週五，台灣時間 19:10、22:10**，不是一週七天都抓。

要自己看懂這段自動化，先回答三件事：API 的官方來源在哪裡、Workflow 實際執行哪支程式，以及怎樣判斷這次真的產生新資料。

## 這篇的重點

- 股票 API 來自證交所、櫃買中心與集保的 OpenAPI；完整 URL 保存在 `config/sources.yml`。
- GitHub Actions 執行資料程式；排程觸發不代表來源已更新，HTTP 200 也不代表日期正確。
- 先練習讀一支 API，再對照現有 Workflow。來源與快照通過驗證，才更新 `data` branch。
- 本文附官方 API 目錄、15 個不同 endpoint、可執行片段、實拍與執行紀錄；沒有另外觸發正式發布。

## 1. 現在已經有哪些東西

| 位置 | 目前責任 |
| --- | --- |
| `.github/workflows/publish-data.yml` | 平日定時、符合路徑的 main push、手動執行資料更新 |
| `config/sources.yml` | 登記官方 URL、資料類別、來源週期、授權、fixture 與查核日期 |
| `src/cli.ts` | 區分 fixture／build／publish／verify，串起整個流程 |
| `src/production.ts` | 依來源 ID 讀取 API、檢查市場與交易日，再整合資料 |
| `src/fetch.ts` | 限制來源網域、逾時、大小、重試與回應的 Zod 驗證 |
| `src/providers/` | 各來源欄位的驗證與正規化 |
| `src/publish.ts` | 將通過驗證的整批 JSON 發布到 `data` branch |
| `.github/workflows/verify-data.yml` | 每週檢查已發布快照，和抓新資料分開 |

截至本文查核，最近取回的排程紀錄中，`Verify published data` 在 2026-11-01 由 `schedule` 觸發並成功；最近的 `Publish data` 成功紀錄則是 2026-10-31 的 `push`。

因此可以確認「自動抓取的設定已存在、發布程式有成功執行紀錄」。這次沒有取得 11 月 2 日由 `schedule` 成功抓新的紀錄，不能把設定存在直接寫成今日更新成功。

## 2. API 從哪裡找到：先進官方目錄

| 提供者 | 官方目錄 | 用來找什麼 |
| --- | --- | --- |
| TWSE 臺灣證券交易所 | [OpenAPI](https://openapi.twse.com.tw/) | 上市行情、公司資料、估值、營收、財報、股利與日曆 |
| TPEx 證券櫃檯買賣中心 | [OpenAPI](https://www.tpex.org.tw/openapi/) | 上櫃行情、公司資料、財報、法人與融資券 |
| TDCC 臺灣集中保管結算所 | [OpenAPI](https://openapi.tdcc.com.tw/) | 集保戶股權分散資料 |
| 政府資料開放平臺 | [上市日成交資料集](https://data.gov.tw/dataset/11549) | 核對提供機關、欄位、更新說明與授權依據 |

以證交所日行情為例，實際做一次：

1. 開啟 TWSE OpenAPI。
2. 在「證券交易」找到 `GET /exchangeReport/STOCK_DAY_ALL`。
3. 展開後確認名稱是「上市個股日成交資訊」。
4. 看 Parameters、Responses 與欄位型別；目前這個 endpoint 顯示 **No parameters**。
5. 將 Base URL 與 path 接起來，得到完整 API URL。

```text
Base URL: https://openapi.twse.com.tw/v1
Path:     /exchangeReport/STOCK_DAY_ALL
完整 URL: https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL
```

<figure>
  <a href="../../images/engineer-stock-series/10-twse-api.webp"><img src="../../images/engineer-stock-series/10-twse-api.webp" width="1348" height="926" alt="證交所官方 Swagger UI 實拍：展開 STOCK_DAY_ALL，顯示上市日成交資訊、No parameters 與 application/json 回應。" loading="lazy" decoding="async" /></a>
  <figcaption>官方目錄實拍。這裡的 Example Value 是欄位格式範例；執行 GET 後收到的回應，才是實際資料。</figcaption>
</figure>

Swagger UI 是閱讀 API 規格的介面。TWSE 的原始規格是 [`v1/swagger.json`](https://openapi.twse.com.tw/v1/swagger.json)；TPEx 的是 [`openapi/swagger.json`](https://www.tpex.org.tw/openapi/swagger.json)。程式不需要先打開網頁，知道正式 URL 後就能送 HTTP GET。

這些 endpoint 不是選股網站自行產生的官方數據。本次對兩市場行情 API 的直接讀取未帶 API key，皆取得 JSON；這項觀察不代表所有機關、所有服務都採相同驗證方式。

### 官方 API 和選股網站自己的 API 要分開

| API | 回傳什麼 | 誰實作 |
| --- | --- | --- |
| TWSE `STOCK_DAY_ALL` | 原始欄位，如 `Date`、`Code`、`ClosingPrice` | 證交所 |
| 選股站 `/api/v1/stocks` | 正規化股票結果，以及 `snapshotId`、日期與狀態 | `engineer-stock-web` |

網站自己的 API 讀的是已發布 JSON，不會因為每一個使用者搜尋，就重新向官方抓一遍全市場資料。

## 3. 專案目前使用哪些 endpoint

以下取自本文對照版本的 `config/sources.yml`。表內「週期」是專案登記的資料週期，不是每次 HTTP request 的保證更新時間。

| 已接資料／範圍 | 來源 ID | 官方 API／來源資料集 | 專案登記週期 |
| --- | --- | --- | --- |
| 上市個股日成交資訊 | `twse.daily_price` | [JSON](https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL) · [資料集](https://data.gov.tw/dataset/11549) | 交易日 |
| 上櫃股票行情 | `tpex.daily_price` | [JSON](https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes) · [資料集](https://data.gov.tw/dataset/11370) | 交易日 |
| 上市公司基本資料 | `twse.securities` | [JSON](https://openapi.twse.com.tw/v1/opendata/t187ap03_L) · [資料集](https://data.gov.tw/dataset/18419) | 交易日 |
| 上櫃公司基本資料 | `tpex.securities` | [JSON](https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O) · [資料集](https://data.gov.tw/dataset/25036) | 交易日 |
| 有價證券集中交易市場開（休）市日期 | `twse.calendar` | [JSON](https://openapi.twse.com.tw/v1/holidaySchedule/holidaySchedule) · [資料集](https://data.gov.tw/dataset/11761) | 年度 |
| 上市個股本益比、殖利率及股價淨值比 | `twse.valuation` | [JSON](https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL) · [資料集](https://data.gov.tw/dataset/11547) | 交易日 |
| 上櫃股票個股本益比、殖利率、股價淨值比 | `tpex.valuation` | [JSON](https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis) · [資料集](https://data.gov.tw/dataset/11373) | 交易日 |
| 上市公司每月營業收入彙總表 | `twse.revenue` | [JSON](https://openapi.twse.com.tw/v1/opendata/t187ap05_L) · [資料集](https://data.gov.tw/dataset/18420) | 月 |
| 上櫃公司每月營業收入彙總表 | `tpex.revenue` | [JSON](https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O) · [資料集](https://data.gov.tw/dataset/56510) | 月 |
| 集保戶股權分散表 | `tdcc.distribution` | [JSON](https://openapi.tdcc.com.tw/v1/opendata/1-5) · [資料集](https://data.gov.tw/dataset/11452) | 週 |
| 上市公司綜合損益表（一般業） | `twse.financial` | [JSON](https://openapi.twse.com.tw/v1/opendata/t187ap06_L_ci) · [資料集](https://data.gov.tw/dataset/91998) | 季 |
| 上櫃公司財報資訊（一般業） | `tpex.financial` | [JSON](https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap06_O_ciA) · [資料集](https://data.gov.tw/dataset/94865) | 季 |
| 上櫃股票三大法人買賣明細資訊 | `tpex.institutional` | [JSON](https://www.tpex.org.tw/openapi/v1/tpex_3insti_daily_trading) · [資料集](https://data.gov.tw/dataset/11856) | 交易日 |
| 上櫃股票融資融券餘額 | `tpex.margin` | [JSON](https://www.tpex.org.tw/openapi/v1/tpex_mainboard_margin_balance) · [資料集](https://data.gov.tw/dataset/11387) | 交易日 |
| 上市公司股利分派情形 | `twse.dividends` | [JSON](https://openapi.twse.com.tw/v1/opendata/t187ap45_L) · [資料集](https://data.gov.tw/dataset/31612) | 年度 |

**19 筆來源登記，對應 15 個不同 URL**。差別來自同一支 API 被賦予不同用途：

- `twse.quote_exceptions`／`tpex.quote_exceptions` 共用行情 API，保存無一般交易收盤價的來源證據。
- `twse.annual`／`tpex.annual` 共用財報 API；程式只在取得符合條件的第四季累計資料時建立年度資料，不會因此多出一支年度歷史 API。

不是目錄裡有的服務都已接入。上市法人、上市融資券與上櫃股利目前各有來源授權、日期或過時資料的限制，未列為已啟用來源；一般業財報也不能說成涵蓋所有會計產業。

### 抓取頻率、資料週期、回傳日期是三件事

月營收可以每天檢查，但來源仍然是某個月份的資料。季報也是如此；Workflow 多跑一次，不會讓公司多公布一季。

集保更能看出差別：registry 登記 `weekly`，[TDCC 說明](https://www.tdcc.com.tw/portal/zh/smWeb/qryStock)也說按每週最後一個營業日的餘額編製；但[政府資料集頁面](https://data.gov.tw/dataset/11452)的更新頻率欄位目前寫「每1月」。這些說明存在差異，因此接入時仍要核對實際回傳的資料日期，不能只用一個 metadata 欄位保證更新時點。

## 4. 為什麼把 URL 放進 sources.yml

在 Web 頁面、排程與 provider 各藏一份網址，之後很難回答「這個數字究竟從哪裡來」。來源登記讓下載、驗證與 provenance 使用相同的來源 ID。

```yaml title="config/sources.yml（twse.daily_price 節錄）"
id: twse.daily_price
provider: twse
url: https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL
category: daily_price
market: TWSE
frequency: trading_day
schema_fixture: tests/fixtures/official/twse-quotes.json
license_dataset_url: https://data.gov.tw/dataset/11549
last_verified_at: '2026-10-31'
```

這是欄位節錄。正式登記還有授權名稱、授權網址、顯名與是否允許發布等欄位，不能只貼一個 URL 就視為完整來源。

`fetchApprovedJson` 會確認來源具備必要登記資訊，只接受對應 provider 白名單內的 HTTPS 網域。registry 內有「已核對」欄位，仍需要人實際核對；程式無法替一份填錯的來源聲明背書。

## 5. 先讀一支 API，不要一開始就跑完整發布

在資料 Repo 準備 Bun 1.4.4，依 lockfile 安裝：

```sh
git clone https://github.com/ntustRay/engineer-stock-data.git
cd engineer-stock-data
bun install --frozen-lockfile
```

把附件的 `lesson-fetch-api.ts` 放在根目錄。這個片段只讀資料並印出結果，不會 push：

```ts title="lesson-fetch-api.ts"
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod/v4';
import { sourceSchema } from './src/contracts.ts';
import { fetchApprovedJson } from './src/fetch.ts';
import { normalizeQuotes, twseQuotesSchema } from './src/providers/quotes.ts';

const registry = z.object({ sources: z.array(sourceSchema) }).parse(
  parse(readFileSync('config/sources.yml', 'utf8')),
);
const source = registry.sources.find((item) => item.id === 'twse.daily_price');
if (!source || !source.schema_fixture) throw new Error('Missing source or fixture');

const live = process.argv.includes('--live');
const raw = live
  ? await fetchApprovedJson(source, twseQuotesSchema, { retries: 0 })
  : twseQuotesSchema.parse(
      JSON.parse(readFileSync(source.schema_fixture, 'utf8')),
    );
const batch = normalizeQuotes('TWSE', raw);
const quote = batch.quotes.find((item) => item.symbol === '1101');
if (!quote) throw new Error('Missing 1101 quote');

console.log(JSON.stringify({
  mode: live ? 'live' : 'fixture',
  source: source.id,
  sourceUrl: source.url,
  rows: batch.quotes.length,
  asOfDate: batch.asOfDate,
  sample: {
    symbol: quote.symbol,
    date: quote.daily.date,
    close: quote.daily.close,
    volumeShares: quote.daily.volumeShares,
  },
}, null, 2));
```

先讀 Repo 保存的樣本，再實際呼叫官方來源：

```sh
bun lesson-fetch-api.ts
bun lesson-fetch-api.ts --live
```

這兩種模式都已執行。fixture 是 2 筆；本次 live 回應經驗證後為 1,389 筆，節錄結果如下：

```json title="本次 live 執行結果節錄"
{
  "mode": "live",
  "rows": 1389,
  "asOfDate": "2026-10-30",
  "sample": {
    "symbol": "1101",
    "date": "2026-10-30",
    "close": 28.35,
    "volumeShares": 41966086
  }
}
```

這個筆數是該次上市行情 API 的資料列，包含網站普通股範圍以外的證券；不是網站兩市場合計的公司數。完整 Pipeline 會先用公司名錄建立普通股範圍，再篩選行情。

本次於 2026-11-02 21:05（台灣時間）直接讀取來源時，HTTP 為 200，TWSE 回傳資料日期仍為 **2026-10-30**。所以 `--live` 只表示真的送了網路請求，不表示拿到今天行情。

### 一筆資料經過哪些檢查

| 階段 | 具體檢查 |
| --- | --- |
| HTTP | 逾時、非成功狀態、JSON Content-Type、回應大小 |
| 來源結構 | `Date`、`Code`、價格等欄位符合 Zod schema |
| 正規化 | 民國日期轉西元、數字字串轉 number、缺值保留 null |
| 同批資料 | 股票不可重複、行情不可混合不同日期 |
| 兩市場整合 | TWSE 與 TPEx 日期一致，且符合目標交易日 |
| 快照 | Schema、hash、自然鍵、檔案索引與跨檔一致性 |

此站不會把 `null` 當成 0，也不會因 HTTP 200 就跳過後面的檢查。TWSE 與 TPEx 的欄位名稱不同，由各自 provider 處理，網站最後讀同一份公開契約。

目前 fetch 預設逾時為 15 秒、回應上限 20 MiB、最多重試 3 次，總請求次數最多 4 次。429、5xx 與指定的網路／逾時錯誤可以退避重試；Schema 錯誤、一般 4xx 不會無限重抓。教學片段為減少額外請求，明示 `retries: 0`。

## 6. Workflow 怎麼做到定時執行

**Workflow 是 YAML 描述的整個工作；job 是其中一組執行工作；step 是 job 裡的一個步驟。** `schedule` 決定何時觸發，`run` 決定 runner 執行哪個命令。

現有設定沒有指定 `timezone`，依 GitHub 的預設以 UTC 解讀：

```yaml title=".github/workflows/publish-data.yml（觸發條件）"
on:
  push:
    branches: [main]
    paths: ['src/**', 'config/**', '.github/workflows/publish-data.yml']
  schedule:
    - cron: '10 11 * * 1-5'
    - cron: '10 14 * * 1-5'
  workflow_dispatch:
    inputs:
      targetDate:
        required: false
        type: string
      forceRefresh:
        default: false
        type: boolean
```

`10 11 * * 1-5` 的五個欄位如下：

| 分鐘 | 小時 | 每月幾日 | 月份 | 星期 |
| --- | --- | --- | --- | --- |
| 10 | 11（UTC） | 每日 | 每月 | 週一至週五 |

| 設定 | 台灣時間 | 用途 |
| --- | --- | --- |
| `10 11 * * 1-5` | 平日 19:10 | 第一次資料更新嘗試 |
| `10 14 * * 1-5` | 平日 22:10 | 第二次資料更新嘗試 |
| `10 2 * * 0`，另一份 verify Workflow | 週日 10:10 | 驗證既有正式快照 |

週一至週五仍可能遇到國定休市；交易日由程式與兩市場日曆檢查。若來源還沒準備好，排程已啟動也可能停止發布。

依 [GitHub schedule 文件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)，排程使用預設分支的 Workflow，可能延遲甚至被略過；公開 Repo 長期無活動時也可能自動停用。這個工作適合批次更新，不能當成準點完成的 SLA。

## 7. Runner 實際做什麼：validate → publish

打開[完整的現有 Workflow](https://github.com/ntustRay/engineer-stock-data/blob/c1633aeffe68d4ad95e88ea403d1bfbc1585f70e/.github/workflows/publish-data.yml)，從兩個 job 讀起：

| Job | 主要命令 | 為何放這裡 |
| --- | --- | --- |
| `validate` | `bun install --frozen-lockfile`、`bun run check`、`bun run typecheck`、`bun test tests` | 固定依賴並檢查資料程式 |
| `publish` | 安裝後執行 `bun run publish`，視手動輸入加參數 | 只有驗證通過才抓取、整合與發布 |

關鍵設定節錄如下；checkout 與 setup-bun 的完整 pinned SHA 保留在原檔。

```yaml title="publish-data.yml（job 關係與權限節錄）"
permissions:
  contents: read
concurrency:
  group: stock-data-publish
  cancel-in-progress: false
jobs:
  validate:
    runs-on: ubuntu-latest
    # steps：checkout → setup-bun → install → check → typecheck → tests
  publish:
    needs: validate
    runs-on: ubuntu-latest
    permissions:
      contents: write
    # steps：checkout → setup-bun → install → bun run publish
```

這段是閱讀用節錄，不能當成包含所有 steps 的完整可執行檔。`needs: validate` 是 job 之間的等待關係；`contents: write` 限定給需要發布 Git 資料的 job。

`GITHUB_TOKEN` 由 GitHub 提供，這裡用來寫入自己的 Repo，與官方股票 API 的驗證不同。可選的 `CACHE_WEBHOOK_SECRET` 只在部署好快取通知時使用；文章不需要出現任何 secret 的實際值。

同一個 concurrency group 會控制發布工作重疊，最後的 Git push 仍另外檢查遠端 SHA。排隊執行與避免覆蓋別人的新版本，是兩個不同問題。

<figure>
  <a href="../../images/engineer-stock-series/10-publish-decisions.svg"><img src="../../images/engineer-stock-series/10-publish-decisions.svg" width="1120" height="820" alt="Workflow 流程示意：觸發後 validate，收集 API 與驗證日期；失敗保留前版，內容相同略過，通過且不同時發布新 SHA。" loading="lazy" decoding="async" /></a>
  <figcaption>流程示意。success 可能代表合法略過；只有發布摘要與 data SHA 才能判斷是否產生新版本。</figcaption>
</figure>

## 8. 抓完後怎麼變成網站讀得到的 JSON

`bun run publish` 對應 `bun src/cli.ts publish`，接著執行以下工作：

1. 讀取來源登記與已核對的交易日曆。
2. 固定並載入前一份 `data` SHA，作為合併歷史與失敗保留的依據。
3. 收集必要來源：日曆、兩市場公司名錄、兩市場行情。
4. 篩出普通股，檢查行情日期；必要來源不合法就停止。
5. 收集估值、營收、財報、股利、法人、融資券與集保等已啟用來源。
6. 合併前一份有效資料與保留期間；次要來源失敗時保留可用舊值、標示 stale，沒有舊值則保留缺值／不可用。
7. 比較實質內容；未改變且沒有 forceRefresh 時，以 `reason: unchanged` 結束。
8. 建立 JSON、manifest 與 hashes；通過快照驗證後準備發布。
9. 建立新的 root commit，使用 `--force-with-lease` 更新 `data`。

第 9 步只有在遠端仍是先前讀到的 SHA 時才成功；有人已先發布另一版時，這次更新會被拒絕。不要把它改成沒有版本檢查的強制覆蓋。

Runner 的暫存檔不會自然變成下一次執行的持久資料。這個專案會載入 GitHub 上的舊快照，再合併新資料；網站則讀發布後的固定 SHA。

<figure>
  <a href="../../images/engineer-stock-series/10-data-path.svg"><img src="../../images/engineer-stock-series/10-data-path.svg" width="1120" height="820" alt="資料通路：官方 OpenAPI 經資料 Repo 抓取、驗證與正規化，發布 GitHub JSON；Next.js 固定 SHA 讀檔，再提供頁面或自己的股票 API 給瀏覽器。" loading="lazy" decoding="async" /></a>
  <figcaption>資料通路示意。官方原始 API、GitHub 快照、Next.js 自己的 API 是三個不同邊界。</figcaption>
</figure>

快照包含 `manifest.json`、`index/screener.json`、個股與各種時間序列檔。選股站先解析 SHA 再讀取，避免索引與個股來自不同批次。細節接[第 9 篇的版本一致性與快取](../engineer-stock-09-architecture/)。

`data` 只保留一個可達 root commit。JSON 裡可以包含保留期間內的歷史，但 Git commit 歷史本身不是永久快照備份。新 API 通常只提供當下可取得的資料，也不能靠 `targetDate` 任意回補過去幾年。

## 9. 怎麼驗收「有抓」與「有更新」

到 **Actions → Publish data → 一次執行紀錄**，依序看 event、job 與資料摘要。

<figure>
  <a href="../../images/engineer-stock-series/10-publish-run.webp"><img src="../../images/engineer-stock-series/10-publish-run.webp" width="1348" height="926" alt="現有 Publish data 成功紀錄實拍，顯示 Triggered via push、validate 與 publish 兩個 job 成功。" loading="lazy" decoding="async" /></a>
  <figcaption>2026-10-31 的既有成功紀錄。畫面明確寫 push；它能證明該次工作成功，不能拿來當今日 schedule 已完成的截圖。</figcaption>
</figure>

| 檢查位置 | 要看什麼 | 可以回答什麼 |
| --- | --- | --- |
| Run 的觸發事件 | `schedule`／`push`／`workflow_dispatch` | 為什麼這次會執行 |
| `validate` | 第一個失敗的 check、typecheck 或 test | 程式是否先通過檢查 |
| fetch log | `source`、`rows`、錯誤訊息 | 哪個來源成功，哪個來源出問題 |
| publish 摘要 | `asOfDate`、`snapshotId`、`commitSha` | 產生哪一天、哪一批與哪個版本 |
| skip log | `reason: unchanged` 或 `non_trading_day` | 是否合法結束而沒有重發 |
| `data` branch 的 `manifest.json` | `latestTradingDate`、`counts`、`datasets` | 正式快照目前保存什麼 |
| 網站畫面／API meta | 資料日期、來源、stale | 使用者真正拿到的版本與狀態 |

本次固定讀取的 `data` commit 為 `ac352597ddb64be31db63af46fd4bbfeb489016e`。manifest 記錄行情日期 **2026-10-30**、普通股 **1,986 檔**，行情歷史日期數 **1**。保留設定有 30 個日曆天，不代表已經回補了 30 天。

API 回應、Workflow 狀態與 manifest 都要對照。若看到網站顯示舊資料，先查來源日期與抓取紀錄；重新部署 Next.js 不能替官方 API 產生缺少的新行情。

## 10. 來源改格式或失敗時，從哪裡查

| 現象 | 先查哪裡 |
| --- | --- |
| HTTP 403、429、5xx、逾時 | 該 provider 的回應、限制與稍後狀態；不要直接開無限重試 |
| HTTP 200 卻不是 JSON | Content-Type 與原始回應；不要先 JSON.parse 後忽略例外 |
| 欄位改名、日期格式改變 | 官方規格、對應 provider schema 與 fixture |
| 回應成功但行情仍是前一天 | 兩市場資料日期、目標交易日；不要把執行時間當行情時間 |
| 次要資料過期 | `datasets` 狀態、該欄位 provenance 與保留的前版日期 |
| 完全沒有定時 run | Workflow 是否在預設分支、是否啟用、GitHub 排程限制 |
| push lease 失敗 | 重新讀取遠端 SHA，再依新基準重建；不要直接覆蓋 |

新增來源也需要一條完整路徑：官方目錄／資料集 → registry → provider schema 與正規化 → fixture／unit tests → `collectProduction` → 快照契約與發布驗證。只在 YAML 加網址，不會自動得到網站功能。

## 11. 自己完成一次不發布的練習

```sh
bun run check
bun run typecheck
bun test tests
bun run fixture
bun run verify
```

本篇已再次執行上述檢查：42 個 unit tests 通過，fixture 產生 18 個檔案並通過 verify，Biome 檢查結束碼為 0（帶 7 個既有 optional-chain 警告）、TypeScript 檢查通過；教學片段的 fixture 與 live 模式也已執行。這些驗證沒有觸發正式資料發布。

自己驗收三件事：

1. 從官方目錄找到 `STOCK_DAY_ALL`，說出 Base URL、path、method 與回應欄位。
2. 從 Workflow 找到 cron、`needs: validate` 與 `bun run publish`，再追到 `src/cli.ts`。
3. 看一次 run，說出它是「排程啟動」「資料相同略過」「新快照已發布」哪一種，並拿 event、log 與 manifest 支持答案。

面試時可以這樣說：公開行情由 GitHub Actions 定時執行 TypeScript Pipeline，從官方 OpenAPI 取得資料；先驗證結構與交易日，再發布版本固定的 JSON。網站讀共用快照，避免每個使用者請求都抓官方來源。來源延遲、休市與資料未改變，都有各自的判斷，排程成功不直接等於資料已更新。

本文於 2026-11-02 對照資料 Repo commit `c1633aeffe68d4ad95e88ea403d1bfbc1585f70e`；API 回應只是本次觀察，之後請重新核對實際內容與日期。

[下載系列程式片段、圖片與驗證紀錄](../../downloads/engineer-stock-series.zip)
