---
title: "[News] Browser Use 1.0：Browser Agent 改成 Python REPL，真的更快嗎？"
description: "Browser Use 1.0 移除 DOM serializer 與固定 action schema，讓模型在 persistent Python REPL 直接操作 CDP。拆解 benchmark、migration、權限邊界與早期 regression。"
pubDate: 2026-11-11
category: "AI & Agents"
tags:
  - AI Agents
  - Harness
  - Security
draft: false
references:
  - title: "Browser Use 1.0.0 release：CDP is all you need"
    url: "https://github.com/browser-use/browser-use/releases/tag/1.0.0"
  - title: "Browser Use：Migrating from 0.x to 1.0"
    url: "https://github.com/browser-use/browser-use/blob/1.0.0/MIGRATING.md"
  - title: "Browser Use benchmark：BU Bench V2.1"
    url: "https://github.com/browser-use/benchmark"
  - title: "Browser Use issue #6363：multiple screenshots may preserve stale images"
    url: "https://github.com/browser-use/browser-use/issues/6363"
  - title: "Browser Use issue #6365：sensitive_data placeholder regression"
    url: "https://github.com/browser-use/browser-use/issues/6365"
  - title: "Browser Use issue #6367：Windows download filename regression"
    url: "https://github.com/browser-use/browser-use/issues/6367"
relatedPostIds:
  - playwright-mcp-isolated-browser-contexts
  - cloudflare-browser-agent-internal-hosts
  - gpt-6-1-terra-computer-use-cost
---

Browser Use 在 **2026 年 11 月 10 日**發布 1.0.0，重寫了 browser agent 的執行核心。0.x 讓模型每一步從固定 action schema 選一個動作，輸入主要是整理過的 DOM；1.0 改成讓模型在 persistent Python REPL 寫程式，透過 browser-harness helpers 與 raw Chrome DevTools Protocol（CDP）操作瀏覽器。

這不是一般的 major-version API 整理。官方刪掉 136,866 行、約 80% library，連 agent 的動作單位、history、error handling、預設 browser 與預設 model 都改了。對工程師真正值得研究的問題是：把瀏覽器控制權交給 model-written code，能否換到更好的速度與成本，同時仍保有可控的權限與可觀測性？

本文根據 1.0.0 release、migration guide、公開 benchmark repository 與剛建立的 issue 整理，沒有自行安裝 Browser Use 1.0，也沒有重跑 benchmark。

## TL;DR

Browser Use 1.0 值得進入 PoC，但不適合當成 0.x 的 drop-in upgrade。

官方較可比的 60-task 實驗顯示，1.0 ultrafast 相對 Browser Use Pi 的品質差異沒有統計顯著，成本約低 18%、時間約少 15%。這支持「同等品質下較省」的方向，還不足以證明所有 browser workload 都更準。更重要的改變是 trust model：模型現在能執行 Python、直接呼叫 CDP，`sensitive_data` redaction 也明確不等於 sandbox。

## 從 action schema 改成 model-written code

0.x 的典型迴圈是「觀察 DOM → 選擇一個 action → 執行 → 再觀察」。這種設計容易限制 model 的動作組合，但每一步相對容易記錄、檢查與重播。

1.0 的迴圈變成「model 寫一個 Python cell → REPL 執行 → output 回到 model」。同一個 cell 可以開頁面、查 DOM、呼叫 JavaScript、點擊，再依結果繼續運算。官方的設計目標是減少 DOM serializer 與 action schema 之間的轉譯損失，讓 model 使用 CDP 原生能力。

| 面向 | 0.x | 1.0 |
| --- | --- | --- |
| 操作單位 | 固定 action | Python cell |
| 瀏覽器介面 | 序列化 DOM 與內建 actions | browser-harness helpers + raw CDP |
| 狀態 | 每步 action history | persistent REPL conversation + workspace |
| 擴充方式 | 新增 action／controller | Python、JavaScript 與 CDP command |
| 主要風險 | schema 表達力與 DOM 摘要失真 | model-written code 的權限、錯誤與可觀測性 |

