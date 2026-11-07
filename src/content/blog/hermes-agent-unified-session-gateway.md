---
title: "[News] Hermes Agent 0.23：CLI、Desktop、Bot 共用 Session，誰該擁有唯一寫入權？"
description: "Hermes Agent 0.23 讓 CLI、TUI、Desktop、editor、bot 與 cron 接到同一個 gateway session。從 single writer、durable FIFO、receipt 與 unknown recovery 看多介面 Agent 的狀態一致性。"
pubDate: 2026-11-07
category: "AI & Agents"
tags:
  - AI Agents
  - Harness
  - Coding Agents
draft: false
references:
  - title: "Hermes Agent v0.23.0 — The Hearth Release"
    url: "https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0"
  - title: "PR #106742：Unified gateway runtime"
    url: "https://github.com/NousResearch/hermes-agent/pull/106742"
  - title: "PR #140334：Steer and edit a canonical queued prompt"
    url: "https://github.com/NousResearch/hermes-agent/pull/140334"
relatedPostIds:
  - coding-agent-harness-176-configurations
  - memhub-shared-memory-data-lifecycle
  - agent-monitoring-coverage-compaction
---

同一段 Agent 對話如果能從 terminal、Desktop、editor、bot 與排程繼續，看起來像 UI 整合。真正困難的是：這些入口同時送出訊息或修改 queue 時，誰有權寫入 session？

Hermes Agent 在 **2026 年 11 月 5 日 21:32 UTC（台灣時間 11 月 6 日 05:32）**發布 v0.23.0。這次 release 將先前多個 patch 與大型架構變更整理成正式版本；核心的 unified gateway PR 早在 10 月 14 日合併，因此不能把整套設計都說成 11 月才首次出現。

本文依正式 release、merged PR 與其中列出的驗證紀錄整理，沒有安裝 Hermes Agent，也沒有自行重跑測試。

## 這篇的重點

- 多介面 Agent 共享的不該只有 transcript。Queue、approval、session policy、重試身分與執行結果也要有單一權威來源。
- Hermes 讓每個 profile 由一個 gateway 擁有 sessions；CLI、TUI、Desktop、ACP、bot、webhook 與 cron 以 client 身分連入，canonical state 只保留一個 writer。
- Queued work 可在 owner restart 後依 FIFO 繼續；已開始卻失去 owner 的工作則標成 `unknown`，不自動重播，避免有副作用的動作執行兩次。
- 這是正式 release，也有大型 merged PR、CI 與針對 race condition 的測試。不過缺少獨立 production 驗證，部分 queue controls 仍只有 Desktop 支援，採用成熟度比較適合評為「可試用、需保留復原與觀察」。

## 多個入口共用 SQLite，為什麼仍會出錯？

