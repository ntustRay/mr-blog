# 圖片比對系列：範例程式與圖片來源

對應 https://ntustray.github.io/mr-blog/posts/visual-regression-01-nextjs-bun-biome/ 起的六篇教學。

## 開啟完成檔

使用 Node.js 24.x 與 Bun 1.4.4。將 code/01-local、code/03-cloud 或 code/05-worker 中想看的階段複製到自己的新資料夾，再執行：

```sh
bun install --frozen-lockfile
bun run dev
```

03-cloud、05-worker 的公開首頁不需要登入；私人頁需依第三篇設定自己的專用 Supabase Project。不要把真實值寫入範例或 Git。

code/04-ci 是 Workflow 與 vercel.json 補丁，不是另一個完整 Next.js 應用程式。

三個應用階段均已通過 TypeScript、Biome、五項測試與完整 build。雲端登入、Storage、跨帳號權限與部署尚未由這些測試驗證；完整範圍見 code/VERIFICATION.md。

## 其他檔案

- patches/：逐篇加入的程式。
- tools/large-samples.html：效能觀察用色塊圖片產生器。
- tools/access-check-page.tsx：第六篇本機跨帳號檢查頁，驗收後移除，不部署。
- images/：官方畫面與六張教學程式實拍，皆為 WebP。
- sources/、SOURCES.md：圖片的固定版本來源、授權及實拍紀錄。

public/samples/*.png 是需保留像素與 MIME 的功能性輸入，不是文章插圖；私人 Bucket 範例只儲存 PNG。

範例為獨立教學程式，不包含私人 Framecheck 專案原始碼、帳號 Session、金鑰或正式資料。
