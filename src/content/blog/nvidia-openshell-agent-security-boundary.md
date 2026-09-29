---
title: "快訊：NVIDIA OpenShell，把 AI Agent 關進真正的安全邊界"
description: "NVIDIA 發布 Open Agent Safety Platform。OpenShell 把 Agent 的檔案、網路與 credential 權限移到 runtime policy 控制，Sentry 再把監控延伸到獨立硬體層。"
pubDate: 2026-09-29
category: AI
tags:
  - AI Agents
  - Security
  - NVIDIA
  - OpenShell
draft: false
references:
  - title: "NVIDIA — NVIDIA Launches Open Agent Safety Platform to Secure Agents From Testing to Deployment"
    url: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx"
  - title: "NVIDIA Technical Blog — NVIDIA Open Agent Safety Platform: A Reference for Continuous In-Silicon Agent Monitoring"
    url: "https://developer.nvidia.com/blog/nvidia-open-agent-safety-platform-a-reference-for-continuous-in-silicon-agent-monitoring/"
  - title: "NVIDIA OpenShell — Official GitHub Repository"
    url: "https://github.com/NVIDIA/OpenShell"
  - title: "NVIDIA OpenShell — Security Policy"
    url: "https://github.com/NVIDIA/OpenShell/blob/main/architecture/security-policy.md"
---

想像你請了一個能力很強的助理。

他可以幫你開電腦、看文件、登入 GitHub、執行程式，甚至使用公司的 API Key。

問題來了。

你會選擇：

> 跟他說：「這些資料很重要，千萬不要亂碰。」

還是直接把不該進去的房間鎖起來，把鑰匙放在他拿不到的地方？

現在很多 AI Agent 的安全設計，其實還很接近第一種。

我們用 system prompt 告訴 Agent：

```text
不要讀敏感資料
不要把 secret 傳出去
不要執行危險指令
```

但 Agent 已經開始擁有 shell、filesystem、browser、API、credentials，甚至能自主工作幾十分鐘、幾小時。

只靠一句「不要做」，和真正的權限控制是兩回事。

2026 年 9 月 28 日，NVIDIA 發布 [Open Agent Safety Platform](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx)。

