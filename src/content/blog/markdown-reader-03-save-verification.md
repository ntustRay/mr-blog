---
title: '[Insight] Markdown 看得到新內容，怎麼確認原檔真的有存回？'
description: '用重開、取消、捨棄與寫入失敗四條路徑驗證單檔編輯器，區分 UI 與 Android 文件提供者的責任。'
pubDate: 2026-11-26
category: 'Dev Tools & Quality'
tags: [Android, Tauri, Testing]
series: markdown-reader
seriesOrder: 3
draft: false
references:
- title: Ray Markdown Reader · 單檔操作 E2E 測試
  url: https://github.com/ntustRay/markdown-file-reader/blob/master/tests/e2e/document-workflow.spec.ts
- title: Ray Markdown Reader · Android 實機驗收項目
  url: https://github.com/ntustRay/markdown-file-reader/blob/master/docs/GOOGLE_PLAY_RELEASE_HANDOFF.md
---

把 `demo.md` 改完再按 **Preview**，看見新增的列表，代表前端能渲染手上的草稿。要驗證 **Save**，得再透過選檔器讀回同一份文件，逐行確認預期內容。否則就算寫入失敗，只看著記憶體裡的預覽也會以為成功。

單檔介面有一個好處，驗收只需要跟著目前開啟的文件和一份草稿走。要區分的狀態有三個，檔案原本的文字、畫面裡未保存的文字，以及寫入成功後可以重開讀到的文字。

| 操作 | 畫面應該看到什麼 | 重開原檔核對什麼 |
| --- | --- | --- |
| 修改 → Save → 重開 | 未保存圓點消失 | 修改的那行仍在 |
| 修改 → 嘗試開別檔 → Cancel | 留在原本的編輯畫面，草稿仍在 | 原檔還是前一次保存的版本 |
| 修改 → 嘗試開別檔 → Discard → 選取成功 | 切換到另一份文件 | 原檔保留前一次保存的版本 |
| 修改 → Save → 寫入失敗 | 顯示錯誤，草稿可繼續編輯 | 原內容可完整讀回，或依提供者行為確認實際寫入狀態 |

![Chromium 中的本機測試回傳唯讀寫入錯誤，Ray Markdown Reader 仍保留文字草稿。](../../assets/project-series/markdown-reader/03-save-failure.webp)

*測試畫面由 v1.1.0 的前端產生，原生寫入回傳唯讀錯誤。不同 Android 文件提供者的錯誤與部分寫入行為，需用實機和可丟棄的檔案確認。*

專案的 [E2E fixture](https://github.com/ntustRay/markdown-file-reader/blob/master/tests/e2e/document-workflow.spec.ts) 模擬讀寫與取消，可以重複測 UI 分支。拿到實機後，再加上取消系統選檔器、唯讀文件、UTF-8 BOM 與 CRLF 原樣保存等[驗收項目](https://github.com/ntustRay/markdown-file-reader/blob/master/docs/GOOGLE_PLAY_RELEASE_HANDOFF.md)。

這個工具適合臨時預覽和修改一份 Markdown。需要歷史版本或多裝置同步時，先由既有的檔案工具留副本，再在 App 選取要修改的那份。這樣也能在實機測試時清楚知道應該回到哪個位置驗證。
