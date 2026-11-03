---
title: "[News] Deep Agents 0.2.3：MCP 工具越多，Schema 該怎麼延後載入？"
description: "Deep Agents Code 0.2.3 改用 provider-native tool search 延後載入 MCP tool schema。這能減少模型一開始看到的工具說明，但也帶來相容性、量測與 fallback 問題。"
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

Agent 接的 MCP server 越多，模型一開始收到的 tool schema 也越長。即使這一輪只需要讀一個檔案，十幾套整合的名稱、描述與參數仍可能一起進入 context。

[Deep Agents Code 0.2.3](https://github.com/langchain-ai/deepagents/releases/tag/deepagents-code%3D%3D0.2.3) 在 2026 年 11 月 2 日發布，其中一項改動是用 provider-native tool search 延後載入 MCP tool schema。這篇依 release、merged PR 與測試程式整理；我沒有在本機跑 Deep Agents，也沒有可比較的 token、延遲或成功率實測。

## TL;DR

- 支援的 OpenAI Responses API 與 Anthropic Messages 路徑，會把 MCP tools 標成 deferred，讓模型先搜尋再選用；核心 coding tools 仍立即可見。
- 這項設計減少的是模型一開始看到的 schema。完整 schema 仍可能出現在送往 provider 的 HTTP payload，不能直接推論網路流量或帳單一定下降。
- Chat Completions、Gemini、未知的 custom endpoint 會回到 eager loading；本地模型也不能假設自動支援。
- 採用前要量 tool discovery recall、首次選對工具率、time to first action、總 token 與 fallback 比例，不能只看初始 prompt 變短。

## Eager loading 的成本發生在哪裡？

傳統做法會在模型開始推理前，把所有可用 tools 的 schema 一起送入。工具很少時，這個流程直接、可攜，也容易除錯。當 MCP servers 逐步增加，問題才會浮現：

- 與任務無關的 schema 也占用模型可見的 context。
- 名稱相近的工具一起出現，增加選錯或重複呼叫的機會。
- 每次新增 server 都改變同一輪的工具集合，eval 很難只比較 Agent 本身的行為。

延後載入把流程拆成兩步：模型先使用 provider 提供的 tool search，再取得符合查詢的工具。這和把 Skill 放進遠端目錄不同；Skill 處理知識或工作流程的配送，這裡處理的是 runtime 中 tool schema 何時對模型可見。

| 模式 | 優點 | 主要代價 |
| --- | --- | --- |
| Eager loading | 相容範圍廣，請求與除錯路徑單純 | 工具越多，初始 context 越擁擠 |
| Deferred loading | 先縮小模型可見工具集合，再進行呼叫 | 依賴 provider 能力，還多一個 discovery 行為要評估 |

## Deep Agents 0.2.3 實作了什麼？

[PR #7304](https://github.com/langchain-ai/deepagents/pull/7304) 顯示，Deep Agents Code 預設在已確認支援的模型與 endpoint 啟用 `ProviderToolSearchMiddleware`。它只延後 MCP tools，保留核心 coding tools 立即可用，也沒有移除既有 executor、approval、filtering 與 cost accounting。

功能可以用設定或環境變數關閉：

```toml
[models]
provider_tool_search = false
```

```bash
DEEPAGENTS_CODE_PROVIDER_TOOL_SEARCH=false
```

PR 中的 unit tests 覆蓋了幾個重要路徑：OpenAI Responses API 的搜尋與 resume、Anthropic 的 deferred tool 格式、approval 後執行，以及不支援的模型回到 eager tools。這些測試能證明序列化與控制流程有被檢查，仍不等同真實專案中的成功率或成本 benchmark。

相容性也有清楚邊界。Deep Agents 會自動辨識列入支援的 OpenAI、Anthropic 模型與 LangSmith Gateway 路徑；Chat Completions、Gemini 與未辨識的 custom endpoint 保持 eager。自訂 provider profile 雖可明確宣告支援，團隊要自行承擔錯誤宣告造成的行為差異。

這對離線或自架模型尤其重要。若模型 API 沒有同等的 tool search semantics，升級 Deep Agents 不會憑空得到 deferred loading；較實際的替代方案是維持小型固定工具集，或在應用層先做 deterministic routing，再把縮小後的 schemas 交給模型。

## 初始 Context 變短，不代表整體成本一定更低

這項改動最容易被誤讀成「MCP schema 不再傳送」。PR 說明與測試呈現的是另一件事：工具仍可帶著完整參數定義送往 provider，只是標記成延後載入，讓模型不必一開始就把全部 schema 當成可見工具使用。

因此至少要把三種成本分開：

1. 模型實際計入的 input context 與帳單 token。
2. Client 到 provider 的 request payload 大小。
3. Tool search 多出來的延遲、呼叫或失敗重試。

三者可能同時改善，也可能只改善第一項。沒有 provider 端計費與 trace 資料時，不宜把「deferred」直接寫成節省百分之多少成本。

## 真正該驗證的是 Discovery 品質

PoC 可以挑 20 至 50 個 tools，準備一組固定任務，同時跑 eager 與 deferred 兩條路徑。每次保留相同模型、temperature、task 與 approval policy，至少記錄：

| 指標 | 要回答的問題 |
| --- | --- |
| Tool discovery recall | 正確工具是否被搜尋結果找回？ |
| 首次選對工具率 | Agent 第一次呼叫是否選對 tool？ |
| Time to first action | 從送出任務到第一次有效操作花多久？ |
| 總 input／output token | 搜尋步驟是否真的降低整體 token？ |
| Tool call 與 retry 次數 | Context 變短後，是否用更多探索補回來？ |
| Eager fallback 比例 | 有多少 session 因模型或 endpoint 不支援而退回？ |

還要保留一組「不該找到任何工具」的任務。若搜尋總會回傳看似相關的 tool，Agent 可能只是把 context pollution 換成 discovery false positive。

## Approval 顯示的必須是最後要執行的輸入

同一版還合併了另一項值得注意的修正：[PR #7384](https://github.com/langchain-ai/deepagents/pull/7384) 讓 pre-tool hook 的 command rewrite 先發生，再向使用者要求 approval。Approval、實際執行與後續 hooks 都使用改寫後的 command。

這和 schema 延後載入屬於不同功能，卻指向相同的 runtime 原則：使用者核准的內容，要和 executor 最後收到的內容一致。若 hook 在 approval 之後才把 `git status` 改成包裝過的指令，畫面顯示與實際執行就會分岔。

採用其他 Agent harness 時，也可以用同一條測試檢查：在所有 normalization、rewrite 與 policy transformation 完成後才產生 approval UI，並確認拒絕的 command 不會因改寫重新變成可執行。

## 現在適合採用嗎？

若專案只有少量、固定 tools，eager loading 仍是較單純的選擇。當 MCP servers 已經多到影響 context，且 production model 與 endpoint 明確支援 native tool search，Deep Agents 0.2.3 值得做受控 PoC。

目前證據成熟度介於「正式 release、有 merged code 與 unit tests」和「缺少獨立 production benchmark」之間。適合先用 replayable tasks 比較，不適合直接宣稱成本或可靠性已獲得普遍改善。

這次 release 最有價值的地方，是把 tool schema 從固定前置成本變成可選的 runtime 資源。工程上是否划算，最後仍要回到 discovery 品質、provider 相容性與完整 trace，而非只看 prompt 表面上少了多少工具說明。
