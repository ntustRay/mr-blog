---
title: "[News] Open WebUI 0.13.3：排程 Coding Agent 連上你的電腦，權限邊界在哪？"
description: "Open WebUI 讓排程記住本機終端和工作資料夾。用一個 repo 的情境說明應由哪一層限制權限。"
pubDate: 2026-11-09
category: "AI & Agents"
tags:
  - AI Agents
  - Coding Agents
  - Security
  - Harness
draft: false
references:
  - title: "Open WebUI v0.13.1 release"
    url: "https://github.com/open-webui/open-webui/releases/tag/v0.13.1"
  - title: "Open WebUI v0.13.3 release"
    url: "https://github.com/open-webui/open-webui/releases/tag/v0.13.3"
  - title: "Open WebUI Tether documentation"
    url: "https://docs.openwebui.com/ecosystem/tether/"
  - title: "Open WebUI Coding Agents documentation"
    url: "https://docs.openwebui.com/features/open-terminal/coding-agents/"
  - title: "Open Terminal security policy"
    url: "https://github.com/open-webui/open-terminal/blob/main/SECURITY.md"
  - title: "Tether changelog"
    url: "https://github.com/open-webui/tether/blob/main/CHANGELOG.md"
relatedPostIds:
  - nvidia-openshell-agent-security-boundary
  - cloudflare-browser-agent-internal-hosts
  - hermes-agent-unified-session-gateway
---

人在手機開 Open WebUI，下指令讓家裡的 Coding Agent 跑測試。若再加一條每天的排程，執行時可能沒人在電腦前。Open WebUI 於 2026 年 11 月 8 日台北時間發布 v0.13.1，後續 v0.13.3 補上 Agent automation 與終端切換相關修正。Tether 透過向外連線接上遠端介面，實際跑命令的是本機 Open Terminal。[v0.13.1](https://github.com/open-webui/open-webui/releases/tag/v0.13.1)｜[v0.13.3](https://github.com/open-webui/open-webui/releases/tag/v0.13.3)｜[Tether 文件](https://docs.openwebui.com/ecosystem/tether/)

## 工作資料夾只決定從哪裡開始

假設排程選了專案 A 的資料夾。Open Terminal 仍以啟動服務的帳號權限執行，有資格碰到專案 B，就有可能讀到那裡。官方安全政策也把 Open Terminal API key 定義成完整權限憑證。Tether 的登入、token 到期和更新則限制誰能建立連線，兩邊都要檢查。[Open Terminal 安全政策](https://github.com/open-webui/open-terminal/blob/main/SECURITY.md)｜[Tether session 說明](https://docs.openwebui.com/ecosystem/tether/)

只想給排程一個 repo，可以用獨立帳號或 container，掛入那個 repo 和必要工具，憑證只給測試用途。要驗收就放兩份假資料，一份允許讀、一份刻意放到工作範圍之外。然後測排程重啟時會不會重做寫入，等待批准時會不會停住。若開啟連線到現有 Chrome 等便利功能，也要算上它取得的登入狀態。官方 changelog 可核對 direct HTTP、瀏覽器與不同版本的前提。[Coding Agents 文件](https://docs.openwebui.com/features/open-terminal/coding-agents/)｜[Tether changelog](https://github.com/open-webui/tether/blob/main/CHANGELOG.md)
