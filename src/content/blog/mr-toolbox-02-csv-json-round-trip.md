---
title: "[Guide] 用 React 和 TypeScript 寫 CSV 轉換器，保住引號、空欄和前導零"
description: "從空的 Vite 工具架加入 CSV 解析與輸出，讓同一份資料來回轉換後仍保有原值。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: "Data & Visualization"
tags: ["React","TypeScript","CSV"]
series: toolbox
seriesOrder: 2
references:
  - title: "MR 工具百科"
    url: "https://mr-toolbox-two.vercel.app/"
  - title: "完整產品的 CSV 工具"
    url: "https://mr-toolbox-two.vercel.app/tools/csv-json/"
---

先看驗收用的輸入。第一筆的備註裡面有逗號；第二筆同樣有三欄，最後一欄是空字串。我們要把它轉成 JSON，再把欄位寫回 CSV。

```csv
id,name,note
00123,小林,"到貨,待驗收"
00007,小陳,
```

## 1. 啟動 React 工具架

下載[起始檔](../../downloads/toolbox-workshop-starter.zip)並解壓縮，在有 `package.json` 的資料夾開啟終端機。使用 Node.js 24 執行 `npm install`、`npm run dev`，開啟終端機顯示的網址。頁面會提示「請選擇上方工具」，此時清單是空的。

入口 `index.html` 交給 `src/main.tsx` 掛載 React。`src/tools.ts` 用 Vite 的 `import.meta.glob` 收集 `src/tools/*.tsx`，新增 `csv.tsx` 就會得到 `?tool=csv` 的入口。先在 `src` 底下建立 `tools` 資料夾。

## 2. 寫解析與輸出函式

在 `src/csv.ts` 貼入下面兩個函式。遇到逗號以前，parser 要知道目前是否還在引號內。欄位結束時才把字串存入一列，不做數值轉型。保留獨立的 `headers`，即使只有標題、沒有資料，也能還原原本的欄位順序。

```ts
export function csvToRecords(input: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closed = false;
  const source = input.replace(/^\uFEFF/, '');
  if (!source) throw new Error('缺少欄名');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (source[i + 1] === '"') { field += '"'; i++; }
      else { quoted = false; closed = true; }
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false;
      if (c !== ',') {
        if (c === '\r' && source[i + 1] === '\n') i++;
        rows.push(row); row = [];
      }
    } else if (c === '"' && !field && !closed) {
      quoted = true;
    } else {
      if (closed || c === '"') throw new Error('引號位置錯誤');
      field += c;
    }
  }
  if (quoted) throw new Error('引號未關閉');
  if (row.length || field || closed || !/[\r\n]$/.test(source)) {
    rows.push([...row, field]);
  }
  const [headers, ...data] = rows;
  if (headers.some(h => !h) || new Set(headers).size !== headers.length)
    throw new Error('欄名不可空白或重複');
  const records = data.map(row => {
    if (row.length !== headers.length) throw new Error('欄位數不符');
    return Object.fromEntries(headers.map((h, i) => [h, row[i]]));
  });
  return { headers, records };
}

export function toCsv(headers: string[], records: Record<string, string>[]) {
  const escape = (s: string) => /[",\r\n]/.test(s)
    ? '"' + s.replaceAll('"', '""') + '"' : s;
  return [headers, ...records.map(row => headers.map(h => row[h]))]
    .map(row => row.map(escape).join(',')).join('\r\n');
}
```

把下面兩行存成專案根目錄的 `check.mjs`。在另一個終端機執行 `node check.mjs`。輸出的 `id` 應為字串 '00123'，`note` 是單一欄位 'x,y'。

```js
import { csvToRecords } from './src/csv.ts';
console.log(csvToRecords('id,note\n00123,"x,y"').records);
```

## 3. 把轉換函式接進畫面

新增 `src/tools/csv.tsx`。按一次按鈕才解析，失敗時讓畫面顯示函式指出的欄位問題。這個小練習只還原它自己剛產生的紀錄，JSON 物件的值都是字串。

```tsx
import React, { useState } from 'react';
import { csvToRecords, toCsv } from '../csv';
const sample = 'id,name,note\n00123,小林,"到貨,待驗收"\n00007,小陳,';
export default function Csv() {
  const [text, setText] = useState(sample);
  const [result, setResult] = useState('');
  function run() {
    try {
      const { headers, records } = csvToRecords(text);
      setResult(JSON.stringify(records, null, 2) + '\n\n' + toCsv(headers, records));
    } catch (e) { setResult(e instanceof Error ? e.message : '格式錯誤'); }
  }
  return <><h1>CSV 來回轉換</h1>
    <label>輸入 CSV<textarea value={text} onChange={e => setText(e.target.value)} /></label>
    <button onClick={run}>轉換並還原</button><pre>{result}</pre></>;
}
```

回到瀏覽器開啟 `/?tool=csv`，按「轉換並還原」。對照下圖，JSON 要有兩個物件，CSV 的備註要保留引號。再把第一筆的結尾引號刪掉、重按一次，底下應改為「引號未關閉」。

![教學程式的實際結果，同一次操作會列出兩個 JSON 物件和還原後的 CSV。](../../assets/project-series/toolbox/workshop-csv.webp)

如果畫面找不到新工具，檢查路徑是否為 `src/tools/csv.tsx`，並確認元件是 `export default`。此時在專案根目錄跑 `npm run build`，TypeScript 和 Vite 都通過後再加第二個工具。
