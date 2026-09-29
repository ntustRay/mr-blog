---
title: "Bun + Biome：讓 Agent 每次重跑都快一點"
description: "Bun 減少新工作區的依賴安裝等待，Biome 縮短每輪程式檢查；小幅改善反覆累積，讓 Agent 多一點時間進入下一輪。"
pubDate: 2026-09-29
category: Engineering
tags:
  - AI Agent
  - Bun
  - Biome
draft: false
references:
  - title: "Bun Docs — bun install"
    url: "https://bun.com/docs/pm/cli/install"
  - title: "Biome — One toolchain for your web project"
    url: "https://biomejs.dev/"
---

Agent 開始工作時，要先準備環境；每次改完程式，又要 format、lint，再看檢查結果。這些步驟各自只花一點時間，反覆跑起來，等待就會累積。

Bun 讓新工作區安裝依賴更快；Biome 把 format 和 lint 收斂到同一套工具。兩者省下的時間發生在不同地方：Bun 用在建立或重建環境，Biome 則跟著每輪修改、檢查一起跑。

安裝不會在每次程式修改後都重跑，Biome 檢查卻可能一輪又一輪地執行。當 Agent、工作區和驗證次數增加，少掉的等待就會逐次累積，讓下一輪更早開始。

這種效率不一定會在單次操作裡很明顯。它更像複利：每次省一點，工作流程跑得越多，累積留下來的時間就越多；而那些時間可以再拿去多修一輪、多驗證一次。
