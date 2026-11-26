---
title: '[Guide] 跑慢慢停的物理測試：蠕行、煞停和入格判定'
description: 從公開原始碼啟動慢慢停，把 D／R 檔、煞停和車身入格拆成可重跑的 Node.js 測試。
pubDate: 2026-11-26
category: Game Development
series: parking
seriesOrder: 3
tags:
- Node.js
- Testing
- Simulation
references:
- title: 慢慢停 physics.js
  url: https://github.com/ntustRay/parallel-parking-lab/blob/cdf58af05a07de45c3a47706b2af5fe635968e57/physics.js
- title: Node.js Test Runner
  url: https://nodejs.org/api/test.html
---

排進 P 後立刻按提交，起點的車仍在車格外。這個案例只需要車身狀態、目標格和評分函式，在 Node.js 裡就能重跑。接下來也用同樣方法確認放開煞車後為什麼會動，以及煞車和油門同時按住時誰優先。

## 1. 跑原專案的測試與練習場

需要 Git、Node.js 22 以上和支援 WebGL 2 的瀏覽器。從原始碼重跑本文版本。

```sh
git clone https://github.com/ntustRay/parallel-parking-lab.git
cd parallel-parking-lab
git switch --detach cdf58af05a07de45c3a47706b2af5fe635968e57
npm test
npm start
```

這個版本隨附 Three.js，這兩個指令無需另裝 npm 套件。開啟 `http://127.0.0.1:4173/`，開始右側路邊停車。保持 P 檔、車停在起點，按 `E`。結果會顯示尚未達標。

## 2. 只替換一個條件

另開一個終端機，在原始碼根目錄新增 `parking-check.test.mjs`。將下面內容貼進去，再執行 `node --test parking-check.test.mjs`。

```js title="parking-check.test.mjs"
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { result, scenario, step } from './physics.js';

const scene = scenario('normal', 1, 'parallel');
const stats = { hits: 0, corrections: 0 };

function advance(state, input, steps = 120) {
  for (let index = 0; index < steps; index++) {
    state = step(state, { slow: true, ...input }, 1 / 120);
  }
  return state;
}

test('D 和 R 蠕行方向不同，踩住煞車後會停', () => {
  const forward = advance({ ...scene.start, gear: 'D' }, {});
  const reverse = advance({ ...scene.start, gear: 'R' }, {});

  assert.ok(forward.z > scene.start.z);
  assert.ok(reverse.z < scene.start.z);
  assert.equal(advance(reverse, { throttle: true, brake: true }).speed, 0);
});

test('起點排 P 不通過，入格煞停排 P 才通過', () => {
  const parked = {
    ...scene.start,
    x: scene.target.x,
    z: scene.target.z,
    angle: scene.target.angle,
    speed: 0,
    gear: 'P',
  };

  assert.equal(result(scene.start, scene, stats).passed, false);
  assert.equal(result(parked, scene, stats).passed, true);
  assert.equal(result({ ...parked, gear: 'R' }, scene, stats).passed, false);
});
```

測試一以固定的 `1/120` 秒更新 120 次，讓結果不受螢幕多久重畫一次影響。測試二先把車放在格子中心，再只變更排檔。兩個入格案例座標相同，能看到結果的差異來自排檔條件。

這兩個測試的實際輸出如下，計時欄已省略。

```text
✔ D 和 R 蠕行方向不同，踩住煞車後會停
✔ 起點排 P 不通過，入格煞停排 P 才通過
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

## 3. 回到畫面檢查判定邊界

改成將 `parked` 的 `z` 加 3，保留 P 檔。用 `assert.equal(result({ ...parked, z: parked.z + 3 }, scene, stats).passed, false)` 檢查越過車格端線的情況。接著回瀏覽器切到「正上方」，看格線和車身的長邊如何相對移動。測試只證明這組車身和格線的規則，畫面還能幫你發現格線與碰撞位置是否畫在一起。

原專案的 42 個 Node.js 測試和本文的兩個案例都已重跑。車窗開口、鏡面裡的視野和車身位置仍需各自看畫面。[慢慢停的公開圖庫](https://ntustray.github.io/parallel-parking-lab/screenshots/) 提供固定姿勢的車內視角供對照。

![公開圖庫的車內右側視角，從副駕座一側能看到右窗和車外路緣](../../assets/project-series/parking/03-cabin-right.webp)

[下一篇：停歪時，沿著哪個線索重練](../parking-04-review-a-parking-attempt/)
