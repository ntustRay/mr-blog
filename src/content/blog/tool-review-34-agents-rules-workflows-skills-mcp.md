---
title: "[Review] AGENTS.md、Rules、Workflows、Skills、MCP：Agent 規範怎麼拆"
description: "這些不是五種互斥的 AI 工具。AGENTS.md/Rules 提供穩定的 Project Context，Workflow 定義工作階段，Skills 封裝可重用任務，MCP 提供對外工具與資料連接。"
pubDate: 2026-11-03
category: "AI & Agents"
series: tech-stack-comparisons
seriesOrder: 34
tags:
  - "AI Agents"
  - "MCP"
  - "Skills"
  - "AGENTS.md"
draft: false
references:
  - title: "AGENTS.md Specification"
    url: "https://agents.md/"
  - title: "Agent Skills"
    url: "https://agentskills.io/"
  - title: "MCP Introduction"
    url: "https://modelcontextprotocol.io/introduction"
---

這些不是五種互斥的 AI 工具。AGENTS.md/Rules 提供穩定的 Project Context，Workflow 定義工作階段，Skills 封裝可重用任務，MCP 提供對外工具與資料連接。

## 我的選型結論

小型專案先用 AGENTS.md 定義 Repository、Validation 和限制；重複任務再抽成 Skills；需要多人協作再明確 Workflow；確實有外部能力/資料介接時才導入 MCP。

## 比較表

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| AGENTS.md | — | 跨工具的專案入口、文字可讀 | 內容膨脹會污染 Context | Repository 規則 |
| Rules | — | 短而穩定、容易執行 | 重複或互相衝突會降低一致性 | 通用禁則與原則 |
| Workflows | — | 明確定義需求→設計→驗證→交付 | 過度流程化降低小任務效率 | 需要多階段的任務 |
| Skills | — | 按需載入專門程序/引用/腳本 | 版本與觸發條件要管理 | 重複且可驗收的操作 |
| MCP | — | 標準化 Tools/Resources/Prompts 介接 | 權限、Auth、傳輸/Server 維運成本 | 跨服務資料及動作 |

*Stars 依 2026-11-03 官方公開 Repository 的快照；不同 Platform/SDK/CLI/概念不具直接可比性，「—」表示無合適的獨立 Repository。Stars 不能證明效能、採用率或品質。列入候選不等於作者實際使用。*

## Trade-offs

- 沒有可比較的 GitHub Stars：Rows 是 Context/Workflow/Protocol 概念，不是同類別的單一 Repository，硬填 Stars 會誤導。
- Rules 適合高一致性但簡短；Workflow 定義什麼時候做；Skills 定義專家程序；不要把同一段步驟重複貼三次。
- MCP 的 Tool Schema 與外部權限需獨立驗證；讀取 Skill 或 Rule 不代表 Agent 已得到執行 Script 的授權。

## 可公開的實際案例

[agent-workspace-template](https://github.com/ntustRay/agent-workspace-template) 是公開範例：AGENTS.md 是入口、Markdown 文件記錄架構、.agents/skills 放獨立 Skill。可直接從 Repo 檢查，而不揭露公司內部流程。

## 實作或遷移前驗收

1. 給新 Agent 一個公開修 Bug 任務，檢查它是否先讀 AGENTS.md 並驗證限制。
2. 做同一個 Bug Fix 的 Workflow 與 Skill，測是否重複載入過量 Context。
3. 對外部 Tool 測 Permission Denied、失敗重試、Secret Redaction 與人工確認。

## 何時不要採用

單一小專案只需 AGENTS.md 就能清楚運作時，不要把每件事都加成 MCP Server 或龐大 Harness。

本文依官方文件與公開 Repository 的可驗證資訊整理，沒有聲稱完成各種工具的等條件 Benchmark；版本、平台與負載條件不同時需重新評估。
