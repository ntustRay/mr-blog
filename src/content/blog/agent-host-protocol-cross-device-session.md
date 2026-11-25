---
title: "[News] Agent Host Protocol 1.1：同一個 Agent Session 如何跨 IDE、手機與 App？"
description: "Agent Host Protocol 1.1 把 session 交給 host 管。從手機核准、IDE 斷線再連解釋序號、重播與 ACP 分工。"
pubDate: 2026-11-19
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - Protocol
draft: false
references:
  - title: "GitHub：Building the Agent Host Protocol for sessions that continue across devices"
    url: "https://github.blog/engineering/engineering-principles/building-the-agent-host-protocol-for-sessions-that-continue-across-devices/"
  - title: "Agent Host Protocol v1.1 specification"
    url: "https://microsoft.github.io/agent-host-protocol/specification/overview"
  - title: "Agent Host Protocol：Write-Ahead Reconciliation"
    url: "https://microsoft.github.io/agent-host-protocol/guide/reconciliation"
  - title: "Agent Host Protocol：AHP and ACP"
    url: "https://microsoft.github.io/agent-host-protocol/guide/ahp-and-acp.html"
  - title: "microsoft/agent-host-protocol"
    url: "https://github.com/microsoft/agent-host-protocol"
  - title: "microsoft/agent-host-protocol-contrib"
    url: "https://github.com/microsoft/agent-host-protocol-contrib"
relatedPostIds:
  - hermes-agent-unified-session-gateway
  - android-studio-rabbit-2-acp
  - agent-native-shared-actions-ui-state
---

VS Code 裡的 Agent 跑到一半，留下待核准的操作。你關上筆電，想從手機繼續；回到桌面時，畫面又應該顯示同一個 diff 和狀態。聊天文字只是其中一部分。GitHub 在 2026 年 11 月 17 日公開 Agent Host Protocol（AHP）的實作，讓 host 持有 session，App 都連去讀狀態與送操作。[GitHub 工程文章](https://github.blog/engineering/engineering-principles/building-the-agent-host-protocol-for-sessions-that-continue-across-devices/)

## 重新連線時，怎麼知道漏了幾步？

AHP 1.1 用 channel URI 區分 root、session、chat 等資料；terminal 和其他能力則由兩端協商。Host 替 action 編遞增的 `serverSeq`。假設 IDE 斷在第 41 筆，重連時送上自己最後知道的序號，host 可補上後面的變更，或按協定給新的 snapshot。手機先顯示已點的動作時，client 還要把等待 host 確認的動作和已確認的狀態區隔，收到結果後再對齊。[AHP 1.1 規格](https://microsoft.github.io/agent-host-protocol/specification/overview)｜[狀態對帳](https://microsoft.github.io/agent-host-protocol/guide/reconciliation)

ACP 可以用來連一個 IDE client 和一個 Agent。AHP 的 host 還能在下游用 ACP 接 Agent，在上游把狀態同步給多個 clients。GitHub 當時報告兩套不同語言的 host 和五種 clients 採同一協定。想試跨裝置，不妨先只做一個 host、兩個 clients。送訊息後拔掉一端，另一端核准測試操作，重連後檢查順序、核准狀態與同一動作是否只做了一次。[AHP 與 ACP 分工](https://microsoft.github.io/agent-host-protocol/guide/ahp-and-acp.html)｜[官方實作](https://github.com/microsoft/agent-host-protocol)
