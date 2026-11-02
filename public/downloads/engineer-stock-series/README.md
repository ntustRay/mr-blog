# 工程師選股網：8 篇自學系列

先從 articles/engineer-stock-01-local.md 開始，各篇已互相連結。images/ 的 SVG 是流程或結果示意，WebP 是正式站／GitHub 實拍。

## 練習程式

把 snippets/lesson-normalize.ts 複製到 engineer-stock-data 的根目錄，安裝 Bun 1.4.4 並依 lockfile 安裝後，執行 bun lesson-normalize.ts。它使用 Repo 保存的來源樣本，不會發布行情。

## 驗證依據

evidence/verification.json 記錄版本與範圍；另附 42 個資料 unit tests、21 個 Web unit tests、本機隔離 PostgreSQL 的 RLS 測試、型別／格式／Build 結果與 fixture HTTP 回應檢查。

原始網站 Repo 目前為 Private，需本人讀取權限。這個附件僅含教學片段、文章、圖片與去除工作目錄前綴的紀錄，不包含完整私有原始碼、環境變數檔、金鑰、Cookie 或正式會員資料。

Auth 章節提供設定與驗收步驟；正式 SMTP 收信、完整登入驗收及正式自刪帳號仍待完成，沒有將它們寫成已成功。本機 SQL 模擬不能代替正式 Auth 整合驗收。

文章拍攝時股票資料日期為 2026-10-30，網站顯示舊資料提示；不代表拍攝當日行情。圖片中的時間與測試耗時不是效能 benchmark。
