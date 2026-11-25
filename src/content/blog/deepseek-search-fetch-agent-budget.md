---
title: "[News] DeepSeek 開放 Search／Fetch：多 Agent 得共用請求預算"
description: "DeepSeek 開放搜尋和網頁擷取 API。用三個 Agent 共用帳號的情境，拆請求成本、限流與讀不到內容的處理。"
pubDate: 2026-10-18
category: "AI & Agents"
tags: [AI Agents, Harness]
draft: false
references:
  - title: "DeepSeek：2026-10-17 Change Log"
    url: "https://api-docs.deepseek.com/updates/"
  - title: "DeepSeek：Search & Fetch guide"
    url: "https://api-docs.deepseek.com/guides/search/"
  - title: "DeepSeek：Search API reference"
    url: "https://api-docs.deepseek.com/api/search/"
---

把一個研究題拆給三個 Agent，很快就會遇到這種情況：三邊同時找到同一份 release note，各自 Fetch，還一起撞到限流。DeepSeek 於 2026 年 10 月 17 日開放 Search／Fetch。Search 提供網址與摘要，Fetch 拿正文，因此命中搜尋結果後要另記正文有沒有真的拿到。[DeepSeek 更新紀錄](https://api-docs.deepseek.com/updates/)｜[API 文件](https://api-docs.deepseek.com/api/search/)

## 同一帳號開三把 key，也共用額度

按原刊時的文件，Search 和 Fetch 分開計費，各為每千次成功且有結果的請求 0.75 美元，兩個端點各有每帳號 5 QPS，Fetch 另有網域級限制。假設 1,000 個任務、每個用 2 次有效 Search 和 6 次有效 Fetch，按上述單價是 6 美元，未含模型費。平行跑得多，容易碰到的是同一秒裡的請求額度。可以讓各任務透過共用間隔與 URL 去重，減少為同一來源付費多次。[DeepSeek Search／Fetch 計價及限流](https://api-docs.deepseek.com/guides/search/)

## 有搜尋摘要，仍可能沒有來源正文

即使 Search 開啟 `need_content`，`content` 仍可能是空字串。可以留下 URL 與搜尋時間，將這筆標成「尚未讀到原文」。遇到 429 或暫時逾時，等一下再試並設上限。如果頁面需要權限，應找可用的官方發布或回報證據缺口。用一批已知文章測看看：能不能找到原始頁、抓到日期和正文，以及找不到時報告會怎麼寫。原文未呼叫 API 實測。[Search API 欄位](https://api-docs.deepseek.com/api/search/)｜[錯誤與重試說明](https://api-docs.deepseek.com/guides/search/)

要確認空字串怎麼進到呼叫端，可以從下方這筆唯讀查詢看起。先設定 `DEEPSEEK_API_KEY`，並留意可能收費。這段依官方文件整理，原文未實跑。

```bash
curl --fail-with-body https://api.deepseek.com/v1/tools/search \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "agent site:github.com",
    "count": 5,
    "need_content": true
  }'
```
