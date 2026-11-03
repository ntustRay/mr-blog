---
title: "[Review] Zod、Valibot、ArkType：TypeScript Schema Validation 怎麼選"
description: "TypeScript 型別只在編譯期存在，外部 JSON、FormData、Cookie 和 API Response 仍需在 Runtime 驗證。工具選型要看 Schema 的可讀性、錯誤格式、推導能力與 Bundle。"
pubDate: 2026-11-03
category: "Full-stack"
series: tech-stack-comparisons
seriesOrder: 19
tags:
  - "TypeScript"
  - "Zod"
  - "Validation"
  - "API"
draft: false
references:
  - title: "Zod Repository"
    url: "https://github.com/colinhacks/zod"
  - title: "Valibot Repository"
    url: "https://github.com/open-circle/valibot"
  - title: "ArkType Repository"
    url: "https://github.com/arktypeio/arktype"
  - title: "Zod Basics"
    url: "https://zod.dev/basics"
  - title: "Valibot Guide"
    url: "https://valibot.dev/guides/introduction/"
  - title: "ArkType Docs"
    url: "https://arktype.io/docs/intro"
---

TypeScript 型別只在編譯期存在，外部 JSON、FormData、Cookie 和 API Response 仍需在 Runtime 驗證。工具選型要看 Schema 的可讀性、錯誤格式、推導能力與 Bundle。

## 先說選擇

團隊熟悉度、維護與周邊整合優先可用 Zod；表單或 Browser Bundle 更敏感可評估 Valibot 的模組式 API；偏好型別語法表達 Schema 可評估 ArkType。

## Pros / Cons 比較

| 方案 | GitHub Stars | Pros | Cons | 適合 |
| --- | ---: | --- | --- | --- |
| [Zod](https://github.com/colinhacks/zod) | 44,247 | parse/safeParse 簡單、整合廣 | 複雜 Schema 與 Bundle 需檢查 | 全端輸入驗證 |
| [Valibot](https://github.com/open-circle/valibot) | 9,052 | 模組化、可組合 Validation | API 表達方式與插件需適應 | 重視 Bundle 的表單 |
| [ArkType](https://github.com/arktypeio/arktype) | 7,892 | 型別導向 Validation 語法 | 團隊熟悉度與 TypeScript 設定有門檻 | 複雜型別方案 |

*Stars 查詢日：2026-11-03；指上表連結的 GitHub Repository，而不是使用者數、客戶數、效能或安全評分。不同平台/SDK/Monorepo 範圍不對等，不能直接推論產品成熟度。備選工具未必由作者實際使用。*

## 選型的核心 Trade-offs

- parse/safeParse 的差別在控制流程；API 邊界更適合失敗時明確回傳可定位的錯誤，而不是吞掉無效欄位。
- 資料校驗不能等同權限驗證。結構正確的 userId 仍需要 Server 根據登入身分判斷可否操作。
- Bundle、TypeScript Compile Time、Runtime Parse Cost 各自測量；只看一個 Microbenchmark 不能推論整體應用。

## 實際案例與安全邊界

[engineer-stock-data](https://github.com/ntustRay/engineer-stock-data) 公開採用 Zod 驗證資料契約。替代工具的比較以公開文件為主，並非同條件實測。

## 最小驗收流程

1. 用缺值、錯誤數字、NaN、未知欄位與 Nested Array 做 Fixture。
2. 確定 Validation Errors 能映射到 UI/API Contract。
3. 量 API Validation 時間、TS Typecheck 與 Client Bundle。

## 何時不選預設方案

資料若在受信任的內部函式傳遞，避免無意義地每層 parse；但跨網路與持久資料的邊界仍應驗證。

以上依官方文件與公開 Repository 內容整理；未對全部候選做同環境效能測試，設計與選型應以實際需求及部署條件核對。
