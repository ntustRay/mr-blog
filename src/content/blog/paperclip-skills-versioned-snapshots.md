---
title: "[News] Paperclip 的 Skill Versioning：同名 Skill，Agent 可能讀到不同內容"
description: "從 Paperclip 的 source pinning 與版本語意，看 Skill 更新、重現與回退。GitHub snapshots、local live files 和 beta release pins 需要分開理解。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: AI
tags: [AI Agents, Skills]
draft: false
references:
  - title: "Paperclip：Skills Reference"
    url: "https://docs.paperclip.ing/reference/skills/"
---

Agent 昨天能順利開 PR，今天卻改了不該改的檔案。除了模型和 repository，也要查它究竟讀到哪一版 Skill。

如果任務紀錄只寫「使用 code-review skill」，遇到同名但不同內容的檔案，很難重現當時的行為。Paperclip 的 versioning 設計值得看，因為它把 Skill 的來源與實際內容分開記錄。

本文依 2026-10-14 的[官方 Skills Reference](https://docs.paperclip.ing/reference/skills/)整理。GitHub snapshot、local live files 與 beta release pin 的固定範圍不同，重現前需要確認來源與執行時實際採用的內容。

## 來源決定更新方式

官方文件將主要來源區分為：

| 來源 | 內容如何確定 | 更新方式 |
| --- | --- | --- |
| GitHub／skills.sh | 記錄 resolved commit SHA | 明確檢查與安裝更新 |
| Synced GitHub source | 使用最後一次 scan 的 snapshot | refresh source |
| URL import | 匯入當時的內容 | 重新 import |
| Local path | live files | 檔案變更可反映到讀取結果 |

細節與例外以[官方 versioning semantics](https://docs.paperclip.ing/reference/skills/)為準。branch 或 tag 是追蹤更新的線索，resolved commit 才能說明已安裝的內容來自哪裡。

Local path 則沒有相同的固定性。把本機檔案改掉，Agent 後續讀到的內容可能跟之前不同，因此不能直接宣稱「有 versioning 就一定可重現」。

## Source Pin 和 Agent Version Pin 分開看

GitHub source pinning 固定的是匯入版本。另一項機制，是對 bundled Paperclip skill 的 beta releases 指定 agent version pin。

官方文件把後者列為 experimental setting，關閉時既有 pins 可以保留，但不會被套用。這個限定很重要：不能把它寫成所有 skills、所有 adapters 都已具備的一般化版本鎖定。

導入時要記錄 runtime 最後讀到的內容，並核對設定中的版本是否確實生效。

## 多 Agent 先用完整身分辨識 Skill

Paperclip 的 canonical key 用來源資訊區分 skills。只用 slug，若同一家公司出現多個同名 skill，就可能產生歧義。

一般團隊也可以借用這個原則。任務紀錄至少保留：

```text
skill name
來源 repository／URL
skill path
resolved commit 或內容 hash
執行時採用的版本
更新與採用時間
```

這是建議的追蹤資訊，不是 Paperclip API 的完整 schema。

版本記錄只能幫忙找回指令。模型、工具、repository state 與輸入也會影響結果，不能把它當成 deterministic execution 的保證。

## 更新 Skill 要能比較與回退

可以用一個很小的流程開始：

1. 在固定的代表性任務上保留舊版結果。
2. 更新 Skill，記錄內容 diff 與新版本。
3. 比較輸出、採用率與返工理由。
4. 確認效果再擴大使用，保留舊內容供回退。

這是評估方案，本文沒有實測新舊版本的差異。

例如新版 code-review skill 要求更多檢查，可能多找出 bug，也可能讓小修改多花許多時間。應該比較這兩種成本，而不是把「規則更完整」當成進步證據。

對小團隊，不一定需要先導入整套管理平台。把 Skill 放進 Git，在任務紀錄保留 commit 與 path，就能先解決「當時到底讀了什麼」的問題。等到跨 Agent 分配、runtime sync 與多來源更新變難管理，再評估更完整的工具。
