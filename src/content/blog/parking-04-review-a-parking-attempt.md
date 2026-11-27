---
title: "[Insight] 慢慢停做完後，怎麼分辨物理錯、評分錯，還是畫面錯"
description: "用蠕行曲線和入格圖回看遊戲分層，判斷該從哪個模組開始定位，整理靜態部署的驗收條件。"
pubDate: 2026-11-26
updatedDate: 2026-11-27
category: Game Development
series: parking
seriesOrder: 4
tags:
- Three.js
- WebGL
- Testing
references:
- title: 慢慢停的車模與渲染架構
  url: https://github.com/ntustRay/parallel-parking-lab/blob/cdf58af05a07de45c3a47706b2af5fe635968e57/docs/model-architecture.md
- title: 慢慢停的版本與離線下載
  url: https://github.com/ntustRay/parallel-parking-lab/releases
---

畫面上看見車歪了，可能是車身真的有角度，也可能是相機看偏。手上有前兩課的檔案，就能先把問題縮小。先對著距離圖確認 D、R 與煞車，再用入格報告將 x、z、angle 固定在同一位置，最後才回遊戲切換攝影機。

![遊戲公開圖庫的右側座艙。這個視角可目視車窗、路緣與鏡面；判斷車身越線仍要對照物理輪廓。](../../assets/project-series/parking/03-cabin-right.webp)

| 現象 | 優先檢查 | 已有的比較基準 |
| --- | --- | --- |
| 倒檔距離變成正值 | physics.js 的 gear、速度與 step 時間 | 五秒蠕行圖，同一個起點只換檔 |
| 圖上車身已置中，提交還是失敗 | result 的 inside、stopped、parked 與角度 | 三個入格案例分別只動一個變數 |
| 同一個 state，換相機才看出穿模 | camera-rig.js、車模尺寸及近裁切 | 固定車身後切換駕駛座、俯視和側視 |
| 本機正常，Pages 只顯示空場景 | build.js 的模組路徑與 _site 的模型檔 | 用 server.js --built 開與 Pages 同一種產物 |

把資料與畫面分開的好處在於，改車身尺度時能先用 Node 重跑邊界，再打開瀏覽器檢查鏡面。反過來調整相機位置時，也有固定幾何圖能確認物理判定仍相同。這套流程驗證的是模擬器內部的一致性，沒有校準實車方向盤、鏡面或完全一致的場地尺寸。

[回到慢慢停系列](../../series/parking/)
