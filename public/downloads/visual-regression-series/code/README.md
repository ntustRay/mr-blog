# 教學範例

這是 `image-review` 教學版，與完整的 Framecheck 專案分開。

| 目錄 | 內容 |
| --- | --- |
| `01-local/` | 選圖、同尺寸驗證、差異圖、五項比對測試 |
| `03-cloud/` | 第一篇加上 GitHub 登入、RLS、私人圖片與歷史 |
| `04-ci/` | 要放回教學專案的 GitHub Actions 與 Vercel 設定 |
| `05-worker/` | 第三篇加上 Web Worker |

Node.js 使用 24.x，Bun 使用 1.4.4。

進入 `01-local/`、`03-cloud/` 或 `05-worker/`：

```sh
bun install --frozen-lockfile
bun run dev
```

開啟 `http://localhost:3000`。第三篇與第五篇的 `/private` 另需依文章設定 Supabase；首頁可離線使用本機比對。

附件已包含各階段的 `bun.lock`。從空專案逐步新增依賴時，使用一般 `bun install`／`bun add` 更新自己的 lockfile，再提交。

驗證範圍見 [VERIFICATION.md](VERIFICATION.md)。
