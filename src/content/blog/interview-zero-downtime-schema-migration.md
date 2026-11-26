---
title: "[Guide] 全端面試題：線上服務怎麼安全地改資料庫欄位？"
description: "用 expand–migrate–contract 拆解零停機 schema migration，說清楚舊新版本共存、backfill、rollback 與驗證。"
pubDate: 2026-11-26
category: "Dev Tools & Quality"
tags: [interview, Database, Deployment, PostgreSQL]
draft: false
references:
  - title: "AWS Well-Architected: Ensure backwards compatibility for data store and schema changes"
    url: "https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ads.5-ensure-backwards-compatibility-for-data-store-and-schema-changes.html"
  - title: "Martin Fowler: Parallel Change"
    url: "https://martinfowler.com/bliki/ParallelChange.html"
  - title: "PostgreSQL: ALTER TABLE"
    url: "https://www.postgresql.org/docs/current/sql-altertable.html"
  - title: "PostgreSQL: Explicit Locking"
    url: "https://www.postgresql.org/docs/current/explicit-locking.html"
---

## 題目：正在跑的服務要把 `users.display_name` 改成 `users.full_name`，還要把既有資料補齊。你怎麼部署，才能不讓舊版 API 壞掉？

這題常被答成「先跑 migration，再 deploy」。如果 deploy 是 rolling 或 canary，舊版與新版 app 會在一段時間內同時連到同一個 database。先把 `display_name` 刪掉，還在跑的舊版就會讀不到欄位；直接把大量資料 update 完才 deploy，又可能拉長 lock 和 release 時間。

**核心答案：** 不把 schema 的 breaking change 當成一次 release。先新增可共存的 schema，再讓 app 在過渡期同時處理舊新欄位，背景分批補資料並驗證，等所有讀寫端都切完且 rollback window 結束，最後才移除舊欄位。這個順序通常稱為 expand–migrate–contract 或 parallel change。它增加暫時複雜度，換來可以回退的部署。

這是經典題，但和現在常見的 rolling、canary、blue/green deployment 很有關係：AWS 的 DevOps guidance 明確要求 schema change 在舊新版本共存時維持 backwards compatibility，並建議先在部分 server 驗證共存，再完成 rollout 與 rollback 驗證。[^aws]

## 必要假設與練習評分

假設條件：

- PostgreSQL 的 `users` 有 1,000 萬筆資料，`display_name` 目前為 `NOT NULL`。
- API 有多個 instance，部署時舊新版本會重疊 10 分鐘；背景 job 也可能讀這張表。
- `full_name` 的值一開始等於原本 `display_name`，之後新功能只允許寫 `full_name`。
- 目標是避免 API 5xx 與資料遺失；不宣稱完全沒有 database lock，實際 lock 行為仍要依 PostgreSQL 版本、DDL 與 table 狀態測試。

以下分數是**練習參考**，不是任何公司的正式 rubric。

| 評分項目 | 分數 | 面試官在看什麼 |
| --- | ---: | --- |
| 版本共存與順序 | 30 | 知道 schema、舊 app、新 app 會同時存在，且先 expand 後 contract |
| 資料正確性 | 25 | dual-read / dual-write、backfill、差異檢查與明確的 source of truth |
| 部署與回退 | 20 | feature flag、canary、rollback 時仍可讀寫資料 |
| 資料庫風險 | 15 | lock、長 transaction、大量 update 和 index 建立的風險不被忽略 |
| 驗證與觀測 | 10 | 有 migration metrics、資料比對與新舊版本整合測試 |

## 很好等級的示範回答

> 我會把改名拆成四個可獨立部署的階段。第一版 migration 只新增可為 null 的 `full_name`，不刪 `display_name`。接著部署相容版 app：讀取時優先 `full_name`、缺值才 fallback `display_name`；寫入時在 flag 開啟期間同時寫兩欄，並把其中一欄定為 source of truth。然後用可重跑、分批的 job 補歷史資料，持續量測 null 數、兩欄不一致數與 API error rate。確認舊版 instance、worker、analytics query 都已退場後，才把讀取切成只用 `full_name`，保留一段 rollback window。最後一個獨立 release 才停止 dual-write、加上必要 constraint，再刪除舊欄位。若 canary 出錯，我會關 flag 或回退 app 到相容版；不會回退到一個只認得已刪欄位的版本。

