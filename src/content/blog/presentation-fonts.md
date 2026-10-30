---
title: "[Guide] PPT 字體怎麼選？內建與免費字體的中英文搭配"
description: "整理微軟正黑體、微軟雅黑體、新細明體、Arial、Calibri 等 18 款選項，區分 Windows、macOS、Office 與另外安裝的字體，附中英文搭配與交付檢查。"
pubDate: 2026-10-30
updatedDate: 2026-10-30
category: Engineering
tags: []
draft: false
relatedPostIds:
  - goal-driven-presentation
references:
  - title: "Microsoft：Windows 11 字體清單"
    url: "https://learn.microsoft.com/en-us/typography/fonts/windows_11_font_list"
  - title: "Microsoft：微軟雅黑體的語系與供應產品"
    url: "https://learn.microsoft.com/en-us/typography/font-list/microsoft-yahei"
  - title: "Apple：macOS 隨附與可下載字體"
    url: "https://support.apple.com/zh-tw/127491"
  - title: "Microsoft：Office 雲端字體"
    url: "https://support.microsoft.com/en-us/office/fonts/cloud-fonts-in-office"
  - title: "Adobe：思源黑體官方專案"
    url: "https://github.com/adobe-fonts/source-han-sans"
  - title: "Noto：字體與語系選擇"
    url: "https://notofonts.github.io/noto-docs/website/use/"
  - title: "Inter 官方網站"
    url: "https://rsms.me/inter/"
  - title: "Adobe：Source Serif 官方專案"
    url: "https://github.com/adobe-fonts/source-serif"
  - title: "Microsoft：Benefits of embedding custom fonts"
    url: "https://support.microsoft.com/en-gb/office/fonts/benefits-of-embedding-custom-fonts"
---

做 PPT 可以先從電腦已有的字體挑，再考慮另外安裝。Windows 的技術簡報，中文先用**微軟正黑體**，英文搭配 **Arial 或 Calibri**，就能開始整理閱讀層級。

先前的簡報筆記列過思源黑體、微軟雅黑體、微軟正黑體與 Arial。這些主要是無襯線選項；這裡補上襯線字體與不同平台的替代選擇。

還沒整理簡報內容，可以先看[〈工程師做簡報：先決定聽眾要帶走什麼，再開始做 PPT〉](../goal-driven-presentation/)。這篇接著處理字體選擇與交付。

## 先分清楚四種類型

| 文字 | Sans-serif／無襯線 | Serif／襯線 |
| --- | --- | --- |
| 中文 | 黑體，如微軟正黑體、思源黑體 | 明體、宋體，如新細明體、Noto Serif TC |
| 英文 | Arial、Calibri、Inter | Georgia、Times New Roman、Source Serif 4 |

襯線字形帶有收筆細節；中文明體、宋體也可觀察到筆畫粗細變化。無襯線字形則省去這類襯線。分類有助於選擇風格，可讀性仍要一起看字重、字級、背景對比與投影環境。

