---
title: "[News] LFM2.5 本機 Agent：跑得快之前，先確認工具真的會動"
description: "Liquid AI 的 24B MoE 模型主打本機 Agent。從權重、速度到實際工具回傳，分清楚要驗證的三件事。"
pubDate: 2026-10-15
updatedDate: 2026-10-17
category: "AI & Agents"
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

想把 Agent 留在自己的機器，可以從一個小任務開始：讓它列出測試資料夾的 Markdown 檔案。真的跑過工具、讀到回傳並把檔名說對，才算這輪完成。Liquid AI 在 2026 年 10 月 13 日推出 LFM2.5-24B-A2B，本機跑得動、跑得快，以及能把工具用對，分別要看不同的證據。[Liquid AI 發布資料](https://www.liquid.ai/blog/lfm2-5-24b-a2b)

## 哪些數字要先看硬體條件？

MoE 把部分模型參數分成多個 experts，每個 token 用到約 2.45B active parameters，但總參數約 24B，模型檔仍要放下整套權重。官方 Q4_K_M GGUF 約 14.5 GB，推論記憶體還要加上下文快取與 runtime。Model card 的 184 tokens/s 用 Apple M5 Max、llama.cpp、Q4_K_M、4K input context 測得。這是解碼速度，還沒算工具等待、模型重新讀入結果或任務重試。[Model card](https://huggingface.co/LiquidAI/LFM2.5-24B-A2B)｜[官方 GGUF](https://huggingface.co/LiquidAI/LFM2.5-24B-A2B-GGUF)

| 評測 | LFM2.5-24B-A2B | Qwen3.6-35B-A3B |
| --- | ---: | ---: |
| LiveClaw | 48.09 | 38.19 |
| WebArena Verified | 26.75 | 37.62 |
| SWE-bench Verified，使用 OpenCode | 51.00 | 66.20 |

上表是 Liquid AI 發布資料內的比較，應在同一列按同一測試閱讀。工具評測、網頁操作與修 repo 的結果會分岔。如果主要工作是長文件或程式修改，最好另用自己能重現的任務驗證。[官方評測](https://www.liquid.ai/blog/lfm2-5-24b-a2b)

## 本機端點接通後，再看 tool call 是否走完整輪

依官方文件，需由相容的 server 或 adapter 把模型原生工具格式解析成應用程式能接的呼叫。以下是沿用文件的本機設定示意，前提是 llama.cpp 版本支援該模型，端口只開在 loopback。這篇沒有重跑模型評測。[本機 Agent 指南](https://docs.liquid.ai/examples/agent-harnesses)｜[Tool Use 文件](https://docs.liquid.ai/lfm/key-concepts/tool-use)

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

```bash
curl http://127.0.0.1:8080/v1/models
```

先用唯讀工具看名稱、參數與回傳格式正不正確，再量錯誤呼叫、整輪耗時和記憶體。接上第三方搜尋後也要再檢查資料是否會離開本機。商用請依官方 LFM Open License 的條件評估。[授權條款](https://www.liquid.ai/lfm-license)
