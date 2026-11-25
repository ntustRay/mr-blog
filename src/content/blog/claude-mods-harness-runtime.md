---
title: "[News] Claude Mods 把擴充點放進 Runtime：什麼時候 Skill 已經不夠？"
description: "從 Claude Code 內建 Mod 看 hook 在哪個時點執行，並區分專案指引、互動擴充和 CI 檢查。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, Harness, Skills]
draft: false
references:
  - title: "Anthropic：Claude Code Mods source and testing guide"
    url: "https://github.com/anthropics/claude-code/blob/main/mods/README.md"
---

「review 時注意 breaking changes」適合寫進 Skill，因為它能交代專案有哪些公開 API、遇到哪些情況要停下來確認。另一種需求是工具一完成，就把 diff 刷到介面。那件事有明確的執行時點，放到事件 hook，程式就能在事件到達時更新。

2026 年 10 月 14 日查閱的 Claude Code 官方原始碼，把 Mod 定義成提供 hooks module 的 plugin。開發者透過 `register(on, options)` 註冊 function hooks，Claude Code engine 發出對應事件時執行。可從內建 Mods 看事件如何接到介面或工作流程；第三方可用的事件與權限仍以實際版本為準。[Anthropic Mods 原始碼與測試說明](https://github.com/anthropics/claude-code/blob/main/mods/README.md)

## 需要強制通過的檢查，放在哪裡？

如果公司規定相容性測試沒過就不能上線，CI 或部署端要有攔截。有人從其他入口提交時，一樣需要那個檢查。Mod 比較適合處理 Claude Code 操作當下的事，例如一個工具執行完要顯示什麼、應留下哪個事件。

可以從只讀取和顯示 diff 的 hook 開始，按 README 的 `claude plugin test` 路徑驗證它在預期事件觸發。再加一個讀取失敗的情境，決定應提示使用者，還是中止流程。穩定後如果要加入更多 hook，測試也要涵蓋載入多個 plugin 時的事件順序。[官方測試指南](https://github.com/anthropics/claude-code/blob/main/mods/README.md)
