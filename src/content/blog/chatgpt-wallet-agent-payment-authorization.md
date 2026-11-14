---
title: "[News] ChatGPT Wallet：Agent 能代付款後，授權、重試與責任怎麼切？"
description: "ChatGPT Wallet 讓 Agent 以 tokenized payment credential 完成付款。從交易批准範圍、狀態不明的重試與 merchant of record，整理不可逆 Agent 操作需要的工程邊界。"
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

當 Agent 從「幫我找商品」走到「幫我結帳」，風險就不再只是回答錯誤。它可能選錯規格、沿用過期價格，或在結帳結果不明時重送一次訂單。

OpenAI 在 **2026 年 11 月 13 日**推出 ChatGPT Wallet，初期於 dots 提供給美國 ChatGPT Pro 使用者。使用者先加入符合資格的美國信用卡，每筆購買仍要檢查商品、總額與卡片，再以 Face ID、Touch ID 等生物辨識核准；核准後，由支付網路提供代替實體卡資料的 payment token，Agent 與商家不會取得使用者實際卡號。

這篇依官方公告、11 月 12 日生效的 Wallet Terms 與 Help Center 整理，沒有實際取得 rollout、完成交易或測試拒付。重點放在工程問題：**一次批准究竟授權了什麼，以及交易狀態不明時為什麼不能直接重試。**

## 這篇的重點

- Wallet 現階段不是讓 Agent 自由花錢。每筆購買都要由使用者檢查並核准，批准範圍綁定商家、品項、金額、卡片、收件人與配送條件；重要資訊變更要重新核准。
- Payment token 降低實際卡號暴露，但商家仍需要姓名、聯絡方式與配送地址。支付資料隔離不等於整筆訂單都匿名。
- 結帳回報錯誤，不代表商家沒有收單。官方明確要求先查 order confirmation、收據或 pending charge，再決定是否重試。
- 商家仍是 seller 與 merchant of record，負責價格、出貨、退貨與客服；OpenAI 不是銀行、發卡機構或交易商家。
- 初期只在美國、Pro、dots 與符合資格的卡片逐步開放，且缺少獨立的成功率、誤拒率與爭議處理資料，現在較適合視為受限 rollout。

## 一次批准需要是「有範圍的能力」

Wallet Terms 對批准範圍寫得很具體。確認畫面會列出可取得的商家、品項與數量、總價或最高價格、卡片，以及是否包含 recurring charge、deposit 或 authorization hold。使用者的批准只涵蓋畫面上的商家、品項、金額、卡片、收件人、配送資訊與其他條件；提交前若有重要變更，Wallet 必須再次要求批准。

這個設計可以抽象成一份短效、不可擴張的 authorization envelope：

```ts
type PurchaseAuthorization = Readonly<{
  id: string;
  merchantId: string;
  itemDigest: string;
  maximumAmount: number;
  currency: string;
  paymentCredentialId: string;
  recipientDigest: string;
  recurring: boolean;
  expiresAt: string;
}>;
```

這不是 ChatGPT Wallet 的 API，也沒有拿來呼叫真實付款。它是可套用到自家 Agent 的設計範例：批准後，Agent 可以在 envelope 內完成已確認的動作，不能自行換商家、加品項、提高金額或改成定期扣款。

`itemDigest` 與 `recipientDigest` 的目的，是避免把完整個資和訂單內容散布到每一層 log，同時讓 runtime 能檢查「現在準備提交的內容」是否仍等於「使用者剛剛批准的內容」。實際實作仍要定義 canonical serialization、hash 演算法、過期時間與 key rotation，不能只把 JavaScript 物件直接 stringify 就當成安全憑證。

## Payment token 解決卡號暴露，沒有消除所有資料風險

核准後，支付網路會產生 tokenized 或 virtual payment credential，實際扣款仍落在原信用卡帳戶。這讓 Agent 與商家不必取得使用者實際卡號，也保留符合條件的信用卡 rewards 與 dispute protections。

但完成訂單仍可能需要姓名、電話、Email、帳單地址與配送地址。官方 Help Center 也提醒，這些資料可能在對話中被要求；只有卡號、到期日、安全碼與驗證碼必須留在 secure form，不能貼進聊天。

因此資料邊界至少要拆成三類：

| 資料 | 誰需要 | 建議處理方式 |
| --- | --- | --- |
| 實際卡號與安全碼 | 支付服務與發卡端 | 不進 Agent context、chat transcript 或一般 application log |
| Payment token／virtual credential | 指定交易的 checkout | 短效、綁定交易，禁止重複使用或擴張用途 |
| 收件與聯絡資料 | 商家履約 | 只提供完成該訂單必要欄位，保留目的與接收方紀錄 |

把卡號 tokenized 是必要的一層，仍要另外管理 PII、訂單內容、對話留存與商家自己的 privacy policy。

## 結帳失敗最危險的狀態是 `unknown`

Agent 呼叫 checkout 後可能看到 timeout、網頁停止回應或 conversation error。這些訊號無法證明商家沒有收單：商家可能已建立訂單，付款也可能只留下 pending authorization，但最後一個回應沒有回到 Agent。

