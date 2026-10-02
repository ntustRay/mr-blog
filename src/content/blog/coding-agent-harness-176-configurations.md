---
title: "Coding Agent 到底需要多少 Harness？176 組實驗拆開 Planning、Tools 與 Context"
description: "一篇 176 組設定的實證研究，把 Coding Agent 的 Planning、Tools、Context Management 拆開測。結果顯示：Harness 沒有通用最佳解，模型越強，有些腳手架反而越該拿掉。"
pubDate: 2026-10-03
category: AI
tags:
  - AI Agents
  - Harness
  - Coding Agents
draft: false
references:
  - title: "An Empirical Study of Harness Design for Coding Agents — arXiv"
    url: "https://arxiv.org/abs/2609.20804"
  - title: "An Empirical Study of Harness Design for Coding Agents — Hugging Face Papers"
    url: "https://huggingface.co/papers/2609.20804"
  - title: "What Fan et al.’s harness-component ablations measure"
    url: "https://aicharts.io/blog/harness-design-coding-agents"
---

先講這篇研究最值得記住的結論：

> **強模型不一定需要更複雜的 Harness。真正好的 Harness，不是功能最多，而是只留下這個 model、task、budget 真正需要的東西。**

這個結論聽起來很簡單，但現在很多 Coding Agent 的設計方向剛好相反。

Planning、Skills、Tools、Memory、Context compression、Subagents，一層一層往上加。每個功能單獨看都有理由，最後卻很容易變成一套很重的 Harness。

問題是：**這些東西真的都讓 Agent 變強嗎？**

