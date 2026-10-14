---
title: "GitHub 把 Copilot Runtime 改成 80 萬行 Rust：長任務靠什麼撐住？"
description: "88 小時只是其中一個 subsystem port。GitHub 的真正案例，是數月、128 個 PR，以及長 session 的 context 與驗證管理。"
pubDate: 2026-10-14
category: AI
tags: [AI Agents, Coding Agents, Harness]
draft: false
references:
  - title: "GitHub：Migrating the GitHub Copilot runtime to Rust, using Copilot"
    url: "https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/"
---

「Agent 用 88 小時改寫 80 萬行 Rust」很有吸引力，也把兩個不同範圍的數字接在一起。

[GitHub 的原始紀錄](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/)描述的是：Copilot agent runtime 從 TypeScript／Node.js 改寫成超過 80 萬行 production Rust，跨數月、128 個 merged PR 逐步交付。88 小時指的是其中的 extension-runtime port。

這篇依 GitHub 公開紀錄整理。沒有取得其內部 runtime，也沒有自行重跑 migration。

## 一個長 Session 裡，驗證也是工作

GitHub 對比了兩種 subsystem port：model orchestration 的 session 跑了 42 小時，code generation 集中在前 12 小時，後面轉向驗證；extension-runtime 的 88 小時 session 則讓讀取、修改、build、review 長時間交錯。

以上都是[原文的 session 分析](https://github.blog/ai-and-ml/generative-ai/migrating-the-github-copilot-runtime-to-rust-using-copilot/)，不能用來估算任意專案的生產力。

它們至少提醒一件事：Agent 還在工作，不代表還在寫更多 code。大型改寫常需要回頭處理 caller、合併後的狀態、跨語言的行為差異。把「寫完」當成完成點，會漏掉很大一段工程工作。

## Context Compaction 是有損的交接

GitHub 報告整個 port 過程自動 compaction 了 5,116 次，prompt-cache hit rate 為 96.22%。這是該專案的紀錄，不是每個 Harness 都能達到的基準。

Compaction 讓 session 繼續工作，但摘要會丟掉細節。可以把它當成工程師換班：下一班必須知道哪些決定已經確定、哪些假設還沒驗證，以及哪裡可以找回原始證據。

根據這個案例，可整理一份長任務交接內容：

```text
目前分支與基準 commit
已完成的模組和仍未完成的 contract
最近一次驗證指令與結果
已知失敗及重現方式
不能順手改掉的行為
下一步與停止條件
```

這是工作流建議，不是 GitHub 公布的 compaction format。

只有「已完成 80%」幾乎幫不上忙。寫出「event ordering 尚未驗證，測試在某檔案」才讓下一段 context 能繼續查證。

## Migration 先保留行為，優化另外算

換語言時順手改演算法，會讓失敗原因變難追：是 port 錯了，還是新設計改變了 contract？

可以先把工作拆成：

| 階段 | 要驗證的事 |
| --- | --- |
| 相容性 port | inputs、outputs、errors 與事件順序是否維持 |
| 接入既有系統 | caller、平台差異與部署路徑是否正確 |
| 效能改善 | 在已確認的行為下，時間與資源是否改善 |

這是針對 migration 的設計建議。階段不必是三個大 PR；每個模組都可以小步走完。

Rust compiler 可以幫忙抓型別和介面接線的錯誤。event order、資料序列化、Windows process flags 或漏掉的 guard，仍然要靠其他驗證。編譯通過只說明 compiler 能檢查的部分。

## 小團隊可以借用哪些做法？

80 萬行改寫不是多數團隊的日常。比較容易借用的是「把長工作切成可交付的邊界」。

例如先選一個 TS module，列出 public exports、資料格式與錯誤行為，再要求 Agent 保留它們。每個 slice 都提供小範圍 diff、驗證證據與可撤回的 commit。

如果要並行，先定義誰整合、哪些檔案由誰負責。共享核心檔案的修改要有協調方式；更多 Agent 不會自動消除衝突。

**長任務的穩定性，取決於進度、contract 和證據能否持續被找回。** 單一 session 跑很久，是結果的一部分；可檢查的交付邊界才方便團隊接手。
