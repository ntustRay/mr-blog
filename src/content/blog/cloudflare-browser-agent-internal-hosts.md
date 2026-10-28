---
title: "[News] Cloudflare Agents：讓 Browser Agent 看內部預覽，不必公開 dev server"
description: "Cloudflare Agents SDK 0.31.0 加入 internal hostnames，讓 Browser Agent 經由 Worker 存取 dev server、workspace 與內部服務。整理實際安全邊界、升級影響與採用檢查。"
pubDate: 2026-10-28
category: AI
tags: [AI Agents, Security, Harness, Cloudflare]
draft: false
references:
  - title: "Cloudflare Agents SDK 0.31.0 release"
    url: "https://github.com/cloudflare/agents/releases/tag/agents%400.31.0"
  - title: "Cloudflare Agents：Browser 文件"
    url: "https://github.com/cloudflare/agents/blob/agents%400.31.0/docs/agents/browse-the-web.md"
  - title: "Cloudflare Agents PR #2673：Internal hostnames"
    url: "https://github.com/cloudflare/agents/pull/2673"
  - title: "Cloudflare Agents PR #2667：BrowserSession runtime"
    url: "https://github.com/cloudflare/agents/pull/2667"
relatedPostIds:
  - agent-native-shared-actions-ui-state
  - nvidia-openshell-agent-security-boundary
  - gpt-6-1-terra-computer-use-cost
---

Coding Agent 改完網站後，下一步通常是打開 browser 驗證畫面與互動。麻煩在於 dev server 可能只存在 sandbox 或私有 workspace；為了讓遠端 browser 看得到它，把臨時服務開成公開 URL 又會多出存取控制與資料外洩風險。

