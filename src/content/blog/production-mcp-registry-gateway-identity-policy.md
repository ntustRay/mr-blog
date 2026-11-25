---
title: "[News] MCP 接上正式環境，Registry、Gateway、Identity、Policy 各管什麼？"
description: "從 Agent 讀某份專案報表的請求，釐清 MCP 工具發現、連線、代表身分與資源授權。"
pubDate: 2026-10-14
updatedDate: 2026-10-17
category: "AI & Agents"
tags: [AI Agents, MCP]
draft: false
references:
  - title: "MCP：Introducing the MCP Registry"
    url: "https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/"
  - title: "MCP Authorization specification"
    url: "https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization"
  - title: "AWS：Amazon Bedrock AgentCore Gateway"
    url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html"
---

假設一個 Agent 用 MCP 的 `read_report` 查報表。它能找到這個工具、也能連上服務，下一個問題才是：它現在代表 Alice，能不能打開 Bob 的專案？這幾個步驟常出現在同一次請求，但各有不同的人和系統負責。

| 要回答的問題 | 在哪裡處理 |
| --- | --- |
| 有哪些 MCP server 能找到？ | Registry 提供伺服器目錄。公司可另訂哪些來源能採用 |
| 如何把既有 API 接給工具呼叫？ | Gateway 可以收請求、轉送並處理兩端連線 |
| 這次請求代表誰？ | 身分驗證要辨認呼叫方與委派的使用者 |
| Alice 能讀這份資料嗎？ | 服務端依個別使用者、動作和報表檢查權限 |

2025 年 9 月 8 日的 MCP Registry 預覽公告把它定位為用來發現 server 的 catalog。AWS AgentCore Gateway 則是連線層的一個實作，可把既有 API 或 Lambda 接成 MCP 工具，入口和下游也可使用各自的認證。已有 API gateway 和權限服務的團隊，可以先確認現有元件能否承擔這些工作。[MCP Registry 預覽公告](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/)｜[AWS Gateway 文件](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html)

## 兩段連線，要用各自適用的憑證

Alice 登入拿到的 token 會指定預期的接收服務。MCP Authorization spec 要求驗證 token audience，所以下游 API 需要用對下游有效的認證；也要能辨識這個呼叫在替哪位使用者操作。測試可以安排兩個身分使用同一個工具讀同一份報表：一個應成功，一個應被拒絕。拒絕要在服務端生效，稽核紀錄能解釋是哪個身分碰到哪個資源的規則。[MCP Authorization 規格](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
