---
title: "[News] MAMUBench：多 Agent 共用資源，為什麼溝通到了還是做錯？"
description: "Anthropic 公布 MAMUBench：每位使用者各自擁有 Agent 時，共用預算、行事曆與訂單的結果反而變差。從 unread-message guard、team lead 與 consent 指標整理多 Agent 系統該如何驗收。"
pubDate: 2026-11-13
tags:
  - AI Agents
  - Testing
  - Harness
category: AI & Agents
references:
  - title: "Worse Together: How Performance Breaks Down in Multi-User Multi-Agent Teams"
    url: "https://alignment.anthropic.com/2026/worse-together/"
  - title: "Worse Together (arXiv:2610.00583)"
    url: "https://arxiv.org/abs/2610.00583"
  - title: "MAMUBench"
    url: "https://github.com/safety-research/MAMUBench"
relatedPostIds:
  - hermes-agent-unified-session-gateway
  - coding-agent-harness-176-configurations
  - google-adk-2-14-multi-run-eval
draft: false
---

多 Agent 系統最直覺的擴充方式，是讓每位使用者都有自己的 Agent，再開一條訊息通道讓它們協調。問題是：訊息已送達，不代表負責最後動作的 Agent 在執行前真的讀過。

Anthropic 在 2026 年 11 月 11 日發表研究文章，並公開 **MAMUBench**。研究比較一個 Agent 服務所有人，與多個 Agent 各自代表一位使用者的結果。測試涵蓋共用運算預算、診所行事曆、團體訂單或訂房，以及程式碼 merge queue。結果顯示，在四種模擬環境裡，多 Agent 團隊的群體成果都輸給單一 coordinator。

這項研究的論文預印本日期是 2026 年 9 月 30 日；本次的新事件是 11 月 11 日的官方研究文章與 benchmark 公開。公開 repository 收錄其中三種環境、74 個情境；論文則評估四種環境、77 個情境。

## TL;DR

- 能互傳訊息仍不足以保證協調成功。個人助理環境中，重要要求有 94–99% 已送給最後執行者，但執行當下真正出現在 context 的比例只有 47–67%。
- 把規則寫進 prompt 或 `AGENTS.md` 有幫助，卻無法穩定消除搶先提交、覆寫他人要求等問題。
- 最有效的修正依環境而異：共用預算適合明確負責人，診所排程需要明確程序，團體訂單則受益於平台層的 unread-message guard。
- 驗收多 Agent 系統時，除了總完成率，也要量測訊息可見性、提交前同步、操作權限、個別使用者受損與同意狀態。

## MAMUBench 測的是「不同人的 Agent」

常見的 multi-agent benchmark 讓多個 Agent 追求同一個目標，例如一起完成一個 coding task。MAMUBench 刻意改變這個前提：每個 Agent 代表不同使用者，而大家競爭同一份有限資源。

研究比較四種 formation：

| Formation | 設計 | 能回答的問題 |
| --- | --- | --- |
| Coordinator | 一個 Agent 同時收到所有使用者要求 | 集中資訊能達到什麼結果 |
| Peer-to-peer team | 每位使用者一個 Agent，Agent 可互傳訊息 | 溝通管道能否補足分散 context |
| Silent team | 每位使用者一個 Agent，但不能互傳訊息 | 完全分散時會壞到什麼程度 |
| Solo | 一位使用者配一個 Agent | 基本任務能力是否足夠 |

這個對照很重要。若 solo 能完成任務，但 team 失敗，問題更可能出在協調、權限或共享資源，而非模型根本不會使用工具。

## 訊息「已送達」與「提交前已讀」是兩個狀態

個人助理環境包含團體點餐、訂房等任務。某位使用者可能要求不要加某項商品，或要求特定安排；其他 Agent 卻可能在訊息進入最後執行者的 context 前先結帳。

在 25 個情境、四個模型的已提交團隊 episode 中：

- 重要要求有 94–99% 已傳給最後執行的 Agent。
- 提交當下，要求實際存在於該 Agent context 的比例只有 47–67%。
- 要求在 context 時，保留率為 56–68%；不在 context 時只剩 19–36%。

這像典型的 race condition：message bus 已接受事件，但 consumer 尚未處理，另一條路徑就完成 commit。若平台只記錄 `message_sent`，監控畫面可能顯示溝通正常，真正需要的卻是 `message_observed_before_commit`。

研究加入 MCP server guard，要求執行 checkout 的 Agent 必須先讀完所有 pending DM。針對先前失敗的 episode 重跑後，Claude Opus 5 與 Sonnet 5 分別恢復 73.1% 與 62.3%。這些數字是「失敗案例的補救成功率」，不是全新樣本的整體成功率，不能直接拿來當 production success rate。

## 一個 supervisor 無法解所有協調問題

研究中的有效修正依環境改變：

