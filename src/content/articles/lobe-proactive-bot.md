---
title: "[News] LobeHub 2.3.0：Agent 主動插話，預設開啟前該量什麼？"
description: "LobeHub 2.3.0 將 Proactive Bot 預設開啟，並提供 wake records 與人工標記。從官方 replay 數據、誤喚醒成本到 rollout，整理主動型 Agent 上線前該驗證的事。"
pubDate: 2026-11-02
tags:
  - AI Agents
  - Harness
category: AI
references:
  - title: "LobeHub v2.3.0 release"
    url: "https://github.com/lobehub/lobehub/releases/tag/v2.3.0"
  - title: "Enable proactive bot wake-by-default"
    url: "https://github.com/lobehub/lobehub/pull/22024"
  - title: "Add helpfulness signal to bot wake decisions"
    url: "https://github.com/lobehub/lobehub/pull/22038"
  - title: "Add wake records and owner feedback"
    url: "https://github.com/lobehub/lobehub/pull/21934"
relatedPostIds:
  - d1-ultra-probability-human-review
  - agent-monitoring-coverage-compaction
  - agent-native-shared-actions-ui-state
draft: false
---

Agent 待在團隊頻道裡，真正麻煩的問題往往落在「它現在該不該出聲」。只在被 `@` 時回應，容易漏掉能主動幫忙的時機；每則訊息都判斷一次，又可能把頻道變成通知轟炸。

LobeHub 在 2026 年 11 月 1 日發布 v2.3.0，將 Proactive Bot 預設套用到一般 bot。它會監看頻道訊息，再決定回應、保持安靜或等待。這個改動值得注意，因為主動型 Agent 從選配功能變成預設產品行為，誤判的成本也從「答案不夠好」擴大到干擾團隊注意力。

## TL;DR

- LobeHub 2.3.0 讓一般 bot 預設啟用 proactive wake；異質 Agent，例如使用本機裝置與額度的 Claude Code、Codex，新建立時仍預設關閉。
- 官方 PR 的離線 replay 顯示，加入「是否有幫助」訊號後，AUC 從 0.57 提升到 0.80，想要的喚醒從 3/13 增至 7/13；這是作者針對少量已標記資料的回放，不能當成正式線上成效。
- Wake records 能回看分數、理由與結果，也能由 bot owner 標記正誤；目前標記只保存，尚未自動影響後續判斷。
- 實務上應先量 precision、漏掉的喚醒、每小時打擾次數、模型成本與頻道差異，再決定是否預設開啟。

## 從被動回應變成 wake policy

依 v2.3.0 release 與合併 PR，沒有明確關閉 `botWakeDisabled` 的一般 bot 會啟用訊息監看。對未被點名的訊息，系統會記錄判斷；只有需要追問，或 bot 本身有職責時，才需要呼叫模型。喚醒判斷共用每個 bot 的每小時預算，避免同一個 bot 無限制消耗模型呼叫。

這裡真正新增的核心是一套 wake policy：

1. 這則訊息是否落在 bot 的職責範圍？
2. 即使不是明確職責，bot 現在出聲是否真的有幫助？
3. 即使判斷想回應，當下的成本、頻率與頻道情境是否允許？

第二個訊號是在後續 PR 加入。實作以同一次 duty decision 同時計算 `duty` 與 `helpful`，官方設定的喚醒條件是 duty 分數至少 0.65，或 helpful 分數至少 0.7，因此沒有額外增加一輪模型呼叫。

## 官方 replay 有方向性，仍無法當上線保證

PR 作者用 65 筆人工檢視過的判斷做離線 replay，提供了少見、但仍有限的量化依據：

| 指標 | 只看 duty | 加入 helpful |
| --- | ---: | ---: |
| AUC | 0.57 | 0.80 |
| 想要的喚醒 | 3/13 | 7/13 |

這組結果支持「職責」與「是否有幫助」是兩個不同訊號。不過樣本只有 65 筆，且由功能作者自行回放，尚未看到獨立重跑或正式 production 報告。PR 也預估近期 57 則訊息中，約 5% 會符合 duty 喚醒條件；這仍是預測，不是實際使用者被打擾的比例。

