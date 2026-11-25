---
title: "[News] Claude Fable 5.2：換模型前，先處理 preserved thinking 與 tool 相容性"
description: "Fable 5.2 收緊 preserved thinking 的前綴檢查。換模型前先驗舊訊息、動態工具和 fallback。"
pubDate: 2026-11-10
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - Harness
draft: false
references:
  - title: "Anthropic：Introducing Claude Fable 5.2 and Mythos 5.2"
    url: "https://www.anthropic.com/claude-fable-and-mythos-5-2"
  - title: "Anthropic：Claude Fable 5.2 overview"
    url: "https://platform.claude.com/docs/en/models/fable-5-2/overview"
  - title: "Anthropic：What's new in Fable 5.2"
    url: "https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2"
  - title: "Anthropic：Thinking blocks"
    url: "https://platform.claude.com/docs/en/build-with-claude/extended-thinking"
  - title: "Vals AI：Claude Fable 5.2 independent evaluation"
    url: "https://vals-ai.com/models/anthropic_claude-fable-5-2"
relatedPostIds:
  - model-routing-cost-quality
  - coding-agent-harness-176-configurations
  - gpt-6-1-terra-computer-use-cost
---

假設 Agent 跑到一半，使用者的 workspace 換了，應用就在下一個請求重建工具清單。以前可以直接改 `tools`，但 Claude Fable 5.2 在 2026 年 11 月 9 日發布後，使用 preserved thinking 的對話若改到已保存的前綴，可能回 400。換模型前先回放一段真的用過動態 tools 的舊對話，會比只改 model ID 更容易看出影響。[Anthropic 發布](https://www.anthropic.com/claude-fable-and-mythos-5-2)｜[相容性文件](https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2)

## 哪些舊資料算同一段對話？

Thinking blocks 是 API 用來延續推理的結構。已保留的 blocks 要按文件所需格式，和相應的訊息及工具歷史送回。系統 prompt、既有訊息或工具定義中途被改寫時，舊 blocks 未必能繼續用。Anthropic 文件另說明追加 system message 與指定 beta header 的工具更新方式；採用前先看握有的 API 版本和工具類型是否支援。若要切換到其他模型，則要測是否會捨棄 Fable 的 thinking blocks，並準備用必要的事實與工具結果組一段可以重新驗收的 context。[Thinking blocks](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)｜[Migration 文件](https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2)

官方原刊所列價格是每百萬 input tokens 8 美元、output tokens 40 美元，預設 high effort。高難度任務試跑時，把模型切換和變更工具的 failure case 加進來，也要對照 computer-use 或 advisor toolset 的版本。測成功率、400 次數、重跑時間與任務總成本，才能知道新的 session 規則值不值得承擔。[Model overview](https://platform.claude.com/docs/en/models/fable-5-2/overview)｜[獨立評測](https://vals-ai.com/models/anthropic_claude-fable-5-2)
