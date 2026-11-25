---
title: "[News] Google Mirror Dimension：Browser Agent 的安全 eval，先做一個不會碰到真網路的假網路"
description: "Google Chrome 用可重置的合成網站評估 Browser Agent。先從測試帳號、固定初始狀態與可核對的結果做起。"
pubDate: 2026-11-23
category: "AI & Agents"
tags:
  - AI Agents
  - Browser Automation
  - Security
  - Testing
references:
  - title: "Google Chrome Security: Mirror Dimension for Agents"
    url: "https://blog.google/security/mirror-dimension-for-agents/"
  - title: "METR: AI R&D-relevant model capabilities are improving rapidly and are getting harder to measure"
    url: "https://metr.org/blog/2026-11-20-q4-2026-capability-update/"
relatedPostIds:
  - browser-use-1-python-repl-cdp
  - copilot-evals-skills-regression
draft: false
---

要驗 Browser Agent 能否登入後下載一份報表，昨天成功、今天失敗，原因可能是網站改版、登入過期，或前一次測試留下資料。真網站也可能真的送出表單。Google Chrome 團隊於 2026 年 11 月 19 日公布 Mirror Dimension，把測試移到封閉的合成網站環境，讓每輪從已知狀態開始。[Chrome Security 原文](https://blog.google/security/mirror-dimension-for-agents/)

## 網站可重建，成功條件也要能查

官方描述用 gVisor 隔離執行，再透過測試代理把瀏覽器的請求交給合成網站。測試接觸的是控制內的資料，不會把表單送到原服務。可以把同一個流程的帳號、cookie 和資料庫重建，固定報表 ID 及檔名。確認成功時，直接查測試後端或下載的檔案，不必只相信畫面提示。頁面內容、圖片和輔助使用標籤都可能對 Agent 造成影響，測試時把它們視為外部資料，確認不會改變授權和任務範圍。[Mirror Dimension 的隔離與評測設計](https://blog.google/security/mirror-dimension-for-agents/)

團隊也用自動流程產生與檢查合成網站。網站變多之前，先驗簡單的表單和 ARIA 資訊能照預期操作，否則容易把 fixture 自己的 bug 算成 Agent 的錯。自己的專案可先做一條固定的登入與下載路徑，加上登入過期、權限不足與下載不存在等案例。每次重置後跑同一批，才知道更新 Agent 前後差在哪。
