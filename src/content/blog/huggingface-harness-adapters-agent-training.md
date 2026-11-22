---
title: "[News] Hugging Face harness adapters：把 Agent harness 也當成模型訓練條件"
description: "Hugging Face 以同一個 Qwen3.8-27B 為不同 coding-agent harness 訓練 LoRA，官方實驗同時提高 pass@1 並大幅減少 tool calls。重點不是通用勝率，而是把部署時的 harness 納入訓練與驗收。"
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

同一個 coding model 換了 Agent harness，效能與成本可能一起變。harness 決定了 prompt 組裝、context 保留、tool schema、重試與 agent loop；因此只替模型做泛用訓練，再把它放進另一套 loop，未必是該組合的最佳結果。

Hugging Face 在 **2026 年 11 月 20 日**公開一組 harness adapters 實驗：以 Qwen3.8-27B 為基礎模型，分別在 pi、Hermes Agent、OpenCode 三種既有 harness 內收集 rollout，用 RL 訓練對應的 LoRA adapter，並測試合併三者的「super-adapter」。官方在 Terminal-Bench 2.1 與 SWE-bench Pro 的設定下回報：專用 adapter 在自己的 harness 中提高 pass@1，且在共同解題集合上使用較少的 tool calls。這是官方實驗結果，不是跨模型、跨任務的通用結論。 [官方文章](https://huggingface.co/blog/harness-adapters-at-scale)

## TL;DR

- 這項工作把 **harness 視為訓練條件**：Agent 仍跑原本的 loop，trainer 從實際產生的 token 與 tool trajectory 學習。
- 官方數據顯示，Qwen3.8-27B 在 pi harness 的 Terminal-Bench 2.1 pass@1 從 40.0% 提升至 56.5%，共同解題集合的 tool calls 減少 56%；不同 harness 的幅度不同。
- 一個合併三個 LoRA 的 super-adapter 能跨三個 harness 改善官方測試，但通常不如各自的 specialist；若只部署一種 harness，專用 adapter 是較直接的選擇。
- 這不代表可以直接拿 production trace 做 RL。任務驗證、資料脫敏、權限隔離與防止 agent 讀測試答案，仍是導入的主要成本與風險。

## 為什麼 harness 會改變模型表現？

把 harness 當成「包住模型的一圈程式」比較好理解。它不只送 prompt，還會決定：

| 層面 | 可能差異 | 對 Agent 的影響 |
| --- | --- | --- |
| Context | 是否保留前輪 reasoning、檔案摘要方式 | 可用資訊與 context overflow 風險不同 |
| Tools | schema、錯誤回傳、觀測格式 | 模型需要學的呼叫習慣不同 |
| Loop | planning、retry、最大步數、停止條件 | 同一策略可能被放大或提早中止 |
| Runtime | sandbox、timeout、環境初始化 | 能否完成任務與成本一起變動 |

因此，單看模型或單看 benchmark 總分，無法回答「它在我的 OpenCode／Claude Code／自訂 harness 裡是否更可靠」。這篇實驗的價值在於讓訓練時的環境接近部署時的環境，而不是宣稱某個 harness 天生更強。

## 官方實驗實際測了什麼？

官方以 Qwen3.8-27B 為 base model，為 pi、Hermes Agent、OpenCode 各訓練一個 LoRA。Agent loop 沒有被 trainer 重寫；OpenEnv session 與 capture proxy 收集實際 token、behavior logprobs 與 tool trace，再由 TRL 的 experimental `AsyncGRPOTrainer` 進行 RL。公開 TRL 文件也提供讓 harness 自己擁有 loop 的 `HarnessRolloutWorker` 範例。 [TRL 文件](https://github.com/huggingface/trl/blob/main/docs/source/openenv.md)

官方報告的幾個關鍵數字如下；都應讀成「固定其評測條件下的一次 setup」，而非不同 harness 的橫向排名：

| 條件 | Base | 專用 adapter | 官方解讀 |
| --- | ---: | ---: | --- |
| pi + Terminal-Bench 2.1 | 40.0% | 56.5% | +16.5 points；共同解題集合 tool calls −56% |
| Hermes + Terminal-Bench 2.1 | 44.7% | 58.8% | +14.1 points；共同解題集合 tool calls −70% |
| OpenCode + SWE-bench Pro（hard 51） | 35.3% | 51.0% | +15.7 points；共同解題集合 tool calls −72% |

比較須保留兩個限制。第一，三個 harness 的 context 行為不同；官方也明確說不能用這些數字判定 pi、Hermes 或 OpenCode 彼此誰較強。第二，個別 checkpoint 的選擇曾使用 Terminal-Bench 訊號，因此同一 benchmark 的結果有 selection bias；SWE-bench Pro 沒參與這個選擇，較適合作為交叉檢查。

## super-adapter 解決的是維運，不是免費泛化

三個 LoRA 可以合併成一個 adapter，降低「每個 harness 各部署一個 artifact」的維運成本。官方以 1/2 權重合併時，在六個 harness × benchmark 組合上都優於 base non-thinking model；但用專用 adapter 時，四個組合仍較高。

這個取捨很實際：

- **單一固定 harness：** 優先比較 specialist，因為它保留最多該環境的適配效果。
- **多個 harness、部署要簡單：** super-adapter 值得做 baseline，但必須逐一重跑各 harness 的 regression suite。
- **harness 經常改版：** 先把版本、prompt template、tool schema、sandbox image 固定；否則 adapter 的收益可能被 runtime 漂移掩蓋。

## 要把它帶進自己的 Agent，先做小型可驗證 PoC

不建議直接把 production Agent 開始 RL。先挑一種可安全重跑、可判定對錯的任務，例如「在 fixture repo 修一個指定 bug，不能修改 tests」。最小流程可拆成：

1. **固定基線**：鎖定 model、harness commit、tool/MCP 版本、sandbox image、token 與 step 上限。
2. **建立驗證器**：除了 unit tests，也檢查禁止修改的檔案、預期 diff、timeout、tool calls 與 secret exposure。
3. **收集並脫敏 trajectories**：不要把 access token、內網 URL、客戶資料或未審查 source code 直接送入訓練集。
4. **分離 train／held-out eval**：checkpoint 不能只依同一批測試挑選；至少留一組未參與選擇的 cases。
5. **量測可靠度與成本**：每組多跑幾次，同時記錄 pass rate、最差一次、wall time、tokens、tool calls 與不該有的副作用。
6. **先採 LoRA、保留回退**：以 adapter ID、base model digest、harness commit 做發版紀錄；發生 regression 時可回到 base model。

Hugging Face 的 recipe 也加入 `safeagents` proxy，在訓練階段檢查 tool calls，以防 agent 為了通過測試去讀或改測試檔。這是值得保留的設計，但它是規則型防護，不是 sandbox 或 least-privilege 的替代品。 [官方方法與限制](https://huggingface.co/blog/harness-adapters-at-scale)

## 採用判斷

這套方法目前適合已有大量、可驗證的 Agent 任務，且能接受 RL 資料管線與 GPU／sandbox 維運的團隊。它對「本地 open-weight model + 固定 coding harness」尤其有吸引力：若官方提升可在自己的 held-out tasks 重現，較少 tool calls 會直接降低延遲與 inference 成本。

若你的 Agent 是 SaaS 模型、任務沒有可信 verifier、harness 經常換、或資料不能離開受控環境，先做 harness regression eval 通常比訓練 adapter 更划算。先證明哪個變因造成失敗，再決定要調 prompt、tool、loop，還是訓練模型。

## References

- [Introducing harness adapters: adapt your favorite model to your harness](https://huggingface.co/blog/harness-adapters-at-scale)
- [TRL OpenEnv documentation](https://huggingface.co/docs/trl/openenv)
- [TRL OpenEnv harness integration source](https://github.com/huggingface/trl/blob/main/docs/source/openenv.md)
- [OpenEnv 0.3.0 release](https://github.com/huggingface/OpenEnv/releases/tag/v0.3.0)
