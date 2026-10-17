---
title: "[Review] React 專案何時適合從 ESLint + Prettier 換成 Biome？"
description: "依官方文件評估 React／TypeScript 專案導入 Biome 的條件，保留規則對照、最小設定與遷移驗收，說明何時應保留 ESLint。"
pubDate: 2026-09-29
updatedDate: 2026-10-17
category: Engineering
tags:
  - React
  - TypeScript
  - Biome
  - ESLint
  - Prettier
draft: false
references:
  - title: "Biome — Configuration"
    url: "https://biomejs.dev/reference/configuration/"
  - title: "Biome — Migrate from ESLint and Prettier"
    url: "https://biomejs.dev/guides/migrate-eslint-prettier/"
  - title: "Biome — Domains"
    url: "https://biomejs.dev/linter/domains/"
  - title: "Biome — Rules sources"
    url: "https://biomejs.dev/linter/rules-sources/"
  - title: "Biome — Linter Plugins"
    url: "https://biomejs.dev/linter/plugins/"
  - title: "Oxlint — Linter"
    url: "https://oxc.rs/docs/guide/usage/linter"
  - title: "Oxfmt — Formatter"
    url: "https://oxc.rs/docs/guide/usage/formatter"
  - title: "dprint — Code Formatter"
    url: "https://dprint.dev/"
---

React／TypeScript 專案若同時維護 ESLint、Prettier、imports 規則與多份 editor 設定，可以評估將其中幾項收斂到 Biome。但少裝幾個 dependencies，不能抵銷漏掉 correctness rules 的代價。

這篇是依官方文件整理的選型評估，沒有團隊 migration 的測量紀錄，也不宣稱所有 React 規則都等價。判斷的核心是：既有專案真正依賴哪些檢查，Biome 能否接住？

## 這篇的重點

以 TS／TSX 為主、需要常用 React 檢查與統一 format／lint 入口時，Biome 值得試。若依賴特定 ESLint plugins、processors 或 type-aware rules，先保留原工具，逐條核對後再移除。CLI 收斂是可能的維護收益，實際省下多少時間仍要測量。

## 先盤點規則，再比較工具

[Biome 的 rules sources](https://biomejs.dev/linter/rules-sources/)列出與 ESLint ecosystem 的對應關係。下表可以作為盤點起點，不能視為逐行行為相同的保證：

| 要檢查的問題 | ESLint ecosystem 常見規則 | Biome 對應規則 |
| --- | --- | --- |
| Hook 呼叫位置 | react-hooks/rules-of-hooks | useHookAtTopLevel |
| Hook dependencies | react-hooks/exhaustive-deps | useExhaustiveDependencies |
| list 缺少 key | react/jsx-key | useJsxKeyInIterable |
| 使用 array index 作 key | react/no-array-index-key | noArrayIndexKey |
| 使用 dangerous HTML | react/no-danger | noDangerouslySetInnerHtml |

每條規則的預設開關、選項、誤報與 fix 都可能不同。[React domain 文件](https://biomejs.dev/linter/domains/#react)提供啟用方式；啟用 recommended 不等於表中每條規則都會開啟，更不代表這些規則能涵蓋所有 React correctness 問題。

例如檢查 dependencies 的規則不能證明 effect 的業務邏輯正確；禁止 dangerous HTML 也不能代替資料來源與消毒策略的設計。

盤點時可在同一份 TSX fixture 放入已知的條件式 Hook、缺 dependency 與缺 key，分別執行新舊工具，保留 diagnostics。這比只看工具有沒有列出 React 支援更容易發現落差。

## 一個可核對的設定起點

以下依 [configuration reference](https://biomejs.dev/reference/configuration/)與 React domain 文件整理，作為設定範例；並非這個 Blog repository 正在使用的設定。安裝時固定實際採用的版本，並以該版 schema 核對。

```json title="biome.json"
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "domains": {
      "react": "recommended"
    }
  },
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

可在 package.json 保留兩個清楚的入口：

```json title="package.json"
{
  "scripts": {
    "check": "biome check .",
    "check:fix": "biome check --write ."
  }
}
```

一條 check 能統一幾項工作，但仍需另外執行 TypeScript typecheck 與行為測試。若仍保留 ESLint，應清楚分配檢查責任，並避免兩個 formatter 同時在 save 時修改相同檔案。

## 速度、維護與規則覆蓋分開驗收

這次修訂不再以 vendor 宣稱的倍數推估專案收益。要評估效能，至少固定版本、檔案集合、啟用規則與機器，分別量全量檢查和日常小範圍修改。兩套工具若跑了不同的檢查，時間差也包含工作量差異。

維護成本則可以記錄設定檔、必要 packages、editor 設定與升級時需要同步處理的項目。工具少了，若多出許多 suppression 或漏檢，整體負擔未必降低。

| 方案 | 值得評估的情境 | 需要驗證的代價 |
| --- | --- | --- |
| ESLint + Prettier | 已依賴 plugins、自訂規則或 processors | 規則和 formatter 的設定協調 |
| Biome | 希望整合 format、常用 lint 與 imports | 既有規則、檔案格式與編輯器行為的覆蓋 |
| Oxlint + Oxfmt | 想評估另一套 lint／format 組合 | 實際啟用規則、plugin 相容性與整合方式 |
| dprint + linter | 主要想換 formatter，lint 另有安排 | formatter plugin 與既有 linter 的責任分工 |

[Oxc](https://oxc.rs/docs/guide/usage/linter)和 [dprint](https://dprint.dev/)是不同的工具設計，這裡沒有同條件測量，不能排出速度或成熟度冠軍。Biome 的 [plugin 文件](https://biomejs.dev/linter/plugins/)也需要和實際依賴的 ESLint 擴充逐項對照，不能用「支援 plugins」推成相容所有 plugins。

## 遷移時，先讓兩邊結果可比較

[官方 migration 文件](https://biomejs.dev/guides/migrate-eslint-prettier/)提供設定轉換工具。轉換成功只代表產生了設定，並不保證原規則完整保留。

可以用這份待執行的驗收流程：

1. 記錄原本的 lint／format 指令、版本、ignore 範圍與必要規則。
2. 產生 Biome 設定，先看 diagnostics，另開 commit 處理大量 formatting diff。
3. 用已知違規 fixtures 核對 React Hooks、imports、TypeScript 與自訂規則。
4. 暫時並行執行新舊檢查，檢視新增誤報、漏檢與耗時。
5. 只移除已被覆蓋的工具與規則，保留 typecheck、測試和可回退的設定。

如果無法接住關鍵規則，可以先只換 formatter，或延後遷移。比較有意義的採用條件是：檢查能力維持、日常流程清楚，而且維護或等待成本確實下降。
