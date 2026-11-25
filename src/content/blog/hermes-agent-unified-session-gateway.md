---
title: "[News] Hermes Agent 0.23：CLI、Desktop、Bot 共用 Session，誰該擁有唯一寫入權？"
description: "Hermes 0.23 把多個入口接到同一個 gateway，從待執行、完成和不確定三種狀態看如何接手。"
pubDate: 2026-11-07
category: "AI & Agents"
tags:
  - AI Agents
  - Harness
  - Coding Agents
draft: false
references:
  - title: "Hermes Agent v0.23.0 — The Hearth Release"
    url: "https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0"
  - title: "PR #106742：Unified gateway runtime"
    url: "https://github.com/NousResearch/hermes-agent/pull/106742"
  - title: "PR #140334：Steer and edit a canonical queued prompt"
    url: "https://github.com/NousResearch/hermes-agent/pull/140334"
relatedPostIds:
  - coding-agent-harness-176-configurations
  - memhub-shared-memory-data-lifecycle
  - agent-monitoring-coverage-compaction
---

在 terminal 叫 Agent 建一個 PR，轉身從桌面 App 改同一個待辦。如果這兩個介面各啟一個 runtime，即使它們都寫同一個 SQLite，也可能各自覺得自己該執行下一步。Hermes Agent 在 2026 年 11 月 6 日 05:32 台北時間發布 v0.23.0，把 CLI、TUI、Desktop、editor、bot 和 cron 等入口接到統一 gateway。[v0.23.0 release](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.0)

## 一個 session 由誰決定下一步

Gateway 取得 profile 的 ownership，再由 `SessionAuthority` 決定每段 session 哪個 turn 能開始。一個佇列照提交順序處理，已開始的項目仍需照實際執行狀態更新。在桌面關掉視窗可以只是離線，Agent 的工作繼續由 gateway 持有。訊息須進同一個持久佇列，修改尚未執行的 prompt 也應在原排隊項目上做條件更新。如果先取消再送一筆，兩步中間可能已被 worker 取走。[統一 gateway 實作](https://github.com/NousResearch/hermes-agent/pull/106742)｜[修改排隊訊息的變更](https://github.com/NousResearch/hermes-agent/pull/140334)

## 中途斷線後，外部服務可能已經做完

建立 PR 的請求送到 GitHub 後，gateway 可能在收到回應前停止。Hermes 會把已開始但收不到結果的 turn 標成 `unknown`，保留已完成項目的 receipt，也能分辨尚未執行的工作。復原時先到 GitHub 核對有沒有那筆 PR，再決定重試，避免兩邊各做一次。[重啟復原設計](https://github.com/NousResearch/hermes-agent/pull/106742)

接到自己的多入口工具時，可以測同時送出、關閉一個 client、gateway 重啟、等待回應中途斷線。共用 owner 讓順序比較好管，但 gateway 的備援與升級也會同時影響各入口。能說清楚何時該接著跑、何時該停下來對帳，比單純把歷史存在同一個 DB 更重要。
