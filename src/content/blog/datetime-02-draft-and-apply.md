---
title: "[Guide] 把 DateTime Range Picker 的查詢接在 Apply"
description: "在公開 Playground 核對草稿、提交與時區，再用 npm 套件做出只在 Apply 更新的 React 事件篩選器。"
pubDate: 2026-11-26
category: Frontend
tags: ["React", "TypeScript", "Timezone"]
series: datetime
seriesOrder: 2
references:
  - title: React DateTime Range Picker Playground
    url: https://ntustray.github.io/react-datetime-range-picker/
  - title: React DateTime Range Picker v0.2.2
    url: https://www.npmjs.com/package/@ntustray/react-datetime-range-picker/v/0.2.2
  - title: Picker 公開 API
    url: https://github.com/ntustRay/react-datetime-range-picker/blob/cefadde623e4260ae1235363ae501da7d57c7cec/docs/PUBLIC_API.md
---

這次把圖表的時間篩選拆成草稿和已提交參數。先在公開 Playground 改一次值、換一次時區，接著把這兩個 state 接進 React。沒有現成圖表也能用三筆事件確認行為。

## 1. 改結束時間，先看 Draft

打開 [Playground](https://ntustray.github.io/react-datetime-range-picker/)，往下滑到 **Edit the time. Keep the timestamps.**。右側標籤預設是 **UTC · LIGHT**。兩欄初始值為 `2026/08/09 12:00:00` 與 `2026/08/09 13:30:00`。把結束欄改成 `2026/08/09 13:00:00`，按 Tab，先別按「套用」。

Draft 的 `endTimestamp` 應是 `1786280400000`，Committed 仍是 `1786282200000`。日曆浮層如果遮住數字，可以在 DevTools 的 Elements 搜尋 `state-readout`，展開下方兩組讀值。

![套用前的實際資料，截圖暫時隱藏日曆浮層以顯示兩組毫秒值。](../../assets/project-series/datetime/02-draft.webp)

## 2. 套用後切換時區

在日曆按「套用」。Committed 的結束值現在應等於 Draft。再按「開啟日曆」，把時區下拉選成 `Asia/Taipei`，便能看到開始與結束時間移到 `20:00:00` 和 `21:00:00`。下方兩組 timestamps 仍代表同一段時間。

![按套用後，Draft 和 Committed 的開始、結束值相同。](../../assets/project-series/datetime/02-applied.webp)

![顯示時區切到 Asia/Taipei，兩組毫秒值維持原樣。](../../assets/project-series/datetime/02-timezone.webp)

## 3. 接到 React 的事件清單

準備 Node.js 22.18+。已有 React 專案時只要裝第三行的套件，並把範例接到要篩選的頁面。

```sh
npm create vite@latest picker-lab -- --template react-ts
cd picker-lab
npm install @ntustray/react-datetime-range-picker@0.2.2
npm run dev
```

把 Vite 專案的 `src/App.tsx` 改成下面這段，開啟開發伺服器顯示的網址。範例用名為 `committed` 的已提交區間篩事件；接 API 時可在相同位置使用這組參數。

```tsx title="src/App.tsx"
import { useState } from "react";
import {
  DateTimeRangePicker,
  type DateTimeRangeValue,
} from "@ntustray/react-datetime-range-picker";
import "@ntustray/react-datetime-range-picker/styles.css";

const initial = {
  startTimestamp: Date.UTC(2026, 7, 9, 12),
  endTimestamp: Date.UTC(2026, 7, 9, 13, 30),
};

const events = [
  { label: "12:30 UTC", at: Date.UTC(2026, 7, 9, 12, 30) },
  { label: "13:00 UTC", at: Date.UTC(2026, 7, 9, 13) },
  { label: "13:15 UTC", at: Date.UTC(2026, 7, 9, 13, 15) },
];

export default function App() {
  const [draft, setDraft] = useState<DateTimeRangeValue>(initial);
  const [committed, setCommitted] = useState<DateTimeRangeValue>(initial);
  const { startTimestamp, endTimestamp } = committed;
  const visible = startTimestamp === null || endTimestamp === null
    ? []
    : events.filter(({ at }) => startTimestamp <= at && at < endTimestamp);

  return (
    <main>
      <DateTimeRangePicker
        value={draft}
        onChange={setDraft}
        onCommit={setCommitted}
        locale="zh-TW"
        timezone="UTC"
      />
      <ul>
        {visible.map(({ label }) => <li key={label}>{label}</li>)}
      </ul>
    </main>
  );
}
```

先確認三筆事件都在清單。把結束改成 `2026/08/09 13:00:00`，按 Tab 時應仍看見三筆。按「套用」後應只剩 `12:30 UTC`。`13:00 UTC` 正好是結束邊界，依 `[start, end)` 排除。

![本機 React 範例套用 12:00 至 13:00，事件清單只顯示 12:30 UTC。](../../assets/project-series/datetime/02-events.webp)
