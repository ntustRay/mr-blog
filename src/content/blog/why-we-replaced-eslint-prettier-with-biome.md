---
title: "React 團隊為什麼把 ESLint + Prettier 換成 Biome"
description: "從 React Hooks 規則、formatter/linter 整合、設定與 CI 成本出發，比較 Biome、ESLint + Prettier、Oxlint + Oxfmt 與 dprint，整理我們為什麼改用 Biome。"
pubDate: 2026-09-29
category: Engineering
tags:
  - React
  - TypeScript
  - Biome
  - ESLint
  - Prettier
draft: false
references:
  - title: "Biome — One toolchain for your web project"
    url: "https://biomejs.dev/"
  - title: "Biome — Migrate from ESLint and Prettier"
    url: "https://biomejs.dev/guides/migrate-eslint-prettier/"
  - title: "Biome — Linter Domains / React"
    url: "https://biomejs.dev/linter/domains/"
  - title: "Biome — Rules sources"
    url: "https://biomejs.dev/linter/rules-sources/"
  - title: "Biome — Linter Plugins"
    url: "https://biomejs.dev/linter/plugins/"
  - title: "Biome — organizeImports"
    url: "https://biomejs.dev/assist/actions/organize-imports/javascript/"
  - title: "ESLint — Configuration Files"
    url: "https://eslint.org/docs/latest/use/configure/configuration-files"
  - title: "Prettier — Install"
    url: "https://prettier.io/docs/install.html"
  - title: "Oxlint — Linter"
    url: "https://oxc.rs/docs/guide/usage/linter"
  - title: "Oxlint — Built-in Plugins"
    url: "https://oxc.rs/docs/guide/usage/linter/plugins"
  - title: "Oxfmt — Formatter"
    url: "https://oxc.rs/docs/guide/usage/formatter"
  - title: "dprint — Code Formatter"
    url: "https://dprint.dev/"
---

我們的 React / TypeScript 專案以前很典型：

- ESLint 負責 lint
- Prettier 負責 format
- React Hooks、import order、TypeScript 再各自補 plugin
- Editor、pre-commit、CI 再各接一次

這套組合成熟，也沒有突然不能用。

問題是：**當大部分需求已經可以被同一個工具處理，我們還有沒有必要繼續維護兩套核心工具、兩份設定，以及它們之間的相容性？**

我們現在的答案是 **Biome**。

原因不只 performance。對團隊更有感的是設定變少、CLI 收斂，而且 React 常用的 lint rules 已經足夠完整。

## 我們真正想砍掉的是 tooling friction

ESLint + Prettier 最麻煩的地方通常不是其中任何一個工具，而是組合起來之後的維護成本。

一個 React 專案很容易慢慢長成：

```text
eslint
@eslint/js
typescript-eslint
eslint-plugin-react-hooks
eslint-plugin-react-refresh
eslint-plugin-import
prettier
eslint-config-prettier
```

實際 package 會依專案不同，但模式差不多。

ESLint 官方本來就把 plugin / parser / shareable config 當成擴充機制；Prettier 官方安裝文件也直接建議 ESLint 專案使用 `eslint-config-prettier`，避免兩邊的 formatting rules 打架。

這個 ecosystem 很強，代價就是我們要自己把它們拼起來。

最後通常還有：

```text
eslint.config.js
.prettierrc
.prettierignore
.vscode/settings.json
package.json scripts
CI config
```

每個檔案都不難。

真正煩的是升級某一個 package 後，要確認 parser、plugin、config、editor integration 有沒有一起正常。

Biome 的吸引力就是把這段縮短。

## 對 React 專案，Biome 已經不是「只有 formatter」

如果 Biome 只能取代 Prettier，我不會特別想換。

我們是 React 專案，lint 才是關鍵。

Biome 現在有 React domain。專案偵測到 `react` dependency 時，可以自動啟用 recommended React rules，也能明確設定：

```json title="biome.json"
{
  "linter": {
    "domains": {
      "react": "recommended"
    }
  }
}
```

幾個我們真的在意的 React 規則都有對應：

