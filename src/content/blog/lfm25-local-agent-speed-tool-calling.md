---
title: "[Review] LFM2.5 本機 Agent：跑得快之前，先確認工具真的會動"
description: "Liquid AI 推出 LFM2.5-24B-A2B。從權重大小、官方評測到 tool calling 設定，整理本機 Agent 值得試用的地方，以及不能只看 tokens/s 的原因。"
pubDate: 2026-10-15
updatedDate: 2026-10-17
category: AI
tags: [AI Agents, Harness]
draft: false
references:
  - title: "Liquid AI：LFM2.5-24B-A2B: Built for Fast On-Device Agents"
    url: "https://www.liquid.ai/blog/lfm2-5-24b-a2b"
  - title: "Liquid AI：LFM2.5-24B-A2B model card"
    url: "https://huggingface.co/LiquidAI/LFM2.5-24B-A2B"
  - title: "Liquid AI：LFM2.5-24B-A2B GGUF"
    url: "https://huggingface.co/LiquidAI/LFM2.5-24B-A2B-GGUF"
  - title: "Liquid Docs：Run local agents with LFMs"
    url: "https://docs.liquid.ai/examples/agent-harnesses"
  - title: "Liquid Docs：Tool Use"
    url: "https://docs.liquid.ai/lfm/key-concepts/tool-use"
  - title: "Liquid AI：LFM Open License v1.0"
    url: "https://www.liquid.ai/lfm-license"
---

想讓 Agent 留在自己的電腦上，下載模型只是第一步。接著要確認它能不能選對工具、傳對參數，並根據結果繼續工作。

Liquid AI 在 **2026 年 10 月 13 日**發布 LFM2.5-24B-A2B，主打本機 Agent。它值得試用，但目前適合當成需要驗證的新選項，還不足以直接替換既有工作流。

本文依官方文件整理，沒有自行下載模型或重跑效能評測。以下指令是文件範例的調整版，並非本文的實測紀錄。

## 這篇的重點

- 每個 token 啟用的參數少，能降低運算量；硬體仍要容納整體權重與執行時的額外記憶體。
- 官方評測有工具任務的優勢，也有網頁操作與 coding 的落後項目。
- OpenAI-compatible endpoint 能連上，不代表 tool calling 已經接好。先驗證工具呼叫，再測完整任務。

## A2B 不代表只需要放下 2B 模型

