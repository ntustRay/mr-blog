---
title: '[Guide] 線上試妝 04：用 WebGL 做口紅遮罩、混色與質地'
description: 拆解 Canvas 2D 嘴唇遮罩與 WebGL2 Shader，從 evenodd、Texture、Uniform 到亮度保留、濃度、霧面與光澤，說明近似方法及限制。
pubDate: 2026-11-02
category: "Frontend"
series: shade-lab
seriesOrder: 4
tags: [WebGL, Canvas, MediaPipe, TypeScript]
coverImage: /images/shade-room-series/04-materials.webp
relatedPostIds: [shade-room-03-face-worker, shade-room-05-interaction-export, shade-room-06-testing-deploy]
draft: false
references:
  - title: MDN CanvasRenderingContext2D.fill
    url: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fill
  - title: MDN WebGL textures
    url: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  - title: MDN WebGL API
    url: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
  - title: Khronos GLSL mix
    url: https://registry.khronos.org/OpenGL-Refpages/gl4/html/mix.xhtml
---

系列：[1 架構](../shade-room-01-architecture/) · [2 影像輸入](../shade-room-02-image-camera/) · [3 嘴唇定位](../shade-room-03-face-worker/) · [4 WebGL 妝效](../shade-room-04-webgl-lipstick/) · [5 操作與匯出](../shade-room-05-interaction-export/) · [6 測試與部署](../shade-room-06-testing-deploy/)

取得嘴唇座標後，還有兩個問題：哪些像素可以改色，以及改色後怎麼保留原本的明暗。這一版用 Canvas 2D 建立遮罩，再用 WebGL2 合成。

## 這篇的重點

讀完要能沿著「輪廓 → 遮罩 → Texture → Shader → Canvas」解釋一個像素的顏色。霧面與水光使用規則模擬，沒有做實體口紅、光源或螢幕色彩校準。

<figure>
  <a href="../../images/shade-room-series/04-materials.webp"><img src="../../images/shade-room-series/04-materials.webp" alt="同一張 Jo 範例的唇部裁切：原圖，以及相同紅色與 80% 濃度下的霧面、緞光、水光。" loading="lazy" decoding="async" /></a>
  <figcaption>實際模型與渲染器輸出後裁切排列。三種妝效都使用 #bd393d、80% 濃度；排版與文字是診斷圖，不是產品介面。</figcaption>
</figure>

## 1. 遮罩先回答「這裡能不能畫」

遮罩可以看成一張與原圖同尺寸的灰階圖：黑色為 0，保留原圖；白色為 1，允許改色；中間值用在邊緣融合。

此版本的流程是：

1. 把遮罩 Canvas 塗黑。
2. 用 `OUTER_LIP` 建立外輪廓。
3. 用 `INNER_LIP` 建立嘴巴開口。
4. 將兩個封閉子路徑放進同一個 Path2D，以 `evenodd` 填白。

```ts title="src/engine/renderer.ts（遮罩節錄）"
const path = new Path2D();
smoothContour(path, outer);
smoothContour(path, inner);
context.filter = `blur(${Math.max(0.6, width / 1000)}px)`;
context.fillStyle = 'white';
context.fill(path, 'evenodd');
context.filter = 'none';
```

`smoothContour()` 使用 `quadraticCurveTo()`，以相鄰點的中點銜接曲線，減少輪廓折角。這是幾何平滑；點位若定位錯誤，曲線仍會跟著畫錯。

### evenodd 為什麼能留下開口

對一個點往外作射線，計算穿過邊界的次數：奇數次在填色區，偶數次在外部。落在內輪廓中央時，會先穿過內輪廓、再穿過外輪廓，所以保留成黑色。規則可對照 [Canvas fill 文件](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fill)。

<figure>
  <a href="../../images/shade-room-series/04-mask.webp"><img src="../../images/shade-room-series/04-mask.webp" alt="實際嘴唇遮罩的放大裁切：唇部填白，外部與嘴巴內側保留黑色，邊緣帶灰階。" loading="lazy" decoding="async" /></a>
  <figcaption>由同一次定位結果產生的實際遮罩。白色區域參與混色；灰階來自邊緣柔化。</figcaption>
</figure>

這是在幾何上排除嘴巴內部，並沒有辨識每一顆牙齒。內輪廓偏移、遮擋或柔化範圍過大時，仍可能出現染色。不能把這張遮罩當作語意分割模型。

## 2. WebGL 的幾個名詞先對上實際工作

| 名詞 | 在此專案的工作 |
| --- | --- |
| Vertex | 畫面上兩個三角形的六個頂點 |
| Vertex Shader | 提供頂點位置，並產生用來取樣影像的 UV |
| UV | Texture 的正規化取樣位置，x、y 通常在 0～1 |
| Texture | GPU 可取樣的影像，這裡有原圖與遮罩兩張 |
| Uniform | 一次繪圖共用的參數，例如唇色與濃度 |
| Fragment Shader | 決定目前輸出位置的顏色 |

兩個三角形覆蓋整個 Canvas。即使最後只改唇部，仍會繪製整個矩形；Shader 在遮罩外直接回傳原圖。

<figure>
  <a href="../../images/shade-room-series/04-shader-flow.svg"><img src="../../images/shade-room-series/04-shader-flow.svg" alt="原圖與遮罩各上傳為 Texture，唇色與濃度作為 Uniform，Fragment Shader 取樣後決定保留原圖或混色，最後輸出 Canvas。" loading="lazy" decoding="async" /></a>
  <figcaption>渲染資料流。位置、顏色與介面狀態分別成為不同類型的 GPU 輸入。</figcaption>
