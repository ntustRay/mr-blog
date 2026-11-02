---
title: '[Guide] 線上試妝 01：從需求拆到技術架構'
description: 用 Shade Room 拆解照片、臉部定位與口紅渲染的資料流，說明 Vite、React、MediaPipe、Worker 與 WebGL2 的分工、取捨及讀碼順序。
pubDate: 2026-11-02
category: Web Development
tags: [React, TypeScript, Vite, WebGL]
coverImage: /images/shade-room-series/01-desktop.webp
relatedPostIds: [shade-room-02-image-camera, shade-room-03-face-worker, shade-room-04-webgl-lipstick]
draft: false
references:
  - title: 本文對照的 Shade Room 程式版本（Private，需讀取權限）
    url: https://github.com/ntustRay/shade-room/tree/879fff388bde8e06fd825690aa88717c4146b763
  - title: MediaPipe Face Landmarker Web
    url: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
  - title: Vite 靜態部署
    url: https://vite.dev/guide/static-deploy.html
  - title: Jo 範例人像來源
    url: https://images.unsplash.com/photo-1524504388940-b1c1722653e1
  - title: Unsplash License
    url: https://unsplash.com/license
---

系列：[1 架構](../shade-room-01-architecture/) · [2 影像輸入](../shade-room-02-image-camera/) · [3 嘴唇定位](../shade-room-03-face-worker/) · [4 WebGL 妝效](../shade-room-04-webgl-lipstick/) · [5 操作與匯出](../shade-room-05-interaction-export/) · [6 測試與部署](../shade-room-06-testing-deploy/)

線上試口紅需要完成三件事：取得影像、找到嘴唇、只改變嘴唇的顏色。Shade Room 把這三件事分成影像生命週期、臉部推論、妝效渲染，再由 React 接上操作介面。

## 這篇的重點

完成本篇，要能畫出一張圖，解釋一張照片如何變成試妝結果，以及改色時為什麼能沿用定位結果。本文以已完成專案拆解原理；程式碼節錄會標示範圍，沒有提供整個私有專案的複製步驟。

<figure>
  <a href="../../images/shade-room-series/01-desktop.webp"><img src="../../images/shade-room-series/01-desktop.webp" alt="Shade Room 實際桌面畫面：試妝鏡、16 個唇色色票與質地濃度設定。" loading="lazy" decoding="async" /></a>
  <figcaption>完成版實際截圖。範例人像取自 Unsplash，色號與質地為演算法模擬，不代表實體產品效果。</figcaption>
</figure>

## 1. 先把功能變成輸入與輸出

| 操作 | 輸入 | 應得到的輸出 |
| --- | --- | --- |
| 選照片 | File 或同站範例圖片 | 可繪製影像、尺寸與嘴唇座標 |
| 開相機 | MediaStream | 持續更新的影像與定位結果 |
| 換色、改濃度 | 顏色、0～100 的濃度 | 同一影像上的新妝效 |
| 切換比較 | 畫面分界位置 | 分界左側原圖、右側試妝 |
| 儲存妝容 | 色號 ID、質地、濃度 | 可再次套用的設定 |
| 下載 | 目前影像與妝效設定 | 不含 UI 與比較線的 PNG |

第一版限定單人、嘴唇清楚可見。手指遮嘴、頭髮遮擋、極端側臉與實體商品色彩校準，仍是限制。把範圍先寫出來，才能判斷模型與測試是否足夠。

## 2. 看懂兩條資料流

<figure>
  <a href="../../images/shade-room-series/01-architecture.svg"><img src="../../images/shade-room-series/01-architecture.svg" alt="架構圖：影像由 TryOnEngine 管理，送 Worker 推論得到 landmarks，再交給 WebGL；React 的設定直接更新渲染器，輸出到 Canvas。" loading="lazy" decoding="async" /></a>
  <figcaption>實作責任示意。推論與繪圖分開，讓操作設定可以重用目前的影像及定位結果。</figcaption>
</figure>

**影像路徑**：照片或相機進入 `TryOnEngine`，建立可傳送的 `ImageBitmap`，交給 Worker 裡的 MediaPipe。Worker 回傳 `landmarks`，渲染器用座標產生遮罩，再把原圖與唇色合成到 Canvas。

