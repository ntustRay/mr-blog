import { compare } from "./diff";
import type { Job, Reply } from "./worker-types";

self.addEventListener("message", (event: MessageEvent<Job>) => {
  const { id, a, b, threshold } = event.data;
  try {
    const result = compare(a, b, threshold);
    const reply: Reply = { id, result };
    self.postMessage(reply, { transfer: [result.rgba.buffer] });
  } catch (e) {
    const reply: Reply = {
      id,
      error: e instanceof Error ? e.message : "比對失敗",
    };
    self.postMessage(reply);
  }
});