2026 年 9 月公開的研究 [An Empirical Study of Harness Design for Coding Agents](https://arxiv.org/abs/2609.20804)，把這件事拆開來測。

研究固定 Agent 的主要 execution loop，只改三件事：

- Planning
- Action Space，也就是 Agent 可以使用哪些 Tools
- Context Management

總共測了 **4 個模型、2 個 benchmark、176 組 matched settings**。

它沒有要回答「哪個 Coding Agent 最強」。

它問的是另一個更實際的問題：

> **模型不變，只改 Harness，結果會差多少？**

## 先把 Harness 想成工程師的工作環境

假設今天請兩個工程師修同一個 bug。

第一個人桌上有 IDE、搜尋工具、Terminal、TODO list、整理好的文件。

另一個人只有 Terminal，但非常熟 bash。

工具比較多的人，一定做得比較好嗎？

不一定。

如果第二個人可以用一條 command 完成搜尋、修改、驗證，硬把每一步拆成不同工具，反而可能讓工作變慢。

Coding Agent 也是一樣。

Harness 的工作，是替模型提供工作方法和操作環境。

但 Harness 幫不幫得上忙，要看模型本身缺什麼。

## 176 組實驗到底測了什麼？

研究使用四個模型：

- Nemotron-3 30B
- Nemotron-3 120B
- Nemotron-3 550B
- Mistral-Medium-3.5-128B

再跑兩種不同類型的 coding benchmark：

**SWE-Bench Verified**：500 個真實 GitHub repository issue，需要讀 code、找問題、修改並驗證。

**Terminal-Bench 2.1**：89 個 command-line oriented task，更偏 shell 與終端環境。

Context window 測了：

```text
32k
64k
96k
128k
```

Context Management 有五種策略。

另外再做 Planning ON / OFF，以及 predefined tools / Bash only 的 ablation。

最後是 176 組 matched settings。

這裡要先講清楚：**176 是實驗設定，不是只跑 176 個 task。**

而且 Planning 和 Action Space 的 ablation 只在特定的 128k + context-management 設定下測，不是完整 full-factorial experiment。

所以這篇研究比較適合回答：

> 某個 Harness 設計在什麼條件下有用？

不適合被解讀成一套所有 Agent 都該照抄的標準答案。

## Context Management 最重要的工作：不要讓 Agent 半路死掉

談 Agent context 時，常常會直接聯想到：

```text
Memory
RAG
Summarization
Recall
Long-term memory
```

很容易把 Context Management 想成「讓 Agent 記得更多，所以 reasoning 會更好」。

這篇研究看到的主要效果，其實更直接。

**不要爆 context。**

在 32k context window 時，Context Management 的價值很明顯。

沒有管理的 Agent 可能一路：

```text
讀 code
↓
搜尋
↓
跑測試
↓
讀大量 output
↓
Context 滿了
↓
任務直接結束
```

加入 Context Management 後：

```text
讀 code
↓
搜尋
↓
跑測試
↓
舊 output 被壓縮
↓
繼續修改
↓
繼續驗證
```

研究的 trajectory analysis 顯示，它主要是在延長 Agent 能繼續工作的時間，而不是大幅改變 Agent 的 reasoning pattern。

而且 context window 拉到 128k 後，Context Management 帶來的差距會縮小。

所以它解決的第一個問題不是「讓模型更聰明」。

是：

> **不要讓一個本來有機會做完的 Agent，因為 context overflow 提前出局。**

## Context 壓縮也不用一開始就叫 LLM

研究還比較了不同的 context compression 方法。

其中表現最有效率的方向，是先做 deterministic elision。

例如舊的 tool output：

```text
npm install output...
build output...
grep results...
test logs...
```

如果已經很久沒用到，就先用規則把內容縮掉。

真的還是不夠，再讓 LLM 做 summarization。

也就是：

```text
先用便宜的方法清掉舊 output
        ↓
還是不夠
        ↓
才花 token 做 LLM summary
```

這比一碰到 context 壓力，就直接再叫一次模型摘要更有效率。

這裡有一個很實用的工程判斷：

**Context Management 不一定越聰明越好。**

能 deterministic 解掉的問題，就不一定需要再開一次 inference。

## 「先存起來，以後需要再拿」聽起來合理，但 Agent 幾乎沒用

研究還做了一個滿完整的設計。

被 elide 掉的 context 不直接消失，而是放到外部 storage。

Agent 如果之後需要，可以呼叫：

```text
recall_event(...)
```

把舊資料找回來。

架構上非常合理：

```text
Context 不爆
+
資料沒有真的丟掉
+
需要時還能 recall
```

但實驗結果是：Agent **很少真的使用 recall**，也沒有看到 accuracy gain。

於是系統多出：

```text
external storage
recall tool
tool description
state management
```

卻沒有換到明顯收益。

這個結果很值得記住。

> **Architecture diagram 上看起來合理的功能，不代表模型真的會使用。**

Agent feature 最後還是要看 trajectory，而不是只看設計圖。

## Planning：弱模型拿來「不要放棄」，強模型拿來「差不多可以停了」

Planning 是這篇研究最有意思的結果之一。

在 SWE-Bench Verified，Nemotron-3 30B：

| 設定 | Success rate |
| --- | ---: |
| Planning ON | **25.2%** |
| Planning OFF | **13.6%** |

Planning 幾乎把 success rate 拉了一倍。

研究觀察 trajectory 後發現，沒有 Planning 時，30B model 很多 execution 甚至還沒真的修改 file 就停了。

Planning 對它來說比較像扶手：

```text
先理解
↓
找到檔案
↓
修改
↓
測試
```

它不是讓模型突然更會 reasoning。

它是讓模型不要太早放棄。

但到了較強的模型，作用變了。

Nemotron-3 550B 在 SWE-Bench：

```text
Planning ON  → 65.8%, $2.33 / task
Planning OFF → 67.8%, $3.31 / task
```

Mistral-Medium-3.5：

```text
Planning ON  → 68.6%, $3.14 / task
Planning OFF → 69.0%, $4.65 / task
```

Success rate 幾乎沒變，但 Planning 明顯降低成本。

研究的 trajectory analysis 顯示，強模型比較容易在修改完成後繼續做 redundant verification；Planning 讓它比較知道什麼時候該停。

所以同一個 Planning feature，在不同模型上其實在解完全不同的問題：

```text
弱模型
Planning → 不要太早放棄

強模型
Planning → 做完就停，不要一直驗證
```

這比「Coding Agent 到底要不要 Planning」更接近真正的問題。

## Tools 越多，也不代表越強

另一組實驗比較：

**Predefined tools**

例如：

```text
read_file
write_file
edit_file
grep
glob
bash
...
```

和：

**Bash only**

讓 Agent 自己透過 shell 完成大部分工作。

對 Nemotron-3 30B，predefined tools 很重要。

SWE-Bench：

```text
完整 tools：25.2%
Bash only：10.2%
```

Terminal-Bench：

```text
完整 tools：13.5%
Bash only：3.4%
```

弱模型不需要自己想：

```bash
grep -R ...
sed ...
find ...
cat ...
```

它只要知道 search、read、edit，就能繼續往下做。

Harness 幫它把 action space 整理好了。

但 Nemotron-3 550B 的結果完全不同。

SWE-Bench：

```text
完整 tools：65.8%
Bash only：69.4%
```

平均成本：

```text
完整 tools：$2.33
Bash only：$1.11
```

Bash only 的成功率沒有變差，成本卻少了一半以上。

熟 bash 的 Agent 可以一次：

```bash
find ...
grep ...
sed ...
git diff ...
```

完成很多事情。

如果每個操作都拆成 tool：

```text
tool call
↓
result
↓
tool call
↓
result
↓
tool call
↓
result
```

每一次都需要新的 model turn、token 和 tool round-trip。

工具越細，不一定越有效率。

## 但也不能直接得到「強模型只要 Bash」

Mistral-Medium-3.5 就提供了一個很好的反例。

在 SWE-Bench：

```text
完整 tools：68.6%
Bash only：45.4%
```

掉了 **23.2 percentage points**。

但到了更 shell-centric 的 Terminal-Bench，Bash only 又反過來表現更好。

所以答案並不是：

```text
Model 越大
→ Tools 越少越好
```

真正影響結果的是：

```text
這個模型擅長什麼？
+
這個 task 需要什麼？
```

Terminal-Bench 本來就高度依賴 shell。

SWE-Bench 則有大量 repository navigation、search、read、edit。

同一個模型，在不同工作環境下，最適合的 interface 都可能不同。

而且研究作者也提醒，Bash-only 與 predefined-tools 的比較不只改「工具數量」，同時還牽涉 interface prompt、file-state tracking、post-edit diagnostics 等差異。

所以這組結果應該理解成**整套 action interface 的比較**，不能簡化成「bash 一定比較快」。

## 這篇研究真正打破的是「最佳 Harness」這個想法

把結果放在一起：

**Context Management** 在 context 緊張時最有價值，主要是避免 Agent 因 overflow 提前死亡。

**Planning** 對弱模型是完成任務的扶手；對強模型則更像成本控制器。

**Predefined Tools** 對 bash 能力弱的模型有幫助；bash-capable model 則可能用更少的操作完成同一件事。

甚至連看起來很合理的 **Recall system**，模型都可能根本不使用。

所以這篇研究沒有找到：

```text
最強 Planning
最強 Context Management
最強 Tool Set
```

它反而證明了更重要的事情：

> **Harness 沒有脫離 Model 的最佳解。**

換模型，Harness 可能就該跟著換。

換 task，也可能要換。

換 context budget，答案還會再變。

這也是為什麼看到：

```text
Agent 一定要 Planning
Agent 一定要 Memory
Agent 一定要很多 Tools
Agent 一定要超大 Context
```

這類 best practice 時，最好再多問一句：

> **對哪個模型？什麼 task？它解決的是 accuracy、cost，還是 context overflow？**

回到開頭那句話：

> **強模型不一定需要更複雜的 Harness。真正好的 Harness，不是功能最多，而是只留下這個 model、task、budget 真正需要的東西。**

模型變強之後，Harness 不應該只會繼續加東西。

有時候下一個 optimization，反而是**把已經不需要的腳手架拆掉。**
