---
title: "[News] Hugging Face harness adapters：把 Agent harness 也當成模型訓練條件"
description: "Hugging Face 為同一個 Qwen3.8-27B 配三種 coding harness 訓練 LoRA，從各自表現看訓練與部署如何對齊。"
pubDate: 2026-11-22
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - Open Source
  - Evaluation
references:
  - title: "Hugging Face: Introducing harness adapters"
    url: "https://huggingface.co/blog/harness-adapters-at-scale"
  - title: "Hugging Face TRL: Training on harnesses with OpenEnv"
    url: "https://huggingface.co/docs/trl/openenv"
  - title: "huggingface/trl OpenEnv guide"
    url: "https://github.com/huggingface/trl/blob/main/docs/source/openenv.md"
  - title: "Hugging Face OpenEnv 0.3.0 release"
    url: "https://github.com/huggingface/OpenEnv/releases/tag/v0.3.0"
relatedPostIds:
  - copilot-evals-skills-regression
  - coding-agent-harness-176-configurations
  - codex-exec-remote-app-server
draft: false
---

同一個模型在 OpenCode 能改對的 bug，放到另一個 Agent harness 可能先花幾輪找工具。因為 harness 決定模型看到的 prompt、工具 schema、回傳格式及何時重試。Hugging Face 於 2026 年 11 月 20 日公布實驗，用同一個 Qwen3.8-27B 基礎模型，分別為 pi、Hermes Agent 和 OpenCode 訓練 LoRA adapter。LoRA 是低秩微調，只訓練一小組額外權重。部署時可以把對應的 adapter 掛到基礎模型上。[Hugging Face 發布與實驗](https://huggingface.co/blog/harness-adapters-at-scale)

## 訓練時讓模型實際經過要部署的工具流程

作者保留原 Agent loop，用 OpenEnv session 與 capture proxy 收集 token、behavior logprobs 和工具紀錄，再交給 TRL 的實驗性 `AsyncGRPOTrainer`。讓模型練過實際的工具語意與回傳節奏，可以在同一個 harness 裡比較是否更少走錯步。官方結果中，pi 在 Terminal-Bench 2.1 的 pass@1 從 40.0% 到 56.5%，Hermes 在同一 benchmark 從 44.7% 到 58.8%。OpenCode 在 SWE-bench Pro 的 51 題困難子集由 35.3% 到 51.0%。工具呼叫數也下降，但原報告採用兩邊都解出的共同任務比較，不能視為整批任務平均下降同樣多。[原始結果與方法](https://huggingface.co/blog/harness-adapters-at-scale)｜[TRL OpenEnv 指南](https://huggingface.co/docs/trl/openenv)

三個專用 adapter 也可合成一個。按官方選定的合併權重，六個 harness 與 benchmark 組合都比基礎 non-thinking 模型高，專用版本仍在四個組合分數較高。部署一份比較容易維護，單一 harness 則有理由先比專用版本。想自己重測，可以挑固定版本的 fixture repo，驗修法、允許修改的範圍、工具次數與時間，同時保留沒有 adapter 的基線。[合併結果](https://huggingface.co/blog/harness-adapters-at-scale)｜[OpenEnv 版本資訊](https://github.com/huggingface/OpenEnv/releases/tag/v0.3.0)
