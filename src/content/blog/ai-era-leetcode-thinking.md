---
title: "[Insight] AI 都會寫程式了，刷 LeetCode 還在練什麼？"
description: "從刷題與白板題看工程基本功：先對齊 Spec、Input／Output，再做出可驗證的解法，透過溝通與迭代改善。"
pubDate: 2026-10-17
updatedDate: 2026-10-18
category: Engineering
tags: [AI, Algorithms, LeetCode, HackerRank]
draft: false
references:
  - title: "Debug 土撥鼠：2026 年 AI 都會寫程式了，工程師面試還要考演算法嗎？"
    url: "https://www.youtube.com/watch?v=_S4Ia3Mh0UQ"
  - title: "HackerRank：Subarray Division"
    url: "https://www.hackerrank.com/challenges/the-birthday-bar/problem"
---

我覺得，刷題最值得帶回職場的能力，是先把問題問清楚。

Debug 土撥鼠的[這支影片](https://www.youtube.com/watch?v=_S4Ia3Mh0UQ)整理了一個練習順序：手動跑題、寫出直覺解，再找出改善空間。這讓我想到，白板題和工作其實有不少相似之處：先理解問題，再把解法做出來，接著才有具體的東西可以討論。

## 開始解題前，先對齊 Spec

工作上，困難的往往是釐清 Spec。客戶或 PM 提出需求後，要先對齊 Input、Output、限制與驗收條件。如果只理解一半就開始寫，後面很容易一路猜，最後做出一個能跑、卻沒有解決對方問題的版本。白板題也一樣：開始解題前，先確認自己和面試官理解的是同一個問題。

## 先做出第一版，再討論怎麼改善

需求清楚之後，我更傾向先做出一版符合條件、可以驗證的解法。職場有時程壓力，面試也有時間限制；一開始就追求最佳解，很可能連第一版都做不完。先讓思路具體，才有東西可以討論。

例如我做過的 HackerRank [Subarray Division](https://www.hackerrank.com/challenges/the-birthday-bar/problem)，要找出長度與總和符合條件的連續片段。先逐段加總，再觀察相鄰片段，就會發現大部分數字沒變，只需扣掉離開的、加上進來的。值得練的是怎麼發現這件事；直接背下 Sliding Window，容易跳過這段推理。

題目解出來後，面試官通常會接著問：「有沒有更好的做法？」這和工作很像。功能完成後，可能遇到更大的資料量、新需求，或維護成本太高，接著就得迭代。這時要能指出原本的瓶頸，說明為什麼值得改，以及改善效能會付出多少複雜度。

我們不是神，AI 也不是，不可能每次都一步到位。重要的是能不能從錯誤和回饋中修正，逐步把解法做好。練習時，可以讓 AI 提示一處重複工作，或找一個反例，留一步給自己推理。

## 白板題也在看應變與溝通

所以，現在刷題除了幫助自己通過面試門檻，我更在意的是：面對有標準答案的問題，你會選擇什麼解法，又能不能說明理由？時間複雜度、空間成本、可讀性與當下限制，都應該進入判斷。背得出最佳解，和知道什麼時候該用它，仍然有一段距離。

刷題練基本功，白板題則多了一層應變與溝通。你怎麼澄清問題、解釋假設、回應提示，以及發現錯誤後怎麼調整，都會讓對方看見你的工作方式。我認為，當面試官在判斷你是不是適合一起工作的人時，一次答錯未必就代表結束；能否理解回饋、修正推理，同樣值得被看見。

---

來源：[Debug 土撥鼠](https://www.youtube.com/watch?v=_S4Ia3Mh0UQ)（2026-10-06），依公開說明與章節整理。職場與面試的對照為我的觀點。[HackerRank 題目](https://www.hackerrank.com/challenges/the-birthday-bar/problem)。
