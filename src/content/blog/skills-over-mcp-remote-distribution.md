---
title: "[News] Skills over MCP：遠端 Skill 怎麼發現、驗證與更新？"
description: "遠端分發 SKILL.md 和支持檔時，從 MCP SDK 2.4.0 看發現、內容核對與執行許可。"
pubDate: 2026-10-26
category: "AI & Agents"
tags: [AI Agents, MCP, Skills]
draft: false
references:
  - title: "Anthropic：Donating Agent Skills to the Agentic AI Foundation"
    url: "https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation"
  - title: "MCP：Skills extension overview"
    url: "https://modelcontextprotocol.io/extensions/skills/overview"
  - title: "MCP TypeScript SDK 2.4.0"
    url: "https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.4.0"
  - title: "MCP TypeScript SDK PR #3047：Skills extension"
    url: "https://github.com/modelcontextprotocol/typescript-sdk/pull/3047"
  - title: "MCP：Extension support matrix"
    url: "https://modelcontextprotocol.io/extensions/client-matrix"
---

團隊把同一份 review Skill 複製到三種 Agent 裡，改一次得同步三份。若改成由 MCP server 提供，問題就變成 client 能不能找到它、版本變更時看不看得出來，以及裡面附的程式能不能執行。

SEP-2640 在 2026 年 9 月 13 日成為 Final extension。Anthropic 10 月 22 日宣布把 Agent Skills 標準移交 Agentic AI Foundation，MCP TypeScript SDK 2.4.0 也加入 `loadSkills`、`SkillsExtension` 和 `SkillsClient`。Agent Skills 定義內容怎麼包，MCP 擴充則提供發現和讀取遠端內容的方式。[Anthropic 公告](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation)｜[MCP Skills 擴充](https://modelcontextprotocol.io/extensions/skills/overview)｜[SDK 2.4.0 release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.4.0)

## 看得到檔案清單，還要確認手上收到的內容

`skills/list` 找出 Skill，`skills/get` 取得它的 manifest。裡面可列 `SKILL.md` 和附檔的 URI、大小和 SHA-256 digest。若下載內容與 manifest 不符，client 就能發現變更。Digest 需要連著 server 身分、URI 和核准時的內容一起記；同一個來源可以合法更新，若來源被替換，單看新 manifest 的雜湊一致也不能證明可信。[MCP manifest 與完整性規格](https://modelcontextprotocol.io/extensions/skills/overview)

下方是 SDK 2.4.0 的唯讀載入方式。Server 先掃描本機的 Skill 目錄，呼叫 `attach` 將目錄發現能力接到已有 MCP server。Client 端要用已連線的 MCP client 讀清單並核對內容，這兩段都是文件示意，未在本文執行。

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { loadSkills } from '@modelcontextprotocol/server/ext/skills/node';

const catalog = await loadSkills('./skills', { prefix: 'team' });
const server = new McpServer({
  name: 'team-workflows',
  version: '1.0.0',
});

catalog.attach(server);
```

```ts
import { SkillsClient } from '@modelcontextprotocol/client/ext/skills';

const skills = new SkillsClient(client);

if (!skills.supported) {
  throw new Error('This server does not support Skills over MCP');
}

const { skills: entries } = await skills.list();
const first = entries.at(0);

if (!first) {
  throw new Error('No skills are available');
}

const { skill } = await skills.get(first.uri);
const manifest = await skills.read(skill);

if (!manifest.verified) {
  throw new Error('Skill verification failed');
}
```

想先分發內部 checklist，可以從唯讀文件做起，驗 client 是否支援 `io.modelcontextprotocol/skills`，再測同一個 URI 內容更新時會不會要求重核。若附帶腳本、巢狀 Skill 或動態資源，執行和進一步載入仍需各自的許可。[支援矩陣](https://modelcontextprotocol.io/extensions/client-matrix)｜[擴充權限規則](https://modelcontextprotocol.io/extensions/skills/overview)