其中最值得注意的**核心部分**，就是開源的 [OpenShell](https://github.com/NVIDIA/OpenShell)。

它處理的問題很直接：

> **Agent 可以很有能力，但它實際能做什麼，不應該由 Agent 自己決定。**

## OpenShell 是什麼？

OpenShell 是 NVIDIA 開源的 Agent runtime。

可以把它理解成 Agent 外面的一層「安全房間」。

Agent 還是可以：

- 執行 command
- 存取 filesystem
- 呼叫 API
- 使用 credentials
- 連線外部服務

但這些操作都必須經過 OpenShell 的限制。

例如 Agent 想做：

```text
讀取 ~/.ssh
```

runtime 可以直接阻止。

Agent 想連：

```text
unknown-server.com
```

network policy 可以擋掉。

Agent 想把資料 POST 到某個服務，即使同一個 domain 允許 GET，POST 仍然可以被禁止。OpenShell 的官方範例就示範了 GitHub API 的 GET 可以通過、POST 被 L7 policy 擋下來。[Security Policy](https://github.com/NVIDIA/OpenShell/blob/main/architecture/security-policy.md) 也說明了 filesystem、process、network 與 provider access 分別由不同層次的 policy 控制。

這些限制不是寫在 prompt 裡。

它們存在 Agent 外面的 runtime、OS 與 network policy。

## Prompt 是規則，Runtime 才是門鎖

Prompt 很像公司的員工守則。

你可以寫：

> 不得把公司資料帶出去。

但真正重要的系統，不會因為已經寫了員工守則，就取消門禁、權限管理和資料存取控制。

Agent 也是一樣。

Prompt 可以告訴 Agent：

```text
不要讀這個檔案
```

OpenShell 做的是：

```text
你沒有權限讀這個檔案
```

兩者差異很大。

前者依賴 Agent 遵守指令。

後者即使 Agent 判斷錯誤、遇到 prompt injection，或執行了有問題的程式，runtime 仍然可以拒絕操作。

[OpenShell 官方文件](https://github.com/NVIDIA/OpenShell)描述的分工很清楚：每個 Agent 都在隔離的 sandbox 中執行，kernel controls 限制 file access 和 system calls，所有 outbound network connection 也會經過 policy check。

可以簡化成：

```text
Agent
  ↓
OpenShell
  ↓
Filesystem / Network / Credential Policy
  ↓
Operating System
```

Agent 負責決定它想做什麼。

Runtime 負責決定它到底能不能做。

## API Key 也不需要真的交給 Agent

這也是 OpenShell 很值得注意的一點。

現在開發 Agent，很常看到這種設定：

```text
GITHUB_TOKEN=...
OPENAI_API_KEY=...
AWS_SECRET_ACCESS_KEY=...
```

然後把整個 environment 交給 Agent。

這代表只要 Agent 可以讀 environment，它理論上也可能讀到 secret。

OpenShell 採取另一種方式。

Credential 可以由 runtime 管理。OpenShell 官方說明中，Agent 不需要看到真正的 credential；只有 request 通過 policy，而且目的地符合 provider 授權範圍時，runtime 才會把 credential 綁到 request。

流程大概是：

```text
Agent
  ↓
我要呼叫某個 API
  ↓
OpenShell 檢查 policy
  ↓
允許
  ↓
runtime 才替 request 加上 credential
```

Agent 可以使用 credential，但不一定需要知道 credential 本身。

這和直接把所有 secret 放進 Agent environment，是兩種完全不同的 authority model。

## 「可以連 GitHub」其實還是太寬

傳統 allowlist 可能只寫：

```text
github.com → allow
```

但「可以存取 GitHub」包含很多完全不同的行為：

```text
讀 repository
下載 dependency
建立 issue
建立 PR
push code
修改 release
```

OpenShell 的 network policy 可以繼續往下限制 destination、calling binary，以及 HTTP method / path。

也就是說，權限可以從：

```text
你能不能使用 GitHub？
```

變成：

```text
你可以在 GitHub 做哪些事情？
```

對 Coding Agent 來說，這個差異很重要。

## Agent 也不能自己幫自己開權限

還有一個問題。

假設 Agent 發現自己缺少權限，然後說：

```text
我需要連線到 another-server.com
請把它加入 allowlist
```

如果系統直接照做，sandbox 很快就失去意義。

OpenShell 因此加入 policy proving。官方 README 說明，在 policy change 被接受前，系統會以 formal verification 檢查它新增加了哪些權限，例如：

- 新的 host access
- 帶 credential 的新連線範圍
- 新的 API method

有風險的 authority expansion 可以被攔下來，等待 human review。

整套設計可以簡化成：

```text
Agent 決定它想做什麼
        ↓
Policy 決定它被允許做什麼
        ↓
Runtime 決定操作是否真的執行
```

Reasoning 和 authority 被拆開了。

## NVIDIA 還把監控搬到 Agent 主機之外

OpenShell 之外，NVIDIA 同時公布 **Sentry**。

依照 [NVIDIA 官方公告](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Launches-Open-Agent-Safety-Platform-to-Secure-Agents-From-Testing-to-Deployment/default.aspx)，Sentry 是運行在 BlueField-4 DPU 上的 out-of-band watchdog，用來持續監控 Agent behavior。

概念很像監視器。

如果監視器就裝在 Agent 自己可以控制的電腦裡，那台電腦一旦出問題，監控系統也可能一起失去可信度。

NVIDIA 因此把這一層監控放到 workload 外部的硬體層。

整體大概變成：

```text
Model
  ↓
Agent
  ↓
OpenShell Runtime
  ↓
OS / Network Policy
  ↓
Sentry Hardware Monitoring
```

安全控制開始形成多層邊界，而不是全部塞在 Agent 本身。

## 這次真正要記住的重點

OpenShell 會不會成為未來的標準，現在還太早。

它的 production maturity、Policy Prover 能覆蓋多少風險、整體管理成本，都還需要更多實際部署案例。

但 NVIDIA 這次展示的架構方向很清楚。

當 Agent 只能回答問題時，prompt restriction 可能已經能處理不少風險。

當 Agent 開始：

```text
讀你的檔案
操作 GitHub
使用 API Key
執行 shell
下載 dependency
修改程式
建立 subagent
長時間自主運作
```

安全問題就不能只留在 prompt。

真正可靠的限制，需要存在 Agent **無法自己修改、無法自己繞過、也不需要靠自己遵守** 的地方。

如果只記得一句：

> **不要只告訴 Agent 哪些事情不能做，要讓系統真的讓它做不到。**

Agent 的能力可以繼續增加。

**Authority 必須被鎖在 Agent 外面。**
