---
title: "[News] AWS 揭露 MCP Gateway 兩個漏洞：升級後為什麼還要查舊資料？"
description: "AWS 公布 mcp-gateway-registry 的權限提升與 SSRF 漏洞。整理受影響版本、攻擊條件，以及升級後仍要檢查 scope、upstream、logs 與 credential 的原因。"
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

AWS 在 **2026 年 11 月 12 日凌晨（台灣時間）**公布 mcp-gateway-registry 的兩個 high-severity 漏洞：一個讓低權限使用者把自己提升成 registry administrator，另一個能把 Gateway 變成探測內網與 cloud metadata 的 SSRF 跳板。

兩個漏洞都在正式揭露前就已有修補版本。這不代表升級完成後就能結案：惡意 group mapping、已儲存的 upstream URL，以及可能被讀取的 backend credential 都不會因為換版自動消失。

本文依 AWS Security Bulletin、GitHub Security Advisory、release notes 與修補 PR 整理，沒有執行漏洞 payload，也沒有找到已被公開確認的實際利用事件。

## TL;DR

- `CVE-2026-100307` 影響 1.0.9–1.24.7，修補於 1.25.0。已登入的低權限使用者可利用缺少 authorization 的 management API，替自己的 IdP group 寫入管理員 scope。
- `CVE-2026-125926` 影響 1.0.3–1.34.0，修補於 1.35.0。能註冊或修改 server 的使用者可設定內網 upstream，讓 Gateway 代為發送請求。
- 截至揭露時，最新正式版是 1.36.0。仍在受影響版本的部署應直接升到最新 stable release，不必停在最低修補版。
- 升級只阻止新的惡意寫入。既有 scope mapping、upstream 設定、logs 與可能暴露的 credential 仍要另外檢查。
- 目前證據來自維護方 advisory 與修補紀錄，缺少獨立 exploit reproduction 與 production incident report；不能把「可利用」寫成「已遭大規模利用」。

## 兩個漏洞打穿不同邊界

| 漏洞 | 攻擊者需要什麼 | 主要問題 | 影響 | 修補版本 |
| --- | --- | --- | --- | --- |
| `CVE-2026-100307`，CVSS 8.8 | 任一已驗證的低權限帳號 | `/api/servers/*` 部分寫入路徑只做 authentication，沒有重做 role／permission authorization | 提升成 registry admin，讀寫 gateway assets、access-control 與 backend credentials | 1.25.0 |
| `CVE-2026-125926`，CVSS 8.5 | 可註冊或修改 server 的帳號 | 儲存 upstream address 前沒有完整 SSRF 驗證 | Gateway 連向內網或 cloud metadata，部分情況會把回應傳回呼叫者 | 1.35.0 |

