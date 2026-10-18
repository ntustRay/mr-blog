---
title: "[News] DeepSeek 開放 Search／Fetch：多 Agent 得共用請求預算"
description: "DeepSeek 在 10/17 開放搜尋與網頁擷取 API。整理按次計費、帳號級 QPS 與內容缺漏，說明研究型 Agent 接入前該驗證什麼。"
pubDate: 2026-10-18
category: AI
tags: [AI Agents, Harness]
draft: false
references:
  - title: "DeepSeek：2026-10-17 Change Log"
    url: "https://api-docs.deepseek.com/updates/"
  - title: "DeepSeek：Search & Fetch guide"
    url: "https://api-docs.deepseek.com/guides/search/"
  - title: "DeepSeek：Search API reference"
    url: "https://api-docs.deepseek.com/api/search/"
---

做研究型 Agent，拆成幾個平行任務很直覺：一個查官方公告，一個找社群回報，再由主 Agent 整理。但平行任務各自搜尋、讀網頁時，花費與限流必須一起管理。

DeepSeek 在 **2026 年 10 月 17 日**[開放 Search／Fetch API](https://api-docs.deepseek.com/updates/)，同日更新 V4.1-Flash-1017。這篇只看新開放的搜尋工具：接入後，多 Agent 共享的額度應該放在哪裡管？

## 這篇的重點

Search 找網頁，Fetch 取內容；兩者分開按成功請求計費，且各有帳號級限流。適合先做小範圍接入測試，別急著讓每個 Agent 都自行大量重試。本文依官方文件整理，沒有呼叫 API，也沒有驗證搜尋品質或服務延遲。

## 搜尋結果與讀到原文，要分開驗收

依 [API reference](https://api-docs.deepseek.com/api/search/)，Search 回傳 URL、摘要等結構化結果；`need_content` 預設為 `false`。即使設為 `true`，取不到內容時，`content` 仍可能是空字串。

以下是依文件調整的 Bash 範例，僅供接入方向參考，未實際送出請求。執行前需自行設定 `DEEPSEEK_API_KEY`，並留意可能產生費用。

```bash
curl --fail-with-body https://api.deepseek.com/v1/tools/search \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "agent site:github.com",
    "count": 5,
    "need_content": true
  }'
```

整理新聞時，這幾種結果不能混成同一個「搜尋成功」：

| 拿到的資料 | 後續處理建議 |
| --- | --- |
| URL 與摘要，沒有原文 | 可當線索，不宣稱已讀全文 |
| 原文可讀，但日期或版本不明 | 回查 release、commit 或文件版本 |
| 原文支持主張，也有明確事件日期 | 才納入對應時段的研究證據 |

這是建議的研究驗收方式，並非 DeepSeek 的品質保證。搜尋服務的排序分數可以幫忙篩選，無法替代重要主張的來源查核。

## 帳單按請求算，限流按帳號算

[官方 guide](https://api-docs.deepseek.com/guides/search/)列出的直接 API 計費為：Search 與 Fetch 各 **每 1,000 次成功且有結果的請求 US$0.75**。Search 的 `count` 不改變單次價格；空結果與失敗等情況不計費。兩個 API 各限 **每帳號 5 QPS**，換 API key 不會增加帳號額度，Fetch 另有網域級限制。

假設每個研究任務都做 2 次搜尋，再用 Fetch 讀 6 頁，且全部符合計費條件，1,000 個任務的工具費是：

```text
Search：2,000 / 1,000 × US$0.75 = US$1.50
Fetch ：6,000 / 1,000 × US$0.75 = US$4.50
合計：US$6.00
```

這是按公布單價計算的假設情境，不是實測帳單；不含模型推論、其他服務或額外讀取，也沒有套用特定整合管道的優惠。

單價容易估，瞬間流量更容易被漏掉。若每個 worker 都設一個本機 limiter，它們仍可能同時超過共同帳號的限制。多程序或多台機器部署時，需要能協調的佇列或共享限流狀態；工具流量少時，單一調度程序就可能足夠。

同一頁也不必由三個 Agent 各讀一次。可以針對同批任務合併重複請求，記錄內容與擷取時間；有即時性要求時，再明確決定何時重新取得，避免快取把舊公告當成最新消息。

## 限流、讀不到與查無結果，各有不同退路

依 guide，429、逾時與部分伺服器錯誤可等待後重試；不要把所有錯誤都當成暫時故障。整合時可加上有限次重試、退避與任務總期限。這些是實作建議，仍須測試是否符合服務行為。

尤其不要讓「讀不到」直接變成「再找十個替代網站」。它可能是來源的存取政策、內容格式，也可能只是查詢沒有結果。先保留原因，才能決定縮小查詢、換來源，或把這則消息標為證據不足。

接入前可用同一批問題比較既有搜尋工具：是否找得到指定官方公告、回傳日期是否可信、原文缺漏如何呈現，以及多個 worker 同時執行時能否有界地結束。驗收應看最終引用是否支持結論，不只看回傳幾筆 URL。

既有的 [Model Routing 文章](../model-routing-cost-quality/)討論如何選模型；這次新增的是搜尋工具本身的請求預算。模型、worker 數量與外部工具額度要分開設定，才方便知道增加平行度後，究竟省了等待，還是多了重複搜尋與重試。
