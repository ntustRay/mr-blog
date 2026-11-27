# Framecheck 開發教學附件

從兩張樣本圖開始，在自己的 `image-review` 專案做出瀏覽器比對器，再接 Vercel、Supabase、GitHub Actions 和 Web Worker。[系列目錄與預覽](https://ntustray.github.io/mr-blog/series/visual-regression/)。

## 課程順序

1. [Framecheck 開發課：先算對一對截圖，再接上登入與私有儲存](https://ntustray.github.io/mr-blog/posts/visual-regression-project-intro/)
2. [寫第一個 Next.js 圖片比對器：從兩個 RGBA 陣列畫出 Diff](https://ntustray.github.io/mr-blog/posts/visual-regression-01-nextjs-bun-biome/)
3. [把第一個比對器部署到 Vercel：從 GitHub 匯入到線上驗收](https://ntustray.github.io/mr-blog/posts/visual-regression-02-vercel-deploy/)
4. [接上 Supabase：從 GitHub 登入，把兩張圖存進私人 Bucket](https://ntustray.github.io/mr-blog/posts/visual-regression-03-supabase-private-storage/)
5. [寫 GitHub Actions：讓錯的像素數擋住發布](https://ntustray.github.io/mr-blog/posts/visual-regression-04-ci-cd/)
6. [把 pixelmatch 搬進 Web Worker，保留可取消的比對](https://ntustray.github.io/mr-blog/posts/visual-regression-05-web-worker/)
7. [替比對器驗收：寫一像素測試，再用兩個帳號查同一份資料](https://ntustray.github.io/mr-blog/posts/visual-regression-06-correctness-and-access/)
8. [Framecheck 做完後，怎麼判讀一張 Diff 和一筆私人紀錄](https://ntustray.github.io/mr-blog/posts/visual-regression-project-summary/)

## 從本機執行第一個階段

1. 安裝 Node.js 24.x 和 Bun 1.4.4，將本 ZIP 解壓縮。
2. 把 `code/01-local/` 複製到自己的練習資料夾，在有 `package.json` 的那層執行以下指令。
3. 開啟終端機列出的 Local 網址，載入範例後開始比對。預期得到 **17,760 個差異像素**。

```sh
bun install --frozen-lockfile
bun test
bun run dev
```

## 各階段的檔案

| 解壓縮後的路徑 | 用途 |
| --- | --- |
| `code/01-local/` | 本機圖片比對器，內含兩張固定輸入。 |
| `code/03-cloud/` | GitHub 登入、RLS 和私人圖片。依 Supabase 課程填自己的專案設定。 |
| `patches/04-ci/` 或 `code/04-ci/` | 複製裡面的 workflow 和 Vercel 設定回既有專案。 |
| `code/05-worker/` | 已接上 Web Worker 的完整應用；可在本機就相同輸入比對結果。 |
| `patches/` | 想每次自己加一個功能時，逐堂取用變動的檔案。 |
| `tools/` | ZIP 內含產生大張測試圖的 HTML，以及只在本機使用的權限檢查頁。 |
| `images/`、`sources/`、`SOURCES.md` | 教學程式實拍、官方操作畫面與授權來源。 |
| `code/VERIFICATION.md` | 各階段已執行的型別、測試與 build 紀錄。雲端登入、私人圖片存取與部署網址依你的環境驗收。 |
