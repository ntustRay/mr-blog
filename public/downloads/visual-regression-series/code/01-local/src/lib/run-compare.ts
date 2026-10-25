import { compare, type Pixels, type Result } from "./diff";
export async function runCompare(
  a: Pixels,
  b: Pixels,
  threshold: number,
  signal?: AbortSignal,
): Promise<Result> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  return compare(a, b, threshold);
}
