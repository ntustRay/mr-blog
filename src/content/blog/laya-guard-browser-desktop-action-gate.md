---
title: "[News] Laya Guard 0.8.0：Agent 點下付款前，誰先判斷這個動作危險？"
description: "Laya Guard 0.8.0 把 tool-call 防護延伸到 Playwright MCP、Chrome DevTools MCP 與 macOS computer use。整理動作語意、看不清楚時的失敗策略、作者自測與實際採用限制。"
pubDate: 2026-11-17
category: "AI & Agents"
tags:
  - AI Agents
  - Security
  - Computer Use
  - MCP
draft: false
references:
  - title: "Laya Guard v0.8.0 release"
    url: "https://github.com/scs0209/laya-guard/releases/tag/v0.8.0"
  - title: "PR #105：Browser 與 desktop computer-use guard"
    url: "https://github.com/scs0209/laya-guard/pull/105"
  - title: "Issue #95：全形字元繞過規則"
    url: "https://github.com/scs0209/laya-guard/issues/95"
  - title: "v0.8.0 CI run"
    url: "https://github.com/scs0209/laya-guard/actions/runs/43807046518"
  - title: "Select 1：laya-guard 0.2 時期的獨立安裝與規則測試"
    url: "https://select1.dev/2026-10-14"
relatedPostIds:
  - nvidia-openshell-agent-security-boundary
  - chatgpt-wallet-agent-payment-authorization
  - playwright-mcp-isolated-browser-contexts
  - browser-use-1-0-5-run-judge
---

Browser Agent 準備按下「付款」時，runtime 收到的 tool call 可能只有 element id、座標或一句不完整的描述。若核准層不知道畫面上那個位置代表什麼，就很難判斷這一步該直接執行、請人確認，還是完全阻擋。

Laya Guard 在台灣時間 **2026 年 11 月 16 日 13:00**發布 0.8.0，把原本以 shell 與檔案為主的 pre-tool-call guard 延伸到 Claude 內建 browser、Claude in Chrome、Chrome DevTools MCP、Playwright MCP，以及 macOS desktop computer use。它嘗試在動作執行前補上語意：browser tool 讀取結構化欄位，desktop click 則用 Accessibility API 查出座標下方的元件名稱，再套用 allow／review／block 規則。

本文依 release、合併 PR、issue 與 CI 紀錄整理，沒有安裝 0.8.0，也沒有實際控制 browser 或 macOS 桌面。專案公布的 click eval 與 benchmark 多由作者建立與執行；目前沒有針對 0.8.0 computer-use 功能的獨立重跑。

## TL;DR

- Laya Guard 0.8.0 的價值不只在多支援幾個 MCP server，而是把 permission check 放到動作前，並嘗試取得「這個 click 的意思」。
- Browser guard 主要靠 deterministic rules。輸入 secret、外傳 cookie／storage、上傳受保護路徑會被阻擋；付款、刪除、寄送、上傳或未列入 allowlist 的網站會要求確認。
- macOS desktop guard 會在 click 前查 Accessibility tree。若按鈕名稱像付款、刪除或寄送，會轉 review；若畫面讀不到，也會要求確認。
- 但 browser click 沒有描述時，預設仍是 allow。Desktop 的 Swift Accessibility helper 也沒有被 Python 測試涵蓋。這兩點決定了它還不能被視為完整安全邊界。
- 較合適的定位是：把明確高風險動作攔在 tool call 前的輔助層。OS sandbox、最小權限 credential、server-side authorization、idempotency 與執行後驗收仍要保留。

## Browser 與 desktop 需要不同的語意來源

Shell command 本身通常包含動詞與目標，例如 `rm -rf ~/Documents`。Browser 與 desktop tool call 的資訊量比較不穩定：

| 動作來源 | Guard 可能看到 | 0.8.0 的判斷方式 | 主要缺口 |
| --- | --- | --- | --- |
| Playwright／Chrome DevTools MCP | tool 名稱、URL、欄位、selector、描述 | 逐欄套用 browser rules | 描述可能缺失或由 Agent 自己產生 |
| Browser batch | 多個結構化步驟 | 每一步分別判斷，取較嚴格結果 | 中間狀態與跨步語意仍可能遺失 |
| Desktop computer use | 座標、按鍵、輸入文字 | 執行前查 Accessibility element | 自繪 UI、Canvas、遠端桌面可能讀不到 |
| Peekaboo MCP | 元件名稱或 element id | 查目標 app，或從先前 `see` transcript 找 label | transcript 可能過期，畫面也可能已改變 |

