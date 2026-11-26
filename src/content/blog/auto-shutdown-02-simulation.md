---
title: '[Guide] R Auto Shutdown 02｜用模擬模式驗證延後與取消'
description: 開啟單次三分鐘倒數，從提醒視窗核對延後結果、縮小後的倒數與取消入口。
pubDate: 2026-11-26
category: Dev Tools & Quality
tags: [Rust, egui, Desktop]
series: auto-shutdown
seriesOrder: 2
references:
  - title: 0.3.2 操作與安裝說明
    url: https://github.com/ntustRay/rust-auto-shutdown/blob/e2641a9cf74413fa88704fd62061070d2fe134c2/README.md
  - title: 0.3.2 對應 GitHub Actions 建置
    url: https://github.com/ntustRay/rust-auto-shutdown/actions/runs/45642612323
---

用一回 **三分鐘的單次模擬倒數**檢查提醒、延後和取消。三分鐘落在最後五分鐘內，所以按下開始就會出現提醒。以下截圖使用對應公開 commit `e2641a9` 的 Linux x64 CI 執行檔（v0.3.2），全程保留模擬模式。

## 1. 開啟桌面程式

從 [GitHub Actions](https://github.com/ntustRay/rust-auto-shutdown/actions/runs/45642612323) 的 Artifacts 選平台與架構，下載後解壓縮。Windows 開啟 `r-auto-shutdown.exe`。macOS／Linux 再解開內層的 `.tar.gz`，於已登入的桌面工作階段執行 `./r-auto-shutdown`。macOS 產物尚未公證，遇到系統阻擋時可依專案說明從原始碼建置。

也可以從原始碼建置。專案標示需要 Rust 1.88 或更新版本和相應平台的建置工具，本系列的 Linux 建置檢查使用 Rust 1.100.0。

```sh
git clone https://github.com/ntustRay/rust-auto-shutdown.git
cd rust-auto-shutdown
git checkout e2641a9cf74413fa88704fd62061070d2fe134c2
cargo run --release --locked
```

Ubuntu 等 Linux 桌面需有 `fontconfig` 和可供應用程式讀取的繁體中文字型。若啟動報 `InvalidFont`，先用 `fc-match --format '%{file}\n' ':lang=zh-tw'` 看 fontconfig 選中了哪個檔案，再確認是支援的 TTF 或 OTF。這次在隔離的 Linux 環境用 Noto Sans CJK TC OTF 截圖。

## 2. 啟動三分鐘模擬倒數

在「只執行這一次」選「幾分鐘後」，將「倒數分鐘」改成 `3`。確認「模擬模式」仍勾選，然後按「開始倒數」。Windows 若顯示兩種模式頁籤，請選「單次倒數」。此練習透過畫面上的勾選確認執行模式，因為 `--dry-run` 啟動旗標不會覆寫已儲存的設定。

![R Auto Shutdown 的單次倒數設定畫面。倒數分鐘為三，模擬模式保持勾選。](../../assets/project-series/auto-shutdown/02-simulation-settings.webp)

提醒的標題會顯示「關機提醒 · 模擬模式」。在卡片中央記下「預定」時間。右上角是最小化，下方有延後和取消。

![R Auto Shutdown 模擬倒數提醒，顯示預定時間與延後、取消控制。](../../assets/project-series/auto-shutdown/02-active-reminder.webp)

## 3. 延後十分鐘，再取消

1. 按「延後 10 分鐘」。核對提醒上的預定時刻比上一步晚十分鐘，剩餘時間也增加。
2. 有工作列或 Dock 的桌面，可以按提醒右上角的「最小化」，再從工作列或 Dock 還原。確認時間還在走。部分 Linux 桌面會自行決定是否支援最小化及還原。
3. 按「取消本次關機」。提醒應關閉，主視窗不再顯示進行中的倒數，並顯示取消訊息。

![延後後的提醒仍顯示模擬模式，預定時間從 10:35:26 變為 10:45:26。](../../assets/project-series/auto-shutdown/02-extended-reminder.webp)

![按取消後提醒關閉，主視窗底部顯示「已取消本次倒數」。](../../assets/project-series/auto-shutdown/02-cancelled.webp)

Windows 的系統橫幅受通知和勿擾設定影響。驗本篇流程時，先看程式自己的提醒視窗與主視窗狀態。Windows 橫幅需要另外在 Windows 的桌面工作階段確認。

[下一篇｜關閉視窗、取消當次與停用排程](../auto-shutdown-03-schedule-boundaries/)
