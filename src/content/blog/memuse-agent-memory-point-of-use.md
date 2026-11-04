---
title: "[News] MemUse：Agent 取回記憶後，真的有用上嗎？"
description: "MemUse 從 delivery 一路追到 action 與 observed effect。8,000 個 SWE-bench Verified episodes 顯示，memory 系統的任務成功率接近，實際使用型態、成本與重複內容卻差很多。"
pubDate: 2026-11-04
category: "AI & Agents"
tags: [AI Agents, Memory, Evaluation]
draft: false
references:
  - title: "Delivered, Not Used: Evaluating Agent Memory at Its Point of Use"
    url: "https://arxiv.org/abs/2611.01718"
  - title: "MemUse paper — arXiv HTML"
    url: "https://arxiv.org/html/2611.01718"
  - title: "MemUse — Hugging Face Papers"
    url: "https://huggingface.co/papers/2611.01718"
relatedPostIds:
  - memhub-shared-memory-data-lifecycle
  - librarian-agents-query-independent-workspace
  - agent-monitoring-coverage-compaction
---

Memory system 回傳了一段看似相關的內容，Agent 也順利完成任務。這兩件事同時發生，仍不能證明 Agent 真的用了那段 memory。它可能早就在 context 看過相同資訊，也可能完全忽略 retrieval，甚至先被錯誤建議帶偏，最後靠其他線索修正回來。