[PR #106742](https://github.com/NousResearch/hermes-agent/pull/106742)描述改版前的問題：CLI、TUI、Desktop backend、API server、ACP 與 cron 可能各自啟動 Agent，對同一個 `state.db` 寫入同一段 conversation。

共享資料庫只代表資料放在一起，沒有保證同一個 session 只有一個 execution owner。兩個 process 同時認為自己應處理下一則 prompt 時，可能出現：

- 同一個工作執行兩次；
- 一個介面的訊息在另一個介面消失；
- queue 顯示順序和實際執行順序不同；
- approval 在 A 視窗已回答，B 視窗仍等待；
- process 中斷後，不知道一個有副作用的動作到底做完了沒有。

這些問題不能靠「最後再同步 transcript」補救。Transcript 是結果的一部分，執行中的 claim、queue position、revision、approval 與 retry identity 才決定接下來會發生什麼。

## Hermes 的做法：一個 Profile，一個 Gateway Owner

v0.23 的核心結構可以簡化成四層：

| 層次 | Hermes 的責任 | 工程上要守住的條件 |
| --- | --- | --- |
| Profile owner | 一個 gateway process 擁有該 profile | 第二個 writer 只能 attach 或退出 |
| Session authority | 每個 session 有 coordinator 與 durable admissions FIFO | 每次工作有 admission identity 與 generation fence |
| Client surfaces | CLI、Desktop、ACP、bot、cron 等只提交與讀取 | Client 不自行維護 canonical queue |
| State store | 保存 session、queue、receipt 與 terminal outcome | Mutations 有 revision check，可重試且可追溯 |

PR 說明中，gateway 會先取得 profile home 的 ownership，再由 `SessionAuthority` 管理每個 session。不同介面透過同一 transport attach；Desktop 關閉或 editor 斷線，不代表 Agent turn 必須跟著停止。

這種設計的價值不只在跨裝置接續。它把「誰可以決定下一個 turn」從每個 UI 移到 runtime，讓 queue 與 session lifecycle 成為可驗證的後端契約。

## Exactly-once 不是一句設定，要先定義不確定狀態

Hermes 對 restart 的處理很值得參考：

| 中斷時的狀態 | 處理方式 | 原因 |
| --- | --- | --- |
| 還在 queue | Owner restart 後依原 FIFO 繼續 | 工作尚未開始，可以安全保留 |
| 已開始，owner 消失 | 標記為 `unknown`，不自動 replay | 可能已產生外部副作用，重跑有重複風險 |
| 同一 submission retry | 重用原 admission identity 與 receipt | 避免網路重試變成新的工作 |
| 明確 terminal outcome | 回傳已提交的結果 | Client 不需要猜測上一個 request 是否成功 |

這個策略沒有宣稱能神奇地提供分散式 exactly-once。它把「確定尚未執行」、「確定已完成」與「結果不明」分開，並要求使用者或上層流程處理 unknown。

對會建立 PR、傳送訊息或修改資料的 Agent，這比自動重跑更安全。若要在自己的 runtime 採用類似設計，至少要保留：

```text
submission_id
session_id
owner_epoch
generation
queue_position
revision
started_at
terminal_outcome
receipt
```

這是依 Hermes 設計整理的最小觀察欄位，不是它公開的 wire schema。重點是每次 mutation 都能回答：由哪個 owner 接受、屬於哪一代執行、是否已開始，以及 retry 應拿回舊結果還是建立新工作。

## Queue 的 Edit 與 Steer 也是交易

看似單純的「修改排隊中的 prompt」，很容易製造 race condition。若 client 先 cancel，再 submit 新文字，中間可能剛好被 worker 取走原本的 row，結果是原 prompt 已開始，新 prompt 又被加入 queue。

[PR #140334](https://github.com/NousResearch/hermes-agent/pull/140334)因此把 queued prompt 的 `steer` 與 `replace` 做成 owner-side verbs，在 gateway 的 transaction 裡消耗原 admission：

- `prompt.steer_queued` 只有在目前 turn 已接管 Agent 後才接受；否則保持原 row 在 queue，不先假裝成功。
- `prompt.replace_queued` 在同一個 admission write 中取消舊 row 並建立 successor，retry 會沿用原本的 replacement identity。
- 若 steer 沒有真的送進 running turn，row 會回到原 FIFO 位置；已送達但 turn 中斷，則記成 interrupted，避免再次執行。

這個 PR 的 review 曾抓到「顯示 steered 但 Agent 沒收到」、「SQLite write 卡住 event loop」、「相同文字造成 transfer identity 混淆」等問題；修正後以 admission ID 而非文字內容追蹤 transfer，並補上對應測試。

這些紀錄是採用信號，但還不是完整 production 證明。PR 本身也列出 live Desktop retest pending，以及 queued-row Steer／Edit 仍限 Desktop 等已知限制。

## 對工程師與一般使用者有什麼用？

對使用者，最直接的改變是同一段對話可以在多個 surface 繼續，關閉 terminal 只會 detach，不必把正在跑的 turn 一起取消。Approval 與 clarification 也能在另一個已連線視窗回答。

對實作 Agent runtime 的工程師，這次 release 提供一組比「把 history 放進共用 DB」更完整的設計檢查：

1. Canonical session 是否只有一個 writer？
2. 所有 producer 是否進同一個 durable queue？
3. Client retry 是否帶穩定 identity，而非直接新增工作？
4. Owner crash 後，queued、started 與 completed 如何分流？
5. Approval、clarification 與 policy change 是否也有 revision 與 receipt？
6. UI 的 Edit／Steer 是否由 owner 原子處理，還是 client 拼接多個 writes？
7. Read-only viewer 是否可能意外啟動第二個 Agent？

如果答案依賴每個 client 自己「應該不會同時寫」，跨介面功能越多，競態越容易累積。

## 成熟度與採用風險

Hermes Agent 0.23 是正式 release，unified gateway PR 已合併並列出 CI、Docker、Nix 與多平台驗證；後續 queue control PR 也有數輪 review、失敗案例與 regression tests。這比只存在 roadmap 的架構提案成熟。

仍要保留三項風險：

- **Gateway 成為共同故障點。** Single writer 降低一致性問題，也把可用性、upgrade 與資料復原集中到同一服務。
- **Surface parity 尚未完全一致。** Release 涵蓋大量入口，但部分 controls 與 legacy 路徑仍有差異；不能只看「同一 session」就假設所有功能相同。
- **公開 Webapp 擴大攻擊面。** Webapp 預設關閉；若放到公開 URL，需要把 sign-in、network exposure、secret storage 與 gateway 權限一起審查。

因此，實際導入時可以先用測試 profile，從兩個 clients 同時提交、斷線、restart 與 retry 開始；觀察 queue、receipt 與 external side effects 是否一致，再接 bot、cron 或公開 Webapp。

## 與既有文章的差異

先前的 Harness 文章討論 Planning、Tools 與 Context 如何影響成功率；MemHub 文章關心跨工具記憶的匯入、撤權與刪除；Agent monitoring 文章處理 compaction 後的監控覆蓋。

Hermes 0.23 補的是另一個 runtime 問題：**多個入口同時操作同一段 live session 時，如何維持唯一寫入者、順序與可復原的執行狀態。**

這也是今天值得寫成文章的原因。它沒有提出新的 Agent protocol，卻把多介面產品最容易被 UI 掩蓋的一致性問題，整理成可以檢查的 ownership contract。

## References

- [Hermes Agent v0.23.0 — The Hearth Release](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0)
- [PR #106742：Unified gateway runtime](https://github.com/NousResearch/hermes-agent/pull/106742)
- [PR #140334：Steer and edit a canonical queued prompt](https://github.com/NousResearch/hermes-agent/pull/140334)
