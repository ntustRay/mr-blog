---
title: "[News] MemHub v1.0.4：跨 Agent 記憶，要怎麼停止與刪除？"
description: "用一段測試對話追 MemHub v1.0.4 的匯入、處理、停止和刪除，分清服務與 debug 紀錄。"
pubDate: 2026-10-19
category: "AI & Agents"
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

工作用 Agent 換了一套，原本交代過的 repo 背景得講第二次，這就是共用記憶能省下的事。但如果那段對話後來不能再用，關掉視窗是不是真的停了？已匯入的內容要到哪裡刪？騰訊混元於 2026 年 10 月 16 日首次發布 MemHub，10 月 18 日更新到 v1.0.4。這篇按該版本文件追這幾件事。[MemHub v1.0.4](https://github.com/Tencent-Hunyuan/Hy-Memory/releases/tag/v1.0.4)

MemHub 匯入使用者授權的 AI 對話與工作紀錄，讓獲准的工具查詢。Hy Memory 是底下的 SDK 和引擎。資料存在本機，仍要看模型在何處處理。若設定外部模型或某個功能會連網，讀取本機內容與把內容送給模型是兩段路徑。[README](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/README.md)｜[Privacy](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/PRIVACY.md)

## 要停同步、卸載，還是刪除內容？

| 動作 | 文件描述的結果 | 仍需留意 |
| --- | --- | --- |
| 關閉 Desktop UI | 系統服務管理的 Runtime 可繼續執行 | 不能把視窗消失當成同步已停止 |
| `memhub uninstall` | 移除服務與受管 Runtime 等安裝項目，預設保留記憶 | 刪除資料是另外的確認流程 |
| 診斷從 `debug` 切回 `info` | 停止後續模型正文記錄 | 已產生的 debug 檔不會自動消失 |

可以拿一段沒有敏感資料的測試對話走一遍。停止服務後，看會不會再匯入新訊息；撤回來源授權後，看既有內容還找不找得到；刪除後，另外看舊的 debug 檔或備份。文件提到 debug 模式可能保留完整模型請求與回應。切回 info 只影響後續記錄。

原始碼的 egress tests 會監看 socket，檢查內建 embedding 的搜尋路徑是否出網。那份測試可用來確認涵蓋哪條路徑，並不能代表每種設定都已測過。若準備放工作資料，先按自己的版本、模型和診斷設定做一次測試。[v1.0.4 egress 測試](https://github.com/Tencent-Hunyuan/Hy-Memory/blob/v1.0.4/memhub/apps/core/tests/test_hy_network_egress.py)
