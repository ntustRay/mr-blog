"use client";

import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

type Report = {
  signedIn: boolean;
  rowRequestFailed: boolean;
  rowReadable: boolean;
  imageLinkAvailable: boolean;
};

export default function AccessCheckPage() {
  const [comparisonId, setComparisonId] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState("");

  async function check() {
    setRunning(true);
    setReport(null);
    setMessage("");
    try {
      const client = browserClient();
      const user = await client.auth.getUser();
      const row = await client
        .from("tutorial_comparisons")
        .select("id")
        .eq("id", comparisonId.trim());
      const image = await client.storage
        .from("tutorial-images")
        .createSignedUrl(imagePath.trim(), 60);
      setReport({
        signedIn: !user.error && Boolean(user.data.user),
        rowRequestFailed: Boolean(row.error),
        rowReadable: !row.error && Boolean(row.data?.length),
        imageLinkAvailable: !image.error && Boolean(image.data?.signedUrl),
      });
    } catch {
      setMessage("請求未完成；先檢查本機設定與網路。這次不能算通過。");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main>
      <h1>本機跨帳號權限檢查</h1>
      <p>先以 A 執行正向對照，再以 B 與未登入狀態測試同一組值。</p>
      <p>
        <label htmlFor="comparison-id">紀錄 ID</label>{" "}
        <input
          id="comparison-id"
          value={comparisonId}
          onChange={(event) => setComparisonId(event.target.value)}
          autoComplete="off"
        />
      </p>
      <p>
        <label htmlFor="image-path">before_path</label>{" "}
        <input
          id="image-path"
          value={imagePath}
          onChange={(event) => setImagePath(event.target.value)}
          autoComplete="off"
        />
      </p>
      <button
        type="button"
        disabled={running || !comparisonId.trim() || !imagePath.trim()}
        onClick={check}
      >
        {running ? "檢查中" : "檢查目前權限"}
      </button>
      <div role="status">
        {message && <p>{message}</p>}
        {report && (
          <ul>
            <li>
              目前登入狀態：
              {report.signedIn ? "已登入" : "未登入或 Session 無效"}
            </li>
            <li>資料表請求發生錯誤：{report.rowRequestFailed ? "是" : "否"}</li>
            <li>資料列可取得：{report.rowReadable ? "是" : "否"}</li>
            <li>新圖片連結可取得：{report.imageLinkAvailable ? "是" : "否"}</li>
          </ul>
        )}
      </div>
      <p>不會顯示 Token 或圖片網址。驗收後刪除此本機檢查頁。</p>
    </main>
  );
}
