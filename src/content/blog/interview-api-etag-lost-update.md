---
title: "[Guide] API 面試題：兩人同時儲存，如何避免資料被覆寫？"
description: "用 ETag、If-Match 和 PostgreSQL 條件更新理解 lost update、樂觀併發控制與衝突處理。"
pubDate: 2026-11-19
category: "Full-stack"
tags: [interview, API, PostgreSQL, HTTP]
draft: false
references:
  - title: "System Design Academy：REST API interview questions"
    url: "https://www.systemdesign.academy/rest-api-interview-questions"
  - title: "RFC 9110：If-Match"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1"
  - title: "RFC 9110：評估條件請求"
    url: "https://www.rfc-editor.org/rfc/rfc9110.html#section-13.2"
  - title: "RFC 6585：428 Precondition Required"
    url: "https://www.rfc-editor.org/rfc/rfc6585.html#section-3"
  - title: "PostgreSQL 18：Transaction Isolation"
    url: "https://www.postgresql.org/docs/18/transaction-iso.html"
  - title: "PostgreSQL 18：UPDATE"
    url: "https://www.postgresql.org/docs/18/sql-update.html"
  - title: "MDN：Access-Control-Expose-Headers"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers"
---

兩個人用同一份舊資料儲存時，後寫入的人可能覆蓋先前的修改。API 可以在讀取時回傳 strong `ETag`，要求修改時帶上 `If-Match`；資料庫再以同一個 `UPDATE` 同時檢查版本並寫入。版本不符時回傳 `412`，讓使用者比較內容後決定如何處理。

## 這篇的重點

- `ETag` 讓 client 帶回讀取時的版本；**資料庫的條件更新**才是防止並行覆寫的最後關卡。
- 沒有送必要條件可回 `428`；本題對過期版本回 `412`，不自動用新版本重送舊內容。
- 這種做法保護單一資源的版本，不會自動保護跨多筆資料的不變條件，也不能判斷逾時的請求是否已成功。

## 面試題目

一個筆記網站提供 `GET /documents/{id}` 與 `PATCH /documents/{id}`。Alice 和 Bob 同時讀到筆記 `note-42` 的版本 7，兩人分別修改標題並按儲存。現在的 API 對兩人的請求都回傳成功，最後卻只留下其中一人的修改。

請設計一種避免靜默覆寫的方法，並回答：

1. HTTP request 和 response 要帶什麼？舊版本該如何回應？
2. 為什麼先 `SELECT` 版本，在 application 比對後再無條件 `UPDATE` 還是不夠？
3. 兩個請求同時到達時，資料庫應如何判斷誰能更新？
4. 使用者收到衝突或請求逾時後，client 應如何處理？

**練習假設：**

- 筆記已存在，ID 不會被刪除後重用；client 已通過身分驗證，也有權讀寫該筆記。
- 每篇筆記對應一筆資料列與一個固定的 JSON 表示法；同一版本的 JSON bytes 固定，不考慮語系、壓縮或其他 representation variants。
- 所有修改該筆記內容的路徑都會遞增同一個 `version`。本題以 PostgreSQL 18 的預設 `Read Committed` 為例。
- 此 API 的修改必須基於一個或多個具體版本；為了練習衝突保護，API 明定不接受只檢查存在與否的 `If-Match: *`。
- 一次修改只保護這篇筆記，不處理跨筆資料交易；不要求即時多人共同編輯。

