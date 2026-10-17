---
title: "[Review] 模型變強了，還需要 Superpowers 嗎？"
description: "以官方流程、6.4 調整與一組第三方實驗，評估 Superpowers 能補哪些缺口、增加哪些成本，以及如何驗證是否值得保留。"
pubDate: 2026-09-22
updatedDate: 2026-10-17
category: AI
tags:
  - AI Agents
  - Skills
  - Claude Code
draft: false
references:
  - title: "Superpowers — 官方 repository"
    url: "https://github.com/obra/superpowers"
  - title: "Fresh Worktree — Are better models replacing Superpowers?（2026-08-28）"
    url: "https://fresh-worktree.ghost.io/are-better-models-replacing-superpowers/"
  - title: "Jesse Vincent — Superpowers 6.4（2026-09-21）"
    url: "https://blog.fsck.com/2026/09/21/superpowers-6.4/"
---

模型變強之後，planning、TDD 與 review 還有價值，但不代表每個任務都應支付同樣的流程成本。評估 Superpowers，應先指出目前 Agent 常漏掉哪一步，再看它能否減少返工。

本文是公開資料型評估，沒有自身專案的對照實測。初版討論截至 2026-09-22 的資料；本次修訂保留測試日期與版本邊界，不把舊結果視為所有新版的表現。

## 這篇的重點

需求不清、跨模組修改或反覆排錯時，可以評估相應的 skills；範圍清楚的小修改則需要更輕的驗證流程。是否採用整套 Superpowers，應比較驗收結果、總耗時與人工收尾，不能只看安裝量或一次 demo。

## 流程解決什麼缺口？

[Superpowers 的官方說明](https://github.com/obra/superpowers)把它定位成由 skills 組成的開發方法，涵蓋需求釐清、計畫、測試與 review。這些步驟能提醒模型處理容易漏掉的工作，同時也增加讀取指令、交接與驗收的成本。

例如新增 chart engine 的 public API，需要先決定資料 ownership 和相容性，規劃有具體用途。若只把一個已指定的導覽標題改成英文，就要確認額外訪談與 spec review 能避免什麼錯誤。

這是按任務選流程的建議，不是宣稱 Superpowers 預設會如此分流。實際觸發方式必須檢查所安裝版本與 Harness 的整合。

## 一組對照實驗的結果與限制

[Fresh Worktree 在 2026-08-28 公布的實驗](https://fresh-worktree.ghost.io/are-better-models-replacing-superpowers/)使用健身房預約 app 的同一份 spec、66 項驗收測試，每組跑 5 次。以下沿用原文命名與中位數，費用是當次 API 成本：

| 配置 | 通過測試 | 耗時（分鐘） | 費用（USD） |
| --- | ---: | ---: | ---: |
| Plain Opus5 | 66/66 | 20.1 | 5.62 |
| Adventure Party | 66/66 | 42.1 | 17.48 |
| Superpowers | 64/66 | 111.6 | 35.49 |

這組結果支持「該任務的完整流程增加了成本，且驗收分數沒有更高」。它只有一種 greenfield 任務，Superpowers 組還使用 subagents，無法把差距全部歸因於某個 skill；原生組沒有建立 unit tests，分數也未衡量未來維護。作者同時維護參測的 Adventure Party。

因此它適合提出待驗證的假設，不足以斷言 Superpowers 已被強模型取代。

## 6.4 的調整讓版本更不能混看

[Jesse Vincent 在 2026-09-21 的 6.4 說明](https://blog.fsck.com/2026/09/21/superpowers-6.4/)重新設計 Native Execution，讓主 session 直接執行計畫，作為 Subagent-Driven Development 之外的選項。

作者自述的內部評估是：Native Execution 相較 subagent 流程更快、成本更低；不用實作 skills 則更快但 bugs 更多。這是工具作者的評估，沒有在本文獨立重跑，也不能和前面的第三方實驗直接拼成同一組比較。

這個更新提供的是另一個配置選項。它是否適合自己的 repository，仍需要固定驗收條件再試。

## 把流程和任務一起驗收

可以先挑三種自身會遇到的工作：明確的小修改、需求需要釐清的新功能，以及可重現但原因未明的 bug。固定模型版本、repository 基準、工具權限與完成條件，比較原生流程、必要的單一 skills 與完整流程。

| 要記錄的結果 | 為什麼需要 |
| --- | --- |
| 驗收通過與漏掉的需求 | 避免把「宣告完成」當品質 |
| 端到端耗時與 API 費用 | 包含規劃、交接與重試 |
| 人工 review、修正與收尾時間 | 檢查成本是否被轉嫁給人 |
| 留下的測試與維護負擔 | 避免只比較當天交付 |

如果某個 skill 能穩定減少特定漏步驟，就有留下的理由；若整套流程只讓簡單工作更久，應縮小適用範圍。模型更新後保留相同任務再比較，才能知道哪些支援還有必要。
