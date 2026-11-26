---
title: '[Insight] R Auto Shutdown 01｜關機前為什麼需要一個可操作的倒數'
description: 用「時間到了還在用電腦」這個情境，說明桌面提醒、模擬與系統排程為什麼各有自己的責任。
pubDate: 2026-11-26
category: Dev Tools & Quality
tags: [Rust, egui, Desktop]
series: auto-shutdown
seriesOrder: 1
references:
  - title: R Auto Shutdown 0.3.2 專案說明
    url: https://github.com/ntustRay/rust-auto-shutdown/blob/e2641a9cf74413fa88704fd62061070d2fe134c2/README.md
---

睡前排了 23:30 關機，23:27 還在等檔案上傳。這時需要看到預定時間，並有地方直接延後或取消。能設定一個時間，只完成了這個工具的一半。

R Auto Shutdown 用 Rust 和 egui 做桌面計時器。單次倒數可以輸入分鐘或指定時刻，進入最後五分鐘時開啟獨立提醒。畫面會顯示本次模式和剩餘時間，提供延後 10／30 分鐘、最小化和取消入口。測試時勾選「模擬模式」，到期只會顯示或記錄結果。

## 延後一次，改動的是哪個時間

假設固定時間是每週一 23:30。這週工作還沒存好，可以把本次延後到 23:40，下週仍回到 23:30。延後管理的是這一輪倒數，固定規則管理的是未來何時再開啟一輪。把兩個時間分開顯示，使用者才能預期下一次會發生什麼。

單次倒數在 Windows、macOS 和 Linux 都可以開啟。Windows 額外用工作排程器在主視窗關閉後啟動每週提醒。選擇系統排程可以省去長駐主視窗，但受使用者登入、睡眠與通知設定影響。對只想處理今晚的場景，直接開一次模擬倒數比較容易核對。

下一篇用三分鐘的模擬倒數把提醒叫出來，核對延後前後的預定時間，最後手動取消。

[下一篇｜用模擬模式驗證延後與取消](../auto-shutdown-02-simulation/)
