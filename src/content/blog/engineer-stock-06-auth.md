---
title: '[Guide] 工程師選股網 06：設定 Supabase 註冊、登入與寄信'
description: 核對環境變數、SMTP、Email 驗證與 PKCE callback，用收信及登入狀態驗收會員流程。
pubDate: 2026-11-02
category: Web Development
tags:
- Supabase
- Next.js
draft: false
relatedPostIds:
- engineer-stock-05-screener-charts
- engineer-stock-07-rls
references:
- title: 網站程式（本文對照版本）
  url: https://github.com/ntustRay/engineer-stock-web/tree/23b2d914017adb6f6a7029f53314839e6db235be
- title: Supabase SSR client
  url: https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs
- title: Supabase Custom SMTP
  url: https://supabase.com/docs/guides/auth/auth-smtp
- title: Google App Passwords
  url: https://support.google.com/accounts/answer/185833
- title: Gmail SMTP 設定
  url: https://support.google.com/mail/answer/7104828?hl=en
---

系列：[1 本機啟動](../engineer-stock-01-local/) · [2 股票 JSON](../engineer-stock-02-json/) · [3 Actions](../engineer-stock-03-actions/) · [4 Next.js 資料流](../engineer-stock-04-nextjs-data/) · [5 篩選與圖表](../engineer-stock-05-screener-charts/) · [6 註冊登入](../engineer-stock-06-auth/) · [7 追蹤與 RLS](../engineer-stock-07-rls/) · [8 Vercel 部署](../engineer-stock-08-vercel/) · [9 核心架構與選型](../engineer-stock-09-architecture/) · [10 Workflow 與 API 來源](../engineer-stock-10-workflow-api-sources/)

這篇的完成條件：收到驗證信、完成 callback、登入後可進追蹤清單，再確認登出與重設密碼。

截至本次核對，專案仍待完成 SMTP 與真實收信驗收。以下是完整設定與驗收步驟；實拍只證明表單可顯示，沒有宣稱寄信或登入已成功。

<figure>
  <a href="../../images/engineer-stock-series/06-auth-flow.svg"><img src="../../images/engineer-stock-series/06-auth-flow.svg" alt="Auth 流程示意：註冊經 SMTP 寄信；有效 code 在 callback 換成 Cookie session，無效或過期則回登入頁。" loading="lazy" decoding="async" /></a>
  <figcaption>Auth 流程示意：註冊經 SMTP 寄信；有效 code 在 callback 換成 Cookie session，無效或過期則回登入頁。</figcaption>
</figure>

## 1. 先對上環境

在 Vercel 的網站專案開 **Settings → Environment Variables**，核對 Production：

| 名稱 | 填什麼 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://engineer-stock-web.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | 這個會員專案的 API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 同一專案的 publishable key |

值要來自同一個 Supabase 專案；變更後重新部署。`NEXT_PUBLIC_` 會暴露給瀏覽器，這裡使用 publishable key；`service_role` 或 secret key 不能放進這些欄位。

需要在本機測試 Auth 時，使用獨立測試專案與本機 URL。第 1 篇的 fixture 設定只處理股票資料，不會建立登入 session。

## 2. 設定驗證網址

到 Supabase **Authentication → URL Configuration**：

| 欄位 | 正式站設定 |
| --- | --- |
| Site URL | `https://engineer-stock-web.vercel.app` |
| Redirect URLs | `https://engineer-stock-web.vercel.app/auth/callback**` |

在 Email provider 設定確認允許 Email 註冊，並開啟 Confirm email。既有專案已記錄完成網址設定；實際儲存值仍以後台為準。

## 3. 接上 SMTP

開 **Authentication → Emails → SMTP Settings**，啟用自訂 SMTP。以本專案先前選定的 Gmail SMTP 為例：

