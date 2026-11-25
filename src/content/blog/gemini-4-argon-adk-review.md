---
title: "[News] Gemini 4 Argon 跑了 11 小時，ADK 團隊只接受 2 個優化"
description: "Google 的 ADK 優化跑了 11 小時。比較被採用的兩項改動，以及全綠測試和加速數字為何仍能漏掉問題。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, Coding Agents, Harness]
draft: false
references:
  - title: "Google：Optimizing a 200,000-line Python codebase overnight with Gemini 4 Argon"
    url: "https://developers.googleblog.com/optimizing-a-200000-line-python-codebase-overnight-with-gemini-4-argon/"
---

Google 10 月 13 日公開一個 Python ADK 效能案例：Gemini 4 Argon 在 Antigravity 跑了 11 小時，提出六項優化，maintainer 接受了兩項。從 reviewer 的位置看，最值得追的是那四項卡在哪裡。效能報告和測試是決策的資料，還得看使用者原本依賴的行為會不會被改掉。[Google 原始案例，2026-10-13](https://developers.googleblog.com/optimizing-a-200000-line-python-codebase-overnight-with-gemini-4-argon/)

## 兩個優化各省了哪段時間？

兩個留下來的改動都能說清楚少做了哪份工作：先篩 session events 再複製，只複製接下來用得到的事件；延後載入重型 package，等實際用到再付 import 的成本。Google 對該 ADK 路徑報告的數字是，in-memory 長 session 準備時間少約 40%，package 冷啟動 import 快約 21%。測量的是兩段各自的耗時，整個 Agent 任務還包括模型和工具。[Google 測試範圍與結果](https://developers.googleblog.com/optimizing-a-200000-line-python-codebase-overnight-with-gemini-4-argon/)

拿 import 來看，移除原有匯入後，16,892 個開源單元測試都過了，卻有 25 個內部 test targets 失敗。內部測試會替換既有 module attributes，測的是另一套使用方式。改用延遲取用，才保留原本可以被替換的行為。又例如被擱置的 event cache，合成測試雖快了 17%，弱引用的設計仍有判錯快取的疑慮，維護者沒有採用。[被退回改動的細節](https://developers.googleblog.com/optimizing-a-200000-line-python-codebase-overnight-with-gemini-4-argon/)

下次讓 Agent 幫忙加速大型 repo，可以請它把變更拆成各自能驗證的 diff，並列出每項測了什麼與應保留的介面。這樣 reviewer 發現 cache 策略有風險時，仍可以保留已確認的複製改善。
