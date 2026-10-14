---
title: "Gemini 4 Argon 跑了 11 小時，ADK 團隊只接受 2 個優化"
description: "Google 的 ADK 效能案例，最值得看的地方是被拒絕的修改：測試通過、benchmark 變快，仍然可能不適合合併。"
pubDate: 2026-10-14
category: AI
tags: [AI Agents, Coding Agents, Harness]
draft: false
references:
  - title: "Google：Optimizing a 200,000-line Python codebase overnight with Gemini 4 Argon"
    url: "https://developers.googleblog.com/optimizing-a-200000-line-python-codebase-overnight-with-gemini-4-argon/"
---

讓 Coding Agent 整晚工作，隔天拿到一份測試全綠的 PR，接下來能直接 merge 嗎？

Google 在 10 月 13 日公開的 ADK 案例，給了一個很實際的答案：**Agent 提出 6 個優化，maintainer 最後只接受 2 個。** 長時間執行與通過測試，都不能代替對相容性和維護成本的判斷。

這篇整理 Google 的公開紀錄，沒有自行重跑 benchmark。數字適用於該次 ADK 實驗。

## 先把「變快」的範圍講清楚

[Google 的報告](https://developers.googleblog.com/optimizing-a-200000-line-python-codebase-overnight-with-gemini-4-argon/)描述，Gemini 4 Argon 在 Antigravity 中執行了 11 小時。最終落地的方向是：先篩選 session events 再複製，以及延後載入重型 package。

| Google 報告的結果 | 解讀時要保留的條件 |
| --- | --- |
| 長 session 的準備時間降低約 40% | 針對 in-memory session 路徑 |
| package cold import 快約 21% | 不代表整個 Agent 回覆快 21% |
| 新 process 到第一次 model request 幾乎持平 | 延後的 import 成本仍可能在第一輪支付 |

lazy loading 特別容易產生漂亮但不完整的成績單。把工作移到第一次使用，import 自然會變快；使用者首次真正操作時，還是可能等同樣久。

對前端也一樣。把 chart engine 延後載入，可以改善首頁的初始載入，但打開第一張圖的等待時間必須另外量。

## 全綠測試仍然漏掉什麼？

Google 提到，移除部分內部 import 後，16,892 個開源 unit tests 全部通過，卻有 25 個內部 test targets 失敗：它們依賴原本可被 patch 的 module attributes。最後使用 lazy module accessors 保留這些行為。

另一個未採用的 multi-agent event cache，讓 synthetic benchmark 快了 17%，但其弱引用設計可能在記憶體位址被重用後讀到跨 session 的舊資料。以上細節皆來自[原文的 review 紀錄](https://developers.googleblog.com/optimizing-a-200000-line-python-codebase-overnight-with-gemini-4-argon/)。

這類 bug 很難靠「多跑幾次 benchmark」找出來。它們要求 reviewer 問：

- 原本對外可見的 attribute 還在嗎？
- cache key 是否真的代表資料身分？
- 在不同 session、GC 或不同初始化順序下，假設還成立嗎？

速度是測量結果。cache 的有效條件則需要設計上的證明。

## Repository instructions 要寫 maintainer 真正在意的事

這個案例也用了 repository skills 和跨 context compaction 保留目標的執行模式。但它同時改了多個條件，不能單靠前後兩次執行就斷言「加 skills 一定更好」。

可借用的做法是，把 review 常見的拒絕理由寫成 Agent 能查閱的規則。例如：

```text
目標：降低初始化與長 session 的 overhead。
約束：保留 public API、序列化格式與既有 mock 路徑。
證據：提供 baseline、修改後數字、測量範圍與 regression tests。
交付：開 PR；每個優化可單獨檢視與撤回。
```

這是根據案例整理的工作指令，並非 Google 原文 prompt。

如果要套在 TS library，優先補上 public exports、資料 ownership、cache invalidation，以及哪些指標代表實際操作。不要只寫「遵循 best practices」。

## Review 要能拆開接受

一份效能 PR 同時改 import、copy、cache 和 telemetry，reviewer 很容易被總體數字帶著走。比較可維護的交付方式，是讓每個優化都有獨立的理由與測試。

例如 cache 的收益不夠支持它的有效條件，就先拿掉 cache，保留能證明安全的 copy 改善。整份 PR 不必只能全收或全退。

這個案例值得留下的工程習慣是：**先定義哪些行為不能變，再要求 Agent 提供能讓人逐項取捨的證據。** 能跑多久只是執行能力；哪些修改值得進主線，仍然是另一個問題。
