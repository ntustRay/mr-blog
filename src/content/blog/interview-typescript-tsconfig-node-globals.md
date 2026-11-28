---
title: "[Guide] TypeScript 面試題：升到 6.0，為什麼找不到 process？"
description: "用前端與 Node.js 共用的 repo 重現 TypeScript 6.0 的 types 預設變更，練習拆分 tsconfig、查有效設定與驗證型別邊界。"
pubDate: 2026-11-28
category: Frontend
tags: [interview, TypeScript, Node.js]
draft: false
references:
  - title: "Microsoft — Announcing TypeScript 6.0"
    url: "https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/#types-now-defaults-to"
  - title: "TypeScript — TSConfig Reference: types"
    url: "https://www.typescriptlang.org/tsconfig/types.html"
  - title: "TypeScript — TSConfig Reference: lib"
    url: "https://www.typescriptlang.org/tsconfig/lib.html"
---

## 題目

同一個 repo 有瀏覽器 UI 和 Node.js 腳本。升到 TypeScript 6.0 以後，腳本在 `process.env` 報找不到 `process`，但 `@types/node` 還在。把 `"types": ["node"]` 塞進共用的 tsconfig，腳本過了，前端也開始接受直接存取 `process.env`。要怎麼修，才能讓兩邊各自在正確的 runtime 假設下通過型別檢查？

### 必要假設

- `web/` 的程式只在瀏覽器跑，沒有提供 Node.js `process` shim。
- `scripts/` 的程式在 Node.js 24 執行，兩邊目前用同一份 tsconfig 做 `tsc --noEmit`。
- `@types/node` 已安裝，升級前沒有設定 `compilerOptions.types`。範例中的前端只有 DOM API，沒有依賴其他 ambient declarations。

### 評分項目（100 分，練習參考）

| 項目 | 分數 | 要講清楚的事 |
| --- | ---: | --- |
| 找出版本差異 | 25 | 從 5.9 升到 6.0，哪些宣告不再自動載入 |
| 切開型別檢查 | 30 | Node 設定只套到腳本，前端保有 DOM 型別和自己的 globals |
| 說明型別與執行環境的差異 | 20 | tsconfig 能改變型別檢查結果，瀏覽器執行時仍看實際有哪些 API |
| 驗證方式 | 25 | 兩份設定各自跑，並測前端意外用到 `process` 時會失敗 |

## 四級示範回答

| 等級 | 示範回答 | 差異 |
| --- | --- | --- |
| 很好 | 「把 web 和 scripts 分成兩個 TypeScript project。腳本的 tsconfig 加 `types: ["node"]`，前端保留 DOM lib 和 `types: []`。CI 各跑一次 `tsc -p`，再在範例的 web 檔案暫時加上 `process.env.PATH`，確認會報錯。若正式 repo 還有共用套件，要檢查它們帶進來的宣告。」 | 修好腳本，還能驗證前端的邊界，並交代範例以外可能影響結果的依賴。 |
| 好 | 「6.0 不再預設載入 `@types/node`。只在 Node 腳本的 tsconfig 加 `types: ["node"]`，前端用自己的設定。」 | 診斷和修法正確，還缺 CI 怎麼跑與如何確認前端會抓到錯。 |
| 普通 | 「在根 tsconfig 加 `types: ["node"]`，讓 `process` 回來。」 | 腳本會過，共用設定也會讓前端接受 Node globals。 |
| 差 | 「在前端加 `declare const process`，就能讀 `process.env`。」 | 宣告只讓 TypeScript 接受這個名字。按題目的條件，瀏覽器執行到這行仍會報錯。 |

## 已經安裝了 `@types/node`，為什麼還找不到？

在這個 repo 裡，`types` 決定要自動放哪些套件的 ambient declarations 進 TypeScript project。有了這些宣告，腳本可以直接寫 `process`，無需在每個檔案 import。TypeScript 5.9 未設定 `types` 時，會找所有看得到的 `@types` 套件。從 6.0 開始，預設值改為 `[]`，所以升級後就算保留同一份 `node_modules`，也可能少了全域的 `process`。Microsoft 在 2026 年 3 月 23 日的 6.0 發布說明記載了這項變更。[TypeScript 6.0 發布說明](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/#types-now-defaults-to) · [TSConfig `types`](https://www.typescriptlang.org/tsconfig/types.html)

`lib` 管的是 TypeScript 隨附的標準 API 宣告。前端設定選 `DOM` 才有 `document` 等瀏覽器 API 的型別，`ES2022` 則提供對應的 ECMAScript API 型別。這些設定只改編譯器看得到的宣告，瀏覽器提供哪些 API 還是由執行環境決定。[TSConfig `lib`](https://www.typescriptlang.org/tsconfig/lib.html)

## 實作：web 和 scripts 各跑一次 `tsc`

在一個空目錄用 Node.js 24 安裝 TypeScript 6.0.2 與 `@types/node` 24.19.4，再建立下面兩個目錄和檔案。

```bash
npm init -y
npm install -D --save-exact typescript@6.0.2 @types/node@24.19.4
mkdir -p web scripts
```

```ts title="web/index.ts"
document.title = "Dashboard";
```

```ts title="scripts/check-env.ts"
console.log(process.env.CI ?? "local");
```

先用這份共用設定重現升級後的錯誤。執行 `npx tsc -p tsconfig.json`，腳本裡的 `process` 會報錯。

```json title="tsconfig.json"
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "NodeNext",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["web/**/*.ts", "scripts/**/*.ts"]
}
```

修正時把上述共用設定換成以下兩份，並讓 CI 明確指定各自的 project。前端範例包含 DOM API，腳本只需要 ECMAScript 和 Node.js API。

```json title="tsconfig.web.json"
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "types": []
  },
  "include": ["web/**/*.ts"]
}
```

```json title="tsconfig.scripts.json"
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["scripts/**/*.ts"]
}
```

```bash
npx tsc -p tsconfig.web.json && npx tsc -p tsconfig.scripts.json
```

**實測（最小範例）** 使用 Node.js 24.22.3 和 `@types/node` 24.19.4。共用設定在 TypeScript 5.9.3 通過，在 6.0.2 和 7.0.2 都出現 `TS2591`。拆開設定後，6.0.2 和 7.0.2 都能通過兩次檢查。用 6.0.2 額外確認了兩種情況。在 `web/index.ts` 暫時加上 `console.log(process.env.PATH)`，獨立的 web 設定會報錯。換成共用設定並加上 `"types": ["node"]`，同一行就會通過。

## 正式 repo 還要查哪些地方？

如果本機會過但 CI 還在報錯，先對照 CI 的 TypeScript 版本與 `-p` 指到的檔案，再跑 `npx tsc -p tsconfig.scripts.json --showConfig` 檢查繼承後的設定。若前端加了 `types: []` 還是能用 `process`，用 `npx tsc -p tsconfig.web.json --explainFiles` 查是哪個檔案把 Node 宣告帶進來。前端 import 的依賴仍可能透過型別參照引入 Node 宣告，`types: []` 只關掉自動載入。[TSConfig `types`](https://www.typescriptlang.org/tsconfig/types.html)

**取捨** 純 Node 專案可以直接設 `types: ["node"]`，一份設定就能說明它需要哪些 globals。前端和腳本混在一起時，拆開設定需要跑兩次檢查，但 CI 能各自驗證應有的 API。若正式 repo 也需要禁止 browser code import Node 專用模組，可再加 import 邊界規則，並用實際的 browser bundle 驗證。TypeScript 的檔案清單與全域宣告設定無法單獨保證這個邊界。
