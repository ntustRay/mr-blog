---
title: '[Guide] 線上試妝 03：MediaPipe 怎麼找嘴唇？把追蹤放進 Worker'
description: 從 landmark 與像素座標開始，拆解 Face Landmarker 初始化、IMAGE／VIDEO 模式、ImageBitmap transfer、單一推論排程與過期結果排除。
pubDate: 2026-11-02
category: "Frontend"
series: shade-lab
seriesOrder: 3
tags: [MediaPipe, Web Worker, TypeScript, Performance]
coverImage: /images/shade-room-series/03-landmarks.webp
relatedPostIds: [shade-room-02-image-camera, shade-room-04-webgl-lipstick, shade-room-06-testing-deploy]
draft: false
references:
  - title: MediaPipe Face Landmarker Web
    url: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
  - title: Google AI Edge MediaPipe 原始碼
    url: https://github.com/google-ai-edge/mediapipe
  - title: MDN Transferable objects
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
  - title: Vite Web Workers
    url: https://vite.dev/guide/features.html#web-workers
---

系列：[1 架構](../shade-room-01-architecture/) · [2 影像輸入](../shade-room-02-image-camera/) · [3 嘴唇定位](../shade-room-03-face-worker/) · [4 WebGL 妝效](../shade-room-04-webgl-lipstick/) · [5 操作與匯出](../shade-room-05-interaction-export/) · [6 測試與部署](../shade-room-06-testing-deploy/)

MediaPipe 回傳的是臉部座標。要試口紅，接著要挑出嘴唇的內外輪廓，再交給渲染器決定哪些像素可以改色。

## 這篇的重點

完成後，要能解釋三個邊界：模型輸出如何轉成像素、ImageBitmap 傳送後由誰釋放，以及推論較慢時為什麼不把每幀都排進佇列。

<figure>
  <a href="../../images/shade-room-series/03-landmarks.webp"><img src="../../images/shade-room-series/03-landmarks.webp" alt="以實際 Face Landmarker 結果疊出的 Jo 唇部輪廓，外輪廓為黃色、內輪廓為青色。" loading="lazy" decoding="async" /></a>
  <figcaption>診斷圖：使用實際模型偵測範例 Jo，再疊上輪廓線；這個疊圖是本文的檢查工具，產品 UI 沒有顯示定位點。人像來源見第 1 篇。</figcaption>
</figure>

## 1. Landmark 是什麼

把一張臉想成一組有固定索引的幾何點。同一個索引對應模型定義的臉部位置；應用程式依連線規則挑出需要的區域。

此版本只使用第一張臉，`numFaces: 1`。`validFace()` 要求陣列至少有 468 點，並檢查所需唇部索引的 x、y 是否為有限值。這個檢查不能推論成每個模型版本都只輸出 468 點。

| 資料 | 在本專案怎麼用 |
| --- | --- |
| `x`、`y` | 正規化的影像位置，用於 2D 遮罩 |
| `z` | 深度資訊；本版遮罩沒有拿來做 3D 光照 |
| Landmark index | 挑選嘴唇輪廓的固定位置 |
| `faceLandmarks[0]` | 第一張臉的點陣列；沒有結果時用空陣列 |

不能把 `z` 當成相機前方的公尺數，也不能只因為有深度值就宣稱完成了 3D 臉部材質。

## 2. 座標先轉到影像尺寸

```ts title="src/engine/geometry.ts（contour 核心）"
const pixel = {
  x: point.x * imageWidth,
  y: point.y * imageHeight,
};
```

假設影像是 1000 × 1250，某點為 `(0.46, 0.60)`，像素位置就是 `(460, 750)`。這裡使用影像本身的尺寸；CSS 把 Canvas 放大後的寬高，屬於另一個座標系。

`OUTER_LIP` 與 `INNER_LIP` 各選 20 個索引，依輪廓順序連接。不要對全部唇部點取 convex hull：凸包會把嘴巴開口包進同一塊區域。

可以先用 `beginPath()`、`lineTo()` 疊出輪廓，目視檢查是否貼合。正式遮罩會再使用曲線與邊緣柔化，第 4 篇接著處理。

## 3. 為什麼把推論放到 Worker

[官方文件](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)說明 `detect()`、`detectForVideo()` 是同步呼叫。放在 Main Thread 時，計算會占住處理介面工作的執行緒。

Worker 把這段計算移開，讓選色、按鈕與畫面更新有機會繼續工作。總耗時仍包含 Bitmap 建立、訊息傳送、推論與繪圖，實際延遲要另外量。

<figure>
  <a href="../../images/shade-room-series/03-worker-flow.svg"><img src="../../images/shade-room-series/03-worker-flow.svg" alt="推論排程：只有新影片影格且 Worker 空閒時才建立 Bitmap 並傳送；忙碌影格跳過；回傳後檢查來源版本並更新座標。" loading="lazy" decoding="async" /></a>
  <figcaption>排程示意。繪圖與推論分開更新，相機影格不會無限制累積。</figcaption>
</figure>

```ts title="src/engine/try-on.ts（Worker 建立）"
const worker = new Worker(new URL('./face.worker.ts', import.meta.url), {
  type: 'module',
});
```

