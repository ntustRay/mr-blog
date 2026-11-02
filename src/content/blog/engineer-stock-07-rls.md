---
title: '[Guide] 工程師選股網 07：儲存追蹤清單，用 RLS 隔離會員資料'
description: 追查 user_id 的來源，用本機 PostgreSQL 測試驗證自身操作、跨會員隔離、重複追蹤與匿名禁止。
pubDate: 2026-11-02
category: Web Development
tags:
- Supabase
- PostgreSQL
- Next.js
draft: false
relatedPostIds:
- engineer-stock-06-auth
- engineer-stock-08-vercel
references:
- title: 網站程式（本文對照版本）
  url: https://github.com/ntustRay/engineer-stock-web/tree/23b2d914017adb6f6a7029f53314839e6db235be
- title: Supabase Row Level Security
  url: https://supabase.com/docs/guides/database/postgres/row-level-security
---

系列：[1 本機啟動](../engineer-stock-01-local/) · [2 股票 JSON](../engineer-stock-02-json/) · [3 Actions](../engineer-stock-03-actions/) · [4 Next.js 資料流](../engineer-stock-04-nextjs-data/) · [5 篩選與圖表](../engineer-stock-05-screener-charts/) · [6 註冊登入](../engineer-stock-06-auth/) · [7 追蹤與 RLS](../engineer-stock-07-rls/) · [8 Vercel 部署](../engineer-stock-08-vercel/) · [9 核心架構與選型](../engineer-stock-09-architecture/) · [10 Workflow 與 API 來源](../engineer-stock-10-workflow-api-sources/)

完成這篇：找到誰決定資料擁有者，並用實際 SQL 驗證 A 不能讀寫 B 的追蹤資料。

<figure>
  <a href="../../images/engineer-stock-series/07-rls-flow.svg"><img src="../../images/engineer-stock-series/07-rls-flow.svg" alt="權限流程示意：Server 確認使用者，資料庫用 RLS 限制資料列；未登入與跨會員操作分開驗證。" loading="lazy" decoding="async" /></a>
  <figcaption>權限流程示意：Server 確認使用者，資料庫用 RLS 限制資料列；未登入與跨會員操作分開驗證。</figcaption>
</figure>

## 1. 先看未登入的結果

開 `/watchlist`，未登入應導回登入頁。API 的結果不同：

```sh
curl -i 'http://localhost:3000/api/v1/watchlist'
```

在沒有登入 Cookie 的本機請求，本次得到 `401`，並有 `Cache-Control: private, no-store`。

<figure>
  <a href="../../images/engineer-stock-series/07-watchlist.webp"><img src="../../images/engineer-stock-series/07-watchlist.webp" alt="正式站未登入開追蹤清單的實拍；被導回登入頁，未讀取任何會員資料。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站未登入開追蹤清單的實拍；被導回登入頁，未讀取任何會員資料。</figcaption>
</figure>

## 2. 追到 user_id 的來源

看 `src/app/api/v1/watchlist/route.ts` 的 `member` 與 `write`：

1. `getUser()` 確認目前使用者。
2. body 只接受 `market`、`symbol`，並驗證股票存在。
3. 寫入時由 Server 填入 `user_id: auth.user.id`。
4. 透過該使用者的 Supabase client 寫資料庫，RLS 再判斷資料列權限。

`user_id` 不從瀏覽器 body 取得。只在 UI 隱藏按鈕，無法限制直接送 API 的請求。

## 3. 讀三個資料表與約束

| Table | 用途 | 所有權欄位 |
| --- | --- | --- |
| `profiles` | 顯示名稱等會員資料 | `user_id` |
| `watchlists` | 追蹤的市場與代號 | `user_id` |
| `user_preferences` | 預設市場等設定 | `user_id` |

看 `supabase/migrations/20261031091410_member_tables_and_rls.sql`。`watchlists` 的 `unique(user_id, market, symbol)` 防止同會員重複追蹤，但允許不同會員追蹤同一檔。

本次唯讀核對：正式專案這三表均啟用 RLS，存在 12 條 SELECT／INSERT／UPDATE／DELETE policies。這次沒有重新執行建表 SQL。

## 4. 看懂兩個 policy 條件

以下是既有 UPDATE policy 的對照片段：

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

`USING` 限制可操作的既有資料列；`WITH CHECK` 檢查更新後的資料列，阻止把擁有者改成別人。UPDATE 也需相應 SELECT policy。細節對照 [Supabase RLS 文件](https://supabase.com/docs/guides/database/postgres/row-level-security)。

## 5. 跑真的 SQL 測試

在網站 Repo 執行：

```sh
npm run test:rls
```

`scripts/test-rls.mjs` 啟動隔離的 PGlite PostgreSQL，套用 migrations、建立測試角色與兩個虛擬會員，再執行 `supabase/tests/member_rls.sql`。測試完 rollback 並檢查測試資料已清除。

<figure>
  <a href="../../images/engineer-stock-series/07-rls-proof.svg"><img src="../../images/engineer-stock-series/07-rls-proof.svg" alt="本機 SQL 執行結果對照圖，依實際 test:rls 記錄製作；不是正式會員資料或終端截圖。" loading="lazy" decoding="async" /></a>
  <figcaption>本機 SQL 執行結果對照圖，依實際 test:rls 記錄製作；不是正式會員資料或終端截圖。</figcaption>
</figure>

| 測試 | 預期結果 |
| --- | --- |
| A 讀取自己的資料 | 只看到 A 的一筆 |
| A 修改／刪除 B 的資料 | 影響 0 筆 |
| A 新增資料但填 B 的 user_id | 權限錯誤 |
| A 將資料的 user_id 改成 B | 權限錯誤 |
| A 重複追蹤同市場同代號 | unique constraint 拒絕 |
| anon 存取會員表 | 權限錯誤 |

這些案例本次全部通過。測試用角色與 JWT claims 是隔離模擬，不是透過正式 Auth 登入的實測。

## 6. 登入後自己驗證 CRUD

完成第 6 篇後，用測試帳號 A 加入一檔正式存在的股票；重整追蹤清單，再用另一個瀏覽器帳號 B 確認看不到 A 的清單。回 A 移除，重整後應消失。

本機 SQL 驗證不能代替這段 Cookie、Auth、API 與正式資料庫的整合驗收。自刪帳號 migration 在本機測試通過，但本次唯讀查詢確認正式 `public.delete_own_account()` 尚不存在；正式自刪帳號仍待處理。

[下載系列程式片段、圖片與驗證紀錄](../../downloads/engineer-stock-series.zip)
