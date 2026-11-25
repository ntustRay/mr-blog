---
title: "[News] Browser Use 1.0.5：Agent 說完成，怎麼知道網站真的接受了？"
description: "Browser Use 1.0.5 讓 judge 回看操作紀錄與截圖。區分 Agent 自報完成、模型二次判讀和網站實際狀態。"
pubDate: 2026-11-15
category: "AI & Agents"
tags:
  - AI Agents
  - Testing
  - Harness
  - Security
draft: false
references:
  - title: "Browser Use 1.0.5 release"
    url: "https://github.com/browser-use/browser-use/releases/tag/1.0.5"
  - title: "Browser Use PR #6398：Judge every run with the agent's own model"
    url: "https://github.com/browser-use/browser-use/pull/6398"
  - title: "Browser Use PR #6403：Judge with screenshots and gotchas"
    url: "https://github.com/browser-use/browser-use/pull/6403"
  - title: "Browser Use issue #6031：Known-answer false-success regression cases"
    url: "https://github.com/browser-use/browser-use/issues/6031"
relatedPostIds:
  - browser-use-1-python-repl-cdp
  - google-adk-2-14-multi-run-eval
  - agent-monitoring-coverage-compaction
---

Agent 填好測試帳號的電話，按了儲存，回報「完成」。重新載入後，原本的號碼還在。原因可能是後端拒絕、畫面只顯示暫時的成功訊息，或者請求先被導回登入頁。Browser Use 於台北時間 2026 年 11 月 14 日發布 1.0.5，把 run 結束後由模型重看證據的 judge 設為預設。[1.0.5 release](https://github.com/browser-use/browser-use/releases/tag/1.0.5)

## 三個地方可以回答「完成」了沒有

| 訊號 | 電話更新的例子 |
| --- | --- |
| `result.success` | Agent 根據執行中的觀察說自己已按完 |
| `result.judgement` | 同一模型另外讀 trace、最後頁面或截圖，重新判斷。失敗時可能是 `None` |
| 網站狀態 | 重載後仍顯示新號碼，或測試後端確認該筆資料已更新 |

設定 `judge_context` 時，直接寫可驗收的結果，例如重載後仍是新號碼。這讓第二次判斷有對照條件。官方小型測試看了 13 個 session，每個讓新舊 judge 各判三次。其中五個有阻礙的 session，舊判讀 15 次指出 6 次問題，新版本 15 次都指出問題。在八個沒有該類問題的 session，24 次判讀有 2 次仍提示問題。這批結果適合用來選回歸案例。[每次執行的 judge](https://github.com/browser-use/browser-use/pull/6398)｜[截圖與 gotchas 測試](https://github.com/browser-use/browser-use/pull/6403)

同一模型也可能把畫面看錯兩次，而且第二輪通常多一個請求。要上線可先用固定案例測「按了但沒存」與「確實已存」，一起記 `result.success`、判讀和最終狀態。截圖與 trace 可能含使用者資料，先對照出站配置和保留規則，再決定哪些任務開啟這次判讀。[False-success 回歸案例](https://github.com/browser-use/browser-use/issues/6031)
