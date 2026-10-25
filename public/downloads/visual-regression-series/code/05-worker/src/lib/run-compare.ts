import type { Pixels, Result } from "./diff";
import type { Job, Reply } from "./worker-types";
export function runCompare(
  a: Pixels,
  b: Pixels,
  threshold: number,
  signal?: AbortSignal,
): Promise<Result> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(
      new URL("./image-diff.worker.ts", import.meta.url),
      { type: "module" },
    );
    const id = crypto.randomUUID();
    let timer: ReturnType<typeof setTimeout> | undefined;
    function cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      worker.terminate();
    }
    function cancel() {
      cleanup();
      reject(new DOMException("Cancelled", "AbortError"));
    }
    worker.onmessage = (event: MessageEvent<Reply>) => {
      if (event.data.id !== id) return;
      cleanup();
      if ("error" in event.data) reject(new Error(event.data.error));
      else resolve(event.data.result);
    };
    worker.onerror = () => {
      cleanup();
      reject(new Error("Worker 啟動或執行失敗"));
    };
    worker.onmessageerror = () => {
      cleanup();
      reject(new Error("Worker 訊息無法解碼"));
    };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("比對逾時"));
    }, 30000);
    signal?.addEventListener("abort", cancel, { once: true });
    // 複製後再 transfer，Canvas 預覽仍需使用原陣列。
    const left = { ...a, rgba: a.rgba.slice() },
      right = { ...b, rgba: b.rgba.slice() };
    const job: Job = { id, a: left, b: right, threshold };
    try {
      worker.postMessage(job, [left.rgba.buffer, right.rgba.buffer]);
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}
