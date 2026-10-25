# 範例驗證

日期：2026-10-25（Asia/Taipei）。環境：Linux x86_64、Node.js 24.19.0、Bun 1.4.4。

本次從原草稿的教學程式整理獨立範例，還原文字中的換行、統一格式，保留原稿的 AbortController 與過期結果處理。私人圖片範例採用原稿後續修正：只有上傳階段失敗會嘗試刪除已回報成功的檔案；資料表 insert 回應失敗時保留原圖，避免刪掉可能已提交紀錄所引用的圖片。

| 檢查 | 01-local | 03-cloud | 05-worker |
| --- | --- | --- | --- |
| 鎖定依賴安裝 | 通過 | 通過 | 通過；重跑無變更 |
| `bun run typecheck` | 通過 | 通過 | 通過 |
| `bun run lint` | 通過 | 通過 | 通過 |
| `bun run test` | 5 通過、0 失敗 | 5 通過、0 失敗 | 5 通過、0 失敗 |
| `bun run build` | 完整通過 | 完整通過 | 完整通過，含 Worker bundle |

Next.js 第一次產生型別時補入 `allowJs`；附件已保留此設定。Biome 設定透過其官方 migration 指令更新為相同意義的 recommended preset，避免 deprecated 設定提示。

第一篇也已從空資料夾重建驗證：執行文中完整的 `create-next-app@16.4.2` 指令、固定套件版本，依步驟放入列出的程式與設定檔。create-next-app 產生的 README 經 Biome formatter 修正後，TypeScript、Biome、五項測試與完整 production build 均通過；不是只啟動附件完成檔。

第六篇的可選本機權限檢查頁 `tools/access-check-page.tsx` 已在第三篇範例的暫存副本中，依說明放至 `src/app/access-check/page.tsx`。型別、Biome 與完整 build 通過，建置結果包含 `/access-check`。這只確認程式可編譯；未執行 A、B 或匿名狀態的 Supabase 請求。

本次完整 build 通過，取代原 Windows 環境的 EPERM 建置限制。這只適用於本附件的教學範例，不代表另一個專案的建置結果。

未驗證：新的 Vercel 部署、GitHub Actions 雲端執行、Supabase OAuth、JWT、Storage HTTP、Signed URL、真實跨帳號權限。這些必須依文章在專用教學專案操作；Build 和五項 diff 測試不能取代它們。

分享、Server 重算與持久化 Cleanup Queue 尚未加入教學範例。第六篇的相關內容為設計與驗收清單。
