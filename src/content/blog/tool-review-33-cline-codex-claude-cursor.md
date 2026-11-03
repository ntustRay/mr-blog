---
title: "[Review] Cline、Codex、Claude Code、Cursor：Coding Agent 怎麼選"
description: "Coding Agent 選型不能只有模型 Benchmark：Repository 讀取、Tool Permissions、Sandbox、Approval、Context Management、價格與使用場所才是工作流差異。"
pubDate: 2026-11-03
category: "AI & Agents"
series: tech-stack-comparisons
seriesOrder: 33
tags:
  - "AI Agents"
  - "Codex"
  - "Cline"
  - "Developer Tools"
draft: false
references:
  - title: "Cline Repository"
    url: "https://github.com/cline/cline"
  - title: "Codex Repository"
    url: "https://github.com/openai/codex"
  - title: "Claude Code Repository"
    url: "https://github.com/anthropics/claude-code"
  - title: "Cline Docs"
    url: "https://docs.cline.bot/"
  - title: "Codex Docs"
    url: "https://developers.openai.com/codex/"
  - title: "Claude Code Docs"
    url: "https://code.claude.com/docs"
  - title: "Cursor Docs"
    url: "https://cursor.com/docs"
---

Coding Agent 選型不能只有模型 Benchmark：Repository 讀取、Tool Permissions、Sandbox、Approval、Context Management、價格與使用場所才是工作流差異。

## 我的選型結論

強調 VS Code 內對話與可配置模型/工具可研究 Cline；需要 Agent CLI/跨檔案程式修改可比較 Codex 或 Claude Code；偏好整合式 Editor 體驗可評估 Cursor。

## 比較表

| 方案 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [Cline](https://github.com/cline/cline) | 71,231 | IDE 中的 Agent Workflow 與可擴充模型連接 | 設定、Token/Tool 成本與安全邊界需掌握 | VS Code Agent |
| [Codex](https://github.com/openai/codex) | 132,889 | Coding Agent CLI/Runtime 與工具流程 | Sandbox/授權/Runtime 行為需理解 | 程式碼修改任務 |
| [Claude Code](https://github.com/anthropics/claude-code) | 154,308 | Terminal Agent、工具與工作流擴充 | 模型成本與授權、平台限制需核對 | Terminal 工程流程 |
| Cursor | — | 整合式 AI Editor Experience | 閉源產品的功能、隱私與價格需評估 | IDE 一體化 |

*Stars 依 2026-11-03 官方公開 Repository 的快照；不同 Platform/SDK/CLI/概念不具直接可比性，「—」表示無合適的獨立 Repository。Stars 不能證明效能、採用率或品質。列入候選不等於作者實際使用。*

## Trade-offs

- GitHub Stars 只對前三個公開 Repository 有意義；Cursor 沒有等價開源實作可直接比較。任何工具都不可由 Stars 推論模型品質。
- Tool Use 與 Shell/Edit Permission 需要最小權限；不要讓 Agent 自動執行未知 Script、讀取 Secrets 或推送未經審核的變更。
- Agent 速度要算端到端：需求澄清、編輯、測試、Review 與人工修正。Tokens/Task 與 Correctness 應一起記錄。

## 可公開的實際案例

[agent-workspace-template](https://github.com/ntustRay/agent-workspace-template) 採 tool-neutral AGENTS.md 與獨立 Skills，降低綁定單一 Coding Agent 的成本。文中不透露私人 Agent Context、Prompt 或環境設定。

## 實作或遷移前驗收

1. 對同一個公開 Fixture 問題固定輸入與驗收測試。
2. 記錄 Patch Quality、Tests Passed、Human Fixes、Tool Calls、Cost。
3. 比較離線/內網限制、Secret Handling、Permission Prompt、Commit Control。

## 何時不要採用

需要嚴格離線與資料主權的環境，先問工具能否合規連線與本地執行；不可只因功能強就越過資料邊界。

本文依官方文件與公開 Repository 的可驗證資訊整理，沒有聲稱完成各種工具的等條件 Benchmark；版本、平台與負載條件不同時需重新評估。
