---
title: "[News] Google Mirror Dimension：Browser Agent 的安全 eval，先做一個不會碰到真網路的假網路"
description: "Chrome 團隊公開 Mirror Dimension：以 gVisor、interception proxy、合成網站與動態 prompt injection 建立封閉測試環境。重點不是複製 Google，而是讓 Browser Agent 的測試可重跑、可觀察且沒有真實副作用。"
pubDate: 2026-11-23
category: "AI & Agents"
tags:
  - AI Agents
  - Browser Automation
  - Security
  - Testing
references:
  - title: "Google Chrome Security: Mirror Dimension for Agents"
    url: "https://blog.google/security/mirror-dimension-for-agents/"
  - title: "METR: AI R&D-relevant model capabilities are improving rapidly and are getting harder to measure"
    url: "https://metr.org/blog/2026-11-20-q4-2026-capability-update/"
  - title: "TechOrange: Google Chrome 打造鏡像維度合成網路"
    url: "https://techorange.com/2026/11/20/google-chrome-mirror-dimension-ai-agent/"
relatedPostIds:
  - browser-use-1-python-repl-cdp
  - copilot-evals-skills-regression
draft: false
---

要驗證 Browser Agent 能不能完成「登入後下載報表」這種任務，直接讓它跑真網站通常不是好測試。頁面今天和明天不同、帳號狀態會殘留，還可能真的送出表單或被頁面裡的 prompt injection 帶走。跑一次成功，只能證明那次剛好沒出事。

