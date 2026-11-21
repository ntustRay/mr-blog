---
title: "[News] Codex CLI 0.171.0 支援遠端 exec，CI 的工作會在哪裡執行？"
description: "Codex CLI 0.171.0 讓 CI 透過既有 App Server 啟動或接續非互動任務。部署前先核對遠端工作目錄、Git commit 與完成事件，才能判斷實際跑了什麼。"
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

假設 CI 要把一次失敗的 build 交給 Codex 分析。CI 的 checkout 是 commit A，常駐的 Agent 主機卻還停在 commit B。只要版本對不上，即使 Agent 回了完整報告，也可能分析錯程式碼。

OpenAI 在 2026 年 11 月 20 日發布 Codex CLI 0.171.0，加入 `codex exec --remote`。CI 可以把非互動任務送到既有的 Codex App Server。它可以開新 thread，也能用 UUID 接續既有 thread。第一個值得做的驗收，是確認 App Server 看到的 repository 與 commit 確實是這次要處理的版本。 [版本公告](https://github.com/openai/codex/releases/tag/rust-v0.171.0) · [實作 PR](https://github.com/openai/codex/pull/61707)

## 這篇的重點

- `exec --remote` 把執行請求交給指定的 App Server，使用 server 的設定和憑證。
- CI 要驗證 server 看到的 checkout，再把完成事件與這次的 commit SHA 對起來。
- App Server 需要有自己的執行環境與存取權限。它放在哪裡，會影響任務能取得的檔案，以及主機離線時任務是否還能啟動。

## CI 發出請求，App Server 執行任務

在同一台 CI runner 上直接跑 `codex exec` 時，可以跟著 CI 的 checkout 設定工作目錄。接到遠端後，CI 腳本負責發起請求與收集結果，Agent 在 App Server 所在的環境工作。CI 的檔案、套件和登入狀態需要在遠端環境各自準備。例如 GitHub Actions 上的工作目錄路徑，通常只有那台 runner 找得到。 [實作 PR](https://github.com/openai/codex/pull/61707) · [App Server 文件](https://learn.chatgpt.com/docs/app-server)

這個做法適合已有常駐 App Server，並且希望讓 CI 與其他 client 接續同一條調查紀錄的情境。每次只需處理單一 commit 時，讓 CI runner 自己執行，可以直接沿用當次 checkout，減少維護另一套環境的成本。要使用 OpenAI 代管的 Codex Cloud，CLI 對應的是 `codex cloud exec`。選 `exec --remote` 時，先決定 App Server 由誰維護，以及它會用哪個 checkout。 [CLI 文件](https://learn.chatgpt.com/docs/developer-commands)

## 先用讀取操作驗證遠端 checkout

先在 App Server 準備一份測試用的 checkout，記下預期的 Git SHA，再讓 CI 呼叫以下指令。`CODEX_APP_SERVER_URL` 是已設定的 `wss://` 端點。若服務需要 bearer token，將 `CODEX_APP_SERVER_TOKEN` 注入 CI 的秘密環境變數。程式碼依 release 的實作與官方文件整理，驗收時請用自己的 runner 與 App Server。 [遠端連線文件](https://learn.chatgpt.com/docs/app-server) · [CLI 整合測試](https://github.com/openai/codex/pull/61707/files)

```bash
codex exec --remote "$CODEX_APP_SERVER_URL" \
  --remote-auth-token-env CODEX_APP_SERVER_TOKEN \
  --json \
  '在目前工作目錄依序執行 pwd 和 git rev-parse HEAD，回報實際輸出。'
```

1. 從 JSONL 裡核對指令執行結果，確認目錄與 SHA 符合 CI 的預期值。若 SHA 不符，先更新 server 的 checkout，再執行後續分析。
2. 保留 CLI exit status、thread ID 和 `turn.completed` 事件。完成事件用來確認 turn 結束，路徑與 SHA 用來確認這次執行處理的是正確版本。
3. 如果中途斷線，先用 thread ID 核對遠端紀錄。任務會提交程式碼或寫入其他系統時，也核對該系統的實際結果，再決定是否重試。這能處理「CI 沒收到回報，但遠端動作可能已發生」的情況。 [實作 PR](https://github.com/openai/codex/pull/61707)

先跑通這個讀取驗收，再接入有副作用的工作。多個 job 可能同時打到同一台 App Server 時，替每次任務分配對應的 checkout 或 worktree，並保留各次的 thread ID。若要接續同一條 thread，先確認前一個 turn 已結束。0.171.0 的實作會拒絕接續仍有 active turn 的 thread。 [實作 PR](https://github.com/openai/codex/pull/61707)
