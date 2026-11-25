---
title: "[News] GitHub Copilot Evals：Skill 改完真的變好，還是這次剛好成功？"
description: "用 GitHub Copilot Evals 比較改版前後的 Skill。固定 repo、題目和驗收規則，再一起看結果、操作與成本。"
pubDate: 2026-11-18
category: "AI & Agents"
tags:
  - AI Agents
  - Skills
  - MCP
  - Testing
draft: false
references:
  - title: "GitHub Copilot Evals public preview"
    url: "https://github.blog/changelog/2026-11-17-github-copilot-evals-is-now-in-public-preview/"
  - title: "github/evals repository"
    url: "https://github.com/github/evals"
  - title: "GitHub Copilot Evals — Visual Studio Marketplace"
    url: "https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-evals"
  - title: "Vally：How a run flows"
    url: "https://microsoft.github.io/vally/"
  - title: "Vally：Runtime Setup"
    url: "https://microsoft.github.io/vally/get-started/runtime-setup/"
relatedPostIds:
  - google-adk-2-14-multi-run-eval
  - paperclip-skills-versioned-snapshots
  - tool-review-34-agents-rules-workflows-skills-mcp
  - coding-agent-harness-176-configurations
---

改了一份 `SKILL.md`，Agent 這次終於沒有動測試檔。要知道是改版有效，還是這次剛好走對，可以拿同一個 commit、同一個輸入和同一套驗收重跑舊版與新版。GitHub 於 2026 年 11 月 17 日把 Copilot Evals 開到 public preview，讓 Skills、custom agents 和 MCP tools 的測試可在專案中保存、重跑與比較。[GitHub 公告](https://github.blog/changelog/2026-11-17-github-copilot-evals-is-now-in-public-preview/)｜[github/evals](https://github.com/github/evals)

## 一題可以同時驗答案和過程

拿「修 bug，但只可改 parser」當例子。最終測試要過，diff 也不能動到 fixtures 或測試程式。若 Agent 多跑三輪或請人補做，這些時間也該留在結果。底層 Vally 會接題目、執行、記錄 trajectory，再由 grader 評分。比較前固定模型、工具版本、權限與初始工作區，在幾個有代表性的題目跑多輪。失敗一次時，能沿 trace 找到斷在哪一步。[Vally run 流程](https://microsoft.github.io/vally/)｜[重跑與計分的例子](../google-adk-2-14-multi-run-eval/)

## Runner 在本機，仍需看它能讀什麼

保存或比較既有結果可在本機做。跑 Agent 或 AI grader 時仍可能呼叫模型，setup script 和自訂 grader 也按執行環境的權限運行。用獨立測試 repo 和必要的權限，登入方式和資料傳送同樣要納入設定。Preview 當時的 VS Code MCP eval 只支援每次一個 local Node.js stdio server。所需 CLI、Node 版本和 experimental 模式，以各入口的說明為準。[GitHub Evals 支援範圍](https://github.com/github/evals)｜[Vally runtime 設定](https://microsoft.github.io/vally/get-started/runtime-setup/)
