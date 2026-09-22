---
title: "模型變強了，還需要 Superpowers 嗎？"
description: "Superpowers 是加強 AI，還是讓工作變慢？從社群分歧、第三方測試與 6.4 的流程調整，談什麼時候值得用、什麼時候可以省。"
pubDate: 2026-09-22
category: AI
tags:
  - AI Agents
  - Skills
  - Claude Code
draft: false
references:
  - title: "Superpowers：using-superpowers 原始規則"
    url: "https://github.com/obra/superpowers/blob/main/skills/using-superpowers/SKILL.md?plain=1"
  - title: "Simon Willison：Superpowers（2025-10-10）"
    url: "https://simonwillison.net/2025/Oct/10/superpowers/"
  - title: "Anthropic：Superpowers plugin"
    url: "https://claude.com/plugins/superpowers"
  - title: "Reddit：Are you guys still using the superpowers skill?"
    url: "https://www.reddit.com/r/ClaudeCode/comments/1u2tqud/are_you_guys_still_using_the_superpowers_skill/"
  - title: "Reddit：obra/superpowers overkill"
    url: "https://www.reddit.com/r/ClaudeCode/comments/1uyy7y1/obrasuperpowers_overkill/"
  - title: "Fresh Worktree：Are better models replacing Superpowers?（2026-08-28）"
    url: "https://fresh-worktree.ghost.io/are-better-models-replacing-superpowers/"
  - title: "Jesse Vincent：Superpowers 6.4（2026-09-21）"
    url: "https://blog.fsck.com/2026/09/21/superpowers-6.4/"
---

我對 Superpowers 的疑問很直接：如果每次對話開始，都要先叫模型讀一套規則，這到底是在幫它，還是在綁住它？以前模型容易漏步驟，需要人盯。現在模型變強了，這套流程還值得每次都跑嗎？

查完資料，比較站得住腳的結論是：**Superpowers 仍有人用，也有價值；但沒有證據支持所有模型、所有任務都該套完整流程。** 有人繼續用整套，有人只留幾個 skills，也有人關掉了。不能把其中一群當成全體。

以下整理截至 **2026 年 9 月 22 日**的公開資料。這是資料整理與使用建議，沒有做自己的效能實測。

## 讓我在意的是「每次都要」

