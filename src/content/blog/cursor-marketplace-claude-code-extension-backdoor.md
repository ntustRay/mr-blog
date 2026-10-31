---
title: "[News] Cursor Marketplace 的 Claude Code Extension 遭植入後門：解除安裝還不夠"
description: "Cursor 確認兩個 Claude Code Extension 版本遭植入惡意程式。整理受影響範圍、持久化風險、官方處置，以及 Coding Agent 供應鏈該補上的防線。"
pubDate: 2026-10-31
category: AI
tags:
  - AI Agents
  - Coding Agents
  - Security
draft: false
references:
  - title: "Cursor：Claude Code extension security notice"
    url: "https://cursor.com/blog/claude-code-extension-security-notice"
  - title: "Phorion：Technical analysis of the malicious Claude Code extension"
    url: "https://phorion.io/blog/offical-claude-code-vsx-compromise/"
  - title: "Hacker News：Claude Code extension security notice discussion"
    url: "https://news.ycombinator.com/item?id=50300683"
relatedPostIds:
  - nvidia-openshell-agent-security-boundary
  - paperclip-skills-versioned-snapshots
  - android-studio-rabbit-2-acp
---

如果你在 Cursor Marketplace 的暴露時段安裝或更新過 Claude Code Extension，單純解除安裝還不夠。Cursor 在 **2026 年 10 月 29 日**確認，Marketplace 上的 `Anthropic.claude-code` 2.1.312 與 2.1.313 遭植入惡意程式。程式碼會嘗試加入 SSH 金鑰、建立持久化機制並啟動 reverse SSH tunnel；Extension 被移除後，已寫入主機的檔案與啟動項目仍可能繼續運作。

這起事件值得 Agent 工程團隊注意，因為攻擊入口不在模型、prompt 或 tool call，而在大家通常視為「開發工具更新」的 Extension 供應鏈。Agent 的 shell 就算有 sandbox，也不代表載入它的 IDE Extension 同樣被隔離。

本文依 Cursor 官方公告與獨立技術分析整理，沒有在受影響電腦上執行鑑識，也不提供個別環境已安全的判定。

## 這篇的重點

- 官方確認的範圍是 Cursor Marketplace 上的兩個 Claude Code Extension 版本，受影響平台為 macOS 與 Windows；這些套件不是 Anthropic 製作的官方版本。
- 惡意程式以 IDE 使用者權限執行。部分需要系統管理員權限的 SSH 設定可能失敗，不代表主機沒有留下 SSH 金鑰、持久化檔案或連線程序。
- 已安裝者應把它當成主機入侵事件處理：確認版本與時間、隔離可疑主機、保存紀錄、移除持久化項目，再從乾淨裝置輪替憑證與 session。
- Marketplace 的品牌名稱、版本號或「Made by」標示不足以證明 artifact 來自原廠。正式環境需要 publisher identity、簽章、雜湊與安裝來源的組合驗證。

## 先把影響範圍切清楚

Cursor 公告列出的 Marketplace 暴露時段是美西時間 10 月 29 日 02:27–13:35，換算台灣時間約為 **10 月 29 日 17:27 至 10 月 30 日 04:35**。官方確認受影響的是 macOS 與 Windows 上的以下兩個版本：

- `Anthropic.claude-code` 2.1.312
- `Anthropic.claude-code` 2.1.313

目前可驗證的邊界如下：

| 發布來源或平台 | 目前證據 | 判讀 |
| --- | --- | --- |
| Cursor Marketplace 的 2.1.312／2.1.313，macOS／Windows | Cursor 官方確認遭植入惡意程式 | 受影響 |
| Anthropic 官方發布管道 | Cursor 表示惡意版本不是 Anthropic 開發，官方版本未發現受影響 | 不在這次已知範圍 |
| VS Code Marketplace、Open VSX | Anthropic 員工在公開討論中表示未受影響 | 目前沒有遭竄改的證據 |
| Cursor Marketplace 的其他 Extension | Cursor 表示稽核後未發現其他套件遭竄改 | 仍應等待完整事後報告 |

這個切分很重要。事件牽涉 Claude Code 品牌，卻不等於 Anthropic 的 Claude Code 儲存庫、官方安裝程式或其他 Marketplace 全部遭入侵。反過來說，看到 Extension 顯示 Anthropic 名稱，也不能推定它就是官方簽出的 artifact。

Cursor 公告尚未說明攻擊者如何取得 Marketplace 發布能力，也沒有公布完整的 root-cause analysis 或 artifact signing 改進。這些空白在後續報告出現前，都不該用推測補上。

## 為什麼解除安裝不夠

獨立分析顯示，惡意 JavaScript 被加在 Extension bundle 前段，Extension 載入時就會執行，不需要先讓使用者在對話框下指令。它會收集主機名稱、使用者名稱、環境變數名稱、工作目錄、Git email 與公開 IP，接著嘗試：

