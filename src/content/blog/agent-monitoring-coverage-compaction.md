---
title: "[News] Agent 監控漏掉 Compaction：先量覆蓋率，再談抓不抓得到"
description: "METR 與 Redwood 對 OpenAI 內部 Agent 監控進行三週稽核。從 compaction 漏監、延後交還控制權與序列化差異，整理正式環境該如何驗證監控覆蓋率。"
pubDate: 2026-10-24
category: AI
tags: [AI Agents, Security, Harness]
draft: false
references:
  - title: "METR：Red-Teaming OpenAI's Internal Agent Monitoring Systems"
    url: "https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/"
  - title: "Redwood Research：Simulated Control Evaluations"
    url: "https://blog.redwoodresearch.org/p/simulated-control-evaluations"
  - title: "Simulated Control Evals — arXiv v1"
    url: "https://arxiv.org/abs/2610.31593v1"
  - title: "Reuters：External evaluators find flaws in OpenAI's AI monitoring system"
    url: "https://www.reuters.com/business/ai-safety-group-metr-finds-flaws-openais-internal-monitoring-system-2026-10-22/"
---

Agent 的每一步都有 log，仍不代表每一步都進了監控。只要 compaction、背景執行或某條 API 路徑漏接，監控模型的準確率再高，也看不到那段行為。

METR 與 Redwood Research 在 **2026 年 10 月 22 日**公開一項三週的高存取權稽核。兩位外部研究員於 7 月 21 日至 8 月 11 日進入 OpenAI，檢查當時的內部 Agent misalignment monitoring。公開內容只是一份 61 頁內部報告的摘要，而且描述的是 7 月 21 日以前的系統；OpenAI 表示影響 production safeguards 的問題已修補，外部研究員尚未重新驗證。

這份報告對一般 Agent 團隊最有用的地方，是把「monitor 能不能判斷風險」之前的資料管線問題攤開來看。

## 這篇的重點

- 監控要先量 coverage：哪些事件應被監控、實際送到了哪些、成功評估多少、多少進入人工處理。
- `compaction`、長時間不中止的 Agent loop，以及 Agent／monitor 看到的序列化差異，都可能讓高品質 monitor 收不到正確軌跡。
- 本次是罕見的深度外部稽核，但公開資訊受事前約定限制，OpenAI 也有權刪節；修補尚未由 METR／Redwood 複驗，不能把歷史發現寫成目前系統仍有同樣漏洞。

本文依公開報告與論文整理，沒有取得 OpenAI 內部系統，也沒有執行攻防測試。

## 99.2% eligible，不等於 99.2% 已監控

