---
title: "[News] MAMUBench：多 Agent 共用資源，為什麼溝通到了還是做錯？"
description: "MAMUBench 用團體訂單和共享資源測多 Agent 協調，說明何時該等訊息、核對同意再提交。"
pubDate: 2026-11-13
tags:
  - AI Agents
  - Testing
  - Harness
category: AI & Agents
references:
  - title: "Worse Together: How Performance Breaks Down in Multi-User Multi-Agent Teams"
    url: "https://alignment.anthropic.com/2026/worse-together/"
  - title: "Worse Together (arXiv:2610.00583)"
    url: "https://arxiv.org/abs/2610.00583"
  - title: "MAMUBench"
    url: "https://github.com/safety-research/MAMUBench"
relatedPostIds:
  - hermes-agent-unified-session-gateway
  - coding-agent-harness-176-configurations
  - google-adk-2-14-multi-run-eval
draft: false
---

大家各有一個 Agent 幫忙點餐。有人說不要加花生，訊息傳給下單的 Agent，卻在它按確認後才被讀進去。系統有送達紀錄，使用者收到的餐點還是錯了。Anthropic 於 2026 年 11 月 11 日公布 MAMUBench 研究，刻意讓每個 Agent 代表不同的人，要一起用同一份預算、行事曆、訂單或其他有限資源。[Anthropic 研究文章](https://alignment.anthropic.com/2026/worse-together/)

## 送達和提交之間，有沒有真的讀到？

在個人助理的 25 個情境、四個模型中，研究看已提交的團隊 episode。重要要求有 94%–99% 傳給最後操作者，提交時仍在它 context 裡的比例只有 47%–67%。如果只量「訊息有沒有送達」，這段差距完全看不到。準備付款或合併前，系統可先查看是否有新要求尚待處理、哪一位 owner 還沒核准。[論文資料與方法](https://arxiv.org/abs/2610.00583)

課題不同，修法也不同。研究裡，共用預算有明確負責人時較好協調，診所排程改善來自更清楚的程序，團體訂單則受益於尚有未讀訊息時先卡住提交。只看整組任務成功率，可能漏掉有人要求被覆蓋；測試時可再記每位使用者的結果和未同意的動作。[研究中的協調介入](https://alignment.anthropic.com/2026/worse-together/)｜[MAMUBench 公開資料](https://github.com/safety-research/MAMUBench)

這是模擬研究。可以拿它的問題來設計自己的測試：安排一筆遲到訊息與一筆衝突偏好，記錄送達、讀入、核准、提交的順序。錯單時能指出是哪一步漏掉，比記一次成功或失敗更容易修。
