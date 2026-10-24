---
title: "[Guide] GEO 怎麼做？讓技術文章成為 AI 搜尋可查證的來源"
description: "從可引用的證據段落、靜態 HTML 與抓取存取，到固定問題的引用觀察，整理技術部落格可實作的 GEO 流程與成效判讀限制。"
pubDate: 2026-10-24
category: Web Development
tags:
  - SEO
  - GEO
  - Blog
draft: false
relatedPostIds:
  - aeo-answer-engine-optimization-guide
  - seo-vs-aeo-vs-geo
  - blog-seo-release-checklist-ai-review
references:
  - title: "GEO 研究作者專案 — Generative Engine Optimization 與 GEO-BENCH"
    url: "https://github.com/GEO-optim/GEO"
  - title: "Google — Robots.txt Parser and Matcher Library"
    url: "https://github.com/google/robotstxt"
  - title: "Jeremy Howard — The llms.txt file proposal（原始文件）"
    url: "https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd"
  - title: "MR Blog — WebP OG 圖片端點的來源程式"
    url: "https://github.com/ntustRay/mr-blog/blob/3bc18af4b516409c0d538d22805d4462c8d8f846/src/pages/og/%5Bid%5D.webp.ts"
---

GEO（Generative Engine Optimization）關心的是：使用者透過生成式搜尋取得答案時，網站內容有沒有成為可採用、可追溯的來源。對技術部落格來說，可落實的起點是把工程判斷寫清楚，讓讀者與檢索工具取得同一份證據，再觀察哪些問題真的帶來引用。

這篇處理「一篇文章如何成為可靠的來源頁」。搜尋排名、直接答案與生成式回答之間的關係，另見 [SEO、AEO、GEO 的差別](../seo-vs-aeo-vs-geo/)。

## 這篇的重點

先挑一個確實值得回答的工程問題，補齊結論、適用條件、驗證方法與原始來源；確認正式 HTML 可取得、網址一致，再用固定問題記錄引用。這能改善內容的可讀性與可查證性，但不能保證任何 AI 產品會引用它。`llms.txt` 可以另做小規模實驗，優先順序低於正文與存取問題。

## 先定義要讓哪個問題找到這篇文章

「讓 AI 認識這個網站」太大，無法驗收。把目標縮成讀者會實際提出的問題，例如：「分享圖網址回傳 200，怎麼確認拿到的是正確的 WebP？」接著確認文章是否提供了回應標頭、實際檔案與圖片網址的檢查方式，而不只出現分享圖、WebP、AI 等字詞。

