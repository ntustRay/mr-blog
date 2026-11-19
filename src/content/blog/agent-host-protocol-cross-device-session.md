---
title: "[News] Agent Host Protocol 1.1：同一個 Agent Session 如何跨 IDE、手機與 App？"
description: "GitHub 公開 AHP 的實作經驗，讓多個 client 共享 Agent session。整理 host state、action sequencing、斷線重播、ACP 分工與導入驗收。"
pubDate: 2026-11-19
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - Protocol
draft: false
references:
  - title: "GitHub：Building the Agent Host Protocol for sessions that continue across devices"
    url: "https://github.blog/engineering/engineering-principles/building-the-agent-host-protocol-for-sessions-that-continue-across-devices/"
  - title: "Agent Host Protocol v1.1 specification"
    url: "https://microsoft.github.io/agent-host-protocol/specification/overview"
  - title: "Agent Host Protocol：Write-Ahead Reconciliation"
    url: "https://microsoft.github.io/agent-host-protocol/guide/reconciliation"
  - title: "Agent Host Protocol：AHP and ACP"
    url: "https://microsoft.github.io/agent-host-protocol/guide/ahp-and-acp.html"
  - title: "microsoft/agent-host-protocol"
    url: "https://github.com/microsoft/agent-host-protocol"
  - title: "microsoft/agent-host-protocol-contrib"
    url: "https://github.com/microsoft/agent-host-protocol-contrib"
relatedPostIds:
  - hermes-agent-unified-session-gateway
  - android-studio-rabbit-2-acp
  - agent-native-shared-actions-ui-state
---

Agent 在 VS Code 跑到一半，離開電腦後能不能從手機核准 tool call，回到桌面再繼續看同一份 diff？這個問題需要同步的不只是聊天文字，還有 session、執行進度、待核准操作、terminal 與每個 client 尚未確認的動作。

GitHub 在 **2026 年 11 月 17 日**公開 Agent Host Protocol（AHP）的工程實作經驗。AHP 將這類多介面協作收斂成一個開放協定：Agent host 保存權威狀態，多個 client 訂閱同一個 session，所有 mutation 由 host 排序，再透過 action stream 讓各端收斂。

本文依 GitHub 工程文章、AHP v1.1 文件、公開 repository 與 samples 整理，查核日期為 2026-11-19。沒有自行啟動 AHP host，也沒有測試跨裝置延遲、斷線恢復或第三方相容性。

## 這篇的重點

- AHP 解決的是「多個 client 如何操作同一組 Agent sessions」，不規定模型、Agent loop 或 tool schema。
- Client 可以先樂觀套用自己的 action；host 回傳排序後的 action envelope，再確認、重排或拒絕本機尚未確認的操作。
- 斷線重連時，host 會依 `lastSeenServerSeq` 重播缺少的 actions；若超出 replay buffer，改送最新 snapshot。
- GitHub 表示 AHP 已用於 VS Code 與 GitHub 的多個介面，並有 TypeScript 與 Rust 兩套 host 實作。自訂 host 連線仍放在 experimental 入口，獨立 production 驗證也有限。

## 關掉視窗後，session 為什麼不該一起消失？

傳統 IDE extension 常把 Agent harness 與視窗生命週期綁在一起。視窗關閉、IDE 更新或 remote environment 改變時，extension process 跟著消失；手機 App、桌面 App 與 editor 又各自做一套 cloud-agent integration。

