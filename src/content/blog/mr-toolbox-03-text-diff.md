---
title: "[Guide] 用文字差異比對找出需求改了哪一行"
description: "用兩版狀態說明練習辨認新增、刪除與原樣保留的行，再用空白選項複查。"
pubDate: 2026-11-26
category: "Dev Tools & Quality"
tags: ["文字比對", "Dev Tools"]
series: toolbox
seriesOrder: 3
references:
  - title: "文字差異比對"
    url: "https://mr-toolbox-two.vercel.app/tools/text-diff/"
---

這次要找出兩版需求裡改掉的狀態，同時確認負責人沒有被改動。

1. 打開[文字差異比對](https://mr-toolbox-two.vercel.app/tools/text-diff/)，把原始文字貼到左側。

```text
狀態：驗收中
負責人：開發者
```

2. 在「修改後文字」貼上新版，按「開始比對」。

```text
狀態：已部署
負責人：開發者
```

3. 結果會顯示刪除的「驗收中」和新增的「已部署」。確認「負責人：開發者」仍在兩版資料裡，並對回上方的輸入框。

![文字比對結果顯示舊狀態刪除、新狀態新增，負責人行仍保留。](../../assets/project-series/toolbox/text-diff-result.webp)

4. 在新版的第二行前方加兩個空格，再比較一次。若只想看內容變化，勾選「忽略行首與行尾空白」再按「開始比對」。比對有縮排語意的程式或 Markdown 時，把選項關掉複查。
