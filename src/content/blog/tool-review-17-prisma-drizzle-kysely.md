---
title: "[Review] Prisma、Drizzle、Kysely：TypeScript Database Layer 怎麼選"
description: "ORM 和 Query Builder 的權責不同：Schema Migration、型別推導、SQL 結構、關聯查詢和交易流程，決定工具是否真正降低維護成本。"
pubDate: 2026-11-03
category: "Full-stack"
series: tech-stack-comparisons
seriesOrder: 17
tags:
  - "TypeScript"
  - "Prisma"
  - "SQL"
  - "Database"
draft: false
references:
  - title: "Prisma ORM Repository"
    url: "https://github.com/prisma/orm"
  - title: "Drizzle ORM Repository"
    url: "https://github.com/drizzle-team/drizzle-orm"
  - title: "Kysely Repository"
    url: "https://github.com/kysely-org/kysely"
  - title: "Prisma Docs"
    url: "https://www.prisma.io/docs/orm"
  - title: "Drizzle Docs"
    url: "https://orm.drizzle.team/docs/overview"
  - title: "Kysely Docs"
    url: "https://kysely.dev/"
---

ORM 和 Query Builder 的權責不同：Schema Migration、型別推導、SQL 結構、關聯查詢和交易流程，決定工具是否真正降低維護成本。

## 先說選擇

想要模型、Client 和 Migration 一體化可評估 Prisma；需要更貼近 SQL 的 Typesafe ORM 可評估 Drizzle；已具備 SQL 能力、偏好強型別 Query Builder 可選 Kysely。

## Pros / Cons 比較

| 方案 | GitHub Stars | Pros | Cons | 適合 |
| --- | ---: | --- | --- | --- |
| [Prisma ORM](https://github.com/prisma/orm) | 47,660 | Schema 與 Client 生態成熟 | Major 版本與 Query/Driver 行為需核對 | 模型導向團隊 |
| [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) | 36,205 | TS Schema、SQL 導向、可組合 | Migration、關聯策略由團隊明確定義 | SQL 熟悉者 |
| [Kysely](https://github.com/kysely-org/kysely) | 14,326 | 型別安全 Query Builder、SQL 透明 | 不包含完整 ORM 工作流 | 希望控制 SQL 的系統 |

*Stars 查詢日：2026-11-03；指上表連結的 GitHub Repository，而不是使用者數、客戶數、效能或安全評分。不同平台/SDK/Monorepo 範圍不對等，不能直接推論產品成熟度。備選工具未必由作者實際使用。*

## 選型的核心 Trade-offs

- Prisma 已將 Repository 移到 prisma/orm；2026-11-03 官方頁面顯示 Prisma 8 Release Candidate，不能把 RC 與正式版成熟度混為一談。
- SQL Debugging 仍需要看 Query Plan、Index 和 Transaction Lock；ORM 不會讓 N+1、Slow Query 自動消失。
- Migration 必須能回退/補資料/處理相容期；選工具時應測 Schema Diff 與正式部署策略。

## 實際案例與安全邊界

公開的 [home-way](https://github.com/ntustRay/home-way) 曾使用 Prisma；這代表實際接觸的工具，不代表已在同一專案比較過 Drizzle/Kysely 性能。

## 最小驗收流程

1. 用相同 Schema 建立 3 tables + relation + unique constraint。
2. 比較 N+1、Transaction、Batch Write 與 Migration Diff。
3. 記錄 SQL、EXPLAIN、Index 使用與跑測試的速度。

## 何時不選預設方案

只需要少量 SQL 或既有 query layer 已成熟時，直接使用參數化 SQL 可能比引入新 ORM 更可維護。

以上依官方文件與公開 Repository 內容整理；未對全部候選做同環境效能測試，設計與選型應以實際需求及部署條件核對。
