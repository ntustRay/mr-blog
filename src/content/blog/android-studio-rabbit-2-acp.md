---
title: "[News] Android Studio Rabbit 2 開放 40+ Coding Agents：ACP 解耦了什麼？"
description: "Android Studio Rabbit 2 將 BYOA 推進 stable，讓 Codex、Claude Agent 等透過 ACP 取得 IDE 工具。整理 Client／Agent 責任、MCP 差異、權限邊界與導入驗收。"
pubDate: 2026-10-30
category: AI
tags:
  - AI Agents
  - Coding Agents
  - ACP
draft: false
references:
  - title: "Android Developers：Your favorite agents are now integrated in Android Studio"
    url: "https://developer.android.com/blog/posts/ai-agents-android-studio-integration"
  - title: "Android Studio Rabbit 2 release notes"
    url: "https://developer.android.com/studio/releases"
  - title: "Android Developers：Android Dev Summit 2026 developer tools and performance"
    url: "https://developer.android.com/blog/posts/android-dev-summit-26-developer-tools-performance"
  - title: "Agent Client Protocol：Introduction"
    url: "https://agentclientprotocol.com/get-started/introduction"
  - title: "Agent Client Protocol v1：Overview"
    url: "https://agentclientprotocol.com/protocol/v1/overview"
  - title: "Agent Client Protocol v1：Security Considerations"
    url: "https://agentclientprotocol.com/protocol/v1/security"
  - title: "Android Studio Rabbit 2 closed issues"
    url: "https://developer.android.com/studio/releases/fixed-bugs/studio/2026.2.2"
relatedPostIds:
  - coding-agent-harness-176-configurations
  - agent-native-shared-actions-ui-state
  - production-mcp-registry-gateway-identity-policy
---

Coding Agent 換了一個，為什麼 IDE 整合常常也得重做？原因通常不在模型 API，而在 session、diff、terminal、權限詢問、專案結構與執行進度沒有共同介面。

Google 在 **2026 年 10 月 28 日**發布 stable channel 的 Android Studio Rabbit 2（2026.2.2），把 Bring Your Own Agent（BYOA）從 9 月的 Canary preview 推進正式版本。官方表示可以在 Android Studio 內選擇超過 40 個 ACP-compatible agents，包括 Claude Agent、OpenAI Codex、Junie 與 Google Antigravity，並讓它們使用 build diagnostics、Logcat、Android Emulator 與 Android Skills。

這個 release 值得看的重點，不只是 IDE 多了幾個 Agent 選項。它是 Agent Client Protocol（ACP）進入主流 IDE stable channel 的實際案例，也把一個重要邊界攤開來：**ACP 能減少 IDE 與 Agent 的客製接線，但不會替 Host 完成 sandbox、供應鏈信任或資料治理。**

本文依 Android Studio 與 ACP 官方文件整理，沒有安裝 Rabbit 2，也沒有實測不同 Agent 的速度、token 用量或 Android 任務完成率。

## 這篇的重點

- ACP 標準化 IDE／Client 與 Coding Agent 之間的 session、進度、tool call、diff、權限詢問與環境操作；它處理的層級和 MCP 不同。
- Android Studio 的 BYOA 已進 stable，但 ACP 的 remote agent 支援仍在進行中，v2 也仍是 Draft。產品 stable 不等於整個 protocol 生態已完全成熟。
- ACP 本身不會 sandbox Agent。正式導入時，要分別驗證 IDE 代執行的 filesystem／terminal 操作，以及 Agent process 自己擁有的權限。

## Android Studio 這次真正開放的是 IDE 能力

