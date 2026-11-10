---
title: "[News] Claude Fable 5.2：換模型前，先處理 preserved thinking 與 tool 相容性"
description: "Claude Fable 5.2 強化長時間 Agent 工作，但 thinking blocks、動態 tool schema、模型切換與 computer-use toolset 可能讓既有整合直接回傳 400。整理導入條件與 migration checklist。"
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

Claude Fable 5.2 在 **2026 年 11 月 9 日**發布。官方主打長時間 Agent 工作、coding、reasoning 與 vision；對已經在 production 跑 Agent 的團隊，更急迫的問題是 migration。

Fable 5.2 對 preserved thinking 加入更嚴格的 prefix check。若應用程式重寫舊訊息、調整 system prompt、動態更換 tools，或把同一段 conversation 路由到較舊模型，可能在模型開始推理前就失敗。這些行為在 MCP tool discovery、context compaction、fallback routing 與 multi-agent orchestration 都很常見。

本文根據 Anthropic 的 launch、model overview、migration 文件與 Vals AI 的獨立評測整理，沒有自行呼叫 Fable 5.2 API，也沒有重跑 benchmark。

## TL;DR

Fable 5.2 值得放進高難度 Agent 任務的 eval set，但不適合只改 model ID 就直接上線。

採用前至少要檢查四件事：conversation history 是否保持 append-only、tool schema 是否會在對話中途變動、fallback model 能否讀取 Fable 5.2 thinking blocks，以及 computer-use／advisor tool 的版本是否相容。官方建議仍是多數工作先用最新版 Opus；只有在 Opus 提高 effort 後仍無法通過自家 eval，才考慮 Fable。

## 能力與成本：有進步，也有明顯取捨

