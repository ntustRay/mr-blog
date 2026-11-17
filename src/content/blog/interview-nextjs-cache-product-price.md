---
title: "[Guide] Next.js 面試題：資料已更新，為什麼頁面還是舊價格？"
description: "從商品價格更新出發，理解 updateTag、revalidateTag、router.refresh 與多層快取的一致性。"
pubDate: 2026-11-17
category: "Full-stack"
tags: [interview, Next.js, API, Performance]
draft: false
references:
  - title: "Arc：Next.js Interview Questions"
    url: "https://arc.dev/employer-blog/nextjs-interview-questions/"
  - title: "Mykola Nesterchuk：Next.js Interview Questions"
    url: "https://ncctcr.com/interview/nextjs"
  - title: "Next.js 16"
    url: "https://nextjs.org/blog/next-16"
  - title: "Next.js：use cache"
    url: "https://nextjs.org/docs/app/api-reference/directives/use-cache"
  - title: "Next.js：cacheTag"
    url: "https://nextjs.org/docs/app/api-reference/functions/cacheTag"
  - title: "Next.js：cacheLife"
    url: "https://nextjs.org/docs/app/api-reference/functions/cacheLife"
  - title: "Next.js：updateTag"
    url: "https://nextjs.org/docs/app/api-reference/functions/updateTag"
  - title: "Next.js：revalidateTag"
    url: "https://nextjs.org/docs/app/api-reference/functions/revalidateTag"
  - title: "Next.js：revalidatePath"
    url: "https://nextjs.org/docs/app/api-reference/functions/revalidatePath"
  - title: "Next.js：useRouter"
    url: "https://nextjs.org/docs/app/api-reference/functions/use-router"
  - title: "Next.js：Self-Hosting"
    url: "https://nextjs.org/docs/app/guides/self-hosting"
---

商品價格已寫入資料庫，畫面仍可能讀到 Next.js 的舊快取。若管理員透過 Server Action 更新價格，並且需要立刻看到自己的修改，可以在寫入成功後用 `updateTag` 讓對應資料過期。

## 這篇的重點

- Server Action 可以用 `updateTag`，讓下一次讀取等待新資料。
- `revalidateTag(tag, "max")` 允許先回傳舊資料；`router.refresh()` 不會讓伺服器快取失效。
- 列表、其他瀏覽器與多台伺服器可能各有快取，需要分別確認更新方式。

## 面試題目

購物網站使用 Next.js App Router。商品詳細頁的資料已快取，並加上商品專屬 tag。管理員將商品 `sku-1` 的價格從 `100` 改成 `200`，資料庫更新成功，但畫面重新整理後仍可能看到 `100`。

目前流程如下：

```ts
// Server Action：更新資料後標記快取
await savePriceToPrimary(id, priceCents);
revalidateTag(`product:${id}`, "max");

// Client：Action 完成後重新整理目前路由
router.refresh();
```

請回答：

1. 為什麼資料庫已有新價格，畫面還可能顯示舊價格？
2. 如果管理員必須在修改後看到自己的新價格，該怎麼改？
3. 如果價格由外部系統更新，透過 webhook 通知 Next.js，該選哪個 API？
4. 商品列表、其他使用者的瀏覽器和多台伺服器，是否會自動同步？

**練習假設：**

- 使用 Next.js 16 App Router，已開啟 Cache Components。
- 價格是公開商品價格，以整數最小貨幣單位儲存；不討論個人折扣或稅額。
- 題目前半段先假設只有一台 Next.js 伺服器、沒有額外 CDN，商品讀寫都使用同一個資料庫主節點。
- 管理員送出後，自己的畫面需要看到新價格。其他已開啟的瀏覽器不要求即時推播。
- 商品詳細資料已正確標記 `product:sku-1`；列表若有自己的快取，可能使用不同 tag。