1. 將攻擊者的 SSH public key 加入使用者設定。
2. 開啟或調整 SSH 相關設定。
3. 在 macOS 建立 LaunchAgent，或在 Windows 建立排程工作與啟動項目。
4. 啟動 reverse SSH tunnel，讓外部主機取得回連通道。

其中部分開啟 SSH 的步驟因權限不足或程式錯誤而可能失敗，但 Extension 仍能以目前使用者權限寫入檔案、建立部分持久化項目並對外連線。判斷風險時不能只問「它有沒有拿到 root／Administrator」，還要檢查使用者層級的 SSH key、LaunchAgent、排程工作、啟動資料夾與常駐程序。

解除安裝只會移除 Extension 本體。已經寫到其他路徑的檔案、金鑰與啟動設定不會因此自動消失，這也是 Cursor 官方處置文件特別要求另外執行偵測與清除步驟的原因。

## 已安裝者的處置順序

Cursor 已在公告提供 macOS 與 Windows 的驗證、清除腳本、檔案路徑、程序名稱、SSH key fingerprint 與網路 Indicators of Compromise。指標可能持續更新，實際處置應以官方頁面為準，不要只複製新聞中的舊清單。

建議順序是：

1. **確認暴露**：核對安裝來源、版本、安裝／更新時間與平台。找不到版本資訊時，也應檢查官方列出的主機指標。
2. **先隔離再清理**：若偵測到可疑程序、SSH key 或持久化項目，先中斷主機對外連線並保存 EDR、DNS、proxy、程序與檔案紀錄。
3. **執行官方清除程序**：移除惡意 SSH key、持久化項目、tunnel 與落地檔案；完成後重新驗證，而非只看腳本回傳成功。
4. **從乾淨裝置輪替秘密**：重設該主機可讀到的 API key、Git／雲端憑證、SSH key、瀏覽器 session 與其他長效 token。只改 `.env` 內容不足以撤銷既有 session。
5. **判斷是否重建主機**：如果看到成功回連、未知登入、權限提升或無法解釋的持久化項目，重灌／重建通常比嘗試證明「所有東西都刪乾淨」可靠。

這需要採用主機入侵事件的應變方式。若電腦存放公司或客戶憑證，應交由資安或 IT 團隊依既有 incident response 流程處理，並保留可能需要通報或鑑識的證據。

## Coding Agent 供應鏈要補哪幾層

這次事件把四個容易混在一起的信任訊號拆開了：

| 信任訊號 | 它能證明什麼 | 它不能單獨證明什麼 |
| --- | --- | --- |
| 套件名稱／品牌標示 | 使用者看到的識別名稱 | 實際 publisher 身分與 artifact 來源 |
| Marketplace 帳號 | 平台接受某個 publisher 發布 | 帳號沒有被接管、上傳內容沒有被替換 |
| 版本號 | 更新排序與相依條件 | 同版本在不同管道一定是相同 bytes |
| 雜湊／簽章 | 指定 artifact 的完整性與簽署者 | 執行時權限合理、程式本身沒有惡意邏輯 |

團隊若允許 Coding Agent 或 IDE Extension 接觸 production credentials，至少可以先做這幾件事：

- 由組織管理 Extension allowlist，記錄允許的 Marketplace、publisher、package ID 與版本。
- 對下載的 VSIX 或安裝包保留雜湊；高風險工具優先使用可驗證簽章或內部 mirror。
- 把 IDE Extension 視為能以開發者權限執行的程式，而不是單純 UI 外掛。
- 監控 `authorized_keys`、LaunchAgent、Windows 排程工作、啟動資料夾與異常 SSH outbound traffic。
- 將 Coding Agent 放在 devcontainer、VM 或獨立開發環境，並避免讓 IDE process 繼承不必要的 production secret。
- 保留 Extension inventory 與安裝時間，讓事件發生時能回答哪些電腦、哪些版本曾在暴露窗口內執行。

最後一點很實際：Agent sandbox 通常約束的是 Agent 啟動的 shell、filesystem 或 network action；這次惡意程式則由 IDE Extension host 載入。若兩者不在同一個安全邊界，前者的限制不會自動保護後者。

## 現在適合恢復自動更新嗎？

Cursor 已移除惡意版本、暫停並重建 Marketplace、輪替相關金鑰，也表示已關閉攻擊者的 command-and-control server。這些是必要的止血措施，但公開資訊仍缺少最初入侵路徑、publisher 驗證、artifact signing 與偵測延遲的完整說明。

對沒有安裝受影響版本的個人使用者，可以先確認安裝來源與版本，再依官方最新公告決定是否恢復更新。對有高價值憑證、客戶程式碼或 production 權限的團隊，較穩妥的做法是暫停第三方 Marketplace 的自動更新，改由管理者審核來源與 artifact，直到供應鏈控制與事後報告更清楚。

這起事件的工程教訓很直接：Coding Agent 的安全審查不能只看模型能呼叫哪些工具。IDE Extension、安裝管道、publisher identity、持久化偵測與憑證輪替，都是同一條攻擊路徑的一部分。