[GEO 研究作者的專案](https://github.com/GEO-optim/GEO)將目標描述為提升網站在生成式引擎回答中的可見度，並提供 GEO-BENCH 作為評估資料。這個研究方向可以幫忙拆問題，但特定研究的結果不能直接當成今日某個商用產品的成效承諾；產品、查詢、檢索來源與評分方式都可能不同。

因此，這裡採用的驗收是工程層面的：問題有沒有被回答、證據能不能回查、頁面能不能取得。引用成效另外量測。

## 把工程判斷寫成可以單獨理解的段落

搜尋工具可能只取到文章的一部分。若結論必須依賴前面五段才能理解，擷取後就容易失去條件。寫作時可以檢查：這一段離開全文後，是否還知道它在回答什麼、何時適用、依據是什麼？

以 MR Blog 的[圖片端點](https://github.com/ntustRay/mr-blog/blob/3bc18af4b516409c0d538d22805d4462c8d8f846/src/pages/og/%5Bid%5D.webp.ts)為例，程式使用 sharp 編碼成 WebP，並回傳 `image/webp`。相較於「圖片網址能開就好了」，下面的說明保留了讀者能驗證的依據：

```text
問題：分享圖網址回傳 200，怎麼確認拿到的是正確的 WebP？

適用條件：文章以 og:image 指定分享圖，端點預期輸出 WebP。

判斷：200 只代表這次請求成功，還要核對 Content-Type、
實際影像格式與尺寸，以及文章 og:image 是否指向同一個檔案。

依據：這個專案的圖片端點呼叫 sharp 的 webp()，
並設定 Content-Type: image/webp。

驗證：取得正式 og:image 的網址，檢查回應標頭，
再以影像解析器讀取檔案格式與尺寸。
```

這是寫作範例，不是 AI 引用實驗。它的價值是讓人能判斷「這段建議是否適合自己的站台」，也減少截取後只剩一句無條件結論的風險。

有數字的段落需要再多一層資訊。效能測試應附版本、環境、資料量、量測方法與比較基準；外部 benchmark 應連回原始報告，不能改寫成作者自己的實測。沒有量測就說明目前依據是文件或程式碼檢查，不必為了看起來可信而補數字。

## 讓來源、作者與更新資訊接得起來

來源頁應讓讀者找得到作者、發布日期、實質更新日期，以及支撐關鍵主張的文件。引用連結最好靠近需要它的句子；文末再集中列出參考資料，方便回查。

`BlogPosting` 等結構化資料可以表達文章與作者、日期、網址的關係，但資料必須和頁面上看得到的內容一致。作者身分不能在 JSON-LD 裡寫得比 About 頁更完整，`dateModified` 也不能隨每次部署刷新，製造內容剛更新的印象。

這些是來源一致性的要求。它們無法單獨證明某個 AI 產品會信任、採用或引用這篇文章。原始資料、完整方法與明確限制，仍應放在讀者可讀的正文裡。

## 先排除正式網站的存取問題

內容寫得再完整，若正式頁面被登入、錯誤狀態碼或錯誤路徑擋住，就應先修存取。對靜態技術部落格，至少確認 HTTP 狀態、原始 HTML 的正文、canonical、站內連結與 Sitemap 使用一致的正式網址。

以下是發布後可執行的檢查指令，並非引用成效測試：

```bash
curl --fail --silent --show-error --location \
  https://ntustray.github.io/mr-blog/posts/geo-generative-engine-optimization-guide/
```

檢查回傳 HTML 是否包含文章標題與正文，不能只看瀏覽器稍後執行 JavaScript 的結果。接著開啟正式頁面的 canonical 與 Sitemap，確認都保留 `/mr-blog/`，也沒有把預覽網址寫進去。完整上線驗收可接著使用 [Blog SEO Checklist](../blog-seo-release-checklist-ai-review/)。

抓取權限也要看對位置。[Google 的 robots.txt parser 專案](https://github.com/google/robotstxt)說明了 Googlebot 使用的規則解析與比對；網站端還需要確認規則實際放在哪個 host、自己控制哪一層。GitHub Pages 專案站台的 `/mr-blog/robots.txt` 不能代替 host 根目錄的 `/robots.txt`。修改專案裡的檔案後，就宣稱所有 AI 爬蟲都能抓取，並沒有完成驗證。

不同服務的搜尋、使用者即時取頁與模型訓練，應依該服務的官方規則分別確認。不要把「允許某個爬蟲」當成通用的 GEO 開關，也不要用假冒 User-Agent 的一次成功請求，當成對方真實爬蟲已經來過的證據。

## llms.txt 值不值得做？先看維護成本

[`llms.txt` 的提案原始文件](https://github.com/AnswerDotAI/llms-txt/blob/main/nbs/index.qmd)將它描述為提供網站背景、使用指引與文件連結的 Markdown 檔案。提案允許放在網站根目錄或子路徑，用來涵蓋該路徑下的內容；這和 `robots.txt` 的用途與位置規則不同。

對文件很多、已有乾淨 Markdown 版本的開發者網站，可以把它當作額外的導覽入口實驗。若個人部落格目前連分類、相關閱讀與主要文章都難找，先補那些入口通常更容易驗收，也少一份需要同步更新的清單。

要做實驗，先限定幾篇重要文章，檢查連結與摘要是否過期，再觀察目標工具是否真的使用它。提供了檔案，只能證明多了一個入口；不能據此宣稱已被主要 AI 搜尋產品採用，或引用率已經提升。

## 用固定問題觀察引用，分開記錄結果

頁面可存取之後，才適合開始觀察成效。選少量與文章問題一致、沒有刻意提示品牌或網址的查詢，保留原句，在固定產品與模式下重複測試。若某次沒有啟用搜尋，應另外標記，不要和有檢索來源的回答混在一起。

| 記錄欄位 | 要回答的問題 |
| --- | --- |
| 日期、產品與可見版本／模式 | 這次觀察在哪種條件下發生？ |
| 完整問題與重複次數 | 有沒有換句話問到出現想要的結果？ |
| 回答是否提到網站或作者 | 是品牌提及，還是實際引用內容？ |
| 引用網址與被引用段落 | 是否連到正確文章，支持相鄰的主張？ |
| 回答中的誤解 | 版本、適用條件或數字有沒有被截掉？ |
| 可取得的導流資料 | 引用之後是否真的有人造訪？ |

品牌提及、可點擊引用與實際造訪是三種不同結果。即使某輪問題出現較多引用，也可能受到產品更新、問題改寫或其他來源變化影響；少量觀察不足以把差異歸因於一次 metadata 修改。

若一直沒有引用，先回到可驗證的問題：頁面是否能取得、內容是否回答查詢、證據是否完整、讀者是否能從其他文章找到它。若有引用卻經常漏掉限制，就把限制移到結論附近。這些修正本身能讓文章更可靠，再繼續觀察是否改善回答品質。

想進一步整理段落如何直接回答問題，可以接著看 [AEO 實作指南](../aeo-answer-engine-optimization-guide/)。
