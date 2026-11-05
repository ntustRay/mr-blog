---
title: "[News] Pydantic AI 2.66 公布 10 個安全問題：URL、Tool Schema 與 Trace 都是輸入"
description: "Pydantic AI 2.66 一次揭露 10 個安全問題，涵蓋 event-loop DoS、SSRF、DNS 外洩、trace 洩密與 MCP credential。整理受影響條件、修補版本與 Agent runtime 該補的輸入邊界。"
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

Agent 的安全檢查很容易聚焦在 prompt injection、工具權限與 sandbox。Pydantic AI 在 **2026 年 11 月 4 日 19:51（台灣時間）**發布 2.66.0，卻把另一組風險攤在一起：URL 回應、client 傳入的 tool schema、序列化 history、trace 設定，甚至 secret redaction 自己，都可能成為攻擊者控制的輸入。

這批 release notes 一共列出 10 個 security advisories：2 個 high、7 個 medium、1 個 low。其中 9 個由 2.66.0 或同批的 Harness 0.66.0 修補；另一個 MCP credential 問題早在 2.60.0 修好，但在這次集中揭露。

本文依正式 release 與 GitHub Security Advisories 整理，沒有執行漏洞 payload，也沒有獨立 incident report 能證明這些問題已在實際攻擊中被利用。

## 這篇的重點

- 使用 Pydantic AI 2.x 的應用應升到 **2.66.0**；仍在 1.x 的應用應升到 **1.107.10**。使用 Harness 的團隊另需確認 **pydantic-ai-harness 0.66.0**。
- 這批問題的共同點是「先做昂貴或具副作用的轉換，之後才檢查限制」：JSON 先格式化、schema 先展開、hostname 先解析、history 先還原成 file object。
- AG-UI／Vercel AI adapter 的 client payload、MCP tool result 與歷史訊息都要視為不可信資料；完成身分驗證也不代表 payload 可以跳過大小、深度與複雜度限制。
- 若 embedding credentials 曾放進 `extra_headers` 或 `extra_body` 且啟用 OpenTelemetry，升級之外還要限制舊 trace 的存取並輪替 credential。
- 目前證據能確認受影響條件與修補版本，還不能推論所有 Pydantic AI 部署都曾暴露，或這些修補已經過廣泛 production 驗證。

## 10 個問題分成四種攻擊面

| 類型 | Advisory 與嚴重度 | 觸發條件 | 主要影響 | 修補版本 |
| --- | --- | --- | --- | --- |
| 資源耗盡 | `GHSA-m5vj`，high | 攻擊者能影響 local web fetch 的 URL | 深層 JSON 在套用回傳上限前被重新縮排，放大記憶體並阻塞 event loop | 2.66.0／1.107.10 |
| 資源耗盡 | `GHSA-mfx5`，high | 對不可信文字使用預設 `private_key` redaction | 正規表示式指數回溯，短文字也可能卡住數分鐘 | Harness 0.66.0 |
| 資源耗盡 | `GHSA-7494`，medium | AG-UI client 可提交 tool schema，且模型需要 inline `$ref` | 小型 schema 指數展開，消耗數分鐘 CPU 與數 GB 記憶體 | 2.66.0／1.107.10 |
| 資源耗盡 | `GHSA-484x`，medium | Decision model 收到攻擊者可控制的 tool schema | 重複解析 `$ref`，造成指數時間與記憶體成長 | 2.66.0 |
| 資源耗盡 | `GHSA-r879`，medium | UI adapter 載入含大量 parts 的 client message | 處理時間呈平方成長，單一 request 可阻塞同 process | 2.66.0／1.107.10 |
| 網路邊界 | `GHSA-5fj9`，medium | Tencent Cloud 上允許 local URL | metadata blocklist 漏掉 `169.254.0.23`，可能讀取暫時性 role credential | 2.66.0／1.107.10 |
| 型別還原 | `GHSA-4cj4`，medium | 第三方資料進入 tool result，history 之後被重載 | 一般 JSON 被重建為 file，觸發內網下載或讓 provider 以應用 credential 讀檔 | 2.66.0／1.107.10 |
| 可觀測性 | `GHSA-jp94`，medium | embedding instrumentation 記錄含秘密的額外設定 | `extra_headers`／`extra_body` 進入 exported traces | 2.66.0／1.107.10 |
| 網路邊界 | `GHSA-5ppx`，low | 依賴 domain allowlist 限制 web fetch 或 PlaywrightBrowser | 被拒的 hostname 仍先做 DNS lookup，可把少量資料送到攻擊者 nameserver | 2.66.0／1.107.10；Harness 0.66.0 |
| 識別資訊 | `GHSA-mgmv`，medium | MCP URL 最後一段含 credential、未設明確 id，並串流 MCP Apps 結果 | 衍生的 server id 把 credential 傳到 chat frontend 或 dumped history | 已於 2.60.0 修補 |

