---
title: '[Guide] 線上試妝 02：把照片與相機畫面送進引擎'
description: 拆解 File、ImageBitmap、getUserMedia 與來源切換，處理照片方向、縮圖、過期結果、相機關閉及錯誤恢復。
pubDate: 2026-11-02
category: Web Development
tags: [TypeScript, Canvas, Web API]
coverImage: /images/shade-room-series/02-inputs.webp
relatedPostIds: [shade-room-01-architecture, shade-room-03-face-worker, shade-room-05-interaction-export]
draft: false
references:
  - title: MDN getUserMedia
    url: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
  - title: MDN createImageBitmap
    url: https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap
  - title: MDN MediaStreamTrack.stop
    url: https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop
  - title: Unsplash License
    url: https://unsplash.com/license
---

系列：[1 架構](../shade-room-01-architecture/) · [2 影像輸入](../shade-room-02-image-camera/) · [3 嘴唇定位](../shade-room-03-face-worker/) · [4 WebGL 妝效](../shade-room-04-webgl-lipstick/) · [5 操作與匯出](../shade-room-05-interaction-export/) · [6 測試與部署](../shade-room-06-testing-deploy/)

照片與相機最後都要交給同一個渲染器。差別在於：照片讀取一次、相機持續更新；兩種來源都需要處理切換與釋放。

## 這篇的重點

輸入層要保證「目前使用哪個來源」與「哪些資源還有效」。完成後，連續換圖不會被慢回來的舊照片覆蓋；離開相機模式，也會停止這個頁面取得的串流。

<figure>
  <a href="../../images/shade-room-series/02-inputs.webp"><img src="../../images/shade-room-series/02-inputs.webp" alt="實際更換人像對話框，提供 Jo、Alex、Sam 三張範例人像。" loading="lazy" decoding="async" /></a>
  <figcaption>實際操作截圖。範例人像由 Unsplash 提供；公開來源與授權列於第 1 篇及專案 THIRD_PARTY_NOTICES.md。</figcaption>
</figure>

## 1. 把三種來源收斂成一個入口

| 來源 | 取得方式 | 準備好的影像 |
| --- | --- | --- |
| 上傳照片 | `<input type="file">` 的 File | ImageBitmap |
| 範例人像 | 同站 `fetch()` 取得 Blob | ImageBitmap |
| 相機 | `getUserMedia()`、video 元素 | 每次推論時截取 ImageBitmap |

此版本的使用者照片直接解碼於瀏覽器，沒有呼叫上傳 API。範例圖片、模型與 WASM 仍需要下載，因此「本機推論」不代表完全沒有網路請求。

## 2. 照片先驗證、解碼，再限制尺寸

`try-on.ts` 限制上傳大小為 `15 * 1024 * 1024` bytes，允許 JPEG、PNG、WebP、AVIF。MIME 與檔案大小是第一層檢查，實際能否解碼仍由瀏覽器判定。

```ts title="src/engine/try-on.ts（解碼節錄）"
const original = await createImageBitmap(blob, {
  imageOrientation: 'from-image',
});
const size = boundedImageSize(original.width, original.height);
const bitmap =
  size.width === original.width && size.height === original.height
    ? original
    : await createImageBitmap(original, {
        resizeWidth: size.width,
        resizeHeight: size.height,
        resizeQuality: 'high',
      });
if (bitmap !== original) original.close();
```

`from-image` 讓解碼考慮影像方向資訊。`boundedImageSize()` 用同一個縮放倍率限制長邊，避免改變長寬比：

```ts title="尺寸計算的核心"
const scale = Math.min(1, 1920 / Math.max(width, height));
const size = {
  width: Math.max(1, Math.round(width * scale)),
  height: Math.max(1, Math.round(height * scale)),
};
```

4000 × 3000 會縮成 1920 × 1440。之後的定位、遮罩與匯出，都以縮圖後的尺寸為基準；不能再套原圖的像素座標。

縮圖能降低後續工作量，但原圖仍先經過解碼。15 MiB 的壓縮檔大小，也不能當作解碼後的記憶體上限。若要處理更大的來源，仍需另外評估解碼峰值。