</figure>

## 3. 原圖與遮罩各佔一個 Texture unit

建立渲染器時，`u_source` 對應 Texture unit 0，`u_mask` 對應 unit 1。繪圖時把影像與遮罩送進對應的 Texture。

```glsl title="src/engine/renderer.ts（Fragment Shader 節錄）"
vec3 original = texture(u_source, uv).rgb;
float mask = texture(u_mask, uv).r;
if (u_strength <= 0.0 || mask < 0.001) {
  outColor = vec4(original, 1.0);
  return;
}
```

灰階遮罩的 R、G、B 相近，因此取 `.r` 作為強度。這一版把遮罩畫在不透明黑底上，遮罩值來自色彩通道，而非直接讀 alpha。

相機的鏡像效果同時套在原圖與遮罩的取樣座標上。只翻轉其中一張，就會出現畫面與嘴唇位置錯開。

## 4. 先用 mix 理解濃度

GLSL 的 `mix(a, b, t)` 可以理解成：

```glsl
result = a * (1.0 - t) + b * t;
```

當 `t = 0`，保留 a；`t = 1`，使用 b。這裡的有效混合權重是三個值相乘：

```glsl
float weight = u_strength * mask * coverage;
vec3 result = mix(base, tinted, weight);
```

例如濃度 65%、遮罩值 1、`coverage = 0.82`，有效權重為 `0.65 × 1 × 0.82 = 0.533`。邊緣的 mask 較低，顏色就逐步淡出。

濃度 Slider 是這套演算法的參數，不是實體口紅厚度、透明度或商品測量值。

## 5. 保留明暗，避免把嘴唇塗成色塊

直接用固定紅色取代所有唇部像素，原本的陰影與紋理就會消失。此版本先估算原圖亮度，再用亮度調整新色：

```glsl title="src/engine/renderer.ts（亮度與混色節錄）"
vec3 base = pow(original, vec3(2.2));
vec3 pigment = pow(u_color, vec3(2.2));
float luminance = dot(base, vec3(0.2126, 0.7152, 0.0722));
float pigmentLuminance = max(
  dot(pigment, vec3(0.2126, 0.7152, 0.0722)), 0.025
);
float illumination = clamp(luminance / pigmentLuminance, 0.35, 2.4);
vec3 tinted = pigment * (0.35 + 0.65 * illumination);
vec3 result = mix(base, tinted, u_strength * mask * coverage);
outColor = vec4(
  pow(clamp(result, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0
);
```

依序看這段：

1. `pow(..., 2.2)` 把色彩粗略轉到較接近線性的數值空間。
2. `dot()` 用 RGB 加權估算亮度。
3. 原圖與新色的亮度比，影響新色的明暗。
4. 下限與 `clamp()` 避免除到接近零或出現過大值。
5. 混回原圖，再轉回顯示用數值。

這個 gamma 2.2 是近似，沒有實作完整分段 sRGB 轉換與色彩管理。亮度比與上下限也是視覺規則。它保留部分原本的明暗細節，但不能恢復過曝、壓縮或遮擋中已經消失的資訊。

## 6. 霧面、緞光、水光的差別

| 質地 | 本版參數與處理 | 還沒有做到 |
| --- | --- | --- |
| 霧面 matte | 混色 coverage 為 0.94 | 材料粗糙度與真實反射測量 |
| 緞光 satin | coverage 為 0.82，保留原圖明暗 | 依環境改變的反射模型 |
| 水光 gloss | coverage 為 0.82，再加亮帶與原有亮部訊號 | 真實光源方向與遮擋計算 |

水光先把 UV 換成唇部包圍盒中的局部位置，再用指數函式做亮帶：

```glsl title="src/engine/renderer.ts（水光節錄）"
vec2 local = (uv - u_bounds.xy) / max(u_bounds.zw, vec2(0.001));
float shine = exp(
  -pow(local.x * 3.5, 2.0) - pow((local.y - 0.22) * 16.0, 2.0)
);
```

`u_bounds.xy` 是唇部中心，`.zw` 是寬高。換成局部座標後，亮帶能跟著嘴唇位置與大小移動。但這條亮帶仍是規則生成，面對真實光源變化可能不自然。

## 7. 目前重用了什麼，還有什麼成本

照片定位沒有變時，渲染器透過 Landmark 陣列參照判斷是否需要重建遮罩。因此改色時可以重用遮罩。

原圖 Texture 目前仍在每次 `draw()` 上傳，並沒有把靜態照片的上傳完全快取。若量到這裡是瓶頸，可以再區分「新照片、相機新幀、只有設定變動」，避免不必要的上傳。

`preserveDrawingBuffer: true` 方便後續讀取與匯出，但會影響緩衝區的保存行為。這個版本沒有比較開關前後的成本，不應先宣稱它沒有影響。

## 8. 用同一張照片檢查結果

1. 固定人物、影像尺寸、色號、濃度，再比較質地。
2. 濃度設為 0，像素應回到原圖。
3. 放大嘴角與內輪廓，檢查邊緣與開口。
4. 換一張張嘴的照片，觀察內輪廓是否仍能排除嘴巴內部。
5. 遮住部分嘴唇，記錄失敗情況；本版沒有獨立遮擋分割。

第 4、5 步仍需要補足不同人物、姿勢與光線的資料，才能評估泛化效果。幾張成功範例只能證明那些輸入上的結果。

下一篇：[比較、縮放、收藏與下載](../shade-room-05-interaction-export/)。