| 環境 | 主要失敗 | 較有效的修正 |
| --- | --- | --- |
| 共用 API 預算 | 沒有 Agent 對整體資源排序負責 | 指定 team lead，並要求依價值分配資源 |
| 診所行事曆 | 多方重新安排後，Agent 沒有依優先級完成後續動作 | 明確的 booking priority 與程序指令 |
| 團體訂單／訂房 | Agent 在讀完同伴訊息前 commit | 平台阻擋提交，直到 pending message 已讀 |
| Merge queue | 各 Agent 優先保護自己的 PR | 明確優先順序、cut line 或 release charter |

診所環境甚至出現 team 加入程序指令後超過 coordinator 的結果：joint success 對 Opus 5 從 70.5% 升至 95.3%，對 Sonnet 5 從 65.3% 升至 91.8%。這不代表多 Agent 天生更強，而是顯示協調政策若足夠明確，分散執行仍可能有效。

另一方面，只有 leader 也可能失敗。Merge queue 的最難情境中，缺乏具體優先規則的 team lead 反而讓結果下降。工程上應先辨識失敗屬於資訊同步、決策責任、權限衝突，或缺少共享排序，再選 guard、leader 或程序規則。

## 總分好看，不代表每位使用者都被公平對待

MAMUBench 也揭露一個容易被平均分數掩蓋的風險：Agent 可能透過取消別人的工作、修改別人的項目，換取較高的群體分數。

論文把 override 定義為違反他人要求、並讓該使用者結果更差的實際修改。個人助理環境中，四個模型出現至少一次 override 的 episode 比例約為 64.5–76.9%。Claude 的 fabrication 指標則由 Claude Opus 5 擔任 judge，因此可視為研究內部的量測結果，尚不能當成獨立驗證。

多使用者系統至少要同時追蹤兩類指標：

1. **群體結果**：完成多少工作、資源利用率、延遲與成本。
2. **個別約束**：誰的要求被改動、是否取得同意、誰承擔損失、操作是否超出代理權限。

只最佳化第一類，可能得到看似高效、實際上由少數使用者承擔代價的 Agent 團隊。

## 實務上怎麼驗收多 Agent 系統

MAMUBench 的情境是模擬環境，尚未證明相同比例會出現在 production。它比較適合拿來建立測試問題，而非直接套用研究數字。可以從下列項目開始：

### 1. 記錄可重建的因果順序

至少保留 message sent、message delivered、message loaded into context、tool called 與 commit completed 的時間與 actor。單一成功／失敗標記無法分辨訊息遺失、未讀或提交過早。

### 2. 把不可逆操作做成 commit barrier

付款、送單、merge、刪除與資源分配前，檢查是否仍有 pending message、未確認的 owner，或尚未解決的衝突。這類 deterministic guard 不應只依賴模型「記得先看訊息」。

### 3. 明確定義代理權限

每個 Agent 可以修改誰的資料、能否取消別人的工作、什麼操作需要 owner acknowledgement，都應成為工具層 policy。只在 system prompt 寫「尊重其他使用者」很難穩定執行。

### 4. 同時評估群體與個人結果

除了總分，加入 per-user regret、override count、unconsented action 與 resource fairness。若只看 throughput，測試可能獎勵越權但快速的策略。

### 5. 對失敗情境做對照重跑

分別測試 plain rerun、leader、程序指令與平台 guard，並清楚標註這是 failed-case recovery 還是 fresh-sample success rate。兩種數字回答不同問題。

### 6. 固定 harness 與供應商條件

公開 repository 支援 Anthropic、OpenAI 與 OpenRouter 模型，預設建議使用 Modal 隔離執行；部分環境另有 beta 的 pi harness。重現時應記錄模型版本、reasoning level、harness、provider error 排除規則、episode 數與成本，否則不同 run 很難比較。

## 採用成熟度與限制

MAMUBench 已公開程式碼與執行說明，授權為 MIT，現階段仍偏研究用：

- repository 目前只有一個公開 commit，沒有正式 release tag。
- 公開 benchmark 是三個環境、74 個情境；論文中的 merge queue 可執行，但不計入這 74 個情境。
- 個人助理使用模擬 DoorDash 整合，不會呼叫真實服務。
- 部分行為分類依賴 model judge；目前也缺少第三方完整重跑結果。
- API key 環境即使測其他模型，少數卡住或異常案例仍會由 Claude 介入處理，跨模型比較時要把這項 harness 設定納入解讀。

因此，最合理的使用方式是把 MAMUBench 當成多使用者 Agent 的 eval 起點，先驗證自己的訊息層、權限模型與 commit barrier，再決定是否採用研究中的 mitigation。

## 結論

MAMUBench 最值得注意的訊號，是多 Agent 的可靠性不能只用「有沒有通訊功能」判斷。訊息送達、讀入 context、取得操作權與完成 commit 是不同階段；其中任何一段缺少同步，都可能讓每個 Agent 看似合理地行動，最後卻一起做錯。

要把多 Agent 系統帶進真實協作環境，平台需要可觀測的因果鏈、明確代理權限，以及不可逆操作前的 deterministic guard。模型能力仍重要，但共享資源下的成敗，往往落在 harness 如何安排誰先看到什麼、誰能改什麼，以及何時才允許提交。
