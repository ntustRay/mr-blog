---
title: "[Guide] 工程師選股網 08：部署自己的 Next.js 選股練習到 Vercel"
description: "從 GitHub 匯入、設定 Production domain 和 Supabase callback，核對 commit、API 與登入者資料。"
pubDate: 2026-11-02
updatedDate: 2026-11-27
category: "Dev Tools & Quality"
series: engineer-stock
seriesOrder: 9
tags:
- Vercel
- Next.js
- GitHub Actions
draft: false
relatedPostIds:
- engineer-stock-07-rls
- engineer-stock-09-architecture
references:
- title: 公開的 Next.js 選股練習與測試資料
  url: https://ntustray.github.io/mr-blog/downloads/stock-fixture-lab.zip
- title: Vercel Deployments
  url: https://vercel.com/docs/deployments
- title: Vercel Environment Variables
  url: https://vercel.com/docs/environment-variables
- title: Vercel Deployment Checks
  url: https://vercel.com/docs/deployment-checks
---

這次部署[第一課的公開 Next.js 練習專案](../../downloads/stock-fixture-lab.zip)。做到哪一課就能部署到哪一課：只有首頁也能上線，已經完成會員與追蹤清單的版本再加 Supabase 設定。你會有自己的 Production 網址，能從別的裝置檢查程式版本、API 和登入。

## 1. 把可建置的程式放到自己的 GitHub

在有 `package.json` 的目錄執行。若只有原始 ZIP，先安裝一次產生 `package-lock.json`。

```sh
npm install
npm test
npm run build
git init
git add .
git status --short
```

確認清單只有原始碼、設定與 lockfile。`.env.local`、`node_modules` 和 `.next` 應被附件內的 `.gitignore` 排除。在 GitHub 建立空 repository，把它的 HTTPS 網址填入 `YOUR_REPO_URL`：

```sh
git commit -m "Build stock query lab"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

已經有 Git remote 的讀者，先用 `git remote -v` 核對自己的 repo，直接提交、推送目前的變更即可。

## 2. 從 Git 匯入 Vercel

在 Vercel Dashboard 選 **Add New → Project**，連結自己的 GitHub 帳號。搜尋剛推上去的 repo，選 **Import**。下圖是官方示例，找左側 Git 清單。

<figure><img src="../../downloads/visual-regression-series/images/official/vercel-import-repository.webp" alt="Vercel 的 Import Git Repository 清單，在目標 repo 旁選 Import。" loading="lazy" decoding="async" /></figure>

| 設定 | 公開練習要填的值 |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | 放 `package.json` 的根目錄 |
| Node.js Version | 24.x，和本機及 `engines` 相同 |
| Install／Build／Output | 保留 Next.js preset；commit 內含 npm lockfile |
| Environment Variables | 只有股票首頁、API 和圖表時可留空 |

按 **Deploy**，等當次部署成為 **Ready**，從 Project Overview 複製 Production domain。先把網址貼入無痕視窗，查詢 `9001`，再開 `/api/v1/screener?q=9001`。兩邊都應只回範例電子；這個專案的行情資料刻意標為 fixture。

<figure><img src="../../downloads/visual-regression-series/images/official/vercel-project-overview.webp" alt="Vercel 官方示例的 Project Overview，部署卡片可開啟站點及查看部署狀態。" loading="lazy" decoding="async" /></figure>

## 3. 若已實作會員頁，接上 Production 的 Supabase

在 Vercel 專案的 **Settings → Environment Variables** 加入下列三個欄位並選擇 **Production**。使用自己的 Supabase 練習專案，沿用第 6、7 課的使用者與資料表。Preview 要測登入時另用測試專案，以免預覽寫入相同的資料。

<figure><img src="../../downloads/visual-regression-series/images/official/vercel-environment-scope.webp" alt="Vercel 已儲存的環境變數列表，依 Production 或 Preview 篩選來核對設定。" loading="lazy" decoding="async" /></figure>

| 變數 | 來源 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 這次取得的穩定 Production origin，如 `https://你的專案.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案的 Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 同一專案的 publishable key |

到 Supabase 的 **Authentication → URL Configuration**，Site URL 填穩定的 Production origin，Redirect URLs 加入 **你的 Production origin + `/email-lab/confirm`**。保留仍在用的 localhost callback。回 Vercel 的 Deployments 選擇 **Redeploy** 使新變數進入 build。註冊與收信步驟沿用[第 6 課](../engineer-stock-06-auth/)。

## 4. 確認部署版本，再測三個入口

到 Deployments 點進剛完成的紀錄，比對 Source commit 和本機 `git rev-parse --short HEAD`。若部署失敗，先在 Build Logs 找第一個錯誤。找不到 `package.json` 就檢查 Root Directory，TypeScript 錯誤則回本機執行相同 build。

| Production 路徑 | 驗收 |
| --- | --- |
| `/?q=9001` 與 `/api/v1/screener?q=9001` | 畫面與 JSON 都只剩 9001 |
| 已做第 4 篇的 `/market` | 頁面與 `/api/market` 傳回同一批快照的交易日 |
| 已做第 6、7 篇的 `/watch-lab` | 未登入會跳到登入頁；登入、加入一筆、重整後仍存在；另一帳號看不到 |

如果只有登入失敗，先檢查 Production 的三個變數和 Supabase callback 的完整網址。如果行情 API 回 502，回到上一列的 Source 版本與公開 manifest 確認。這兩條連線可以各自測試。[Vercel 環境變數](https://vercel.com/docs/environment-variables)。
