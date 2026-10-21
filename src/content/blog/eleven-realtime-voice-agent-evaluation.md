---
title: "[News] Eleven Realtime：語音 Agent 不能只量第一句有多快"
description: "ElevenLabs 推出 Realtime v1 Mini 與 Max。從獨立評測、OpenAI Realtime 相容範圍與 Managed 模式限制，整理語音 Agent 上線前真正該驗證的項目。"
pubDate: 2026-10-21
category: AI
tags: [AI Agents, Harness]
draft: false
references:
  - title: "ElevenLabs：Introducing Eleven Realtime"
    url: "https://elevenlabs.io/blog/realtime"
  - title: "ElevenLabs：Realtime models"
    url: "https://elevenlabs.io/docs/eleven-agents/customization/realtime-models"
  - title: "ElevenLabs：OpenAI Realtime API compatibility"
    url: "https://elevenlabs.io/docs/eleven-agents/guides/openai-realtime-compatibility"
  - title: "Artificial Analysis：Speech to Speech Leaderboard"
    url: "https://artificialanalysis.ai/speech-to-speech"
  - title: "Artificial Analysis：Speech to Speech Benchmarking Methodology"
    url: "https://artificialanalysis.ai/methodology/speech-to-speech-benchmarking"
---

語音 Agent 的回應快了幾百毫秒，對話仍可能很難用：它會在停頓時搶話、把「嗯」當成新問題，或是講得流暢卻沒有完成工具任務。

ElevenLabs 在 **2026 年 10 月 20 日**推出 Eleven Realtime v1 Mini 與 Max，將語音辨識、推理、工具呼叫和語音輸出包成受管理的串流系統。這次發布值得注意的地方，是它同時提供獨立評測結果與 OpenAI Realtime API 相容介面，也把整合限制寫進文件。

本文依發布資料、產品文件與 Artificial Analysis 公開評測整理，沒有實際建立語音 Agent，也沒有重跑 benchmark。

## 這篇的重點

- `time to first audio` 只能回答「多快開始說話」。自然停頓、插話、簡短附和與任務完成率要分開測。
- Max 的推理與工具任務分數明顯高於 Mini；Mini 的對話節奏分數略高。模型選擇應跟任務風險一起決定。
- OpenAI 相容指的是 WebSocket wire protocol 與事件格式。瀏覽器音訊、驗證流程和既有 WebRTC 整合仍需逐項檢查。
- Realtime 模式換來較少的組裝工作，也交出 LLM、ASR、TTS 與部分推理設定的控制權。

## 第一段聲音出現，還沒證明對話完成

[Artificial Analysis 的公開結果](https://artificialanalysis.ai/speech-to-speech)把語音 Agent 拆成多個維度。Eleven Realtime 的成績如下；數字來自第三方評測，並非本文實測：

| 指標 | v1 Mini | v1 Max | 能回答的問題 |
| --- | ---: | ---: | --- |
| Big Bench Audio 推理正確率 | 75.9% | 98.8% | 聽到語音題目後能否答對 |
| Time to first audio | 0.62 秒 | 0.57 秒 | 多快開始輸出第一段聲音 |
| Full-Duplex-Bench 對話節奏 | 95.8% | 94.1% | 能否處理停頓、輪替、插話與 backchannel |
| Speech Agent Arena 工具任務成功率 | 60.3% | 87.1% | 是否完成正確的任務工具呼叫 |

Max 在推理與工具任務領先，Mini 在對話節奏略高。這也說明單一總分很難回答選型問題。客服查詢若要跨多個工具修改狀態，任務成功率的權重應該高於開口速度；輕量語音導覽則可能更在意延遲與對話節奏。

也不要把 Max 描述成所有面向的第一名。Artificial Analysis 目前將它列為 Big Bench Audio 推理第三名、time to first audio 第三快；Full-Duplex-Bench 的領先者也另有其人。

評測本身仍有邊界。[Artificial Analysis 的方法文件](https://artificialanalysis.ai/methodology/speech-to-speech-benchmarking)顯示，工具任務涵蓋航空、零售與電信的模擬客服場景，依資料庫最終狀態評分；模擬顧客與部分自然語言判定使用 GPT-4.1，顧客語音由 Eleven v3 產生。它比只展示幾段 demo 更可比較，仍不能代替真實口音、線路品質、公司政策與後端錯誤下的驗證。

## OpenAI-compatible 的範圍要看清楚

[ElevenLabs 的相容性文件](https://elevenlabs.io/docs/eleven-agents/guides/openai-realtime-compatibility)說明，目前相容的是 OpenAI Realtime API 的 client/server events 與 WebSocket transport。既有 OpenAI Realtime SDK 可以換 endpoint 使用，但整條應用路徑不會自動完成遷移。

瀏覽器端需要先向自己的後端取得短效 client secret，不能把長效 API key 放進前端。OpenAI SDK 只會替 WebRTC transport 自動接好音訊；走 WebSocket 時，應用仍要自行擷取與播放 24 kHz PCM16。文件也註明 server-side OpenAI Realtime SDK 的連線指南尚未發布。

因此，「換一個 endpoint」適合描述協定層的起步方式，不宜直接推論成 production integration 已完成。既有系統若依賴 WebRTC、server-side session 管理或特定音訊處理，應先做一條最小的端到端通話再估搬遷成本。

## 受管理的低延遲，也有控制權成本

Realtime 使用 cascaded architecture，各元件仍是獨立模型，底層組合沒有公開。[Realtime model 文件](https://elevenlabs.io/docs/eleven-agents/customization/realtime-models)列出的 Managed 設定包含 LLM、reasoning effort、thinking budget、parallel tool calls、cascade timeout、TTS model 與 ASR provider；要自行調整這些項目，必須改回 Custom 模式。

目前還有幾個會直接影響採用的限制：

- Realtime 模式不能搭配 custom LLM 或 Amazon Bedrock。
- workflow node 不能覆寫受管理設定或 token limit。
- Agent transfer 只能在 Realtime 模式的 Agent 之間進行。
- Mini 不支援 Zero Retention Mode 與 HIPAA；Max 只在美國與歐盟環境提供這兩項能力。
- Max 不提供印度與新加坡的 data residency。

這些條件讓 Realtime 比較像一條完整產品路徑，而非可任意替換元件的語音 library。想快速做 PoC，可以先從 Mini 開始；多步驟工具任務或有合規要求時，再評估 Max。若系統一定要使用自有 LLM、指定 ASR/TTS，或跨不同模式轉接，Custom 路徑比較合適。

## 上線前要測一段「不好聊」的對話

以下是依評測維度與產品限制整理的驗證方向，尚未實際執行：

| 情境 | 應記錄的結果 |
| --- | --- |
| 使用者說到一半自然停頓 | Agent 是否搶話；錯誤打斷率 |
| Agent 說話時使用者換題插話 | 是否停止舊回覆並正確處理新意圖 |
| 使用者只說「嗯」「好」 | 是否繼續原回覆，而非誤開新回合 |
| 工具回傳找不到資料或 timeout | 是否有限次重試、說明失敗或轉人工 |
| 需要兩次以上工具呼叫 | 最終資料庫狀態是否正確；是否有重複副作用 |
| 不同口音、環境噪音與電話壓縮 | 完成率、重問次數與人工接手率 |

除了 time to first audio，還要記錄任務總耗時、最終狀態、錯誤工具呼叫、人工接手率與單次任務成本。語音 Agent 的流暢感很重要，真正影響能否上線的仍是它有沒有聽懂、完成工作，並在出錯時停得下來。
