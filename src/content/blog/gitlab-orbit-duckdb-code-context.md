---
title: "[News] GitLab Orbit 把 Code Context 放進 DuckDB，適合哪些搜尋問題？"
description: "用 GitLab Orbit Local 查函數定義、匯入和跨檔引用，並判斷哪些搜尋仍要回到原始碼。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, Coding Agents, DuckDB]
draft: false
references:
  - title: "GitLab：How GitLab Orbit Local works"
    url: "https://docs.gitlab.com/orbit/local/how-it-works/"
  - title: "GitLab：Use GitLab Orbit Local with the GitLab Orbit CLI"
    url: "https://docs.gitlab.com/orbit/local/access/cli/"
---

要改共用的 `computeScaling`，通常先搜名稱看看誰呼叫它。同名函數、註解和測試 fixture 都可能出現在結果裡。GitLab Orbit Local 提供另一種入口：先用語言 parser 讀目前 working tree，把定義、匯入和引用的關係存進 DuckDB，再讓 Agent 用 SQL 查。從 2026 年 10 月 14 日查閱的文件來看，Local 的圖譜主要是程式碼，GitLab 的 MR、Issue 等協作資訊要另外找。[GitLab Orbit Local 運作方式](https://docs.gitlab.com/orbit/local/how-it-works/)

## 先查關係，再回原始碼

查某個函數時，可以先找到定義，沿著引用關係挑幾個 call sites，再打開檔案確認。以下是官方 CLI 文件的例子，先建立目前 checkout 的索引，第二步看表結構，第三步才取少量結果。這裡沒有跑過實際 repo。[Orbit CLI 文件](https://docs.gitlab.com/orbit/local/access/cli/)

```sh
orbit index .
orbit schema gl_definition gl_edge
orbit sql --repo . -F json 'SELECT name FROM gl_definition LIMIT 3'
```

若要透過 MCP 提供同一份 local graph，CLI 文件另有透過標準輸入輸出（stdio）提供 MCP 的命令。`orbit mcp serve` 讀的是既有本機索引，因此要讓索引與 checkout 對得上。Agent 取到候選檔後仍要讀 source。動態註冊的 handler、透過字串組起來的名稱，或 parser 不支援的語言特性，都可能讓引用不完整。保留文字搜尋，正好能補這些情況。[CLI 與 MCP 入口](https://docs.gitlab.com/orbit/local/access/cli/)

評估要不要多維護一份索引，可以挑幾個已知答案的 repo 問題，例如一個直接 import、一個間接呼叫、一個動態註冊。比較找齊呼叫者花多久，把建立與更新索引的時間也算進去。只省下讀檔數、卻漏一條重要路徑，會把成本留給後續 review。
