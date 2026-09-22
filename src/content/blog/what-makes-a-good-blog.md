---
title: "一個好的技術 Blog 應該具備什麼？"
description: "整理個人技術 Blog 從內容、SEO、搜尋、效能到 AdSense 的核心需求，並附上可直接執行的 TODO checklist。"
pubDate: 2026-09-20
updatedDate: 2026-09-22
tags:
  - Blog
  - Astro
  - SEO
  - Checklist
draft: false
---

如果目標是做一個 **個人技術 Blog**，而且未來可能加入 **Google AdSense**，真正重要的不是功能越多越好，而是：

> **好讀、找得到、跑得快、容易維護。**

以下是目前 MR Blog 的目標規格與 TODO。

## 1. 內容要好讀

閱讀體驗永遠是第一優先。

需要注意：

- 字體大小與行高舒服
- 文章寬度不要過寬
- Code block 清楚易讀
- Mobile 版閱讀正常
- 不加入沒有必要的動畫
- 長文章要能快速理解結構

技術 Blog 的核心仍然是內容，不應該讓 UI 搶走文章本身的注意力。

## 2. 文章結構要一致

每篇文章應該有固定格式：

- Title
- Description
- Publish date
- Tags
- Optional cover image
- Table of Contents
- Prev / Next article

固定結構可以讓文章更容易閱讀，也能降低未來維護成本。

## 3. 要有搜尋與分類

文章少的時候看不出差異，但當文章數量增加後，這會變成必要功能。

應該至少提供：

- Tags
- Category
- Search
- Archive

目標不是做複雜推薦系統，而是讓讀者能快速找到舊文章。

## 4. SEO 基礎要完整

至少需要：

- `<title>`
- Meta description
- Canonical URL
- Open Graph
- Sitemap
- robots.txt
- Semantic HTML
- 每篇文章有固定 URL

Blog 如果沒有 SEO，內容寫得再好也很難被搜尋到。

## 5. 分享體驗要正常

文章貼到 LINE、Slack、Facebook 或 LinkedIn 時，應該可以正常顯示預覽。

需要：

- Open Graph title
- Open Graph description
- Open Graph image
- Canonical URL
- Copy link

OG image 不一定一開始就要自動產生，但應該列入後續規劃。

## 6. 效能要保持簡單

目前 Blog 的架構應該以 static 為主。

原則：

- Static HTML 優先
- 圖片壓縮
- 少 JavaScript
- 不因為使用 React 就全面 hydration
- 保持 Core Web Vitals 良好

Blog 不需要 Server、Database 或複雜 state management。

如果一個功能可以在 build time 解決，就不要搬到 runtime。

## 7. AdSense 前置準備

未來加入 Google AdSense 前，至少需要：

- Privacy Policy
- About
- Contact
- `ads.txt`
- 合理的廣告 placement
- 視追蹤方式決定是否需要 Cookie / Consent

廣告應該是附加層，不應該破壞主要閱讀體驗。

## 8. 維護成本要低

理想流程應該是：

```text
新增 Markdown
↓
git commit
↓
push main
↓
GitHub Actions
↓
GitHub Pages
```

新增文章不應該需要：

- Database
- CMS
- Admin panel
- Server
- 手動 deploy

Blog 的維護成本越低，才越容易長期持續寫。

---

# MR Blog MVP

目前希望維持這個範圍：

```text
Home
├─ Latest Posts
├─ Tags
└─ Search

Post
├─ Title
├─ Date
├─ Tags
├─ TOC
├─ Code Highlight
└─ Prev / Next

Other
├─ About
├─ RSS
├─ Sitemap
├─ OG Image
├─ robots.txt
└─ ads.txt
```

暫時不需要：

```text
留言系統
登入
會員
Database
CMS
推薦演算法
複雜後台
```

---

# TODO Checklist

## P0 — 文章閱讀體驗

- [x] Table of Contents
- [x] Code syntax highlighting
- [x] Prev / Next article
- [x] Mobile typography check
- [x] Long article spacing check

## P1 — 導航與內容探索

- [x] Tags page
- [x] Tag detail page
- [x] Search
- [x] Archive page
- [x] Category 設計是否真的需要：目前文章量以 Tags 即可，不新增重複分類

## P1 — SEO

- [x] Meta description
- [x] Canonical URL
- [x] robots.txt
- [x] Sitemap
- [x] Open Graph image
- [x] Article-specific Open Graph metadata
- [x] Structured data / JSON-LD

## P1 — Feed

- [x] RSS
- [x] RSS discovery link
- [x] RSS metadata check

## P2 — AdSense

- [x] About page
- [x] Privacy Policy
- [x] Contact page
- [x] `ads.txt` baseline：目前明確宣告尚無授權廣告商
- [x] Google AdSense integration hook 與 publisher ID 格式驗證
- [ ] 啟用 Google AdSense：等待帳號核准與 publisher ID
- [x] Ad placement design
- [x] Cookie / Consent requirement review：目前沒有非必要 Cookie，不需 consent banner

## P2 — 品牌與分享

- [ ] 自訂 domain
- [x] OG image template
- [x] Copy link
- [x] Social links
- [x] Favicon / logo final version

## P3 — 維護與品質

- [x] Markdown article template
- [x] Draft workflow
- [x] Broken link check
- [x] Lighthouse CI check
- [x] GitHub Actions build verification
- [x] Dependabot / dependency update strategy

---

# 優先順序

目前實作順序先定成：

```text
文章體驗
↓
SEO
↓
Tags / Search
↓
RSS
↓
AdSense
↓
其他功能
```

目前程式與內容層面的 MVP 已完成。尚待外部資料的項目只有：

1. 提供並設定自訂 domain。
2. Google AdSense 帳號通過核准後，設定 `PUBLIC_GOOGLE_ADSENSE_CLIENT`。
3. 使用同一個 publisher ID 更新 `public/ads.txt`，再啟用實際廣告版位。

在這三項完成前，網站不會載入 AdSense script，也不會使用非必要 Cookie。
