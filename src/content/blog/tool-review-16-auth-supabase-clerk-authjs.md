---
title: "[Review] Supabase Auth、Clerk、Auth.js：登入系統怎麼選"
description: "Auth 不等於 Session Cookie。先區分身分驗證、會話、授權（Authorization）與 Database Row Ownership：登入成功不能證明使用者可以讀取某筆資料。"
pubDate: 2026-11-03
category: "Full-stack"
series: tech-stack-comparisons
seriesOrder: 16
tags:
  - "Authentication"
  - "Supabase"
  - "Next.js"
  - "Security"
draft: false
references:
  - title: "Supabase Auth Repository"
    url: "https://github.com/supabase/supabase"
  - title: "Clerk Repository"
    url: "https://github.com/clerk/javascript"
  - title: "Auth.js Repository"
    url: "https://github.com/nextauthjs/next-auth"
  - title: "Supabase Auth Docs"
    url: "https://supabase.com/docs/guides/auth"
  - title: "Clerk Docs"
    url: "https://clerk.com/docs"
  - title: "Auth.js Docs"
    url: "https://authjs.dev/"
---

Auth 不等於 Session Cookie。先區分身分驗證、會話、授權（Authorization）與 Database Row Ownership：登入成功不能證明使用者可以讀取某筆資料。

## 先說選擇

Postgres 與 Supabase RLS 是主要資料邊界時，Supabase Auth 最自然；重視預製登入 UI、組織與使用者管理可評估 Clerk；希望掌控 Auth 邏輯與 Provider 整合可看 Auth.js。

## Pros / Cons 比較

| 方案 | GitHub Stars | Pros | Cons | 適合 |
| --- | ---: | --- | --- | --- |
| [Supabase Auth](https://github.com/supabase/supabase) | 114,455 | 與 Supabase/RLS 身分整合 | Server Session 和 Token Claim 要驗證 | Supabase 資料系統 |
| [Clerk](https://github.com/clerk/javascript) | 1,776 | 登入元件、身分管理工作流 | 服務依賴、成本與整合邊界 | 快速建立會員體驗 |
| [Auth.js](https://github.com/nextauthjs/next-auth) | 28,375 | Provider、生態與架構可控 | Adapter、Session、資料庫策略需自行設計 | 自主管理 Auth 流程 |

*Stars 查詢日：2026-11-03；指上表連結的 GitHub Repository，而不是使用者數、客戶數、效能或安全評分。不同平台/SDK/Monorepo 範圍不對等，不能直接推論產品成熟度。備選工具未必由作者實際使用。*

## 選型的核心 Trade-offs

- 三個 Repo 的範圍不等價：Supabase 全平台、Clerk JS SDK、Auth.js 專案。Stars 不能直接代表 Auth 功能成熟度。
- Session Refresh、SSR Cookie、SameSite/CSRF 與 OAuth Callback 必須完整畫出資料流；Client 顯示登入狀態不是 Server 的授權依據。
- RLS 必須由 Database 證明 Row Ownership；只靠前端按鈕隱藏或 API Filter 不足以隔離會員資料。

## 實際案例與安全邊界

公開的 [home-way](https://github.com/ntustRay/home-way) 依賴 Clerk；較新的專案有 Supabase Auth 的評估與使用。文章只討論官方 SDK 與已公開的相依套件，不揭露私人使用者或環境變數。

## 最小驗收流程

1. 用 A/B 兩個測試帳號驗證讀寫越權全拒絕。
2. 測 OAuth Callback、過期/撤銷 Token、Session Refresh、登出。
3. 在 Server Action 和 API Route 重複驗證身分、輸入及 RLS。

## 何時不選預設方案

若是純內部、單用戶且不保存使用者資料，可避免引入完整 Auth；若企業 SSO/SCIM 是硬需求，要優先核對供應商功能與契約。

以上依官方文件與公開 Repository 內容整理；未對全部候選做同環境效能測試，設計與選型應以實際需求及部署條件核對。
