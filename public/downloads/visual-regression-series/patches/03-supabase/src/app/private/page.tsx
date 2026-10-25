import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
import CloudViewer from "./viewer";
export const dynamic = "force-dynamic";
export default async function PrivatePage() {
  const supabase = await serverClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return (
    <main>
      <h1>我的圖片比對</h1>
      <p>按下儲存時，才上傳兩張圖片。</p>
      <CloudViewer />
    </main>
  );
}
