---
title: "[News] GPT-6.1 Terra：Computer Use 變便宜後，還要量哪些成本？"
description: "GPT-6.1 Terra 降低 token 單價後，以每個驗收成功的電腦操作任務重新算成本。"
pubDate: 2026-10-27
category: "AI & Agents"
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

假設要把一百份發票上的欄位抄進待審表。較便宜的模型每輪花得少，如果它更容易讀錯畫面、需要重試或請人改回結果，整批費用還得算這些動作。OpenAI 在 2026 年 10 月 26 日發布 GPT-6.1 Terra，原刊公布的 API 每百萬 token 標準單價為 input 1 美元、cached input 0.05 美元、output 5 美元。[OpenAI 發布文](https://openai.com/index/introducing-gpt-6-1-terra/)｜[API 模型文件](https://developers.openai.com/api/docs/models)

## 官方 benchmark 可以幫忙選從哪裡開始試

OpenAI 報告 Agents’ Last Exam 在 medium effort 比 GPT-5.6 Terra 高 15 個百分點，約為三分之一的成本；Terminal-Bench 4.0 用 max effort 得 50.3%，前代公開值是 21.5%。測試的題組、工具環境和推理設定都會影響結果。先挑和自己的任務接近的項目，再用同一個 Harness 跑對照。[發布評測](https://openai.com/index/introducing-gpt-6-1-terra/)｜[System card 補充](https://deploymentsafety.openai.com/gpt-6-1-terra/exploitbench)

對發票例子，可以讓模型只寫到待審區，用原始發票比對欄位。若是網站 smoke test，就看最終頁面或測試環境資料是否符合預期。紀錄每次成功要用多少 token、瀏覽器服務、重試、改派與人工 review。若每件成功的成本降低，且錯誤風險和人工量都在可接受範圍，才有依據換模型。要讓 Agent 呼叫工具時，保留原本的操作範圍和人工確認點。[第三方 provider benchmark](https://artificialanalysis.ai/models/gpt-6-1-terra/providers)｜[Model Routing 與返工成本](../model-routing-cost-quality/)
