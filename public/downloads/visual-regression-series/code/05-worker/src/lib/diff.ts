import pixelmatch from "pixelmatch";
export type Pixels = {
  width: number;
  height: number;
  rgba: Uint8ClampedArray<ArrayBuffer>;
};
export type Result = Pixels & { changed: number; total: number };
export function compare(a: Pixels, b: Pixels, threshold: number): Result {
  if (a.width !== b.width || a.height !== b.height)
    throw new Error("兩張圖片尺寸須相同");
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1)
    throw new Error("容差須介於 0 與 1");
  if (
    !Number.isInteger(a.width) ||
    !Number.isInteger(a.height) ||
    a.width < 1 ||
    a.height < 1 ||
    a.width > 4096 ||
    a.height > 4096
  )
    throw new Error("每邊須介於 1 與 4096 px");
  const total = a.width * a.height;
  if (a.rgba.length !== total * 4 || b.rgba.length !== total * 4)
    throw new Error("RGBA 長度不符");
  const rgba = new Uint8ClampedArray(total * 4);
  const changed = pixelmatch(a.rgba, b.rgba, rgba, a.width, a.height, {
    threshold,
    includeAA: false,
  });
  return { changed, total, rgba, width: a.width, height: a.height };
}
