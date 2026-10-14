---
title: "Claude Mods 把擴充點放進 Runtime：什麼時候 Skill 已經不夠？"
description: "Claude Code 的 function hooks 讓 plugin 介入 engine events。從官方內建 Mods 看擴充邊界，以及為何規則、執行與測試需要分開。"
pubDate: 2026-10-14
category: AI
tags: [AI Agents, Harness, Skills]
draft: false
references:
  - title: "Anthropic：Claude Code Mods source and testing guide"
    url: "https://github.com/anthropics/claude-code/blob/main/mods/README.md"
---

如果一個規則必須在每次操作時生效，只把它寫進 Skill，還需要模型讀到、理解並照做。某些工作更適合交給執行環境處理，例如 UI 更新、事件記錄與可測試的流程攔截。

Claude Mods 的重點，是把擴充位置放進 Claude Code engine 的事件流程。這篇依 2026-10-14 的 [Anthropic 官方 repository](https://github.com/anthropics/claude-code/blob/main/mods/README.md)整理，沒有在本機安裝或測試 Mod。

## 官方實作到底是什麼？

官方 README 將 Mod 定義成行為放在 hooks module 的 Claude Code plugin，以 `register(on, options)` 註冊 function hooks。

其公開原始碼包含這些內建例子：

| Mod | 官方描述的用途 |
| --- | --- |
| `diff` | 在 transcript 旁顯示尚未 commit 的變更 |
| `agents-md` | 控制如何載入 AGENTS.md 與 CLAUDE.md |
| `sec-default` | 保護組織管理的設定與政策不被個人安裝的 plugins 影響 |
| `telemetry` | 接入內建 telemetry events |

以上是[官方 source 的行為說明](https://github.com/anthropics/claude-code/blob/main/mods/README.md)。它沒有意味著任意第三方 Mod 都具有同等權限或安全保證。

## Instruction 與 Runtime Code 解的問題不同

可以用需求決定放哪一層：

| 需求 | 比較合適的起點 |
| --- | --- |
| 告訴 Agent 如何理解專案、寫 PR | repository instructions 或 Skill |
| 修改檔案後要跑哪些檢查 | 既有 hook、script 或 CI |
| 介入 engine events、加入 runtime UI 行為 | 評估 Mod |

這是選型建議。Mods 不會讓 Skill 失去用途；專案知識仍然適合用文件表達，尤其需要工程師也能直接閱讀的規則。

例如「review 時留意 public API 相容性」適合寫進指令。若目標是保證未通過某個 deterministic check 的產物不能部署，就要把 gate 放到部署路徑，而不是期待模型每次主動記得。

## 多一個 Mod，也多一份要維護的 Code

從文字指令換成 function hooks，能把部分行為變成可執行、可測試的邏輯。代價是開始需要處理 runtime API、事件順序、錯誤傳播，以及不同 plugins 一起載入的行為。

可以先問三個問題：

- 這個需求是否已經能用一般 hook 或 CI 清楚完成？
- engine 更新後，怎麼確認 Mod 還按照預期運作？
- Mod 失敗時，主流程要停止，還是允許繼續？

如果只是想換文章格式，先維持 Skill 通常比較省維護成本。若確實需要 runtime 行為，才值得承擔這層 code。

## 從官方範例學測試，別急著攔整個流程

官方 README 提供 `claude plugin test` 的測試流程，讓測試透過 engine interface 和 hooks 驗證行為。

可參考的設計方式，是先做單一、可觀察的功能。例如讀取當前 diff 並呈現，不同時修改 prompt、工具政策與 session 狀態。需求越集中，越容易判斷是 Mod 本身還是其他 extension 出了問題。

Runtime customization 讓 Harness 有更多可編程的空間。採用前要能說清楚：**哪個行為需要由程式保證，以及用什麼測試確認它沒有改變其他流程。** 只增加擴充能力，還不足以成為安裝理由。
