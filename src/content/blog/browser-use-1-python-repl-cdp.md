---
title: "[News] Browser Use 1.0：Browser Agent 改成 Python REPL，真的更快嗎？"
description: "Browser Use 1.0 用持續執行的 Python REPL 操作瀏覽器。用相同任務比較耗時、成本與升級後要重驗的權限。"
pubDate: 2026-11-11
category: "AI & Agents"
tags:
  - AI Agents
  - Harness
  - Security
draft: false
references:
  - title: "Browser Use 1.0.0 release：CDP is all you need"
    url: "https://github.com/browser-use/browser-use/releases/tag/1.0.0"
  - title: "Browser Use：Migrating from 0.x to 1.0"
    url: "https://github.com/browser-use/browser-use/blob/1.0.0/MIGRATING.md"
  - title: "Browser Use benchmark：BU Bench V2.1"
    url: "https://github.com/browser-use/benchmark"
  - title: "Browser Use issue #6363：multiple screenshots may preserve stale images"
    url: "https://github.com/browser-use/browser-use/issues/6363"
  - title: "Browser Use issue #6365：sensitive_data placeholder regression"
    url: "https://github.com/browser-use/browser-use/issues/6365"
  - title: "Browser Use issue #6367：Windows download filename regression"
    url: "https://github.com/browser-use/browser-use/issues/6367"
relatedPostIds:
  - playwright-mcp-isolated-browser-contexts
  - cloudflare-browser-agent-internal-hosts
  - gpt-6-1-terra-computer-use-cost
---

Browser Use 0.x 通常先整理頁面的 DOM，再讓模型挑一個工具動作。2026 年 11 月 10 日發布的 1.0 改成 persistent Python REPL。模型可寫一個幾步一起做的程式片段，經 browser helpers 和 Chrome DevTools Protocol（CDP）操作頁面，再讀結果繼續。回合可能省下來，但單一動作的內容與權限也比以前多。[1.0.0 release](https://github.com/browser-use/browser-use/releases/tag/1.0.0)

## 60 個任務的對照，先看哪個數字變動

官方較可比的一組用同樣的 60 個任務，各重複三次，都使用 cloud browser。1.0 ultrafast 的平均成本為 0.071 美元，Browser Use Pi 為 0.087 美元，約低 18%。平均耗時 585 秒對 689 秒，約少 15%。評測品質差異未達統計顯著。這能幫團隊挑試驗方向，登入、下載或公司內部頁面仍按自己的任務分布重測。[原始 benchmark](https://github.com/browser-use/benchmark)

## 預設瀏覽器從本機改到雲端

雖然 `Agent`、`Browser` 等入口還在，直接沿用 `Browser()` 會遇到預設路徑改變。原本的本機預覽、登入資料、下載目錄和費用都要核對。執行 Python 也需由隔離環境限制檔案、網路與瀏覽器身分。可以把 0.x 和 1.0 分開鎖版本，先用有測試帳號的頁面驗登入、開分頁和下載，確認中斷後不會重複寫入。[官方 migration guide](https://github.com/browser-use/browser-use/blob/1.0.0/MIGRATING.md)

發布初期有人分別回報截圖出現舊圖、敏感資料 placeholder 行為改變與 Windows 下載檔名問題。按自己用得到的情境加進回歸測試，等新版本在相同流程過關再切流量。[畫面回報](https://github.com/browser-use/browser-use/issues/6363)｜[Placeholder 回報](https://github.com/browser-use/browser-use/issues/6365)｜[Windows 下載回報](https://github.com/browser-use/browser-use/issues/6367)
