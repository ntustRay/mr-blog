---
title: "[Insight] 做一個以 repo 為卡片的看板，先分清楚誰能改哪份資料"
description: "用一次拖曳拆開 React、GitHub App、Better Auth 和 Neon 的責任，安排後面兩堂實作。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Dev Tools & Quality
tags: ["GitHub", "Kanban", "PostgreSQL"]
series: kanban
seriesOrder: 1
references:
  - title: "GitHub Kanban 專案與 GitHub App 設定"
    url: https://github.com/ntustRay/github-kanban
  - title: "看板同步、版本與資料庫交易"
    url: https://github.com/ntustRay/github-kanban/blob/main/src/lib/board.ts
  - title: "Better Auth 與 GitHub provider 的設定"
    url: https://github.com/ntustRay/github-kanban/blob/main/src/lib/auth.ts
---

在看板把一張 repo 卡片移到 Verify，重新登入還應該留在 Verify。這個動作要保存的是你對專案的安排。另一位能讀同一個 repo 的人，應該能把自己的卡片留在 Backlog。

![示範看板將 my-project 從開發移入 Verify；本系列要實作與保存的就是這筆變動。](../../assets/project-series/kanban/02-after.webp)

| 資料 | 由誰提供 | 哪一端負責 |
| --- | --- | --- |
| repo ID、名稱、是否封存，以及 TODO 文件 | GitHub App 可讀的 repository | Next.js server 呼叫 GitHub API |
| 使用者身分與 session | GitHub 登入與 Better Auth | server 確認請求屬於哪位使用者 |
| 狀態、欄內位置、備註 | 個人的看板 | Neon Postgres 依使用者與 repo ID 保存 |
| 拖曳預覽 | 瀏覽器 | React 和 dnd-kit 先讓卡片跟著操作更新 |

兩個人各自有一張卡，所以表裡的識別條件要包含 `user_id`、`repo_id`。另外，卡片不是 GitHub Issue；調整欄位和排序時程式只需寫自己的資料庫。這讓 GitHub App 的 repository 權限能維持唯讀。

第二篇先在本機寫排序，跑測試覆蓋「兩張卡中間還有被篩選藏起來的卡」。第三篇把同一套程式接上自己的 GitHub App、Neon 與 Vercel。存完重新整理，再從資料庫核對改的是哪一列。
