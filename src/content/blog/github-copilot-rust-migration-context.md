---
title: "[News] GitHub 把 Copilot Runtime 改成 80 萬行 Rust：長任務靠什麼撐住？"
description: "88 小時是單一 subsystem 的 session。回到 GitHub 的 128 個 PR，看長任務如何持續驗證遷移結果。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, Coding Agents, Harness]
draft: false
relatedPostIds:
  - coding-agent-harness-176-configurations
  - claude-mods-harness-runtime
references:
  - title: "GitHub：Migrating the GitHub Copilot runtime to Rust, using Copilot"
    url: "https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/"
---

GitHub 2026 年 9 月公布 Copilot agent runtime 從 TypeScript／Node.js 遷到 Rust 的紀錄。最容易讀混的兩個數字是 80 萬行和 88 小時。80 萬行以上是 production Rust 的規模，整個專案做了數月、合併 128 個 PR。88 小時是其中 extension runtime 的一段 session。對多數工程團隊，較能借來用的是它怎麼把工作切到可以逐步驗收的大小。[GitHub 遷移紀錄，9 月 16 日發布、9 月 23 日更新](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/)

## 寫完程式後，session 還在做什麼？

GitHub 記錄了兩種工作節奏。model orchestration 跑了 42 小時，前 12 小時主要產生程式碼，後面轉向驗證。extension runtime 的 88 小時則反覆讀檔、改程式、build，再回來 review。兩個案例說明長任務需要安排驗證時間，因為編譯過了，仍可能在事件發送順序、序列化或 Windows 程序行為上和舊版不同。

長對話還會遇到 context compaction，系統把舊訊息縮成較短的內容，好讓工作繼續。GitHub 在這次遷移記錄 5,116 次 compaction 和 96.22% prompt-cache hit rate。前者描述壓縮發生的次數，後者描述 prompt 前綴快取重用，不能用來判斷摘要有沒有保留必要決策。能跨階段查回的紀錄，至少要有基準 commit、已確定的行為、失敗測試和下一個要驗證的情境。[原文 session 分析](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/)

實際切一個小模組來做時，先用同樣的輸入比對舊版和新版輸出，特別是錯誤行為與公開的事件。這段差異驗收完，再改演算法或效能。出錯時有兩個邊界可比，容易追到是哪一個變更造成的。
