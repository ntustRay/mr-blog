---
title: '[Insight] R Auto Shutdown 03｜計時測過以後，還要驗證哪一層？'
description: '從單次倒數的測試結果回到桌面介面、每週排程與系統通知，整理它們各自能證明的行為。'
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Dev Tools & Quality
tags: [Rust, egui, Scheduling]
series: auto-shutdown
seriesOrder: 3
references:
  - title: R Auto Shutdown 排程與通知行為
    url: https://github.com/ntustRay/rust-auto-shutdown/blob/e2641a9cf74413fa88704fd62061070d2fe134c2/README.md
  - title: 0.3.2 通知視窗程式碼
    url: https://github.com/ntustRay/rust-auto-shutdown/blob/e2641a9cf74413fa88704fd62061070d2fe134c2/src/notification.rs
---

上一回在測試裡從三分鐘走到剩兩分鐘，接著加十分鐘、取消，再走到原本會到期的時刻。這個結果證明計時核心接受了取消。要確認使用者真的來得及取消，還得看提醒視窗何時出現，以及桌面系統有沒有讓它顯示。

![完整版顯示提醒時，同時提供目標時刻、剩餘時間、延後與取消。](../../assets/project-series/auto-shutdown/02-active-reminder.webp)

## 從一個結果找對要檢查的檔案

| 看到的現象 | 回頭檢查 | 可以拿來判斷的證據 |
| --- | --- | --- |
| 延後 10 分鐘卻只剩 10 分鐘 | `src/lib.rs` 的 `Timer::extend` | 用固定 `Instant` 算出「當前剩餘＋600 秒」 |
| 取消後 UI 還在倒數 | `src/app.rs` 處理提醒視窗傳回的動作 | 同一個 `Timer` 已清空，下一次畫面更新可以重開 |
| 模擬模式也做了系統動作 | `Timer::poll` 的模式分支 | 到期時注入會計數的假執行器，預期呼叫次數為零 |
| 單次鬧鐘正常，每週提醒沒出現 | Windows 工作排程器與 `src/schedule.rs` | 下一次執行時間、登入中的使用者與本次執行紀錄 |
| 視窗正常，系統橫幅沒出現 | 對應作業系統的通知設定 | 在該平台的實際桌面核對權限、勿擾與橫幅 |

Windows 的每週規則由工作排程器保存。使用者在提醒上取消的是這一次；要停止之後每週觸發，要回主視窗停用每週排程。把兩種動作放到同一個「取消」裡，很容易連下週的提醒也一起刪掉。

## 怎樣才算這一版做完了？

本系列的程式範例可以在模擬模式驗證起算、延後、取消與到期。文章裡的桌面截圖也只展示模擬流程。跨平台交付時，另外記下平台、版本、觸發方式與觀察結果；Windows 系統橫幅、macOS／Linux 視窗最小化或還原，都需要各自的桌面環境。這些結果不能從 Rust 的單元測試推導出來。

[回到實作：用 Rust 與 egui 做倒數](../auto-shutdown-02-simulation/)
