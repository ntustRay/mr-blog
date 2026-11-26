---
title: '[Insight] Ray Markdown Reader 為什麼一次只打開一份檔案？'
description: '從手機臨時修改 Markdown 的需求出發，看單檔編輯、Android 選檔器與存回原檔的取捨。'
pubDate: 2026-11-26
category: 'System Design'
tags: [Android, Tauri, Markdown]
series: markdown-reader
seriesOrder: 1
draft: false
references:
- title: Ray Markdown Reader 專案與功能範圍
  url: https://github.com/ntustRay/markdown-file-reader
- title: Android Developers · Storage Access Framework
  url: https://developer.android.com/training/data-storage/shared/documents-files
---

手機收到一份 Markdown，只想加兩行筆記、確認排版，再把同一份檔案傳回去。Ray Markdown Reader 把首頁留給兩個操作，開啟現有檔案，或用系統選檔器新建一份 `.md`。文件開啟後，再用同一個畫面切換預覽與編輯。

![Ray Markdown Reader 本機 WebView 介面測試的空白畫面，顯示 Open file 和 New .md。](../../assets/project-series/markdown-reader/01-home.webp)

*圖為 v1.1.0 的實際前端在 Chromium 手機尺寸下執行的畫面。Android 系統選檔器由原生端提供。*

## 為什麼開檔交給 Android？

Android 的 Storage Access Framework 讓使用者透過系統選檔器挑一份檔案。App 收到的是指向該文件的 `content://` URI，可透過提供者讀寫選取的文件。檔案仍由原本的位置與提供者管理，不需要先匯入 App 的資料夾。來源是 [Android Developers 的檔案存取說明](https://developer.android.com/training/data-storage/shared/documents-files)。

這個做法把代價放在幾個容易碰到的例外。使用者可能取消選取，提供者可能只開放讀取，手機也可能在存檔途中失去存取權。介面得保留文字、顯示錯誤，並避免把尚未寫入的文字當成已保存。

## 哪些功能留在工具外面？

一次開一份文件，讓「現在要存哪個檔」只有一個答案。代價是缺少資料夾清單、分頁、搜尋與草稿復原。若手機上的工作只是臨時修一份檔案，可以沿用系統檔案工具管理位置。若每天要在多份筆記之間跳轉，工作區和搜尋才有足夠理由放進編輯器。

公開網站提供[隱私政策](https://ntustray.github.io/markdown-file-reader/privacy-policy/)。Android 1.1.0 的功能與測試版建置請看[原始碼說明](https://github.com/ntustRay/markdown-file-reader)。

下一篇用一份測試檔走完開啟、取消切換、存檔與重開。
