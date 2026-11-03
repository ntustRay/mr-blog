---
title: "[Review] Supabase、Firebase、Appwrite：BaaS 怎麼選"
description: "BaaS 把 Database、Auth、Storage、Realtime 等服務組合成一個產品。比較前先拆解自己的需求，避免為了簡化部署而把業務資料模型綁死在平台的預設能力。"
pubDate: 2026-11-03
category: "Full-stack"
series: tech-stack-comparisons
seriesOrder: 15
tags:
  - "Supabase"
  - "Firebase"
  - "BaaS"
  - "Database"
draft: false
references:
  - title: "Supabase Repository"
    url: "https://github.com/supabase/supabase"
  - title: "Firebase SDK Repository"
    url: "https://github.com/firebase/firebase-js-sdk"
  - title: "Appwrite Repository"
    url: "https://github.com/appwrite/appwrite"
  - title: "Supabase Docs"
    url: "https://supabase.com/docs"
  - title: "Firebase Documentation"
    url: "https://firebase.google.com/docs"
  - title: "Appwrite Documentation"
    url: "https://appwrite.io/docs"
---

BaaS 把 Database、Auth、Storage、Realtime 等服務組合成一個產品。比較前先拆解自己的需求，避免為了簡化部署而把業務資料模型綁死在平台的預設能力。

## 先說選擇

偏好 PostgreSQL、SQL 與 RLS，可先評估 Supabase；既有 Google/Firebase 應用、Firestore 使用模式成熟可沿用 Firebase；需要自架與掌握部署，可比較 Appwrite 的維運成本。

## Pros / Cons 比較

| 方案 | GitHub Stars | Pros | Cons | 適合 |
| --- | ---: | --- | --- | --- |
| [Supabase](https://github.com/supabase/supabase) | 114,455 | PostgreSQL、Auth、Storage、RLS | RLS、Migration 與資料庫維護仍需設計 | SQL 中心的全端專案 |
| [Firebase SDK](https://github.com/firebase/firebase-js-sdk) | 5,157 | Firestore/Google 生態與前端 SDK | NoSQL 資料模型與查詢設計需重學 | 已採 Firebase 的產品 |
| [Appwrite](https://github.com/appwrite/appwrite) | 57,853 | 多種 Backend 服務及自架選擇 | 自架需要升級、監控、備份與資源管理 | 重視自架控制權 |

*Stars 查詢日：2026-11-03；指上表連結的 GitHub Repository，而不是使用者數、客戶數、效能或安全評分。不同平台/SDK/Monorepo 範圍不對等，不能直接推論產品成熟度。備選工具未必由作者實際使用。*

## 選型的核心 Trade-offs

- Supabase Repository 是平台 Monorepo、Firebase 此處是 JS SDK、Appwrite 是核心平台；表格 Stars 不可橫向解讀成市場佔有率。
- Data Model 比 Serverless 便利性重要：Join、複雜篩選、索引、複合資料安全規則會決定後續成本。
- 帳號數、Storage Egress、Function 執行、Realtime Connection 與備份政策應依預期用量估算，而非只看 Free Tier。

## 實際案例與安全邊界

[工程師選股公開資料 Repo](https://github.com/ntustRay/engineer-stock-data) 把批次資料快照與網站會員資料分開；這是可公開的架構邊界。私人網站程式碼、帳號、Schema 及服務設定不在本文揭露。

## 最小驗收流程

1. 列出 CRUD、Join、RLS、Storage 與 Auth 的必要 Use Cases。
2. 以 1 萬筆合成資料測關鍵查詢、索引與成本模型。
3. 測跨使用者資料隔離、Token Expiry、備份恢復和停機處理。

## 何時不選預設方案

如果產品只是公開靜態資料查詢，不需要為了使用 Backend 而強行引入 BaaS；已有成熟 Database Infrastructure 時也可以維持原架構。

以上依官方文件與公開 Repository 內容整理；未對全部候選做同環境效能測試，設計與選型應以實際需求及部署條件核對。
