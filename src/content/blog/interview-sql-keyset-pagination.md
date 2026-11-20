---
title: "[Guide] SQL 面試題：資料一直新增，分頁為什麼會重複？"
description: "用 PostgreSQL 範例理解 OFFSET 與 keyset pagination、複合排序、索引及資料變動的限制。"
pubDate: 2026-11-20
category: "Data & Visualization"
tags: [interview, SQL, PostgreSQL, Performance]
draft: false
references:
  - title: "Ryz Labs：SQL Interview Questions"
    url: "https://www.ryzlabs.com/interview-questions/sql"
  - title: "PostgreSQL 18：LIMIT and OFFSET"
    url: "https://www.postgresql.org/docs/18/queries-limit.html"
  - title: "PostgreSQL 18：Row Constructor Comparison"
    url: "https://www.postgresql.org/docs/18/functions-comparisons.html#ROW-WISE-COMPARISON"
  - title: "PostgreSQL 18：Multicolumn Indexes"
    url: "https://www.postgresql.org/docs/18/indexes-multicolumn.html"
  - title: "PostgreSQL 18：Indexes and ORDER BY"
    url: "https://www.postgresql.org/docs/18/indexes-ordering.html"
  - title: "PostgreSQL 18：Transaction Isolation"
    url: "https://www.postgresql.org/docs/18/transaction-iso.html"
  - title: "PostgreSQL 18：Using EXPLAIN"
    url: "https://www.postgresql.org/docs/18/using-explain.html"
  - title: "Google AIP-158：Pagination"
    url: "https://google.aip.dev/158"
---

資料依時間由新到舊顯示時，如果使用者讀完第一頁後又有新資料插到最前面，`OFFSET` 指向的列數會跟著移動，下一頁可能重複出現已看過的資料。對只需要依序往下瀏覽的清單，可以用上一頁最後一列的 `(created_at, id)` 作為邊界，執行 keyset pagination；仍要另行處理排序欄位變動及跨頁一致性。

## 這篇的重點

- 用 `ORDER BY created_at DESC, id DESC` 建立可預測的唯一順序；下一頁以兩個欄位一起比較。
- 適合查詢條件與排序的複合索引能幫助查找，但 planner 是否採用、實際速度如何仍須看執行計畫與資料分布。
- Keyset pagination 不是固定快照：插入、刪除、篩選條件或排序欄位的改變仍會影響不同請求看到的資料。

## 面試題目

訂單管理頁面按建立時間由新到舊顯示，每頁 50 筆。目前使用：

```sql
SELECT id, created_at, total_cents
FROM orders
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT 50 OFFSET 250000;
```

使用者反映：翻到後面的頁面變慢，而且連續翻頁時偶爾看到重複訂單。請回答：

1. 為什麼深頁可能變慢？新增或刪除訂單時，為什麼頁面可能重複或漏資料？
2. 如何用 keyset pagination 寫出第一頁與下一頁的查詢？多筆訂單的 `created_at` 相同怎麼辦？
3. 索引、API cursor 和驗證方式應如何設計？
4. 如果需求是「完整匯出某個時間點的全部訂單」，這個做法還缺什麼？

**練習假設：**

- 資料庫為 PostgreSQL 18；每次請求都對目前已提交的資料查詢，請求之間不維持同一個 transaction。
- `id` 是全域唯一且不變的 `bigint`；`created_at` 是非 NULL、建立後不變的 `timestamptz`。兩者可能有多筆相同時間，但組合唯一。
- 清單只支援單一 tenant，且 `tenant_id` 從已驗證的使用者權限取得；各頁使用相同的篩選與排序。一般瀏覽允許資料持續新增或刪除。
- 主要操作是「載入下一頁」，暫不要求直接跳到指定頁碼；頁面上限 50 筆。

