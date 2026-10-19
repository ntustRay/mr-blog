---
title: "[News] MemHub v1.0.4：跨 Agent 記憶，要怎麼停止與刪除？"
description: "MemHub 把不同 AI 工具的授權對話匯入共享記憶。從 v1.0.4 的文件與測試程式，分清本機儲存、模型傳輸、背景服務與 debug 紀錄的生命週期。"
pubDate: 2026-10-19
category: AI
tags: [AI Agents, Coding Agents, Harness]
draft: false
references:
  - title: "Tencent Hunyuan：MemHub v1.0.4 release"
    url: "https://github.com/Tencent-Hunyuan/Hy-Memory/releases/tag/v1.0.4"
  - title: "MemHub README（v1.0.4）"
    url: "https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/README.md"
  - title: "MemHub Privacy（v1.0.4）"
    url: "https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/PRIVACY.md"
  - title: "MemHub：network egress tests（v1.0.4）"
    url: "https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/apps/core/tests/test_hy_network_egress.py"
---

換一個 Coding Agent，又要重講一次專案背景，共享記憶很有吸引力。但當某段對話不該再被使用時，也需要知道：停止匯入、撤權與刪除，分別會改變什麼？

騰訊混元的 Hy Memory repository 在 **2026 年 10 月 16 日**發布 MemHub 初版，**10 月 18 日**發布 [v1.0.4](https://github.com/Tencent-Hunyuan/Hy-Memory/releases/tag/v1.0.4)，附有 macOS arm64 App 與 macOS／Linux Runtime 等安裝檔。本文以 v1.0.4 tag 的文件與測試程式為準，沒有安裝產品、匯入真實對話或重跑模型評測。

## 這篇的重點

MemHub 值得以虛構資料試用跨工具接續，但目前仍是 preview。採用前要同時驗證資料如何進來、交給哪個模型處理，以及停止使用後留下哪些副本；本機資料庫只回答其中一部分。

## 本機儲存與模型處理，是不同路徑

[MemHub README](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/README.md)將產品定位為本機優先的共享記憶：彙整使用者授權的 AI 對話與程式工作紀錄，再讓獲授權的工具讀取。Hy Memory 則是底下的 SDK 與記憶引擎，兩者版本需要分開辨識。

[Privacy 文件](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/PRIVACY.md)明確說明，選擇第三方模型服務時，完成任務所需的授權內容會送到該服務。來源原文存在本機，不代表後續抽取與整理都在本機完成。

因此，評估時要分開確認來源讀取、模型處理與下游工具讀取。知道哪個 Agent 能搜尋記憶，仍不足以回答模型服務收到了哪些資料；把來源關掉，也不能直接推論先前保存的內容已經移除。

## 關視窗、卸載與清資料，效果不同

以下是發布版 [README](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/README.md) 與 [Privacy](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/PRIVACY.md) 描述的行為，不是本文實測結果：

| 動作 | 文件描述的結果 | 仍需留意 |
| --- | --- | --- |
| 關閉 Desktop UI | 系統服務管理的 Runtime 可繼續執行 | 不能把視窗消失當成同步已停止 |
| `memhub uninstall` | 移除服務與受管 Runtime 等安裝項目，預設保留記憶 | 刪除資料是另外的確認流程 |
| 診斷從 `debug` 切回 `info` | 停止後續模型正文記錄 | 已產生的 debug 檔不會自動消失 |

最後一項特別容易漏掉。文件指出 debug 模式可能將完整模型 prompt／response 寫入本機紀錄，內容可能包含授權對話。排錯結束後，除了恢復設定，也要檢查留下的檔案；分享紀錄前先去識別化，別直接把整份檔案貼進公開 issue。

刪除也要講清楚範圍。停止日後讀取、清除記憶庫、處理備份與已匯出的紀錄，是不同工作。若內容曾交給外部服務，本機刪除不能代替查核該服務的資料保留政策。

## 原始碼提供了驗證入口，還不能當成通過證明

repository 的 [network egress tests](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/apps/core/tests/test_hy_network_egress.py) 會監看 socket 連線，針對內建 embedding 的搜尋路徑檢查是否連網，並設計控制案例確認監看器能抓到連線。

這比只檢查設定裡有沒有 `localhost` 更具體。不過，該測試缺少 SDK 或內建權重時可能被略過；本文沒有執行它，也不能把這條搜尋路徑推廣成所有操作都離線。

若要導入，可先準備兩份不含秘密的虛構對話，放入可辨識的測試字串，再做這組驗收：

- 只授權其中一個來源，確認另一個來源未被匯入。
- 讓另一個已授權工具搜尋，檢查能否追溯到正確來源；撤權後重新確認讀取行為。
- 分別執行記憶寫入與搜尋，觀察實際對外請求，不把「搜尋沒連網」當成寫入也沒連網。
- 停止同步、解除安裝與刪除測試資料，逐步核對剩下的資料庫、服務與 debug 檔案。

這是建議驗證方案，尚未執行。第一次試用先不要接公司或個人的完整歷史紀錄，也不要以「召回得到內容」作為唯一成功條件。

既有的 [Copilot Rust migration 文章](../github-copilot-rust-migration-context/)談長任務如何交接 context；MemHub 多了一個跨工具、跨時間持續保存的資料層。它能否減少重講背景，和你能否掌握資料的停止、撤權與刪除，都應該進入採用判斷。
