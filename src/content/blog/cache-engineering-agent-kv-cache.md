---
title: "[News] Cache Engineering：Agent 不改寫對話，也能丟掉 KV Cache"
description: "AKV 在保留文字紀錄的同時調整模型可用的 KV cache。從舊工具輸出、後續注意力和推論成本理解這篇論文。"
pubDate: 2026-10-23
category: "AI & Agents"
tags: [AI Agents, Harness]
draft: false
references:
  - title: "Cache Engineering for Agents — arXiv v1"
    url: "https://arxiv.org/abs/2610.28577v1"
  - title: "Cache Engineering for Agents — 論文全文"
    url: "https://arxiv.org/html/2610.28577v1"
  - title: "thu-nics/AKV — 官方實作"
    url: "https://github.com/thu-nics/AKV"
  - title: "AKV System — 支援模型與部署限制"
    url: "https://github.com/thu-nics/AKV/blob/main/akv/system/README.md"
---

Agent 剛讀完一份很長的測試紀錄，後面幾輪可能只需要它找出的錯誤位置。若直接刪掉原始 tool output 或換成摘要，送給模型的前綴會變，先前用來加速推論的快取也可能失效。清華大學與香港中文大學團隊在 2026 年 10 月 20 日提交《Cache Engineering for Agents》，讓系統可以調整之後使用的 KV cache，同時保留文字軌跡。[論文 v1](https://arxiv.org/abs/2610.28577v1)｜[AKV 實作](https://github.com/thu-nics/AKV)

## 文字還在，後續 attention 不必一直看它

一般推論會把已讀 token 的 key/value 狀態存起來，後面的 token 再利用這些狀態。AKV 保留 messages，另外記住哪些 cache 操作發生過。`append` 加入新狀態，`drop` 把選定狀態從後續 attention 移除，`repos` 則調整保留 KV 的位置編碼。原始工具輸出仍可留在紀錄。若需求是刪除資料，還得處理文字、logs、儲存和其他持有副本的系統。[論文方法](https://arxiv.org/html/2610.28577v1)

研究在指定模型與任務集比較不同策略，主要策略保留 reasoning cache 和最近 12 個工具回應。論文在 MiniMax-M2.7、GPT-OSS-120B 和 MiroThinker-1.7-Mini 的多組瀏覽、搜尋和程式修改測試下，報告平均推論成本降低 27.7%。這個平均有例外。MiniMax-M2.7 把 cache 管理做成工具時，在 100 個 BrowseComp-Plus 任務上從 56% 提升到 64%，每題估計成本卻從 5.4 美分上升到 5.9 美分，因為模型多跑了幾輪。對 GPT-OSS-120B 的部分子集，優先移除舊工具回應比移除推理狀態穩定。要是工具回應藏著日後才會用到的原始證據，則有可能省了記憶體、又得返工取一次資料。[論文實驗](https://arxiv.org/html/2610.28577v1)

## 先確認 serving 層有支援

論文另以八張 NVIDIA A800 80 GB 跑 BF16 GPT-OSS-120B，使用 SGLang 0.5.20 並分離前置處理與解碼 workers。在選出的 80 題 SWE-bench Verified 測試中，P95 request latency 達 1.51 倍加速，輸出吞吐量為 1.18 倍。這是作者對特定配置的 serving 測量。

官方系統以 SGLang 為基礎，需配合支援的 serving、模型及 cache 操作，不能靠換一個一般 API 的 prompt 開啟。若評估導入，可用同一批任務對照完整 context、既有摘要和 AKV，量完成率、首 token 等待、GPU 記憶體與人工補查。工具結果被提早丟掉時，特別看模型是否仍能回到證據。這篇沒有在自有環境跑過。[部署限制](https://github.com/thu-nics/AKV/blob/main/akv/system/README.md)
