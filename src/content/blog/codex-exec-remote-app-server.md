---
title: "[News] Codex CLI 0.171.0 支援遠端 exec，CI 的工作會在哪裡執行？"
description: "CI 可把任務送往遠端 Codex App Server。用 Git SHA、工作目錄與完成事件驗證跑的是哪一份程式。"
pubDate: 2026-11-21
category: "AI & Agents"
tags: [AI Agents, Codex, CI/CD]
references:
  - title: "Codex CLI 0.171.0 release"
    url: "https://github.com/openai/codex/releases/tag/rust-v0.171.0"
  - title: "Support remote app servers in codex exec"
    url: "https://github.com/openai/codex/pull/61707"
  - title: "Codex App Server"
    url: "https://learn.chatgpt.com/docs/app-server"
  - title: "Codex developer commands"
    url: "https://learn.chatgpt.com/docs/developer-commands"
relatedPostIds:
  - agent-host-protocol-cross-device-session
  - hermes-agent-unified-session-gateway
---

CI 在 commit A 的測試失敗，送到遠端 Codex 後卻分析了 commit B，報告就算看起來完整也沒對到這次失敗。OpenAI 在 2026 年 11 月 20 日發布 Codex CLI 0.171.0，讓 `codex exec --remote` 可以把非互動工作送到既有的 App Server。CI 負責發起工作與接結果，Codex 在 App Server 的環境執行。[0.171.0 release](https://github.com/openai/codex/releases/tag/rust-v0.171.0)｜[遠端 exec 實作](https://github.com/openai/codex/pull/61707)

## 讓第一個遠端任務只回報它看到的工作目錄

把已知 commit 的測試 checkout 放到 App Server 上。讓 CI 送出一個唯讀要求，回報遠端工作目錄和 Git SHA。CLI 的遠端路徑要能在 App Server 找到；CI runner 的 checkout、套件或登入狀態要另外準備在遠端。以下是依文件整理的測試命令，設定好 `wss://` 端點才可用，需要 bearer token 時由 secrets 注入。[App Server 遠端連線](https://learn.chatgpt.com/docs/app-server)

```bash
codex exec --remote "$CODEX_APP_SERVER_URL" \
  --remote-auth-token-env CODEX_APP_SERVER_TOKEN \
  --json \
  '在目前工作目錄依序執行 pwd 和 git rev-parse HEAD，回報實際輸出。'
```

CI 等到任務完成事件後，再核對輸出 SHA 等於預期 commit。至少試一次遠端路徑錯誤或刻意落後的 checkout，確定會被 CI 當成失敗。之後要讓 Agent 分析真實 build 時，把當次 log、預期版本和需要的執行環境一起準備妥當。[Codex CLI 指令](https://learn.chatgpt.com/docs/developer-commands)