Cloudflare 在 **2026 年 10 月 27 日**發布 [Agents SDK 0.31.0](https://github.com/cloudflare/agents/releases/tag/agents%400.31.0)，加入 Browser Run 的 `internalHosts`。Browser 可以使用 `preview.internal` 之類的名稱，經由 Agent 的 `fetch` handler 讀取 sandbox port、workspace folder、R2 內容或另一個 Worker，不必讓這些服務先出現在公開 Internet。

這篇依 release、合併 PR 與版本文件整理，沒有部署 Cloudflare Worker，也沒有執行 Browser Run 實測。

## 這篇的重點

`internalHosts` 解決的是 Browser Agent 如何連到內部預覽環境，不會自動完成授權與隔離。最值得採用的設計是：預覽服務維持私有、browser 的公開網路 allowlist 縮到必要範圍，具副作用的 internal host 另外驗證 `Origin`，並以測試帳號與可重建資料執行。

這個能力已進正式 release，也有合併的實作與測試；目前仍缺少獨立部署回報、成功率或成本比較。它比較適合進入受控 PoC，還不足以把 browser session 當成可信任的正式操作環境。

## Internal hostname 改變了哪一段路徑？

在 0.31.0 的設計裡，Browser Run 看到 `*.internal` request 時，不會照一般 DNS 路徑連到 Internet，而是回到 Agent 設定的 handler。Handler 再決定要回傳哪一份內容：

| Internal host | 可能的來源 | 工程用途 |
| --- | --- | --- |
| `preview.internal` | sandbox 內的指定 port | 打開 Agent 剛啟動的 dev server |
| `site.internal` | workspace 中的 build folder | 驗證靜態產物，不必保持 server 常駐 |
| `assets.internal` | R2 bucket | 檢查測試素材或產出檔案 |
| `api.internal` | Worker service binding | 讓前端預覽呼叫受控的測試 API |

固定 host 可以永遠指向同一個 handler。若設定 `target` schema，模型也能呼叫 `browser.assignHost()` 選擇特定 port 或 folder；官方範例用 Zod 限制 port 為整數，也要求 folder 位於 `/workspace/` 且不能包含 `..`。

Schema 只能驗證參數形狀與部分路徑規則。Handler 仍要決定哪些 workspace、port 與操作能被目前的 Agent 使用，不能因為 hostname 結尾是 `.internal` 就跳過業務授權。

## 不公開到 Internet，仍不等於只有 Agent 能存取

[0.31.0 版本文件](https://github.com/cloudflare/agents/blob/agents%400.31.0/docs/agents/browse-the-web.md#internal-hostnames)特別指出，Browser Run 的 hostname guardrails **不套用**到 internal hosts。任何 Browser 中開啟的 plain HTTP 頁面都可能向它們發送 request；若 internal handler 會寫資料、執行命令或切換目標，應驗證 request 的 `Origin`。

比較保守的預覽流程可以這樣設計：

1. 將 `allowedDomains` 設為空陣列，讓該 browser 只連 internal hosts；確實需要外部網站時，再逐項加入。
2. 對會改狀態的 handler 檢查 `Origin`、身分與操作範圍；讀取靜態 build 也不要順便暴露整個 workspace。
3. `target` schema 限制可選的 port、folder 與資源 ID，handler 再做 canonical path 與 allowlist 檢查。
4. 使用獨立測試帳號、短效 credentials 與可重建資料；最後以 backend state 或測試結果驗收，不採信 Agent 自述「已完成」。

Internal host 使用 plain HTTP，沒有 HTTPS 或 WebSocket。外部 HTTPS 頁面通常會被 browser 的 mixed-content 規則擋住，這不是完整的 access control；internal 頁面或其他 plain HTTP 頁面仍可能發出 request。Dev server 的 hot reload 也會因缺少 WebSocket 而無法連線，驗證時要重新載入或直接測 production build。

## 模型寫的 browser code 有新的執行邊界

同一版也調整 `browserTool`：模型產生的 code 改在每次呼叫建立的 Dynamic Worker 執行，而非原本的 codemode runtime。依官方文件，該 Worker 沒有一般網路存取，`browser` 是它唯一的對外介面；它也不能關閉 browser、取得 Live View link，逾時則由外部停止。

這縮小了 model-generated code 的直接權限，卻沒有把 browser 本身變成無狀態工具。Browser 會保留 tabs、cookies 與 login，預設 active tab scope 只避免不同 conversation 操作同一個分頁，**不會建立不同 browser profile**。多個使用者若需要不同登入狀態，應使用不同 Browser instance。

官方的 session recording 可以記錄 DOM 變化、輸入與導覽，適合除錯與稽核；錄影橫跨同一 browser session 的所有 scope，仍應視為可能包含敏感資料，限制存取與保存期限。

## 0.31.0 不是無痛升級

既有 browser integration 要注意 API 與 package 調整：

- `createBrowserTools`、`createBrowserRuntime`、`BrowserConnector` 與 Quick Action helpers 已標示 deprecated，新程式改用 `browserTool`。
- 模型 code 從 `cdp.send(...)` 改成 `browser.cdp(...)`；若 system prompt 寫死舊 API，也要同步更新。
- Result 的 `restarted`、`newTabs` 與 `calls` 改由文字型 `notice` 表達，依賴舊欄位的 UI 或 telemetry 需要調整。
- MCP packages 改成 optional peer dependencies。若專案有提供 MCP server、x402 或 experimental WebMCP，必須依 release 指定版本自行加入，否則 build 會出現 unresolved import。

這些是官方 migration notes，不是本篇實測結果。升級前應固定目前 package lockfile，先在測試 Worker 驗證 Browser、MCP 與 observability，再決定是否切換正式流量。

## 適合先試在哪裡？

這項能力最適合「Agent 建立內容後，需要用真實 browser 驗證，但服務不該公開」的流程，例如：

- Coding Agent 啟動 dev server，檢查 console error、DOM 與基本互動。
- 讀取 workspace 的 production build，執行 screenshot 或 accessibility smoke test。
- 讓 browser 同時看測試前端與內部 mock API，驗證跨頁流程。
- 在隔離環境重現 UI bug，再把 recording 與實際狀態交給工程師 review。

目前限制包含最多 8 個 internal host、僅支援 Browser Run 的 Chromium、只在部署後生效、internal host 不支援 WebSocket，以及不能安裝在 subagent 上。Host assignment 會跨 browser replacement、eviction 與 redeploy 保留；這有助於恢復工作，也代表每次任務開始前要確認舊 assignment 是否仍符合本次範圍。

## 採用判斷

Cloudflare Agents SDK 0.31.0 把「公開一個 preview URL 給 browser」改成「由 Agent 明確轉送 internal hostname」。對 browser-based coding workflow，這是值得做 PoC 的 runtime 能力，因為它同時處理連線路徑、持久 browser 與 model code 的執行邊界。

它和既有的 [Agent-Native](../agent-native-shared-actions-ui-state/) 文章處理不同問題：前者是 UI 與 Agent 如何共用 action 與 application state，本篇關心 browser 如何進入尚未公開的預覽環境。和 [OpenShell](../nvidia-openshell-agent-security-boundary/) 的差異則在範圍：OpenShell 是通用 filesystem、process、network 與 credential runtime；`internalHosts` 是 Cloudflare Browser Run 的特定路由與 session 邊界。

正式採用前，至少要實際驗證四件事：外部網路是否真的被拒絕、跨 scope 的 cookies 是否會混用、具副作用的 internal request 是否經過 Origin 與權限檢查，以及 browser 中斷後是否可能重複提交操作。這四項沒有通過，就不該只因 dev server 沒有公開 URL，而把整條流程視為安全。
