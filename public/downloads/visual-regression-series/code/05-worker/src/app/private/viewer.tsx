"use client";
import { useState } from "react";
import Viewer, { type SaveInput } from "@/components/viewer";
import { readImage } from "@/lib/read-image";
import { browserClient } from "@/lib/supabase/browser";

type Row = {
  id: string;
  before_path: string;
  after_path: string;
  created_at: string;
};
function isRow(x: unknown): x is Row {
  return (
    typeof x === "object" &&
    x !== null &&
    "id" in x &&
    typeof x.id === "string" &&
    "before_path" in x &&
    typeof x.before_path === "string" &&
    "after_path" in x &&
    typeof x.after_path === "string" &&
    "created_at" in x &&
    typeof x.created_at === "string"
  );
}
async function png(blob: Blob): Promise<Blob> {
  const p = await readImage(blob),
    c = document.createElement("canvas");
  c.width = p.width;
  c.height = p.height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.putImageData(new ImageData(p.rgba, p.width, p.height), 0, 0);
  return new Promise((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG failed"))),
      "image/png",
    ),
  );
}
export default function CloudViewer() {
  const [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState("");
  const [opened, setOpened] = useState<{
    before: string;
    after: string;
  } | null>(null);
  async function save({ before, after, threshold, result }: SaveInput) {
    const sb = browserClient();
    const { data, error: authError } = await sb.auth.getUser();
    if (authError || !data.user) throw new Error("請重新登入");
    const folder = `${data.user.id}/${crypto.randomUUID()}`,
      paths = [`${folder}/before.png`, `${folder}/after.png`];
    const blobs = await Promise.all([png(before), png(after)]),
      uploaded: string[] = [];
    try {
      for (let i = 0; i < 2; i++) {
        const { error } = await sb.storage
          .from("tutorial-images")
          .upload(paths[i], blobs[i], {
            contentType: "image/png",
            upsert: false,
          });
        if (error) throw error;
        uploaded.push(paths[i]);
      }
    } catch (e) {
      if (uploaded.length)
        await sb.storage.from("tutorial-images").remove(uploaded);
      throw e;
    }
    // insert 回應失敗可能已提交；保留原圖，交由後續清理核對。
    const { error: insertError } = await sb
      .from("tutorial_comparisons")
      .insert({
        owner_id: data.user.id,
        before_path: paths[0],
        after_path: paths[1],
        threshold,
        changed_pixels: result.changed,
        total_pixels: result.total,
        algorithm: "pixelmatch-8.0.0",
        width: result.width,
        height: result.height,
      });
    if (insertError) throw insertError;
  }
  async function history() {
    try {
      setError("");
      const { data, error } = await browserClient()
        .from("tutorial_comparisons")
        .select("id,before_path,after_path,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const values: unknown = data;
      if (!Array.isArray(values) || !values.every(isRow))
        throw new Error("格式不符");
      setRows(values);
    } catch {
      setError("讀取失敗；請確認登入與 RLS");
    }
  }
  async function open(row: Row) {
    try {
      const storage = browserClient().storage.from("tutorial-images");
      const [a, b] = await Promise.all([
        storage.createSignedUrl(row.before_path, 60),
        storage.createSignedUrl(row.after_path, 60),
      ]);
      if (a.error || b.error || !a.data || !b.data) throw new Error("簽名失敗");
      setOpened({ before: a.data.signedUrl, after: b.data.signedUrl });
    } catch {
      setError("開啟失敗");
    }
  }
  async function signOut() {
    await browserClient().auth.signOut();
    location.assign("/login");
  }
  return (
    <>
      <Viewer save={save} />
      <div className="toolbar">
        <button type="button" onClick={history}>
          重新讀取歷史
        </button>
        <button type="button" onClick={signOut}>
          登出
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => open(r)}>
              {new Date(r.created_at).toISOString()}
            </button>
          </li>
        ))}
      </ul>
      {opened && (
        <p>
          60 秒有效：
          <a href={opened.before} target="_blank" rel="noreferrer">
            Before
          </a>{" "}
          ·{" "}
          <a href={opened.after} target="_blank" rel="noreferrer">
            After
          </a>
        </p>
      )}
    </>
  );
}
