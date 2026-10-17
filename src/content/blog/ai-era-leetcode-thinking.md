---
title: "[Insight] AI 都會寫程式了，刷 LeetCode 還在練什麼？"
description: "從 Debug 土撥鼠的影片重新看刷題：先理解問題、寫出直覺解，再讓 AI 協助找出改善空間。"
pubDate: 2026-10-17
category: Engineering
tags: [AI, Algorithms, LeetCode, HackerRank]
draft: false
references:
  - title: "Debug 土撥鼠：2026 年 AI 都會寫程式了，工程師面試還要考演算法嗎？"
    url: "https://www.youtube.com/watch?v=_S4Ia3Mh0UQ"
  - title: "HackerRank：Subarray Division"
    url: "https://www.hackerrank.com/challenges/the-birthday-bar/problem"
---

把 LeetCode 題目貼給 AI，很快就能拿到解法。但看懂答案，換一題卻不知道怎麼開始，仍然是兩回事。

Debug 土撥鼠的[這支影片](https://www.youtube.com/watch?v=_S4Ia3Mh0UQ)整理了一個練習順序：**手動跑題 → 寫出直覺解 → 找出改善空間**。AI 則在卡住時提供提示。

這個順序把練習的焦點放回自己怎麼推理。

## 先有自己的想法，才有東西可以改

手動跑一次，能確認自己是否理解規則。先寫直覺解，則讓「為什麼慢、哪裡重複」有具體對象可以討論，不必一開始就猜最佳解。

例如我做過的 HackerRank [Subarray Division](https://www.hackerrank.com/challenges/the-birthday-bar/problem)，要找出長度與總和符合條件的連續片段。直覺上逐段加總，再觀察相鄰片段，就會發現大部分數字沒變，只需扣掉離開的、加上進來的。

值得練的是怎麼發現這件事。直接背下 Sliding Window，容易跳過這段推理。

## 讓 AI 提示，留一步給自己走

練習時，可以先交代目前的思路，再問：

> 先不要給完整解答。請指出一處重複工作，給我一個提示，讓我繼續想。

改完後，再請 AI 找反例，檢查自己是否漏掉條件。每次多留一步自己完成，才看得出哪些地方已經理解、哪些還需要練。

工作中直接讓 AI 產生初稿，可以是合理選擇；學習時則要刻意保留推理的機會。兩者的目標不同。

刷題無法代表完整的工程能力，但適合練習拆問題、比較做法與驗證答案。回頭打開 Solved 清單，可以挑一道題問自己：**不看解答，能不能說出做法為什麼成立？**

---

來源：[Debug 土撥鼠](https://www.youtube.com/watch?v=_S4Ia3Mh0UQ)（2026-10-06），依公開說明與章節整理；工作情境為本文延伸。[HackerRank 題目](https://www.hackerrank.com/challenges/the-birthday-bar/problem)。
