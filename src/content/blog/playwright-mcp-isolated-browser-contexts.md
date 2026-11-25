---
title: "[News] Playwright MCP 0.0.84：多帳號 Browser Agent 為什麼不能只開不同 Tab？"
description: "Playwright MCP 0.0.84 可在同一 browser 內分開測試帳號。釐清 Tab、BrowserContext 與 URL 遮罩各處理什麼。"
pubDate: 2026-11-01
category: "AI & Agents"
tags:
  - AI Agents
  - MCP
  - Security
draft: false
references:
  - title: "Playwright MCP v0.0.84 release"
    url: "https://github.com/microsoft/playwright-mcp/releases/tag/v0.0.84"
  - title: "Playwright PR #43087：Create tabs in isolated browser contexts"
    url: "https://github.com/microsoft/playwright/pull/43087"
  - title: "Playwright PR #43258：Redact URL parameter values"
    url: "https://github.com/microsoft/playwright/pull/43258"
  - title: "Playwright MCP issue #1791：Runtime tokens exposed in tool responses"
    url: "https://github.com/microsoft/playwright-mcp/issues/1791"
  - title: "Playwright PR #42947：Bound browser_find results"
    url: "https://github.com/microsoft/playwright/pull/42947"
relatedPostIds:
  - cloudflare-browser-agent-internal-hosts
  - nvidia-openshell-agent-security-boundary
  - agent-native-shared-actions-ui-state
---

要測管理員和一般成員，可以開兩個 Tab 打開同一個測試站。若兩個 Tab 在同一個 BrowserContext，後登入的帳號可能改掉同源頁面共用的 cookie。測試看似切到另一個角色，實際送出表單時仍可能在同一個登入狀態下。

Microsoft 於 2026 年 10 月 31 日台北時間 23:20 發布 Playwright MCP 0.0.84。`browser_tabs` 新增了命名的 `isolatedContext`，可以用 `admin`、`member` 分開 cookies 與 storage。相同名稱的 Tab 仍共享同一組狀態；cookie、storage 和網路工具也按目前 Tab 所在的 context 運作。以下是工具參數示意，未實跑。[0.0.84 release](https://github.com/microsoft/playwright-mcp/releases/tag/v0.0.84)｜[BrowserContext 實作](https://github.com/microsoft/playwright/pull/43087)

```json
{
  "action": "new",
  "url": "https://app.test",
  "isolatedContext": "admin"
}
```

## 帳號分開後，也要看 trace 裡寫進什麼

這版另外遮罩 tool response 中 URL 參數的值。它處理的是保存操作紀錄時，敏感值跟著 URL 進 trace 的問題。原始頁面、其他 logs 和截圖仍按各自的機制處理。遇到長頁面，`browser_find` 的 `maxResults` 則限制回傳幾筆匹配，單筆祖先路徑仍可能很長。[URL 參數遮罩](https://github.com/microsoft/playwright/pull/43258)｜[browser_find 變更](https://github.com/microsoft/playwright/pull/42947)

導入時以假帳號測兩條路：管理員登入後，會員 context 不能共用該登入；在會員送出測試表單後，再看後端記錄的 actor。兩條都過，才知道分頁切換與真正的寫入身分對得上。
