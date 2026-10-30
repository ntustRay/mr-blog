---
title: "[Guide] PPT 字體怎麼選？中文與英文的 4 款襯線、無襯線字體"
description: "Noto Sans TC、Noto Serif TC、Inter、Source Serif 4 的分類、搭配方式與官方下載來源，以及 PowerPoint 分享時的字體檢查。"
pubDate: 2026-10-30
category: Engineering
tags: []
draft: false
relatedPostIds:
  - goal-driven-presentation
references:
  - title: "Noto：字體與語系選擇"
    url: "https://notofonts.github.io/noto-docs/website/use/"
  - title: "Inter 官方網站"
    url: "https://rsms.me/inter/"
  - title: "Adobe：Source Serif 官方專案"
    url: "https://github.com/adobe-fonts/source-serif"
  - title: "Microsoft：Benefits of embedding custom fonts"
    url: "https://support.microsoft.com/en-gb/office/fonts/benefits-of-embedding-custom-fonts"
---

內容與閱讀順序確定後，字體可以先從四款挑：中文、英文，各一款襯線與無襯線。一份簡報先用一組中英搭配，再靠字級與字重區分層級，不必四款全部用上。

還沒整理簡報內容，可以先看[〈工程師做簡報：先決定聽眾要帶走什麼，再開始做 PPT〉](../goal-driven-presentation/)。這篇接著處理字體選擇與交付。

## 襯線與無襯線，差在哪裡？

**Serif（襯線）**的字形帶有襯線細節；中文通常對應明體、宋體一類，可觀察筆畫粗細與收筆的變化。**Sans-serif（無襯線）**省去這類襯線；中文通常對應黑體。

分類可以幫助選擇風格，但不直接保證可讀性。實際還要看字型設計、字重、字級、背景對比與投影環境。

## 四款字體與使用建議

下表的使用情境是排版建議；字體名稱與下載來源則依官方資料整理。

| 語言 | 分類 | 推薦字體與官方來源 | 建議用在哪裡 | 取捨 |
| --- | --- | --- | --- | --- |
| 中文 | Sans-serif／黑體 | [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC) | 技術內容、流程圖、圖表標籤 | 適合作為預設；用大小與字重拉開層級 |
| 中文 | Serif／明體 | [Noto Serif TC](https://fonts.google.com/noto/specimen/Noto+Serif+TC) | 引言、章節標題、少量敘事文字 | 有筆畫粗細變化；細字重投影時要檢查 |
| 英文 | Sans-serif | [Inter](https://rsms.me/inter/) | 英文標題、術語、數字與圖表標籤 | 適合與中文黑體搭配；不把它當成中文字體 |
| 英文 | Serif | [Source Serif 4](https://github.com/adobe-fonts/source-serif) | 英文引言、敘事頁、章節標題 | 可搭配中文明體；密集資訊仍要控制字數 |

Noto 官方將 TC 列為台灣繁體中文語系版本；選字體時要確認語系，別只看 Noto 的家族名稱。Inter 與 Source Serif 4 在這份清單中負責英文，中文仍需另行指定。

<figure>
  <a href="../../images/goal-driven-presentation/font-specimens.webp">
    <img src="../../images/goal-driven-presentation/font-specimens.webp" alt="四款字體實際排印：Noto Sans TC 與 Noto Serif TC 顯示「先讓聽眾看見重點」；Inter 與 Source Serif 4 顯示「Make the point clear.」。" width="1600" height="2040" loading="lazy" decoding="async" />
  </a>
  <figcaption>四款均使用實際字體檔，以 Regular 字重排印。點圖可比較襯線與筆畫差異。</figcaption>
</figure>

## 不確定時，先用黑體搭配 Sans-serif

技術簡報可以先用 **Noto Sans TC ＋ Inter**：中文與英文各自指定字體，標題用較重字重，內文用 Regular。先確認字級與對比，再調整風格。

如果是引言或敘事頁，可以嘗試 **Noto Serif TC ＋ Source Serif 4**。不必整份切換，也不要只為了增加變化，讓每頁都有不同字體。

在 PowerPoint 的投影片母片先設定標題與內文字體，再檢查中文、英文、數字與標點。四款是選擇範圍，並非同時使用的要求。

## 分享 PPT 前，確認字體會跟著走

從官方來源下載並安裝桌面字體檔，例如 TTF 或 OTF；網頁用的 CSS 連結不能代替桌面安裝。Noto 的 Google Fonts 版與 CJK 桌面版名稱可能不同，請以實際安裝的家族名稱設定。

交付可編輯的 PPTX 時，依 PowerPoint 版本與字體的嵌入權限，確認能否嵌入字體。Microsoft 提醒：只嵌入已使用的字元會限制後續編輯；需要讓對方改字時，應考慮嵌入全部字元，也要留意檔案大小。

只供閱讀時，可以另外匯出 PDF，並重新開啟檢查換行、標點、字重與缺字。正式上台前，再到實際播放的電腦確認一次。

字體是閱讀層級的一部分。內容該留什麼、每頁要說什麼，仍回到[前一篇的簡報規劃流程](../goal-driven-presentation/)。
