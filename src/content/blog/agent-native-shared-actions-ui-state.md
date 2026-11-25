---
title: "[News] Agent-Native 的共享 Action：聊天與 UI 怎麼操作同一份資料？"
description: "讓按鈕和聊天一起用同一個改名操作，從報表 ID、版本檢查與畫面刷新看 Agent-Native Beta。"
pubDate: 2026-10-16
updatedDate: 2026-10-17
category: "AI & Agents"
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

使用者選中「十月營收」，在旁邊的聊天框說「把這份改成第三季結果」。要做對這件事，Agent 得知道目前選中的報表 ID，server 要檢查使用者能不能改這份報表，畫面也要在寫入後顯示新名稱。Builder.io 於 2026 年 10 月 14 日推出 Agent-Native Beta，提供把這幾個部分接起來的 TypeScript 框架。[Builder.io 發布文](https://site.builder.io/blog/introducing-agent-native)

## 先讓按鈕和 Agent 走同一條改名規則

如果按鈕會驗證長度，Agent 卻能直接改 database，新增名稱限制時就得記得改兩個入口。Agent-Native 把操作放在 `actions/`，讓 UI 和 Agent 等入口共用。唯讀用途也先把可信任的操作寫清楚。為了讓「這份」有指向，傳報表 ID 和當前版本即可；若有必要，再讀回畫面資料。權限由伺服器用真正的登入身分判斷。[Actions 文件](https://www.agent-native.com/docs/actions-overview/)｜[Context Awareness](https://www.agent-native.com/docs/context-awareness/)｜[Access & Authorization](https://www.agent-native.com/docs/actions-access-control/)

以下是框架無關的 TypeScript 範例，只表達輸入與版本檢查。資料庫還需要用 ID 與版本一起做條件更新，避免兩個請求讀到同一個版本後各自寫入成功。

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

## 看得到新名稱，才算流程走完

資料存好後，列表可能還在用舊的 query cache。官方文件說明本機工具執行後的刷新與 cache invalidation；其他分頁或其他使用者做的變更則要對照同步機制及設定。若產品已經上線，可以先選改名這一條，逐一驗證：兩個入口走同一個操作、舊版本被拒絕、改完畫面刷新。先用這條流程驗證現有架構，能看清楚為此引入框架的成本。[Data & Sync](https://www.agent-native.com/docs/client-data/)
