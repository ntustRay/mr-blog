import type { Pixels, Result } from "./diff";
export type Job = { id: string; a: Pixels; b: Pixels; threshold: number };
export type Reply =
  | { id: string; result: Result }
  | { id: string; error: string };
