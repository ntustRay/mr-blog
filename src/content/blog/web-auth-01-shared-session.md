---
title: '[Insight] Web Authentication Component 01｜共用登入介面，各站保留自己的帳號'
description: 以 GitHub-only 和 Email／Password 兩種產品需求為例，拆解共用 React 介面、controller 和 identity provider 的分工。
pubDate: 2026-11-26
category: Full-stack
tags: [React, TypeScript, Authentication]
series: web-auth
seriesOrder: 1
references:
  - title: Web Authentication Component 專案說明
    url: https://github.com/ntustRay/web-authentication-component/blob/e5d66fb9154c6c8aaa5bdb13982acd8429ce079f/README.md
  - title: 套件架構與狀態說明
    url: https://github.com/ntustRay/web-authentication-component/blob/e5d66fb9154c6c8aaa5bdb13982acd8429ce079f/docs/ARCHITECTURE.md
---

一個內部工具只開 GitHub 登入，另一個公開產品還要 Email 註冊、驗證與重設密碼。兩站都得做 loading、表單回饋和登入後的導覽列。這些行為可以共用，但兩個產品可能繼續用各自的資料庫、登入服務和權限規則。

Web Authentication Component 把可共用的部分做成 React 套件。最小用法是把 `AuthPanel` 和 `AuthStatus` 放在同一個 `AuthProvider` 下。前者負責登入介面，後者可放到導覽列。兩者從同一個 controller 讀 session，畫面就不用各自猜測登入狀態。

## 按下 GitHub 登入後發生什麼事

面板呼叫 controller，controller 檢查這個產品是否啟用了 GitHub，再請 adapter 把請求轉成認證服務的 API。真正的 OAuth 跳轉、回呼與 session 由該服務處理。若改走 Email／Password，面板和 controller 仍可共用，但註冊、驗證與重設密碼所需的能力必須由服務提供。

這個分工也說明切換成本。產品可以先套共用介面，再決定是否替換認證服務。若新的 adapter 缺少某個操作，例如 Email 驗證，產品就要縮小啟用功能，或補齊服務能力後再開放。設定時明確列出可用方法，可以在一開始擋住介面與服務不一致的組合。

下一篇先在公開 Playground 試同一個帳號區塊如何跟著登入、登出更新，再把相同組合搬到已有 GitHub provider 的 React 專案。

[下一篇｜跑 GitHub-only 登入流程並接入 React](../web-auth-02-github-panel/)
