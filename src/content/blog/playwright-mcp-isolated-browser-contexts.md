---
title: "[News] Playwright MCP 0.0.84：多帳號 Browser Agent 為什麼不能只開不同 Tab？"
description: "Playwright MCP 0.0.84 加入命名 isolatedContext，讓同一個 browser process 內的多個帳號分開 cookies 與 storage。整理隔離範圍、URL token 遮罩與導入驗收。"
pubDate: 2026-11-01
category: AI
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

Browser Agent 要驗證管理員與一般使用者的流程時，開兩個 Tab 並沒有隔離登入狀態。只要它們位於同一個 BrowserContext，就會共用 cookies、local storage 與其他 session state；Agent 在錯的 Tab 執行操作，也可能把測試結果寫進錯的帳號。

Microsoft 在台灣時間 **2026 年 10 月 31 日 23:20**發布 [Playwright MCP 0.0.84](https://github.com/microsoft/playwright-mcp/releases/tag/v0.0.84)。`browser_tabs` 新增 `isolatedContext`，可以在同一個 browser process 中建立多組命名 BrowserContext。相同名稱共用 cookies 與 storage，不同名稱則分開；省略名稱或使用 `default`，仍會進入原本的預設 context。

本文依官方 release、合併 PR 與測試整理，沒有啟動 Playwright MCP，也沒有執行多帳號登入或 token 洩漏實測。

## 這篇的重點

- `isolatedContext` 解決的是 browser session state 隔離，不會建立不同 OS 使用者、不同 browser process 或獨立網路邊界。
- Context 名稱只是 Playwright MCP 的分組鍵，不等於應用程式身分或授權。Agent 仍可能選錯 Tab、選錯 Context，或對錯誤帳號執行具副作用的操作。
- 新增的 URL parameter redaction 能減少 OAuth code、access token 等 runtime value 被重複寫進 tool transcript，但官方明確標示它只是便利功能，不能當成安全控制。
- `browser_find.maxResults` 可限制回傳的 match 數量，降低常見字詞灌滿 context 的機率；它不是 token hard limit。

## 不同 Tab 為什麼還是同一個登入狀態？

Browser 的登入狀態通常屬於 BrowserContext，不屬於單一 Tab。同一個 context 裡開啟 `admin.test` 與 `user.test`，兩個頁面仍可能讀到同一組 cookies 或 local storage。

0.0.84 的 `browser_tabs` 可以在建立新 Tab 時指定名稱。以下是官方 tool schema 的使用方向，未在本文環境執行：

```json
{
  "action": "new",
  "url": "https://app.test",
  "isolatedContext": "admin"
}
```

再建立一個 `isolatedContext: "member"` 的 Tab，兩者就會使用不同 BrowserContext。官方 PR 的 regression test 實際建立 `default`、`alice`、`bob` 三組 context，分別寫入 cookie，再切換 Tab 驗證：相同名稱的 Tab 能讀到同一份 cookie，不同名稱讀不到彼此的值。

| 執行方式 | Cookies／storage | 適合情境 | 主要限制 |
| --- | --- | --- | --- |
| 同一個 default context 的多個 Tab | 共用 | 同一身分的跨頁流程 | 不能用來隔離不同角色 |
| 不同命名 `isolatedContext` | 分開 | 同一任務比較 admin／member、A／B 帳號 | 仍由同一個 MCP server 與 Agent 控制 |
| 不同 browser process／VM | 分開，執行環境也可分離 | 高權限帳號、不同租戶或不可信任任務 | 啟動與維運成本較高 |

命名 context 降低了多帳號測試的成本，卻沒有把字串 `admin` 綁定到真正的 admin identity。授權仍由被測系統驗證；Agent 執行前也應確認目前 Tab 的 context、URL 與畫面身分。

## BrowserContext 隔離到哪裡？

[實作 PR #43087](https://github.com/microsoft/playwright/pull/43087)列出的邊界很清楚：

- 同一名稱的 context 共用 cookies 與 storage，不同名稱分離。
- cookie、storage 與 network tools 作用於目前 Tab 所在的 context。
- init scripts、origin filters 與 routes 會套用到各個 context。
- tracing 與 video 會涵蓋同一 browser 中的所有 contexts。

最後一點容易被忽略。即使兩個角色的 cookies 已隔離，trace、video 與其他輸出仍可能同時包含兩邊的頁面、URL 或輸入內容。測試報告、錄影與 artifact 的存取權限，不能直接沿用「cookies 已分開，所以證據也分開」的假設。

它也不是 OS sandbox。不同 context 共用 browser process、MCP server、啟動參數與上層 Agent。任一層被完全控制時，BrowserContext 無法取代獨立 process、container、VM、網路 allowlist 或短效測試憑證。

對視覺回歸或角色流程測試，這個隔離通常夠實用；對 production 管理帳號、跨客戶 tenant 或不可信任網站，分開 browser instance 仍比較容易說明安全邊界。

## URL token 遮罩修的是另一個洩漏路徑

[Issue #1791](https://github.com/microsoft/playwright-mcp/issues/1791)記錄了一個具體問題：Playwright MCP 會在多種 tool response 附上目前 Tab URL。若 OAuth callback、SPA 或 extension relay 把 session／grant value 放在 query 或 fragment，這些值可能反覆出現在 model transcript，並跟著對話記錄落地。

0.0.84 新增：

```bash
npx @playwright/mcp@0.0.84 \
  --redact-url-params=access_token,code
```

被列出的 query／fragment parameter value 會在 tool response 中替換成 `<redacted>`；Browser Extension 也會在讀取連線 token 後，從 connect page URL 移除該參數。

這項功能需要主動列出 parameter 名稱，且只處理 URL query 與 fragment。它不會自動清除 path、DOM、console、request body、header、截圖或 Agent 自己複製的值。應用程式本身也不該把長效 secret 留在 URL；redaction 適合當作 transcript data minimization，不能取代憑證設計與存取控制。

## `maxResults` 限制的是 match 數量

同一版的 `browser_find` 新增正整數 `maxResults`。查詢常見字詞時，它只回傳前 N 個 match 及各自的 ancestor path，並另外回報總 match 數，避免所有結果直接塞進模型 context。

[PR #42947](https://github.com/microsoft/playwright/pull/42947)的測試涵蓋截斷、邊界值與錯誤輸入；PR 也明確說明，限制的是 match 數量，每一個保留項目的 ancestor path 仍會完整輸出。因此它可以降低常見的大量回傳，不能被當成固定 token 上限。

導入時可以先給探索性查詢較小的 `maxResults`，找不到目標再縮小條件或提高數量。這比第一次就把整棵 accessibility tree 或所有 match 送進模型，更容易控制延遲與 context 使用量。

## 多角色 Browser Agent 的最小驗收

如果要把 0.0.84 用在管理員／一般使用者、買方／賣方或登入前／登入後流程，至少驗證以下情境：

1. 在 `admin` context 登入後，`member` context 讀不到相同 cookie 與 local storage。
2. 兩個相同名稱的 Tab 能共享預期 session；關閉或重建後的保存行為符合測試需求。
3. 每次寫入、刪除或送出表單前，流程檢查目前 context、URL、帳號與目標資源。
4. 後端資料與 audit log 能驗證實際執行者，不能只相信 Agent 回報「已切到 member」。
5. trace、video、screenshots 與輸出目錄不會讓另一個測試角色或使用者讀到敏感內容。
6. URL redaction 涵蓋應用程式實際使用的 parameter 名稱，並確認 token 沒有從 DOM、console 或 network output 再次出現。
7. pin `@playwright/mcp@0.0.84`，先在測試帳號與可重建資料上跑完整流程，再評估是否更新團隊預設版本。

這些是建議測試，不是本文已執行的結果。多帳號流程若會修改正式資料，還要加入人工核准、可撤回操作與 idempotency，避免重試或切換 Tab 後重複提交。

## 採用判斷

Playwright MCP 0.0.84 是官方正式 release，主要功能能追到 merged PR、regression tests 與版本化文件。它解決的問題也很具體：讓同一個 Browser Agent 在一個 browser process 中維持多組 session state，同時補上 transcript 中的 URL runtime token 遮罩與 find 結果上限。

目前專案版本仍是 `0.0.x`，發布時間也很短，尚缺獨立的長時間並行、多 Agent 操作或 production 回報。多角色 UI 驗證可以先進 PoC；高權限或跨租戶操作仍應採不同 browser instance／VM，並把 server-side authorization 當成最終邊界。

這和既有的 [Cloudflare Browser Agent](../cloudflare-browser-agent-internal-hosts/) 文章處理不同問題：前文討論 browser 如何存取未公開的 dev server，本篇處理同一個 browser 內的身分與 session state。兩者組合後，才比較接近一條可控的流程：內部預覽不公開，多角色登入也不共用 cookies；網路、OS、憑證與業務授權仍各自驗證。