以下平台資訊依 [Windows 字體清單](https://learn.microsoft.com/en-us/typography/fonts/windows_11_font_list)、[Apple 字體清單](https://support.apple.com/zh-tw/127491)與 [Office 雲端字體說明](https://support.microsoft.com/en-us/office/fonts/cloud-fonts-in-office)整理；使用情境是排版建議。

## 中文無襯線：技術簡報先從這裡選

| 字體 | 取得方式 | 建議用途與注意事項 |
| --- | --- | --- |
| 微軟正黑體 Microsoft JhengHei | Windows 隨附 | 繁體中文技術內容、標題、圖表標籤的預設選擇 |
| 微軟雅黑體 Microsoft YaHei | Windows 隨附 | 適合簡體中文；台灣繁體內容優先選正黑體或 TC 字體 |
| 蘋方－繁 PingFang TC | macOS 隨附字體；依版本確認啟用狀態 | Mac 製作的繁體中文簡報；Windows 接收端需確認字體 |
| 思源黑體 Source Han Sans TC | [Adobe 官方下載](https://github.com/adobe-fonts/source-han-sans)後安裝 | 需要自行統一字體時可用；選台灣繁中字形版本 |
| Noto Sans TC | [Google Fonts 下載](https://fonts.google.com/noto/specimen/Noto+Sans+TC)後安裝 | 中文內文、流程圖與資料頁；同樣要確認接收端 |

Microsoft 將 [YaHei 定位為簡體中文字體](https://learn.microsoft.com/en-us/typography/font-list/microsoft-yahei)。它出現在選單中，不代表它是台灣繁體內容的首選。思源黑體與 Noto Sans TC 的發行名稱也不同，設定母片時以實際安裝名稱為準。

## 中文襯線：引言與敘事頁的選項

| 字體 | 取得方式 | 建議用途與注意事項 |
| --- | --- | --- |
| 新細明體 PMingLiU | Windows 繁中補充字體 | 引言、文件式內容；投影時避免字級過小 |
| 細明體 MingLiU | Windows 繁中補充字體 | 需要等寬中文字形的內容；一般比例排版可先比較新細明體 |
| 宋體－繁 Songti TC | macOS 隨附／字體簿下載，依版本確認 | Mac 上的引言、章節與敘事頁 |
| Noto Serif TC | [Google Fonts 下載](https://fonts.google.com/noto/specimen/Noto+Serif+TC)後安裝 | 需要自行統一中英文襯線風格時可用 |

Windows 把細明體、新細明體列在 **Chinese (Traditional) Supplemental Fonts**，不保證每台電腦都已安裝。Apple 的清單也同時包含已安裝與可下載項目；看不到字體時，先檢查語言套件或字體簿。

## 英文無襯線：標題、術語與數字

| 字體 | 取得方式 | 建議用途與注意事項 |
| --- | --- | --- |
| Arial | Windows／macOS 字體清單皆有 | 中英混排的起點；仍需確認實際播放電腦 |
| Calibri | Windows 隨附；Office 也常見 | 英文內文、數字與一般技術內容 |
| Segoe UI | Windows 隨附 | 介面截圖旁的說明、流程圖與英文標籤 |
| Aptos | Office 提供，包含雲端字體管道 | Office 工作流程可用；離線前先確認已下載 |
| Inter | [官方下載](https://rsms.me/inter/)後安裝 | 英文標題、圖表數字與介面相關內容 |

**Office 看得到，不等於作業系統預裝。** Microsoft 說明雲端字體首次取得需要連線；離線簡報與受管制電腦要先確認字體已可用。

## 英文襯線：引言、章節與文件式內容

| 字體 | 取得方式 | 建議用途與注意事項 |
| --- | --- | --- |
| Georgia | Windows／macOS 字體清單皆有 | 英文引言、敘事頁與章節標題 |
| Times New Roman | Windows／macOS 字體清單皆有 | 文件式、學術或正式內容；密集文字仍要刪減 |
| Cambria | Windows 隨附；Office 也常見 | 英文內文與研究型內容；跨平台時確認字體 |
| Source Serif 4 | [Adobe 官方下載](https://github.com/adobe-fonts/source-serif)後安裝 | 英文引言與敘事頁，可搭配 Noto Serif TC |

## 不想逐款挑，先用這四組

| 情境 | 中文＋英文 | 選擇理由 |
| --- | --- | --- |
| Windows 技術簡報 | **微軟正黑體＋Arial** | 優先使用 Windows 隨附選項；英文可改 Calibri |
| Mac 技術簡報 | PingFang TC＋Arial | 優先使用 Mac 可取得的字體 |
| 引言、文件式頁面 | 新細明體＋Georgia | 中英都採襯線；先確認繁中補充字體已安裝 |
| 可另外安裝字體 | Noto Sans TC＋Inter | 主動統一製作與播放端；襯線版可換 Noto Serif TC＋Source Serif 4 |

整份簡報先用一組中英搭配，靠字級與字重分出標題、內文與註解。這 18 款是候選範圍，不需要全部用上。

<figure>
  <a href="../../images/goal-driven-presentation/font-specimens.webp">
    <img src="../../images/goal-driven-presentation/font-specimens.webp" alt="另外安裝的四款字體示例：Noto Sans TC、Noto Serif TC、Inter、Source Serif 4，分別展示中文與英文的無襯線、襯線字形。" width="1600" height="2040" loading="lazy" decoding="async" />
  </a>
  <figcaption>這張圖示範四款可另外安裝的字體，以實際字體檔、Regular 字重排印；完整候選名單見上表。</figcaption>
</figure>

## 分享 PPT 前，確認字體會跟著走

在 PowerPoint 的投影片母片設定標題與內文字體，再檢查中文、英文、數字與標點。內建字體可以減少安裝工作，但 Windows、macOS 與不同 Office 版本的字體供應仍有差異。

需要安裝時，從官方來源取得桌面字體檔，例如 TTF 或 OTF；網頁用的 CSS 連結不能代替桌面安裝。不要假設有使用權，就能把系統字體檔直接打包給別人。

交付可編輯的 PPTX 時，依 PowerPoint 版本與字體的嵌入權限，確認能否嵌入。Microsoft 提醒：只嵌入已使用的字元會限制後續編輯；需要讓對方改字時，應考慮嵌入全部字元，也要留意檔案大小。

只供閱讀時，可以另外匯出 PDF，重新檢查換行、標點、字重與缺字。正式上台前，再到實際播放的電腦確認一次。

內容該留什麼、每頁要說什麼，仍回到[前一篇的簡報規劃流程](../goal-driven-presentation/)。