**題型：經典題，以 Next.js 16 API 擴充。** 題目參考 Arc 於 2026 年 10 月發布的商品價格快取情境，以及 Mykola Nesterchuk 於 2026 年 11 月更新的 Next.js 面試題整理改寫；無法確認這個情境最早何時出現。`updateTag` 隨 Next.js 16 於 2025 年推出，並非 2026 年的新 API。 [題目來源：Arc](https://arc.dev/employer-blog/nextjs-interview-questions/)、[Mykola Nesterchuk](https://ncctcr.com/interview/nextjs)、[Next.js 16 發布說明](https://nextjs.org/blog/next-16)。

## 評分標準

以下分數僅供練習參考，不代表業界統一標準。

| 項目 | 分數 | 評分重點 |
| --- | ---: | --- |
| 找出舊資料來源 | 20 | 區分資料庫、伺服器快取與瀏覽器畫面 |
| 選擇更新 API | 25 | 理解 `updateTag` 與 `revalidateTag` 的行為及使用位置 |
| Tag 與頁面範圍 | 20 | 知道詳細頁和列表可能使用不同快取 |
| 外部更新與安全 | 15 | 能處理 webhook 情境與驗證 |
| 故障與部署邊界 | 10 | 注意寫入後失效失敗、多實例與其他快取層 |
| 驗證方式 | 10 | 能設計新舊價格、失敗與多瀏覽器測試 |

## 四個等級的回答

### 很好：85–100 分

> `revalidateTag(tag, "max")` 允許下一次請求先拿舊快取，同時在背景更新。`router.refresh()` 會重新向伺服器請求目前路由，但不會清除伺服器端快取。
>
> 管理員的 Server Action 應先確認權限並完成資料庫寫入，再呼叫 `updateTag`。下一次讀取這個 tag 時，Next.js 會等待新資料。商品列表如果有獨立快取，也要讓列表使用可失效的 tag。
>
> 外部 webhook 不能用 `updateTag`；若允許短暫舊資料，可用 `revalidateTag(tag, "max")`。若下一次讀取不能使用舊快取，可評估 `revalidateTag(tag, { expire: 0 })`。我還會確認 webhook 驗證、多台伺服器的失效傳播，以及其他瀏覽器何時重新取得資料。

**差異：** 回答涵蓋 API 行為、資料範圍、使用位置與實際部署邊界。

### 好：70–84 分

> Server Action 更新資料庫後，用 `updateTag` 取代 `revalidateTag(..., "max")`，讓下一次讀取等待新資料。外部 webhook 則使用 `revalidateTag`。

**差異：** 選擇方向正確，但還需要說明 webhook 對新鮮度的要求、列表 tag 和其他瀏覽器不會自動更新。

### 普通：50–69 分

> `router.refresh()` 會讓目前頁面重新向伺服器請求資料；我會先確認資料庫真的更新成功。

**差異：** 知道要檢查資料庫與重新請求，但沒有處理伺服器仍可能回傳舊快取的原因。

### 差：0–49 分

> 資料庫更新成功後，所有開啟中的頁面都會自動拿到新價格；如果沒有，就是使用者沒有重新整理。

**問題：** 資料庫寫入不會自動通知每個瀏覽器，也不保證 Next.js、CDN 或其他資料來源的快取已更新。

## 步驟 1：沿著資料流找舊價格

以 `sku-1` 為例：

1. 詳細頁第一次讀取商品，資料庫回傳價格 `100`。
2. Next.js 將結果快取，並附上 `product:sku-1`。
3. 管理員把資料庫中的價格改成 `200`。
4. `revalidateTag("product:sku-1", "max")` 將快取標記為過期資料。
5. 下一次請求可能先收到快取中的 `100`；Next.js 同時在背景取得新資料。
6. 背景更新成功後，後續請求才可能讀到 `200`。

這種做法稱為 **stale-while-revalidate**：先用舊資料回應，再重新取得資料。它可以縮短等待時間，但不符合「修改者下一次讀取必須看到新價格」的要求。

`router.refresh()` 會重新請求目前路由並重新 render Server Components，但不會讓伺服器端快取失效。因此，即使瀏覽器送出新請求，伺服器仍可能依照快取策略回傳 `100`。 [Next.js：useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)。

## 步驟 2：讓 Server Action 失效商品快取

先開啟 Cache Components：

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

以下範例把 tag 的建立集中在同一個函式，避免讀取與寫入使用不同字串：

```ts
// product-input.ts
export function productTag(id: string): string {
  if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
    throw new Error("Invalid product ID");
  }

  return `product:${id}`;
}

export function parsePriceCents(
  value: FormDataEntryValue | null,
): number {
  if (typeof value !== "string" || !/^\d{1,8}$/.test(value)) {
    throw new Error("Invalid price");
  }

  return Number(value);
}
```

本題假設商品 ID 已採用這個小寫格式。價格檢查只示範非負整數及長度限制；實際商品的價格上限仍由業務規則決定。

讀取時，為快取結果加上商品 tag：

```ts
// products.ts
import { cacheLife, cacheTag } from "next/cache";
import { productTag } from "./product-input";
import { readProductFromPrimary } from "./product-store";

export async function getProduct(id: string) {
  "use cache";

  cacheLife("hours");
  cacheTag(productTag(id));

  return readProductFromPrimary(id);
}
```

寫入時，先確認權限、驗證輸入並完成資料庫更新，再讓 tag 過期：

```ts
// actions.ts
"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "./auth";
import { parsePriceCents, productTag } from "./product-input";
import { savePriceToPrimary } from "./product-store";

export async function savePrice(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("productId");

  if (typeof id !== "string") {
    throw new Error("Invalid product ID");
  }

  const tag = productTag(id);
  const priceCents = parsePriceCents(formData.get("priceCents"));

  await savePriceToPrimary(id, priceCents);
  updateTag(tag);
}
```

`requireAdmin`、`readProductFromPrimary` 和 `savePriceToPrimary` 是應用程式需要提供的函式，這裡沒有實作登入或資料庫連線。範例假設：

- `requireAdmin()` 會在伺服器驗證身分與修改商品的權限。
- `savePriceToPrimary()` 在交易提交後才成功回傳；商品不存在或寫入失敗時會拋出錯誤。
- `readProductFromPrimary()` 從同一個主節點讀取，且沒有另一層舊資料快取。

`updateTag` 只能在 Server Action 中使用。它會讓指定 tag 的資料立即過期；下一次讀取需要等待新資料，而不是沿用該 tag 的舊快取。 [Next.js：updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag)。

### Cache key 與 tag 的差別

`getProduct("sku-1")` 和 `getProduct("sku-2")` 的參數不同，因此會對應不同快取項目。Next.js 建立 cache key 時，除了函式參數，也會納入 build ID、函式資訊等內容。

`product:sku-1` 則是附在快取項目上的 **tag**，讓程式之後能指定哪些項目需要失效。多個快取項目可以使用同一個 tag；讓 tag 過期時，受影響的是帶有該 tag 的項目。 [Next.js：use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache)。

範例使用 `cacheLife("hours")` 示範時間設定。官方預設的 `hours` profile 包含不同的 client stale、背景 revalidate 與 expire 時間，專案也能覆寫；它不等於「所有使用者最多只會看到一小時的舊資料」。價格可以過期多久，仍要由產品需求決定。 [Next.js：cacheLife](https://nextjs.org/docs/app/api-reference/functions/cacheLife)。

## 步驟 3：依更新來源選擇 API

| 方法 | 可使用的位置 | 行為 | 適合情境 |
| --- | --- | --- | --- |
| `updateTag(tag)` | Server Action | 讓 tag 立即過期；下一次讀取等待新資料 | 修改者需要讀到自己的更新 |
| `revalidateTag(tag, "max")` | Server Action、Route Handler | 標記為 stale；下一次讀取可先收到舊資料，並觸發背景更新 | 可接受短暫延遲的內容 |
| `revalidateTag(tag, { expire: 0 })` | Server Action、Route Handler | 讓資料立即過期；下一次讀取等待重新取得 | 外部 webhook 要求下一次讀取不用舊快取 |
| `revalidatePath(path)` | Server Action、Route Handler | 依指定 page 或 layout path 進行失效 | 以路徑為單位更新 |
| `router.refresh()` | Client Component | 重新請求目前路由，不使伺服器快取失效 | 伺服器資料已準備好，需要刷新目前畫面 |

表格描述的是 Next.js 對應快取的行為；它們不會直接修正另一層仍持有舊資料的資料庫副本、CDN 或 client state。`revalidateTag(tag)` 不帶第二個參數的舊寫法已被標示為 deprecated。 [Next.js：revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)。

### 外部 webhook 怎麼選？

假設商品管理系統更新價格後，呼叫 Next.js 的 Route Handler：

- 如果商品介紹允許稍後更新，可以使用 `revalidateTag(tag, "max")`。
- 如果需求是「webhook 處理完成後，下一次讀取不能再用這筆舊快取」，可以使用 `revalidateTag(tag, { expire: 0 })`。

後者可能讓下一位使用者等待資料來源回應；如果資料來源慢或故障，等待與錯誤會直接影響請求。這是新鮮度與回應時間的取捨。

Webhook handler 需要驗證呼叫來源、檢查訊息內容，並依整合方式處理重送與重放。不要提供一個讓任何人傳入任意 tag 就能大量失效快取的公開端點。

如果價格要求每次讀取都以最新資料為準，應評估不快取價格、直接在請求時讀取權威資料來源；同時仍需處理瀏覽器畫面多久重新取得資料，以及結帳時的價格規則。

## 步驟 4：確認失效範圍

### 商品列表使用不同 tag

詳細頁使用 `product:sku-1`，不代表商品列表也使用相同 tag。假設列表的快取只有 `products-list`：

- `updateTag("product:sku-1")` 會處理詳細資料。
- 列表若也顯示價格，更新後還需要讓 `products-list` 失效。

可以在列表的 cached function 加上 `cacheTag("products-list")`，並在價格變動後呼叫 `updateTag("products-list")`。代價是修改任一商品時，使用這個 tag 的列表快取都可能需要重新取得；列表很多或流量很高時，要評估更細的分組。

`revalidatePath` 則以路徑為目標。更新某個 path，不保證其他使用相同資料的路徑也已更新；若其他頁面依賴同一組資料，仍要檢查其 tag 與快取方式。 [Next.js：revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)。

### 其他瀏覽器不會自動收到新價格

Server Action 可以讓執行修改的頁面取得更新後的資料，但它不會主動推播給所有已開啟頁面的使用者。其他瀏覽器可能還持有 Router Cache、React state 或其他 client cache。

若產品要求既有畫面即時更新，需要另外設計重新取得資料或推播，例如定期更新、Server-Sent Events 或 WebSocket。選擇哪一種，要先確認允許的延遲、連線成本與斷線恢復方式。

### 多台伺服器需要協調

本題程式先假設單台伺服器。自架多個 Next.js instance 時，預設記憶體快取不會自動變成所有 instance 共用。需要依部署環境確認：

- 快取儲存是否共用。
- tag 失效狀態如何傳給其他 instance。
- CDN 或 reverse proxy 是否另外快取了頁面。
- 重新讀取時是否可能命中延遲的資料庫副本。

Next.js 的自架文件也要求多實例環境處理 cache tag coordination；實際做法取決於使用的 cache handler 與託管平台。 [Next.js：Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting)。

## 步驟 5：處理寫入成功、快取失效失敗

資料庫交易與 Next.js 快取失效不是同一個原子操作。例如：

1. 價格 `200` 已提交到資料庫。
2. 程序在完成快取失效前中斷。
3. 舊快取仍可能被讀取。

這時不能假設「畫面收到錯誤，資料庫就一定沒有修改」。若系統需要可靠恢復，可以考慮在更新商品的同一個資料庫交易中，寫入一筆待處理事件；背景工作再呼叫受保護的 Next.js Route Handler，使用 `revalidateTag(tag, { expire: 0 })` 讓快取失效，失敗時重試並記錄狀態。這種做法通常稱為 **transactional outbox**。

它能降低更新通知遺失的風險，但仍需要設計重試、監控、多實例傳播和資料來源新鮮度。若管理員可能同時修改價格，重試整筆價格更新前也要考慮版本檢查，避免覆蓋較新的修改。

## 驗證

| 情境 | 預期結果 |
| --- | --- |
| 詳細頁先快取 `100`，再由 Server Action 改成 `200` | Action 完成後，重新讀取該商品取得 `200` |
| 僅修改資料來源，沒有觸發失效 | 舊快取仍可能回傳 `100` |
| 使用 `revalidateTag(tag, "max")` | 下一次讀取允許先回傳舊資料；背景更新成功後可取得新資料 |
| 使用 `revalidateTag(tag, { expire: 0 })` | 下一次讀取等待重新取得資料 |
| 更新商品 A | 不應因 A 的 tag **直接**失效只帶商品 B tag 的快取 |
| 列表使用獨立 tag | 僅失效詳細頁 tag 時，列表仍可能顯示舊價格 |
| 未授權使用者送出 Action | 寫入前拒絕，價格不變 |
| 資料庫寫入失敗 | 不應執行後續 tag 失效 |
| 已開啟的另一個瀏覽器 | 沒有推播或重新取得資料時，可能繼續顯示舊畫面 |
| 寫入成功後、失效完成前中斷 | 若有可靠重試機制，確認事件仍會被處理；不能假設資料庫已回滾 |

本文的三個 TypeScript 檔案已使用 TypeScript 5.9.3 執行嚴格型別檢查，並在 Next.js 16.3.4 的本機 production build，以檔案模擬資料庫驗證 Server Action、`"max"` 與 `{ expire: 0 }` 的主要流程。登入使用測試 stub；未驗證真實資料庫、權限、CDN 或多實例部署。
