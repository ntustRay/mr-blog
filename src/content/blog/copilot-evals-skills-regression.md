---
title: "[News] GitHub Copilot Evals：Skill 改完真的變好，還是這次剛好成功？"
description: "GitHub Copilot Evals 把 Skills、custom agents 與 MCP tools 做成可重跑的本機測試。整理 before／after 比較、trajectory、成本、敏感資料與 public preview 限制。"
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

修改一份 `SKILL.md` 後，Agent 這次順利完成任務，能不能證明新版 Skill 比較好？還不能。模型輸出有變異，repository 狀態、tool 回應與 grader 也會影響結果。若只留下成功截圖，很難知道進步來自 Skill，還是那一次剛好走對路。

GitHub 在 **2026 年 11 月 17 日**將 Copilot Evals 推進 public preview，讓使用者替 GitHub Copilot 的 Skills、custom agents 與 MCP tools 建立可重跑的測試，保存結果與 conversation trace，再比較修改前後的差異。它使用 Microsoft 的 Vally 作為本機 eval engine。

本文依 GitHub changelog、repository、Visual Studio Marketplace 與 Vally 文件整理，沒有安裝 extension，也沒有實際執行 eval。這個功能目前缺少獨立團隊的長期使用報告；官方頁面對 bundled MCP server 的 tool 數量也出現 15 與 20 的差異，反映 public preview 仍在快速變動。

## TL;DR

- Copilot Evals 解決的是 project customization 的回歸測試：固定任務、fixtures 與通過條件，重跑修改前後的 Skill、custom agent 或 MCP tool。
- Vally 會記錄完整 trajectory，包括每輪對話、tool calls 與 token usage。這有助於找出失敗原因，也可能把 prompt、model output、tool output 與本機資料寫進結果檔。
- 建立、驗證與比較已儲存結果不會呼叫模型；真正執行 eval、AI judge 或 grader test 會使用 Copilot 額度或產生成本，並以目前使用者的本機權限執行程式。
- 單次 before／after 仍不足以證明可靠度。代表性案例要重跑，並分開看輸出、檔案副作用、tool trajectory、成本與最差一次。
- 目前適合已使用 GitHub Copilot、願意先建立小型 regression suite 的團隊做受控 PoC。Python／remote MCP、跨 harness 比較與高風險 production automation 還不能只靠這套 preview。

## 它測的不是「哪個模型最強」

Copilot Evals 的主要對象是專案裡的 customization：

| 對象 | 可以驗證的問題 | 例子 |
| --- | --- | --- |
| Skill | 指令是否在正確情境被使用，輸出與檔案變更是否符合規則 | release notes 只列已完成 issue，保留 issue ID，不修改 input fixtures |
| Custom agent | 委派後是否完成指定工作，並遵守 agent instructions | review agent 只提出有證據的問題，不直接改檔 |
| MCP tool | tool 是否能被正確呼叫，回傳與副作用是否符合預期 | 本機 server 每次以 fresh process 啟動，確認參數與產出 |

GitHub 提供 `create`、`review`、`improve`、`run`、`compare`、`setup` 六個 Skills，也能從 `/eval` command、Evals Canvas 或 sidebar 操作。CLI 的 `/eval` 與 Canvas 目前需要 experimental mode；不開啟時，仍可用自然語言呼叫六個 Skills。

這與一般模型 leaderboard 的問題不同。Leaderboard 想比較模型在一組共享任務上的表現；project eval 要回答的是：「這份修改是否改善我在意的行為，而且沒有破壞其他條件？」任務、fixtures 與 grader 因此要由專案負責，不能直接借用一個總分代替。

## 一次 eval 如何產生證據

Vally 把一次執行拆成五段：stimulus 提供任務，executor 執行 Agent，trajectory 記錄過程，graders 檢查結果，最後產生 score。Copilot Evals 再把這個流程包成專案內可以保存與比較的操作。

實際建立測試時，可以先把通過條件拆成三層：

1. **最終輸出：** 必要欄位是否存在、內容是否符合格式、測試是否通過。
2. **副作用：** 哪些檔案應該新增或修改，哪些 input files 必須保持不變。
3. **執行路徑：** 是否呼叫指定 tool、是否把 secret 傳進不該使用的參數、是否出現多餘的高風險動作。

只檢查最後文字，很容易放過 hardcode、錯誤 tool 或不必要的檔案修改。只檢查 trajectory 也不夠，因為走了預期路徑不代表最終結果正確。兩者要一起看。

GitHub 建議把 eval definitions、fixtures 與 `.vally.yaml` 放進版本控制，讓團隊 review 同一組測試。Saved reports 與 grader test reports 則應留在 source control 之外，或在分享前逐一檢查內容。

## Before／after 要固定哪些條件

`/eval compare` 可以比較兩次 saved runs，也能準備 with／without Skill 的比較。要讓結果有意義，至少固定以下條件：

| 條件 | 為什麼要固定 |
| --- | --- |
| 任務與 fixtures | 避免新版碰到比較簡單的 input |
| Model 與 reasoning effort | 避免把模型升級誤認成 Skill 改善 |
| Repository commit | 程式碼與測試本身會改變任務難度 |
| Tool／MCP 版本 | Schema、回傳與權限可能已不同 |
| Graders 與 threshold | 評分規則改了，分數就不能直接比較 |
| Auth 與 runtime 設定 | 不同登入、feature flag 或 persisted settings 會改變行為 |

Vally 可以沿用 Copilot CLI 的登入，但官方警告，host-home mode 會把既有 Copilot settings 暴露給 eval run。若需要較可重現的環境，官方建議改用 token authentication；token 必須放在 environment variable，不能寫進 eval YAML 或 commit 到 repository。

