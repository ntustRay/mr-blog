---
title: "[News] Browser Use 1.0.5：Agent 說完成，怎麼知道網站真的接受了？"
description: "Browser Use 1.0.5 預設用同一模型判讀每次執行的 trace、截圖與最後頁面。整理 result.judgement 的工程價值、成本、安全限制與分層驗收方式。"
pubDate: 2026-11-15
category: "AI & Agents"
tags:
  - AI Agents
  - Testing
  - Harness
  - Security
draft: false
references:
  - title: "Browser Use 1.0.5 release"
    url: "https://github.com/browser-use/browser-use/releases/tag/1.0.5"
  - title: "Browser Use PR #6398：Judge every run with the agent's own model"
    url: "https://github.com/browser-use/browser-use/pull/6398"
  - title: "Browser Use PR #6403：Judge with screenshots and gotchas"
    url: "https://github.com/browser-use/browser-use/pull/6403"
  - title: "Browser Use issue #6031：Known-answer false-success regression cases"
    url: "https://github.com/browser-use/browser-use/issues/6031"
relatedPostIds:
  - browser-use-1-python-repl-cdp
  - google-adk-2-14-multi-run-eval
  - agent-monitoring-coverage-compaction
---

Browser Agent 最麻煩的失敗，往往不是直接報錯，而是流程看起來走完了，模型也回覆「完成」，網站卻沒有真的接受操作。按鈕可能是 disabled、POST 回 500 後頁面仍顯示成功訊息、表單格式被拒絕，或 Agent 被導向登入牆卻把頁面上的示範資料當成答案。

Browser Use 在台灣時間 **2026 年 11 月 14 日 16:24**發布 1.0.5，將執行後的 judge 設為預設行為。每個有實際執行 step 的 `Agent.run()`，會再用 Agent 自己的 model 檢查 task、trace、近期截圖與最後頁面，並把判定寫入 `result.judgement`。

這篇依官方 release、兩個合併 PR 與 false-success issue 整理，沒有自行安裝 1.0.5，也沒有重跑官方的 13 組 session。

## TL;DR

`result.judgement` 比 Agent 自己回報的 `result.success` 多了一次獨立判讀，能補上 bot block、CAPTCHA、prompt injection 跡象與網站拒絕輸入等失敗線索。它適合當作 observability 與 triage 訊號，也能攔下部分「模型以為成功、頁面其實失敗」的情況。

它仍是同一個 model 的第二次判斷，不是後端交易狀態的證明。高風險流程應優先用 API、資料庫、audit log 或 deterministic assertion 驗證實際副作用，再把 LLM judge 用於難以寫死的畫面與語意檢查；付款、刪除、權限變更等操作仍要保留人工覆核或可撤回機制。

## `success` 與 `judgement` 回答不同問題

Browser Use 1.0 的 `result.success` 來自 Agent 在 `finish(..., success=...)` 中給出的判斷。它反映「執行中的模型認為任務是否完成」，因此可能和真實網站狀態不一致。

1.0.5 新增的 `result.judgement` 是 run 結束後的第二次判讀。它不會改寫原本的 run result；judge 失敗時，`judgement` 會是 `None`，呼叫端必須自己決定要重試、轉人工或視為失敗。

| 訊號 | 回答的問題 | 適合用途 | 不能證明 |
| --- | --- | --- | --- |
| `result.status` | run 是否完成、timeout 或 error | runtime 健康度 | 任務是否真的成功 |
| `result.success` | 執行 Agent 是否自認成功 | 低成本初步訊號 | 網站後端已接受操作 |
| `result.judgement.success` | judge 看過證據後是否認為成功 | 語意驗收、失敗 triage | 交易、寫入或權限變更已落地 |
| backend state／audit log | 系統是否真的產生預期副作用 | 高風險操作的最終驗收 | 畫面是否清楚、回覆是否好讀 |