**設定路徑**：React 接收選色與 Slider 操作，更新妝效設定，再呼叫 `engine.configure(settings)`。照片沒有變動時，可以沿用已取得的定位結果，直接重畫。

相機則持續繪圖，推論有自己的節流與忙碌判斷。兩者不必維持相同頻率，詳見第 3 篇。

## 3. 工具的選擇要對應工作

| 選擇 | 在此專案的工作 | 取捨 |
| --- | --- | --- |
| Vite＋React＋TypeScript | 瀏覽器應用、互動元件、型別契約與打包 | 需要 Server 的功能要另安排 |
| CSS Modules＋Radix Dialog | 自訂版面、局部樣式與對話框 | 無障礙與鍵盤流程仍需驗收 |
| Zustand | 色號、濃度、質地、收藏與妝容設定 | 每幀影像仍由引擎自己管理 |
| MediaPipe Face Landmarker | 找出臉部幾何座標 | 遮罩、混色與遮擋處理需要另外實作 |
| Web Worker＋ImageBitmap | 把同步推論搬到另一條執行緒 | 有傳送、排程與資源釋放成本 |
| Canvas 2D＋WebGL2 | 2D 建立唇部遮罩；Shader 合成影像 | 需處理座標、GPU 資源及相容性 |
| Bun＋Biome | 套件、腳本、格式與靜態檢查 | CI 需對齊 lockfile 與工具版本 |
| Vitest＋Playwright | 純函式與實際瀏覽器行為 | 模擬相機涵蓋不到真實光線與鏡頭品質 |

這個範圍沒有會員、商品後台或 Server 資料查詢，照片也不需要送往後端。Vite 的靜態輸出可以承載目前功能。若加入商品 SEO、帳號與跨裝置妝容，再評估 Next.js 與後端資料設計。

Canvas 2D 也能做換色原型；這裡選 WebGL2，是把逐像素的顏色與光澤計算放到 Shader，方便相機與照片共用。尚無兩種方案的效能基準，不能宣稱已有固定加速倍數。

## 4. 先讀契約，再讀實作

以下是原始契約的核心欄位：

```ts title="src/engine/types.ts（節錄）"
export type Landmark = { x: number; y: number; z: number };
export type Finish = 'satin' | 'matte' | 'gloss';

export type EffectSettings = {
  color: string;
  intensity: number;
  finish: Finish;
  enabled: boolean;
  compare: number | null;
};
```

`Landmark` 是幾何輸入；`EffectSettings` 是繪圖設定。`compare: null` 代表不裁切比較區域。此版本用六碼 Hex 色彩，渲染前另做格式檢查；TypeScript 的 `string` 本身不會驗證內容。

| 讀碼順序 | 檔案 | 要回答的問題 |
| --- | --- | --- |
| 1 | `types.ts` | 模組之間傳什麼？ |
| 2 | `try-on.ts` | 哪裡管理來源切換、相機與資源？ |
| 3 | `face.worker.ts` | 模型如何載入、接圖與回傳座標？ |
| 4 | `geometry.ts`、`renderer.ts` | 座標如何變成遮罩與顏色？ |
| 5 | `store.ts`、`Mirror.tsx` | 哪些狀態交給 React，哪些留在引擎？ |
| 6 | `try-on.spec.ts` | 哪些產品行為真的有檢查？ |

## 5. 自己畫一次邊界

拿一張紙，依序回答：

1. 上傳新照片時，哪些舊結果必須失效？
2. 只改唇色時，哪些資料可以重用？
3. 使用者離開頁面時，誰停止相機、關閉 Bitmap、終止 Worker？
4. 推論出錯時，畫面要留下原圖，還是繼續顯示舊遮罩？

能把這四個答案放回上面的檔案，就已經掌握架構。下一篇先處理影像的進入與離開。

本文對照 2026-11-02 的 commit `879fff3`。原始 Repo 為 Private；文中必要片段與流程圖可直接閱讀，完整來源連結需要權限。

下一篇：[照片與相機的生命週期](../shade-room-02-image-camera/)。