即使上述條件都固定，單次通過仍可能只是抽樣運氣。本站先前整理 [Google ADK 2.14 multi-run evaluation](../google-adk-2-14-multi-run-eval/) 時，核心問題正是同一案例要重跑，才能看到 pass rate、worst run 與 crash。Copilot Evals 負責把 customization 納入可比較流程；可靠度門檻仍需要多個代表案例與重複執行。

一組小型 Skill regression suite 可以先這樣分配：

| 測試組 | 目的 | 建議觀察 |
| --- | --- | --- |
| 正常案例 | 確認主要任務可完成 | pass rate、檔案 diff、token 與時間 |
| 邊界案例 | 找出模糊指令與資料缺漏 | 最差一次、追問行為、錯誤分類 |
| 反例 | 確認不該啟用 Skill 時不會硬套 | false activation、無關修改 |
| 安全案例 | 驗證 secret、權限與不可逆操作 | tool arguments、approval、是否 fail closed |

本文沒有替這些門檻提供通用數字。付款、刪除與 production write 的容錯條件，應比 release notes 或文件摘要嚴格。

## 本機執行不代表沒有資料與權限風險

Copilot Evals 把 runner 與結果放在本機，這有利於檢查 project files，但不等於完全離線或 sandboxed。

依官方 README，儲存 eval、file validation、讀取與比較 saved results 不會呼叫模型。執行 eval、grader test、AI judge、setup script、tools 或 custom graders 則可能消耗 token／credit，也能以 host 的一般檔案與程式執行權限工作。每次執行前會揭露 effects 與預估成本，並要求核准；核准畫面不能取代 OS sandbox、最小權限 credential 與測試資料隔離。

Trajectory 與 saved reports 可能包含：

- prompt 與 model output；
- tool input／output；
- 本機 project data；
- conversation trace、usage 與錯誤資訊。

Standalone Plugin 的 telemetry 預設開啟。GitHub 表示 product telemetry 不包含 source code、prompt、model output、project path、repository name 或 raw error；saved results 保留在本機。Telemetry identifiers 是 pseudonymous，不是 anonymous，並可透過 `COPILOT_EVALS_TELEMETRY=off`、`DO_NOT_TRACK=1` 或 `OTEL_SDK_DISABLED=true` 關閉。

若公司環境要求離線安裝，release archive 可先下載與驗證；但執行模型仍需要 Copilot authentication。能離線安裝不等於能離線完成 eval。

## Public preview 的採用邊界

目前的功能有幾個明確限制：

- VS Code 的 MCP eval 每次只支援一個 local Node.js stdio server；Python MCP 與 remote MCP 尚未支援。
- Local runner 需要 Node.js、`@microsoft/vally-cli`、GitHub Copilot CLI 與 Git。CLI Plugin 與 VS Code 的最低 Node.js 版本不同。
- `/eval` command 與 Canvas 仍依賴 experimental mode 或 host capability；不同 Copilot host 的體驗不完全一致。
- Repository 採 GitHub Limited Use Source License，屬 source-available，不是 OSI open source；用途受 Authorized Tooling 與商業使用條款限制。
- 官方 README 目前寫 bundled MCP server 有 20 tools，Marketplace 頁面則寫 15 tools。導入前應以實際安裝版本的 manifest 與 `--version` 為準。

Repository 在 11 月 17 日同一天連續發布多個 prerelease，說明開發活動積極，也表示介面仍可能快速改動。現在沒有足夠獨立證據證明它在大型 monorepo、remote MCP 或企業 CI 已經穩定。

## 和既有文章的差異

本站先前的幾篇文章處理相鄰問題，但核心不同：

- [Paperclip Skill Versioning](../paperclip-skills-versioned-snapshots/)回答「當時讀到哪一版 Skill」，重點是來源、版本與回退。
- [Google ADK multi-run evaluation](../google-adk-2-14-multi-run-eval/)回答「同一案例為什麼要重跑」，重點是跨 run 的聚合與可靠度門檻。
- [176 組 coding-agent harness](../coding-agent-harness-176-configurations/)回答「harness 的哪個元件改變結果」，重點是 tool、planning 與 context 的組合。
- 本篇回答「專案內一份 Skill、custom agent 或 MCP 修改後，怎麼保留可重跑的 before／after 證據」。

Copilot Evals 把這些概念接成實際 workflow，但沒有自動解決版本鎖定、代表性資料、重複次數與 grader validity。它提供測試機制，測試設計仍由使用者負責。

## 採用判斷

如果團隊已使用 GitHub Copilot，而且 Skills 或 custom agents 已經影響日常開發流程，Copilot Evals 值得做小規模 PoC。先選一個高頻、可驗收的 Skill，建立 3 到 5 個正常、邊界與反例 cases；把 definitions 與 fixtures commit，results 排除在版本控制外，再比較同一 runtime 下的前後版本。

若主要目標是測 remote／Python MCP、比較不同 Agent harness，或在完全離線環境執行，這個 preview 目前不合適。高風險 automation 也不能只看一次 passing score；必須補上多次執行、權限隔離、人工核准與實際副作用驗證。

Copilot Evals 最有用的改變，是讓「我覺得新版 Skill 比較好」變成可以 review 的測試資產與失敗紀錄。是否真的比較可靠，仍要靠多案例、多次執行，以及對成本與最差結果的誠實比較。

## References

- [GitHub Copilot Evals public preview](https://github.blog/changelog/2026-11-17-github-copilot-evals-is-now-in-public-preview/)
- [github/evals repository](https://github.com/github/evals)
- [GitHub Copilot Evals — Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-evals)
- [Vally：How a run flows](https://microsoft.github.io/vally/)
- [Vally：Runtime Setup](https://microsoft.github.io/vally/get-started/runtime-setup/)
