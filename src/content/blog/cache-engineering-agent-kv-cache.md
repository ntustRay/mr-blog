---
title: "[News] Cache Engineering：Agent 不改寫對話，也能丟掉 KV Cache"
description: "AKV 讓長任務 Agent 直接控制 KV cache，以 drop／repos 避免反覆摘要與 re-prefill。整理論文數字、整合條件，以及目前仍不適合直接上線的限制。"
pubDate: 2026-10-23
category: AI
tags: [AI Agents, Harness]
draft: false
references:
  - title: "Cache Engineering for Agents — arXiv v1"
    url: "https://arxiv.org/abs/2610.28577v1"
  - title: "Cache Engineering for Agents — 論文全文"
    url: "https://arxiv.org/html/2610.28577v1"
  - title: "thu-nics/AKV — 官方實作"
    url: "https://github.com/thu-nics/AKV"
  - title: "AKV System — 支援模型與部署限制"
    url: "https://github.com/thu-nics/AKV/blob/main/akv/system/README.md"
---

長任務 Agent 累積太多 tool output 時，常見做法是刪除舊訊息或產生摘要。這能縮短 context，卻會改變 prompt prefix；後面的內容可能需要重新 prefill，摘要也可能漏掉日後才需要的證據。

清華大學與香港中文大學團隊在 **2026 年 10 月 20 日**提交 [Cache Engineering for Agents](https://arxiv.org/abs/2610.28577v1)，並開源 [AKV](https://github.com/thu-nics/AKV)。它把另一個控制面交給 Agent：保留完整文字軌跡，但直接決定哪些 KV cache 不再參與 attention。

這是值得追的 serving 方向，目前仍屬研究型實作。論文數字來自作者團隊，本文沒有部署 AKV 或重跑 benchmark。

## 這篇的重點

AKV 將 context 管理往推論層下移。`drop` 排除不再需要的 KV，`repos` 壓縮保留項目的位置；原始訊息不必跟著刪除或改寫。作者在三個模型、四組 Agent benchmark 上報告平均成本下降與小幅分數提升，但整合需要自架修改過的 SGLang，支援範圍也有限。

因此，它適合已經確認瓶頸來自長軌跡 KV 讀取與 re-prefill 的團隊做實驗，還不是一般 API 使用者可以直接打開的最佳化選項。

## 文字軌跡與 active cache，開始變成兩件事

一般的 context engineering 會改動送給模型的訊息：刪除舊 tool output、只保留最近幾輪，或用摘要替換長內容。這些方法容易理解，也能直接套在現有 API；代價是 prefix 被改寫後，後續保留內容的 cache 可能失效。

AKV 保留完整 `messages`，另外記錄 cache operation history。論文提出三個操作：

| 操作 | 做什麼 | 不做什麼 |
| --- | --- | --- |
| `append` | 為新 token 加入 KV state | 與一般推論相同 |
| `drop` | 讓指定 KV 不再參與之後的 attention | 不從文字紀錄刪除訊息 |
| `repos` | 重新編排保留 KV 的 position encoding | 不重新計算整段 hidden states |

同一串 token 若以不同時間點執行 `drop`，後續 token 看到的歷史就不同，產生的 KV state 也會不同。一般 prefix cache 只看 token prefix，可能誤用不相容的 cache。AKV 因此在 serving engine 一起記錄 token 與操作歷史，並用 extended radix tree、drop-aware eviction 和 segment-batch attention 管理重用與還原。

這也是它和「在 Harness 多加一個摘要函式」最大的差別：新的 cache policy 必須和推論系統共同實作，不能只在呼叫 API 前整理 JSON。

## 27.7% 成本下降，要連同實驗條件一起讀

[論文實驗](https://arxiv.org/html/2610.28577v1#S5)使用 MiniMax-M2.7、GPT-OSS-120B 與 MiroThinker-1.7-Mini，任務涵蓋 BrowseComp-Plus、xbench-DeepSearch、GAIA-Text 和 SWE-bench Verified。AKV 的主要 policy 會保留所有 reasoning cache，以及最近 12 個 tool responses 的 KV。

作者報告，和 threshold-triggered summarization 相比，這個 rolling-drop policy 在三個模型與四組 benchmark 的平均結果為：

- 平均 benchmark 分數高 **1.7 points**。
- 平均推論成本低 **27.7%**。
- 在 GPT-OSS-120B、Top-80 SWE-bench Verified 的 serving 測試中，peak-throughput 設定下的 P95 request latency 為 **1.51× speedup**，output throughput 為 **1.18×**。

Serving 測試使用 SGLang 0.5.20、八張 NVIDIA A800 80GB、BF16 GPT-OSS-120B，以及分離的 prefill／decode workers。這些結果能支持「直接管理 KV 有研究價值」，不能直接換算成既有雲端 API 的帳單或延遲。

分項結果也沒有保證每個模型都更便宜。當 cache management 被做成 Agent 可呼叫的 tool，MiniMax-M2.7 在 100 個 BCP 任務上的分數從 56.0% 增至 64.0%，但作者計算的每題成本從 5.4 美分升到 5.9 美分，原因是模型執行了更多 turns。Agent 多做對幾題，也可能同時花更多資源。

## 為什麼先丟 tool output，不先丟 reasoning？

論文的 ablation 提供了一個實用訊號：在 GPT-OSS-120B 的 BCP 與 SWE 子集裡，優先移除舊 tool-response cache 的結果，比移除 reasoning cache 穩定。兩者一起丟，也沒有得到最佳通過率。

這不代表所有 reasoning 都值得永久保留。較合理的工程解讀是：tool output 常有大量原始資料，Agent 已把其中一部分轉成工作假設；先從舊的原始輸出下手，可能比較容易省下 cache。若任務後面還要核對精確數字、錯誤行或 checksum，這個假設仍可能失敗。

現有的 [Harness 文章](../coding-agent-harness-176-configurations/)討論過 elision、recall 與 summarization 解決的是哪些 overflow。AKV 新增的問題在更下一層：文字軌跡可以保持不變，但 active cache 該保留什麼？兩層策略可以互補，也會各自引入資訊遺失風險。

## 現在能不能用？先看部署邊界

[官方 repository](https://github.com/thu-nics/AKV)提供 Apache 2.0 實作、Agent-side `CachePolicy`，以及以 SGLang 為基礎的 serving system。整合點是在 Harness 序列化 messages 與 tools 後，先讓 policy 加入 `drop_message`／`reposition`，再送到 AKV server。

但截至本文查核時間，repository 沒有正式 release，也沒有可供判斷實際採用狀況的 Issues 或 Pull Requests。最新一批 commit 主要由論文作者維護，這比只有論文概念前進一步，還不能視為成熟生產元件。

[System README](https://github.com/thu-nics/AKV/blob/main/akv/system/README.md)列出的限制也相當具體：

- 目前支援 Qwen 系列、GPT-OSS 與 MiniMax-M2 等部分 text architectures。
- 支援 tensor parallelism，但 context operation 排除 PP／CP／DCP、speculative decoding、LoRA、HiCache、external／session caches 和 beam search。
- Drop／Repos 目前要求 page size 為 1，啟動時還需要 C++20 compiler 建置額外 kernel。
- Prefill／decode disaggregation 目前只支援 Mooncake，且排除 KV offload 等模式。

如果團隊使用託管模型 API，現在沒有控制供應商 KV cache 的介面；若工作流通常十幾輪就結束，也未必值得換 serving stack。

## 真要試，先驗證這四件事

以下是根據論文與實作整理的測試方向，尚未在自身環境執行：

| 驗證項目 | 至少要記錄的結果 |
| --- | --- |
| 瓶頸是否真的在 KV | 各輪 input／cached tokens、TTFT、P95 latency、GPU memory pressure |
| 刪除 policy 是否傷害任務 | 固定任務集的成功率，以及被丟掉的證據是否造成返工 |
| 節省是否來自提早失敗 | 完成 turns、停止原因、人工收尾時間 |
| 系統代價是否划算 | 部署複雜度、可用模型、與既有 SGLang 功能衝突 |

比較時應保留三組：完整 context、現有摘要／裁切策略，以及 AKV policy。只比較 token 或 GPU throughput，可能會漏掉任務品質與維運成本。

還有一個容易誤會的邊界：`drop` 不是安全刪除。完整 transcript 仍可能存在 request、log 或儲存層；保留下來的 hidden state 也可能已經編碼先前資訊。它處理的是 attention 與推論成本，不能替代資料保留政策、權限或 prompt injection 防護。

Cache Engineering 最值得注意的地方，是它把 Agent context 從一份文字清單，拆成「可追溯的邏輯軌跡」與「當下參與推論的 active cache」。這個分層若能被更多 serving engine 驗證，Harness 未來調整的不只是哪段文字要摘要，也會包含模型此刻還需要看見哪些計算狀態。