保留可由 Vite 分析的 Worker 路徑，讓打包後的檔名與資產位置由建置工具處理。

## 4. 模型、WASM、JavaScript 各做什麼

| 檔案 | 責任 |
| --- | --- |
| `@mediapipe/tasks-vision` | 提供 FaceLandmarker 與載入介面 |
| `face_landmarker.task` | 模型與任務所需資產 |
| `public/wasm/` | 該套件提供的 WASM 與對應 loader |

WASM 是可在瀏覽器執行的編譯模組。模型檔描述推論所需內容；兩者不能拿任意檔案互換。此專案把同一個 `tasks-vision` 安裝版本的 WASM 複製到靜態輸出，模型則由資產腳本下載。

下面是對照 `@mediapipe/tasks-vision` **1.2.0** 的初始化節錄：

```ts title="src/engine/face.worker.ts（初始化節錄）"
const fileset = await FilesetResolver.forVisionTasks(
  new URL('wasm', baseUrl).href,
  true,
);
const landmarker = await FaceLandmarker.createFromOptions(fileset, {
  baseOptions: { modelAssetPath, delegate: 'GPU' },
  numFaces: 1,
  runningMode: 'IMAGE',
});
```

第二個參數 `true` 對應該版的 `useModule`，讓 module Worker 使用對應的 loader。這是版本相關設定，升級時應重新對照型別宣告與實際打包結果。

正式程式先嘗試 GPU，初始化失敗後嘗試 CPU；每次初始化會在 loader URL 加上不同的 `delegate` query，避免重用已執行過的 module。這是目前版本的處理方式，不是所有 Worker 問題的通用解法。

這個 fallback 只處理模型推論的 delegate。主畫面的渲染仍依賴 WebGL2；CPU 推論可用，不代表沒有 WebGL2 也能試妝。

## 5. IMAGE 與 VIDEO 模式怎麼選

| 來源 | runningMode | 呼叫 |
| --- | --- | --- |
| 單張照片 | `IMAGE` | `detect(bitmap)` |
| 相機影格 | `VIDEO` | `detectForVideo(bitmap, timestamp)` |

切換來源時，Worker 先用 `setOptions()` 切換模式。`timestamp` 以毫秒傳入，這個專案用 `performance.now()`；`video.currentTime` 則用來判斷影片有沒有換到新影格。

```ts title="src/engine/face.worker.ts（模式與推論節錄）"
if (mode !== request.mode) {
  await landmarker.setOptions({ runningMode: request.mode });
  mode = request.mode;
}
const result = mode === 'VIDEO'
  ? landmarker.detectForVideo(request.bitmap, request.timestamp)
  : landmarker.detect(request.bitmap);
```

Worker 回傳的 `elapsed` 只量這段同步推論附近的時間，沒有涵蓋 Bitmap 準備、傳送或 UI 更新，不能直接當作使用者看到的端到端延遲。

## 6. 傳 Bitmap 時，所有權也要跟著想

```ts title="src/engine/try-on.ts（傳送節錄）"
const bitmap = await createImageBitmap(source);
worker.postMessage({
  type: 'frame', id, sourceKey, mode, bitmap,
  timestamp: performance.now(),
}, [bitmap]);
```

最後的 `[bitmap]` 是 transfer list。這個實作先從原始影像另建 Bitmap，把傳送用的資源交給 Worker，原始來源仍留給渲染器使用。Worker 在 `finally` 執行 `request.bitmap.close()`。

Transfer 的所有權行為可對照 [MDN 文件](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)。不能從「可轉移」就推論整段流程完全沒有配置或複製成本。

## 7. 相機忙碌時，跳過這次影格

目前引擎送出相機推論前會檢查：

1. Worker 已就緒，且沒有推論進行中。
2. video 已有影像資料，`currentTime` 與上次不同。
3. 距離上次推論超過 42 ms。

這個 42 ms 是排程間隔條件，不能當成固定 FPS 或效能實測。推論若更慢，`busy` 會讓後續相機影格跳過，下一次再取當時的新畫面。

照片需要得到一次結果，因此遇到舊相機工作尚未完成時會等待；等待後仍檢查來源版本。這個版本尚未加入單次推論無回應時的逾時重建，仍需補上失敗復原測試。

收到結果時，先解除忙碌，再檢查來源：

```ts title="src/engine/try-on.ts（結果處理節錄）"
this.busy = false;
if (response.sourceKey !== this.generation) return;
```

相機定位另外用 `previous + (next - previous) * 0.7` 平滑座標，減少抖動，但會帶來追蹤延遲。超過 450 ms 沒有更新的相機座標會停止用於繪圖；這是目前選定的保護門檻，還需要在不同裝置驗證。

## 8. 自己驗收一次

1. 先用一張正面照片，疊出內外輪廓，確認影像尺寸與點位對得上。
2. 切到相機再切回照片，確認 runningMode 與來源版本都切換。
3. 在等待推論時換圖，確認舊結果不會蓋掉新來源。
4. 記錄 Bitmap 建立、推論、回傳、繪圖各階段時間，再討論瓶頸。

下一篇：[把座標變成唇部遮罩與 WebGL 妝效](../shade-room-04-webgl-lipstick/)。
