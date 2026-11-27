---
title: "[Guide] 實作透明貼紙：用 Canvas 合成輪廓，讓白邊沿著葉子生長"
description: "從可直接開啟的 HTML 練習重建 source-in、外框取樣及 padding，再回 Pixel Workbench 用像素讀值測試透明角落。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Frontend
series: pixel
seriesOrder: 2
tags:
- Canvas
- Image Processing
- PNG
references:
- title: Pixel Workbench 正式站
  url: https://pixel-workbench-eta.vercel.app/
- title: MDN 圖片格式與透明度
  url: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types
---

![本課的瀏覽器實拍。三個 Canvas 從左到右是原圖、輪廓、加邊結果，外框半徑為 8 px。](../../assets/project-series/pixel/02-outline-lab.webp)

## 1. 建立能看到中間步驟的工作檔

在桌面建一個空目錄，把[單檔練習 pixel-sticker.html](../../downloads/series-labs/pixel-sticker.html)另存進去，用編輯器和瀏覽器同時打開。不需要安裝套件。先將外框從 8 調到 0，再調回 8，觀察右側白邊。打開原始碼的 `draw(radius)`，裡面有 original、mask、sticker 三個畫布。original 是用 Canvas 畫出的透明葉子，接下來只改後兩個畫布。

## 2. 拿掉合成模式，看白色矩形是怎麼來的

找到 `ink.globalCompositeOperation="source-in"`，暫時將值改為 `"source-over"`，存檔並重新整理。第二張會變白色長方形，第三張也會多出不該有的底色。換回下面這四行的順序，重新整理：

```js
ink.drawImage(original, 0, 0);
ink.globalCompositeOperation = "source-in";
ink.fillStyle = "#fff";
ink.fillRect(0, 0, original.width, original.height);
```

第一行把葉子的 alpha 放到 mask，第四行提供白色。使用 source-in 時，白色只會出現在原有的非透明部分。現在右鍵下載 PNG，再換深色背景查看，四角仍應透明。

## 3. 自己重寫畫外框的迴圈

在 `const out=sticker.getContext("2d")` 下面，拿掉從 `for(let i=0` 開始的那行，保留後面的 `out.drawImage(original,radius,radius)`。儲存後只剩綠葉。把以下迴圈填回去；`steps` 已在上一行依半徑算好。

```js
for (let i = 0; i < steps; i++) {
  const angle = i / steps * 2 * Math.PI;
  const x = radius + Math.cos(angle) * radius;
  const y = radius + Math.sin(angle) * radius;
  out.drawImage(mask, x, y);
}
```

沿圓周將白色輪廓畫在不同偏移位置，再把原圖畫回正中間，中央白色就被遮住，只留下外圍。這份練習把輸出寬高各增加 `2 * radius`，留出兩側空間。把半徑改成 16，確認畫布跟著變大且白邊沒有被切掉。

## 4. 對回實際專案，測透明區和輪廓的像素

準備 Node.js 24.x 與 npm，在另一個工作目錄執行：

```sh
git clone https://github.com/ntustRay/pixel-workbench.git
cd pixel-workbench
npm ci
npx playwright install chromium
npx playwright test tests/pipeline.spec.ts -g sticker
```

首次 `npm ci` 的 postinstall 會下載並核對模型資產，需要網路；失敗可查看第一個資產錯誤，修復連線後跑 `npm run assets:prepare`。開 `tests/pipeline.spec.ts` 找 sticker case：它用透明底與已知色塊，逐點讀回 RGBA。透明角落預期是 `[0,0,0,0]`，外框指定位置預期是 `[255,255,255,255]`。測試跑完應看到 sticker 案例執行成功。

正式版的 `src/features/sticker.ts` 還會處理陰影、外框顏色和可選的人像遮罩；`stickerPadding()` 把陰影也算進邊界。[正式效果程式](https://github.com/ntustRay/pixel-workbench/blob/main/src/features/sticker.ts)

![正式產品的原圖與貼紙並排預覽。練習畫布讓你看到正式介面省略的白色輪廓。](../../assets/project-series/pixel/02-compare.webp)

接著將剛才的兩個畫布[依序縮圖、轉成 WebP 並產生 ZIP](../pixel-03-batch-webp-export/)。
