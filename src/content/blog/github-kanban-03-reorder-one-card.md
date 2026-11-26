---
title: "[Guide] GitHub Kanban 怎麼只更新被拖動的那張卡"
description: "在 Demo 拖曳同欄卡片，匯出 JSON 比較排序欄位，再用原始碼與測試理解中點位置的算法。"
pubDate: 2026-11-26
category: Dev Tools & Quality
tags: ["GitHub", "Kanban", "TypeScript"]
series: kanban
seriesOrder: 3
references:
  - title: GitHub Kanban 免登入 Demo
    url: https://github-kanban-ntustray.vercel.app/demo
  - title: 卡片位置的 TypeScript 實作
    url: https://github.com/ntustRay/github-kanban/blob/c69e5fa98efebae090f52199a2c8bb7166706ca7/src/lib/card-order.ts
  - title: 卡片位置的測試案例
    url: https://github.com/ntustRay/github-kanban/blob/c69e5fa98efebae090f52199a2c8bb7166706ca7/tests/card-order.test.ts
---

把最上面一張卡拖到最下面，通常是同欄排序。這篇用 GitHub Kanban 的 Demo 觀察移動前後的 `position`，再跑一個測試，確認看不到的卡片也可以保留原位。

## 1. 匯出移動前後的資料

1. 開啟[免登入 Demo](https://github-kanban-ntustray.vercel.app/demo)並重新整理。清空搜尋和語言篩選。在 In progress 找到上方的 `my-project` 和下方的 `chart-library`。
2. 點右上角「匯出 JSON」，把下載的檔案改名為 `before.json`。
3. 按住 `my-project` 上方的拖曳把手，拖到 `chart-library` 的下緣再放開。欄位應維持 **In progress**，卡片順序應變成上方 `chart-library`、下方 `my-project`。
4. 再點「匯出 JSON」，把新檔案改名為 `after.json`。

| 移動前 | 移動後 |
| --- | --- |
| ![In progress 欄中 my-project 排在第一張。](../../assets/project-series/kanban/03-order-before.webp) | ![In progress 欄中 chart-library 排在第一張。](../../assets/project-series/kanban/03-order-after.webp) |

## 2. 比對 position，不看 JSON 陣列的順序

用編輯器開兩個檔案，在 `cards` 裡搜尋 `demo/my-project` 和 `demo/chart-library`。也可以在下載資料夾執行：

```sh
node --input-type=module - before.json after.json <<'JS'
import { readFileSync } from "node:fs";

for (const file of process.argv.slice(2)) {
  const { cards } = JSON.parse(readFileSync(file, "utf8"));
  console.log(file);
  console.table(
    cards
      .filter((card) => card.status === "in_progress")
      .map(({ name, position, version }) => ({ name, position, version })),
  );
}
JS
```

預期 `my-project` 的 `position` 從 `3` 變成 `1028`，`version` 加 1。`chart-library` 仍是 `position: 4`、`version: 0`。JSON 陣列的位置不必跟畫面一致，欄位會依 `position` 排，再用 `fullName` 處理同分。

## 3. 用測試讀懂位置的算法

開啟 [`src/lib/card-order.ts`](https://github.com/ntustRay/github-kanban/blob/c69e5fa98efebae090f52199a2c8bb7166706ca7/src/lib/card-order.ts)。丟到欄尾時，程式取上一張的 `position + 1024`，所以這次是 `4 + 1024`。若插在兩張卡中間，就取兩個位置的中點。

要跑專案已有的測試，準備 Git、Node.js 22+ 和 Bun 1.4.4。這組測試用示範資料，無需設定 GitHub 帳號或 Postgres。

```sh
git clone https://github.com/ntustRay/github-kanban.git
cd github-kanban
git checkout --detach c69e5fa98efebae090f52199a2c8bb7166706ca7
bun install --frozen-lockfile
bun test tests/card-order.test.ts
```

找到 `reorders within a column without changing neighbours`。案例把一張卡插到位置 `10` 和 `20` 的兩張卡之間，預期新位置是 `15`。即使 `10` 那張當下被搜尋條件濾掉，計算仍使用完整欄位資料，所以清掉搜尋後它還在原本的位置。正式站接受欄內的單卡編輯，實際儲存失敗時 UI 會恢復該卡原本的位置。
