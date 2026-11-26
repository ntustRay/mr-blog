---
title: "[Insight] GitHub Kanban 為什麼拿 Repository 當卡片"
description: "從跨專案排程的問題出發，拆解 GitHub 專案資料與個人看板狀態各自負責什麼。"
pubDate: 2026-11-26
category: Dev Tools & Quality
tags: ["GitHub", "Kanban", "PostgreSQL"]
series: kanban
seriesOrder: 1
references:
  - title: GitHub Kanban 專案說明
    url: https://github.com/ntustRay/github-kanban
  - title: GitHub Kanban 免登入 Demo
    url: https://github-kanban-ntustray.vercel.app/demo
---

打開六個 GitHub tabs，可以看到每個 repo 最後一次 push。光靠這個日期，很難想起哪個網站還差手機驗收，哪個 npm 套件等 CI 跑完就能發版。有兩種資訊要同時看：GitHub 上改了什麼，以及自己接下來要做什麼。

GitHub Kanban 用 repository 當卡片。一張卡對應一個專案，點進去可以讀 `TODO.md`、`README.md`、`AGENTS.md`。狀態、備註和排序則存到看板資料庫。把專案拖進 Verify，不需要為這次拖曳在原始 repo 加 commit。

## 先決定拿什麼當卡片

如果今天要拆一個 PR 的工作，卡片應該用 Issue。把手機驗收、修 bug、補文件各開一張，就能個別完成。GitHub Kanban 處理的是另一層決策：今天在十個並行專案裡，要先回去哪一個？一個 repo 放一張卡，就能用一條備註留下下一個動作；細節還是回原專案看。

GitHub 的 archived、最近 push 和網站連結會影響初次分類。新 repo 可能先在 Backlog，近期有 push 的 repo 可能在 In progress。有網站連結也只表示有地方可以看。要移到 Formal，得由使用者確認交付狀態。同步既有卡片時會更新 repo metadata 和可見性，已保存的狀態、備註、排序則繼續使用同一筆記錄。

## 看板要有一個能接手的理由

「快做完了」留不下可接手的動作。改成「用手機開正式網址，確認日期範圍可套用」，下一次開卡就知道該去哪裡、看到什麼代表通過。圖表篩選若已上線，貼部署網址；npm 套件等新版本，貼 registry；有 PR 就留 PR 和驗證步驟。這些證據各有來源，看板只保存指向它們的下一步。

系列下一篇會用公開 Demo 把 `my-project` 移到 Verify 並寫入驗收備註。之後拆到排序實作，看看只移動一張卡，怎麼保留其他卡片的位置。