這個設計指出一個實務原則：permission system 不能只接收「要 click」；它還需要動作目標、目前畫面與使用者意圖。缺少其中一項時，決策應該明確降級，而不是假設低風險。

0.8.0 在 desktop 路徑採較保守做法：Accessibility tree 讀不到 click 目標時轉成 review。Browser 路徑則保留 `unlabeled_clicks: allow` 的預設。對只讀瀏覽或測試環境，這能減少頻繁打斷；對付款、正式資料或管理後台，應改成 review，或乾脆只允許有可驗證描述與 locator 的操作。

## 規則層與模型層的責任不同

Browser guard 在 0.8.0 使用規則，不依賴模型。Release 列出的主要處置包括：

- secret 被輸入、放進 URL 或 page script：block；
- script 讀取 cookie／storage 再外送：block；
- 上傳受保護路徑：block；
- 未列入 `browser.yaml` 的網站：review；
- card number、password field、付款／下單／刪除／寄送、上傳與 installer download：review。

Desktop 也先走規則。選配的 `LAYA_GUARD_DESKTOP_MODEL=1` 會再檢查輸入文字、快捷鍵與有 label 的 click，但預設關閉；模型只能把 allow 提升為 review，不能直接做出 block。

「模型只能收緊，不能放寬」是比較安全的組合方式。已知風險適合用明確規則與權限政策處理，模型補的是難以列舉的長尾語意。若讓模型推翻 deterministic deny，false negative 就會變成直接執行權。

同樣地，review 是否真的會停住，仍取決於上游 Agent 的 hook 能力。Repository 的支援表顯示，有些整合會把 review 變成 permission prompt，有些只留下警告或 note。導入前必須測試實際使用的 Agent，而不是只看到 Laya 回傳 `review` 就假設流程已暫停。

## 作者自測提供了什麼證據？

0.8.0 的 browser／desktop 變更由 PR #105 合併，涉及 29 個檔案、3,316 行新增，新增約 241 行 browser tests 與 418 行 desktop tests。Release commit 的 GitHub Actions 在 Python 3.10–3.13 完成，CI 結論為 success。

Revision 2 的 click 測試把未在訓練中出現過的 button labels 留成一組：

| Click set | Revision 1 | Revision 2 |
| --- | ---: | ---: |
| 一般 click 正確放行 | 8 / 25 | 23 / 25 |
| 高風險 click 被攔下 | 31 / 31 | 30 / 31 |

這組數字顯示 revision 2 大幅降低「幾乎每個 click 都要問」的過度攔截，同時漏掉一個高風險案例。PR 也主動揭露，原 validation split 有 69 / 82 個 click 與 training data 共用 button label，因此不能當乾淨測試；後續才改成依 label 分組。規則清單又是在看過模型 misses 後補上，因此「模型加規則」的結果也偏樂觀。

這些資料適合視為 regression evidence，不是 production accuracy。作者有揭露資料洩漏與小樣本限制，這比只貼一個總分有用；但仍缺少：

- 不同 macOS app、語言與自繪元件的 Accessibility coverage；
- browser locator、DOM 變動與 transcript 過期時的誤判率；
- 長時間使用的 review rate、使用者忽略率與額外延遲；
- 第三方針對 0.8.0 的端到端攻防重跑。

獨立來源 Select 1 在 2026 年 10 月曾測過較早版本：247 個 tests 通過，四個規則層攻擊案例都被攔下；當時沒有下載模型，也沒有驗證真實 Agent hook。這能支持早期 deterministic layer 可執行，不能外推成 0.8.0 desktop 功能已被獨立驗證。

## 一個已修掉的 bypass，提醒 guard 也會被繞過

同一版修正 Issue #95：全形 `ｒｍ -rf /` 與 `rm -rf ／` 在 0.7.0 既沒有命中規則，模型也分別以低風險放行。0.8.0 會同時檢查原文字串與 NFKC-normalized 形式，取較嚴格的 verdict。