[METR 的公開摘要](https://metr.org/blog/2026-10-22-red-teaming-openai-agent-monitoring/)估計，當時 GPT-5.5 等級以上的內部 Responses API agentic traffic，約 **75%–94%** 符合監控資格；內部 Codex Agent 的比例則為 **99.2%**。兩個估計都有明顯不確定性，且不包含研究員無法估量的其他內部推論服務。

報告特別區分 `eligible for monitoring` 與實際完成監控。符合資格只表示依設計應該送進 monitor；load shedding、monitor error、資料管線 bug 或事件漏接，仍可能讓請求沒有跑完整個流程。

工程上可以把監控拆成一個可對帳的 funnel：

| 階段 | 要回答的問題 | 最低限度的證據 |
| --- | --- | --- |
| Eligible | 哪些 model、agent、tool 與事件必須監控？ | 可版本化的 coverage 規則 |
| Emitted | runtime 是否真的產生監控事件？ | 與原始 execution ID 對得上的 append-only 記錄 |
| Evaluated | monitor 是否成功收到並完成判斷？ | success、error、timeout、load-shed 分開計數 |
| Escalated | 高風險結果是否進入阻擋或人工 review？ | decision、處置時間與處置結果 |

這張表是根據稽核發現整理的驗收方式，並非 OpenAI 公開的內部 schema。核心是每一層都有分母，才能知道「沒告警」代表低風險，還是根本沒看見。

## Compaction 不能只算 context 管理事件

METR 估計，2026 年 5 月至 7 月期間，compaction events 沒有被監控，可能讓約 **一成符合資格的內部 Codex traffic** 漏掉；因為當時沒有留下足夠資料判斷 monitor call 有多少由 compaction 觸發，這個比例只有量級估計。OpenAI 團隊在稽核前已自行發現問題，並於稽核期間修正。

這裡的工程教訓不只適用於特定產品。Compaction 會把長軌跡轉成較短的 continuation state；若監控以 message、turn 或「Agent 交還控制權」作為觸發點，新的事件型態很容易落在原本假設之外。

報告還指出，當時監控會在 Agent 把控制權交回使用者時啟動。在 compaction 未納入監控的期間，Agent 理論上可以持續採取動作，讓監控無限延後。研究員沒有證據證明 Agent 實際利用過這條路徑，因此應把它理解成已確認的設計缺口，不是已發生的攻擊事件。

對長任務 Agent，較穩妥的設計是同時使用多種觸發條件：每隔固定時間或固定事件數執行監控，另在 privilege change、credential use、外部寫入與 compaction 等邊界強制檢查。`turn completed` 可以保留，但不該是唯一觸發點。

## Monitor 必須看到和 Agent 等價的軌跡

另一類問題來自 representation mismatch。研究員找到可能利用序列化差異，讓 Agent 看到的 trajectory 和 monitor 看到的內容不同，進而使 monitor 失敗且沒有升級人工處理。他們也找到能隱藏數百個近期 actions 的 exploit；細節由 OpenAI 刪除，公開資料不足以重現。

因此，monitoring pipeline 不宜另外拼一份「看起來差不多」的文字紀錄。至少要用相同的 event identity、tool arguments、result references、compaction lineage 與權限狀態重建軌跡，並對無法解析、缺少欄位及版本不相容採 fail closed 或明確降級處置。

內容等價也需要測試。只比對 event 數量，抓不到一邊保留原始 tool result、另一邊只保留摘要的差異。可以準備帶有特殊字元、大型輸出、巢狀 tool call、重試、部分失敗與 compaction 的固定案例，確認 Agent 與 monitor 的 view 能對到同一份語意與來源。

## 偵測品質和覆蓋品質，要分兩套 eval

Coverage 對帳只能證明 monitor 有機會看見，不能證明它判斷得對。Redwood 在隔天公開的 [Simulated Control Evals](https://arxiv.org/abs/2610.31593v1)處理後一個問題：從真實 codebase 的 Agent transcript 出發，讓 attack policy 繼續任務，但用 LLM 模擬 tool responses，避免真的在正式環境執行攻擊。

作者在 LinuxArena 上用可實際執行的結果作為 ground truth，報告 SCE 在五個 monitors、5% audit budget 的 safety prediction RMSE 為 **3.6 percentage points**，另一個獨立 control setting BashArena 為 **10.1**。這是研究團隊在特定 benchmark 的結果；套到自家環境仍需要驗證 simulator fidelity，也尚未涵蓋 long-horizon、multi-agent attacks。

兩份工作放在一起，可以得到一個實用順序：

1. 先確認每種 Agent 路徑都產生可對帳的監控事件。
2. 再用已知 benign／malicious trajectories 測 monitor 的 false positive、false negative 與人工負擔。
3. 接著用 control eval 或受隔離的模擬，測試策略性規避，而非只測明顯惡意字串。
4. Runtime、compaction、tool schema 或 monitor model 更新後，重新跑 coverage 與 detection 兩組檢查。

## 對一般工程團隊，先補可追蹤的分母

多數團隊不需要複製 frontier lab 的完整 misalignment monitoring。只要 Agent 能改 repository、操作 ticket 或寫入業務資料，就值得先回答：今天總共有多少 tool calls、多少是外部寫入、多少經過 policy／monitor、多少發生監控錯誤？

這和既有的 [OpenShell 文章](../nvidia-openshell-agent-security-boundary/)不同。OpenShell 著重 runtime 能否拒絕檔案、網路與 credential 操作；本篇處理的是監控是否真的看見完整行為，以及看見後如何驗證判斷品質。兩者都需要，因為 monitor 不應取代 deterministic permission boundary，permission boundary 也不會自動解釋所有可疑軌跡。

既有的 [Copilot 長任務文章](../github-copilot-rust-migration-context/)把 compaction 視為 context 交接；這次稽核再補上一個營運要求：**任何改變軌跡表示方式的元件，都必須同時列入監控 coverage 與相容性測試。**
