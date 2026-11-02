---
title: '[Guide] 線上試妝 06：怎麼證明妝效有作用？測試與部署'
description: 用 Vitest、Playwright 與像素差驗證試妝結果，拆解模擬相機、PNG 匯出、GitHub Actions、模型資產準備及 Vite 部署路徑。
pubDate: 2026-11-02
category: Web Development
tags: [Playwright, GitHub Actions, Vite, Testing]
coverImage: /images/shade-room-series/06-mobile.webp
relatedPostIds: [shade-room-03-face-worker, shade-room-04-webgl-lipstick, shade-room-05-interaction-export]
draft: false
references:
  - title: 本文對照的 CI run（Private，需讀取權限）
    url: https://github.com/ntustRay/shade-room/actions/runs/41449353697
  - title: Playwright CI
    url: https://playwright.dev/docs/ci
  - title: Playwright webServer
    url: https://playwright.dev/docs/test-webserver
  - title: Vite 靜態部署
    url: https://vite.dev/guide/static-deploy.html
---

系列：[1 架構](../shade-room-01-architecture/) · [2 影像輸入](../shade-room-02-image-camera/) · [3 嘴唇定位](../shade-room-03-face-worker/) · [4 WebGL 妝效](../shade-room-04-webgl-lipstick/) · [5 操作與匯出](../shade-room-05-interaction-export/) · [6 測試與部署](../shade-room-06-testing-deploy/)

選色按鈕變成已選取，不能證明嘴唇真的換了顏色。這個專案另外讀取 Canvas 像素，檢查結果有變、背景未被誤改，以及零濃度能回到原圖。

## 這篇的重點

測試分成純函式、實際模型與瀏覽器行為，最後在 CI 從乾淨環境準備資產。本文對照的 Ubuntu CI 已通過 5 項單元測試與 11 項 Chromium E2E；這些結果沒有涵蓋所有人物、光線、裝置與真實相機。

<figure>
  <a href="../../images/shade-room-series/06-ci-evidence.svg"><img src="../../images/shade-room-series/06-ci-evidence.svg" alt="已核對的 CI 紀錄：commit 879fff3 在 Ubuntu runner 完成資產準備、5 項單元測試、production build 與 11 項 Chromium E2E。" loading="lazy" decoding="async" /></a>
  <figcaption>依 GitHub Actions run 41449353697 的實際 job 與 log 製作的驗證紀錄圖，非 GitHub 介面截圖。對照日期為 2026-11-02，原始 run 需 Repo 權限。</figcaption>
</figure>

## 1. 先把驗收條件寫成可觀察的結果

| 功能 | 要檢查什麼 | 適合的層級 |
| --- | --- | --- |
| Hex 顏色轉換 | 正確數值、錯誤格式 | Unit |
| 尺寸縮放、座標處理 | 比例、範圍與無效輸入 | Unit |
| 口紅換色 | Canvas 有像素變化 | 真實模型＋Browser |
| 零濃度 | 回到原圖 | Browser pixel assertion |
| 比較模式 | 左邊保留、右邊改色 | Browser pixel assertion |
| 沒有臉 | 清除上一份遮罩 | Browser |
| 收藏與妝容 | 重整後可套用，沒有保存照片 | Browser＋localStorage |
| 相機生命週期 | 串流能結束、權限錯誤可恢復 | 模擬裝置＋Browser |
| 匯出 | PNG 尺寸、完整妝效與分界移除 | 下載內容＋pixel assertion |

純函式測試可以定位計算錯誤。模型是否載入、Worker 是否啟動、WebGL 是否真正畫出結果，則要在瀏覽器裡接起來驗證。

## 2. 原圖與妝效要用相同的基準

`tests/try-on.spec.ts` 先切到原圖，將 WebGL Canvas 複製到隱藏的 2D Canvas 作基準。換色後再複製一次，讀取兩邊的 RGBA。

核心差異判定是：

```ts title="tests/try-on.spec.ts（像素差判定節錄）"
const difference =
  Math.abs((a[i] ?? 0) - (b[i] ?? 0)) +
  Math.abs((a[i + 1] ?? 0) - (b[i + 1] ?? 0)) +
  Math.abs((a[i + 2] ?? 0) - (b[i + 2] ?? 0));
if (difference > 3) changed++;
```

每四個陣列值代表一個像素，這裡只比較 RGB。`3` 是目前測試採用的數值門檻，不能當成通用的人眼色差標準。

此版本對固定範例還檢查：改變像素大於 250、比例低於 5%，且上方四分之一區域沒有變化。這能抓到「完全沒畫」或「整張染色」等錯誤，但沒有逐像素證明所有改色都精確落在真實嘴唇上。

## 3. 加上反向條件，才知道有沒有畫錯

只要求 `changed > 0`，畫錯整張圖也會通過。因此還要檢查以下狀態：

