---
title: "[Insight] MR 工具百科為什麼給每個工具一個網址"
description: "用 CSV、文字比對和圖片轉檔說明，小工具的入口、預設和結果為什麼要各自講清楚。"
pubDate: 2026-11-26
category: "Dev Tools & Quality"
tags: ["React", "CSV", "Canvas"]
series: toolbox
seriesOrder: 1
references:
  - title: "MR 工具百科"
    url: "https://mr-toolbox-two.vercel.app/"
---

臨時要把三行 CSV 轉成 JSON，可以開一個腳本，也可以直接貼到工具頁。腳本適合每天重跑同一批資料。工具頁適合當下要看結果、確認一個欄位，再把網址交給同事操作。MR 工具百科把輸入、按鈕和結果放在各自的網址，離開工具首頁後也能直接回到同一種操作。

每個頁面還有自己的資料約定。例如 CSV 原始內容有 `00123`，那可能是郵遞區號或料號。工具將欄位保留為字串後，JSON 輸出才有辦法帶回原值。至於文字比對，空白可能是排版噪音，也可能是 Python 的縮排，所以忽略行首和行尾空白由使用者決定。

接下來會實際做三件事。先把一份帶逗號的 CSV 來回轉檔，再找兩版需求改了哪一行，最後用同一張透明底圖片比較 WebP 和 JPG。每一步都可以用原始輸入重做，方便對照工具的輸出。