這段回答先處理最重要的限制：database 通常由新舊程式共用，所以 rollback 是否可行，取決於新 schema 能不能讓舊 code 繼續工作。Parallel change 的三段式是 expand、migrate、contract；Fowler 以欄位改名為例，順序就是新增欄位、同時寫入、搬資料、切換讀取，最後才刪舊欄位。[^parallel-change]

## 四個等級的示範回答

| 等級 | 示範回答 | 差異 |
| --- | --- | --- |
| 很好 | 「先新增 nullable 新欄位，部署可讀兩欄、可 dual-write 的相容版；可重跑 job 分批 backfill 並監控差異。舊版完全退場、rollback window 結束後才收斂讀寫與刪舊欄位。」 | 把版本共存、資料遷移與回退設計成可驗證狀態。 |
| 好 | 「新增 `full_name`，把資料複製過去，新版改讀新欄位；確認後再刪 `display_name`。」 | 順序大致正確，但未交代部署重疊期間寫入怎麼同步、如何回退。 |
| 普通 | 「先 deploy 新版，失敗就 rollback；migration 放在 CI/CD 裡跑。」 | 有 deployment 概念，但 rollback 不能恢復已被移除的 schema 相容性。 |
| 差 | 「直接 `RENAME COLUMN`，因為資料庫會保留資料。」 | 資料可能還在，但舊版 SQL、ORM mapping、worker 與 dashboard 可能立即失敗。 |

## 資料流與四個階段

### 1. Expand：只加、不破壞

先新增欄位，讓舊 code 完全不需要改動：

```sql
ALTER TABLE users ADD COLUMN full_name text;
```

此時 `full_name` 先不要加 `NOT NULL`。新增欄位不代表 DDL 一定無風險；PostgreSQL 的 `ALTER TABLE` 取得的 lock 類型依子命令而異，官方文件要求參考各子命令描述，並指出未特別說明時是 `ACCESS EXCLUSIVE`。[^alter-table] 正式環境要在代表性資料量上量測 migration 時間與 lock wait，並設好 timeout，不要只因 staging 很快就當作 production 也安全。

### 2. Migrate：讓新舊程式都有路可走

相容版 API 的讀取規則可以是：`full_name` 有值就用它，否則回傳 `display_name`。寫入規則必須先選定 source of truth；本題在過渡期以 `full_name` 為新資料來源，但仍同步寫入 `display_name`，讓尚未退場的舊版讀到正確結果。

```ts title="src/users/map-user.ts"
type UserRow = {
  id: string;
  display_name: string;
  full_name: string | null;
};

export function toUserResponse(row: UserRow) {
  return {
    id: row.id,
    name: row.full_name ?? row.display_name,
  };
}

export async function renameUser(
  db: { query: (sql: string, values: string[]) => Promise<void> },
  id: string,
  fullName: string,
) {
  await db.query(
    `UPDATE users
     SET full_name = $2, display_name = $2
     WHERE id = $1`,
    [id, fullName],
  );
}
```

這段不是說 dual-write 永遠正確。它只適合兩欄能同步且 transition 短的案例。若新舊欄位轉換不是一對一，例如把 `address` 拆成多個欄位，必須先定義哪一端權威、衝突如何處理、失敗是否重試；否則雙寫只會製造兩份互相覆蓋的資料。

### 3. Backfill：可重跑、小批次、可觀察

不要用一筆長 transaction 把 1,000 萬列全部 update。可依主鍵範圍或小批次處理；job 每次只更新尚未填值的列，因此中斷後能安全重跑：

```sql
WITH batch AS (
  SELECT id
  FROM users
  WHERE full_name IS NULL
  ORDER BY id
  LIMIT 1000
  FOR UPDATE SKIP LOCKED
)
UPDATE users AS u
SET full_name = u.display_name
FROM batch
WHERE u.id = batch.id;
```

