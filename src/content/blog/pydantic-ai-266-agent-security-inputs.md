---
title: "[News] Pydantic AI 2.66 公布 10 個安全問題：URL、Tool Schema 與 Trace 都是輸入"
description: "Pydantic AI 2.66 的安全修補牽涉 URL、Schema、歷史與 trace。用資料進出的順序檢查部署。"
pubDate: 2026-11-05
category: "AI & Agents"
tags:
  - AI Agents
  - Security
  - Harness
  - Python
draft: false
references:
  - title: "Pydantic AI v2.66.0 release"
    url: "https://github.com/pydantic/pydantic-ai/releases/tag/v2.66.0"
  - title: "GHSA-m5vj-8mcw-82qx：local web fetch JSON expansion"
    url: "https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-m5vj-8mcw-82qx"
  - title: "GHSA-mfx5-pc32-32m8：private-key redaction ReDoS"
    url: "https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-mfx5-pc32-32m8"
  - title: "GHSA-7494-925c-rrxv：tool schema inlining"
    url: "https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-7494-925c-rrxv"
  - title: "GHSA-4cj4-hgwf-4hc4：message history file type confusion"
    url: "https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-4cj4-hgwf-4hc4"
  - title: "GHSA-5ppx-9jq6-6pmw：DNS lookup before domain allowlist"
    url: "https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-5ppx-9jq6-6pmw"
  - title: "GHSA-jp94-mmr3-2pvv：embedding settings recorded in traces"
    url: "https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-jp94-mmr3-2pvv"
relatedPostIds:
  - pydantic-ai-agent-runtime-brakes
  - deepagents-mcp-tool-schema-search
  - nvidia-openshell-agent-security-boundary
---

Pydantic AI 在 2026 年 11 月 4 日台北時間發布 2.66.0，release notes 列出 10 項安全問題。維護既有 Agent 時，可以從四個入口盤點：誰能提供 URL，誰能提交工具描述，舊對話怎麼讀回，以及哪些欄位會送到監控平台。每個公告都有適用元件與版本；使用 1.x 或另外部署 Harness，也要按公告核對各自的修補版。[Pydantic AI v2.66.0 安全更新](https://github.com/pydantic/pydantic-ai/releases/tag/v2.66.0)

## 輸入在交給模型以前就會被處理

拿 tool schema 來說，服務可能先解析、展開和轉換。若只有最後結果有大小上限，前面的解析仍可能大量占用 CPU 或記憶體。讓 request 大小、資料結構和處理時間在入口就有上限，再用一般的超額測試資料驗收。對話 history 重新載入也是解析邊界。從第三方拿到的純資料，讀回後也應保留原定的型別與權限。

網路限制要涵蓋發出請求前的查核與重新導向。升級後可用完全由團隊掌管的測試網址做兩組：一組應可讀，另一組應在出網前被拒絕。要看的是稽核紀錄裡有沒有不預期的外連，不用等到資料真的傳出去才判失敗。[安全修補清單](https://github.com/pydantic/pydantic-ai/releases/tag/v2.66.0)

## Trace 是另一個資料出口

觀測平台的讀者常比 production 金鑰管理者多。把一個假的 secret 送進測試環境的模型設定，再查 collector 是否收得到明文。若舊版本有把 credential 匯出過的跡象，更新後還要追舊 trace 的保留與存取，依影響範圍輪替憑證。團隊若同時使用 MCP，也要確認連線稱呼、識別字串與介面輸出都不存憑證。[Pydantic AI 安全更新與相關公告](https://github.com/pydantic/pydantic-ai/releases/tag/v2.66.0)
