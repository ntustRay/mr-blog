---
title: "[News] Cursor Marketplace 的 Claude Code Extension 遭植入後門：解除安裝還不夠"
description: "Cursor 說明兩個惡意 Extension 版本及暴露時段。從盤點、隔離、清除到輪替，釐清解除安裝後要查什麼。"
pubDate: 2026-10-31
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - Security
draft: false
references:
  - title: "Cursor：Claude Code extension security notice"
    url: "https://cursor.com/blog/claude-code-extension-security-notice"
  - title: "Phorion：Technical analysis of the malicious Claude Code extension"
    url: "https://phorion.io/blog/offical-claude-code-vsx-compromise/"
  - title: "Hacker News：Claude Code extension security notice discussion"
    url: "https://news.ycombinator.com/item?id=50300683"
relatedPostIds:
  - nvidia-openshell-agent-security-boundary
  - paperclip-skills-versioned-snapshots
  - android-studio-rabbit-2-acp
---

IDE extension 一開啟就可能執行，事後按 Uninstall 只會移除 extension 本身。如果惡意版本已在系統建立其他項目，那些項目可能繼續留在機器上。Cursor 於 2026 年 10 月 29 日公告，Cursor Marketplace 的 `Anthropic.claude-code` 2.1.312 與 2.1.313 在 Windows 和 macOS 出現惡意版本。[Cursor 原始安全公告](https://cursor.com/blog/claude-code-extension-security-notice)

## 先核對來源、時間和版本

官方列的 Marketplace 暴露時段是美西 10 月 29 日 02:27–13:35，台灣約 10 月 29 日 17:27 至隔日 04:35。先從安裝與更新歷史比這個範圍，也確認來源是 Cursor Marketplace。找不到版本時，以官方頁面的主機指標來查。調查重點是 extension 移除之後，系統是否仍留有異常存取或持續執行的項目。[受影響範圍及官方查核指標](https://cursor.com/blog/claude-code-extension-security-notice)

若有暴露跡象，先隔離設備並保留紀錄，依官方最新程序和公司事故流程處置。該環境中可能可見的高權限憑證，需要從可信設備評估撤銷或輪替。完成之後再核對運行中的程序、受影響帳戶與稽核紀錄。這些檢查比確認編輯器列表裡少了一個套件更能說明風險是否已處理。[Cursor 清理與後續更新](https://cursor.com/blog/claude-code-extension-security-notice)

Cursor 表示已移除惡意版本並處理 Marketplace 相關金鑰。團隊管理 IDE extension 時，可以把來源、publisher、版本和必要權限一起記錄。會接觸正式憑證的工作區，通常值得把更新先跑在測試環境，保留已核准版本和回退方式。[Cursor 對 Marketplace 的處置](https://cursor.com/blog/claude-code-extension-security-notice)
