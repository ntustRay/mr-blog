---
title: "MCP 接上正式環境，Registry、Gateway、Identity、Policy 各管什麼？"
description: "能呼叫工具只是起點。把 MCP 的發現、連線、身分與業務授權拆清楚，才能知道每個請求究竟被誰允許。"
pubDate: 2026-10-14
category: AI
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

本機上能呼叫 MCP tool，通常很快就能做出 demo。正式環境接著會問：誰在呼叫？代表哪個使用者？能讀哪個專案？離職後怎麼撤權？

這些問題需要分層處理。**Registry、Gateway、Identity、Policy 是四種責任；不是 MCP 官方要求每個系統都部署的四套服務。** 以下是依官方文件整理的架構分析。

## 四層責任分開看

| 責任 | 要回答的問題 | 不該被誤認為 |
| --- | --- | --- |
| Registry | 有哪些 server？去哪裡連？ | 公司核准使用清單或呼叫代理 |
| Gateway | 請求如何統一接入、轉送與觀察？ | 加上它就自動擁有正確業務授權 |
| Identity | 呼叫者是誰、代表誰？ | 登入成功就能使用所有資料 |
| Policy | 這個身分能對這個資源做什麼？ | 寫進 prompt 就能強制執行 |

[MCP Registry 的發布說明](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/)把它定位成 server discovery 的 catalog 與 API。發現一個 server，不等於已經取得工具存取權，更不等於組織認可其供應鏈。

公司可以另外維護允許使用的 server、版本與來源；這份內部決策不能靠公開目錄代替。

## Gateway 有用，但要知道它接了哪些責任

[AWS AgentCore Gateway 文件](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway.html)提供一個具體例子：它能把既有 API 和 Lambda 接成 MCP-compatible tools，也處理 inbound 與 outbound authentication。

這說明了兩段不同的連線：

- Agent 進入 Gateway：確認 Agent 或使用者的身分。
- Gateway 呼叫下游：使用下游接受的 credential。

即使兩段都成功，仍要判斷「這個使用者可不可以讀這個客戶的資料」。如果所有請求都用同一個高權限 service account，下游只看到 service account，使用者的權限差異就必須在可信任的執行層補上。

Gateway 的好處是集中管理；代價是它也成為需要維運、觀察與保護的共同路徑。只有少數內部 tools 時，先把 server 本身的授權做好，往往比急著增加一層更清楚。

## Token 不能隨手往下一站轉送

[MCP Authorization spec](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)要求 server 驗證 token 的 intended audience，不能接受或轉送不屬於自己資源的 token。

因此「使用者登入 Gateway，Gateway 就把同一個 Bearer token 送往所有 downstream」不能當通用做法。每段連線要依各自的授權設計取得 credential，並保留可稽核的身分關係。

這裡談的是 HTTP-based MCP authorization；不要把這套 OAuth 流程直接套成所有本機 stdio server 的必備條件。

## 工具授權要落到資源

假設 tool 叫 `read_report`。只限制這個 tool 名稱仍然不夠：A 專案與 B 專案可能是完全不同的權限範圍。

可以先用這份決策資料檢查設計：

```text
actor：誰發起
delegated user：代表誰
action：讀取或修改什麼
resource：哪個專案、客戶或資料
decision：允許或拒絕，依哪個規則
trace：如何連回這次 Agent 執行
```

這是設計檢查表，並非 MCP 規定的 wire format。可信任的 server 應自行取得身分；不能把模型填入的 user ID 當成授權證明。

## 起步時先補哪裡？

先選一個真實 tool，測試允許與拒絕兩條路徑。用兩個權限不同的身分讀同一個資源，確認拒絕發生在 server 的執行邊界，而且 log 能說明原因。

等到多個 server 的 credential、audit 與 onboarding 開始重複，再考慮 Gateway 與內部 Registry。

這樣每增加一層，都有明確要解的營運問題，也比較容易驗證它到底提供了什麼。