`SKIP LOCKED` 適合多個 backfill worker 分工，但 PostgreSQL 文件明確說它會提供不一致的 view，不能當一般讀取查詢；這裡只把它用在 queue 式的補資料工作。[^locking] 批次大小不是固定答案：依 row 寬度、寫入壓力、replica lag、lock wait 和 transaction 時間調整。

至少監控這三個數字：

```sql
SELECT
  count(*) FILTER (WHERE full_name IS NULL) AS pending_backfill,
  count(*) FILTER (WHERE full_name IS NOT NULL AND full_name <> display_name) AS mismatched,
  count(*) AS total
FROM users;
```

`mismatched` 不一定表示錯誤；若 migration 期間允許正常化新姓名，它可能是預期狀態。但必須有明確規則解釋，而不是看到兩欄不同就直接覆蓋。

### 4. Contract：最後才移除舊契約

完成前要確認的不只 web API：還包括 background worker、cron、BI、ETL、舊 mobile app、SQL view 與任何直接查 database 的 consumer。確認它們已不讀寫 `display_name` 後，先部署只讀 `full_name`、但 schema 還保留舊欄位的版本；等 rollback window 過去，再獨立執行：

```sql
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE users DROP COLUMN display_name;
```

`DROP COLUMN` 是不可由 app rollback 修復的 boundary。若發現問題，應暫停 contract、回到仍同時支援兩欄的 app 版本，而不是在高壓下猜資料要怎麼補。

## 常見失敗方式與取捨

| 作法 | 為什麼會出問題 | 何時可接受 |
| --- | --- | --- |
| 同一次 migration rename / drop 欄位 | rolling deploy 中的舊 instance 會立即失敗 | 有完整維護窗口、所有 consumer 能一起停機 |
| 先 backfill 完才 deploy 相容版 | 長 transaction 與大量寫入增加 lock、WAL、replica lag 風險 | 小表且已在 production-like 環境量測 |
| dual-write 但沒有 source of truth | retry 或不同版本寫入會讓兩欄漂移 | 幾乎不應接受；先補資料契約 |
| 只測 migration 成功 | 沒測到舊新版本同時讀寫與 rollback | 不足以支持線上 rollout |
| 用 feature flag 當萬用回退 | flag 不能救回已刪欄位或已不可逆的資料轉換 | flag 只負責 app 行為切換，schema 相容性仍要保留 |

AWS 也把部分 server 的共存驗證、完整 rollout 和 rollback deployment 視為 schema change 測試流程的一部分。[^aws] 因此「migration 指令跑過」只證明 DDL 可執行，不代表 deployment 安全。

## 怎麼驗證這個答案

1. 在 integration environment 同時啟動 old app 與 compatibility app；兩者都對同一筆 user 做讀寫，確認回應與資料符合規則。
2. 在 backfill 中途停止 worker 後重跑，確認 `pending_backfill` 會繼續下降、沒有覆寫新寫入資料。
3. canary 期間量測 5xx、database lock wait、慢 query、replica lag、backfill throughput 與 `mismatched`；先定義哪個值觸發停止 rollout。
4. 在 contract 前實際演練：關 feature flag 或部署相容版，確認新資料仍可被舊路徑讀取。
5. 對 `NOT NULL` 或刪欄位等不可逆步驟，保留 backup / restore 或資料修復計畫；要演練 restore 所需時間，而不是只確認備份存在。

面試時先講清楚「誰會和誰共存」，再排 schema、app、backfill 的順序，答案會比直接說 blue/green 或加 feature flag 更完整。零停機不是保證完全沒有風險；它是把會讓舊版立即壞掉的改動，拆成可以量測、停止與回退的階段。

[^aws]: [AWS Well-Architected：schema change 的 backwards compatibility](https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dl.ads.5-ensure-backwards-compatibility-for-data-store-and-schema-changes.html)
[^parallel-change]: [Martin Fowler：Parallel Change](https://martinfowler.com/bliki/ParallelChange.html)
[^alter-table]: [PostgreSQL：ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
[^locking]: [PostgreSQL：Explicit Locking / SKIP LOCKED](https://www.postgresql.org/docs/current/explicit-locking.html)