對工程團隊而言，AUC 單一指標不足以支撐採用決策。主動型 Agent 至少要同時看：

- **Precision**：Agent 主動出聲時，有多少次真的有用？
- **Missed wake**：該幫忙卻保持安靜的比例有多高？
- **Attention cost**：每個頻道、每位使用者、每小時收到幾次非必要訊息？
- **Inference cost**：判斷與實際回應各花多少模型呼叫與 token？
- **分群表現**：工程頻道、客服頻道與閒聊頻道不能共用同一組門檻。

如果只最佳化 recall，Agent 很容易變成熱心過頭的同事。對團隊協作產品來說，一次 false positive 還會帶來上下文切換、通知疲勞與使用者關閉整個功能的風險。

## 有 wake records，才有機會把噪音調低

另一個合併 PR 為 bot owner 增加最近 30 天的 Wake records，能查看被判斷的訊息、結果、模型分數與理由，並用正確或錯誤標記每次決策。這讓 wake policy 從難以追查的 prompt 行為，變成可稽核的產品決策。

目前仍有一個重要缺口：owner 的標記只會保存，還不會直接更新門檻、prompt 或後續決策。也就是說，LobeHub 已建立 feedback collection，但尚未形成自動 feedback loop。團隊若要調整策略，仍需匯出或人工檢視標記，再發布新的規則。

這些紀錄本身也屬於敏感資料。PR 審查曾發現 Wake history 可能跨 workspace 查詢，合併前才補上 workspace scope 與測試。這個修正很實際地提醒我們：Agent 的觀測資料可能包含原始訊息、模型理由與人類評價，權限與保存期限不能留到最後才處理。

## 我會怎麼 rollout 主動型 Agent

如果把這套機制導入公司的聊天頻道，我會先採以下順序；這是根據 release 與 PR 資訊整理的工程建議，並非 LobeHub 官方保證：

1. **先跑 shadow mode**：保留「本來會喚醒」的紀錄，但不真的發訊息。
2. **從低風險頻道 opt-in**：先限定職責清楚、訊息量可控的頻道，不直接全域預設開啟。
3. **人工標記一批真實流量**：同時標記「該說話」與「應保持安靜」，避免只蒐集正例。
4. **依頻道調門檻與預算**：把每小時喚醒上限、模型呼叫數與人工負評一起看。
5. **設置快速停用與回復路徑**：bot owner 必須能立即關閉，部署也要能回退設定。
6. **隔離資料範圍**：Wake records 需受 workspace、頻道與角色權限約束，並設定保存期限。

自架 LobeHub 的團隊還要留意 v2.3.0 會自動執行六個資料庫 migration。官方特別提醒，migration 0196 會在 transaction 內建立 memory indexes，大型資料表可能阻塞寫入；資料量大時，應依 release note 先用 concurrent index 建立流程處理。

## 採用判斷

LobeHub v2.3.0 是正式 release，包含 145 個合併 PR、7 位 contributor，核心 wake、評估紀錄與 scope 修正都有對應程式碼和測試。它已經足以做小範圍 PoC，不再只是概念展示。

但這項功能很新，官方數據仍是作者自測，尚缺少獨立 production 驗證；而且一般 bot 預設開啟，對既有工作區屬於行為變更。既有的異質 Agent 也可能保留舊設定，升級後應逐一確認。我不會因為 release 已發布就直接全域採用，會先把它當成可觀測、可關閉的實驗功能。

主動型 Agent 能否創造價值，最後取決於團隊是否相信它知道何時保持安靜。LobeHub 這次更新最值得追的，是 wake policy、回看紀錄與人工標記開始被當成一等產品能力，不再只是藏在 prompt 裡的偶然行為。

## References

- [LobeHub v2.3.0 release](https://github.com/lobehub/lobehub/releases/tag/v2.3.0)
- [PR #22024：Enable proactive bot wake-by-default](https://github.com/lobehub/lobehub/pull/22024)
- [PR #22038：Add helpfulness signal to bot wake decisions](https://github.com/lobehub/lobehub/pull/22038)
- [PR #21934：Add wake records and owner feedback](https://github.com/lobehub/lobehub/pull/21934)
