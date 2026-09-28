---
title: "不要再只會 npm i：2026 我們為什麼改用 Bun"
description: "比較 npm、pnpm、Yarn 與 Bun 的效能、成熟度與 CI/CD trade-off，整理我們最後選 Bun，以及上 CI 後真正要處理的問題。"
pubDate: 2026-09-28
category: Engineering
tags:
  - JavaScript
  - Node.js
  - Bun
  - Package Manager
  - CI/CD
draft: false
references:
  - title: "Bun Docs — bun install"
    url: "https://bun.com/docs/pm/cli/install"
  - title: "Bun Docs — Lockfile"
    url: "https://bun.com/docs/pm/lockfile"
  - title: "Bun Docs — Lifecycle scripts"
    url: "https://bun.com/docs/pm/lifecycle"
  - title: "pnpm — Motivation"
    url: "https://pnpm.io/motivation"
  - title: "pnpm — Benchmarks"
    url: "https://pnpm.io/benchmarks"
  - title: "Yarn — Plug'n'Play"
    url: "https://yarnpkg.com/features/pnp"
  - title: "npm Docs — npm ci"
    url: "https://docs.npmjs.com/cli/v11/commands/npm-ci/"
  - title: "State of JavaScript 2025 — Other Tools"
    url: "https://2025.stateofjs.com/en-US/other-tools/"
  - title: "GitHub — npm/cli"
    url: "https://github.com/npm/cli"
  - title: "GitHub — yarnpkg/berry"
    url: "https://github.com/yarnpkg/berry"
  - title: "GitHub — pnpm/pnpm"
    url: "https://github.com/pnpm/pnpm"
  - title: "GitHub — oven-sh/bun"
    url: "https://github.com/oven-sh/bun"
---

我現在不太想再把 `npm i` 當預設答案。

不是 npm 不能用，而是 package manager 已經有更好的選項。我們團隊目前用 **Bun**。Local 開發很舒服，但搬到 CI/CD 後確實多了一些要處理的事情。

先講結論：

> **新專案我會優先看 Bun；如果團隊要最低風險、成熟 monorepo，我會選 pnpm。npm 留給相容性優先的情境。**

## 現在有哪些選擇？

| Tool | GitHub Stars* | 我會怎麼看 | 優點 | 主要代價 |
|---|---:|---|---|---|
| npm | 10.2k | baseline | Node.js 內建、相容性最好 | install、disk efficiency 不突出 |
| Yarn 4 | 8.1k | 功能強、但有自己的 ecosystem | PnP、Constraints | migration、IDE / tooling 設定較多 |
| pnpm | 36.7k | 最穩的升級選項 | 快、節省空間、strict dependencies | symlink / hoisting 偶爾碰到 legacy tooling |
| Bun | 96.1k | 最值得看的後起之秀 | install 快、CLI 整合度高 | CI image、lockfile、lifecycle scripts 要重新確認 |

\* GitHub Stars 截至 **2026-09-28**，只代表 repo 關注度，不等於 adoption。Bun repo 同時包含 runtime、package manager、bundler、test runner，因此不能直接拿 Stars 當市占率。

這不是只看聲量。

State of JavaScript 2025 的 monorepo tools 調查中，10,251 位受訪者裡：

- pnpm：3,940
- npm Workspaces：2,129
- Yarn Workspaces：1,341
- `bun install`：1,123

pnpm 已經很成熟；Bun 還不是主流第一，但成長速度很難忽略。

## 為什麼不是 npm？

npm 最大優勢一直都是「不用選」。

Node.js 裝完就有，第三方工具通常也優先確保 npm 能跑。CI 使用 `npm ci` 也已經能做到 lockfile 固定與 reproducible install。

所以舊專案如果跑得穩，我不會為了追工具硬換。

但新專案重新選一次，我會更在意：

- install time
- CI time
- dependency isolation
- monorepo
- disk usage
- security defaults

在這些項目上，npm 已經很少是我最想選的那一個。

## pnpm：目前最穩的替代方案

pnpm 的核心優勢很實際：**content-addressable store**。

相同 dependency 不需要每個 project 都完整複製一份；同時它的 dependency layout 也比傳統 flat `node_modules` 更容易抓出 phantom dependency。

pnpm 官方 benchmark 也長期把 npm、Yarn、pnpm、Bun 放在相同 fixture 測試。數字會隨版本與環境改變，所以我不拿某一次秒數當定論，但方向很穩定：**pnpm 通常明顯快過 npm，Bun 則常在 install performance 更激進。**

