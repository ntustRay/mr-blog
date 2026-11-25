---
title: "[News] Deep Agents 0.2.3：MCP 工具越多，Schema 該怎麼延後載入？"
description: "Deep Agents Code 0.2.3 讓支援的 provider 延後呈現 MCP schema。如何核對工具找對了，且成本真的下降？"
pubDate: 2026-11-03
category: "AI & Agents"
tags: [AI Agents, MCP, Harness]
draft: false
references:
  - title: "Deep Agents Code 0.2.3 release notes"
    url: "https://github.com/langchain-ai/deepagents/releases/tag/deepagents-code%3D%3D0.2.3"
  - title: "Deep Agents PR #7304：defer MCP schemas with provider-native tool search"
    url: "https://github.com/langchain-ai/deepagents/pull/7304"
  - title: "Deep Agents PR #7384：apply hook command rewrites before tool approval"
    url: "https://github.com/langchain-ai/deepagents/pull/7384"
relatedPostIds:
  - skills-over-mcp-remote-distribution
  - coding-agent-harness-176-configurations
  - production-mcp-registry-gateway-identity-policy
---

Agent 只要讀一個檔案，開場卻得看到 Slack、GitHub 和十幾套外部工具的參數說明。當工具很多，模型可能先被一批用不到的名稱與描述佔住 context。Deep Agents Code 0.2.3 於台北時間 2026 年 11 月 3 日發布，讓支援的 provider 先找工具，再讓選到的工具定義進入模型可見範圍。核心 coding tools 仍然立即可用。[0.2.3 release](https://github.com/langchain-ai/deepagents/releases/tag/deepagents-code%3D%3D0.2.3)

## 延後的是模型看到 schema 的時點

`ProviderToolSearchMiddleware` 會在確認支援的 OpenAI Responses API 和 Anthropic Messages 路徑標記 MCP tools 為 deferred。原本的完整 schema 仍可能出現在送往 provider 的 HTTP payload；若走 Chat Completions、Gemini 等未啟用的路徑，則沿用 eager loading。量測時把三個數字分開記：request bytes、模型 token 和搜尋多花的延遲。這樣才能知道省在何處。[工具搜尋 PR](https://github.com/langchain-ai/deepagents/pull/7304)

拿同一組 20–50 個工具和固定任務比較，可以加入幾個名稱相似的工具，也加入不需要工具的題目。記錄正確工具是否被找到、是否多一次錯誤呼叫，以及整輪完成時間。只有幾個工具時，直接給 schema 通常比較容易追問題。若升級後想暫時對照原先路徑，可以使用 release 對應的設定關掉 provider tool search。

```toml
[models]
provider_tool_search = false
```

同版還修了 tool approval 的順序：pre-tool hook 如果會改寫命令，先完成改寫，再顯示給使用者核准。驗收可檢查核准畫面和實際執行的輸入是否一致。這項修正和省 context 各自解不同的問題。[工具核准變更](https://github.com/langchain-ai/deepagents/pull/7384)
