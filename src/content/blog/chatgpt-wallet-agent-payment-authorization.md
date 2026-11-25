---
title: "[News] ChatGPT Wallet：Agent 能代付款後，授權、重試與責任怎麼切？"
description: "從 ChatGPT Wallet 的單筆確認畫面，看付款授權怎麼綁定、逾時怎麼對帳，以及誰負責退款。"
pubDate: 2026-11-14
category: "AI & Agents"
tags:
  - AI Agents
  - Security
  - Automation
references:
  - title: "OpenAI：Introducing ChatGPT Wallet"
    url: "https://openai.com/index/introducing-chatgpt-wallet/"
  - title: "OpenAI：ChatGPT Wallet terms"
    url: "https://openai.com/policies/chatgpt-wallet-terms/"
  - title: "OpenAI Help Center：Making purchases with ChatGPT Wallet"
    url: "https://help.openai.com/en/articles/20001654-making-purchases-with-chatgpt-wallet"
relatedPostIds:
  - agent-native-shared-actions-ui-state
  - mamubench-multi-user-agent-coordination
  - open-webui-tether-agent-automations
draft: false
---

Agent 幫你找到一個標價 30 美元的商品。等到結帳，運費變了，或者只剩另一個規格。使用者前面說「幫我買」時，可能從沒同意這一組條件。OpenAI 於 2026 年 11 月 13 日推出 ChatGPT Wallet，初期逐步向符合資格的美國 ChatGPT Pro 使用者開放，當時只在 dots 裡使用。每筆購買仍須核對細節並以生物辨識確認。[產品發布](https://openai.com/index/introducing-chatgpt-wallet/)｜[Wallet 使用說明](https://help.openai.com/en/articles/20001654-making-purchases-with-chatgpt-wallet)

## 付款批准要能回答「批准哪一筆」

依條款，確認畫面可以列出商家、品項、數量、總額或上限、使用的卡片、配送與其他條件。提交前若重要條件變了，就要重新請使用者確認。核准後支付網路提供代碼化付款憑證，降低實體卡號暴露；商家履約仍可能需要收件人與地址，這些資料要按完成訂單的需要提供。未來的期間和類別預先授權在原公告是規劃，本文討論的是當時的單筆核准。[Wallet 條款](https://openai.com/policies/chatgpt-wallet-terms/)｜[發布與後續規劃](https://openai.com/index/introducing-chatgpt-wallet/)

## 送出後逾時，先查原訂單

結帳時網頁沒回應，可能是商家還沒收單，也可能已收單但確認畫面沒有回來。這時先查商家訂單、收據或卡片的待處理紀錄，必要時聯絡商家。不要只因 Agent 沒看到成功畫面就重送。若自己設計付款流程，可用一個唯一請求 ID 對回同一筆結帳，並保留「結果不明」讓系統後續對帳。[官方逾時與扣款說明](https://help.openai.com/en/articles/20001654-making-purchases-with-chatgpt-wallet)

商品、配送、退貨或退款按商家條款處理，帳務爭議或可疑扣款則要查發卡機構的程序。介面上留下商家名稱、訂單編號、金額和當前狀態，下次開回來才知道要找哪一端處理。[Wallet 條款與責任](https://openai.com/policies/chatgpt-wallet-terms/)
