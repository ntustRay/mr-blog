---
title: '[Insight] R Auto Shutdown 01｜把關機提醒拆成計時、視窗與系統排程'
description: '從半途延後十分鐘的例子，畫出 Rust 計時核心、egui 視窗與 Windows 工作排程器各自要保存的狀態。'
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Dev Tools & Quality
tags: [Rust, egui, Desktop]
series: auto-shutdown
seriesOrder: 1
references:
  - title: R Auto Shutdown 0.3.2 專案說明
    url: https://github.com/ntustRay/rust-auto-shutdown/blob/e2641a9cf74413fa88704fd62061070d2fe134c2/README.md
---

如果預定 23:30 關機，23:27 還在傳檔，按「延後 10 分鐘」後應該顯示 23:40。到了下週，同一條每週規則仍應該在 23:30 生效。程式因此要分開保存兩樣東西：**這一回合還剩多久**，以及**下一回合該在哪一天啟動**。

![實際提醒視窗，卡片顯示本次預定時間，下面有延後與取消動作。](../../assets/project-series/auto-shutdown/02-active-reminder.webp)

## 畫面上的動作，分別交給誰？

| 畫面或事件 | 接手的程式 | 它需要知道什麼 |
| --- | --- | --- |
| 輸入 3 分鐘、開始 | `src/app.rs` → `src/lib.rs` 的 `Timer` | 開始時刻、時長、模擬或實際模式 |
| 點延後、取消 | `src/notification.rs` 回傳動作，主程式更新同一個 `Timer` | 現在的剩餘時間、增加的分鐘數 |
| Windows 每週啟動提醒 | `src/schedule.rs` | 一週中的日期、時刻與這一回合的識別 |
| 倒數到期 | 計時核心判斷模式，實際模式才交給平台執行 | 現在是否仍有有效倒數、是否已處理 |

用一個單調遞增的 `Instant` 計算這回合的剩餘時間，介面再把預定時刻顯示給人看。這樣可以固定測試裡的「現在」：讓時間向前一分鐘只需傳入另一個值，測試可以立刻讀到結果。每週規則則需要本機日期與時區，因為星期幾和幾點才是使用者保存的資料。

## 這三篇會做出什麼

第二篇會建立一個 Rust 練習程式，寫出「延後」與「取消」，把同一份狀態接上 egui 的按鈕，再拿模擬模式的真實視窗核對。練習只需要 Rust 與桌面建置環境，沒有資料庫或雲端服務。最後一篇回到每週模式，辨認計時測試能證明哪些行為，以及哪一段需要作業系統接手。

[下一篇：寫出倒數核心，接到 egui 提醒視窗](../auto-shutdown-02-simulation/)