如果我要幫一個多人、長期維護、monorepo 比重高的團隊選 package manager，pnpm 仍然是很安全的答案。

## Yarn 4：能力很強，但我不會優先導入

Yarn 4 的 PnP 可以直接繞過傳統 `node_modules`，Constraints 也很適合管理大型 workspace。

代價就是 ecosystem assumptions 會改變。

一些 IDE、tooling 或舊 package 對傳統 `node_modules` 有隱性依賴。Yarn 官方也有專門文件處理 PnP compatibility。

如果團隊已經在用 Yarn 4，我不會叫它換掉；但 greenfield project，我不會為了 PnP 主動增加這層 migration cost。

## 我們最後用 Bun

Bun 最直接的吸引力就是快。

Bun 官方目前宣稱 `bun install` 在特定情境可比 `npm install` **快到 25x**。這是 vendor benchmark，不該直接當成所有專案都會得到 25x，但 local install 的速度差異確實是它最明顯的賣點。

而且 Bun 不要求你立刻把 Node.js runtime 全換掉。

現有 Node.js project 只要有 `package.json`，就可以先從：

```bash
bun install
```

開始。

這也是我們會選它的原因：**package manager 可以先換，runtime 不必一起賭。**

## 真正的代價在 CI/CD

Local 從 npm 換 Bun 很簡單，CI/CD 才是比較容易卡的地方。

### 1. CI runner 本來沒有 Bun

npm 跟 Node.js 綁在一起；Bun 通常要多一個 setup step。

GitHub Actions 官方做法是：

```yaml
- uses: oven-sh/setup-bun@v2

- run: bun ci
```

如果公司用自己的 Docker image、GitLab Runner 或 Azure pipeline，也要把 Bun version 明確放進 image 或 pipeline。

我會直接 **pin Bun version**，避免 developer machine 和 CI 各跑不同版本。

### 2. CI 不要直接照搬 `bun install`

正式 CI 應該用：

```bash
bun ci
```

它等同：

```bash
bun install --frozen-lockfile
```

`package.json` 和 `bun.lock` 不一致就 fail。

這是好事，但 migration 初期很容易因此第一次就在 pipeline 爆掉：有人更新 dependency，卻沒有一起 commit lockfile。

### 3. lifecycle scripts 行為跟 npm 不完全一樣

這是我覺得最容易被低估的差異。

Bun 基於 security 考量，不會任意執行 dependency 的 lifecycle scripts；需要時透過 `trustedDependencies` 明確允許。

某些 native package、binary installer 或 build dependency 會依賴 `postinstall`。Local 看起來正常，換 CI image、換 platform 後才可能露出問題。

遇到這種狀況，不要先退回：

```bash
npm install
```

先確認 dependency 是否真的需要 lifecycle script，以及是否應該加入 trust list。

### 4. cache 要重新設計

Bun 的 global install cache 預設在：

```text
~/.bun/install/cache
```

原本 CI cache 如果只針對 npm cache，換 Bun 後等於沒吃到。

另外 native / platform-specific dependencies 讓 cache 不能無腦跨 OS 共用。實務上我會至少把這些放進 cache key：

```text
OS + architecture + Bun version + bun.lock hash
```

速度快是一回事，**CI deterministic** 才是正式環境真正重要的事。

## Bun 的 benefit 與風險

目前我會繼續用 Bun。

理由很單純：

- install 快
- CLI 簡單
- Node.js project 可以漸進導入
- workspace、isolated install、lockfile 都已經有
- package manager、runtime、test runner 未來有機會收斂成同一套 tooling

但它的風險也比 pnpm 大：

- release cadence 快，CI 要 pin version
- 行為不一定完全等同 npm
- lifecycle scripts / native dependencies 要額外確認
- 團隊最後很容易從「只換 package manager」一路用到 Bun runtime、test、build，migration scope 會擴大

所以我現在不會說「所有人都該換 Bun」。

我的選法比較明確：

```text
Legacy / 相容性最高    → npm
大型 monorepo / 穩定優先 → pnpm
已經深度使用 PnP       → Yarn
新專案 / 願意承擔新工具成本 → Bun
```

我們現在選 Bun。

它確實讓 CI/CD 多了一點治理成本，但目前換到的 developer experience 和 install speed，對我們來說值得。

真正要避免的不是 npm。

而是 **2026 了還因為 Node.js 順便附 npm，就從來沒重新比較過。**