**題型：經典題。** [Ryz Labs 於 2026 年 10 月更新的 SQL 面試題整理](https://www.ryzlabs.com/interview-questions/sql)包含深頁 `OFFSET` 與 keyset pagination；這裡加入資料變動和跨頁一致性的討論。這是既有技術，不宣稱題目或 API 於 2026 年首次出現，也不歸屬特定出題公司。

## 評分標準

以下分數僅供練習參考，不代表業界統一的面試評分標準。

| 項目 | 分數 | 評分重點 |
| --- | ---: | --- |
| 定位問題 | 20 | 理解深 OFFSET 的成本與資料變動造成的位置偏移 |
| 正確查詢 | 25 | 唯一排序、複合 cursor 與正確比較方向 |
| 索引與效能 | 20 | 對應 filter／排序設計索引，並使用執行計畫驗證 |
| API 與邊界 | 20 | cursor 驗證、授權、精度及固定快照限制 |
| 驗證 | 15 | 測試同時間、插入、刪除、空頁與不同 tenant |

## 四個等級的回答

### 很好：85–100 分

> 大 `OFFSET` 需要先處理被跳過的資料；而新訂單插到前面，會改變後續頁面的數字位置。先用 `created_at DESC, id DESC` 建立唯一順序，再用上一頁最後一筆的時間和 ID 當下一頁邊界。
>
> 針對本題查詢，我會評估 `(tenant_id, created_at DESC, id DESC)` 的 B-tree 索引，用代表性的資料與 `EXPLAIN (ANALYZE, BUFFERS)` 檢查。cursor 要保留完整精度、綁定查詢條件，每頁重新驗證 tenant 權限。若要完整匯出固定時點的資料，需要另外設計一致的 snapshot，不能只依靠 cursor。

**差異：** 同時說清楚結果正確性、索引條件、資料變動與固定快照的界線。

### 好：70–84 分

> 改用 `(created_at, id)` 當 cursor，下一頁查比上一頁最後一筆更舊的資料，並加上符合查詢的複合索引。

**差異：** 核心 SQL 方向正確，但還需要說明跨頁資料變動、cursor 驗證與實際執行計畫。

### 普通：50–69 分

> 幫 `created_at` 加索引，並用 `LIMIT` 限制每頁筆數。

**差異：** 可能改善部分查詢，但仍保留深 `OFFSET` 的跳過成本，也沒有處理同時間的唯一排序和新增資料造成的位置變動。

### 差：0–49 分

> 移除 `ORDER BY` 可以加快查詢；或只用 `created_at` 當 cursor，時間相同的資料自然會在下一頁出現。

**差異：** 沒有唯一順序時結果不可預測；只比較時間可能跳過同時間、尚未回傳的訂單。

## 步驟 1：理解 OFFSET 的位置偏移

假設每頁 2 筆，依時間和 ID 遞減排列；括號中是時間，104 和 103 的時間相同：

| 時點 | 排序後的 ID | 查詢結果 |
| --- | --- | --- |
| 第一次讀取 | `105(10:05), 104(10:04), 103(10:04), 102(10:03)` | `LIMIT 2 OFFSET 0` 得到 `105, 104` |
| 新增 106 後 | `106(10:06), 105(10:05), 104(10:04), 103(10:04), 102(10:03)` | `LIMIT 2 OFFSET 2` 得到 `104, 103` |

`104` 被讀了兩次，因為新訂單插在前面，第二頁的「跳過 2 筆」指向了不同位置。相反地，若前面的訂單被刪除，固定 OFFSET 可能跳過一筆尚未看過的資料。

效能方面，PostgreSQL 文件指出，`OFFSET` 跳過的資料仍須由伺服器計算，因此很大的 OFFSET **可能**沒效率；是否慢、慢多少取決於查詢計畫、索引和資料量。[PostgreSQL：LIMIT and OFFSET](https://www.postgresql.org/docs/18/queries-limit.html)

## 步驟 2：用上一頁邊界查下一頁

以下 schema 簡化了訂單欄位。實際專案應以 migration 管理表與索引。

```sql
CREATE TABLE orders (
  id bigint PRIMARY KEY,
  tenant_id bigint NOT NULL,
  created_at timestamptz NOT NULL,
  total_cents bigint NOT NULL
);

CREATE INDEX orders_tenant_created_id_idx
ON orders (tenant_id, created_at DESC, id DESC);
```

第一頁沒有 cursor。`$1` 是已授權的 tenant ID；本題頁面大小為 50，`$2` 設為 51：

```sql
SELECT id, created_at, total_cents
FROM orders
WHERE tenant_id = $1
ORDER BY created_at DESC, id DESC
LIMIT $2;
```

應用程式最多顯示前 50 筆。若查到第 51 筆，代表**此次查詢**後面還有資料；捨棄第 51 筆，從實際回傳給 client 的第 50 筆產生 `next_cursor`。不要拿被捨棄的第 51 筆當邊界，否則它會被跳過。資料持續變動時，下一次請求仍可能變成空頁。

下一頁將 cursor 解碼並驗證後，帶入上一頁最後一筆的 `created_at` 與 `id`；`$4` 同樣設為 51：

```sql
SELECT id, created_at, total_cents
FROM orders
WHERE tenant_id = $1
  AND (created_at, id) < ($2::timestamptz, $3::bigint)
ORDER BY created_at DESC, id DESC
LIMIT $4;
```

`(created_at, id) < (cursor_time, cursor_id)` 由左到右比較：時間更早的列符合；時間相同時，ID 較小的列也符合。這正好對應兩個欄位都使用 `DESC` 的順序。[PostgreSQL：Row Constructor Comparison](https://www.postgresql.org/docs/18/functions-comparisons.html#ROW-WISE-COMPARISON)

以剛才的例子，第一頁最後一筆是 `(10:04, 104)`。新增 106 後，下一頁仍以該組值當邊界，得到 `103, 102`，不會因為 106 插入最前面而再次回傳 104。

### 為什麼不能只記時間？

如果下一頁只寫 `created_at < cursor_time`，當 104 是第一頁最後一筆時，時間同樣為 10:04 的 103 也不符合條件，於是被跳過。加上唯一且不變的 ID 作為 **tie-breaker**，才能在相同時間的資料中建立明確順序。

本題的比較式依賴兩個排序欄位都非 NULL，且排序方向相同。若允許 NULL，或排序是 `created_at DESC, id ASC`，需要依實際的 NULL 順序與每個欄位的方向重新設計條件，不能直接複製這個 tuple 比較式。

## 步驟 3：理解索引如何協助查詢

索引 `(tenant_id, created_at DESC, id DESC)` 把同一個 tenant 的索引項目依題目要求的順序組織。當 planner 選用適合的索引路徑時，資料庫可利用 tenant 條件與 cursor 邊界定位，再依順序讀取所需資料；它不必按 OFFSET 數出前面那麼多列。

索引不保證永遠被使用，也不保證所有深頁耗時相同。選擇會受資料分布、篩選條件、資料列可見性、I/O 和統計資訊等影響；索引本身也占空間並增加寫入維護成本。[PostgreSQL：Multicolumn Indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html)、[Indexes and ORDER BY](https://www.postgresql.org/docs/18/indexes-ordering.html)

用代表性的 tenant、資料量與頁面深度比較執行計畫：

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at, total_cents
FROM orders
WHERE tenant_id = 1
  AND (created_at, id) < ('2026-11-20T10:04:00.123456Z'::timestamptz, 104::bigint)
ORDER BY created_at DESC, id DESC
LIMIT 51;
```

觀察實際讀取／過濾的列數、索引使用情況、buffer 與執行時間；再以相同資料集、可比較的邊界和多次執行測試 OFFSET 版本。`EXPLAIN ANALYZE` **會執行查詢**，應在合適環境操作。這些觀察不能直接推成其他資料庫或工作負載的效能保證。[PostgreSQL：Using EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html)

## 步驟 4：設計 API cursor

Client 拿到的是用來繼續讀取的 token；伺服器內部至少要能還原最後一筆的 `created_at` 和 `id`，並確認 token 適用於這次的 tenant、篩選和排序。應限制 page size、驗證格式與範圍；不合法或不適用的 token 回明確錯誤，不要默默改成第一頁。

- **保留精度：** PostgreSQL 時間戳可有微秒精度，而 JavaScript `Date` 只有毫秒精度。如果 cursor 的 `10:04:00.123456` 被轉成 `10:04:00.123`，邊界可能改變，導致漏列或重複。資料庫 driver 和 token 的編碼必須保留完整時間值。
- **避免 bigint 精度損失：** PostgreSQL `bigint` 可能超過 JavaScript `number` 的安全整數範圍；可在 API 和 cursor 中以字串保留 ID，再經驗證作為 SQL 參數。
- **授權與防竄改：** 每個請求都重新驗證使用者與資料範圍；cursor 本身不是授權憑證。若 token 含有必須由伺服器信任的狀態，使用簽章或伺服器端儲存，並驗證版本、到期時間與查詢範圍。
- **不要把 Base64 當加密或簽章：** 它只是編碼。若 token 需要保密，應採用適當加密或使用不暴露內容的伺服器端 token。Google 的 [AIP-158](https://google.aip.dev/158) 也建議 token 對 client 不透明，並強調 token 不取代授權。

這裡的 cursor 是 client 保存、稍後傳回的分頁邊界；它不一定是資料庫中需要持續開啟連線的 server-side cursor。

## 步驟 5：判斷是否需要固定快照

Keyset 解決的是「從某個排序位置繼續」。在本題不可變的排序欄位下，前面新增一筆不會把已讀過的列推回下一頁；但它不保證整趟讀取對應到某個固定時間點：

- 新插入的列若排序位置在 cursor **之後**，可能出現在稍後頁面；若位置在 cursor **之前**，此次向後瀏覽不會看到它。
- 已讀或未讀的列可能被刪除；其他篩選欄位若改變，也可能讓列進入或離開結果。
- 若允許修改排序鍵，列可能跨過 cursor，造成漏讀或重讀；此題才假設排序鍵不變。

如果必須匯出某個時間點的完整資料，應依資料庫和部署方式設計一致快照。例如在單一 PostgreSQL transaction 中使用 `REPEATABLE READ`，讓該 transaction 的後續讀取使用一致的 snapshot；但長時間 transaction 及維持連線會有資源與維運成本，需限制時間並評估失敗恢復。另一種做法是建立固定的匯出資料集或背景匯出工作。單純記住一個最大 ID 或時間，不能自動處理晚提交或回填等情況。[PostgreSQL：Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html)

## 驗證

| 情境 | 預期結果 |
| --- | --- |
| 固定資料集，連續讀完所有頁 | 結果順序與單次完整查詢一致，每個 ID 恰好一次 |
| 頁面邊界有多筆相同時間 | 使用 ID tie-breaker，不跳過邊界附近資料 |
| 第一頁後於最前面新增訂單 | keyset 下一頁不因位置偏移而重複上一頁資料 |
| 刪除未讀訂單或在邊界後插入資料 | 後續結果反映各次查詢看到的資料，不誤稱為固定快照 |
| 結果剛好 50 筆、51 筆或 0 筆 | `next_cursor` 依多取一筆的結果正確產生或省略 |
| 時間有微秒、ID 超過 JS 安全整數 | cursor 往返後保持精確值與正確邊界 |
| token 格式錯誤、篩選變更或跨 tenant | 拒絕不適用的 token，且不因 token 放寬授權 |
| 比較深頁查詢 | 在代表性資料集記錄執行計畫、讀取列數、buffers 與耗時 |

本文的 SQL 已使用 PGlite 0.5.14（內嵌 PostgreSQL 18.6）搭配測試資料執行，驗證相同時間的排序、插入後的 OFFSET 重複、keyset 邊界、tenant 條件、空頁、額外一筆、微秒及超過 JavaScript 安全整數範圍的 ID；也執行了範例 `EXPLAIN`。這是資料正確性與語法驗證，尚未以正式 PostgreSQL server、實際 API 或大量資料做效能與並行測試。