| React 問題 | ESLint ecosystem | Biome |
| --- | --- | --- |
| Hooks 只能在 top level 呼叫 | `react-hooks/rules-of-hooks` | `useHookAtTopLevel` |
| Hook dependencies 是否完整 | `react-hooks/exhaustive-deps` | `useExhaustiveDependencies` |
| list render 缺少 key | React / JSX rules | `useJsxKeyInIterable` |
| array index 當 key | React rules | `noArrayIndexKey` |
| dangerous HTML | React rules | `noDangerouslySetInnerHtml` |

Biome 的 rules source 文件也直接列出與 `eslint-plugin-react`、`eslint-plugin-react-hooks` 的對應關係。

這對我們很重要。

我們不是為了少裝幾個 package，就放棄 React 最基本的 correctness 檢查。

## 一份 config 解決 format、lint、imports

我們現在更喜歡這種設定方式：

```json title="biome.json"
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended"
    },
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

然後 package scripts 保持很單純：

```json title="package.json"
{
  "scripts": {
    "check": "biome check .",
    "check:fix": "biome check --write ."
  }
}
```

開發者不用記：

```bash
eslint .
prettier . --check
eslint . --fix
prettier . --write
```

主要入口就一個：

```bash
biome check .
```

要修：

```bash
biome check --write .
```

這種差異單看 command 很小，放到團隊裡就有價值。

新人少一套心智模型，CI 少幾個步驟，editor integration 也少一個「到底現在是 ESLint 在改，還是 Prettier 在改」的問題。

## Performance 很快，但我不拿 vendor benchmark 當實測

Biome 官方目前的首頁 benchmark 宣稱：在 2,104 個檔案、171,127 行 code 的測試中，formatter 約比 Prettier 快 **35x**。

這是 Biome 自己的 benchmark，不是我們專案的實測，所以我不會寫成「我們一定快 35 倍」。

但工具的架構差異確實存在。Biome 是用 Rust 寫的整合式 toolchain，format、lint、assist 共用同一套基礎，不需要每次把多個 JavaScript 工具各啟動一次。

對團隊來說，performance 的價值也不只是一條 CI 快幾秒。

Lint / format 會出現在：

- save
- staged files
- pre-commit
- local full check
- CI
- code review 前的修正

一次只差幾秒，看起來沒什麼。

每天乘上整個團隊的執行次數後，等待和 context switch 就會一直累積。

所以我會把 Biome 的速度當成「高頻工具應該要夠快」，而不是拿 benchmark 倍數做賣點。

## 設定成本才是我們最想省的時間

我更在意的是 maintenance。

ESLint 最大優勢是彈性。你可以裝 parser、plugin、processor、shareable config，再針對不同 files 組出很細的規則。

但大部分 React application 不一定真的需要這麼大的擴充面。

如果需求大致是：

- TypeScript / TSX
- React Hooks correctness
- 常見 suspicious / complexity rules
- formatting
- import sorting
- CI check
- editor fix on save

Biome 一套已經能涵蓋很多。

這時繼續維護 ESLint + Prettier，等於在替「未來可能會需要的彈性」持續付成本。

我們目前不需要。

## 那 ESLint + Prettier 還有什麼優勢？

有，而且很明確：**plugin ecosystem。**

ESLint 發展很多年，第三方規則、framework integration、processor、自訂 rule 的資源仍然非常多。

Biome 已經支援 GritQL plugin，可以寫 custom diagnostics 和 fixes，但官方文件也明確表示 plugin integration 還在持續發展，部分能力仍未完整。

所以如果專案高度依賴：

- 特定 ESLint plugin
- 公司內部 custom ESLint rules
- 特殊 processor
- Biome 尚未支援的 framework / file type 行為
- 非常精細的 type-aware rule parity

我不會硬拔 ESLint。

這種專案保留 ESLint，甚至先讓 Biome 只取代 Prettier，都比較合理。

## 現在真正有威脅的競品：Oxlint + Oxfmt

如果今天重新選一次，我一定會看 Oxc。

`Oxlint` 是 Rust 寫的 linter，`Oxfmt` 是 formatter。

Oxlint 官方目前宣稱 benchmark 約比 ESLint 快 **50–100x**；Oxfmt 官方宣稱約比 Prettier 快 **30x**、比 Biome 快 **2x**。

同樣要強調，這些都是 Oxc 自己的 benchmark，不能直接跟 Biome 的 benchmark 混在一起算冠軍。

真正讓我在意的是功能。

Oxlint 已經內建不少常用 ESLint plugin 的 native implementation，包括：

- React
- React Hooks
- React Refresh
- React Compiler rules
- jsx-a11y
- import
- Next.js
- Jest / Vitest
- Unicorn

它甚至也開始支援 ESLint-compatible JavaScript plugins。

這讓 Oxlint + Oxfmt 變成非常有競爭力的組合，尤其是大型 JS / TS repo，追求極致 lint / format throughput 時。

但目前我還是偏 Biome，理由是很實際：

> **我們想減少工具，不是把 ESLint + Prettier 換成另一組 linter + formatter。**

Biome 的一個 binary、一份 config、一套 diagnostics / editor workflow，對我們現在的需求更直接。

Oxlint 的 JavaScript plugin compatibility 目前官方仍標示為 alpha，這也讓我不急著因為 benchmark 再換一次工具。

## dprint 很快，但它不是 ESLint 的替代品

dprint 也常被拿來跟 Prettier / Biome 比。

它的設計是 plugin-based formatter，CLI 是單一 native binary，也能處理 TypeScript、JavaScript、JSON、Markdown、CSS 等多種格式。

如果問題只有：

> 「我想找一個比 Prettier 更快、更容易控制的 formatter。」

dprint 很合理。

但我們的問題包含 React lint。

dprint 本身定位還是 formatter。你依然要搭配 ESLint、Oxlint 或其他 linter。

所以它不符合我們「減少整套 tooling 數量」的主要目標。

## 我現在會怎麼選

| 方案 | 適合什麼情況 | 我看到的主要 trade-off |
| --- | --- | --- |
| ESLint + Prettier | 依賴大量 plugins / custom rules 的成熟專案 | ecosystem 最大，但設定與整合成本最高 |
| Biome | React / TS app，希望 lint + format + imports 收斂 | plugin ecosystem 還沒有 ESLint 那麼廣 |
| Oxlint + Oxfmt | 大型 JS / TS repo，極度重視 throughput | 仍是 linter + formatter 兩個核心工具；部分 plugin compatibility 還在演進 |
| dprint + linter | formatter 要跨很多語言，lint 另外選 | formatter 很靈活，但無法單獨取代 ESLint |

我們現在選 **Biome**。

關鍵不是「Rust 比 JavaScript 潮」，也不是看到 benchmark 就換。

是我們的 React 專案已經落在 Biome 很適合的區間：

- React Hooks 有對應 correctness rules
- TypeScript / TSX 是主力語言
- 不依賴大量 niche ESLint plugins
- 想降低 config 和 dependency 數量
- 希望 local 與 CI 都用同一條 command
- formatting、lint、import organize 可以收斂

這些條件成立後，ESLint + Prettier 的彈性對我們反而變成額外維護面。

## Migration 沒必要一次硬切

Biome 官方有直接提供 migration command：

```bash
biome migrate eslint --write
biome migrate prettier --write
```

它可以轉換一部分 ESLint / Prettier 設定，但不要看到 migration 成功就直接刪掉舊工具。

我會用這個順序：

1. 先產生 `biome.json`。
2. 跑 `biome check .`，把 diagnostics 跟原本 ESLint 結果比一次。
3. 確認 React Hooks、TypeScript、import、ignore patterns 都符合預期。
4. 讓 CI 暫時同時跑舊工具與 Biome。
5. 確認沒有依賴到 Biome 尚未覆蓋的 plugin rule，再移除 ESLint / Prettier。

工具 migration 最怕的不是多跑幾天。

是為了少幾個 dependencies，把原本真正有價值的 rule 一起刪掉。

## 結論很簡單

ESLint + Prettier 仍然是可靠組合，我也不會為了「新」就要求既有專案全部搬家。

但對我們這種 React / TypeScript application，現在重新看一次 tooling，我沒有太多理由繼續預設兩套工具。

**Biome 已經能處理我們最常用的 lint + format + import workflow，React 核心規則也夠用。**

速度是加分。

真正讓我們換掉 ESLint + Prettier 的，是每天少維護一點設定、少處理一點整合、少讓團隊記一套工具。