| 欄位 | 值 |
| --- | --- |
| Sender email | 自己用來寄信的 Gmail 地址 |
| Sender name | 工程師選股網 |
| Host | `smtp.gmail.com` |
| Port | `587`（TLS／STARTTLS） |
| Username | 完整 Gmail 地址 |
| Password | 專用 App Password，由自己在後台輸入 |

先開 Google 帳號的兩步驟驗證，按 [App Passwords 說明](https://support.google.com/accounts/answer/185833) 建立。組織帳號、Advanced Protection 或特定安全設定可能無此選項；需改用允許的 SMTP 服務。密碼只存 SMTP 設定，不放進 Repo 或文章截圖。

[Supabase 預設郵件服務有限制](https://supabase.com/docs/guides/auth/auth-smtp)，不能把表單存在視為公開註冊可用。Gmail 的寄信限制也需另外考量，這裡先完成一次實際收信驗收。

## 4. 走一次註冊與驗證

<figure>
  <a href="../../images/engineer-stock-series/06-register.webp"><img src="../../images/engineer-stock-series/06-register.webp" alt="正式站註冊表單實拍；欄位保持空白，未送出註冊。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站註冊表單實拍；欄位保持空白，未送出註冊。</figcaption>
</figure>

用自己的測試信箱註冊，密碼至少 8 個字元。保持同一個瀏覽器與網站環境，開啟驗證信中的連結。

對照程式：

| 檔案 | 檢查什麼 |
| --- | --- |
| `src/app/auth/actions.ts` → `register` | `signUp` 的 `emailRedirectTo` |
| `src/app/auth/callback/route.ts` | `exchangeCodeForSession(code)` |
| `src/lib/supabase/server.ts` | 用 Cookie adapter 讀寫 session |
| `src/lib/auth-redirect.ts` | 限制 callback 完成後可導向的路徑 |

這是專案既有的 PKCE code 流程。驗證信的 redirect、code 與發起流程時保存的 verifier 要配合；連結過期或換了瀏覽器，應重新發起，不要把網址中的 code 當成登入憑證保存。

## 5. 驗證登入、登出、重設

<figure>
  <a href="../../images/engineer-stock-series/06-login.webp"><img src="../../images/engineer-stock-series/06-login.webp" alt="正式站登入表單實拍；沒有登入成功的宣稱。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站登入表單實拍；沒有登入成功的宣稱。</figcaption>
</figure>

| 操作 | 成功條件 |
| --- | --- |
| 用已驗證帳號登入 | 進入 `/watchlist`，重整後仍可存取 |
| 到個人帳號按登出 | 再開 `/watchlist` 會要求登入 |
| 點忘記密碼、送出信箱 | 實際收到信，開連結後可設定新密碼 |
| 用新密碼登入 | 新密碼可用，舊密碼不能再登入 |

<figure>
  <a href="../../images/engineer-stock-series/06-reset.webp"><img src="../../images/engineer-stock-series/06-reset.webp" alt="正式站重設密碼表單實拍；未送出郵件。" loading="lazy" decoding="async" /></a>
  <figcaption>正式站重設密碼表單實拍；未送出郵件。</figcaption>
</figure>

重設頁為避免洩漏帳號是否存在，回覆不會直接確認此信箱有沒有註冊。畫面提示「將收到指示」不能證明郵件送達。

## 6. 按卡住的位置查

| 結果 | 先查 |
| --- | --- |
| 沒收到信 | SMTP 儲存狀態、寄件地址、Auth logs、收件匣與寄信限制 |
| callback 無效或過期 | Redirect allowlist、信件連結、同瀏覽器的 verifier 與連結時效 |
| 登入後重整失效 | Cookie adapter、`src/proxy.ts` 的 refresh、Server 的 `getUser` |
| Preview 可看股票但不能登入 | 該環境是否刻意未配置會員專案 |

完成標準以步驟 5 的實際結果為準；本次發布教學沒有變更正式 SMTP、代收驗證信或建立會員。

[下載系列程式片段、圖片與驗證紀錄](../../downloads/engineer-stock-series.zip)
