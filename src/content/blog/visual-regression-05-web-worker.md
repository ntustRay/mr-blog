---
title: '[Guide] 把圖片比對移到 Web Worker'
description: 先錄下 Main Thread，再將 pixelmatch 移到 Worker，核對結果與清理行為。
pubDate: 2026-10-25
category: Web Development
tags:
- Next.js
- TypeScript
- Web Worker
- Performance
draft: false
references:
- title: Worker.postMessage
  url: https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
- title: Transferable objects
  url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
relatedPostIds:
- visual-regression-01-nextjs-bun-biome
- visual-regression-02-vercel-deploy
- visual-regression-03-supabase-private-storage
- visual-regression-04-ci-cd
- visual-regression-06-correctness-and-access
---

系列：[1 起步](../visual-regression-01-nextjs-bun-biome/) · [2 Vercel](../visual-regression-02-vercel-deploy/) · [3 Supabase](../visual-regression-03-supabase-private-storage/) · [4 Actions](../visual-regression-04-ci-cd/) · [5 Worker](../visual-regression-05-web-worker/) · [6 驗收](../visual-regression-06-correctness-and-access/)

[下載完整範例與圖片（ZIP）](../../downloads/visual-regression-series.zip) · [程式與驗證範圍](../../downloads/visual-regression-series/README.md)

完成畫面：Performance 的 Worker track 裡能找到 pixelmatch，比對數值與修改前相同。

先完成前三篇，準備附件 `tools/large-samples.html`、`patches/05-worker/`。本篇只搬移比對計算；讀圖、Canvas 與 React state 仍在 Main Thread。


## 1. 記下修改前版本

在教學專案執行：

```sh
git status --short
git rev-parse HEAD
```

先提交或另存自己的既有修改。保留這個 SHA，才能回到相同基準。


## 2. 開啟圖片產生器

用瀏覽器開啟附件 `tools/large-samples.html`。

輸入 `2048`，產生兩張 2048 × 2048 色塊圖，分別下載 Before、After。兩張檔案都保留下來。


## 3. 載入這組圖片

```sh
bun run dev
```

開啟 `http://localhost:3000`，在 Before、After 選取剛才下載的圖片。

記下容差。修改前後都使用這組圖片與相同容差。


## 4. 開啟 Performance

開 Chrome DevTools → Performance。

若有 CPU slowdown 選項，選定一個倍率；沒有則保留預設。記下 Chrome 版本與實際倍率，修改後沿用。


## 5. 錄下修改前的比對

點 Record，回教學頁點「開始比對」，結果出現後點 Stop。


## 6. 找到 Main Thread 的計算

放大剛才的操作區間，在 Main track 找 `compare`／`pixelmatch`。

記下計算時間、changed pixels 與百分比。若工作太短難以觀察，可改產生 4096 × 4096 圖片後重錄；記憶體不足就停止。


有錄到計算，不代表一定有可感知的卡頓。不要把未重現的現象寫成測試結果。

## 7. 停止 dev，放入 Worker 檔案

回終端機按 `Ctrl+C`。

從附件 `patches/05-worker/src/lib/` 複製到專案 `src/lib/`：

```text
worker-types.ts
image-diff.worker.ts
run-compare.ts
```

前兩個是新增檔；`run-compare.ts` 取代第一篇的同名檔案。其他檔案保留。


## 8. 看 Worker 如何建立

開啟 `src/lib/run-compare.ts`，找到：

```ts
const worker = new Worker(
  new URL("./image-diff.worker.ts", import.meta.url),
  { type: "module" },
);
```

保留這個字面路徑，讓 bundler 找到 Worker。不要改成從外部輸入組合的 URL。


## 9. 看圖片如何傳入 Worker

在同一檔案找 `.slice()` 與 `postMessage()`。完整附件會先以 `left`、`right` 建立 `job`：

```ts
const left = { ...a, rgba: a.rgba.slice() };
const right = { ...b, rgba: b.rgba.slice() };
worker.postMessage(job, [left.rgba.buffer, right.rgba.buffer]);
```

Transfer 後，送出的 buffer 會 detach。先複製，是為了保留原資料供預覽與後續比對。


容量試算：4096² RGBA 每份 64 MiB；原圖兩份、複製兩份、Diff 一份共 320 MiB，尚未計 Canvas、解碼與其他配置。這不是實測峰值。

## 10. 確認舊工作會取消

開啟 `src/components/viewer.tsx`，找到原範例已提供的兩道處理：

```ts
controller.current?.abort();
const id = ++revision.current;
// 收到回應後，只接受目前這次請求。
if (id === revision.current) setResult(next);
```

換圖或改容差會取消前一份工作；Request ID 防止晚到結果蓋掉新狀態。讀圖另有每側序號。


## 11. 確認 Worker 會清理

回 `run-compare.ts`，檢查成功、錯誤、取消與 30 秒逾時的收尾，都會終止 Worker 並移除 listener。


## 12. 先檢查程式，再啟動

```sh
bun run typecheck
bun run lint
bun run test
bun run build
bun run dev
```

每項成功才進下一項。打開與步驟 3 相同的頁面，載入同一組圖片與相同容差。


## 13. 錄下修改後的比對

沿用步驟 4 的 Chrome 與 CPU 設定。

Record →「開始比對」→ 結果出現 → Stop。展開 Worker track，找到 pixelmatch。


## 14. 核對數值

對照步驟 6：changed pixels、百分比與差異圖應相同。

Worker 讓計算離開 Main Thread；啟動與資料複製仍有成本，總耗時可能增加。量測前不寫加速倍數。


## 15. 在比對中換圖

開始比對後，立刻換 Before 圖片。舊結果不應出現。

重新比對，應顯示新圖片的結果。再用「比對中改容差」做一次相同驗收。


## 16. 檢查重複操作與離開頁面

連續比對數次，觀察 Worker 不會持續累積。離開頁面，確認這個頁面的 Worker 已結束。

再選一次尺寸不同的圖片，應顯示錯誤，換回正確圖片仍能使用。


最後停止 dev，執行 `bun run check`。附件 Worker 階段已通過完整 build；效能錄製仍須依上面步驟實際執行，沒有可宣稱的加速倍數。

下一篇：[6 驗收](../visual-regression-06-correctness-and-access/)。
