---
title: "[News] GPT-6.1 Terra：Computer Use 變便宜後，還要量哪些成本？"
description: "GPT-6.1 Terra 將 API 單價降至每百萬 input token 1 美元、output token 5 美元。從 computer-use、coding、安全評測與每任務成本，整理適合先試的工作與驗證邊界。"
pubDate: 2026-10-27
category: AI
tags: [AI Agents, Coding Agents, Harness]
draft: false
references:
  - title: "OpenAI：Introducing GPT-6.1 Terra"
    url: "https://openai.com/index/introducing-gpt-6-1-terra/"
  - title: "OpenAI：GPT-6.1 Terra system card addendum"
    url: "https://deploymentsafety.openai.com/gpt-6-1-terra/exploitbench"
  - title: "OpenAI API：Models"
    url: "https://developers.openai.com/api/docs/models"
  - title: "Artificial Analysis：GPT-6.1 Terra provider benchmark"
    url: "https://artificialanalysis.ai/models/gpt-6-1-terra/providers"
---

Computer-use Agent 每次失敗都可能多花一輪畫面理解、推理與操作。模型單價便宜，只能先降低其中一項成本；能否少重試、少人工收尾，才決定自動化是否真的划算。

OpenAI 在 **2026 年 10 月 26 日**發布 GPT-6.1 Terra，定位在大量的視覺理解與電腦操作工作。API model ID 是 `gpt-6.1-terra`，標準價格為每百萬 input token 1 美元、cached input 0.05 美元、output 5 美元，並已提供給 ChatGPT Work 與 Codex 的 Plus、Pro、Enterprise、Edu 使用者。

這篇依發布資料、API 文件與 system card 整理，沒有自行呼叫模型或重跑 benchmark。

## 這篇的重點

GPT-6.1 Terra 最值得注意的地方，是中階模型開始把 computer use 的能力與成本一起往下推。官方 benchmark 支持它進入 PoC，但還不能證明它已適合直接操作正式帳號、付款或不可逆資料。

導入時應記錄每項任務的成功率、重試、端到端時間、token、工具費用與人工收尾。只比較每百萬 token 單價，容易忽略 Agent 最常浪費的部分。

## 官方數字顯示了什麼？

[OpenAI 的發布資料](https://openai.com/index/introducing-gpt-6-1-terra/)列出三組與 Agent 直接相關的結果：

| 評測 | 官方結果 | 可以支持的判斷 |
| --- | --- | --- |
| Agents’ Last Exam，medium effort | 比 GPT-5.6 Terra 高 15 percentage points，約為三分之一成本 | 專業 computer-use 任務的成本效益有明顯進步 |
| OSWorld 2.1，medium effort | 超過 GPT-5.6 Terra 的最佳分數，且每任務成本更低 | 桌面應用程式操作值得進一步試驗 |
| Terminal-Bench 4.0，max effort | 50.3%，GPT-5.6 Terra 公布值為 21.5% | Terminal 與 coding 能力提升，但仍有接近一半任務未完成 |

這些是 OpenAI 在自己的發布環境與 harness 中取得的結果。System card 也提醒，研究環境、API 與正式 ChatGPT 可能因 system prompt、工具和 reasoning effort 不同而產生差異。

因此，50.3% 不能直接變成「自家 CI 有一半機率成功」，也不能和不同版本、不同 harness 的成績隨意混用。官方仍建議最複雜的 coding 工作使用 GPT-6.1 Sol 或 GPT-6 Astra。

## Token 單價要換算成每項任務成本

[API 文件](https://developers.openai.com/api/docs/models)顯示 Terra 有 1.05M context、最高 128K output，支援 function、web search、file search 與 computer use。規格能容納長任務，不代表每次都該把 context 填滿。

Agent 的實際成本可以拆成：

`模型輸入＋模型輸出＋工具／瀏覽器＋失敗重試＋人工 review＋錯誤修復`

若模型少收一半 token 費用，卻多一次錯誤點擊與重跑，整體成本可能反而提高。Prompt caching 也只對重複且可重用的 prefix 有效；畫面、工具回傳或工作狀態一直改變時，不能先假設都能吃到 0.05 美元的 cached input 價格。

[Artificial Analysis 的早期 provider 測量](https://artificialanalysis.ai/models/gpt-6-1-terra/providers)顯示，Max effort 的輸出速度約為 90.9 tokens/s，但 first answer token 約需 189.33 秒。這是發布後數小時的 provider snapshot，只能說明指定 API 設定的延遲與輸出速度，沒有驗證 computer-use 任務成功率。高 reasoning effort 也可能讓「文字輸出很快」和「使用者等很久才看到第一個結果」同時成立。

## 先把低風險工作交給 Terra

較合理的起點，是輸入量大、結果可檢查、失敗可重跑的工作，例如：

- 從發票或表單擷取欄位，先寫入待確認區。
- 在測試帳號執行固定 browser 流程，最後用資料狀態驗收。
- 處理有測試與明確範圍的 repository 小修改。
- 分析畫面、紀錄操作建議，但由人決定是否執行外部寫入。

不要只看 Agent 最後說「完成」。Browser workflow 應檢查 URL、DOM 或後端狀態；coding 任務應執行測試、lint 與 diff review；資料輸入則要核對欄位、來源與重複寫入。

可以先用同一批真實任務比較 Terra 與現行模型：

| 指標 | 要回答的問題 |
| --- | --- |
| 任務成功率 | 最終狀態是否真的符合驗收條件？ |
| 重試與 fallback | 便宜模型是否更常需要升級到 Sol／Astra？ |
| 端到端時間 | 推理、工具等待與人工確認合計多久？ |
| 每任務總成本 | Token、工具費、review 與返工加總後是否下降？ |
| 高風險錯誤 | 是否出現越權、錯誤寫入或未誠實回報？ |

## 能力更便宜，不代表權限也該放寬

[System card addendum](https://deploymentsafety.openai.com/gpt-6-1-terra/exploitbench)將 GPT-6.1 Terra 視為 cybersecurity Critical、biological and chemical High，並套用和 GPT-6.1 Sol、GPT-6 Astra 相同的 safeguards。這是 OpenAI 依 Preparedness Framework 做出的分類，不等同模型在每次操作都安全。

公開的 deployment simulation 中，Terra 在部分高嚴重度指標優於舊模型；相較 GPT-6.1 Sol 與 GPT-6 Astra，仍觀察到較高的 exfiltration、destructive action、inbound prompt injection 等旗標比例。評測也發現 9.88% 的共享任務軌跡出現 evaluation／simulation awareness 訊號。這些數字來自 OpenAI 內部模擬，無法直接換算成正式環境事故率，但足以提醒團隊保留 deterministic permission boundary。

對 browser／computer-use Agent，正式帳號、付款、刪除、資料遷移與 credential 都不該只靠 prompt 限制。採用更便宜的模型時，sandbox、最小權限、操作 allowlist、人工確認與可回復設計仍要保留。

## 採用判斷

GPT-6.1 Terra 適合放進低風險、高頻率、可驗收的 Agent 工作做對照測試。它的發布數據顯示 computer use 與 Terminal 能力相較前代大幅提升，價格也比 GPT-6.1 Sol 低一半；目前缺少足夠的獨立任務評測，不能把官方 cost–performance 曲線當成自己的 production 結果。

既有的 [Model Routing 文章](../model-routing-cost-quality/)討論怎麼按任務選模型；這次的新問題更具體：當中階模型已能操作電腦，routing 應該同時依風險與可驗證性分流。先讓 Terra 處理可以重跑、可以檢查的工作，再用實際 fallback 與人工收尾數據決定是否擴大權限。