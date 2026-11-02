---
title: '[Guide] 線上試妝 05：完成比較、縮放、收藏與下載'
description: 拆解 Zustand 與引擎的狀態邊界、比較線座標轉換、CSS 縮放拖曳、妝容持久化與 Canvas PNG 匯出，避免預覽與下載混用尺寸。
pubDate: 2026-11-02
category: Web Development
tags: [React, Zustand, Canvas, TypeScript]
coverImage: /images/shade-room-series/05-compare.webp
relatedPostIds: [shade-room-03-face-worker, shade-room-04-webgl-lipstick, shade-room-06-testing-deploy]
draft: false
references:
  - title: Zustand persist middleware
    url: https://zustand.docs.pmnd.rs/reference/middlewares/persist.html
  - title: MDN HTMLCanvasElement.toBlob
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
  - title: MDN URL.revokeObjectURL
    url: https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static
---

系列：[1 架構](../shade-room-01-architecture/) · [2 影像輸入](../shade-room-02-image-camera/) · [3 嘴唇定位](../shade-room-03-face-worker/) · [4 WebGL 妝效](../shade-room-04-webgl-lipstick/) · [5 操作與匯出](../shade-room-05-interaction-export/) · [6 測試與部署](../shade-room-06-testing-deploy/)

妝效畫出來後，還要讓使用者能比較、保存設定與下載。這些操作會碰到不同的狀態與座標，先分清楚才能避免「比較線移了，影像也跟著偏」或「下載只有畫面的一部分」。

## 這篇的重點

妝效設定、檢視設定與影像資源各有生命週期。比較線必須轉到影像座標；下載則從 Canvas 的繪圖緩衝區取得結果，不把介面上的縮放與按鈕拍進去。

<figure>
  <a href="../../images/shade-room-series/05-compare.webp"><img src="../../images/shade-room-series/05-compare.webp" alt="Shade Room 實際比較模式，左側原圖、右側試妝，中央有可拖動分界。" loading="lazy" decoding="async" /></a>
  <figcaption>實際比較模式截圖。畫面分界是 UI 元素，左右是否套用妝效則由 Shader 決定。</figcaption>
</figure>

## 1. 狀態放在哪裡

| 類型 | 內容 | 位置 |
| --- | --- | --- |
| 妝效與收藏 | 色號、濃度、質地、收藏、已存妝容 | Zustand |
| 當前檢視 | 原圖／試妝／比較、分界、zoom、pan | React state |
| 媒體與逐幀資料 | Bitmap、video、stream、landmarks、忙碌旗標 | TryOnEngine |

`engineRef` 讓元件持有引擎實例，不需要把 Bitmap 或 MediaStream 序列化成 UI state。引擎只把狀態訊息、尺寸與定位是否成功通知 React。

目前回傳的照片 focus 物件也會用來自動拉近臉部。相機逐幀推論仍有 CPU、GPU 與訊息成本；不能因為沒有放進 React state，就宣稱整段流程沒有重繪成本。

## 2. localStorage 只保存需要重用的設定

