"use client";
import { useEffect, useRef, useState } from "react";
import type { Pixels, Result } from "@/lib/diff";
import { readImage } from "@/lib/read-image";
import { runCompare } from "@/lib/run-compare";
export type SaveInput = {
  before: Blob;
  after: Blob;
  threshold: number;
  result: Result;
};
function Preview({ pixels, label }: { pixels: Pixels | null; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = pixels?.width ?? 1;
    c.height = pixels?.height ?? 1;
    if (pixels)
      c.getContext("2d")?.putImageData(
        new ImageData(pixels.rgba, pixels.width, pixels.height),
        0,
        0,
      );
  }, [pixels]);
  return <canvas ref={ref} aria-label={label} />;
}
export default function Viewer({
  save,
}: {
  save?: (input: SaveInput) => Promise<void>;
}) {
  const [before, setBefore] = useState<Blob | null>(null),
    [after, setAfter] = useState<Blob | null>(null);
  const [a, setA] = useState<Pixels | null>(null),
    [b, setB] = useState<Pixels | null>(null);
  const [threshold, setThreshold] = useState(0.1),
    [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false);
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const revision = useRef(0),
    selection = useRef({ before: 0, after: 0 });
  useEffect(
    () => () => {
      revision.current += 1;
      controller.current?.abort();
    },
    [],
  );
  function invalidate() {
    controller.current?.abort();
    revision.current += 1;
    setResult(null);
    setError("");
    setMessage("");
    setBusy(false);
  }
  async function select(file: Blob, side: "before" | "after") {
    const serial = ++selection.current[side];
    invalidate();
    if (side === "before") {
      setA(null);
      setBefore(null);
    } else {
      setB(null);
      setAfter(null);
    }
    try {
      const pixels = await readImage(file);
      if (serial !== selection.current[side]) return;
      if (side === "before") {
        setA(pixels);
        setBefore(file);
      } else {
        setB(pixels);
        setAfter(file);
      }
    } catch (e) {
      if (serial === selection.current[side])
        setError(e instanceof Error ? e.message : "讀圖失敗");
    }
  }
  async function loadExample() {
    try {
      const responses = await Promise.all([
        fetch("/samples/before.png"),
        fetch("/samples/after.png"),
      ]);
      if (responses.some((r) => !r.ok)) throw new Error("找不到範例圖片");
      const [x, y] = await Promise.all(responses.map((r) => r.blob()));
      await Promise.all([select(x, "before"), select(y, "after")]);
    } catch {
      setError("載入失敗");
    }
  }
  async function run() {
    if (!a || !b) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const id = ++revision.current;
    setBusy(true);
    setResult(null);
    setError("");
    setMessage("");
    try {
      const next = await runCompare(a, b, threshold, abort.signal);
      if (id === revision.current) setResult(next);
    } catch (e) {
      if (id === revision.current)
        setError(e instanceof Error ? e.message : "比對失敗");
    } finally {
      if (id === revision.current) setBusy(false);
    }
  }
  async function persist() {
    if (!save || !before || !after || !result) return;
    setSaving(true);
    setError("");
    try {
      await save({ before, after, threshold, result });
      setMessage("已儲存；可前往歷史紀錄");
    } catch {
      setError("儲存失敗；請確認登入、RLS 與網路");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section aria-label="圖片比對">
      <div className="toolbar">
        <button type="button" onClick={loadExample} disabled={saving}>
          載入範例
        </button>
        <label>
          像素容差
          <input
            aria-label="像素容差"
            type="number"
            min="0"
            max="1"
            step=".01"
            value={threshold}
            disabled={saving}
            onChange={(e) => {
              invalidate();
              setThreshold(Number(e.target.value));
            }}
          />
        </label>
        <button
          className="primary"
          type="button"
          onClick={run}
          disabled={!a || !b || busy || saving}
        >
          {busy ? "比對中" : "開始比對"}
        </button>
        {save && (
          <button type="button" disabled={!result || saving} onClick={persist}>
            {saving ? "儲存中" : "儲存比較"}
          </button>
        )}
      </div>
      <div className="grid">
        <div className="panel">
          <label>
            Before
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={saving}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void select(f, "before");
              }}
            />
          </label>
          <Preview pixels={a} label="Before 預覽" />
        </div>
        <div className="panel">
          <label>
            After
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={saving}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void select(f, "after");
              }}
            />
          </label>
          <Preview pixels={b} label="After 預覽" />
        </div>
      </div>
      <p className="note">
        兩張圖片須同尺寸；每張 ≤ 5 MB；每邊 ≤ 4096 px；透明區域以白底比對。
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {result && (
        <div className="panel">
          <p className="metrics">
            變更 {result.changed.toLocaleString()} /{" "}
            {result.total.toLocaleString()} pixels ·{" "}
            {((result.changed / result.total) * 100).toFixed(2)}%
          </p>
          <Preview pixels={result} label="差異圖" />
        </div>
      )}
    </section>
  );
}
