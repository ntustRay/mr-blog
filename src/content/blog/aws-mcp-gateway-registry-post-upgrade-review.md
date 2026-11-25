---
title: "[News] AWS 揭露 MCP Gateway 兩個漏洞：升級後為什麼還要查舊資料？"
description: "AWS 的兩則公告修補 mcp-gateway-registry 權限與連線問題。解釋為何升級後仍要盤管理員、上游與憑證。"
pubDate: 2026-11-12
category: "AI & Agents"
tags:
  - AI Agents
  - MCP
  - Security
draft: false
references:
  - title: "AWS Security Bulletin：CVE-2026-100307"
    url: "https://aws.amazon.com/security/security-bulletins/2026-179-aws/"
  - title: "AWS Security Bulletin：CVE-2026-125926"
    url: "https://aws.amazon.com/security/security-bulletins/2026-180-aws/"
  - title: "GHSA-rxf3-qgpv-wxvr：External management API missing authorization"
    url: "https://github.com/agentic-community/mcp-gateway-registry/security/advisories/GHSA-rxf3-qgpv-wxvr"
  - title: "GHSA-fc39-fwh3-wv5r：Server registration SSRF"
    url: "https://github.com/agentic-community/mcp-gateway-registry/security/advisories/GHSA-fc39-fwh3-wv5r"
  - title: "mcp-gateway-registry 1.25.0 release"
    url: "https://github.com/agentic-community/mcp-gateway-registry/releases/tag/1.25.0"
  - title: "mcp-gateway-registry 1.35.0 release"
    url: "https://github.com/agentic-community/mcp-gateway-registry/releases/tag/1.35.0"
  - title: "mcp-gateway-registry 1.36.0 release"
    url: "https://github.com/agentic-community/mcp-gateway-registry/releases/tag/1.36.0"
  - title: "PR #1333：enforce authorization on External API management endpoints"
    url: "https://github.com/agentic-community/mcp-gateway-registry/pull/1333"
relatedPostIds:
  - production-mcp-registry-gateway-identity-policy
  - pydantic-ai-266-agent-security-inputs
  - nvidia-openshell-agent-security-boundary
---

Gateway 今天升級完成，昨晚存進去的管理員群組還在。若當時的版本會讓權限被錯誤寫入，換 binary 只會改今後怎麼檢查。AWS 於 2026 年 11 月 12 日台北時間揭露 mcp-gateway-registry 的兩個高嚴重性漏洞，維護者可以依公告同時處理新請求和已存在的設定。[AWS 權限公告](https://aws.amazon.com/security/security-bulletins/2026-179-aws/)｜[AWS 伺服器連線公告](https://aws.amazon.com/security/security-bulletins/2026-180-aws/)

| 公告 | 影響的版本 | 最低修補版 |
| --- | --- | --- |
| CVE-2026-100307，管理 API 授權 | 1.0.9–1.24.7 | 1.25.0 |
| CVE-2026-125926，註冊伺服器的上游連線驗證 | 1.0.3–1.34.0 | 1.35.0 |

## 用實際部署過的版本定義調查期間

1. 盤點實際服務的映像、元件與 fork，升到涵蓋兩項修補的版本。曾經維護自有分支時，確認納入修正也要按實際程式，而非只比對 tag。
2. 核對管理員和其他高權 scope，找出未預期的群組授權。再查註冊的上游服務是否都能對到已知負責人和核准用途。
3. 在受影響的部署期間比對 auth、API 與出網紀錄。若無法排除代管憑證已被讀取，應依影響範圍從發行端撤銷或輪替。

升級後可用兩個權限不同的測試身分，走預期允許與拒絕的管理操作。對上游連線則確認只允許核准的測試目的地。這些結果加上舊設定盤點，才回答「新的要求會被阻擋」與「以前留下的資料有沒有清完」兩個問題。[兩則 AWS 公告的處置建議](https://aws.amazon.com/security/security-bulletins/2026-179-aws/)｜[連線公告](https://aws.amazon.com/security/security-bulletins/2026-180-aws/)｜[MCP 權限責任背景](../production-mcp-registry-gateway-identity-policy/)