[Android Studio 官方公告](https://developer.android.com/blog/posts/ai-agents-android-studio-integration)列出的 BYOA 能力，不只是一個聊天視窗。ACP Agent 可以取得 Android Studio 對專案的理解，並使用 build system、Logcat、Emulator 等工具；IDE 也加入 Skills Manager，讓使用者管理 XML Views 遷移到 Jetpack Compose、AGP 升級與 CameraX 等工作流程。

這種整合比把 terminal Agent 嵌進側欄更有工程價值。Gradle 診斷、symbol resolution、Compose Preview 與 Emulator 狀態本來就存在 IDE 內，Agent 若能透過結構化介面取得它們，可以少做一次 log scraping 或畫面轉譯。

Google 表示這能降低 token 用量並加快執行，但目前公開頁面沒有提供 BYOA stable release 的可重現 benchmark、任務集或逐 Agent 結果。這應視為供應商的產品主張；團隊仍要用自己的 Android 專案比較完成率、耗時、token 與人工修正量。

## ACP 和 MCP 接的是不同邊界

兩個 protocol 名稱很接近，責任卻不相同：

| Protocol | 主要連接 | 它標準化的內容 | 不負責的事 |
| --- | --- | --- | --- |
| ACP | IDE／Client ↔ Coding Agent | session、prompt、進度、plan、tool call、diff、permission request、filesystem／terminal 介面 | 模型能力、Agent 內部 loop、OS sandbox、業務授權 |
| MCP | Agent／Host ↔ Tools／Resources | tool discovery、schema、resource、prompt 與 transport | IDE 的 Agent UX、編輯器 session、完整 Coding Agent lifecycle |

一個 Coding Agent 可以同時使用兩者：Android Studio 透過 ACP 與 Agent 溝通，Agent 再透過 MCP 使用外部服務。ACP 解決「這個 Agent 怎麼進 IDE」；MCP 解決「Agent 怎麼接工具與資料」。

[ACP v1 overview](https://agentclientprotocol.com/protocol/v1/overview)把責任分成兩側。Agent 接收 prompt、回傳 session updates，內容可包含訊息、tool calls、plan、commands 與 context compaction；Client 管理使用者介面與環境，並可提供 filesystem、terminal 和 permission request 等方法。

這個分工也解釋了互通性的上限。兩個 Agent 都支援 ACP，不代表它們有相同的規劃策略、context 管理、工具政策或模型品質；它只讓 IDE 不必為每一個 Agent 重新設計整套傳輸與 UI contract。

## Permission prompt 不是完整安全邊界

[ACP 的 security considerations](https://agentclientprotocol.com/protocol/v1/security)寫得很直接：Agent 會拿到其 process 原本擁有的權限，ACP 本身不提供 sandbox。Permission request 也是 advisory；Agent 必須自行遵守使用者的選擇。只有由 Client 代為執行的 filesystem 與 terminal 方法，Client 才能在自己的執行路徑強制限制。

因此至少要分開檢查兩條路徑：

| 路徑 | 誰執行 | 驗收重點 |
| --- | --- | --- |
| ACP Client method | Android Studio 讀寫檔案、建立 terminal | workspace root、命令顯示、拒絕後是否真的不執行 |
| Agent 自有能力 | Agent process 自行讀檔、跑命令或呼叫網路 | process 權限、sandbox、credential 與 network policy |

如果 Agent process 本來就能直接執行 shell，它不必經過 Client method 才能改檔。看到 IDE 跳出一次 permission prompt，不能推論所有操作都被同一個閘門攔住。

Client 還要把 Agent 產生的文字、URI、路徑與 Markdown 當成不可信輸入。ACP 文件特別提醒，不應自動執行 Agent 內容中的 script、開啟連結或抓取 private-network URI，也應處理 terminal control sequence 與隱藏字元。這些是 Host 實作責任，protocol 只提供契約與安全指引。

## Stable integration 仍有三個成熟度限制

第一，Rabbit 2 的 BYOA 已經是 Android Studio stable 功能，但 [ACP 官方文件](https://agentclientprotocol.com/get-started/introduction)仍標示 remote agent 的完整支援正在開發，v1 是目前版本，v2 為 Draft。若團隊依賴雲端 Agent、session roaming 或自訂 proxy，不能只用本機 stdio 整合成功就判定整條路徑成熟。

第二，Agent registry 也是供應鏈的一部分。Android Studio 在 Rabbit 2 preview 期間曾修正一個實際問題：ACP registry pin 的 npm 版本尚未同步到 registry mirror 時，Agent 會以 `ETARGET` 無法啟動。這個問題已列入官方 fixed issues，不能當成 stable 版仍存在的 bug；它仍提醒我們，Agent 啟動依賴 registry metadata、套件發布與 mirror 同步，應有明確版本、完整性驗證與 fallback。

第三，「可以切換 Agent」不等於 session 能無損移交。ACP 定義 session load、plan、tool updates 與 compaction 等能力，但支援與語意仍透過 capability negotiation 決定。不同 Agent 的 memory、prompt、model-specific state 與 provider quota 不會因為使用同一個 protocol 自動一致。

## 導入前，用一個固定任務驗證 Host 與 Agent

Android 團隊不需要一次比較 40 個 Agent。先選一個可重現、會用到 IDE-native tools 的任務，例如：修正一個能由測試重現的 UI bug，並在 Emulator 驗證結果。

至少記錄以下項目：

1. **Context**：Agent 是否讀到正確 module、build variant、Gradle 診斷與目前裝置？
2. **Tool path**：它是透過 IDE 提供的結構工具，還是退回 shell 與 log scraping？
3. **Permission**：拒絕 workspace 外寫入、敏感 terminal command 與外部傳輸後，操作是否真的停止？
4. **Recovery**：取消、IDE 重啟、Agent process crash 後，session、diff 與未完成命令如何恢復？
5. **Switching**：換另一個 ACP Agent 時，哪些狀態能接續，哪些需要重新提供？
6. **Cost and quality**：在相同任務與驗收條件下，比較完成率、耗時、token／方案額度及人工修正量。

這組測試要同時保留成功與拒絕路徑。只看到 Agent 成功改完 code，還不足以證明權限、恢復與切換行為可用。

## 採用判斷

對已經用 Android Studio 開發、又想比較 Codex、Claude Agent 或其他 Coding Agent 的工程師，Rabbit 2 值得直接在測試專案做 PoC。它把 project graph、build diagnostics 與 Emulator 留在 IDE 端，能降低更換 Agent 時重做整合的成本。

若要成為團隊標準，成熟度應評為「IDE integration 已 stable，跨 Agent 行為仍需逐一驗證」。特別是 remote transport、Agent registry、permission semantics 與 session 移交，還不能只靠 ACP-compatible 這個標籤做採購或安全決策。

這次 release 最重要的訊號是：Coding Agent 開始像 language server 一樣，透過 protocol 進入 IDE 生態。LSP 讓編輯器和語言工具解耦，但沒有保證每個 language server 都安全或品質相同；ACP 現在也應該用同樣的工程標準看待。

