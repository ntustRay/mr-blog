---
title: '[Insight] Web Authentication Component 03｜認證與資料授權要分開驗收'
description: 從共用 session 的操作結果，回頭驗證真實回呼、登出與兩個帳號間的資料隔離。
pubDate: 2026-11-26
category: Full-stack
tags: [React, Authentication, Authorization]
series: web-auth
seriesOrder: 3
references:
  - title: 套件安全責任說明
    url: https://github.com/ntustRay/web-authentication-component/blob/e5d66fb9154c6c8aaa5bdb13982acd8429ce079f/SECURITY.md
  - title: 既有專案遷移說明
    url: https://github.com/ntustRay/web-authentication-component/blob/e5d66fb9154c6c8aaa5bdb13982acd8429ce079f/docs/MIGRATION.md
---

前一篇驗到兩個元件會跟著同一份 session 更新。接進產品後，還要答一個不同的問題。假如測試帳號 A 能看到自己的私人資料，帳號 B 能不能取得同一筆？這個結果由 API／Server Action 或資料庫的 Row-Level Security 決定，與登入按鈕是否顯示無關。

## 把驗收拆成兩組

| 驗收位置 | 可以怎麼確認 |
| --- | --- |
| React 介面 | 登入後導覽與面板一致。取消 OAuth 後能重試，登出後畫面回到未登入。 |
| 認證服務 | 測試 GitHub 回呼與回到產品的目的地，重整後仍能讀到有效 session。 |
| 資料授權 | B 無法用自己登入後的產品操作讀取 A 的私人資料，未登入的訪客也無法讀取。 |
| 帳號切換 | 同一個分頁從 A 登出後用 B 登入，確認 A 的舊資料不留在共用 store 或快取。 |

共用元件的收益在於各站可以用同樣的方式處理 loading、錯誤回饋、語系和 session 顯示。保留各站身份服務的代價，是每個產品還要單獨驗收回呼與資料權限。這一層本來就受該產品的資料模型和存取條件影響，適合放在產品本身的整合測試。

既有產品若已經有帳號，先用測試環境對照遷移前後的 user ID 與資料歸屬，再換登入介面。若密碼政策也要改，另外驗舊帳號登入、新帳號註冊和密碼重設。套件預設的新密碼規則不會在一般登入時改寫輸入，但後端如何接受既有密碼，仍取決於產品使用的認證服務。

使用這個套件時，可以保留兩份驗收紀錄。一份確認共用 UI 如何處理正常與錯誤狀態，另一份記下每個產品的回呼、session 和資料授權。新增產品時能沿用前一份，再用自己的測試帳號補跑後一份。
