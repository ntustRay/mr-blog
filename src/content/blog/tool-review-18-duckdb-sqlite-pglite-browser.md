---
title: "[Review] DuckDB-Wasm、SQLite WASM、PGlite：Browser SQL 怎麼選"
description: "三種 Browser SQL 的核心工作負載不一樣：DuckDB 偏 Columnar OLAP、SQLite 偏嵌入式交易、PGlite 偏 PostgreSQL 相容。相容 SQL 不代表儲存、併發或擴充套件相同。"
pubDate: 2026-11-03
category: "Data & Visualization"
series: tech-stack-comparisons
seriesOrder: 18
tags:
  - "DuckDB"
  - "SQLite"
  - "PGlite"
  - "WebAssembly"
draft: false
references:
  - title: "DuckDB-Wasm Repository"
    url: "https://github.com/duckdb/duckdb-wasm"
  - title: "sql.js Repository"
    url: "https://github.com/sql-js/sql.js"
  - title: "PGlite Repository"
    url: "https://github.com/electric-sql/pglite"
  - title: "DuckDB-Wasm Docs"
    url: "https://duckdb.org/docs/stable/clients/wasm/overview"
  - title: "SQLite WASM Docs"
    url: "https://sqlite.org/wasm/doc/trunk/index.md"
  - title: "PGlite Docs"
    url: "https://pglite.dev/docs/about"
---

三種 Browser SQL 的核心工作負載不一樣：DuckDB 偏 Columnar OLAP、SQLite 偏嵌入式交易、PGlite 偏 PostgreSQL 相容。相容 SQL 不代表儲存、併發或擴充套件相同。

## 先說選擇

大量 CSV/Parquet 聚合、排序、報表與分析優先試 DuckDB-Wasm；小型嵌入式資料可看 SQLite WASM；要在 Browser 或測試環境執行接近 Postgres 的 SQL 可試 PGlite。

## Pros / Cons 比較

| 方案 | GitHub Stars | Pros | Cons | 適合 |
| --- | ---: | --- | --- | --- |
| [DuckDB-Wasm](https://github.com/duckdb/duckdb-wasm) | 2,162 | OLAP、Arrow/Parquet 資料交換 | WASM 記憶體/Thread/OPFS 支援需測 | Browser Analytics |
| [sql.js](https://github.com/sql-js/sql.js) | 13,680 | SQLite WASM，嵌入式 SQL 易上手 | 資料持久化與檔案同步要設計 | 小型本地資料 |
| [PGlite](https://github.com/electric-sql/pglite) | 16,229 | Postgres WASM，SQL 測試/資料模型接近 Postgres | 多連線、擴充與持久化仍有邊界 | Local Postgres PoC |

*Stars 查詢日：2026-11-03；指上表連結的 GitHub Repository，而不是使用者數、客戶數、效能或安全評分。不同平台/SDK/Monorepo 範圍不對等，不能直接推論產品成熟度。備選工具未必由作者實際使用。*

## 選型的核心 Trade-offs

- DuckDB-Wasm、SQLite、PGlite 不是通用替換：OLAP 掃描、Row Update 與 Postgres Function Support 的成本不同。
- WASM 不是免記憶體限制；大表先測 Import、Worker、ArrayBuffer/Arrow 生命週期與瀏覽器 Tab memory。
- OPFS、IndexedDB、Memory DB 與 Server DB 不同；需定義資料一致性、刷新、故障與匯出恢復策略。

## 實際案例與安全邊界

私有資料處理經驗不在文章公開；可公開的 [engineer-stock-data](https://github.com/ntustRay/engineer-stock-data) 是批次資料處理案例，這裡不把它錯稱為已用 DuckDB-Wasm 的 Benchmark。

## 最小驗收流程

1. 建立相同 100k、1M、10M rows 的合成 Fixture。
2. 分開量 Load、Filter、Group By、Sort、Export 與 Peak Memory。
3. 驗證空值、數值型別、時區、Persistence 與 Browser Compatibility。

## 何時不選預設方案

若資料已由 Server 篩好，Browser 沒必要再搬入完整資料庫；若需要可靠多人寫入與交易，改在 Server 使用資料庫更恰當。

以上依官方文件與公開 Repository 內容整理；未對全部候選做同環境效能測試，設計與選型應以實際需求及部署條件核對。
