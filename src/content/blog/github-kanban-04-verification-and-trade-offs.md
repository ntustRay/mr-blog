---
title: "[Insight] GitHub Kanban 移到 Verify 後，怎麼知道能進 Formal"
description: "用交付證據定義欄位，回顧 GitHub 唯讀、獨立狀態、同步與寫入衝突的取捨。"
pubDate: 2026-11-26
category: Dev Tools & Quality
tags: ["GitHub", "Kanban", "PostgreSQL"]
series: kanban
seriesOrder: 4
references:
  - title: GitHub Kanban 的同步與儲存實作
    url: https://github.com/ntustRay/github-kanban/blob/c69e5fa98efebae090f52199a2c8bb7166706ca7/src/lib/board.ts
  - title: GitHub Kanban 的權限與驗證說明
    url: https://github.com/ntustRay/github-kanban#readme
---

在 Demo 把 `my-project` 從 In progress 移到 Verify，再留下一條備註，得到的是一個待驗收專案。要進 Formal，先在備註旁放一個能重查的結果。部署站是否還指向舊版，打開正式連結才能知道；套件是否發版，查 registry 上的版本比較快；功能修正則要有對應的 PR 和驗收方式。

| 要交付什麼 | Verify 裡寫的動作 | 移到 Formal 前留下的證據 |
| --- | --- | --- |
| 網站 | 從公開入口走完主要操作 | 正式 URL、對應部署與本次檢查的頁面 |
| npm 套件 | 以指定版本裝到乾淨的專案 | registry 版本、安裝和最小 import 結果 |
| 功能修正 | 重跑原本會失敗的流程 | 合併的 PR 與重現步驟或測試結果 |

## 為什麼 repo 和看板要分開存

正式看板經 GitHub App 讀取可存取的 repository。每位使用者的卡片用 `user_id` 和 `repo_id` 識別，於是兩個人能拿同一個 repo 做不同安排。資料分開存的代價是兩邊沒有共同的更新時鐘。專案改名或權限撤銷，必須另外同步。同步抓取 repo 清單後，既有卡片只更新名稱、metadata 與可見性，手動改過的欄位與備註會留下。

一次拖曳只改一張卡，正式站仍要處理兩個瀏覽器視窗同時寫入。伺服器會重新確認 repo 存取權、鎖定卡片資料列，並比對客戶端帶來的 `version`。舊版本回傳 `409`，使用者要重讀才知道對方改了什麼。寫入通過時，卡片更新和 activity 記錄在同一筆交易完成。Demo 能驗證看板操作，上述寫入與權限行為要在帶有測試帳號和資料庫的環境分開驗收。

## 先把狀態定清楚，再考慮自動化

第一次整理自己的專案，先挑三張卡片，讓每張 Verify 都有一個具體動作。下次再打開，如果光看備註就知道要去哪裡確認，就保留這套欄位。如果需要多人追同一組 Issues、跨 repo 分派工作，工作項目的共用狀態應放到團隊原本追 Issue 和 PR 的地方。個人看板留著回答今天該回哪一個專案。

若把 Agent 接進來，較適合先讓它讀狀態、回報待驗證項目。要允許它推進欄位，再決定哪些證據可以由程式核實，哪些要有人的驗收結果。