這不是純理論上的字串清理。Guard 站在「動作執行前」，它接收到的表示方式若與後續執行層不同，就可能出現 guard 看見安全字串、下游卻正規化成危險命令的落差。

修補也有成本：NFKC 會把全形標點折疊成 ASCII，某些 shell 原本只會輸出的文字可能因此命中規則。專案選擇接受這種 false positive，避免後續某一層先做正規化。導入團隊應把這類例子放進自己的 bypass 與 benign corpus，持續觀察每次版本更新。

## 它和 sandbox、付款授權、執行後 judge 的位置不同

Laya Guard 處理的是 **動作前判斷**。既有文章中的其他控制點解決不同問題：

| 控制點 | 回答的問題 | 本站既有文章 |
| --- | --- | --- |
| Runtime sandbox | 就算 Agent 想做，OS／network／credential 邊界是否允許？ | [NVIDIA OpenShell](../nvidia-openshell-agent-security-boundary/) |
| Scoped authorization | 使用者批准的商家、品項、金額與收件人是否仍一致？ | [ChatGPT Wallet](../chatgpt-wallet-agent-payment-authorization/) |
| Browser session isolation | 不同帳號的 cookies 與 storage 是否混用？ | [Playwright MCP isolatedContext](../playwright-mcp-isolated-browser-contexts/) |
| Pre-execution guard | 這個 tool call 是否像付款、刪除、外傳或讀取秘密？ | 本篇 |
| Post-run verification | 網站或後端是否真的接受了操作？ | [Browser Use run judge](../browser-use-1-0-5-run-judge/) |

高風險流程需要組合這些證據。Pre-execution guard 可以攔下一個標示清楚的「Delete」按鈕，卻無法證明 server 沒有另一條刪除路徑；它也無法判斷付款 request timeout 後商家是否已收單。反過來，sandbox 能限制檔案與網路，卻未必理解某個允許網站上的「Send」是否符合使用者意圖。

## 建議先驗證的失敗策略

如果要把 Laya Guard 接到測試環境，可先建立一組小型 action corpus，至少涵蓋：

1. 有 label 的付款、刪除、寄送與上傳按鈕，確認都會停在 review。
2. 沒有描述的 browser click，把 `unlabeled_clicks` 改為 review 後確認 Agent 真的暫停。
3. Canvas、自繪 UI、遠端桌面與 Accessibility permission 失效，確認 unreadable click 不會放行。
4. 畫面在 `see` 與 `click` 之間改變，驗證 stale element id 不會沿用舊 label。
5. secret 出現在輸入欄、URL、script、clipboard 與 dialog prompt 的不同路徑。
6. Guard server 停止、model 尚未下載、hook 回傳格式錯誤時，確認 fail policy 符合風險。
7. 執行後以 API、audit log 或 backend state 驗證結果，避免只相信 click 已送出。

建議用測試帳號、可重建資料與短效 credentials 執行。本文沒有跑過以上案例；這是一份採用前驗收方向。

## 採用判斷

Laya Guard 0.8.0 值得研究與受控 PoC。它把 browser／desktop permission 的核心難題具體化：tool call 若只有座標，安全層必須先取得元件語意；取得不到時，也要有明確的 review 或 deny 策略。

它目前仍是年輕專案，computer-use 新功能發布不到兩天，獨立驗證只涵蓋較早版本的部分規則層。Browser unlabeled click 預設 allow、Swift helper 未被自動測試覆蓋、不同 Agent 對 review 的處理不一致，都是正式導入前需要解決的風險。

若任務只操作測試環境，0.8.0 可以作為一層額外護欄；若涉及付款、正式資料、credential 或不可逆操作，應把它放在 sandbox、最小權限、scoped authorization 與後端驗收之間，而不是取代其中任何一層。

## References

- [Laya Guard v0.8.0 release](https://github.com/scs0209/laya-guard/releases/tag/v0.8.0)
- [PR #105：Browser 與 desktop computer-use guard](https://github.com/scs0209/laya-guard/pull/105)
- [Issue #95：全形字元繞過規則](https://github.com/scs0209/laya-guard/issues/95)
- [v0.8.0 CI run](https://github.com/scs0209/laya-guard/actions/runs/43807046518)
- [Select 1：較早版本的獨立安裝與規則測試](https://select1.dev/2026-10-14)
