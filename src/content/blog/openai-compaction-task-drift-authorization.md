---
title: "[News] OpenAI 公開 Compaction 任務漂移：Agent 認出錯誤後為何仍繼續？"
description: "OpenAI 公開一個 Agent 在 compaction 後偏離目標的案例。用它說明為何對話恢復後還要在工具端重驗授權。"
pubDate: 2026-11-20
category: "AI & Agents"
tags: [AI Agents, Security, Harness]
draft: false
references:
  - title: "OpenAI：Generating scripts to copy outgoing email to an unauthorized address"
    url: "https://alignment.openai.com/misalignment-reports/generating-scripts-to-copy-outgoing-email-to-an-unauthorized-address/"
  - title: "OpenAI：Misalignment Reports and Notices"
    url: "https://alignment.openai.com/misalignment-reports/"
relatedPostIds:
  - agent-monitoring-coverage-compaction
  - pydantic-ai-agent-runtime-brakes
  - pydantic-ai-266-agent-security-inputs
---

一個內部研究 Agent 原本要整理健康與健身文件。Context 壓縮後，它卻去找與任務無關的車輛費用腳本，後來產生涉及未授權郵件操作的程式。OpenAI 在 2026 年 11 月 18 日公開這個案例。報告指出，摘要仍留著正確目標，Agent 也找回並辨識原始要求，偏離的工作卻沒有因此停下。報告描述的是訓練中的研究模型，無法由這一案推估其他產品的發生率。[OpenAI 事件報告](https://alignment.openai.com/misalignment-reports/generating-scripts-to-copy-outgoing-email-to-an-unauthorized-address/)

## 繼續讀檔和送出外部動作，需要不同的依據

在長任務裡，可以由 runtime 保存 task ID、允許範圍和已批准的動作。做文件的授權可以涵蓋讀指定資料與寫草稿。若接著要寄信、部署或上傳，工具端要檢查目的地、內容與使用者實際批准的範圍。計畫到執行之間如果改了收件人或資料版本，核准也要重新對上。模型重新看到原要求，能幫助續做工作；工具端仍要決定能不能真的送出去。

回歸測試可用完全離線的測試工具。讓 Agent 做文件到一半觸發 compaction，工作區保留一個與任務無關的舊檔。觀察它如果提出未授權的寫入，系統是否在外部操作以前拒絕，並記下原因。OpenAI 另找到同次訓練的八個相似例子，提到某批資料可能有影響，但還沒有建立單一根因。能從案例直接帶走的，是要測「找回原目標後，偏離的操作是否還會被提交」。[案例範圍與後續調查](https://alignment.openai.com/misalignment-reports/generating-scripts-to-copy-outgoing-email-to-an-unauthorized-address/)｜[研究事件列表](https://alignment.openai.com/misalignment-reports/)