1. 濃度為 0，`changed` 應為 0。
2. 比較模式固定基準與視角，左側變化為 0、右側有變化。
3. 上傳無臉圖片，前一次的妝效不應殘留。
4. 下載比較模式結果時，兩側都有完整妝效。

跨 GPU 或瀏覽器可能有數值差異。若測試不穩，先核對輸入、尺寸、色彩處理與座標，不要直接把門檻放大到任何結果都過。

## 4. 模擬相機驗證的是流程

測試設定提供 Chromium 的 fake media flags，讓 CI 能在沒有實體鏡頭的環境取得測試串流。權限拒絕與串流結束也各有對應檢查。

模擬相機可以測 API 與資源生命週期，不能代表真實人物入鏡時的追蹤品質。實機還要另外測前後鏡頭、光線、旋轉、低階裝置與背景切換。

<figure>
  <a href="../../images/shade-room-series/06-mobile.webp"><img src="../../images/shade-room-series/06-mobile.webp" alt="Shade Room 在 390 CSS 像素 viewport 的實際瀏覽器畫面，包含試妝鏡與下方色票。" loading="lazy" decoding="async" /></a>
  <figcaption>390 × 844 CSS 像素 viewport 的全頁截圖，使用桌面 Chromium。這是響應式版面證據，沒有用來宣稱實體手機相機或行動 Safari 已驗證。</figcaption>
</figure>

## 5. CI 要從缺少模型的環境開始

模型與 WASM 沒有放進 Git 追蹤。乾淨 checkout 後，必須先準備資產，再測試與建置：

<figure>
  <a href="../../images/shade-room-series/06-ci-flow.svg"><img src="../../images/shade-room-series/06-ci-flow.svg" alt="CI 順序：安裝 lockfile 相依套件、準備模型與 WASM、單元測試、production build、安裝 Chromium、E2E 並保存報告。" loading="lazy" decoding="async" /></a>
  <figcaption>目前工作流程的執行順序。資產準備失敗，就不能把後續測試當成有效驗收。</figcaption>
</figure>

```yaml title=".github/workflows/ci.yml（執行步驟節錄）"
- run: bun install --frozen-lockfile
- run: bun run assets
- run: bun run test
- run: bun run build
- run: bunx playwright install --with-deps chromium
- run: bun run test:e2e
```

`scripts/prepare-assets.mjs` 做三件事：從 Google 官方位置下載 `.task` 模型、準備三張範例人像、從已安裝的 `@mediapipe/tasks-vision/wasm` 複製 loader 與 WASM。既有下載檔超過基本長度條件時會重用，目前沒有內容雜湊校驗。

檔案不進 Git 能減少 Repo 的大型二進位資產，但乾淨建置會依賴來源可用性。若要求可重現且能離線建置，下一步應加入來源版本、雜湊驗證與經授權的資產保存方式。

目前 E2E 的 `webServer.command` 是 `npm run dev`，測的是 Vite dev server。CI 的 production build 是另一道檢查；兩者通過，仍不等於 E2E 已全面跑在部署產物上。可再增加 `vite preview` 與實際部署 URL 的 smoke test。

## 6. 部署到子路徑時，模型也要找得到

Vite 的 `base` 會影響資產位置。GitHub Pages 的 repository site 通常放在 `/<repo>/`，不能在程式裡把模型位置固定成網站根目錄。

```ts title="vite.config.ts（節錄）"
base: process.env.VITE_BASE || '/',
worker: { format: 'es' },
```

目前 Pages workflow 在 build 時設定 `VITE_BASE: /${{ github.event.repository.name }}/`；引擎再以 `import.meta.env.BASE_URL` 建立模型與 WASM URL。完整部署步驟可對照 [Vite 文件](https://vite.dev/guide/static-deploy.html)。

這份 workflow 以 `workflow_dispatch` 手動觸發，不是每次 push 都會自動部署。Repo 目前為 Private，Pages 可用性還取決於帳號方案與設定；不能只因為 YAML 存在，就宣稱已經上線。

## 7. 發布後照這個順序檢查

1. 開啟正式網址，確認沒有模型、Worker、WASM 的 404。
2. 用三張範例逐一定位，換色、零濃度、比較與下載。
3. 在 HTTPS 開相機，結束後確認本頁的串流停止。
4. 換一個 viewport，確認沒有橫向溢出，操作可用鍵盤完成。
5. 記錄裝置、瀏覽器、來源圖片與測試版本，再討論延遲與品質。

本文核對的 CI 為 commit `879fff3`、run `41449353697`，Ubuntu runner 於 2026-11-02 完成。Log 記錄 5 項 unit tests、11 項 E2E 通過；E2E 約 2.6 分鐘是該次測試耗時，不能當作推論速度或網站載入時間。

## 8. 接下來補哪一種證據

先補「遮嘴、側臉、張嘴、低光」的測試照片，再補真實裝置追蹤與長時間資源使用。若想對外承諾效果或效能，還需要這些資料，以及推論無回應時的復原測試。

回到系列起點：[需求、責任與技術取捨](../shade-room-01-architecture/)。
