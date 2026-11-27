---
title: '[News] Vercel Tracing 正式推出後，怎麼用 trace 查 Next.js 的慢請求'
description: Vercel 在 2026-11-06 將 Tracing 正式推出。對已有多個 Vercel 專案的工程師，先用 CLI 查錯誤與慢 span，再決定是否加自訂 OpenTelemetry。
pubDate: 2026-11-27
category: 'Dev Tools & Quality'
tags: [Vercel, Next.js, OpenTelemetry, Observability]
draft: false
references:
  - title: Vercel Tracing 正式推出公告（2026-11-06）
    url: https://vercel.com/changelog/vercel-tracing-is-now-generally-available
  - title: Vercel CLI 搜尋 trace spans 公告（2026-09-29）
    url: https://vercel.com/changelog/search-trace-spans-from-the-vercel-cli
  - title: Vercel Tracing 文件
    url: https://vercel.com/docs/tracing
  - title: Vercel Instrumentation 文件
    url: https://vercel.com/docs/tracing/instrumentation
---

手上同時有好幾個 Vercel 專案時，使用者回報「某頁偶爾很慢」，通常第一個難題不是怎麼加效能優化，而是卡在 CDN、Middleware、Function、外部 API 還是 database。只有 request log 時，要把同一個請求的時間線自己拼起來。

Vercel 在 2026 年 11 月 6 日把 **Tracing** 正式推出。它把一個 request 拆成多個 span：Vercel infrastructure、Function 內的 outbound fetch，以及 Next.js route 和 render 等 framework 工作。這對已經部署 Next.js 或有 Node.js Function 的專案很實際：可以先查 production 的慢請求和 error，再決定是否真的需要改程式或補自訂 instrumentation。 [Vercel 公告](https://vercel.com/changelog/vercel-tracing-is-now-generally-available)

## 這篇的重點

- Tracing 現在可在 Dashboard 和 Vercel CLI 搜尋，不必先知道 request ID。
- 新建、含至少一個 Node.js Function 的 Next.js 16.5+ 專案，第一次成功建置後會自動加上一條全環境、100% 的 sampling rule；既有專案不應假設已啟用，先到 **Settings → Tracing** 看規則。
- 先用現有 span 排查。只有 span 的粒度真的不足時，才加 `@vercel/otel` 或 custom span。

## 先確認你拿到的是哪一種 trace

Vercel 把一個 trace 視為單次 request 的時間線，而 span 是其中一段工作。官方文件列出的自動資料包含 routing、Middleware、caching 等 infrastructure span，以及 Function 發出的 HTTP request。Next.js 13.4+ 也會提供 route 和 rendering 的 framework span。 [Tracing 文件](https://vercel.com/docs/tracing)

這不代表每個專案都會看到所有細節。正式推出公告中的自動啟用條件只適用於**新建**的 Next.js 16.5+ 專案，且專案至少要有一個 Node.js Function。其他專案先確認 sampling rule；沒有 rule 就不會有 always-on trace。Edge runtime 的 custom span 也不會被 Trace Drains 轉送，規劃跨服務 observability 時不能把 Edge 和 Node.js 當成同一個能力範圍。 [Vercel 公告](https://vercel.com/changelog/vercel-tracing-is-now-generally-available) · [Trace Drains 限制](https://vercel.com/docs/drains/reference/traces)

## 用 CLI 先從症狀縮小範圍

先把 Vercel CLI 更新到目前版本並登入正確 team。下面兩個查詢來自 Vercel 的 CLI 文件；它們只讀取 trace 資料，不會改部署或 sampling 設定。

```bash
# 查最近一小時的錯誤 span
vercel traces search --status error --since 1h

# 查 duration 大於兩秒的 span
vercel traces search --query 'span.duration > 2000'
```

找到異常後，用 request ID 或 trace ID 繼續看同一條時間線。加上 `--json` 時，CLI 會輸出每個 span 一筆 JSON，適合把結果交給 script 做分群，但不要把 trace 裡可能含有的 request metadata 直接貼到公開 issue 或 log。 [CLI 公告](https://vercel.com/changelog/search-trace-spans-from-the-vercel-cli)

排查時，我會先用下面的順序分類，而不是看到「慢」就直接改 React render：

| trace 中最長的 span | 優先檢查 |
| --- | --- |
| Middleware 或 routing | matcher 範圍、redirect、auth 與 cache policy |
| outbound `fetch` | 第三方 API latency、timeout、重試與 region |
| Next.js route / render | 動態資料依賴、server-side work、cache revalidation |
| database 或自訂 operation | query 計畫、連線等待與 transaction 範圍 |

這張表是排查順序，不是 root cause 的保證。span 長度只能說明時間主要花在哪，還要回頭核對 deployment、輸入和 error log。

## 不要一開始就加 custom span

如果 trace 已經能指出慢在第三方 `fetch` 或某個 route，先解決該問題較划算。只有你需要拆開一段 application code，才考慮 OpenTelemetry。

Vercel 建議以 `@vercel/otel` 補 framework 或 custom span。若 request 帶有 `traceparent`，上游的 sampling decision 也會影響是否輸出；Vercel 自己的 sampling rule 仍要同意採樣。因此「有設定 span 卻沒有資料」不一定是程式沒有跑到，也可能是 sampling 被丟棄。 [Instrumentation 文件](https://vercel.com/docs/tracing/instrumentation)

對目前以小型 Vercel 專案為主的情況，建議先做一次低風險驗證：

1. 選一個有 Node.js Function 的 production 或 preview 專案。
2. 在 Dashboard 的 **Settings → Tracing** 確認 sampling rule 和涵蓋環境。
3. 用 `vercel traces search --status error --since 1h`，或針對已知慢路徑發出一次測試 request。
4. 確認最長 span 是否足以回答「慢在哪一層」；不足才為那段程式加 custom span。
5. 記錄採樣率與保留期。Vercel 公告列出 Hobby 為 3 天、Pro 和 Enterprise 為 14 天，適合事故後追查，不適合當成長期完整的 tracing archive。 [Vercel 公告](https://vercel.com/changelog/vercel-tracing-is-now-generally-available)

Tracing 的價值不在多一個 dashboard，而在於把下一次效能問題先縮小到正確的層。能在 trace 看出是 cache miss、外部 API 還是 route handler，才知道該改程式、調平台設定，或把問題交回依賴服務。