2026 年 11 月 1 日發布的論文 [Delivered, Not Used](https://arxiv.org/abs/2611.01718) 提出 MemUse，試著從 recorded trajectory 判斷每次 memory delivery 是否影響後續 action，以及觀察到的結果是改善、無效或造成傷害。研究團隊把它用在 8,000 個 SWE-bench Verified episodes；四種 memory 設定的解題率和 no-memory baseline 最多只差 0.4 個百分點，delivery 品質、使用率、重複內容與成本卻差很多。

本文依 arXiv v1 論文整理。我沒有在本機重跑 MemUse，也沒有獨立 reproduction 結果；文中的數字皆為作者實驗結果。

## TL;DR

- Retrieval relevance、任務成功率與實際使用是三件不同的事。MemUse 把「送進 context」、「影響 action」和「action 的 observed effect」分開記錄。
- 作者在 8,000 個 memory-enabled episodes 中發現，各設定的解題率都接近 73%，但成本增加 8.8% 至 293.2%，而且每個系統有 51.3% 至 79.7% 的 relevant entries 沒有被使用。
- 109,059 次 deliveries 中，81.02% 是同一 injection span 內的 restatement。重複送進去的文字仍占 token，即使它沒有增加新的判斷價值。
- 成功與失敗會遮住局部效果：23.2% 含 beneficial memory use 的 episodes 最後仍失敗；16 個含 harmful use 的 episodes 中，有 5 個最後仍成功。
- 方法的主要限制是昂貴的 agentic judge、判斷仍帶主觀性、實驗集中在 coding tasks，且截至本文整理時未看到可驗證的公開實作或獨立重現。

## 為什麼只看 Retrieval 與 Resolve Rate 不夠？

傳統 memory eval 常回答兩個問題：

1. 有沒有取回相關資訊？
2. 有 memory 的 Agent 是否更常完成任務？

這些指標很重要，卻少了一段中間因果鏈。假設 retrieval 回傳「先檢查 parser 的 boundary condition」，Agent 後來也修改了 parser，至少還有三種可能：

- Agent 依照 memory 的具體線索採取行動。
- 相同線索原本就存在於 task、tool output 或目前 context。
- Agent 沒有採用 memory，只是獨立走到相同方向。

任務結果也會把局部行為壓成一個 pass／fail。Memory 可能幫 Agent 找到正確元件，但它又漏修另一個 bug；也可能先把 Agent 導向錯誤檔案，後來被測試結果拉回來。只看最終結果，兩種情況分別會被記成「memory 無效」與「memory 有效」。

MemUse 的主張比較收斂：它不宣稱從 observation 還原 counterfactual causal effect，而是判斷 recorded episode 中，有沒有證據顯示某次 delivery 影響 action，以及後續觀察到什麼結果。

## MemUse 怎麼把 Delivery 接到 Action？

MemUse 先在 model API 邊界記錄 Agent 實際收到的 request，再用 memory bridge 標記哪一段文字來自 memory。每一筆 delivery 會和移除該 delivery 後的 prior context 比較，避免把原本就可見的資訊算成 memory 貢獻。

評估拆成三層：

| 層級 | 問題 | 主要訊號 |
| --- | --- | --- |
| Information | 這段內容對當下任務有用嗎？原本已經看過嗎？ | relevance、accuracy、novelty |
| Use | Agent 後來有依照它行動嗎？ | acted on、selected、referenced、none |
| Consequence | 相關 action 之後發生什麼？ | improved、no effect、harmed、undetermined |

Memory 常被 host 每輪重複插入，因此 MemUse 把仍在 context 可見、內容與順序相同的重複 delivery 合併成 injection span。後續 copy 算進 delivered text volume，但不會重複增加評分權重。

每個 entry 另有 credit window。Window 從第一次 consumption 開始，直到新的版本接手，或 episode 結束。Agent 在 window 內採取的 action 才能歸因給該 entry；action 的後果則會繼續追到 episode 結束。這個設計能捕捉「讀完幾步之後才採用」的情況，也避免同一段文字反覆搶走 credit。

判斷由 agentic judge 完成，但它不能只交一段自然語言理由。Judge 必須完整讀取 task、prior context、consuming step 與引用的 trajectory steps；判為 acted on 或 selected 時要提供 action anchors，判定 effect 時則要讀到 episode 結尾。程式化檢查會拒絕證據覆蓋不足的答案。

## 8,000 個 Episodes 顯示了什麼？

作者使用全部 500 個 SWE-bench Verified tasks，依歷史順序交錯排列 12 個 Python repositories。Agent 是 mini-SWE-agent，model 為 gpt-6-luna。四種 memory 設定與 no-memory baseline 各跑四次；因此有 8,000 個 memory-enabled episodes，加上 2,000 個 baseline episodes。

四種設定涵蓋三套系統：

- MemGovern：Agent 主動搜尋固定的 experience-card corpus。
- Mem0 local＋global：host 先做 task recall，Agent 也能搜尋或寫入跨 scope memory。
- Mem0 local：限制在 repository 與 episode scopes。
- TencentDB Agent Memory：proxy 反覆插入 persona、scene index、skill catalog，Agent 可再讀取完整內容。

作者報告的整體結果如下：

| 設定 | Resolved | 與 baseline 差異 | 每 episode 成本 | 成本增加 |
| --- | ---: | ---: | ---: | ---: |
| No memory | 73.0% | — | US$0.0045 | — |
| MemGovern | 73.4% | +0.40 pp | US$0.0049 | +8.8% |
| Mem0 local＋global | 72.7% | -0.25 pp | US$0.0062 | +37.7% |
| Mem0 local | 72.8% | -0.20 pp | US$0.0062 | +38.1% |
| TencentDB | 72.7% | -0.30 pp | US$0.0178 | +293.2% |

所有差異的 95% paired-bootstrap interval 都包含 0。依這組實驗，不能把任一設定寫成已證明提升解題率。

Point-of-use 資料則揭露了 resolve rate 看不到的差異：

- 每個系統平均有 71.5% 至 98.6% 的 entries 與當下任務無關。
- Relevant entries 中，有 51.3% 至 79.7% 沒有被 acted on、selected 或 referenced。
- 714 個 acted-on entries 裡，421 個被判為 beneficial、16 個 harmful、64 個 no effect，另外 213 個效果無法確定。
- MemGovern 每百萬 delivered tokens 產生 50.50 個 beneficial entries；其他設定介於 3.08 至 4.92，但 MemGovern 的 harm share 也最高。
- 109,059 次 deliveries 中，81.02% 是 restatements。Mem0 的可見內容重複 copy 占 delivered tokens 的 68.1%。

更值得注意的是，價值集中在少量完整內容。MemGovern 的 full cards 只占 12.5% delivered tokens，卻供應 96.4% beneficial entries；TencentDB 的 full skills 占 2.0% tokens，供應 86.0% beneficial entries。Preview 與 index 的主要價值是幫 Agent 選到後續要完整讀取的項目。

這組結果支持的工程判斷很具體：memory coverage 高不代表 delivery 有效。若系統每輪塞入同一份 persona 或 catalog，coverage 甚至可能接近滿分，同時大量消耗 context。

## 成功不代表 Memory 沒有傷害，失敗也不代表它沒幫忙

作者在有 harness 結果的 episodes 中找到兩種容易被 aggregate metric 淹沒的情況：

- 383 個含 beneficial use 的 episodes 中，有 89 個最後失敗，占 23.2%。
- 16 個含 harmful use 的 episodes 中，有 5 個最後成功，占 31.3%。

這不代表 MemUse 已證明 memory 對最終結果的反事實影響。它說的是 recorded trajectory 裡，局部 action 與 observed consequence 可以和最後的 pass／fail 方向不同。

對 production Agent 來說，這個差異很實際。只用 task success 做 regression gate，會漏掉「先走三個錯誤步驟才自行修正」的退化；只看失敗案例，又可能刪掉能穩定縮短調查路徑的 memory。比較合理的做法是把 local effect、總成本與最終結果一起保留。

## 工程上可以先補哪些 Trace？

不需要一次重做整套 evaluator。若現有 Agent 已經能保留 model request、tool call 與 memory retrieval，可以先為每次 delivery 加上幾個欄位：

| 欄位 | 用途 |
| --- | --- |
| delivery_id、memory_entry_id、version | 區分同一 item 的不同版本與每次曝光 |
| consuming_model_call_id | 確認哪次 model request 真的收到內容 |
| placement、content_digest | 驗證 memory 出現在 system、tool result 或其他位置 |
| prior_visible_digest | 檢查相同內容是否本來就在 context |
| credit_window | 限定可能受影響的後續 steps |
| action_anchor | 指向使用該資訊的 search、edit、test 或 tool call |
| observed_effect、evidence_steps | 保留 benefit、harm 與不確定性的證據 |
| delivered_tokens、retrieval_cost | 讓重複 delivery 與效益一起比較 |

接著用固定任務做 no-memory baseline，先量三個比例：irrelevant delivery、relevant-but-unused、visible-context restatement。這些指標通常比建立完整 LLM judge 便宜，也直接指向可修的問題。

若重複內容占比高，優先做去重與版本檢查；若 relevant-but-unused 高，檢查 delivery timing、格式與 actionability；若 preview 很少導向 full read，問題可能在 selection interface 或 tool description。等 trace 穩定後，再抽樣交給 judge，並保留人工 audit set 檢查 attribution 是否一致。

## 成熟度與風險

MemUse 目前比較適合當 eval 設計參考，還不適合直接當成已成熟的通用標準。

首先，這是一篇作者自行執行的 arXiv v1 研究，沒有獨立 replication。實驗集中在 SWE-bench Verified、Python repositories、mini-SWE-agent 與特定 models；客服、研究、browser-use 或個人助理的 memory 行為可能不同。

其次，point-of-use attribution 仍由 LLM judge 判斷。作者用完整讀取要求、anchors、coverage checks 與 fixed aggregation rules 限制自由度，但「某個 action 是否由 memory 影響」仍可能有競爭解釋。研究也提供 gold patch 給 judge，這比完全 reference-free 的 production 環境多一項訊息。

第三，評估成本很高。15,271 個 judged spans 共使用 77,329 次 model calls，平均每個 span 5.06 次，並消耗約 5.84 億 uncached input tokens、17.10 億 cached input tokens與 1.10 億 output tokens。這套流程不適合原封不動套在每個 production session。

最後，MemGovern corpus 被作者發現和 benchmark problem 的 issue、PR 與 repair history 有重疊，部分 beneficial guidance 可能帶有 retrieval-time leakage。這不會抹掉 MemUse 的 trace 方法，但會限制實驗結果能外推到哪裡。

截至本文整理時，arXiv 頁面沒有列出 MemUse 的公開程式碼 repository；在可重跑的 recorder、adapters、judge prompts 與 aggregation scripts 出現前，採用成熟度應視為研究原型。

## 我的判斷

這篇論文最值得帶回工程現場的觀念，是把 memory delivery 當成可觀測事件，而非只在任務結束後比較分數。Retrieval 命中之後，還要知道內容是否新增資訊、Agent 是否採取相應 action、後續有沒有觀察到 benefit 或 harm，以及這段 memory 為 context 增加多少成本。

近期要導入 Agent memory 的團隊，可以先採用輕量版本：記錄 delivery、去除可見重複、連結 action anchors，再把少量高風險或高成本 trajectory 交給 judge。這比直接追求更多 recall 更容易回答真正的採用問題：送進去的記憶，究竟有多少轉成了可驗證的行動價值。
