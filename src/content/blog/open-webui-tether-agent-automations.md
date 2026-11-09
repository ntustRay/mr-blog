---
title: "[News] Open WebUI 0.13.3：排程 Coding Agent 連上你的電腦，權限邊界在哪？"
description: "Open WebUI 0.13.1 到 0.13.3 把 Coding Agent、Tether 個人電腦連線與排程串在一起。整理 Open Terminal 的完整權限、Tether session、工作資料夾與多使用者隔離的實際邊界。"
pubDate: 2026-11-09
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - Security
  - Harness
draft: false
references:
  - title: "Open WebUI v0.13.1 release"
    url: "https://github.com/open-webui/open-webui/releases/tag/v0.13.1"
  - title: "Open WebUI v0.13.3 release"
    url: "https://github.com/open-webui/open-webui/releases/tag/v0.13.3"
  - title: "Open WebUI Tether documentation"
    url: "https://docs.openwebui.com/ecosystem/tether/"
  - title: "Open WebUI Coding Agents documentation"
    url: "https://docs.openwebui.com/features/open-terminal/coding-agents/"
  - title: "Open Terminal security policy"
    url: "https://github.com/open-webui/open-terminal/blob/main/SECURITY.md"
  - title: "Tether changelog"
    url: "https://github.com/open-webui/tether/blob/main/CHANGELOG.md"
relatedPostIds:
  - nvidia-openshell-agent-security-boundary
  - cloudflare-browser-agent-internal-hosts
  - hermes-agent-unified-session-gateway
---

Coding Agent 原本要在 terminal 裡啟動，使用者也通常在旁邊看著。當同一個 Agent 能從手機下指令，還能依排程在個人電腦的 repository 執行，安全問題會從「這次 tool call 要不要批准」擴大成「哪個服務長期持有這台電腦的操作權」。

