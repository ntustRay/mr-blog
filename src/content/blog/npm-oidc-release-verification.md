---
title: '[Guide] npm 自動發版怎麼驗收？從 CLI tarball 查到 OIDC'
description: '用一個最小 CLI 驗證 npm tarball，再用 GitHub Actions、registry integrity 與 provenance 確認套件版本和發布來源。'
pubDate: 2026-11-28
category: 'Dev Tools & Quality'
tags: [npm, GitHub Actions, OIDC]
draft: false
relatedPostIds: [visual-regression-04-ci-cd]
references:
  - title: npm Trusted Publishing
    url: https://docs.npmjs.com/trusted-publishers/
  - title: npm pack
    url: https://docs.npmjs.com/cli/v11/commands/npm-pack/
  - title: npm publish
    url: https://docs.npmjs.com/cli/v11/commands/npm-publish/
  - title: npm 套件的 provenance
    url: https://docs.npmjs.com/viewing-package-provenance/
---

圖片比對工具的網站部署成功後，CLI 還有另一條交付路徑。假設你推了 `v1.2.3`，GitHub Actions 也亮綠燈，使用者能裝到哪一版？裝下來的 tarball 跟 CI 檢查的是不是同一份？這兩件事查完，還要核對發布工作有沒有真的走 OIDC。

[Framecheck 的 CI 課](../visual-regression-04-ci-cd/)已經示範怎麼用測試保護網站部署。這裡用獨立的虛構 CLI 練習套件發版，從空目錄測到能執行，再把同一套驗收方式接到自己的 npm 套件。

## 先安裝一次 CI 要送出的 tarball

假設 CLI 本身跑得動，卻忘記把執行時要讀的檔案加進 npm 的 `files`。在 repo 執行時檔案就在旁邊，使用者安裝之後才會遇到缺檔。要抓這種錯誤，先用 `npm pack` 製作 tarball，再從另一個目錄安裝。

用 Node.js 24 和 npm 11，在終端機貼上這段。範例會在暫存目錄內完成打包和安裝，結束時會清除練習檔案。

```bash
(
set -e
work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT
mkdir -p "$work_dir/cli" "$work_dir/consumer"
cd "$work_dir/cli"

cat > package.json <<'JSON'
{
  "name": "image-check-release-example",
  "version": "1.2.3",
  "bin": { "image-check": "./cli.cjs" },
  "files": ["cli.cjs", "message.txt"]
}
JSON

cat > cli.cjs <<'JS'
#!/usr/bin/env node
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
console.log(readFileSync(join(__dirname, 'message.txt'), 'utf8').trim())
JS
chmod +x cli.cjs
printf "%s\n" "image-check ready" > message.txt

npm pack --json > pack.json
node -p "require('./pack.json')[0].files.map(file => file.path).join(', ')"
node -p "require('./pack.json')[0].integrity"

cd "$work_dir/consumer"
npm init -y >/dev/null
npm install --offline --no-audit --no-fund ../cli/image-check-release-example-1.2.3.tgz
test "$(./node_modules/.bin/image-check)" = 'image-check ready'
./node_modules/.bin/image-check
)
```

正常的檔案清單有 `cli.cjs`、`message.txt` 和 `package.json`，最後一行印出 `image-check ready`。把 `files` 改成 `["cli.cjs"]` 再重跑整段，npm 仍會打包並安裝 CLI，但一執行就會因 `message.txt` 缺失報 `ENOENT`。若 CLI 會載入 native binary、template 或其他執行時檔案，smoke test 要真的走到讀取那些檔案的指令，才抓得到漏包。[npm pack 指令文件](https://docs.npmjs.com/cli/v11/commands/npm-pack/)

## 對齊發布 job 和 npm 的信任設定

在自己的發布 workflow 裡保留 `pack.json` 所記錄的 `integrity`，並把剛剛驗過的同一份 `.tgz` 傳給 `npm publish ./你的套件-1.2.3.tgz`。如果改用 `npm publish` 重新從目錄打包，中間的 build 或 lifecycle script 仍可能改動內容。這一步需要有發布權限且已存在的 npm 套件，上面的虛構 CLI 只用來練習打包與安裝。[npm publish 指令文件](https://docs.npmjs.com/cli/v11/commands/npm-publish/)

設定 Trusted Publisher 時，對照 npm 套件 Settings 與 GitHub Actions 的發布 job。

| 核對位置 | 要確認的值 |
| --- | --- |
| npm 的 Trusted Publisher | GitHub 帳號或組織、repo 名稱、含副檔名的 workflow 檔名，例如 `release.yml`。有填 Environment 時也要和 job 一致。若直接發版，允許的動作須包含 `npm publish`。 |
| GitHub Actions 的發布 job | 使用 GitHub-hosted runner，給這個 job `id-token: write`；若需要 checkout 也保留 `contents: read`。npm CLI 至少 11.5.1、Node.js 至少 22.14.0，建議在 run log 保留兩個版本。 |
| 套件的 `package.json` 和發布環境 | `repository.url` 指向同一個 GitHub repo，registry 為 `https://registry.npmjs.org/`。發布 step 移除舊的 npm 發布憑證，包含環境變數及 `.npmrc` 注入的 token。 |

GitHub 透過 `id-token: write` 讓 job 請求 OIDC 身分憑證。npm 核對這個 workflow 是否被該套件信任，再提供短效發布憑證。npm 儲存 Trusted Publisher 設定時不會先驗證填寫的值。如果舊 token 還在，npm CLI 也可能在 OIDC 驗證失敗後回退到 token。需要私有依賴時，可把唯讀 token 限在安裝 step 的環境，發布 step 仍用 OIDC。[npm Trusted Publishing 文件](https://docs.npmjs.com/trusted-publishers/)

## 對同一個版本查三份證據

以下把 `@your-scope/your-cli` 換成你的套件。用剛發布的**確切版本**查 metadata，避免 `latest` 指向另一個發版。

```bash
npm view '@your-scope/your-cli@1.2.3' version dist.integrity \
  --registry=https://registry.npmjs.org/
```

1. **先核對版本和 tarball。** Registry 應查得到 `1.2.3`，`dist.integrity` 應和 CI 留下的 `pack.json` 一致。版本對了但 digest 不同，就回去查發布指令拿的是哪個檔案。
2. **確認發布 job 確實執行。** 開對應 tag 的 Actions run，核對 checkout 的 SHA、發布 step 的結果，並確認該 step 沒有可回退的寫入憑證。整個 workflow 顯示 success 時，發布 job 仍可能因為條件式而跳過，所以要展開該 step 看。
3. **有 provenance 時比對來源。** GitHub Actions 從公開 repo 以 OIDC 發布公開 npm 套件，npm 預設會產生 provenance。打開 npm 上的確切版本，核對 provenance 指向的 Source Commit、Build File 和 Build Summary。若來源 repo 是私人，即使套件公開，npm 也不支援產生這份 provenance；可保留受控 workflow 的發布紀錄與 registry digest 作為內部驗收依據。[npm Provenance 文件](https://docs.npmjs.com/viewing-package-provenance/) · [自動產生 provenance 的條件](https://docs.npmjs.com/trusted-publishers/#automatic-provenance-generation)

範例在 Linux、Node.js 24.22.3、npm 11.19.1 驗證過離線安裝與執行，也測到漏包時的 `ENOENT`。這次驗證使用虛構套件，實際 OIDC 交換與 registry 發布需在你已配置 Trusted Publisher 的發版 job 驗收。