這張表不能直接當成「所有部署都受攻擊」的判定。每個 advisory 都有特定前提，例如允許 local URL、啟用 embedding trace、公開 AG-UI endpoint，或接受 client-defined tools。實際處置要先對照使用到的 capability 與資料流。

## 限制要放在展開與解析之前

三個 schema／message 問題和 web-fetch JSON 問題，都指向相同的工程順序：

1. 接收資料。
2. 檢查 byte size、項目數、巢狀深度、reference 數量與允許的型別。
3. 設定 CPU、記憶體與 wall-clock budget。
4. 才執行格式化、`$ref` 展開、型別還原或 adapter 轉換。

只限制最後產出的內容不夠。深層 JSON 可以在「裁切前」先膨脹；幾 KB 的 schema 也能在重複 reference 展開後占用大量記憶體。若這些工作又跑在 event loop，同一個 request 會拖慢其他 Agent run。

對 AG-UI endpoint，官方 advisory 假設攻擊者已通過身分驗證。這仍然需要 request body、message parts 與 client tool 數量限制。Authentication 解決「誰能呼叫」，沒有控制每次呼叫可消耗多少共用資源。

## History reload 也是一次輸入解析

`GHSA-4cj4-hgwf-4hc4` 的邊界更容易漏掉。Tool 回傳的一般 JSON，在當下仍以資料交給模型；存進 message history 再載入後，如果形狀剛好符合 Pydantic AI 的 file type，就可能被重建成 `ImageUrl`、`DocumentUrl`、`UploadedFile` 等物件。

下一次 model request 才會發生下載或 provider-side file resolution。這代表安全事件與原始 tool call 之間可能隔著持久化、排程或 durable execution。Temporal、DBOS、Prefect，以及 server-managed UI history 都在 advisory 列出的影響路徑內。

工程上可以把這類資料視為「從儲存層重新進入系統的外部輸入」：

- 序列化格式要保留明確的 type discriminator，不能只靠物件形狀猜型別。
- tool result 中來自第三方系統的欄位，重載後不應自動取得下載或 provider credential 的能力。
- replay／resume 測試要驗證下一個 model request 實際會做什麼，不能只檢查儲存前的訊息內容。

## Allowlist 必須涵蓋 DNS 與 redirect

`GHSA-5ppx-9jq6-6pmw` 顯示，即使 HTTP request 最後被 domain allowlist 擋下，先發生的 DNS lookup 仍可能外洩資料。修補後，Pydantic AI 會在解析 hostname 之前檢查 allowlist，並套用到 initial request 與 redirect。

若 Agent 可以依不可信內容組出 URL，network policy 至少要觀察三層：

- hostname 是否在 allowlist 內；
- DNS 解析後的 IP 是否落在 private、link-local 或 metadata 範圍；
- redirect 的每一跳是否重新通過相同檢查。

雲端 metadata 也不適合只靠一份固定 blocklist。這次漏掉的是 Tencent Cloud 的 `169.254.0.23`；部署端仍應以 egress policy、網路 namespace 或 proxy 阻止不必要的 link-local 連線，讓 library guardrail 成為第二層防線。

