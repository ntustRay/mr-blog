---
title: "[News] Skills over MCP：遠端 Skill 怎麼發現、驗證與更新？"
description: "MCP TypeScript SDK 2.4.0 正式加入 SEP-2640。整理 Skills over MCP 的傳輸方式、內容完整性、client 相容性與導入限制。"
pubDate: 2026-10-26
category: AI
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

把一個 `SKILL.md` 複製到每個 Agent 很容易。當同一組團隊流程要提供給多個 client，問題會變成：Agent 去哪裡發現 Skill、讀到哪一版，以及 supporting files 是否在核准後被替換。

SEP-2640 已於 2026-09-13 成為 Final extension。這次的新進展有兩個：Anthropic 在 2026-10-22 將 Agent Skills 標準移交 Agentic AI Foundation（AAIF）；MCP TypeScript SDK 2.4.0 則於 2026-10-24（台灣時間）正式加入 Skills over MCP 的 server 與 client API。

## 這篇的重點

Agent Skills specification 定義 Skill 資料夾裡要放什麼；Skills over MCP 定義這些檔案如何被遠端發現、讀取與驗證。它解決的是配送與內容完整性，沒有替 Skill 判斷來源是否可信，也不會自動讓其中的 script 可以安全執行。

TypeScript SDK 已能拿來做 PoC，但 client 支援仍零散。現階段導入前，要先確認實際使用的 host 是否宣告支援 `io.modelcontextprotocol/skills`。

## Agent Skills 與 MCP 各管一段

[Agent Skills](https://agentskills.io/) 定義資料夾結構、`SKILL.md` frontmatter 與 supporting files。它適合放工作流程、檢查清單、scripts、templates 或參考資料。

[MCP Skills extension](https://modelcontextprotocol.io/extensions/skills/overview) 不重新定義這些格式，只負責 transport binding。Server 透過既有 Resources primitive 提供 Skill，並增加三個操作：

| 操作 | 用途 |
| --- | --- |
| `skills/list` | 列出可發現的 Skills 與 metadata |
| `skills/get` | 依 URI 取得單一 Skill 的 manifest |
| `resources/directory/read` | 選配，列出 Skill 目錄的直接子項目 |

真正的檔案仍透過 `resources/read` 按需讀取。Client 連線或列出清單時，不應先下載所有 Skill 內容。

這個拆法讓 MCP server 能把「怎麼使用我的 tools」和 tools 一起提供，也避免把很長的操作說明全部塞進 server instructions。

## TypeScript SDK 2.4.0 可以做什麼

[TypeScript SDK 2.4.0](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.4.0) 新增 `loadSkills`、`SkillsExtension` 與 `SkillsClient`。以下縮減自官方範例，本文沒有自行執行：

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

Client 端可以先檢查 server 是否支援 extension，再讀取並驗證指定 Skill：

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

根據 [PR #3047](https://github.com/modelcontextprotocol/typescript-sdk/pull/3047)，官方測試涵蓋 Node、Bun、Deno、stdio 與 HTTP，並通過 SEP-2640 conformance scenarios。這是維護者提供的測試紀錄，不是本文重跑的獨立結果。

## Digest 能證明什麼？

`skills/list` 或 `skills/get` 回傳的 manifest，會列出 `SKILL.md` 與 supporting files 的 URI、byte size 和 SHA-256 digest。Client 實際讀取時，可以確認收到的 bytes 是否符合 manifest。

這能抓到幾種問題：

- `SKILL.md` 核准後被替換。
- supporting file 內容改變，manifest 卻沒有更新。
- server 回傳的 frontmatter 與 Skill entry 不一致。
- 同名 Skill 來自不同 server，卻被錯當成同一份內容。

Skill 的完整身分是「server identity＋Skill URI」，不能只用 `name` 或 `skill://` URI 當 key。兩個 server 都能提供 `skill://code-review/SKILL.md`，它們仍是不同來源。

Digest 只證明內容與 manifest 一致。惡意 server 可以同時提供惡意檔案與相符的 digest；因此還需要可信任的 server identity、allowlist、簽核與稽核紀錄。

## 遠端 Skill 仍需要權限邊界

SEP-2640 對遠端內容設下幾個重要限制：

- MCP-served Skill 不應被偽裝成本機 filesystem Skill。
- Skill 不能在未取得逐一核准的情況下觸發 host-side code execution。
- 巢狀 Skill 要另外取得明確同意，外層 Skill 的核准不能直接沿用。
- `resources: "dynamic"` 的 Skill 無法綁定固定內容，host 不應把舊核准套用到目前回傳的任意內容。

換句話說，Skill 可以教 Agent 執行流程，但「讀到指令」和「授權執行指令」仍是兩件事。檔案驗證不能取代 tool permission、sandbox 或人工確認。

## 現在適合導入嗎？

目前較適合在 TypeScript MCP service 做小範圍 PoC，例如把 code review checklist、部署檢查或內部 API 操作流程和 server 一起提供。

正式採用前，至少確認：

1. 使用中的 host 是否支援 `io.modelcontextprotocol/skills`。
2. Registry、cache 與 approval 是否同時記錄 server identity、URI 和 digests。
3. Digest 改變時，是否會撤銷原核准並要求重新確認。
4. Script、`allowed-tools` 與巢狀 Skill 是否有獨立權限閘門。
5. 不支援 extension 的 client 要採用什麼 fallback。

[官方 client matrix](https://modelcontextprotocol.io/extensions/client-matrix) 目前仍以 partial support 為主，許多常見 host 尚未列出完整支援。若團隊只是單一 repository、單一 Agent，本機 Git 管理的 Skills 仍更直接；當多個 client 需要共用同一套服務流程時，Skills over MCP 才開始有明確價值。

Anthropic 將 Agent Skills 的名稱、GitHub organization 與網域移交 AAIF，代表規格治理正朝 vendor-neutral 前進；官方同時把 versioned releases、正式 proposal process 與安全指引列為後續工作。治理方向已確立，跨 client 的互通性仍要依實際實作逐一驗證。
