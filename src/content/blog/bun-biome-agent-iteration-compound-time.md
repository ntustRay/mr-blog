---
title: "[Insight] Bun + Biome：讓 Agent 每次重跑都快一點"
description: "把依賴安裝與每輪檢查分開計算，說明 Bun、Biome 的時間收益如何累積，以及為什麼多跑幾輪不保證交付更好。"
pubDate: 2026-09-29
updatedDate: 2026-10-17
category: Engineering
tags:
  - AI Agents
  - Bun
  - Biome
draft: false
relatedPostIds:
  - stop-using-npm-install-why-we-use-bun
references:
  - title: "Bun Docs — bun install"
    url: "https://bun.com/docs/pm/cli/install"
  - title: "Biome — One toolchain for your web project"
    url: "https://biomejs.dev/"
---

Agent 開始工作時要準備環境，修改程式後又要 format、lint、驗證。對反覆執行的工作流，除了模型回覆速度，也值得量這些固定步驟花了多久。

[Bun 的 package manager](https://bun.com/docs/pm/cli/install)可以作為依賴安裝的候選；[Biome](https://biomejs.dev/)則整合 format 與 lint。是否能省時間，要放回同一個專案、版本與 CI 環境比較，這裡沒有兩者在自身專案的 benchmark。

安裝通常發生在建立工作區或依賴變動時，檢查則可能每輪修改都跑。計算收益時不能把兩者都乘上 Agent 的修改次數。

假設每次建立環境省 20 秒、每輪檢查省 2 秒，建立 5 次環境並檢查 30 輪，合計少等 `5 × 20 + 30 × 2 = 160` 秒。這是示意試算，固定節省量首先是線性累積。

如果把這段時間拿來補一個邊界測試，或更早發現錯誤，後續可能減少返工。這才是「複利」比喻可能成立的機制，仍需要驗證；多跑一輪本身不保證品質變好。

下一步可以分別記錄安裝、檢查、完整任務耗時與人工收尾時間。若安裝已充分使用 cache，或主要等待來自模型和 E2E，換工具的優先順序也會改變。
