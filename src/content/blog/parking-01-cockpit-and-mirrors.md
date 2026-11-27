---
title: "[Insight] 慢慢停的起點：先讓一份車身狀態同時驅動畫面和評分"
description: "從駕駛座與後視鏡回頭看模擬器的程式。用米、秒與弧度描述車子，讓固定時間步、Three.js 和車格判定使用同一份資料。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Game Development
series: parking
seriesOrder: 1
tags:
- Three.js
- WebGL
- Simulation
references:
- title: 慢慢停課程與操作說明
  url: https://github.com/ntustRay/parallel-parking-lab
- title: 慢慢停公開練習場
  url: https://ntustray.github.io/parallel-parking-lab/
---

從駕駛座往右看，後輪快貼到格線了。切到俯視時位置應該一樣，按下提交也應該按照這個位置評分。三個地方若各自移動一輛車，畫面看似停好了，評分卻可能說車身還在格子外。

![慢慢停正式練習場的駕駛座。前窗與後視鏡呈現同一個場景。](../../assets/project-series/parking/02-cockpit.webp)

## 車輛位置由誰決定

公開專案用 JavaScript ES modules，Three.js 隨 repository 一起提供。`physics.js` 接收車身狀態、油門／煞車／轉向與時間差，回傳新狀態；`vehicle-spec.js` 提供車長、軸距等尺寸。鏡頭、模型與評分讀取這些資料，你能在沒有瀏覽器的 Node.js 程式裡重跑同一段行駛。

練習會從程式取得真實座標，產出兩份可以打開的圖，不需建立 3D 模型。第一份記下 D 與 R 檔在相同時間的蠕行距離；第二份把車放入格子、換檔或往前移，標出哪個條件改變判定。最後會把原專案建置成可由 GitHub Pages 託管的靜態站。

![本系列練習的判定報告。第一和第二輛車位置相同，排檔不同，評分也不同。](../../assets/project-series/parking/03-bay-cases.webp)

先做[固定時間步的蠕行練習](../parking-02-parallel-parking-practice/)。這是遊戲模擬資料，車輛參數、鏡面和駕駛座的視野適合用來解釋程式行為。
