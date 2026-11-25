---
title: "[News] d1-ultra 回傳機率之後，Agent 何時該轉人工？"
description: "從客服工單的 0.93 分數說起，弄懂 d1-ultra 的輸出、機率校準和人工覆核門檻。"
pubDate: 2026-10-17
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, TypeScript]
draft: false
references:
  - title: "Liquid AI：d1-ultra"
    url: "https://www.liquid.ai/blog/d1-ultra"
  - title: "Liquid Docs：Hosted d1 API"
    url: "https://docs.liquid.ai/lfm/models/d1"
  - title: "Vercel：Liquid AI's d1-ultra now available on AI Gateway"
    url: "https://vercel.com/changelog/liquid-ais-d1-ultra-now-available-on-ai-gateway"
  - title: "Artificial Analysis：Decision Index"
    url: "https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index"
  - title: "Artificial Analysis：When2Call evaluation"
    url: "https://artificialanalysis.ai/evaluations/when2call"
---

客服收到「我昨天已經反映過，今天還是用不了」。分流模型若給「客訴」0.93，系統可以用它決定要不要放進客訴佇列。這個 0.93 的意義要用一批實際工單看：所有被估在 0.9 附近的案例，最後大概有多少被人工標為客訴？

Liquid AI 於 2026 年 10 月 15 日推出 d1-ultra，輸入可含文字與圖片，回傳結構化的判斷及機率。官方文件的 `noul` 題型回答是非機率，`choice` 從預定選項挑選，`score` 則對應有順序的尺度。先用範圍清楚的工單類別測試，比直接用模型執行退款或關單容易驗證。[發布公告](https://www.liquid.ai/blog/d1-ultra)｜[Hosted d1 API](https://docs.liquid.ai/lfm/models/d1)

## 分數要按這個產品的工單來校準

假設有一百筆工單都被判為約九成機率是客訴，人工回看後有九十筆確實是客訴，這一組的預測就跟觀察接近。這種對齊叫 calibration。台灣客服可能有中英混用、反諷和截圖，拿外部 benchmark 當初步參考後，仍要用經適當去識別化的資料看各類錯誤。Artificial Analysis 的 Decision Index 和 When2Call 提供外部結果，後者衡量要不要叫工具，與公司客服資料的錯誤代價不同。[Decision Index](https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index)｜[When2Call](https://artificialanalysis.ai/evaluations/when2call)

下面的函式有三種結果。高分與低分分到兩端，中間或格式異常就請人確認。門檻 `0.95` 與 `0.05` 是示意。原文驗證的是本地分流邏輯，沒有呼叫 d1-ultra API。

```ts
type Triage = "complaint" | "other" | "human_review";

function triageComplaint(probability: unknown): Triage {
  if (
    typeof probability !== "number" ||
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1
  ) {
    return "human_review";
  }

  if (probability >= 0.95) return "complaint";
  if (probability <= 0.05) return "other";
  return "human_review";
}
```

準備上線前，先讓模型只記分流建議，對一批留出的工單算三件事：有多少能自動分、已自動分的有多少判錯、真正客訴裡漏掉多少。最後把人工處理量一起算進去。門檻是否適合，會隨工單分布和漏判的代價變。