## 3. 用 generation 擋住晚到的結果

<figure>
  <a href="../../images/shade-room-series/02-lifecycle.svg"><img src="../../images/shade-room-series/02-lifecycle.svg" alt="來源切換時增加 generation，解碼或推論完成後比對版本，過期結果關閉並丟棄；目前來源才會進入引擎。" loading="lazy" decoding="async" /></a>
  <figcaption>非同步工作不保證依開始順序完成。來源序號把「完成」與「仍然有效」分開判斷。</figcaption>
</figure>

假設使用者先選 A，再選 B；B 解碼較快。若兩個 Promise 完成後都直接寫進畫面，A 最後回來就會蓋掉 B。

以下是同一機制的獨立教學片段：

```ts title="來源版本判斷（教學片段）"
let generation = 0;
let currentImage: ImageBitmap | null = null;

async function replaceImage(blob: Blob) {
  const sourceKey = ++generation;
  const next = await createImageBitmap(blob);
  if (sourceKey !== generation) {
    next.close();
    return;
  }
  currentImage?.close();
  currentImage = next;
}
```

正式引擎還會檢查 `disposed`，並把 `sourceKey` 傳給 Worker。這是忽略過期結果；既有的解碼或同步推論可能仍會跑完。

目前程式在新照片成功解碼後才 `stopMedia()`。因此，從相機選到損壞圖片時，不能宣稱點擊選圖當下就已關閉相機。若產品要求立即停止，應在切換開始就停止舊串流，並相應調整失敗畫面。

## 4. 相機需要權限，也需要收尾

[getUserMedia 文件](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)列出安全環境與授權條件。部署使用 HTTPS，本機開發使用 localhost；權限提示期間也可能尚未回覆。

```ts title="src/engine/try-on.ts（相機節錄）"
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 960 },
  },
  audio: false,
});
const video = document.createElement('video');
video.muted = true;
video.playsInline = true;
video.srcObject = stream;
await video.play();
```

`ideal` 是偏好值，實際尺寸要讀 `video.videoWidth` 與 `video.videoHeight`。`audio: false` 表達只需要相機。等待權限或 `play()` 之後，仍要再檢查來源版本，避免使用者已切換來源卻啟用舊串流。

| 錯誤 | 此版本提供的下一步 |
| --- | --- |
| `NotAllowedError` | 檢查相機權限，或使用照片 |
| `NotFoundError` | 接上相機，或使用照片 |
| `NotReadableError` | 檢查是否被其他程式占用，再重試 |
| 模型或 WebGL 啟動失敗 | 顯示錯誤並提供重新載入 |

錯誤名稱是判斷入口，不足以辨識每一種裝置故障的根因。

## 5. 列出每個資源的釋放方式

| 資源 | 何時釋放 | 使用的方法 |
| --- | --- | --- |
| 被替換或過期的 Bitmap | 換圖、取消、銷毀 | `bitmap.close()` |
| 傳進 Worker 的 Bitmap | 推論成功或失敗後 | `finally` 裡 `close()` |
| 相機串流 | 離開相機來源、銷毀 | 每個 track 的 `stop()` |
| video | 停止相機 | `pause()`、`srcObject = null` |
| 動畫回圈 | 停止相機 | `cancelAnimationFrame()` |
| Worker 與 WebGL | 元件卸載 | `terminate()`、刪除 GPU 資源 |

停止自己的 track，不保證其他分頁或程式也停用同一個攝影機。驗收應檢查本頁的 track 與狀態，不能只依硬體燈號下結論。

## 6. 自己驗收一次

1. 交替選兩張照片，最後畫面應對應最後一次選擇。
2. 上傳沒有臉的圖片，舊嘴唇遮罩應清除。
3. 從相機切回有效範例人像，確認本頁取得的 track 已結束。
4. 拒絕相機權限，再改用照片，確認仍有可用的流程。
5. 上傳損壞圖片與超過上限的檔案，確認錯誤可理解且能換回正常圖片。

有了可控的影像來源，下一步才是把影像送去找嘴唇。

下一篇：[MediaPipe 與 Worker](../shade-room-03-face-worker/)。