第一個漏洞發生在 control plane。依 [AWS 公告](https://aws.amazon.com/security/security-bulletins/2026-179-aws/)與 [GitHub advisory](https://github.com/agentic-community/mcp-gateway-registry/security/advisories/GHSA-rxf3-qgpv-wxvr)，攻擊者可以對 `POST /api/servers/groups/import` 送出 crafted group definition，把自己的 IdP group 映射到 `mcp-registry-admin`，或讓 mutating permission 套用到所有 servers。Registry 每次 request 都即時依 scope store 判斷管理員身分，因此下一個 request 就取得 admin 權限，不需要重新登入。

[修補 PR #1333](https://github.com/agentic-community/mcp-gateway-registry/pull/1333) 顯示，問題不只一個 endpoint。維護者盤點後，替 group create／add／remove／delete、server toggle／register、credential update、version mutation、federation mutation 與 agent toggle 補上 authorization 或 per-resource access check。這是典型的「mirror route 有驗證身分，卻沒有重套授權 gate」問題。

第二個漏洞發生在 data plane 與網路邊界。依 [SSRF advisory](https://github.com/agentic-community/mcp-gateway-registry/security/advisories/GHSA-fc39-fwh3-wv5r)，能新增或修改 server 的使用者可以把 upstream 指向部署內網。Gateway 的健康檢查、tool discovery 或 proxy request 接著代表它連線；在特定部署下，可達目標包含 instance metadata 與暫時性 cloud role credential。

## 修補版為什麼沒有清掉風險？

這次最值得留下的工程教訓，是安全修補的作用範圍與 incident response 不相同。

`CVE-2026-100307` 的修補會在寫入路徑執行 authorization，卻不會刪除先前建立的 privileged group mapping，也不會使已被讀取的 credential 失效。若攻擊者在升級前已把自己的 group 寫進 scope store，升級後那筆 mapping 仍然有效。

`CVE-2026-125926` 的 1.35.0 修補會在 server 註冊或修改時驗證 upstream address，但不會重寫既有 server configuration。升級前存入的內網 URL 仍留在資料庫，必須由 operator 主動檢查與移除。

因此版本檢查只能回答「新的 request 是否還能走同一條漏洞路徑」，不能回答這些問題：

- scope store 裡是否已經有不該存在的 admin mapping？
- server registry 裡是否已存入內網、link-local 或 cloud metadata address？
- 舊 logs 是否出現非管理員送出的 group mutation 或異常 server registration？
- registry 管理的 backend credential 是否可能被讀取？
- attached cloud role 是否出現無法解釋的活動？

## 實際處置順序

### 1. 先確認版本與部署期間

盤點所有 registry、auth-server、mcpgw image 與 fork。受影響版本應直接升到最新 stable release；揭露當下官方最新 release 是 1.36.0。自行 fork 的版本不能只比 tag，還要確認 authorization gate 與 SSRF guard 的修補提交已納入。

同時記錄受影響版本實際運行的起訖時間。後續查 logs、scope store 與 cloud audit trail 都需要這段 review period。

### 2. 檢查持久化的權限

依 AWS 建議，在 `mcp_scopes` DocumentDB collection 檢查：

- `group_mappings` 是否把非預期 IdP group 對到 `mcp-registry-admin` 或其他 privileged scope；
- `ui_permissions` 是否把 mutating action 授予 `all`；
- 哪些 mapping 的建立時間、操作者或變更來源無法合理說明。

移除可疑 mapping 後，要重新驗證該帳號已失去 admin 行為。只看 UI 顯示的 role 不夠，應實際對 mutation endpoint 測允許與拒絕路徑。

### 3. 檢查已儲存的 upstream

列出所有 registered servers 的 upstream scheme、hostname、resolved IP 與 redirect 目的地。內部服務不一定是惡意設定，但每一個 private target 都應有 owner、用途與明確 allowlist；`169.254.169.254`、其他 cloud metadata address、loopback、link-local、multicast 與非預期 reserved range 應直接拒絕。

1.35.0 的修補只驗證新寫入與修改。對舊資料做一次離線 audit，才能補上這個時間差。

### 4. 用 logs 還原可能的操作

權限提升事件應優先找非管理員送出的：

```text
POST /api/servers/groups/import
POST /api/servers/groups/create
POST /api/servers/groups/add
POST /api/servers/groups/remove
POST /api/servers/groups/delete
```

再把同一 identity 的後續 server／agent mutation、credential read 與 access-control 變更串起來。SSRF 則要找異常 server registration／update、health check、tool discovery 與 proxy destination。

若 logs 的保存期不足，不能把「沒有紀錄」解讀成「沒有發生」。這種情況應提高處置強度，直接輪替無法排除已暴露的 credential。

### 5. 輪替 credential，縮小 egress

低權限帳號升成 admin 後，可能讀取 registry 代管的 server authentication credential 與 custom headers。若無法靠 logs 排除，應在來源系統輪替，而非只更新 registry 裡的副本。

部署端也要限制 registry 與 auth-server 的 outbound network，只允許必要目的地。在 EC2 上要求 IMDSv2，並把 attached role 壓到最小權限。Library-level SSRF guard 是必要防線，network egress policy 才能限制 guard 漏洞的 blast radius。

## Gateway 的安全驗收要多一層 state review

先前談 MCP production 架構時，可以把 Registry、Gateway、Identity 與 Policy 拆成不同責任。這兩個漏洞提供了具體反例：完成 authentication 不代表 mutation 已授權；集中 proxy 也不代表 upstream 已經安全。

新的驗收項目可以分成三層：

| 層次 | 最低驗收內容 |
| --- | --- |
| Request | 每個 mutation endpoint 都執行 authorization 與 per-resource access check |
| Network | URL 在儲存前與連線前都驗證，redirect 每一跳重查，並由 egress policy 擋住 metadata／內網例外 |
| State | 升級後掃描既有 scope、upstream 與 credential，保留能追到 identity 的 audit log |

Request 與 network controls 能阻止新的攻擊，state review 才能發現舊資料留下的控制權。對具有持久化設定的 Agent Gateway，兩者都要進 release gate 與 incident runbook。

## 採用判斷

這是值得立即處理、也值得寫成文章的事件。證據包含 AWS Security Bulletin、兩份公開 GHSA、明確受影響與修補版本、正式 release 與可讀取的修補 PR；工程行動也不只一句「升級套件」。

對尚未使用這個 repository 的團隊，兩個 CVE 不等於所有 MCP Gateway 都有同一漏洞，但很適合作為設計測試：挑一個低權限帳號，逐條確認 management APIs 的拒絕路徑；再用隔離環境驗證 upstream allowlist、DNS re-resolution、redirect 與 cloud metadata blocking。

對已部署 mcp-gateway-registry 的團隊，建議是升級、稽核與輪替一起做。若只完成第一項，修補的是程式碼；留在 scope store、server registry 與 credential system 裡的影響仍未結案。

## References

- [AWS：CVE-2026-100307](https://aws.amazon.com/security/security-bulletins/2026-179-aws/)
- [AWS：CVE-2026-125926](https://aws.amazon.com/security/security-bulletins/2026-180-aws/)
- [GitHub Advisory：Missing authorization](https://github.com/agentic-community/mcp-gateway-registry/security/advisories/GHSA-rxf3-qgpv-wxvr)
- [GitHub Advisory：Server registration SSRF](https://github.com/agentic-community/mcp-gateway-registry/security/advisories/GHSA-fc39-fwh3-wv5r)
- [Release 1.25.0](https://github.com/agentic-community/mcp-gateway-registry/releases/tag/1.25.0)
- [Release 1.35.0](https://github.com/agentic-community/mcp-gateway-registry/releases/tag/1.35.0)
- [Release 1.36.0](https://github.com/agentic-community/mcp-gateway-registry/releases/tag/1.36.0)
- [PR #1333：enforce authorization on External API management endpoints](https://github.com/agentic-community/mcp-gateway-registry/pull/1333)
