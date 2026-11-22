---
title: "[Guide] 資安面試題：Browser 登入為什麼不能把 OAuth token 直接放 localStorage？"
description: "以 OAuth/OIDC browser app 為題，拆解 PKCE、BFF、refresh token rotation 與 token replay。"
pubDate: 2026-11-22
category: "Full-stack"
tags: [interview, OAuth, OIDC, Security]
draft: false
references:
  - title: "RFC 10017: OAuth 2.0 for Browser-Based Applications"
    url: "https://www.rfc-editor.org/rfc/rfc10017.html"
  - title: "RFC 9700: Best Current Practice for OAuth 2.0 Security"
    url: "https://www.rfc-editor.org/rfc/rfc9700.html"
  - title: "RFC 7636: PKCE"
    url: "https://www.rfc-editor.org/rfc/rfc7636.html"
---

OAuth 2.0 是授權框架；登入通常還需要 OIDC。把 access token 或 refresh token 交給 browser JavaScript，會讓 XSS、惡意 extension 或錯誤 redirect URI 成為帳號接管風險。

本題採 2026 年 8 月發布的 RFC 10017。它將 browser-based application 的 OAuth 安全建議整理為正式 RFC；RFC 9700 將 PKCE、exact redirect URI matching 與 refresh-token replay detection 列為 Best Current Practice。

## 這篇的重點

- 有 backend 的 web app，優先採 BFF + Authorization Code + PKCE；browser 只持有 Secure、HttpOnly、SameSite 的 session cookie，OAuth token 留在 server。
- PKCE 保護被攔截或注入的 authorization code；它不取代 state、redirect URI 驗證或 XSS 防護。
- Public browser client 若取得 refresh token，RFC 9700 要求 sender-constrained token 或 refresh token rotation；reuse 時撤銷 grant 並重新登入。

## 面試題目

為 SaaS 後台設計 Google / Microsoft OIDC 登入。前端是 React SPA，已有同一個 site 的 Node.js backend；使用者可付款與匯出資料。登入態維持 30 天，access token 最長 10 分鐘。

有人提議：SPA 完成 Authorization Code flow，把 access token 和 refresh token 放 localStorage。你會如何改設計？請處理 token 竊取、CSRF、authorization-code injection、refresh-token replay、登出與多分頁更新。

練習假設：IdP 支援 Discovery、Authorization Code flow、PKCE S256；app.example.com 和 api.example.com 都由團隊控制。分數僅為練習參考，不代表公司標準。

## 評分項目（練習參考，100 分）

| 項目 | 分數 | 重點 |
| --- | ---: | --- |
| 威脅模型與選型 | 20 | XSS、CSRF、code injection、replay；何時選 BFF |
| Code + PKCE | 20 | state、nonce、verifier/challenge 的綁定與一次性使用 |
| Token / session | 20 | 不讓 JS 讀 refresh token；cookie 與 scope |
| refresh / 失效 | 20 | rotation、reuse、grant revocation、logout |
| API 防護與驗證 | 20 | redirect、issuer/audience/expiry、測試與 audit |

## 建議架構與資料流

Browser 先向 BFF 的 login endpoint 請求登入。BFF 為這次交易產生高熵且一次性的 state、OIDC nonce、PKCE verifier；redirect 到 IdP 時只送 state 和由 verifier 的 SHA-256 得到的 challenge。IdP callback 回到 BFF 後，BFF 必須先比對 state，再用原 verifier 換 code，並依 Discovery/JWKS 驗 ID token 的簽章、issuer、audience、expiry 與 nonce。

成功後 BFF 建立 server-side session，回 HttpOnly cookie。Browser 的敏感 POST 同時帶 CSRF proof 或由 server 驗 Origin；HttpOnly 可防 script 讀 cookie，不能自動防 CSRF。BFF 以 server-side 的短 access token 呼叫 resource API；refresh token 加密保存，絕不回傳給 JavaScript。

## 四級示範回答

### 很好：90–100 分

「我會採 BFF。server 為每次登入產生 state、nonce 和 PKCE verifier，將交易和 browser 綁定、設短 TTL，callback 後立即刪除。callback 比對 state，以 verifier 換 code，並驗 issuer、audience、expiry、nonce 與簽章。成功後只設 session cookie，不把 OAuth token 當 cookie value。

refresh token 留 server；refresh 時以 transaction 或 compare-and-swap 原子更新 rotation 後的新 token。provider 回報 invalid 或 reused refresh token 時，撤銷同一 grant 的 session、要求重新登入、寫 audit event。redirect URI 是預先註冊的 exact match；return URL 僅允許相對 path 或 allowlist。」

這份回答具備資料流、攻擊面與失效機制。RFC 9700 建議所有 Authorization Code clients 使用 PKCE；public client 的 refresh token 必須 sender-constrained 或 rotation，S256 不暴露 verifier。這些是來源事實。

### 好：75–89 分

「用 Authorization Code + PKCE，不用 implicit flow。cookie 設 Secure、HttpOnly、SameSite；access token 短效、refresh token rotation；callback 驗 state。」

方向正確，但必須補上：reuse 時撤銷哪些 session、跨站 POST 如何防 CSRF、token claim 如何驗證。

### 普通：45–74 分

「token 放 localStorage，加 HTTPS、CORS、JWT expiry，過期就 refresh。」

HTTPS、CORS 與 expiry 有用，卻不能阻止成功執行的 XSS 讀取 localStorage。CORS 不是 resource server 授權，也沒有處理 PKCE、state/nonce、replay 或 redirect URI。

### 差：0–44 分

「前端永久保存 JWT；把 client secret 放前端環境變數。」

browser bundle 的環境變數不能當 confidential secret；永久 bearer token 放大外洩影響。驗 JWT 也要驗 issuer、audience、expiry 與 scope，不只驗簽章。

## 常見失敗與驗證

| 失敗 | 修正 |
| --- | --- |
| callback 接受任意 returnTo | 僅接受相對路徑或 allowlist；IdP redirect URI exact match |
| PKCE 使用 plain | 使用 S256 並拒絕 downgrade |
| 只設 HttpOnly | SameSite 加 Origin 或 CSRF 驗證 |
| rotation 沒有原子更新 | refresh 使用 transaction/CAS，明定並發策略 |
| token 只驗 expiry | 以 JWKS 驗 issuer、audience、expiry、nonce、scope |

驗證時應：以測試 IdP 跑完整 flow，確認 verifier 不在 bundle、localStorage 或 log；改掉 state、重播 callback、以不同 browser verifier 換 code 都要失敗；兩個並發 refresh 不可遺失新 token；在隔離環境重送已 rotation 的 refresh token，預期 grant/session 失效；audit log 不記 token、cookie 或 authorization code。

純 SPA public client 不是不能做，但 token protection、CSP、XSS containment、rotation 與 CORS 都成為一級問題。此題已有 backend 且有付款與匯出，BFF 是降低 credential exposure 的預設；它不是 mobile、跨域 API 或 third-party client 的唯一答案。高分關鍵是從資產、攻擊者能力、資料流到失效機制，說明每個元件為何存在。