[官方 model overview](https://platform.claude.com/docs/en/models/fable-5-2/overview)列出的規格是 1M context window、最多 128K output tokens，API 價格為每百萬 input tokens 8 美元、output tokens 40 美元。Adaptive thinking 永遠開啟，預設 effort 為 high。

Anthropic 在 FrontierCode 2.0 的結果中，宣稱 Fable 5.2 High 達到 45.3%，接近 Opus 5.5 Max 的 45.5%，每題成本約為後者一半；Xhigh 則為 49.1%。這些是供應商提供的測試結果，不能直接當成 production workload 的保證。

[Vals AI 的獨立評測](https://vals-ai.com/models/anthropic_claude-fable-5-2)提供另一組訊號。該站以 high effort 測試 Fable 5.2，結果呈現明顯的 workload 差異：

| 評測 | 結果 | 解讀限制 |
| --- | ---: | --- |
| Vals Index | 71.31% | 排名第 1，但平均每個 test 成本為 17.94 美元 |
| Vibe Code | 93.77% | 排名第 1，偏向特定 coding 工作型態 |
| Terminal-Bench 4.0 | 65.15% | 與 Opus 並列第 1；結果受 harness 影響 |
| SWE-bench Multimodal | 62.29% | 排名第 2，低於 Opus 的 70.21% |
| Tax Agent | 32.09% | 排名第 27，顯示能力不會平均轉移到每種 Agent 任務 |

因此，導入依據應該是自己的 task distribution、成功率、總成本與 latency，而非單一排行榜名次。Vals 頁面也顯示單次測試平均耗時超過 43 分鐘；長時間任務的能力提升，會連帶放大 timeout、重試與人工等待成本。

## 四個容易讓既有 Agent 直接壞掉的改動

[Anthropic 的 Fable 5.2 migration 文件](https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2)列出四項 breaking changes。它們影響的是 request 與 session contract，不只影響 prompt 品質。

| 改動 | 常見踩雷位置 | 可能結果 |
| --- | --- | --- |
| Prefix check 套用到所有 account | 修改舊 system prompt、tools 或 message history | 回傳 `block bound to a different conversation` 的 400 error |
| Fable 5.2 thinking blocks 只供 Fable／Mythos 5.2 讀取 | 對話中途 fallback 到 Opus 或其他模型 | thinking blocks 被丟棄，原本的推理狀態不會延續 |
| 舊版 `computer_20251124` tool | 既有 computer-use integration | 除 Bedrock 外會回傳 400，須改用 `computer_toolset_20260801` |
| Advisor model 必須相容 | Fable executor 搭配較舊 advisor model | tool call 無法照原本配置運作 |

這裡最容易被低估的是 prefix check。Preserved thinking block 綁定產生它的 conversation prefix；應用程式若改了前面的任何內容，伺服器會拒絕 request。官方要求 history 保持 append-only，也建議使用 on-demand compaction 來維持這個條件。

### 動態 MCP tools 需要重新設計更新方式

許多 MCP client 會依使用者權限、workspace 或 server 連線狀態，重新產生 tool list。若程式直接修改 request 裡既有的 `tools` 欄位，Fable 5.2 可能把它視為不同 conversation。

官方提供的方向是在對話中追加 system message，再搭配指定 beta header 描述 tool 更新。工程上還要補一層 decision：tool schema 變更時，是啟動新 conversation、明確追加更新，還是保留舊 schema 到該 session 結束。每種作法都需要用實際 replay 測試，不能只確認第一輪 tool call 成功。

### Model routing 不再只是成本選擇

若 router 在 thread 中途把 Fable 5.2 降級到 Opus，thinking blocks 會被丟棄。這使 routing 從「哪個模型比較划算」增加成 state compatibility 問題。

比較安全的策略是以完整 conversation 為 routing 單位；真的需要中途切換時，把它當成新的 execution episode，明確重建可驗證的 context，並接受隱含推理狀態不會搬過去。對 failover 也要採用相同假設，不能期待換供應商後無縫續跑。

## 建議的 migration checklist

以下是依官方相容性文件整理的工程檢查順序；其中 replay、metrics 與 rollout 是導入建議，不代表 Anthropic 已替你的環境驗證。

1. **保存真實 session fixture。** 取出會使用 MCP、compaction、subagent、computer use 與 fallback 的匿名化 request sequence，固定成 replay set。
2. **檢查所有 history mutation。** 找出會重寫 system prompt、刪改 message、重排 content block 或替換 tool schema 的程式碼。Fable session 原則上要維持 append-only。
3. **把 `drop_block` 當成過渡方案。** 官方 beta 可以在 prefix 不符時丟棄 thinking block，但可能增加 output tokens。必須記錄 `input_transformations`、token 數與成功率，避免 silent degradation。
4. **更新 computer-use toolset。** 非 Bedrock 平台改用 `computer_toolset_20260801`，並重新測 screenshot、action、timeout 與 approval flow。
5. **檢查 advisor 與 subagent model。** Fable executor 的 advisor 必須是 Fable 5.2 或 Mythos 5.2；變更後啟動新 conversation。Subagent 也要獨立計算成本，官方提醒它可能占 session 大部分費用。
6. **移除不相容參數。** 不要送 `temperature`、`top_p`、`top_k`；forced `tool_choice` 的 `any`／指定 tool 也會回 400，改用 `auto` 搭配 strict tool definitions，並測試模型是否真的選到正確工具。
7. **以 effort sweep 做整組 eval。** 從 high 開始，測 high／xhigh 的成功率、總 token、wall time 與人工介入次數。評估對象應是「model + harness + tool versions」，不是只比較 model 名稱。
8. **小流量 rollout。** 先放到失敗成本可控、又確實需要長時間推理的任務；對 400 error、thinking block drop、tool selection 與 timeout 設獨立告警。

## 現在適合採用嗎？

若團隊有高價值、長時間、可用 eval 驗證的 coding 或 research agent，Fable 5.2 適合進入受控測試。官方與獨立結果都顯示它在部分高難度 workload 有競爭力，降價後仍屬高成本模型，且 default high effort 會使成本與 latency 更難被忽略。

對一般 chat、短任務或大量背景 automation，現階段沒有足夠理由全面替換。除了價格，還要考慮三項風險：模型剛發布，獨立 production 回報仍少；thinking block 與 tool contract 有 breaking changes；官方文件要求 30 天資料保留，除非帳號獲得明確的 Zero Data Retention 授權。

最務實的採用標準是：最新版 Opus 在較高 effort 仍通不過自己的 eval，而且 Fable 5.2 能以可接受的總成本、延遲與失敗模式補上缺口。通過這個門檻後，再把 migration checklist 當成 release gate。