這個區分很重要。Repository 中的 [false-success issue #6031](https://github.com/browser-use/browser-use/issues/6031)列出八類已知答案案例，包括 403、disabled click、假成功 toast、stale cache 與隱藏指令。這些案例的 grader 讀取 fixture server 的 request log 與 state，不採信頁面文字，正好說明「看起來成功」與「狀態真的改變」必須分開驗證。

## Judge 看到哪些證據？

依 [PR #6398](https://github.com/browser-use/browser-use/pull/6398)，judge 會取得 task、`judge_context` 與文字 trace。Trace 在送出前會遮蔽已知 secrets，總長限制為 120k characters；task 與 context 各自限制為 20k characters。Judge 回傳：

- `success`
- `failure_reason`
- `description`
- `prompt_injection_detected`
- `bot_block_or_captcha_detected`
- 最多五個 `gotchas`

[PR #6403](https://github.com/browser-use/browser-use/pull/6403)再加入近期不重複截圖與 run 結束前的最後頁面，最多四張影像。若 `use_vision=False`、tab 被隱藏，或最終截圖逾時，judge 仍可以只看文字。部分 model 若用 4xx 拒絕 image input，實作會再用 text-only 判讀一次。

`judge_context` 可以把驗收條件放在證據之前，例如要求「訂單頁必須顯示 order ID，而且後端查詢要回傳相同 ID」。它有助於避免 judge 只憑模糊的任務描述猜測完成條件，但不會自動查資料庫；呼叫端仍要先把可靠的 backend evidence 提供給流程，或在外層寫 assertion。

## 官方小型測試支持什麼？

Release 公布的測試包含 13 個真實 session，每個用新舊 judge 各判讀三次。其中五個 session 遇到網站拒絕輸入、Google unusual-traffic block 或 reCAPTCHA：

- 舊 judge 在 15 次判讀中產生 6 次 gotchas；
- 加入截圖與成功案例 gotchas 後，15 次判讀都有指出問題；
- 八個乾淨 session 的 24 次判讀中，有 2 次仍產生 gotchas；
- success verdict 沒有因這次改動而改變。

這組結果支持「截圖與最後頁面改善失敗原因描述」，還不足以證明 judge 普遍提高成功判定準確率。樣本只有 13 個 session，測試由功能作者執行，使用同一套特定 model 與 headless Chrome，也沒有獨立團隊重跑。

值得注意的是，這次改善的明顯收益在 **gotchas coverage**，不是 success rate。對工程流程而言，gotchas 能把「失敗了」轉成下一次可採取的修正，例如日期格式、電話格式或 rate limit；但 2/24 的乾淨 run 仍產生 gotchas，表示這些建議不能直接當成已確認的網站規則。

## 同一個 model 當 judge，會有相關盲點

1.0.5 使用 Agent 自己的 model 做 judge，部署簡單，也不必額外設定 judge provider。不過，執行與驗收可能共享相同的能力缺口與偏誤。

如果 Agent 沒有看懂頁面上的 domain-specific 狀態，同一個 model 讀 trace 時也可能犯同樣的錯。若 trace 本身缺少 backend response、最新 DOM 或關鍵 screenshot，judge 只能根據不完整證據推論。Prompt injection flag 也是 model 產生的分類，不等於一個獨立的 injection detector 或 security guarantee。

因此，judge 比較適合放在三層驗收的中間：

| 層級 | 做法 | 適合驗證 |
| --- | --- | --- |
| 1. Deterministic assertion | API response、DB row、audit event、URL／DOM invariant | 副作用與已知條件 |
| 2. LLM judge | trace、screenshots、final page、明確 rubric | 畫面語意、非固定文案、失敗分類 |
| 3. Human review | 高風險操作前後的人員確認 | 付款、刪除、權限、不可逆操作 |

這三層不必每個任務都全部使用。低風險資料擷取可以用 judge 加幾個 deterministic checks；會改正式資料的流程則應把 backend assertion 設為必要條件，judge 只補充解釋。

## 最小使用方式

以下範例依 1.0.5 API 整理，未在本站環境執行：

~~~python
from browser_use import Agent

agent = Agent(
    task="更新測試帳號的聯絡電話",
    judge_context=(
        "成功條件：頁面顯示儲存完成，重新載入後仍是新電話；"
        "若網站拒絕格式、要求重新登入或出現 CAPTCHA，判定失敗。"
    ),
)

result = await agent.run()
judgement = result.judgement

if judgement is None:
    raise RuntimeError("Judge 沒有產生結果，轉人工或重試")

if not judgement.success:
    raise RuntimeError(
        f"{judgement.failure_reason}: {judgement.description}"
    )
~~~

這段程式只能示範如何讀取 judge 結果。若聯絡電話的真實來源是後端 API，應在 `run()` 後另外查詢該帳號，而非只依賴頁面與 judge。

不需要 judge 的低風險批次任務可以設定 `judge=False`。如果有既知正確答案或明確 rubric，可用 `judge_context` 提供；不要把秘密、長效 credential 或不必要的個資放進 context。

## 成本、延遲與資料邊界

一般路徑會增加一次 low-effort model request，tokens 與費用會計入 `result.usage`、`result.cost_usd`。Image input 被 provider 拒絕而改走 text-only fallback 時，可能再多一次請求。官方沒有公布這 13 個 session 的平均 judge latency 或成本，因此 production budget 仍需自行量測。

資料邊界也要分兩種：

1. **文字 trace**：已知 secrets 會先 redaction，judge output 也會再 scrub。開啟 usage stats 時，scrubbed judgement 會跟著 `agent_event` 傳送；關閉時不送。
2. **Screenshots**：PR 明確承認，截圖可能包含未遮蔽的 secret。Prompt 雖要求 judge 不輸出 email、個資或 credentials，這是模型指令，不是像素層 redaction。

處理登入後台、財務或健康資料時，應限制 screenshot 保存與傳輸、使用短效測試憑證，並確認 model provider 與 telemetry policy。若影像不能離開受控環境，設定 `use_vision=False`，再補 deterministic checks，會比期待 prompt 自動保密可靠。

## 導入前的驗收清單

1. 建立幾個已知答案的 false-success fixture：403、假 toast、POST 失敗、silent no-op、stale cache 與 prompt injection。
2. 同時記錄 `result.success`、`result.judgement` 與 backend truth，計算 false positive／false negative，不只看整體 pass rate。
3. 用真實任務量測 judge 額外的 tokens、費用與 wall time，包含 image fallback。
4. 測試 judge request 失敗、schema 不合與 `judgement=None` 時的 fallback policy。
5. 驗證 screenshot、workspace、telemetry 與 error log 是否包含敏感資料。
6. 對付款、刪除、寄送或權限變更加入 idempotency key、dry run、人工核准與可撤回步驟。
7. 精確 pin `browser-use==1.0.5`，先用可重建資料做小流量 PoC。

## 採用判斷

Browser Use 1.0.5 值得現有使用者升級後做受控驗證。它把 judge 從選配想法變成預設 runtime output，也把 bot block、CAPTCHA、prompt injection 跡象與網站 gotchas 放進結構化結果，能直接改善失敗分類與下一次重試。

目前不應把 `result.judgement.success=True` 當成 production transaction 已完成。官方測試規模小、缺少獨立重跑，而且同一個 model 兼任 executor 與 judge。較穩健的採用方式是：讓 deterministic state 成為最終 truth，judge 負責語意與診斷，人類負責高風險決策。

這和既有的 [Browser Use 1.0 架構文章](../browser-use-1-python-repl-cdp/)處理不同問題：前文關注 Python REPL、CDP、速度、成本與 trust boundary；本篇回答 run 結束後怎麼驗收。也和 [Google ADK multi-run eval](../google-adk-2-14-multi-run-eval/)不同：ADK 解決同一案例多次執行的可靠度分布，1.0.5 處理單次 browser run 的結果判定。兩者組合後，才比較接近完整的 Agent eval：每一次有可檢查的 outcome，多次執行再衡量穩定性。