官方 Help Center 的處理原則很明確：先查 merchant order confirmation、收據或 order status；如果有 pending charge，先向商家確認訂單是否成立，必要時再詢問發卡機構。不要因為對話顯示錯誤就立刻再買一次。

工程上可以把購買流程建模成以下狀態：

| 狀態 | 意義 | 可否自動重試 |
| --- | --- | --- |
| `proposed` | Agent 已準備訂單，尚未批准 | 可重新產生 proposal |
| `approved` | 使用者批准固定條件，尚未提交 | 只能在批准範圍內提交一次 |
| `submitted` | 已送出，等待商家結果 | 不應再建立第二筆購買 |
| `accepted` | 商家確認訂單 | 不可重試 |
| `declined` | 商家或支付端明確拒絕 | 依新條件重新批准後才可再試 |
| `unknown` | timeout、斷線或回應遺失 | 先查詢與對帳，不能盲目重送 |

這裡需要兩種不同機制：

1. **Idempotency key**：同一次批准的重送，商家或中介層只能建立一筆訂單。
2. **Reconciliation**：Agent 依 merchant order ID、approval ID、時間與金額查詢既有結果，將 `unknown` 收斂成 `accepted` 或 `declined`。

若商家 checkout 不支援 idempotency 或查單 API，Agent 的安全選項應該是停住並請人確認，而不是猜測「大概沒成功」。這個原則也適用於訂房、轉帳、發信、部署與刪除：副作用已可能發生時，重試必須先取得可驗證的既有狀態。

## 付款成功後，責任沒有轉給 Agent 平台

Wallet Terms 把角色切得很清楚：商家仍是 seller 與 merchant of record，交易發生在使用者和商家之間。商品內容、價格、庫存、履約、退貨、退款與客服依商家條款處理；信用卡帳務錯誤或未授權交易則由發卡機構處理。OpenAI 可以提供 Wallet 紀錄或合理協助，但不決定商家退款，也不是銀行、發卡機構、支付網路、貸款方或商家。

這對 Agent 產品的含意是：介面不能只顯示「已完成」。它至少要保存並呈現 merchant、order ID、批准內容、提交時間、最終狀態，以及爭議時該找誰。使用者需要知道 Agent 是協助提交交易，並沒有取代商家與支付系統原本的責任鏈。

## 未來的預先授權，會把風險再往前推一層

OpenAI 公告把 spending limit、purchase category 與 time period 描述為未來方向，讓使用者可以事先批准一段範圍，再由 Agent 自行完成購買。這還不是目前每筆生物辨識確認的預設行為，不應寫成已上線能力。

若之後真的導入，只有「每月上限 1,000 元」仍不夠。至少還要限制：

- 允許的商家與商品類別；
- 單筆與累積金額；
- 時間範圍與時區；
- 是否允許 recurring charge、訂金或價格浮動；
- 收件人與配送範圍；
- 取消、退貨與失敗後重試規則；
- 使用者可以即時撤銷的方式。

預先授權要把自然語言意圖編譯成 runtime 可以拒絕的 policy，並在每次工具呼叫前檢查；單純把 prompt 寫得更詳細，無法形成強制邊界。

## 成熟度與採用判斷

ChatGPT Wallet 已是正式宣布的產品，但 rollout 很窄：目前逐步提供給美國 ChatGPT Pro、18 歲以上、符合資格的美國信用卡使用者，只能在 dot 對話使用，Chat、Work 與 standalone Codex threads 都不支援。官方也承認部分網站可能阻擋 Agent，商家的 risk system 可能把合法 Agent 購買判為可疑而拒絕或取消。

目前沒有可比較的跨商家完成率、誤拒率、重複訂單率、退款處理時間或第三方安全評估。American Express、Mastercard、Visa 與多家支付、風控業者的合作，證明它有正式支付生態整合；這不等於可靠性已被廣泛驗證。

對一般使用者，現階段最實際的價值是省下重複輸入付款資料與 checkout 操作，同時保留逐筆檢查。對工程團隊，這次發布更值得借鑑的是三個邊界：**批准必須有明確範圍、支付 credential 不該進入 Agent context、結果不明不能盲目重試。**

## 與既有文章的差異

[Agent-Native](../agent-native-shared-actions-ui-state/) 處理 UI 與 Agent 共用 action、物件 ID 與版本衝突；[MAMUBench](../mamubench-multi-user-agent-coordination/) 討論不可逆操作前的 commit barrier 與多使用者 consent；[Open WebUI Tether](../open-webui-tether-agent-automations/) 關心排程 Coding Agent 的本機權限與 credential exposure。

本篇再往支付場景走一步：一次批准如何綁定交易條件、payment token 與履約資料如何分層，以及 checkout 已可能產生副作用時，狀態機與對帳機制如何避免重複購買。

## References

- [OpenAI：Introducing ChatGPT Wallet](https://openai.com/index/introducing-chatgpt-wallet/)
- [OpenAI：ChatGPT Wallet terms](https://openai.com/policies/chatgpt-wallet-terms/)
- [OpenAI Help Center：Making purchases with ChatGPT Wallet](https://help.openai.com/en/articles/20001654-making-purchases-with-chatgpt-wallet)
