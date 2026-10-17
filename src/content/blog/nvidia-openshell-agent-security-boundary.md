---
title: "[News] NVIDIA OpenShell：把 Agent 權限控制放到 Runtime"
description: "NVIDIA 在 2026-09-28 公布 Open Agent Safety Platform。整理 OpenShell 的權限執行邊界、credential 管理與採用前要驗證的限制。"
pubDate: 2026-09-29
updatedDate: 2026-10-17
category: AI
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

Coding Agent 若能讀檔、跑 shell、呼叫外部 API，就需要由執行環境限制它能操作的範圍。寫進 prompt 的規則仍有用途，但資料存取能否被拒絕，必須在實際執行路徑驗證。

NVIDIA 在 **2026-09-28** [公布 Open Agent Safety Platform](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx)，包含 OpenShell 軟體與 Sentry reference system design。本篇依官方公告與文件整理，2026-10-17 修訂，沒有部署或攻防實測。

## 這篇的重點

OpenShell 將檔案、process、network 與 credentials 的控制放到模型外部。對可操作 repository 的 Agent，這提供一個值得評估的執行邊界；效果仍取決於部署環境、policy 與實際涵蓋的路徑，不能視為消除所有風險的保證。

## 官方說明的控制範圍

[OpenShell README](https://github.com/NVIDIA/OpenShell)描述 kernel-level enforcement、sandbox、連線前的 policy 檢查，以及向核准 endpoint 發出 request 時才加入 credentials 的設計。

這些責任可以分開檢查：

| 責任 | 想避免的情況 | 仍需要驗證的事 |
| --- | --- | --- |
| Filesystem／process isolation | 任務越出允許的檔案與系統操作範圍 | mount、可執行程式與平台支援 |
| Network policy | 對未核准的目的地發送請求 | 路由、代理與 policy 實際涵蓋哪些請求 |
| Credential binding | 把真實 secret 直接交給模型或子程序 | provider 設定、目的地限制與撤權方式 |
| Policy change review | 在執行中不經檢查地增加權限 | 誰可以批准、變更記錄與回退 |

這張表是部署檢查建議，並非官方配置檔格式。即使網路允許連某個 API，API 內部「哪位使用者可以改哪份資料」仍需要業務授權。

README 也說明，套用 policy 變更前會使用 formal verification 標出新增存取權限。這能協助檢查 policy 的權限差異，不能延伸成整個系統或任務語意都經過形式驗證。

## Credential 不直接暴露，仍要限制可用操作

假設 runtime 替 Agent 的 request 加入 token，Agent 可能看不到 token，卻仍能用它執行被允許的操作。若該 token 能刪除整個專案，而且 request 也被允許，隱藏 secret 本身不會阻止刪除。

因此驗收不能只檢查 environment 裡有沒有金鑰，還要確認目的地、操作與資源範圍。允許讀取資料和允許寫入資料，應有可區分的規則與測試。

對小型內部工具，可以先把憑證縮到單一測試資源，用可撤回的操作確認行為。若現有 sandbox 已滿足需求，是否增加 OpenShell，要比較 policy 管理、稽核與維運的實際收益。

## Sentry 是另一個部署層次

依 [NVIDIA 公告](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx)，Sentry 在 BlueField-4 DPU 上作為 out-of-band watchdog 監控 Agent。它屬於包含硬體的 reference design，不能理解成安裝 OpenShell CLI 就同時擁有這一層監控。

軟體 sandbox、policy 檢查與外部監控提供不同證據。評估時要寫明實際部署了哪一層，避免把平台整體宣稱當作自身環境已具備的能力。

## 採用前先驗證拒絕路徑

以下是待執行的測試設計，本文沒有宣稱通過：

1. 用測試工作區驗證允許的檔案可讀，範圍外的測試檔案被拒絕。
2. 確認核准 endpoint 可連線，未核准 endpoint 被阻擋。
3. 驗證受限操作被拒絕，且 logs 能連回該次任務。
4. 檢查 policy 擴權需要的批准方式、變更記錄與回退。
5. 記錄平台版本、policy 與執行成本，再判斷是否適合接入既有 Harness。

評估時沿用 repository 指向的現行文件，並記錄實際部署版本。安全邊界必須對得上該版本的實作與設定，通過一組測試也不能保證未測路徑沒有問題。