Superpowers 是一套 coding agent 的開發流程，涵蓋 brainstorming、planning、TDD、debugging 和 review。其中 [`using-superpowers`](https://github.com/obra/superpowers/blob/main/skills/using-superpowers/SKILL.md?plain=1) 負責引導模型使用 skills，觸發條件相當積極：只要有 1% 的可能適用，就要先載入，連釐清問題前也一樣。

不過，**先檢查 skill，不代表每次都跑完整開發流程**。規則也允許載入後判斷不適用，就不繼續用。

這個設計有它的道理。模型不能因為覺得「這很簡單」，就跳過該做的事。但小修改值不值得先進一輪需求訪談、寫 spec、再 review spec，是另一個問題。

假設只是把導覽列的標題改成英文，範圍清楚，也容易驗證。這時候多一份計畫，究竟能避免什麼錯誤？如果回答不出來，就值得把那個步驟拿掉。

## 社群沒有一致答案，但抱怨很具體

早在 [2025 年 10 月的介紹](https://simonwillison.net/2025/Oct/10/superpowers/)，Simon Willison 就肯定 Jesse Vincent 在 planning、TDD 等工作方法上的探索。那篇文章能說明當時為什麼受到注意，不能代替今天的效果評估。

目前也不能說它已經沒人用。[Anthropic 的 plugin 頁面](https://claude.com/plugins/superpowers)在查閱時顯示約 **101 萬次安裝**。但安裝量沒有告訴我們多少人還在用，更沒有告訴我們多少人覺得值得。

真正有意思的是使用者怎麼描述取捨。

在 Reddit 的 [「你們還在用 Superpowers 嗎？」](https://www.reddit.com/r/ClaudeCode/comments/1u2tqud/are_you_guys_still_using_the_superpowers_skill/)討論裡，有人關掉後又開回來，重視先確認計畫、再執行的穩定性；有人只用 brainstorming；也有人覺得原生 plan mode 加上專案文件就夠了。

另一篇 [「Superpowers 是否太過頭？」](https://www.reddit.com/r/ClaudeCode/comments/1uyy7y1/obrasuperpowers_overkill/)更直接：發文者抱怨，簡單任務也會自動走進 brainstorming、spec 和 review。留言有人建議只在複雜、涉及架構的工作啟用，也有人主張抽出有用的部分，縮小觸發範圍。

這些留言證明「流程太重」確實是使用者遇到的問題。但它們不是民調，搜尋到幾篇抱怨，不能就寫成「大家都不用了」。反過來，有很多支持者，也不能推論每個人裝上去都會變好。

## 有比較測試，而且結果不利於整套流程

[Fresh Worktree 在 2026 年 8 月 28 日](https://fresh-worktree.ghost.io/are-better-models-replacing-superpowers/)比較了三種配置：同一個健身房預約 app、66 項固定驗收測試，每組執行 5 次。

| 配置（依原文命名） | 通過測試中位數 | 耗時中位數 | API 費用中位數 |
| --- | ---: | ---: | ---: |
| Plain Opus5 | 66/66 | 20.1 分鐘 | US$5.62 |
| Adventure Party（builder＋reviewer） | 66/66 | 42.1 分鐘 | US$17.48 |
| Superpowers | 64/66 | 111.6 分鐘 | US$35.49 |

這次 Superpowers 花了約 **5.6 倍時間、6.3 倍費用**，驗收分數沒有更高。但只測了一種從零建置任務；Superpowers 組還明確要求使用 subagents，不能把差距全算在啟動 skill 上。原生組沒寫 unit tests，長期維護效果也沒被分數完整衡量。此外，作者維護參測的 Adventure Party，測試早於 6.4。

它提醒我們：**增加流程確實可能得不償失**。要知道自己的專案是不是如此，還是得拿自己的任務比。

## 作者也在調整，而不是堅持原本那套

比較測試之後，[Superpowers 6.4 在 9 月 21 日發布](https://blog.fsck.com/2026/09/21/superpowers-6.4/)。Jesse Vincent 表示，新模型更能在主 session 裡持續完成工作，因此重新設計了 Native Execution，也就是 `executing-plans`。

他公布的內部測試說法是：Native Execution 相較完整 subagent 流程，速度約兩倍、費用約一半；完全不用 Superpowers 更快、更便宜，但 bugs 更多。這是作者自述，仍需獨立驗證。

這次調整至少說明，連工具作者都在重新評估新模型需要多少流程。拿舊版的成本批評所有新版並不公平；因為新版宣稱改善，就當成問題已解決，也太早。

## 要不要用，先看它能補哪個洞

「有沒有裝 Superpowers」本身，不太能說明工作品質。比較有用的問題是：這次任務最容易在哪裡出錯？

| 任務情況 | 建議流程 | 值得付出的成本 |
| --- | --- | --- |
| 文案、命名、明確的小修改 | 直接改，做對應驗證 | 少量檢查就能確認結果 |
| 新功能，但需求還不清楚 | Brainstorming，先定驗收條件 | 前面多問，減少後面重做 |
| 跨模組重構、migration | 計畫、分段執行、review | 把相依關係與回復方式攤開 |
| 原因不明、反覆修不好的 bug | Systematic debugging | 花時間收證據，避免一直猜 |

這是依任務風險提出的建議，不是社群投票結果，也不是完整 Superpowers 的預設行為。若要這樣用，需要調整啟用方式與觸發規則。

同樣地，小模型也不代表越需要整套。它可能需要更明確的步驟，卻未必能處理更長、更多層的指令。與其一次塞滿，較保守的做法是給它範圍小、輸入輸出清楚的 workflow，再確認它真的有做對。這裡沒有跨模型測試，不能保證哪種配置一定贏。

如果要判斷值不值得留下，可以挑三種平常會做的任務：一個小修改、一個新功能、一個難解的 bug。固定模型與驗收條件，比較有無完整流程時的總耗時、費用、漏掉的需求，以及自己接手修正的時間。別只看 agent 說完成得多快。

**完成前要有驗證證據，值得留下。每次都要先開一場規劃會議，就得看那場會議到底省了多少重工。**