Open WebUI 在台灣時間 **2026 年 11 月 8 日 19:07**發布 [v0.13.1](https://github.com/open-webui/open-webui/releases/tag/v0.13.1)，讓 Claude Code、Codex、Pi 等 Coding Agent 出現在 model picker，並推出桌面 companion app Tether。隔天 **11 月 9 日 07:48**發布的 [v0.13.3](https://github.com/open-webui/open-webui/releases/tag/v0.13.3)再把 Coding Agent 接進 Automations：排程會保存 terminal 與 working folder，啟動前確認 terminal 與 agent 仍可用，結果回到 chat。

本文依 Open WebUI 0.13.1／0.13.3、Tether 0.1.11、Open Terminal 0.17.6 的官方 release、文件與 security policy 整理，沒有安裝這套環境，也沒有執行排程或權限測試。

## 這篇的重點

Open WebUI 已經把「遠端對話介面」「本機 Coding Agent」與「排程」接成可用產品路徑；真正的安全邊界仍在 Open Terminal 所在的 OS 使用者、container／VM、network policy 與 credentials。

Working folder 只決定從哪裡開始工作，不能限制 command 能讀哪些路徑。Open Terminal 官方也明確把 API key 定義成完整權限 credential：持有者能執行命令、讀寫服務可碰到的檔案，並使用全部 endpoints。

因此，這個版本適合用獨立 OS account、container 或 VM 做 PoC；不適合直接把日常登入帳號、主要瀏覽器 session 與長效 production credentials 交給無人值守排程。

## 從 model picker 到排程，執行路徑多了什麼？

這套流程可以拆成五段：

| 層次 | 主要責任 | 需要回答的問題 |
| --- | --- | --- |
| Open WebUI | 使用者登入、chat、automation 與 approval UI | 哪個帳號能建立或修改排程？ |
| Tether | 從個人電腦向 Open WebUI 建立連線 | 哪個 WebUI session 能看到這台電腦？ |
| Open Terminal | 接受 terminal、file、browser 與 agent 操作 | API key 與呼叫來源是否受保護？ |
| Coding Agent | 規劃、呼叫工具、修改 repository | 允許哪些 command、路徑與網路目的地？ |
| OS／container | 實際執行 process 與 filesystem access | 任務能否碰到其他專案、SSH key 或瀏覽器資料？ |

Tether 採用 outbound connection，個人電腦不必為遠端 WebUI 開 inbound port。依官方文件，每個 Tether 登入是獨立 session；access token 有效 15 分鐘，refresh token 每次 renewal 都會替換，session 預設在 90 天沒有使用後失效。

這些機制保護的是連線與 session lifecycle。它們不會縮小 Open Terminal 啟動後可以使用的本機權限。

## Open Terminal 官方把哪些行為視為正常權限？

[Open Terminal security policy](https://github.com/open-webui/open-terminal/blob/main/SECURITY.md)把 trust model 寫得很直接：

- API key 是 single full-access credential。取得它的人可以執行任意 command、讀取服務可存取的檔案並呼叫所有 endpoints。
- \`X-User-Id\` 由上游 caller 宣告；Open Terminal 不自行驗證終端使用者。
- Bare-metal 安裝會以啟動服務的 OS 使用者身分執行，擁有該帳號原本可讀寫的檔案與網路能力。
- 預設 \`latest\` container image 內的使用者可以 passwordless \`sudo\`；若不需要，官方建議改用 \`slim\`、\`alpine\` 或 \`openshift\` image。
- \`OPEN_TERMINAL_MULTI_USER=true\` 會替使用者建立不同 Linux account 與 home directory，但所有人仍共用 kernel、process list、network stack 與 temporary directory。官方明確說它不適合當作 production multi-user isolation。

這些都不是隱藏漏洞，而是產品設計的權限範圍。部署時若把 Open Terminal 放在工程師日常帳號下，排程 Agent 也會繼承該帳號能碰到的 repository、設定檔與 credentials。

## 選了 Working Folder，仍然沒有路徑隔離

v0.13.3 讓 automation 記住 terminal 與 working folder，這有助於避免任務跑到錯的 repository，但不能把 folder picker 當成 filesystem policy。

Tether changelog 對類似設定有明確提醒：File browser 的起始資料夾只改變瀏覽位置，**不會限制 command 能存取哪些檔案或資料夾**。同樣地，shell 的 current working directory 只是起點；Agent 仍可使用 absolute path、\`..\` 或其他工具讀到 OS account 可存取的範圍。

若排程只該維護一個專案，比較清楚的做法是：

1. 以獨立 OS account、container 或 VM 執行 Open Terminal。
2. 只 mount 該 repository 與任務必要的 cache；不要 mount 整個 home directory 或 Docker socket。
3. 使用獨立 worktree／branch，並以 CI 驗收輸出。
4. 對外網路採 allowlist，credentials 綁定測試資源與最小權限。
5. 將 merge、deploy、傳送訊息或刪除資料留在另一個需要核准的步驟。

Folder 選擇可以降低操作錯誤，強制拒絕仍需要 runtime 或 OS 層的限制。

## Tether 的便利設定也會改變風險

Tether 0.1.8 之後，在支援的新版本 Open Terminal 上，預設使用 private local connection，不提供其他 app 可直接連入的 HTTP address。使用者可以手動開啟「Allow HTTP access」，選擇只綁本機或所有 network interfaces；官方 changelog 說明這條 direct connection 需要 API key，但**沒有加密**。

因此，若只是讓 Tether 連到 Open WebUI，沒有理由順手開啟 direct HTTP。真的需要其他本機工具呼叫時，也應優先限定 loopback；開到所有 interfaces 會讓完整 shell credential 出現在區域網路攻擊面。

另一個需要特別留意的選項是「Connect to running Chrome」。Tether 0.1.1 支援連到既有 Chrome，讓 browser tools 使用目前的網站登入狀態。這對個人工具很方便，也可能讓排程接觸日常帳號、cookie 與已登入的管理介面。無人值守任務較適合使用獨立 browser profile 與測試帳號。

## Tool approval 不能單獨承擔排程安全

Open WebUI 0.13.1 新增 \`Auto\` tool permission mode，預設關閉。啟用後，review model 會檢查 tool、arguments 與最近幾則訊息；無法評估、逾時或 context 太長時，才回到人工 approval。

這可以減少互動次數，但仍是模型判斷。排程可能在使用者不在線時啟動，release notes 也沒有充分說明 Agent 等待 approval、terminal 中斷或重連時，具副作用的 command 如何去重。PoC 應把以下情境實際跑過：

- 排程要求讀取 workspace 外的測試檔案，確認由 OS／container 拒絕。
- 相同 run 因斷線或重啟恢復時，不會重複 commit、push 或呼叫外部 API。
- 需要 approval 的 Agent 在無人回應時會停住，而非改走其他具同等效果的工具。
- Tether session 被撤銷後，既有 terminal 與 automation 不能繼續取得新工作。
- 切換 terminal 或 working folder 後，舊的 Files tab、agent selection 與執行目標不會混用。
- Agent 無法讀取未掛載的 SSH key、cloud config、browser profile 與其他專案。

這些是建議驗證項目，本文沒有宣稱它們已通過。

## 成熟度與採用判斷

Open WebUI v0.13.1 是正式 release，涵蓋 289 個 commits；主要能力可以追到多個 merged PR、獨立文件與後續修補。社群發布討論也有實際的相容性回報，例如部分 CLI 尚未被辨識、支援清單依 Open Terminal 版本而異。

風險同樣明顯。v0.13.1 發布後約 46 分鐘，v0.13.2 修補 plain HTTP 環境無法載入 chat；約 13 小時後的 v0.13.3 又補上 agent automations 與 terminal switching fixes。Tether 本身仍是 0.1.x，Open Terminal 是 0.17.x；Tether 只供個人非商業用途免費，商業或組織 production 使用需要 Enterprise License。

我的採用判斷是：**個人測試環境值得試，團隊 production 先不要把它當作安全隔離層。** 最合適的第一個案例，是每天在 disposable worktree 執行 read-only 檢查或測試，結果回到 chat，由工程師 review 後再合併。先驗證權限拒絕、斷線重試、approval 等待與 credential exposure，再考慮讓它修改長期分支或接正式系統。

## 與既有文章的差異

先前的 [NVIDIA OpenShell](../nvidia-openshell-agent-security-boundary/) 文章處理通用 Agent runtime 如何強制 filesystem、process、network 與 credential policy；[Cloudflare Browser Agent](../cloudflare-browser-agent-internal-hosts/) 關心 browser 如何進入未公開的 preview；[Hermes Agent](../hermes-agent-unified-session-gateway/) 則分析多個 client 共用 session 時的 single writer 與 recovery。

本篇聚焦另一個具體問題：**當排程從遠端 WebUI 觸發 Coding Agent，在個人電腦上長期執行時，哪些 UI 設定只是方便選擇，哪些層次才真的能拒絕操作。**

## References

- [Open WebUI v0.13.1 release](https://github.com/open-webui/open-webui/releases/tag/v0.13.1)
- [Open WebUI v0.13.3 release](https://github.com/open-webui/open-webui/releases/tag/v0.13.3)
- [Open WebUI Tether documentation](https://docs.openwebui.com/ecosystem/tether/)
- [Open WebUI Coding Agents documentation](https://docs.openwebui.com/features/open-terminal/coding-agents/)
- [Open Terminal security policy](https://github.com/open-webui/open-terminal/blob/main/SECURITY.md)
- [Tether changelog](https://github.com/open-webui/tether/blob/main/CHANGELOG.md)
