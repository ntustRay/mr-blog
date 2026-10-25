import type { ReactNode } from "react";
import "./globals.css";
export const metadata = { title: "圖片比對教學" };
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
