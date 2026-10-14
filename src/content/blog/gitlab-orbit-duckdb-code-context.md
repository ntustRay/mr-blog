---
title: "GitLab Orbit 把 Code Context 放進 DuckDB，適合解決哪些搜尋問題？"
description: "Orbit Local 用 parser 建立 code graph，讓 Agent 透過 SQL 找 definitions 與 references。它補上結構搜尋，但仍需要回頭讀 source code。"
pubDate: 2026-10-14
category: AI
tags: [AI Agents, Coding Agents, DuckDB]
draft: false
references:
  - title: "GitLab：How GitLab Orbit Local works"
    url: "https://docs.gitlab.com/orbit/local/how-it-works/"
  - title: "GitLab：Use GitLab Orbit Local with the GitLab Orbit CLI"
    url: "https://docs.gitlab.com/orbit/local/access/cli/"
---

Agent 想知道某個函數被誰呼叫，通常先搜尋名字，再逐個讀檔。名字太通用時，結果會混入註解、測試、同名函數，甚至無關字串。

GitLab Orbit Local 提供另一條路：用 parser 先建立 code graph，存進 DuckDB，再查 definitions、imports 與跨檔案 references。**它適合縮小調查範圍；查到 graph 後，仍然要讀實際 source code。**

本文依 2026-10-14 的官方文件整理，未在本機實測效能。Orbit Local 目前標示為 Beta，介面仍可能變動。

## DuckDB 在這裡存的是程式關係

依 [GitLab 的工作原理文件](https://docs.gitlab.com/orbit/local/how-it-works/)，Local pipeline 讀取目前 working tree，使用語言對應的 parser，抽取 definitions、imports 與 references，寫入 revision database。

它建立的 local graph 是 code-only，沒有 GitLab merge requests、pipelines 或使用者資料。不要把 Local 的能力和整個 SDLC 的 remote context 混在一起。

| 工具 | 適合的問題 | 需要補的證據 |
| --- | --- | --- |
| 文字搜尋 | 哪些檔案出現這個錯誤訊息？ | 出現的位置是否影響行為 |
| Code graph | 哪些 definitions 與 imports 有關聯？ | parser 是否能表示這條關係 |
| 讀 code、跑測試 | 實際會怎麼執行？ | 未覆蓋的動態路徑與輸入 |

對大量 TS modules，先找結構關係可能比先丟一堆檔案進 context 更有方向。但 runtime injection、字串動態取值等關係，仍需要額外調查，不能把查不到當成不存在。

## 先看 Schema，再寫 SQL

[目前的 CLI 文件](https://docs.gitlab.com/orbit/local/access/cli/)支援以下用法：

```sh
orbit index .
orbit schema gl_definition gl_edge
orbit sql --repo . -F json 'SELECT name FROM gl_definition LIMIT 3'
```

這三步分別建立索引、確認資料結構，以及查詢目前 checkout 的 definitions。範例沿用官方文件的 table 與 column 名稱；schema 更新後，先以 `orbit schema` 確認。

索引包含未 commit、且未被忽略的 source files。修改 code 後，也要考慮索引是否已經反映最新內容，不能讓 Agent 拿舊 graph 推論新檔案。

## 從 DuckDB 接到 Agent

官方 CLI 也提供：

```sh
orbit mcp serve
```

它以 stdio 暴露 local graph。對已經會用 SQL 的 Agent，優點是可以先看 schema，再查小範圍結果，避免把整份 repository 當成一次性的長 prompt。

可以給 Agent 的調查要求是：

```text
先查目標 symbol 與相關 definitions。
記錄 checkout、索引狀態與查詢條件。
只取必要結果；接著讀取命中的 source code。
用 code 與測試確認關係，再提出修改。
```

這是使用策略，並非 Orbit 的預設保證。

## 怎麼判斷值得加入工作流？

可以用同一組 repository 問題，比較原本的搜尋方式與 graph-assisted 搜尋。這是一個待執行的實驗設計：

- 找到正確檔案需要多久？
- 命中結果是否漏掉關鍵 caller？
- 索引建立與更新花多少時間？
- Agent 讀取的檔案數與返工次數有沒有下降？

先確認語言支援與查詢正確性，再看 token 數。少讀檔案但漏掉重要路徑，沒有真正省下工作。

Orbit 令人感興趣的地方，是把 repository 關係變成可查詢的資料。對已經熟悉 DuckDB 的團隊，這個模型相當直覺；是否值得常駐，仍要看索引的正確性與更新成本。
