---
title: "[News] Android Studio Rabbit 2 開放 40+ Coding Agents：ACP 解耦了什麼？"
description: "Android Studio Rabbit 2 把 BYOA 帶進 stable。從建置、Emulator 和權限分工理解 ACP 如何接 Agent。"
pubDate: 2026-10-30
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - ACP
draft: false
references:
  - title: "Android Developers：Your favorite agents are now integrated in Android Studio"
    url: "https://developer.android.com/blog/posts/ai-agents-android-studio-integration"
  - title: "Android Studio Rabbit 2 release notes"
    url: "https://developer.android.com/studio/releases"
  - title: "Android Developers：Android Dev Summit 2026 developer tools and performance"
    url: "https://developer.android.com/blog/posts/android-dev-summit-26-developer-tools-performance"
  - title: "Agent Client Protocol：Introduction"
    url: "https://agentclientprotocol.com/get-started/introduction"
  - title: "Agent Client Protocol v1：Overview"
    url: "https://agentclientprotocol.com/protocol/v1/overview"
  - title: "Agent Client Protocol v1：Security Considerations"
    url: "https://agentclientprotocol.com/protocol/v1/security"
  - title: "Android Studio Rabbit 2 closed issues"
    url: "https://developer.android.com/studio/releases/fixed-bugs/studio/2026.2.2"
relatedPostIds:
  - coding-agent-harness-176-configurations
  - agent-native-shared-actions-ui-state
  - production-mcp-registry-gateway-identity-policy
---

想換 Android Studio 裡的 Coding Agent，麻煩常出在原有的建置、Logcat、Emulator 和 diff 操作也得重接。Google 於 2026 年 10 月 28 日發布 Android Studio Rabbit 2（2026.2.2），把 Bring Your Own Agent 從 Canary 預覽推進 stable，官方列出可接入的 40 多個 Agents。Android Studio 保留對專案和裝置的理解，透過 ACP 把相關能力提供給 Agent。[Android Developers 公告](https://developer.android.com/blog/posts/ai-agents-android-studio-integration)｜[Rabbit 2 release notes](https://developer.android.com/studio/releases)

## ACP 接 IDE，MCP 接外部工具

ACP（Agent Client Protocol）讓 IDE 與 Agent 如實溝通 session 進度、編輯或工具請求。以改一個 Android 畫面為例，IDE 可以把目前的 module、Gradle 診斷與 Emulator 提給 Agent，Agent 若還得查內部文件，可再用 MCP 接文件工具。把兩邊分開，才能知道換 Agent 時哪些 IDE 能力仍可用。[ACP v1 概覽](https://agentclientprotocol.com/protocol/v1/overview)

ACP 的提示本身沒有替 Agent 的程序加 sandbox。IDE 代執行的檔案或 terminal 操作，可在 IDE 端檢查；Agent 程序可做的其他動作另由 OS、執行環境和工具權限限制。當時 ACP 文件的 remote agent 完整支援仍在開發，本機連線成功也要把遠端另測。[ACP 安全考量](https://agentclientprotocol.com/protocol/v1/security)｜[ACP 支援狀態](https://agentclientprotocol.com/get-started/introduction)

導入時挑一個能在 Emulator 重現的 UI 問題，同樣的模組、build variant 和裝置換兩個 Agent 試。檢查它有沒有用對 IDE 工具、能否呈現可 review 的修改，以及拒絕某個操作後還會做什麼。
