# 共用部署畫面與驗收

先讀本章要部署的專案。從 `package.json`、lockfile、部署設定和程式讀取環境變數的位置，確認「誰讀這個值、在哪個環境讀、做哪件事才會用到」。GitHub Pages、桌面應用和 npm 套件依各自的發布流程寫。以下各段可單獨套用。

## Vercel：把一個 commit 變成可驗收的網址

1. 在待部署的資料夾執行專案自己的 build 指令。提交原始碼與 lockfile，記下 commit。打開 **Add New → Project**，在對應 Git 帳號下找 repo，按 **Import**。[官方匯入畫面，操作左欄 Import](../../../../public/downloads/visual-regression-series/images/official/vercel-import-repository.webp)。舊圖右側紅框指向 Clone Template。
2. 在部署設定選到含應用 `package.json` 的 **Root Directory**，核對 framework、建置指令與輸出目錄。發文時寫出這個專案的實際值。若需要外部服務，先完成下方對應的 Neon 或 Supabase 步驟。
3. 在 **Environment Variables** 新增或編輯一筆變數，填入程式讀取的鍵名與值，在編輯表單選擇本次部署會用到的環境並儲存。回到列表，用右上 **Filter by** 切換 Production 或 Preview，確認那個環境有這筆鍵名。[官方截圖顯示列表的篩選選單](../../../../public/downloads/visual-regression-series/images/official/vercel-environment-scope.webp)。切換這個選單只會改變清單顯示。圖上的整合服務鍵名屬於官方示例。已完成的 deployment 要重新部署才讀得到新值。
4. 按 **Deploy**，從 **Deployments** 找同一個 commit，打開 build log 及 deployment 網址。[官方專案總覽的 Visit 與 Build Logs](../../../../public/downloads/visual-regression-series/images/official/vercel-project-overview.webp)。驗收本章的路由和輸出，例如寫入一筆測試資料，再用同一個帳號重新整理讀回。首頁 HTTP 200 只能驗證首頁路由。只有 Preview 正常時，比對環境範圍與 Production 的最新部署。

[Vercel Git 部署](https://vercel.com/docs/git) · [環境變數如何作用於新部署](https://vercel.com/docs/environment-variables)

## Neon：從測試資料庫連到應用伺服器

1. 在 Neon 專案開 **Connect**，選測試 branch、database 與 role。依使用的 driver / migration 工具選 pooled 或 direct connection。圖只顯示介面位置，憑證使用自己的值。[官方連線視窗](../../../../public/images/series-guides/neon-connect.webp)
2. 把連線字串存入應用伺服器實際讀取的環境變數，部署環境也填相同鍵名。勿將值寫進文章、瀏覽器 bundle 或 screenshot。要讓讀者找到程式中建立連線的位置，寫出檔案路徑與變數名稱。
3. 先在該 branch 的 SQL Editor 執行 `SELECT current_database(), current_user;`，對照步驟 1 選取的 database 和 role。接著使用該 repo 的 migration 指令建立本章的表。由應用寫入一筆有辨識度的測試資料，在資料表查回同一筆。SQL Editor 能連線只驗到了控制台端。
4. 若 SQL Editor 有表、應用卻回報找不到 relation，先比對連線視窗的 branch、database、schema 和部署環境，再查 migration 是否在相同目標執行。

[Neon 連線文件](https://neon.com/docs/connect/connect-from-any-app) · [Neon 文件使用的原始截圖](https://github.com/neondatabase/website/blob/1824df5ac1d61eeaa3c653de7134a6645135c72a/public/docs/connect/connect_to_branch_modal.png)

## Supabase：建立資料表、設定 Auth 或 Storage

1. 建一個測試專案，記下 Project URL 與 publishable key。[官方建立專案畫面](../../../../public/downloads/visual-regression-series/images/official/supabase-create-project.webp) · [官方 API Keys 畫面](../../../../public/downloads/visual-regression-series/images/official/supabase-api-keys.webp)。將兩個值填入該專案 SDK 實際讀取的位置，若程式仍使用 anon key 的舊名稱，交代對應。Secret 與 service role key 僅存於伺服器端。
2. 依本章需要在 **SQL Editor → New query** 執行 repo 的 migration，或用該 repo 指定的 CLI 指令。用對應的 SELECT 查表與欄位。[官方 SQL Editor 分頁](../../../../public/downloads/visual-regression-series/images/official/supabase-sql-editor-tabs.webp)。若本章有檔案上傳，另外建立指定 bucket、限制 public access，套用本章的 Storage policies。[官方私人 bucket 畫面](../../../../public/downloads/visual-regression-series/images/official/supabase-private-bucket.webp)
3. 需要第三方登入時，在 **Authentication → Providers** 啟用實際使用的 provider。將 Supabase 提供的 callback URL 登記到 provider，再將應用登入完成後要前往的 URL 登記在 Supabase。這兩個畫面填入的 URL 通常不同。[官方 Providers 畫面](../../../../public/downloads/visual-regression-series/images/official/supabase-oauth-provider-list.webp) · [官方 Redirect URLs 畫面](../../../../public/downloads/visual-regression-series/images/official/supabase-redirect-urls.webp)
4. 用教學帳號登入，透過應用新增再讀回一筆資料。若資料限定本人，以另一個教學帳號對同一筆資料驗證隔離結果。若問題只發生在部署站，核對實際 scheme、host、path 和該次 deployment 的環境變數。

[Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) · [Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) · [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)

## 在文章引用畫面

- 從本目錄的圖片連結找到原始檔。Astro Markdown 文章優先引用已放在 `src/assets` 的相同畫面；若使用 `public` 資源，請確認部署在 `/mr-blog/` 與根路徑時都能載入。使用同一張 WebP 即可。
- 將圖放在對應步驟旁，圖說交代「這是哪個介面、哪個欄位、自己要填什麼、看到什麼才能往下」。來源若為舊版官方介面，要指出現行位置。畫面顯示的帳號、網域、範例資料屬於官方示例。
- CI 排錯只在有 GitHub Actions 的章節使用。按 workflow → commit → job → 失敗的 step，讀第一個錯誤。[官方 workflow runs 畫面](../../../../public/downloads/visual-regression-series/images/official/github-actions-runs.webp) · [官方 job steps 畫面](../../../../public/downloads/visual-regression-series/images/official/github-actions-steps.webp) · [官方失敗的斷言畫面](../../../../public/downloads/visual-regression-series/images/official/github-actions-failed-assertion.webp)。實際驗收請連到本專案的 run 或記錄可重跑的本機輸出。

[Vercel、Supabase 與 GitHub Actions 的圖片來源、授權及舊版畫面限制](../../../../public/downloads/visual-regression-series/SOURCES.md)