Zustand 的 [persist middleware](https://zustand.docs.pmnd.rs/reference/middlewares/persist.html) 可用 `partialize` 選擇寫入欄位：

```ts title="src/state/store.ts（persist 選項）"
{
  name: 'shade-room-settings-v1',
  version: 1,
  partialize: (state) => ({
    favorites: state.favorites,
    looks: state.looks,
  }),
}
```

此版本只保存收藏與已儲存的妝容。重整頁面後，當前唇色不會自動恢復成最後一次操作；使用者要到「我的妝容」套用。

一份妝容只有以下資料：

```ts title="src/state/store.ts"
export type SavedLook = {
  id: string;
  shadeId: string;
  intensity: number;
  finish: Finish;
};
```

`saveLook()` 用 `crypto.randomUUID()` 建立 ID，把新設定放在最前面，最多保留 12 份。`applyLook()` 再以 `shadeId` 找到色票資料，避免每次都複製整份色票。

照片、相機影格與模型座標沒有存進這個 JSON。localStorage 仍是同源 JavaScript 可以讀取的儲存空間，沒有加密效果。未來若改 Schema，還要處理舊資料遷移與 runtime 驗證；這版只有基本的版本欄位。

## 3. CSS 縮放與影像像素是兩件事

`Mirror.tsx` 對 Canvas 使用 `translate(...) scale(...)`，改變的是顯示位置與大小。Canvas 的 `width`、`height` 仍是引擎處理中的影像尺寸。

拖曳由 Pointer Events 處理；按下時記錄起點與當時 pan，移動時算出差值，並限制可移動範圍。來源換掉時，把檢視重設；完成照片定位後，再依臉部 focus 決定初始放大位置。

目前比較模式會停用影像拖曳，讓拖動分界的操作較明確。這是互動規則，並不代表比較模式不需要處理既有 zoom 與 pan。

## 4. 比較線為什麼要轉一次座標

比較 Slider 存的是 viewport 內的比例，但 Shader 需要影像中的比例。圖片置中、留白或放大後，兩者就不一定相同。

<figure>
  <a href="../../images/shade-room-series/05-coordinate-export.svg"><img src="../../images/shade-room-series/05-coordinate-export.svg" alt="比較線先從 viewport 座標轉成影像內比例；匯出則停用比較裁切，複製 Canvas 像素到快照，再編碼 PNG。" loading="lazy" decoding="async" /></a>
  <figcaption>兩條路徑各使用自己的尺寸：比較要換座標，匯出要讀繪圖尺寸。</figcaption>
</figure>

```ts title="src/components/Mirror.tsx（座標轉換核心）"
const fit = Math.min(viewWidth / imageWidth, viewHeight / imageHeight);
const paintedWidth = imageWidth * fit * zoom;
const left = viewWidth / 2 + panX - paintedWidth / 2;
const splitInImage = Math.max(0, Math.min(1,
  (splitInViewport * viewWidth - left) / paintedWidth,
));
```

假設 viewport 寬 800、影像顯示寬 600、左邊界為 160，Slider 在 50%：畫面 x 是 400，換到影像比例為 `(400 - 160) / 600 = 0.4`。

Shader 以這個 0.4 決定分界，UI 的線仍畫在 viewport 的 50%。這樣兩邊才會對齊。相機鏡像也要分清楚顯示位置與來源取樣位置，第 4 篇的 `u_mirror` 處理的是後者。

## 5. 匯出先建立快照，再恢復比較畫面

`TryOnEngine.exportImage()` 的順序是：

1. 以 `compare: null` 重畫，移除 Shader 的比較裁切。
2. 建一張與繪圖 Canvas 同尺寸的 2D Canvas。
3. 把 WebGL 畫面複製到這張快照。
4. 恢復目前預覽設定。
5. 將快照非同步編碼為 PNG Blob。

```ts title="src/engine/try-on.ts（匯出節錄）"
this.draw({ ...this.settings, compare: null });
const snapshot = document.createElement('canvas');
snapshot.width = this.canvas.width;
snapshot.height = this.canvas.height;
const context = snapshot.getContext('2d');
if (!context) throw new Error('無法匯出照片。');
context.drawImage(this.canvas, 0, 0);
this.draw();
return new Promise<Blob>((resolve, reject) =>
  snapshot.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('無法匯出照片。')),
    'image/png',
  ),
);
```

先複製到快照，讓後續編碼不依賴仍在更新的相機畫面。比較模式會匯出整張套用當前妝效的影像；原圖模式下，妝效本身仍維持關閉。

CSS zoom、pan 和 DOM 上的標籤、按鈕不會進入這個快照。大照片若在第 2 篇先縮到長邊 1920，下載也以處理後尺寸為準，沒有恢復原始解析度。

本文圖檔使用 WebP；產品的下載功能選擇 PNG。兩者是不同輸出用途。

## 6. 下載完要釋放 Object URL

`App.tsx` 用 `URL.createObjectURL(blob)` 產生下載 URL，建立 `<a download>` 觸發下載，稍後呼叫 `URL.revokeObjectURL(url)` 釋放。

這個版本以一秒延遲做收尾；它是實作上的取捨，不代表所有瀏覽器的下載都保證一秒完成。若要支援更廣的環境，應針對實際目標瀏覽器驗收。

## 7. 自己驗收一次

1. 先放大、平移，再切比較模式，確認分界線與改色邊界對齊。
2. 儲存妝容、重整、套用，確認色號、濃度與質地恢復。
3. 檢查 localStorage，只應有收藏與妝容，沒有照片的 Base64 或 Blob 資料。
4. 在比較模式下載，確認 PNG 不含分界線，且兩側都套用妝效。
5. 在原圖模式下載，確認輸出仍尊重目前關閉的妝效。
6. 比較 Canvas 的繪圖尺寸與 PNG 尺寸，避免拿 CSS 尺寸當驗收值。

下一篇：[像素驗證、CI 與部署](../shade-room-06-testing-deploy/)。
