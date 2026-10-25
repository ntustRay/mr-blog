import Viewer from "@/components/viewer";
export default function Page() {
  return (
    <main>
      <p>VISUAL REGRESSION / 教學範例</p>
      <h1>比較兩張圖片</h1>
      <p>選圖 → 比對 → 查看差異。圖片只在瀏覽器處理。</p>
      <Viewer />
    </main>
  );
}
