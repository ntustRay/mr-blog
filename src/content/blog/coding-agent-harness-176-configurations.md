---
title: "[Insight] Coding Agent 需要多少 Harness？176 組實驗的條件與取捨"
description: "解讀 176 組 Harness 設定的研究：Planning、Tools 與 Context 的收益隨模型和任務改變，並整理可用於自身工作流的驗證方式。"
pubDate: 2026-10-03
updatedDate: 2026-10-17
category: AI
tags:
  - AI Agents
  - Harness
  - Coding Agents
draft: false
references:
  - title: "An Empirical Study of Harness Design for Coding Agents — v1"
    url: "https://arxiv.org/abs/2609.20804v1"
  - title: "論文全文與實驗表格"
    url: "https://arxiv.org/html/2609.20804v1"
---

Coding Agent 沒做完任務時，該補 Planning、增加工具，還是先處理 context overflow？把功能全部加上去，很難知道究竟是哪一項有用。

[An Empirical Study of Harness Design for Coding Agents](https://arxiv.org/html/2609.20804v1)固定主要 execution loop，分別改動 Planning、Action Space 與 Context Management。這篇解讀 2026-09-17 的 v1，沒有自行重跑實驗；研究支持的是按模型、任務與預算調整 Harness，並沒有替所有 Agent 排出最佳配置。

## 這篇的重點

在這組實驗裡，Context Management 主要減少 overflow 導致的失敗；Planning 與工具介面的收益則依模型而異。對自己的 workflow，先用失敗紀錄找出瓶頸，再一次改一個條件，會比照抄完整 Harness 更容易判斷效果。

## 176 組設定的範圍

研究涵蓋 Nemotron-3 30B／120B／550B 與 Mistral-Medium-3.5-128B，在 SWE-Bench Verified 和 Terminal-Bench 2.1 上測試。模型以 BF16、SGLang 執行，每個任務最多 300 steps；context budgets 為 32k、64k、96k、128k。

176 指設定組合數。Planning 與 action-space ablation 只在 T4／128k 下比較，並非所有條件的完整交叉實驗。設定與數字可核對[論文第 3 節及 Table 3](https://arxiv.org/html/2609.20804v1#S3)。

對讀者而言，這個範圍很重要：關掉該研究的 persistent planning scaffold，不能直接等同關掉所有形式的推理或規劃；改成 Bash-only，也包含介面與檔案操作支援的差異。

## Context Management 解決哪一種失敗？

論文比較未管理、elision、elision 加 recall、LLM summarization，以及分階段組合等策略。作者觀察到，context 緊張時，管理策略的主要收益是讓執行不會因 overflow 提早結束；較大 window 下差距縮小。

因此，如果某個 Agent 已經找到問題，卻在讀大量 logs 後中斷，優先調整輸出長度與歷史保留方式有明確理由。若它一直選錯檔案，增加 context 容量未必會改善定位能力。

研究中的 staged 策略先用規則縮減舊 tool output，再於必要時做摘要。這提供一個可試的順序，但不代表所有 logs 都可丟棄。錯誤訊息、尚未驗證的假設與測試結果仍需要可追溯的出處。

Recall 在這組設定中的使用有限，也未帶來作者報告的 accuracy 收益。這個結果不足以否定所有 memory 系統；它提醒的是，新增儲存與檢索能力後，要檢查模型是否真的在需要時使用它。

## 同一個 Planning，可能在處理不同問題

以下只列 SWE-Bench Verified、T4／128k 的 planning ablation，成本沿用論文的 token 定價估算，不能當作目前 API 報價：

| 模型 | Planning ON 成功率 | OFF 成功率 | ON／OFF 平均成本（USD／task） |
| --- | ---: | ---: | ---: |
| Nemotron-3 30B | 25.2% | 13.6% | 0.09／0.02 |
| Nemotron-3 550B | 65.8% | 67.8% | 2.33／3.31 |
| Mistral-Medium-3.5-128B | 68.6% | 69.0% | 3.14／4.65 |

作者的 trajectory analysis 將較小模型的改善連到「是否持續到修改階段」，將較強模型的成本下降連到減少修改後重複驗證。這是對實驗軌跡的分析，不能證明 Planning 普遍提升推理能力。

工程上可以據此分開觀察兩件事：Agent 是否在有證據前放棄，以及完成必要驗證後是否仍反覆執行相同檢查。前者需要持續工作的支援，後者可能需要更清楚的停止條件。

## Bash-only 的反例不能省掉

同一組 T4／128k、SWE-Bench 比較裡，Nemotron-3 550B 從完整工具的 65.8% 變成 Bash-only 的 69.4%；Mistral 則從 68.6% 降到 45.4%。不能用前一個模型的結果推出「強模型只需要 Bash」。

Bash 熟練度、任務所需的檔案操作，以及介面提供的額外支援都會影響結果。把多個操作合在一次 shell 呼叫可能減少 round-trips，也可能讓失敗位置更難定位；實際要看執行軌跡。

## 在自己的專案，先做哪個實驗？

以下是工作流建議，尚未在自身 repository 執行。先選固定的一批任務，保留模型、版本、工具權限、token／時間預算與驗收條件，再按觀察到的失敗改一項設定：

| 觀察到的問題 | 可先試的變更 | 要保留的結果 |
| --- | --- | --- |
| 大量 logs 後中斷 | 限制 output，調整保留與摘要策略 | overflow 次數、完成率、遺失證據造成的返工 |
| 還沒修改就宣告結束 | 持續更新的 plan 與明確交付條件 | 進入修改階段的比例、驗收通過率 |
| 已完成仍重複驗證 | 定義必要檢查與停止條件 | 漏掉的 regression、總耗時與成本 |
| 工具呼叫細碎 | 比較結構工具與較大的 shell 操作 | 失敗恢復成本、完成率、人工收尾 |

不要只記 token 變少。若省下模型費用，卻多花人工找回被壓掉的關鍵資訊，整個工作流未必改善。模型或任務改變後，保留同一組驗收再比較，才知道原本的 Harness 還有沒有幫上忙。
