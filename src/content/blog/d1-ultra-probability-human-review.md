---
title: "[Insight] d1-ultra 回傳機率之後，Agent 何時該轉人工？"
description: "Liquid AI 的 d1-ultra 把分類與判斷變成結構化機率。從 calibration、棄答門檻到 TypeScript 分流範例，整理接進 Agent 前真正需要驗證的事。"
pubDate: 2026-10-17
updatedDate: 2026-10-17
category: AI
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

客服 Agent 收到一封信，先判斷是不是客訴，再決定交給哪個流程。如果模型只回 `true`，系統看不到它有多猶豫；如果它回 `0.93`，系統就多了一個可以使用、也可能誤用的訊號。

Liquid AI 在 **2026 年 10 月 15 日**發布 [d1-ultra](https://www.liquid.ai/blog/d1-ultra)，接收文字與圖片，直接回傳結構化判斷與機率，不逐字生成答案。這讓「拿模型做有限選項的決策」多了一個可試的選項。

真正值得討論的是：拿到機率以後，要怎麼保留「這次先不要自動處理」的空間？

## 這篇的重點

- Decision model 適合已定義選項的分類與判斷，不能直接替代負責規劃、呼叫工具的整個 Agent。
- `0.9` 是模型對某個答案的機率估計，不是這次工作有九成機會順利完成。
- 先在真實資料驗證 calibration 與自動分流錯誤，再決定門檻；低把握、格式異常及服務失敗都要有退路。

本文沒有呼叫 d1-ultra API，也沒有重跑模型評測。下方只有自行撰寫並執行行為測試的分流函式，不能當成模型能力實測。

## 先把問題縮成有限選項

依 [官方 API 文件](https://docs.liquid.ai/lfm/models/d1)，問題有三種型態：`noul` 回傳「是」的機率，`choice` 在預定選項中判斷，`score` 處理有順序的尺度。`noul` 是 API 名稱，程式裡要照這個拼法使用。

適合起步的問題包括「這封信是否為客訴」、「應該交給帳務或技術支援」，以及「目前資料是否足夠，能進下一步」。需要生成回覆、查資料或跨網站操作時，後續仍需要其他模型與工具。

[Vercel 在同一天公布 AI Gateway 整合](https://vercel.com/changelog/liquid-ais-d1-ultra-now-available-on-ai-gateway)，代表它已有具體的接入管道。這只能證明可整合，不能證明自家工單的分類效果。

選項本身也會限制結果。若帳務、技術、其他三類根本涵蓋不了某封信，只取最高分仍會得到一個答案。應先定義模糊、複合需求與資訊不足如何處理，再請模型分類。

## `0.9` 要放回一群案例裡看

Calibration（機率校準）關心的是：一群被模型估為約九成把握的答案，實際答對比例是否也接近九成。它需要一批有正確標記的資料，無法靠單筆輸出證明。

即使某組評測校準良好，換成台灣客服常見的中英混用、反諷、截圖，或特定公司的產品名稱，仍要重新檢查。大盤平均也可能遮住少數類別的問題。

例如客訴只占少數時，「全部判成一般詢問」也可能有漂亮的整體 accuracy。工程上更需要知道漏掉多少客訴，以及被自動分流的那一部分究竟錯多少。

這裡至少有三個不同的數字：

| 數字 | 回答的問題 |
| --- | --- |
| 分類 accuracy | 這批案例有多少判對？ |
| Calibration | 模型說有幾分把握，和實際答對比例是否相符？ |
| 完整任務成功率 | 判斷後的工具操作、資料更新與交付是否完成？ |

三者要分開記錄。分類正確，但工具參數錯誤或後端拒絕操作，整個任務仍可能失敗。

## 獨立評測提供了什麼證據？

[Artificial Analysis Decision Index](https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index)已納入 d1-ultra，並公開評測組成與 calibration 的呈現方法。這比只看 Liquid AI 自己的比較圖多一層外部證據。

不過，其中的 [When2Call](https://artificialanalysis.ai/evaluations/when2call) 是將工具使用情境轉成選擇題，判斷該直接回答、呼叫工具、補問資訊或無法回答。它並沒有替你的 Agent 執行真實工具，再檢查最後的資料狀態。

因此，這份評測可拿來篩選決策模型；完整工作流仍需要自己的驗收。目前也不能從這些資料推論它已適用所有產業或語言。

## 分流程式先保留第三種結果

以下只處理低風險的工單分類建議，不會退款、關閉案件或執行外部寫入。呼叫端可將 `answers.is_complaint.noul` 傳進來；這個欄位路徑依官方範例，本文未實際呼叫驗證。

**`0.95` 與 `0.05` 都是示意門檻，沒有經過資料驗證，不能直接當成正式環境設定。** 函式刻意接收 `unknown`，讓格式異常與不確定結果一起轉交人工。

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

這裡 `0.02` 表示模型傾向「不是客訴」，也可以是高把握的結果；不能把所有小數值都當成不確定。真正保留給人工的是中間區域，以及無效輸入。

本文執行過這個函式的邊界與異常輸入測試，包含 `0`、`1`、兩端門檻、`0.5`、越界數值、字串、`null`、`NaN` 與無限值。這只驗證程式分支，沒有驗證分類效果，也沒有做完整 TypeScript 型別檢查。

API 逾時、非成功回應、缺少欄位也應走轉人工或既有流程，不能先補成 `0`；補零會把故障誤當成「很確定不是客訴」。高把握判斷同樣不能越過使用者授權、權限檢查或必要的人工核准。

## 門檻要用留出的資料決定

可以先讓模型只記錄建議，不影響原本作業，收集經適當去識別化、取得使用許可的真實案例。標記規則要包含模糊案例，並保留未參與調整門檻的測試資料。

再比較幾組門檻，至少記錄：

- **自動處理覆蓋率**：多少案例不必轉人工。
- **自動分流錯誤率**：被自動處理的案例中，有多少判錯。
- **客訴漏判率**：真正的客訴有多少被當成一般詢問。
- **人工負擔**：待確認數量與實際處理時間。

把兩端門檻往外推，通常會減少自動處理量；錯誤是否同步下降，仍要看資料。若模型對某類錯誤一直很有把握，調門檻也救不了，可能得修改分類定義、補資料，或保留該類別全人工處理。

發布後應追蹤模型版本、問題定義與門檻設定。模型或資料分布一變，原本通過的校準與錯誤率就需要重驗。

既有的 [Model Routing 文章](../model-routing-cost-quality/)討論如何選模型與衡量總成本；這裡多了一個獨立的驗收問題：**系統能否辨認哪些判斷暫時不該自動採用。** 對低風險分流，可以從這個小範圍開始試；涉及付款、刪除或帳號權限的流程，仍要另外設計授權與執行邊界。
