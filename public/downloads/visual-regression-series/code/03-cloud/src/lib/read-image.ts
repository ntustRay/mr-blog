import type { Pixels } from "./diff";
export async function readImage(file: Blob): Promise<Pixels> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("請選 PNG、JPEG 或 WebP");
  if (file.size === 0 || file.size > 5 * 1024 * 1024)
    throw new Error("每張須介於 1 byte 與 5 MB");
  const image = await createImageBitmap(file);
  try {
    if (image.width > 4096 || image.height > 4096)
      throw new Error("每邊不得超過 4096 px");
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("無法建立 Canvas");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    return {
      width: canvas.width,
      height: canvas.height,
      rgba: new Uint8ClampedArray(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data,
      ),
    };
  } finally {
    image.close();
  }
}
