---
title: "[News] Cloudflare Agents：讓 Browser Agent 看內部預覽，不必公開 dev server"
description: "Cloudflare Agents SDK 0.31.0 讓遠端 browser 透過 Worker 開內部預覽。從請求路徑了解可讀範圍和升級影響。"
pubDate: 2026-10-28
category: "AI & Agents"
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

Agent 把前端改完，要用 browser 打開才知道頁面有沒有壞。可是在 Worker 外跑的瀏覽器，開不到 sandbox 裡只對內監聽的 dev server。Cloudflare 在 2026 年 10 月 27 日發布 Agents SDK 0.31.0，讓 Browser Run 可以經由設定的 internal hostname 把請求交回 Agent 的 handler。handler 可以專門回應測試前端或 workspace 裡指定的產物。[0.31.0 release](https://github.com/cloudflare/agents/releases/tag/agents%400.31.0)｜[Browser 文件](https://github.com/cloudflare/agents/blob/agents%400.31.0/docs/agents/browse-the-web.md)

## 對內轉送，仍然要限定能讀什麼

依 0.31.0 文件，Browser Run 的 hostname guardrails 不會套到 internal hosts。採用時讓一個 browser session 專注在自己的預覽內容，避免在有內部預覽的同一環境開不受信頁面。handler 只回應核准的資料夾、port 或服務，測試前端用測試帳號和假資料。這樣即使頁面發出預期外的請求，也可在自己的 handler 驗證它沒有拿到不該取的資源。[Internal hostnames 變更](https://github.com/cloudflare/agents/pull/2673)

同版 `browserTool` 把模型產生的程式放到每次呼叫建立的 Dynamic Worker，瀏覽器仍可有自己的 session 狀態。舊專案若用 `createBrowserTools` 或 `createBrowserRuntime`，可查哪些 API 標為 deprecated，並檢查舊 prompt 是否還寫 `cdp.send`。新版對應的是 `browser.cdp`。升級時先跑一個測試頁，確認預覽可進、拒絕路徑照預期、session 沒誤帶別組登入。[BrowserSession 變更](https://github.com/cloudflare/agents/pull/2667)｜[版本文件](https://github.com/cloudflare/agents/blob/agents%400.31.0/docs/agents/browse-the-web.md)
