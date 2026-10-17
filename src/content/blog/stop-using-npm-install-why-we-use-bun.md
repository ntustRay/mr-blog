---
title: "[Review] npm、pnpm、Yarn 與 Bun：重新評估依賴安裝與 CI 成本"
description: "依官方文件比較 npm、pnpm、Yarn 與 Bun，聚焦安裝效能的測量條件、dependency layout 與 CI 遷移成本，提供可驗證的選型方式。"
pubDate: 2026-09-28
updatedDate: 2026-10-17
category: Engineering
tags:
  - JavaScript
  - Node.js
  - Bun
  - Package Manager
  - CI/CD
draft: false
references:
  - title: "Bun — bun install"
    url: "https://bun.com/docs/pm/cli/install"
  - title: "Bun — Lockfile"
    url: "https://bun.com/docs/pm/lockfile"
  - title: "Bun — Lifecycle scripts"
    url: "https://bun.com/docs/pm/lifecycle"
  - title: "pnpm — Motivation"
    url: "https://pnpm.io/motivation"
  - title: "pnpm — Benchmarks"
    url: "https://pnpm.io/benchmarks"
  - title: "Yarn — Plug’n’Play"
    url: "https://yarnpkg.com/features/pnp"
  - title: "npm — npm ci"
    url: "https://docs.npmjs.com/cli/v11/commands/npm-ci/"
---

更換 package manager 前，先確認要改善什麼：安裝等待、重複佔用的磁碟空間，還是 workspace 的依賴管理？如果這些都不是瓶頸，換工具可能只增加一份 lockfile 遷移工作。

本文是文件型評估，依 2026-10-17 可查閱的官方資料修訂，沒有四套工具在同一個專案的實測。Bun 值得加入候選，但「安裝較快」需要自己的測量，不能直接推成團隊交付速度提升。

## 這篇的重點

- 需要維持既有 Node.js 流程時，先用 npm 作為 baseline；重視共享 store 與依賴隔離時，可優先評估 pnpm。
- Bun 可先作為 package manager 導入，另行決定要不要換 runtime。依賴腳本與 CI 環境是必要驗收項目。
- Yarn 的 PnP 改變依賴解析方式；有明確需求再承擔整合成本。以下建議都以既有工具與依賴能正常工作為前提。

## 比較的是哪一段工作？

| 工具 | 文件可確認的設計 | 評估時要付出的成本 |
| --- | --- | --- |
| npm | 隨一般 Node.js 安裝提供，`npm ci` 用既有 lockfile 安裝 | 仍要測安裝等待與磁碟使用是否成為瓶頸 |
| pnpm | 透過共享 store 與連結組織套件 | 檢查依賴是否偷用未宣告套件，以及工具對 layout 的假設 |
| Yarn | PnP 使用 loader 解析依賴，也可選擇 node_modules linker | 檢查 IDE、build tools 與第三方套件的整合方式 |
| Bun | 提供獨立的 package manager，可用於 Node.js 專案 | 核對 Bun 版本、依賴 scripts、native packages 與 CI cache |

依據分別是 [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)、[pnpm motivation](https://pnpm.io/motivation)、[Yarn PnP](https://yarnpkg.com/features/pnp) 與 [bun install](https://bun.com/docs/pm/cli/install)。這些設計差異不能直接排列成穩定性排名；某個 repository 能不能用，仍取決於依賴和部署路徑。

例如 PnP 能讓依賴解析更明確，但需要配合它的工具鏈。若既有專案依賴傳統 node_modules layout，導入時就要把整合工作算進去，不能只比較安裝秒數。

## 效能數字要連著 Cache 條件讀

[Bun 官方文件](https://bun.com/docs/pm/cli/install)以安裝速度作為主要賣點；[pnpm 的 benchmark](https://pnpm.io/benchmarks)則區分 lockfile、cache 與 node_modules 是否存在。不同狀態的結果可能有很大差距，不能各挑最快的一列來排冠軍。

Stars 與 weekly downloads 無法回答某個專案換工具後能少等多久。缺少版本與測量條件的效能倍數，也不適合作為採用依據。

可以先設計三組測試，版本、作業系統、CPU architecture、registry 和專案 commit 保持一致：

| 情境 | 要控制的條件 | 代表的工作 |
| --- | --- | --- |
| Cold install | 沒有 node_modules，使用隔離的空 cache | 新 runner 或新工作區 |
| Warm cache install | 保留套件 cache，重建 node_modules | 使用 cache 的 CI |
| No-change install | 保留 cache、node_modules 與 lockfile | 開發中的重複安裝 |

各工具先產生並提交自己的 lockfile，再使用對應的固定 lockfile 模式。不同 manager 的解析結果未必完全相同，應檢查 dependency tree，並記錄差異。重複執行、記錄中位數與範圍，避免把網路抖動當成工具收益。

還要接著跑 build、測試和部署 smoke test。安裝成功但 native dependency 無法載入，這次遷移就還沒完成。

## Bun 可以分階段導入

使用 Bun 安裝依賴，不等於必須同時改用 Bun runtime。可以先維持原本的 Node.js build 與服務啟動方式，只驗證 package manager 這個變因。

依 [lockfile 文件](https://bun.com/docs/pm/lockfile)，將產生的 `bun.lock` 納入版本控制；CI 使用固定 lockfile 模式：

```bash
bun install --frozen-lockfile
```

這個指令要求 package.json 與 lockfile 一致，但不保證外部服務、平台 binary 或所有安裝 scripts 都能重現。Bun 版本、Node.js 版本與 runner image 仍要固定。

[Lifecycle scripts 文件](https://bun.com/docs/pm/lifecycle)說明，Bun 對 dependency scripts 有自己的信任規則，並有預設信任清單與 `trustedDependencies` 等機制。不能直接假設它和原本 npm 安裝的執行結果相同。

對需要 postinstall 的套件，應查明腳本做什麼、是否需要執行，再決定信任方式。驗收時使用乾淨環境，避免 local 已有的 binary 掩蓋 CI 問題。

Cache 也要重新量。可以先以 OS、architecture、Bun 版本和 lockfile hash 作為分隔條件，再看命中率與還原成本；不要直接複製原本 npm 的 cache 路徑。

## 什麼條件會改變選擇？

| 條件 | 建議起點 | 通過什麼才換 |
| --- | --- | --- |
| 既有 npm 專案穩定，安裝佔時低 | 保持 npm | 新方案收益足以支付遷移和維護成本 |
| 多專案或 monorepo，關注 store 與依賴隔離 | 評估 pnpm | workspace、工具解析與部署通過驗收 |
| 明確需要 PnP 或已有 Yarn 維護經驗 | 評估／保留 Yarn | IDE 和 build 流程可維持 |
| 安裝等待明顯，願意管理新的工具版本 | 評估 Bun | 同環境測量改善，scripts 與平台相容性通過 |

這份比較支持把 Bun 納入實驗，還不足以宣稱每個新專案都該換。下一個有價值的結果，是在真實 repository 留下一組安裝與完整 CI 的 baseline，確認省下的時間沒有被後續故障吃掉。