**題型：經典題。** [System Design Academy 於 2026 年 11 月 11 日發布的 API 面試題整理](https://www.systemdesign.academy/rest-api-interview-questions)包含兩人編輯同一筆資料的題目；此處以筆記情境改寫。條件請求不是 2026 年的新概念，也不宣稱這是特定公司的題目。

## 評分標準

以下分數僅供練習參考，不代表業界統一的面試評分標準。

| 項目 | 分數 | 評分重點 |
| --- | ---: | --- |
| 找出問題 | 15 | 能以兩位使用者的資料流說明 lost update |
| HTTP 條件請求 | 25 | strong ETag、If-Match、412 與缺少條件時的策略 |
| 資料庫原子更新 | 25 | 條件與寫入在同一個 SQL，並檢查回傳結果 |
| 衝突與失敗處理 | 20 | 保留使用者草稿，區分版本衝突與逾時不確定結果 |
| 驗證與邊界 | 15 | 同步競爭測試、所有寫入路徑與單筆資源範圍 |

## 四個等級的回答

### 很好：85–100 分

> 兩人都讀到版本 7 時，API 的 GET 回傳對應的 strong `ETag`。儲存時 client 帶 `If-Match`；資料庫用 `UPDATE ... WHERE id = ... AND version = ... RETURNING ...` 原子地檢查與更新。第一人成功後版本變成 8，第二人的版本 7 條件不再成立，API 回 `412`。
>
> 缺少必要條件回 `428`。client 收到 `412` 要保留自己的草稿、取得最新內容並讓使用者比較；不應直接換新 ETag 重送。所有寫入路徑都必須更新版本，還要測試兩個連線同時寫入、刪除競爭與逾時後重試。

**差異：** 回答串起 HTTP、資料庫的原子性、使用者衝突處理與驗證。

### 好：70–84 分

> GET 帶 `ETag`，PATCH 帶 `If-Match`；資料庫用版本欄位條件更新，過期時回 `412`。

**差異：** 核心流程正確，還需要補上所有寫入路徑、使用者草稿及逾時的處理。

### 普通：50–69 分

> 每筆資料加一個版本，client 修改時檢查版本是否相同。

**差異：** 找到需要版本資訊，但沒有說明檢查與寫入必須一起完成；兩個請求可能同時通過應用程式端的檢查。

### 差：0–49 分

> 讓兩個請求都存成功，後到的資料覆蓋前面的即可；如果擔心衝突，就在 client 加上按鈕防連點。

**差異：** 防連點只處理單一畫面的重複操作，無法阻止不同使用者、裝置或服務同時寫入。

## 步驟 1：看懂資料如何被覆蓋

假設原始標題為「草稿」。

| 順序 | 動作 | 資料庫內容 |
| --- | --- | --- |
| 1 | Alice 和 Bob 都讀取版本 7 | `草稿`，版本 7 |
| 2 | Alice 把標題改成 `發布計畫` 並儲存 | `發布計畫`，版本 8 |
| 3 | Bob 依照版本 7 把標題改成 `週會筆記` 並無條件儲存 | `週會筆記`；Alice 的修改消失 |

這種後來的寫入蓋掉其他人已完成修改的情況稱為 **lost update**。資料庫沒有壞掉：它只是依照無條件更新的指令執行。要避免這個結果，需要讓寫入附帶「我修改的是哪一版」的條件。

## 步驟 2：用 HTTP 傳遞版本

以下 `ETag` 為範例，不要求 client 解讀其中的版本號。引號是 header 值的一部分。

```http
GET /documents/note-42 HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json
ETag: "note-42-r1-v7"

{"id":"note-42","title":"草稿","body":"內容"}
```

Alice 儲存時，把先前收到的 tag 原樣送回：

```http
PATCH /documents/note-42 HTTP/1.1
Content-Type: application/json
If-Match: "note-42-r1-v7"

{"title":"發布計畫"}

HTTP/1.1 204 No Content
ETag: "note-42-r1-v8"
```

Bob 仍使用版本 7 發出修改時，本題的 API 回 `412 Precondition Failed`，不執行他的更新。若他沒送 `If-Match`，本題的 API 回 `428 Precondition Required`，並告知需重新讀取後附上條件。

`ETag` 是辨識**選定的 representation** 的不透明標記；這裡用版本號產生它，是因為題目假設每個版本只對應一組固定 JSON bytes。所有影響該 representation 的變更都必須改變 tag；若 serializer、內容編碼或使用者權限導致 bytes 不同，也要設計對應的 representation validator，不能僅憑資料列版本就假設 strong tag 正確。

[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1)要求 `If-Match` 使用 strong comparison，因此 `W/"note-42-r1-v7"` 這種 weak ETag 不會與 strong tag 成立。標準允許 tag 清單：其中任何一個 strong tag 符合即可。也允許 `If-Match: *`，但它只檢查資源是否存在，不能證明 client 讀過目前版本。若產品要求避免覆寫，就要明確訂定此 endpoint 的政策，例如拒絕 `*` 並回 `400`，而非把它誤當成某個具體版本；這是本題的 API 限制，不是說 `*` 的 HTTP 語法無效。

不要自行用逗號簡單切割一般 ETag 清單：合法的 opaque tag 可能包含逗號。正式實作應使用符合 HTTP 語法的 parser，對 strong tags 逐一比較；不能將 weak tag 或來自其他資源的 tag 當成本資源版本。[RFC 9110：ETag 語法](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.3)

### 412、428 與 404 怎麼區分？

| 情況 | 本題做法 | 說明 |
| --- | --- | --- |
| 已提供具體 tag，但資源已更新 | `412 Precondition Failed` | 條件不成立；沒有寫入 |
| 需要條件，但未提供 `If-Match` | `428 Precondition Required` | 告知 client 先取得版本並附上條件 |
| 資源已刪除 | 依 endpoint 的正常處理回 `404` | 需要考慮授權與資訊揭露政策 |
| 本題不接受 `If-Match: *` | `400 Bad Request` | API 政策不接受只檢查存在的條件；告知需提供具體 ETag |

這張表描述本題契約，不代表所有 API 都必須用同一套錯誤格式。RFC 9110 要求先做一般 request 檢查，再評估條件；一般檢查已得出 404 等錯誤時，不應將它一律改寫成 412。[RFC 9110：何時評估條件](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.2.1)；[RFC 6585：428](https://www.rfc-editor.org/rfc/rfc6585.html#section-3)。

## 步驟 3：在資料庫一次檢查並更新

以下是簡化的 PostgreSQL schema。`version` 由伺服器維護；不要直接相信 request body 中的版本或將使用者輸入拼成 SQL。

```sql
CREATE TABLE documents (
  id text PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0)
);
```

本題先示範 client 只送一個有效 strong tag。伺服器驗證 tag 後，從可信任的 tag 映射取得 `expected_version`，把它與已驗證的標題和文件 ID 當作參數執行：

```sql
UPDATE documents
SET title = $1,
    version = version + 1
WHERE id = $2 AND version = $3
RETURNING id, title, body, version;
```

例如參數分別是 `發布計畫`、`note-42`、`7`：

1. 更新回傳一列：以回傳的新版本建立新 `ETag`，送出成功回應。
2. 回傳零列：代表沒有資料列同時符合 ID 與版本；可能是版本過期，也可能已刪除或受到其他存取條件影響。不能直接把所有零列都視為版本衝突。
3. 結合正常的授權與資源存在檢查，依 API 契約決定 `404`、`403` 或 `412`。如果再查一次判斷原因，資料可能在兩次查詢之間改變；有嚴格分類需求時，必須設計一致的 transaction／鎖定策略。

**不要在零列時退回無條件更新。** 如果支援多個 strong tags，應以完整、合法解析與資源驗證後的候選版本，讓 SQL 條件涵蓋任一允許的版本；不可因只檢查清單第一項而錯判。

為什麼不能先 `SELECT version` 再寫入？因為兩個請求可能都在版本 7 時通過檢查，接著各自執行無版本條件的 `UPDATE`。將 `version = $3` 放進更新的 `WHERE`，讓檢查與修改成為同一個資料庫操作。以 PostgreSQL 的 `Read Committed` 為例，若兩個更新競爭同一列，後者可能等待前者完成；前者提交後，PostgreSQL 會對新資料列重新評估後者的 `WHERE`。若版本已變成 8，版本 7 的條件就不成立。[PostgreSQL：Read Committed](https://www.postgresql.org/docs/18/transaction-iso.html#XACT-READ-COMMITTED)

較高 isolation level 下，競爭也可能導致 serialization error；應依使用的資料庫與 isolation level 處理交易失敗和重試，不能一律把所有例外當成 `412`。

## 步驟 4：讓 client 處理衝突

以下是 browser client 的儲存函式。它假設 GET 時已取得資料和 ETag，也假設成功的 PATCH 會回傳新 strong ETag。`fetch` 的網路錯誤會向外拋出，呼叫端應保留草稿並顯示結果尚未確認。

```ts title="save-document.ts"
export type SaveResult =
  | { kind: "saved"; etag: string }
  | { kind: "conflict" };

export async function saveDocument(
  id: string,
  title: string,
  etag: string,
): Promise<SaveResult> {
  const response = await fetch(`/documents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "If-Match": etag },
    body: JSON.stringify({ title }),
  });

  if (response.status === 412) return { kind: "conflict" };
  if (!response.ok) throw new Error(`儲存失敗：HTTP ${response.status}`);

  const nextTag = response.headers.get("ETag");
  if (!nextTag || nextTag.startsWith("W/")) {
    throw new Error("伺服器未回傳可供下次修改使用的 strong ETag");
  }
  return { kind: "saved", etag: nextTag };
}
```

函式只檢查 ETag 是否缺漏或帶有 `W/` 前綴，並未完整驗證 HTTP tag 語法；server 必須依契約產生有效 strong ETag。若成功回應缺少可用的 ETag，更新可能已經成功；client 應重新讀取並確認，而非當成寫入一定失敗。

收到 `conflict` 時，UI 應保留使用者輸入，再向 server 重新取得最新內容，並確認快取策略不會讓這次讀取繼續使用舊資料。可以同時顯示「原始版本、使用者草稿、目前版本」，讓使用者決定合併或放棄；只有確認新內容後，才用最新 ETag 再送一次。若是跨 origin API，瀏覽器讀取 `ETag` 需要伺服器透過 `Access-Control-Expose-Headers: ETag` 開放；`If-Match` 與 JSON request 也需要正確設定 CORS preflight。[MDN：Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers)

若 client 送出後逾時，寫入可能成功但回應遺失，也可能根本沒成功。直接拿舊 ETag 重送可能得到 `412`，卻無法單憑這個狀態判斷第一次是否成功。簡單的筆記編輯可重新讀取並讓使用者確認；若業務必須可靠辨識同一次操作的重送，需要另外設計 idempotency key、保存請求與結果，並處理 key 重用與過期。ETag 與 idempotency key 各自處理版本衝突和重送識別。

## 這個方案的邊界

- **所有寫入者都要遵守：** 後台工具、匯入程式與其他 API 若能不更新 version 就改資料，舊 tag 可能仍被接受。要將版本維護落在所有寫入路徑都遵守的位置。
- **高衝突成本：** 同一篇筆記經常被多人修改時，使用者可能頻繁遇到 412。可考慮拆小資源、設計可安全並行的業務操作，或評估協同編輯；依衝突頻率與合併成本決定。
- **跨資料列規則：** 每列各自有版本，不代表「至少一位值班人員」等跨列條件一定成立。這類規則需要適合的 constraint、共同鎖定點，或其他 transaction isolation 與重試設計。
- **標記與授權：** ETag 不是權限憑證。伺服器仍要驗證身分、逐筆檢查讀寫權限並驗證輸入。

## 驗證

| 情境 | 預期結果 |
| --- | --- |
| 兩個 client 都讀到版本 7，再並行儲存 | 恰有一個成功；另一個得到 412，資料與版本是成功者的結果 |
| 送出過期 tag | 不改資料，回 412 |
| 沒有 `If-Match` | 依本題契約回 428，並告知如何重送 |
| weak tag、tag 清單、`*` | weak tag 不能 strong match；清單任一 strong tag 可匹配；`*` 依本題政策拒絕 |
| 文件已刪除或無權限 | 依一般 request 檢查和授權政策回應，不洩漏不應公開的資訊 |
| 回應逾時 | 保留草稿；以重新讀取或可靠的操作識別方式釐清結果 |
| 其他程式修改筆記 | 新 representation 必須取得不同 tag，舊 tag 不再能覆寫 |
| 跨 origin client | preflight 允許請求，JavaScript 能讀取回應的 ETag |

此表是建議的整合測試；在正式 PostgreSQL 使用兩個連線與同步點，確保兩個 client 都先讀到同版本後再提交，才能驗證實際競爭行為。

本文的 SQL 已在 PGlite 0.5.14（內嵌 PostgreSQL 18.6）以測試資料驗證：首次條件更新成功、舊版本與不存在的 ID 回傳零列，且未改動其他欄位。TypeScript 範例已通過 TypeScript 5.9.3 strict 檢查，並以 mock `fetch` 驗證成功、412、缺少 ETag 與網路錯誤。尚未在獨立 PostgreSQL server 以兩個連線測試真正的同時寫入，也未執行 HTTP server、授權或 CORS 整合測試。
