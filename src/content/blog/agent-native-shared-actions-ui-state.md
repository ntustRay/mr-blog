---
title: "[Insight] Agent-Native 的共享 Action：聊天與 UI 怎麼操作同一份資料？"
description: "Builder.io 推出 Agent-Native Beta，讓 UI 與 Agent 共用 actions、資料和畫面狀態。值得借用的是操作契約與狀態同步，不必為了多一個聊天入口重寫整套應用。"
pubDate: 2026-10-16
updatedDate: 2026-10-17
category: AI
tags: [AI Agents, TypeScript, MCP]
draft: false
references:
  - title: "Builder.io：Introducing Agent-Native Beta"
    url: "https://site.builder.io/blog/introducing-agent-native"
  - title: "Agent-Native：Actions Overview"
    url: "https://www.agent-native.com/docs/actions-overview/"
  - title: "Agent-Native：Context Awareness"
    url: "https://www.agent-native.com/docs/context-awareness/"
  - title: "Agent-Native：Data & Sync"
    url: "https://www.agent-native.com/docs/client-data/"
  - title: "Agent-Native：Access & Authorization"
    url: "https://www.agent-native.com/docs/actions-access-control/"
  - title: "BuilderIO/agent-native README：查核時的 source snapshot"
    url: "https://github.com/BuilderIO/agent-native/blob/69ad1418582cc9ea014ec065c46ebd98ba1bfa43/README.md"
---

使用者選了一份報表，對旁邊的 Agent 說：「把這份改名。」如果 Agent 不知道選到哪一份，或修改後畫面仍顯示舊名稱，聊天功能就沒有真正接進產品。