依 [model card](https://huggingface.co/LiquidAI/LFM2.5-24B-A2B)，模型總參數為 24B，每個 token 的 active parameters 為 2.45B；「2B active」是較簡略的產品描述。它是 text-only reasoning model，支援 131,072-token context。

MoE 每次只使用部分 experts，並沒有把其他權重從模型檔案中刪掉。[官方 GGUF 頁面](https://huggingface.co/LiquidAI/LFM2.5-24B-A2B-GGUF)列出的 Q4_K_M 約為 14.5 GB。這還只是檔案大小，不能直接當成執行時總記憶體需求。

評估自己的電腦時，要一起看量化版本、context 設定、推論引擎，以及權重放在 RAM 或 GPU 的方式。能載入模型和能順暢完成任務，是兩個需要分開驗證的條件。

也不要把支援 128K context 理解成起步就該開滿。先用較小的範圍完成測試，再量測增加 context 後的記憶體與延遲，比照抄最大值更容易找問題。

## 官方評測沒有全面勝出

[Liquid AI 的發布資料](https://www.liquid.ai/blog/lfm2-5-24b-a2b)列出以下比較。這些是同一份官方報告內的分數，不是本文實測，也不應跨列直接比較：

| 評測 | LFM2.5-24B-A2B | Qwen3.6-35B-A3B |
| --- | ---: | ---: |
| LiveClaw | 48.09 | 38.19 |
| WebArena Verified | 26.75 | 37.62 |
| SWE-bench Verified，使用 OpenCode | 51.00 | 66.20 |

這張表支持先按任務選模型：一個模型在某組工具工作流較好，不代表它也更適合修 repository bug，或操作複雜網站。

速度也需要保留測試條件。官方 model card 的 **184 tokens/s** 來自 Apple M5 Max、llama.cpp、Q4_K_M、4K input context。這是 decode 速度，不能直接換算成一個 Agent 任務多久做完。

實際耗時還包含讀取 prompt、推理、工具等待與失敗重試。即使文字生成很快，工具選錯兩次，使用者還是得等。

## 接通 API 後，還有一段工具呼叫流程

依 [Tool Use 文件](https://docs.liquid.ai/lfm/key-concepts/tool-use)，模型原生工具呼叫涉及專用標記與 Python-style function calls；不能假設回傳文字可以直接當成任意 SDK 預期的 JSON。

部署時應確認這三層：

| 層次 | 要驗證的事 |
| --- | --- |
| Chat template | 工具定義是否真的進入模型輸入 |
| 推論 server | 模型產生的工具呼叫是否轉成正確的 API 回應 |
| Agent harness | 是否執行工具、回傳結果，並讓模型接續工作 |

所以，收到 HTTP 200 或看到「我會幫你查詢」，都還不能算工具成功。

[官方本機 Agent 指南](https://docs.liquid.ai/examples/agent-harnesses)也特別列出 backend 的 tool calling 設定，例如 llama.cpp 的 `--jinja`。不同推論引擎需要的設定不同，不宜只換 `baseUrl` 就當作整合完成。

## 先跑一個小測試，再接真實工作

若已安裝支援此模型的近期 llama.cpp，以下是依官方 GGUF 與本機部署文件調整的 Bash 範例。這裡將 context 設為 8K 作為起步測試，並只監聽本機：

```bash
llama-server \
  -hf LiquidAI/LFM2.5-24B-A2B-GGUF:Q4_K_M \
  --jinja \
  --host 127.0.0.1 \
  --port 8080 \
  -c 8192 \
  --temp 0.1 \
  --top-k 50 \
  --repeat-penalty 1.05
```

第一次執行可能需要下載權重。server 啟動後，在另一個 terminal 確認實際提供的 model ID：

```bash
curl http://127.0.0.1:8080/v1/models
```

接著將 harness 的 API base URL 設為 `http://127.0.0.1:8080/v1`，model ID 使用上一步實際回傳的值。harness 宣告的 context 也要與 server 的設定一致。這裡尚未驗證工具執行，應再依所選 harness 的文件完成設定。

建議先準備一個回傳固定測試資料的唯讀工具，再測以下情境。這是一份待執行的驗證設計，沒有預設模型會通過：

| 測試情境 | 成功條件 |
| --- | --- |
| 查詢指定 ID 的資料 | 選對工具，參數符合 schema |
| 工具回傳找不到資料 | 說明查無結果，不自行補內容 |
| 第一個工具回傳下一步需要的 ID | 使用實際回傳值，完成第二次呼叫 |
| 工具回傳錯誤 | 有限次重試或明確停止，不假裝成功 |

通過後再試檔案搜尋、筆記整理或局部程式修改。比較模型時固定 harness、工具與任務，記錄完成率、端到端耗時、尖峰記憶體和人工收尾時間。

## 值得試，但先保留原本的選項

本機推論對離線工作、資料留在自己設備上的需求有吸引力。不過，接上的搜尋、遙測或其他外部工具仍可能連網；模型在本機，不保證整個工作流程都離線。

授權也要分開看。model card 標示的是 `lfm1.0`，並非 Apache 2.0。[官方授權頁](https://www.liquid.ai/lfm-license)另有商業使用與年營收門檻，企業採用前應核對完整條款。

這個新模型最適合先放進一組小型、可重現的測試。當它能穩定完成你原本交給 Agent 的工作，再決定要不要取代既有模型；tokens/s 可以當參考，實際少了多少等待和收尾，才是採用的理由。