## Trace 與 MCP identifier 也可能帶出 credential

OpenTelemetry 的價值是把 Agent run 串成可查的 trace；同一條資料管線也會把 span 匯出到外部 collector 或 observability 平台。`GHSA-jp94-mmr3-2pvv` 指出，embedding request 的 `extra_headers` 與 `extra_body` 曾被寫入 span。若其中放了 API key，任何能讀 trace 的人都可能看到它。

處置不能停在升級：

1. 盤點是否啟用 embedding instrumentation。
2. 檢查 credential 是否曾放在這兩個設定。
3. 限制歷史 trace 的存取與保存期限。
4. 從乾淨環境輪替可能暴露的 credential。
5. 為 telemetry payload 加上欄位 allowlist，而非只靠 key 名稱做 redaction。

同批揭露的 MCP 問題已在 2.60.0 修好，但仍需要歷史處置：如果 server URL 的最後一段曾放 credential，而且結果透過 AG-UI／Vercel AI frontend 串流，應輪替該 credential。更穩妥的做法是不要把秘密放進 URL path，並為 MCP capability 明確設定不含秘密的 id。

## 升級後還要驗證哪些拒絕路徑

以下是導入 2.66.0 後可執行的安全驗證方向；本文沒有宣稱這些測試已通過：

- 送入合法但極深的 JSON，確認 request 在低成本的前置檢查被拒絕，不會長時間阻塞 event loop。
- 對 client-defined tool 設定 schema byte、depth、`$defs` 與 reference 上限，確認超限會在模型呼叫前失敗。
- 對單一 message 的 parts 數量與 request body 設硬上限，觀察 event-loop lag、process memory 與其他 run 的延遲。
- 將第三方資料放入 tool result，經過 serialize／reload，再確認不會被還原成具下載能力的 file object。
- 驗證被拒 hostname 不會出現在 DNS logs，redirect 也不能繞過 allowlist。
- 以假 credential 走 embedding trace 與 MCP Apps 路徑，確認 trace、frontend events 與 dumped history 都不含秘密。

測試應在隔離環境進行，並記錄 package 版本、payload 大小與資源上限。安全 advisory 提供的是已知失敗條件，正式環境仍要用自身的 proxy、adapter、durable execution 與 telemetry 組合驗證。

## 採用判斷

這是需要優先升級的 security release。2.66.0 有正式簽署的 release、公開 advisory、受影響版本與修補版本，證據比一般功能公告完整；目前缺少獨立 exploit reproduction、實際入侵案例與大規模 production 回報，因此成熟度應解讀為「修補已發布，後續驗證仍在早期」。

它和先前的 Pydantic AI runtime brakes 處理不同風險。2.63 關心 Agent 自己陷入迴圈時如何停止；這次關心攻擊者能否讓 runtime 在進入模型或工具執行以前，就因資料展開、型別還原、DNS 或 telemetry 洩密而失守。

這批 advisory 最值得留下的設計原則是：Agent runtime 中凡是會被解析、展開、重載、記錄或轉送的資料，都要先回答來源、大小、複雜度與權限。Tool call 只是其中一段，安全邊界還包括前後的每一次資料轉換。

## References

- [Pydantic AI v2.66.0 release](https://github.com/pydantic/pydantic-ai/releases/tag/v2.66.0)
- [Local web fetch JSON expansion](https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-m5vj-8mcw-82qx)
- [Harness private-key redaction ReDoS](https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-mfx5-pc32-32m8)
- [Tool schema inlining](https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-7494-925c-rrxv)
- [Decision model schema expansion](https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-484x-x9m4-62cj)
- [Message history file type confusion](https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-4cj4-hgwf-4hc4)
- [DNS lookup before domain allowlist](https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-5ppx-9jq6-6pmw)
- [Embedding settings recorded in traces](https://github.com/pydantic/pydantic-ai/security/advisories/GHSA-jp94-mmr3-2pvv)