這個轉向對複雜操作有吸引力。模型可以在一次回合內批次擷取、過濾資料，或用 JavaScript 處理頁面狀態，不必把中間結果全部送回 model。不過，舊有逐步 history API 大量移除；原本依賴 `action_history()`、`model_actions()`、`save_as_playwright_script()` 等資料做 audit 或 regression replay 的系統，需要重做 observability。

## Benchmark 支持了什麼，沒有支持什麼

[1.0.0 release](https://github.com/browser-use/browser-use/releases/tag/1.0.0)的 headline 是「最高提升 33 分、便宜 2.7–5.2 倍、快 2–3 倍」。這是跨多組比較彙整的上限，不應直接外推到自己的任務。

同一份 release 另列出較可控的 BU Bench v2 實驗：60 個任務、每個重複 3 次，三組都使用 cloud browser；executor 是 `gpt-6-luna`，judge 是 `gpt-5.6-luna` xhigh。結果如下：

| Harness | 分數（95% CI） | 每題 model 成本 | 每題時間 |
| --- | ---: | ---: | ---: |
| Browser Use 1.0 ultrafast | 62.6（58.2–67.1） | $0.071 | 585 秒 |
| Browser Use 1.0 default | 61.1（56.5–65.6） | $0.073 | 675 秒 |
| Browser Use Pi | 61.3（57.0–65.4） | $0.087 | 689 秒 |

Paired comparison 中，1.0 ultrafast 相對 Pi 的分數是 **+1.4（-2.3 到 +5.0）**，信賴區間跨過 0，因此不能說品質確定提升；成本差 **-$0.016／題**、時間差 **-105 秒／題**，兩者的信賴區間未跨 0。比較合理的結論是：在這組 60-task 設定下，1.0 維持近似品質，model 成本降低約 18%，時間降低約 15%。

這組數字還有三個限制：

1. release 測的是歷史 60-task set；目前公開的 [BU Bench V2.1](https://github.com/browser-use/benchmark)是 200 tasks，不能把兩邊分數放在同一張排行榜直接比較。
2. 預設 hosted model `bu-fast` 沒有參與這組 controlled run。
3. `result.cost_usd` 只包含 model 與 web search，cloud browser 與 proxy 另外計費。評估 production 成本時要加上 browser、proxy、重試與人工收尾。

## Migration 不只是換 API

1.0 保留 `Agent`、`Browser`、`Tools`、`run()` 等常見入口，但預設行為已有 breaking changes。

| 項目 | 0.x | 1.0 影響 |
| --- | --- | --- |
| `llm=None` | 必須指定 model | 預設走 Browser Use gateway 的 `bu-fast` |
| `Browser()` | local Chromium | 預設建立 Browser Use Cloud；local 要寫 `Browser('chromium')` |
| `run()` | `max_steps=500` | 預設 100 steps、timeout 1,700 秒 |
| tool result memory | 可用 `include_in_memory` 控制 | 全部留在 conversation，舊參數被忽略 |
| runtime error | 可能 raise | configuration 通過後多數錯誤回 `status='error'` |
| history | 每步 actions 與 screenshots API | 多數 per-step API 移除，改看 `messages` 與 workspace |

官方要求新安裝精確 pin `browser-use==1.0.0`，需要保留舊引擎時使用 `browser-use<1`。這個建議很合理：預設 browser 從 local 變 cloud，不只影響費用，也會使 localhost、private IP 與登入狀態的行為改變。

好的一面是，1.0 對無法支援的舊參數會在啟動 browser 或產生費用前拋出明確 `TypeError`；已移除 import 也會提供替代方案。不過，有些舊 tuning knobs 只警告後忽略，migration test 仍要檢查 log，不能只看程式是否啟動成功。

## Python REPL 擴大了 trust boundary

模型能寫 Python 與 raw CDP，代表它取得的 ambient authority 比固定 actions 更大。這能減少框架限制，也擴大 prompt injection 或錯誤程式能觸及的範圍。

[Migration guide](https://github.com/browser-use/browser-use/blob/1.0.0/MIGRATING.md)對幾個界線寫得很清楚：

- `sensitive_data` 會遮蔽 cell output、checkpoint、tool result 與 final result 裡的 secret，但它**不是 sandbox**。模型寫的 Python 仍能讀到 secret 值，screenshot、頁面 JavaScript、cloud live view 也可能顯示內容。
- workspace 在 run 後會保留，可能包含 page text、screenshots 與 cell output；處理敏感任務後要主動刪除，或使用有生命週期管理的隔離環境。
- local Chrome debugging port 綁在 `127.0.0.1`，沒有額外驗證。共用主機上另一個 local user 可能附加到同一個 browser，這種環境應改用 container 或隔離的 cloud browser。
- Domain restrictions 與 private-IP blocking 仍然重要，但要額外測 redirect、download、web search 與 raw CDP path 是否都遵守同一套 egress policy。

若 production task 會登入後台、下載報表或操作帳務，採用標準應包含「哪些 code 可以執行、能讀哪些檔案、能連哪些網域、workspace 誰能存取」，不能只確認模型會不會完成任務。

## 1.0 發布後已出現的早期 regression

Release 後幾小時內已有三個帶 reproduction 的 issue。這些是單一 contributor 的早期回報，尚不能當成廣泛 production failure；它們仍適合放進 migration regression suite。

- [Issue #6363](https://github.com/browser-use/browser-use/issues/6363)指出，同一回應呼叫三次以上 screenshot 時，pruning 可能保留較舊的兩張並丟掉最新一張，讓 model 看到 stale state。
- [Issue #6365](https://github.com/browser-use/browser-use/issues/6365)重現 `sensitive_data` placeholder 互相再遮蔽的問題。當一個 secret value 是另一個 secret name 的一部分，label 會被破壞；回報者明確說沒有 secret value leak。
- [Issue #6367](https://github.com/browser-use/browser-use/issues/6367)重現 Windows cloud download filename 問題。包含 `:` 的 Linux 合法檔名可能變成 0-byte NTFS alternate data stream，其他 Windows 禁止字元則可能使檔案被跳過。

這三個案例剛好覆蓋 visual state、secret handling 與 cross-platform file I/O，說明 major rewrite 即使架構更簡單，仍需要 task-level regression，而不只是 unit test 或 benchmark aggregate score。

## 建議的採用檢查順序

1. **把 0.x 與 1.0 分開 pin。** 保留可回退的 0.x environment，避免同一個 lockfile 被 major rewrite 直接取代。
2. **重播真實任務。** 至少涵蓋 login、multi-tab、iframe、upload、download、長頁面、CAPTCHA、timeout 與 human approval；分別測 local 與 cloud browser。
3. **驗證最新觀察沒有被丟掉。** 對同一 cell 連續 screenshot、DOM query 與 navigation，確認 model 收到的是最後狀態。
4. **測 secret boundary。** 包含 secret name/value 重疊、screenshot 顯示、page script 讀取、workspace 殘留與 error message；redaction 通過也不代表隔離通過。
5. **補跨平台下載測試。** Windows 特別加入 timestamp、問號、引號與 reserved device name。
6. **重建 observability。** 保存 `result.messages`、status、usage、browser/proxy charge 與必要的 workspace artifact；不要假設 0.x action history 還存在。
7. **以總成本比較。** 同時計算 model、browser、proxy、web search、失敗重試、人工接手與清除敏感 workspace 的成本。
8. **限制 blast radius。** 優先在 container 或獨立 cloud browser 執行，使用 allowlist、private-IP blocking、短效 credential 與最小檔案權限。

## 現在值得採用嗎？

Browser Use 1.0 適合需要複雜頁面操作、願意維護 eval 與 security boundary 的團隊進行小流量 PoC。官方 controlled run 對成本與速度提供了正向訊號，Python REPL 也讓工具表達力明顯提高。

現階段不建議直接替換 production 0.x。品質提升尚未在 controlled comparison 顯著，預設 cloud／gateway 會改變成本與資料路徑，舊 per-step observability 大幅調整，而且發布後已出現可重現的 edge cases。

比較務實的 release gate 是：同一批真實任務中，1.0 的成功率不退步、總成本或 wall time 有可重現改善，secret／egress／workspace 測試通過，且團隊能從新 transcript 與 artifacts 還原失敗原因。通過這些條件後，Python REPL 才是工程上的能力提升，而不只是把更多控制權交給模型。
