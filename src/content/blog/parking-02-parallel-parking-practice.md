---
title: '[Guide] 慢慢停路邊停車：同一個位置切換後視鏡和俯視'
description: 用低速模式跑一輪右側停車，逐段暫停示範，對照第一人稱與正上方，再自己提交結果。
pubDate: 2026-11-26
category: Game Development
series: parking
seriesOrder: 2
tags:
- Three.js
- WebGL
- Simulation
references:
- title: 慢慢停公開練習場
  url: https://ntustray.github.io/parallel-parking-lab/
- title: 課程與快捷鍵
  url: https://github.com/ntustRay/parallel-parking-lab#操作
---

用鍵盤做一輪右側停車。先在示範裡找出回正的時機，接著從同一個起點自己操作。需要開啟 [慢慢停](https://ntustray.github.io/parallel-parking-lab/) 和支援 WebGL 2 的桌面瀏覽器。

## 1. 固定條件

練習項目選「路邊停車」，車位大小用「標準」，方向選右側。練習方式保留「練習」，觀察視角選第一人稱，勾選低速練習，再按「開始練習」。

![慢慢停的練習設定，已選路邊停車、標準車位與右側方向](../../assets/project-series/parking/02-setup.webp)

## 2. 在示範裡停在回正前後

1. 若左側教練沒出現，按 `T` 展開。勾「每步暫停觀察」，按「入位示範」。
2. 用「繼續示範」逐段前進。每次停下來先看左側的教練提示，再按提示看相應後視鏡。右鏡可核對路緣，斜退回正前也要留意道路側的左鏡。找不到格線時，可以點鏡面放大。
3. 到斜退入格的步驟，按 `3` 切「正上方」。看車尾是否已跨入格線，以及車頭和前車還有多少空間。按 `1` 切回第一人稱，車仍停在同一個位置。

![駕駛座畫面同時顯示左、中、右三面後視鏡，右鏡可觀察靠路緣的一側](../../assets/project-series/parking/02-cockpit.webp)

示範裡的角度是這個車格和車身模型的參考值。下一輪先用教練提示找同一個位置，切俯視只用來確認自己有沒有看對。

## 3. 自己做一次並送出

1. 按 `Backspace` 重新練習。按住 `S` 或空白鍵煞車，按 `R` 排倒檔。放開煞車，讓車先靠蠕行移動。需要停住觀察時再踩煞車。
2. 依教練提示依序做定位、斜退和回正直退。第三段在教練提示回正時先煞停，按 `X`，確認方向盤回正才繼續。需要保持打滿時，用 `V` 固定向右或 `Z` 固定向左。
3. 照提示反打並微調。用 `3` 檢查車身各角都在格內、車身和長邊平行。踩煞車到速度顯示 `0.0`，按 `P`，再按 `E` 提交。
4. 展開結果，先記下沒達標的條件。若車頭還跨線，下一輪回到斜退、回正的分界，觀察從哪一步開始偏離。

設定畫面取自本機啟動的公開原始碼，駕駛座畫面取自 [慢慢停的公開圖庫](https://ntustray.github.io/parallel-parking-lab/screenshots/)。

[下一篇：把低速操作和入格判定寫成測試](../parking-03-test-vehicle-state/)
