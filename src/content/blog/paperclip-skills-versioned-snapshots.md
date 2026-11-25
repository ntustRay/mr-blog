---
title: "[News] Paperclip 的 Skill Versioning：同名 Skill，Agent 可能讀到不同內容"
description: "同名 Skill 仍可能有不同內容。沿著 Paperclip 的 GitHub 快照、本機路徑與 beta pin 找回一次執行的版本。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, Skills]
draft: false
references:
  - title: "Paperclip：Skills Reference"
    url: "https://docs.paperclip.ing/reference/skills/"
---

兩次 review 都記錄了「用了 `code-review`」，第二次卻開始檢查更多檔案。要重現差異，先找出當時載入的是哪個來源、哪個檔案和哪版內容。名稱拿來找工具很方便，單靠名稱找不回執行時讀到的文字。

依 2026 年 10 月 14 日查閱的 Paperclip 文件，從 GitHub 或 skills.sh 匯入時會記錄解析出的 commit SHA。跟著 branch 或 tag 找更新是一件事，知道這次已載入哪個 commit 是另一件事。指向 local path 時則在讀 live files，同一路徑修改後，下一次執行可能直接讀到新內容。若需要重現，要另外保留該次內容或雜湊。[Paperclip Skills Reference](https://docs.paperclip.ing/reference/skills/)

## 分清楚鎖的是來源還是 beta 版本

Paperclip 也有 experimental 的 agent version pin，可指定 bundled Skill 的 beta release。它跟 GitHub 的來源鎖定各自適用於不同機制。文件說明關閉該設定時，既有 pin 可以保留，執行時卻不會套用。Debug 時最好看最後實際採用的版本，別只看設定頁存了什麼。[Paperclip 版本語意](https://docs.paperclip.ing/reference/skills/)

小團隊可以先在任務紀錄留 repo、Skill 路徑、commit 或內容 hash。改版時挑同一組 review case 比對。新版如果多抓到兩類錯誤，卻也讓每個小修都花更多人力，這兩項資訊應該一起回到採用決策。舊版內容有留存，結果不如預期也比較容易回退。