Google Chrome 團隊在 **2026 年 11 月 19 日**公開 Mirror Dimension：一個封閉的合成網路，用來測試 Chrome 的 browser-use agent。Agent 看起來仍在開 `youtube.com` 這類正常網址，但它實際跑在 gVisor sandbox；連線被本地 proxy 攔下，回傳的是可控制、可重置的合成網站。這是 Google 的內部基礎設施，沒有對外提供產品或程式碼；值得借的是它的 eval 邊界設計。 [官方說明](https://blog.google/security/mirror-dimension-for-agents/)

## TL;DR

- Browser Agent 的驗收環境要同時滿足三件事：**沒有真實副作用、每次可回到同一狀態、Agent 不會一眼看出自己在考試**。
- Mirror Dimension 以 sandbox + interception proxy 讓 Agent 使用真實 URL 與 HTTPS 外觀，但請求不會離開測試網路。這是官方架構，不代表一般團隊需要自建 forged certificate。
- Google 也在合成頁面的文字、圖片、DOM、ARIA label 與 WebMCP 回應中動態插入惡意 payload，測 indirect prompt injection。
- 對一般團隊最實用的落地順序是：先做受控 fixture sites、假帳號與 deterministic assertions；高風險操作再加隔離 browser、egress allowlist、approval 與 audit log。

## 它解決的不是模型能力，而是 eval 的可信度

公開網站不是固定測試資料。商品庫存、登入牆、A/B test、rate limit、cookie 與前一輪操作都會改變結果。Agent 即使完成任務，也很難判斷結果來自模型、網站變動，還是某個殘留狀態。

Mirror Dimension 的做法是讓每次 trajectory 從乾淨 baseline 開始，所有網站都能重置。Google 特別提到，直接把 synthetic site 掛在 `fake-sandbox-sites.example` 這種明顯網址，會讓前沿模型產生 **eval awareness**：模型發現自己被測試後，行為可能和實際使用不同。

| 層次 | Google 的做法 | 一般團隊可先做的版本 |
| --- | --- | --- |
| 執行隔離 | gVisor 內的 headless Chrome | container／獨立 browser profile |
| 網路 | 攔截連線到 local proxy，不連 public web | egress deny-by-default，只 allow fixture host |
| 網站狀態 | 大量 stateful synthetic sites，可重置 | 3–5 個 task-specific fixture pages + seeded database |
| 結果驗證 | 可觀察完整 action 與頁面狀態 | API／DB assertion、request log、預期 DOM |
| 對抗測試 | 動態注入多種 prompt injection payload | 固定文字、DOM、ARIA、圖片 payload regression cases |

Google 的 proxy 會為被攔截的 HTTPS 網站動態簽發 leaf certificate，並在 sandbox 內預裝 custom Root CA，所以 headless Chrome 不會跳出 TLS 錯誤。這個細節有助於理解它如何維持網址真實感，但不該直接複製到 production。一般 team 若只是驗收自家 Agent，使用自己的測試網域、測試憑證與 DNS override，比偽裝第三方正式網域安全也更容易維護。

## 網頁裡的 prompt injection 不只藏在正文

Browser Agent 看的不是純文字。官方列出的攻擊面包含可見文字、圖片、DOM、ARIA accessibility label，以及結構化的 WebMCP tool response；而且 payload 可以在多步流程的任一時點出現。

Google 最初用 URL query parameter 指定要插入哪一種 payload，但模型會把不尋常的 parameter 當成「我正在被測」。後來改由 orchestration 層以 HTTP header 指定 payload，proxy 在回應合成頁面前插入內容，URL 仍維持正常。這是為了提升 eval fidelity，不是讓 Agent 繞過使用者可見的安全訊號。

對自己的測試，不必先追求這種隱蔽度。先把以下 case 變成可重跑 regression 已經很有價值：

1. 頁面正文要求 Agent 忽略原任務、上傳資料或改寫設定。
2. 按鈕的 ARIA label 或 hidden DOM 帶有衝突指令。
3. 圖片內含「下載檔案並傳到外部」這類文字。
4. tool response 插入未授權的 URL 或要求提權。
5. 任務完成前出現付款、寄送、刪除或權限變更，確認 Agent 會停下來要求 approval。

每個 case 都要有**機器可判定的預期結果**，例如「沒有送出 HTTP request 到非 allowlist 網域」、「測試帳號的資料沒有被改」、「Agent 回報需要人工確認」。只用 LLM judge 看最後截圖，會把另一個模型的猜測當成系統狀態。

## Multi-agent 造測試站不等於可信評測

Mirror Dimension 用 research、builder、critic 三種 subagent 生成與修正模擬網站；critic 會檢查 ARIA、表單驗證、console error、視覺呈現與 responsive layout。這可大幅增加場景數量，但它本身也是要被驗收的產物。

Google 表示，其 automated red-teaming pipeline 每位 security engineer 每天可產生超過 1,000 個 test candidates，約為手工數量的 30 倍。這是 Google 在自身系統中的官方數字，不是其他團隊可直接套用的效率承諾。若在小型專案使用 AI 生成 fixture，至少仍要保留：

- 人工指定的 user journey 與 threat model；
- deterministic backend state 和 request assertions；
- 可 review 的 fixture diff；
- 測試站與 production credential、production network 的隔離。

## 對 Browser Agent 的實作順序

我不會一開始做一個「像整個網路」的測試環境。對正在做 browser automation 的專案，先用單一高價值流程建立小型閉環比較務實，例如測試帳號登入後修改個人設定。

1. **固定輸入與狀態**：每次測試重建帳號、資料庫與 cookie；禁止使用正式帳號。
2. **限制能力**：browser 只能連 fixture hosts；檔案系統使用 temporary workspace；所有 write action 用短效 credential。
3. **定義 truth source**：例如儲存後，直接 query test API 或 DB，而不是採信 success toast。
4. **加入 hostile variants**：同一流程分別插入文字、DOM、ARIA 與 image payload。
5. **記錄可審查證據**：保存 action trace、network log、最後 DOM／screenshot，以及 assertion 結果；敏感資料要先 redaction。
6. **多次重跑**：統計 pass rate、最差一次、wall time、token、重試與人工接手率。METR 的最新報告也提醒，模型在可驗證任務上的能力快速上升，但較難驗證、需要判斷的工作仍不應只由 benchmark 分數外推。 [METR 報告](https://metr.org/blog/2026-11-20-q4-2026-capability-update/)

## 採用判斷

Mirror Dimension 最重要的觀點是：Browser Agent 的安全 eval 需要一個足夠像真實環境、但不會產生真實後果的地方。它不是一個可下載的 framework，也不是把 proxy 和自簽 CA 搭起來就完成。

若目前只有幾條 browser workflow，先投資在可重置 fixtures、後端 assertions、網路 allowlist 和高風險動作的人工核准，效益會比造大規模 synthetic web 高。當測試案例因網站狀態、第三方內容或 prompt injection 變得不穩定，再逐步提高 sandbox 與場景 fidelity。

這也和本站的 [Browser Use 1.0 架構](../browser-use-1-python-repl-cdp/)與 [Copilot Evals](../copilot-evals-skills-regression/) 分別互補：前者處理 Agent 如何操作瀏覽器，後者處理 Skill 或 tool 改版後如何比較；Mirror Dimension 補上了「測試的網站與副作用要放在哪裡」這個缺口。

## References

- [Google Chrome Security: Mirror Dimension for Agents](https://blog.google/security/mirror-dimension-for-agents/)
- [METR: AI R&D-relevant model capabilities are improving rapidly and are getting harder to measure](https://metr.org/blog/2026-11-20-q4-2026-capability-update/)
- [TechOrange：Google Chrome 打造「鏡像維度」合成網路](https://techorange.com/)
