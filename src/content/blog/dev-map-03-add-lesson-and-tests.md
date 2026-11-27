---
title: "[Guide] 把自訂教材部署到 Vercel，再用 Neon 接會員和雲端備份"
description: "從 out/ 靜態檔開始，分清公開 HTTPS endpoint 與 Postgres 連線字串，設定 Auth、Data API 和兩份 migration。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Full-stack
series: dev-map
seriesOrder: 3
tags: [TypeScript, Markdown, JSON, Vitest]
references:
  - title: "會員、Neon 服務設定與 migrations"
    url: https://github.com/ntustRay/dev-map-lab/blob/main/docs/MEMBERSHIP.md
  - title: "Neon Data API 的資料存取控制"
    url: https://neon.com/docs/data-api/access-control
  - title: "Neon Email verification"
    url: https://neon.com/docs/auth/guides/email-verification
  - title: "GitHub Actions 驗證與 build artifact"
    url: https://github.com/ntustRay/dev-map-lab/blob/main/.github/workflows/ci.yml
  - title: "Next.js static export 設定"
    url: https://github.com/ntustRay/dev-map-lab/blob/main/next.config.ts
  - title: "Vercel 部署"
    url: https://vercel.com/docs/deployments
---

上一課加了自己的教材。先讓訪客從公開網址讀到這個單元，再接會員備份。這樣即使登入流程有問題，仍然知道教材和 build 是否部署成功。這些步驟用自己的 GitHub fork、Vercel project 和 Neon project。

## 1. 先發布訪客能使用的版本

把上一課的教材、題庫、catalog 變更 commit 並推到自己的 fork。Vercel 選 **Add New → Project**，點該 repo 的 **Import**。

<img src="../../downloads/visual-regression-series/images/official/vercel-import-repository.webp" alt="Vercel 匯入自己的學習站 fork。" loading="lazy" decoding="async" />

為了明確發布 Next.js 的靜態匯出，Framework Preset 選 **Other**，Root Directory 選 repo 根目錄，Install Command 設 `bun install --frozen-lockfile`，Build Command 設 `bun run build`，Output Directory 設 `out`。使用可滿足 repo 的 Node.js 版本，例如 CI 使用的 24。先保持會員變數空白再按 **Deploy**。`next.config.ts` 的 `output: "export"` 會把可直接開啟的 HTML 寫入該目錄。

<img src="../../downloads/visual-regression-series/images/official/vercel-project-overview.webp" alt="從 Vercel 專案總覽開啟部署網址，先驗證訪客教材可以正常載入。" loading="lazy" decoding="async" />

新增的課能打開、測資能跑，再到 **Settings → Domains** 記下穩定網址。原專案的 CI 只把 `out/` 上傳為 GitHub Actions artifact；這份新網址由你剛建立的 Vercel project 提供。

## 2. 在自己的 Neon 開 Auth 和 Data API

1. 新建 Neon project，在測試用 branch 啟用 **Neon Auth / Better Auth**，開啟 Email/Password 與 **Require email verification**，選 verification code／OTP。將上一步的穩定網站 origin 加入 Auth 的 trusted domains；本機測試時也要允許對應的 localhost origin。
2. 在同一個 branch、資料庫啟用 **Data API**，選與該 branch 的 Neon Auth 串接。只暴露 `public` schema，讓專案的 SQL 負責應用表權限；關閉自動 grants。正式對外寄信前設定自己的 SMTP，測試時用可實際收信的地址。
3. 打開該 branch 的 SQL Editor。從 repo 的 `database/migrations/` 依序打開以下兩個 SQL，逐份完整貼入並執行一次。第一份建立 profile、工作區、備份函式與 RLS，第二份補上已驗證信箱的條件。若第一份缺 `neon_auth` 或 `auth.uid()`，先查 Auth / Data API 是否在同一資料庫完成設定。

```text
202611050001_member_workspace.sql
202611050002_verified_email.sql
```

在同一個 SQL Editor 核對表和 RLS。預期兩列的 `rowsecurity` 都是 true。

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('devmap_profiles', 'devmap_workspaces')
order by tablename;
```

## 3. 把瀏覽器接到正確的服務網址

由自己的 Neon project 拿到 **HTTPS database URL**。在 Vercel 的 **Settings → Environment Variables** 新增下面三項，先設到使用中的部署環境。第一列必須是自己的 endpoint 和 database 名稱。此專案透過 `@neon/neon-js` 使用 Data API 與 Auth，前端只接受不含帳密的 HTTPS 位址。

```dotenv
NEXT_PUBLIC_NEON_DATABASE_URL=https://<你的-endpoint>.neon.tech/<資料庫名稱>
NEXT_PUBLIC_AUTH_GITHUB_ENABLED=false
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=false
```

<figure><img src="../../downloads/visual-regression-series/images/official/vercel-environment-scope.webp" alt="Vercel 環境變數清單右上角展開 Filter by，可按 Production 或 Preview 篩選。" loading="lazy" decoding="async" /><figcaption>新增或編輯變數時選好環境並儲存。回到清單，用右上角 Filter by 選這次部署的環境，確認三個名稱都在清單中。</figcaption></figure>

按 **Redeploy** 重新建置。這三個變數在 build 時寫入靜態輸出。登入頁仍說服務未啟用時，先核對部署環境及新部署的 commit，再看網址是否少了資料庫路徑。若已經看到登入表單但備份被拒絕，回 Neon 檢查信箱驗證與 RLS。

## 4. 驗證資料確實離開了第一台裝置

從正式網址註冊測試帳號，收 OTP、完成驗證並登入。新增一則帶唯一字樣的筆記，手動備份。在另一個乾淨瀏覽器設定檔開相同網址、登入同帳號，取回備份並核對字樣。原分頁重新整理只證明 IndexedDB 能讀回，第二個瀏覽器才會經過雲端路徑。
