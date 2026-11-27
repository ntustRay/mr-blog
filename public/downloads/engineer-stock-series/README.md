# 工程師選股網開發教學

先解開附件內的[公開 Next.js 練習專案](./stock-fixture-lab.zip)。在練習資料夾打開有 `package.json` 的資料夾，使用 Node.js 24 依序執行 `npm install`、`npm test`、`npm run dev`。終端機顯示兩個測試通過，開啟 Local 網址後應看見兩家虛構公司。[第一堂實作](./articles/engineer-stock-01-local.md)帶你改第三筆資料，比對畫面和 API 的結果。後面的股票篩選、Supabase 登入與 Vercel 部署都能從這個公開專案繼續。

文章與圖片可離線閱讀。初次安裝 npm 套件、查詢即時行情與串接 Supabase、Vercel 時需要網路。

## 系列目錄

1. [工程師選股網為什麼把公開行情與個人追蹤分開？](./articles/engineer-stock-project-intro.md)
2. [工程師選股網 01：本機啟動與資料流](./articles/engineer-stock-01-local.md)
3. [工程師選股網 02：把股票 API 變成 JSON](./articles/engineer-stock-02-json.md)
4. [工程師選股網 03：讓 GitHub Actions 更新股票資料](./articles/engineer-stock-03-actions.md)
5. [工程師選股網 04：在 Next.js 接公開行情，讓網頁與 API 共用同一份 manifest](./articles/engineer-stock-04-nextjs-data.md)
6. [工程師選股網 05：將篩選後的股票畫成價格長條圖](./articles/engineer-stock-05-screener-charts.md)
7. [工程師選股網 06：設定 Supabase 註冊、登入與寄信](./articles/engineer-stock-06-auth.md)
8. [工程師選股網 07：在 Supabase 建立個人追蹤清單，實作三條 RLS policy](./articles/engineer-stock-07-rls.md)
9. [工程師選股網 08：部署自己的 Next.js 選股練習到 Vercel](./articles/engineer-stock-08-vercel.md)
10. [工程師選股網 09：核心架構、技術選型與 Next.js 設計](./articles/engineer-stock-09-architecture.md)
11. [工程師選股網 10：用 GitHub Actions 定時抓 API，資料來源從哪裡來？](./articles/engineer-stock-10-workflow-api-sources.md)
12. [工程師選股網 11：GitHub Actions 跨午夜抓錯資料日期的除錯紀錄](./articles/engineer-stock-11-actions-date-debug.md)
13. [工程師選股網做完後，怎麼確認資料和權限都可信？](./articles/engineer-stock-project-summary.md)

[開啟有預覽圖的線上目錄](https://ntustray.github.io/mr-blog/series/engineer-stock/)。

## 解壓後的檔案

| 檔案 | 用法 |
| --- | --- |
| `articles/` | 13 篇完整 Markdown，含教學圖片、可複製的程式碼與驗收步驟。每篇開頭附有線上最新版。 |
| `snippets/lesson-normalize.ts` | 依股票 JSON 課程，放入[公開資料 Pipeline](https://github.com/ntustRay/engineer-stock-data)根目錄，使用 Bun 1.4.4 安裝 lockfile 套件後執行 `bun lesson-normalize.ts`。 |
| `snippets/lesson-contract.ts` | 核心架構篇在空目錄安裝 TypeScript、Zod，驗證數字及字串輸入的差別。 |
| `snippets/lesson-fetch-api.ts` | 放入公開資料 Pipeline 根目錄，使用 `bun lesson-fetch-api.ts` 讀固定樣本，加上 `--live` 才向官方 API 取資料。 |
| `images/` | 正式站、練習程式與雲端設定的教學截圖、資料流程圖。官方操作畫面的版本與授權見[圖片來源](./images/official/SOURCES.md)。行情和時間保留拍攝當下的值。 |
| `evidence/` | 記錄原專案與資料 Pipeline 當時的版本、測試、建置和 fixture 回應。每份紀錄的日期和測試條件以該檔為準，讀者的部署、收信和帳號隔離需在自己的環境驗收。 |
