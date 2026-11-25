---
title: "[News] Eleven Realtime：語音 Agent 不能只量第一句有多快"
description: "Eleven Realtime 的 Mini 和 Max 在語音節奏與工具任務各有差異。從插話、失敗和最終狀態驗收。"
pubDate: 2026-10-21
category: "AI & Agents"
tags: [AI Agents, Harness]
draft: false
references:
  - title: "ElevenLabs：Introducing Eleven Realtime"
    url: "https://elevenlabs.io/blog/realtime"
  - title: "ElevenLabs：Realtime models"
    url: "https://elevenlabs.io/docs/eleven-agents/customization/realtime-models"
  - title: "ElevenLabs：OpenAI Realtime API compatibility"
    url: "https://elevenlabs.io/docs/eleven-agents/guides/openai-realtime-compatibility"
  - title: "Artificial Analysis：Speech to Speech Leaderboard"
    url: "https://artificialanalysis.ai/speech-to-speech"
  - title: "Artificial Analysis：Speech to Speech Benchmarking Methodology"
    url: "https://artificialanalysis.ai/methodology/speech-to-speech-benchmarking"
---

語音客服一接起來 0.6 秒就能出聲，還是可能不好用。使用者說到一半停一下，它以為講完了。它也可能說「查好了」，工具卻根本沒取得結果。ElevenLabs 於 2026 年 10 月 20 日推出 Realtime v1 Mini 與 Max，把語音辨識、推理、工具和語音輸出放進受管理的串流。先確認產品最常失敗的那一段，再挑模型比較。[ElevenLabs 發布公告](https://elevenlabs.io/blog/realtime)

## 快開口和把事做完，可以量出不同結果

Artificial Analysis 的結果如下，指標用的題目與量測方式各自不同。Max 的工具任務成功率較高，Mini 的對話節奏分數略高。做查件或改預約時，應另外比任務最後的狀態。做簡單語音導覽時，插話與正確停頓可能更常遇到。[語音評測結果](https://artificialanalysis.ai/speech-to-speech)｜[評測方法](https://artificialanalysis.ai/methodology/speech-to-speech-benchmarking)

| 指標 | v1 Mini | v1 Max | 能回答的問題 |
| --- | ---: | ---: | --- |
| Big Bench Audio 推理正確率 | 75.9% | 98.8% | 聽到語音題目後能否答對 |
| Time to first audio | 0.62 秒 | 0.57 秒 | 多快開始輸出第一段聲音 |
| Full-Duplex-Bench 對話節奏 | 95.8% | 94.1% | 能否處理停頓、輪替、插話與 backchannel |
| Speech Agent Arena 工具任務成功率 | 60.3% | 87.1% | 是否完成正確的任務工具呼叫 |

## 已有 WebSocket client，換端點後還要驗什麼？

官方所稱的 OpenAI Realtime 相容涵蓋 WebSocket 與相關 client/server events。既有 SDK 可以作為接入起點，電話通路、管理方式和可調的功能仍要按文件比對。Managed 模式把多個模型的協作交給服務；若產品需要自行指定模型、推理設定或工具並行，先查該模式提供哪些開關。[相容範圍](https://elevenlabs.io/docs/eleven-agents/guides/openai-realtime-compatibility)｜[Realtime models](https://elevenlabs.io/docs/eleven-agents/customization/realtime-models)

用測試帳號試一段完整對話：使用者停頓、插話改題，接著工具逾時。記錄第一段聲音何時出現、Agent 有沒有打斷錯的人、能否轉交人工，以及最後的資料狀態。這篇採文件與第三方評測，沒有做通話實測。
