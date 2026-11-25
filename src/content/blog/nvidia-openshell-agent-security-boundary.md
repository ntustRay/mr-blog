---
title: "[News] NVIDIA OpenShell：把 Agent 權限控制放到 Runtime"
description: "從 Agent 讀專案檔案、呼叫有憑證的 API 說起，理解 NVIDIA OpenShell 的執行限制與部署驗收。"
pubDate: 2026-09-29
updatedDate: 2026-10-17
category: "AI & Agents"
tags:
  - AI Agents
  - Security
  - NVIDIA
  - OpenShell
draft: false
references:
  - title: "NVIDIA — Open Agent Safety Platform 發布公告"
    url: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx"
  - title: "NVIDIA OpenShell — README 與現行文件入口"
    url: "https://github.com/NVIDIA/OpenShell"
---

如果 Coding Agent 可以讀 repo、執行指令，又能呼叫公司 API，專案裡的一句「請勿讀取設定檔」沒辦法代替檔案權限。驗收時可把假的金鑰放在測試工作區外，看看系統會不會拒絕讀取。如果檔案系統讓它打開，即使正常任務裡它多半會遵守提示，那份檔案仍在可觸及的範圍內。

NVIDIA 於 2026 年 9 月 28 日公布 Open Agent Safety Platform。OpenShell 是其中一段：它把 Agent 放進 sandbox，由執行環境限制檔案、程序和網路操作。官方也說明可在請求通過政策檢查後，才替核准的目的地附上 credential，讓 Agent 不必取得金鑰本身。[NVIDIA 發布公告](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx)｜[OpenShell README](https://github.com/NVIDIA/OpenShell)

## Agent 看不到 token，也可能有寫入權

假設 OpenShell 只允許 Agent 連工單 API，而它取得的服務權限同時能讀與刪工單。藏好 token 解決的是金鑰暴露，能刪哪一筆仍由 API 和授權範圍決定。接入時可用一個測試工單，確認讀取成功，超出工作範圍的寫入被拒絕，而且拒絕紀錄能對回那次任務。

公告另提到 Sentry，可放在 BlueField-4 DPU 上作為執行環境之外的 watchdog。評估一般開發機時，先確認自己部署的 OpenShell 版本有哪些限制能生效。以測試工作區比對允許和拒絕的檔案、網路與資源操作，再看政策變更需不需要批准，以及出錯後怎麼回退。[NVIDIA 對 Sentry 的說明](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx)
