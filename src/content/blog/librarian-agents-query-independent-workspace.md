---
title: "[News] Librarian Agents：讓 Agent 先整理文件，再回答問題"
description: "為一套反覆被問的文件先建索引和合成筆記，再用未見過的問題檢查答得對不對。"
pubDate: 2026-10-20
category: "AI & Agents"
tags: [AI Agents, Harness]
draft: false
references:
  - title: "Librarian Agents：論文 v1"
    url: "https://arxiv.org/html/2610.22273v1"
  - title: "arXiv：版本與提交時間"
    url: "https://arxiv.org/abs/2610.22273v1"
  - title: "Librarian Agents：研究程式碼"
    url: "https://github.com/teresaz05/librarian-agents/tree/27c9d86391b5da9c04e88b920076fa3867782bb9"
  - title: "Librarian Agents：評分紀錄與結果"
    url: "https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/RESULTS.md"
  - title: "Librarian Agents：重現範圍與設定"
    url: "https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/REPRODUCING.md"
  - title: "Librarian Agents：checkpoint 設定"
    url: "https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/CHECKPOINTS.md"
---

假設 API 限流寫在一份文件，企業方案的例外在另一份。客服每次被問到要重新找兩份，也可能只找到其中一份。Librarian Agents 的研究把這段整理提前：讓 builder 先把同批文件整理成可以重用的工作區，再讓另一個 Agent 接問題。論文 v1 在 2026 年 10 月 15 日 UTC 提交，台灣時間是隔天凌晨。[arXiv 版本與日期](https://arxiv.org/abs/2610.22273v1)

## 問題還沒來，怎麼知道整理得好？

Builder 可以新增或合併合成文件，移除自己做出的冗餘筆記，原始文件則保留。研究用強化學習訓練 builder，回饋來自固定的回答 Agent 能不能用工作區答對；正式驗收題沒有先交給整理者。這能避免把「摘要看起來順」當成唯一目標，也留下回去查例外條款的路。[論文方法](https://arxiv.org/html/2610.22273v1)

原文在公開 repo 的 `27c9d86` 執行 `bash scripts/reproduce_results.sh`，重算的是作者附上的評分紀錄。BrowseComp+ reuse 的 50 組文件、443 題中，Librarian 答對率 63.66%，未微調的 builder 為 24.15%。這次核對能重算統計，沒有自行重新訓練 builder 或跑完整推論。[公開實作](https://github.com/teresaz05/librarian-agents/tree/27c9d86391b5da9c04e88b920076fa3867782bb9)｜[評分結果](https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/RESULTS.md)｜[重現範圍](https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/REPRODUCING.md)

## 目錄影響讀的成本，答題結果要另外看

在有完整快照的 49 組文件、435 題裡，攤平目錄比原始階層多讀約 1,862 個導覽 token，每題答對率的點估計則略高。若要用在產品文件，先用一小批固定版本，保留未給 builder 看過的題目，比較直接檢索和預先整理。再改一條原始限制，看看 Agent 會引用新文件還是繼續拿舊筆記回答。原研究以靜態文件為主，這一步需要自己驗證。[階層消融資料](https://github.com/teresaz05/librarian-agents/blob/27c9d86391b5da9c04e88b920076fa3867782bb9/RESULTS.md)