[GitHub 的工程文章](https://github.blog/engineering/engineering-principles/building-the-agent-host-protocol-for-sessions-that-continue-across-devices/)把這個問題描述成 N 個 clients 對 M 個 hosts 的整合。若每個 client 都直接接每一種 Agent，session 定義、權限畫面、重連與狀態格式會在每個產品重做一次。

AHP 把 session 移到獨立 host。Client 只呈現與操作 host 公布的狀態；VS Code、手機或自製控制台斷線，不等於 Agent turn 必須停止。這個設計同時改變責任邊界：client 不再是 session 的唯一 owner，host 才是狀態仲裁者。

## AHP 同步的是 state，不只 transcript

[AHP v1.1 specification](https://microsoft.github.io/agent-host-protocol/specification/overview)以 URI 識別 channels。所有 server 都要實作 root、session 與 chat；terminal、automation、MCP 與 telemetry 等能力則可選擇支援並在連線時協商。

| Channel | 主要狀態 | 跨 client 時要避免的錯誤 |
| --- | --- | --- |
| Root | 可用 agents、sessions 與 host 設定 | A 端看到已刪除的 session，仍送出操作 |
| Session | chats、active clients、changesets 與整體狀態 | 不同介面各自認為自己擁有 session |
| Chat | turns、streaming、tool calls、待回覆輸入 | 同一個 tool call 被核准兩次 |
| Terminal（optional） | PTY output、claim 與控制權 | 兩個 client 同時輸入互相覆蓋 |

Host 會替 actions 加上遞增的 `serverSeq`，套用到權威 state，再廣播給訂閱的 clients。這讓每一端能回答「我最後確認到哪一個 action」，而非用時間戳猜測訊息先後。

這不代表 AHP 自動提供 durable execution 或 exactly-once side effect。Protocol 能排序與拒絕 state mutation；Agent 實際建立 PR、寫 database 或傳送訊息時，仍需要 host／tool runtime 的 idempotency、receipt 與復原策略。

## 斷線重播如何避免 UI 自己猜？

[Write-Ahead Reconciliation 文件](https://microsoft.github.io/agent-host-protocol/guide/reconciliation)把 client state 分成三份：

- `confirmedState`：host 已確認的狀態；
- `pendingActions`：client 已送出、尚未收到 host echo 的 actions；
- `optimisticState`：將 pending actions 重套在 confirmed state 上，供 UI 立即顯示。

Client A 送出訊息後，可以先在畫面上顯示 pending 狀態。Host 收到後排序並廣播：若 echo 回來的是 A 自己的 action，A 將它從 pending 移入 confirmed；若先收到 Client B 或 host 的 action，A 先更新 confirmed，再把尚未確認的 actions rebase；被拒絕的 action 則撤銷樂觀結果。

網路中斷時，client 以 `lastSeenServerSeq` 與 subscriptions 重連。Gap 還在 buffer 內，host 按順序回傳漏掉的 envelopes；太久以前的資料已不能重播，就改送 fresh snapshot。兩種情況都由 host 提供恢復基準，client 不必把本機畫面直接當真。

這套機制適合 chat 常見的 append-only actions，但仍要測真正的衝突。例如兩支手機同時核准一個 tool call，文件規定第一個成功，後續確認由 host 拒絕。UI 必須顯示拒絕結果，不能因為曾經樂觀更新就一直顯示「已核准」。

## AHP、ACP 與 MCP 不在同一個位置

AHP 文件直接說明它與 Agent Client Protocol（ACP）的分工：ACP 是單一 client 與單一 Agent 的 point-to-point protocol；AHP 在 host 上方協調多個 clients。

| 協定 | 主要連接 | 核心責任 |
| --- | --- | --- |
| AHP | 多個 UI clients ↔ Agent host | shared state、action sequencing、subscriptions、reconnect／replay |
| ACP | Client／host ↔ Coding Agent | prompt、streaming updates、tool calls、permission flow |
| MCP | Agent／host ↔ Tools／Resources | tool discovery、schema、resource 與呼叫 transport |

一個 AHP host 可以在下游用 ACP 連 Agent，再把 `session/update` 轉成 AHP actions 廣播；也可以直接整合特定 Agent。AHP 不要求一定要使用 ACP，更不負責 Agent-to-Agent communication。

這個區分有實務價值：如果只有一個 IDE 操作一個 Agent，ACP 已能解決主要整合問題；只有在手機、桌面、editor 或自製 dashboard 必須共同操作同一 session 時，才需要 AHP 這層協調。不要為了湊齊 protocol stack 增加沒有用到的 host。

## 目前成熟到哪裡？

AHP 已超過只有 schema 的提案階段。GitHub 表示目前有五種 clients 與兩套不同語言的 hosts 使用同一協定；VS Code host 以 TypeScript 實作，GitHub host 以 Rust 實作。官方 repository 也提供 Rust、TypeScript、Kotlin、Go、Swift 與 .NET client libraries，以及 conformance fixtures。

公開 repository 另外列出 pi、ACP gateway、web client 與多通訊平台整合等第三方實作。這些是生態活動訊號，不能當成全部已通過 production 驗證。

採用時仍要保留幾項限制：

- GitHub 的 Copilot App 與 VS Code 雖可連自訂 AHP host，相關 Direct Connections／Remote Agent Host 入口仍帶有 experimental 性質。
- Optional channels 需要 capability negotiation；兩端都標示 AHP-compatible，不代表 terminal、automation、MCP 或 telemetry 都能互通。
- AHP 同步 approval 的呈現與結果，實際 command、filesystem 與 credential 邊界仍由 host 和 Agent runtime 強制執行。
- Protocol 有 authentication 流程，但部署者仍要決定 host 是否可從外網連入、session 如何隔離，以及 client 能訂閱哪些資源。

## 用兩個 clients 做最小驗收

官方提供約 800 行 Rust 的 minimal chat host sample，也能用 `code agent host` 啟動 VS Code 的 standalone host。若要評估 AHP，不必先整合所有 channels；可以從一個 host、兩個 clients 與一段 chat 開始。

至少驗證以下路徑：

1. Client A 建立 turn，Client B 是否依相同 `serverSeq` 看見 streaming 與 tool call？
2. A 在送出 action 後斷線，B 繼續操作；A 重連後是否靠 replay 或 snapshot 收斂？
3. A、B 同時核准或取消同一個操作，失敗的一端是否收到明確 rejection？
4. Client 超過 replay buffer 才回來時，snapshot 是否包含足夠狀態，且不會重送已執行的副作用？
5. Host process 重啟後哪些資料仍存在？這要另外測，不能從網路 reconnect 成功推論持久化也安全。
6. 不支援 terminal 或 automation 的 client，是否會依 negotiated capabilities 隱藏功能，而非送出無效 request？

記錄 action 順序、rejection、重播範圍、snapshot fallback 與外部副作用，才能判斷 protocol integration 是否真的可恢復。本文沒有執行這些測試，清單是依 spec 整理的建議驗證方式。

## 與既有文章的差異

先前的 [Hermes Agent 0.23](../hermes-agent-unified-session-gateway/)文章處理 runtime 內的 single writer、durable queue、receipt 與 `unknown` recovery；[Android Studio Rabbit 2](../android-studio-rabbit-2-acp/)文章則說明 IDE 如何透過 ACP 接不同 Coding Agents。

AHP 補的是兩者之間尚未標準化的多 client coordination：同一個 session 如何被多種 UI 訂閱、樂觀更新、排序、拒絕與斷線恢復。它沒有取代 Hermes 的 durable execution 設計，也沒有取代 ACP 的 Agent 介面。

對只在單一 terminal 使用 Agent 的工程師，現在沒有導入 AHP 的必要。若產品正在增加手機核准、遠端監看、桌面 App 或團隊 dashboard，AHP 已值得做一個受控 PoC；評估重點應放在衝突與恢復路徑，而非只確認兩個畫面都能顯示同一段聊天。

## References

- [GitHub：Building the Agent Host Protocol for sessions that continue across devices](https://github.blog/engineering/engineering-principles/building-the-agent-host-protocol-for-sessions-that-continue-across-devices/)
- [Agent Host Protocol v1.1 specification](https://microsoft.github.io/agent-host-protocol/specification/overview)
- [Write-Ahead Reconciliation](https://microsoft.github.io/agent-host-protocol/guide/reconciliation)
- [AHP and ACP](https://microsoft.github.io/agent-host-protocol/guide/ahp-and-acp.html)
- [microsoft/agent-host-protocol](https://github.com/microsoft/agent-host-protocol)
- [AHP samples and supporting tools](https://github.com/microsoft/agent-host-protocol-contrib)
