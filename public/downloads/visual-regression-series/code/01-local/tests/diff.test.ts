import { strict as assert } from "node:assert";
import { test } from "node:test";
import { compare, type Pixels } from "../src/lib/diff.ts";

const white: Pixels = {
  width: 1,
  height: 1,
  rgba: new Uint8ClampedArray([255, 255, 255, 255]),
};
test("相同圖片為零", () => assert.equal(compare(white, white, 0.1).changed, 0));
test("黑白一個像素", () =>
  assert.equal(
    compare(
      white,
      { ...white, rgba: new Uint8ClampedArray([0, 0, 0, 255]) },
      0.1,
    ).changed,
    1,
  ));
test("拒絕尺寸不同", () =>
  assert.throws(() => compare(white, { ...white, width: 2 }, 0.1)));
test("拒絕 NaN", () => assert.throws(() => compare(white, white, NaN)));
test("拒絕資料長度不符", () =>
  assert.throws(() =>
    compare(white, { ...white, rgba: new Uint8ClampedArray(0) }, 0.1),
  ));
