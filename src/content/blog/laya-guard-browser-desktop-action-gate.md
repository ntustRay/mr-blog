---
title: "[News] Laya Guard 0.8.0：Agent 點下付款前，誰先判斷這個動作危險？"
description: "Laya Guard 0.8.0 在瀏覽器或桌面點擊前判斷風險。從按鈕語意辨識、看不到時如何停和已測範圍理解 guard。"
pubDate: 2026-11-17
category: "AI & Agents"
tags:
  - AI Agents
  - Security
  - Computer Use
  - MCP
draft: false
references:
  - title: "Laya Guard v0.8.0 release"
    url: "https://github.com/scs0209/laya-guard/releases/tag/v0.8.0"
  - title: "PR #105：Browser 與 desktop computer-use guard"
    url: "https://github.com/scs0209/laya-guard/pull/105"
  - title: "Issue #95：全形字元繞過規則"
    url: "https://github.com/scs0209/laya-guard/issues/95"
  - title: "v0.8.0 CI run"
    url: "https://github.com/scs0209/laya-guard/actions/runs/43807046518"
  - title: "Select 1：laya-guard 0.2 時期的獨立安裝與規則測試"
    url: "https://select1.dev/2026-10-14"
relatedPostIds:
  - nvidia-openshell-agent-security-boundary
  - chatgpt-wallet-agent-payment-authorization
  - playwright-mcp-isolated-browser-contexts
  - browser-use-1-0-5-run-judge
---

桌面 Agent 說要按一下，工具端收到的卻只有座標。那一點可能是「下一頁」，也可能是「取消訂單」。核准程式要先知道畫面上的目標，再決定要不要執行。Laya Guard 於台北時間 2026 年 11 月 16 日發布 0.8.0，把行動前檢查擴到瀏覽器及 macOS 桌面操作。[0.8.0 release](https://github.com/scs0209/laya-guard/releases/tag/v0.8.0)｜[Browser 與 desktop 變更](https://github.com/scs0209/laya-guard/pull/105)

## 找不到按鈕意思時，要怎麼處理？

瀏覽器可以從元素名稱、角色和頁面資訊判斷，桌面則依賴 Accessibility tree。自繪 UI、Canvas 或遠端桌面可能讀不到適合的元素。在會付款、刪除或送出資料的流程，遇到沒有標示或看不清楚的點擊，可以先讓人確認。放幾個測試按鈕，確認清楚標示的操作、無標籤的按鈕和無法讀 Accessibility 資料時，停下來或放行的方式都合乎預期。[實作與測試](https://github.com/scs0209/laya-guard/pull/105)

這版也修正輸入文字的 Unicode 表示不同時可能判斷不一致的問題。Guard 和底下的執行工具要以一致的語意看輸入，否則檢查過的內容未必是實際執行的內容。原版 CI 通過的是作者附上的測試，不能據此知道你的網站和桌面 App 都可辨識。[0.8.0 CI](https://github.com/scs0209/laya-guard/actions/runs/43807046518)

點擊前的 guard 可以阻擋或升級核准，結果仍要回網站確認。付款流程還要把准許的品項和金額綁定到該訂單，送出之後用商家狀態對帳。[付款授權與對帳](../chatgpt-wallet-agent-payment-authorization/)