Builder.io 在 **2026 年 10 月 14 日**推出 [Agent-Native Beta](https://site.builder.io/blog/introducing-agent-native)。這個 TypeScript framework 把 UI 與 Agent 放到同一套 actions、資料與 application state 上。對既有產品，比較值得先借用的是這個設計方向，而非直接搬整套框架。

本文依官方文件與公開原始碼整理，查核日期為 2026-10-16。沒有安裝 Agent-Native，也沒有執行模型整合或效能評測；文中的 TypeScript 是獨立教學範例，不是它的 SDK API。

## 這篇的重點

- 按鈕和 Agent 可以共用同一個操作契約，減少兩份業務邏輯各自演進。
- Agent 要知道「這份」指什麼，需要穩定的物件 ID 與畫面脈絡，不能只靠聊天紀錄。
- 共用資料仍然需要處理同步、過期版本與重試，框架不會自動替產品決定所有衝突策略。

## 同一個操作，不該有兩份規則

假設 UI 透過 `rename-report` 修改名稱，Agent 卻另外呼叫一個可以任意更新資料列的工具。當產品新增名稱限制時，工程師就得記得改兩邊。

[Agent-Native 的 Action 文件](https://www.agent-native.com/docs/actions-overview/)提供一種收斂方式：在 `actions/` 定義操作，由 UI、Agent、HTTP、CLI、MCP 與 A2A 等入口呼叫。React 端有 query 與 mutation hooks；Agent 端取得工具描述和輸入 schema。

重點在於操作最後走到哪一段業務邏輯，而非所有入口都叫同一個名字。外部工具若仍可繞過 action 直接改表，維護問題並沒有消失。

這個概念也不需要新框架才能實現。既有 Next.js API、application service 或其他 backend，都可以讓多種入口使用同一個經過驗證的操作。

## UI state 要表達意思，不必複製整個畫面

「這份」通常不需要整張 screenshot 才能理解。對自己能修改的應用，可以明確提供目前頁面、報表 ID 與選取項目。

[Context Awareness 文件](https://www.agent-native.com/docs/context-awareness/)把 navigation、selection 與 `view-screen` 分開：前兩者保留小而有意義的狀態，後者再依 ID 取得目前資料。

以報表編輯器為例，可先區分：

| 資料 | 用途 | 不應取代的東西 |
| --- | --- | --- |
| 目前選取的報表 ID | 理解使用者說的「這份」 | server 上的存取權限檢查 |
| 篩選條件與目前分頁 | 理解畫面正在呈現的範圍 | 最新的資料查詢結果 |
| 資料版本 | 判斷修改是否基於舊內容 | database 的原子寫入條件 |

這是應用設計建議，不是 framework 固定的 schema。不要把整份查詢結果長期複製到聊天 context；資料改了，舊副本反而會讓 Agent 很有把握地操作錯誤狀態。

## 一個與框架無關的最小範例

先定義「改名」的契約，再讓 UI adapter 和 Agent tool adapter 都呼叫它。以下函數只計算結果，不寫 database：

```ts
type Report = Readonly<{
  id: string;
  title: string;
  version: number;
}>;

type RenameReportInput = Readonly<{
  reportId: string;
  expectedVersion: number;
  title: string;
}>;

type RenameReportResult =
  | { ok: true; report: Report }
  | { ok: false; reason: "wrong-target" | "conflict" | "empty-title" };

function renameReport(
  current: Report,
  input: RenameReportInput,
): RenameReportResult {
  if (current.id !== input.reportId) {
    return { ok: false, reason: "wrong-target" };
  }
  if (current.version !== input.expectedVersion) {
    return { ok: false, reason: "conflict" };
  }
  const title = input.title.trim();
  if (title.length === 0) {
    return { ok: false, reason: "empty-title" };
  }
  return {
    ok: true,
    report: { ...current, title, version: current.version + 1 },
  };
}
```

這個函數的成功、錯誤目標、版本衝突與空名稱情境，已在本機執行行為測試；也確認輸入物件不會被修改。這只驗證教學函數，不能推成 Agent-Native 整合測試通過。

正式服務仍要先從可信任的 session 取得身分、驗證外部輸入、檢查目標資料的權限。寫入時要在 database 使用原子性的版本條件，不能讀完資料、在 JavaScript 比較一次，就當成已解決並行更新。

例如 UI 先把第 7 版改成第 8 版，Agent 稍後拿第 7 版提出修改，服務應回報衝突並要求重新讀取。也要事先決定：重新讀取後能自動繼續，還是需要使用者再次確認？

## 畫面同步和寫入成功，要分開驗證

UI 和 Agent 共用操作後，還可能有這種情況：server 已經存好，聊天也說成功，但列表的 query cache 還是舊的。

[Data & Sync 文件](https://www.agent-native.com/docs/client-data/)提供 mutation 後的 cache invalidation，以及本機聊天工具完成後的刷新機制。來自其他分頁、使用者或背景工作的同步，則有另外的啟用條件；不宜直接解讀成所有畫面預設都有即時同步。

共用 action 也不等於所有工具都應該開放給 Agent。[Access & Authorization 文件](https://www.agent-native.com/docs/actions-access-control/)將工具暴露、身分授權與人工核准分開處理。產品仍要逐一決定哪些操作可以由哪個入口執行。

## 已有產品可以先試一條完整流程

不用一開始就把 MCP、A2A、memory 和所有協作功能一起導入。先選一個既有功能，例如報表改名，讓兩種入口走完同一個操作：

1. UI 選取報表，Agent 能取得正確 ID。
2. 按鈕與 Agent 使用相同的驗證與業務規則。
3. 任一入口成功修改後，畫面都能顯示實際結果。
4. 舊版本修改、拒絕存取與失敗重試都有明確結果。

比較時可記錄完成率、人工澄清次數、錯誤目標操作與衝突次數。本文沒有這些整合實測數據，也不據此宣稱 framework 比既有架構更快。

Agent-Native 仍是 Beta。公開的 source、範例與持續合併的 PR，讓這套設計有可檢查的實作；這些訊號仍不足以證明你的產品能直接採用。

如果既有服務已經有清楚的操作契約，先加一個薄的 Agent adapter 通常更容易控制改動範圍。等到 UI context、工具暴露與同步機制開始重複維護，再評估完整框架，會更清楚它究竟省掉哪一段工作。
