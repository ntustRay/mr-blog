---
title: "[Guide] 全端面試題：高併發 POST API 的 Idempotency 與重試怎麼設計？"
description: "用 Idempotency-Key、資料庫唯一約束與 outbox，回答重送、同時請求與外部副作用的系統設計題。"
pubDate: 2026-11-25
tags:
  - interview
  - API
  - System Design
  - PostgreSQL
category: System Design
references:
  - title: "RFC 9110: HTTP Semantics, 9.2.2 Idempotent Methods"
    url: "https://datatracker.ietf.org/doc/html/rfc9110#section-9.2.2"
  - title: "draft-ietf-httpapi-idempotency-key-header-09"
    url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-09"
  - title: "PostgreSQL INSERT — ON CONFLICT"
    url: "https://www.postgresql.org/docs/current/sql-insert.html"
draft: false
---

## 題目：使用者按了兩次付款，你怎麼保證只建立一筆訂單？

這題不是在問「前端把按鈕 disable 就好了嗎」。使用者可能雙擊、瀏覽器可能在收到回應前斷線、mobile app 可能自動重試；而且兩個相同請求可以同時抵達 API。只靠 UI 擋不了後面三種情境。

**這篇的核心答案：** 把「同一次商業操作」交給 client 產生的 Idempotency-Key 識別；server 用資料庫唯一約束搶到唯一處理權，保存完成後的 canonical response。相同 key 加相同意圖就回同一份結果；相同 key 但 payload 不同就拒絕。跨到付款、寄信等外部系統時，資料庫 transaction 無法涵蓋對方，要加 outbox、provider 的 idempotency key 或 reconciliation。

這是經典面試題。近期值得重新看的原因是 IETF HTTPAPI Working Group 在 **2026-11-21** 更新了 Idempotency-Key draft -09；它仍是 Internet-Draft，不是已發布 RFC。草案明確區分已完成的 duplicate request 與尚在處理中的 concurrent request，也要求 key 不可拿去重用在不同 payload。[^ietf-draft]

## 必要假設與練習評分

假設有 POST /orders，登入使用者用它建立「一筆」訂單；訂單寫 PostgreSQL，建立成功後會觸發付款或通知。Client 每次新的下單意圖產生 UUID，失敗重試沿用原本 UUID：

~~~http
POST /orders
Idempotency-Key: "550e8400-e29b-41d4-a716-446655440000"
Content-Type: application/json
~~~

以下分數是**練習參考**，不是任何公司的正式 rubric。

| 評分項目 | 分數 | 面試官在看什麼 |
| --- | ---: | --- |
| 先定義操作範圍 | 20 | key 代表一筆下單意圖，不是任意 HTTP request |
| 併發正確性 | 30 | database unique constraint 或同等的原子仲裁，而非先查再寫 |
| 重送結果與錯誤語意 | 20 | completed、processing、payload 不一致各自有明確回應 |
| 外部副作用與恢復 | 20 | 知道 transaction 不能保證跨 payment/email 的 exactly-once |
| 驗證與 observability | 10 | 有 concurrent test、斷線測試與可追查欄位 |

## 先給一個很好等級的回答

> Client 為一筆下單意圖產生 UUID，重試時帶相同 Idempotency-Key。Server 把 (user_id, idempotency_key) 設成唯一鍵，並保存 request fingerprint、處理狀態與最終 response。第一個 request 在 transaction 中取得 key 後建立 order、寫入 outbox event、保存 response；transaction commit 後才回 201。重送時若 fingerprint 相同且已完成，直接回保存的 response；還在處理則回 409 或 202 加 Retry-After，讓 client 依契約重試；fingerprint 不同則回 409，避免同一把 key 被誤用。付款與寄信不放在同一個 database transaction 裡，worker 從 outbox 執行，並把同一操作 ID 傳給支援 idempotency 的 provider；其餘情況需用狀態查詢或 reconciliation 補償。最後會用同 key 的平行請求、commit 後 response 遺失、不同 payload 重用 key 三組測試驗證。

這段有幾個刻意的選擇：

1. **唯一鍵是正確性的底線。** 「先 SELECT 看有沒有、沒有再 INSERT」在兩個 request 同時進來時會 race。PostgreSQL 的 ON CONFLICT 能以 unique constraint/index 作為仲裁；官方文件也說明 ON CONFLICT DO UPDATE 在高併發下保證原子的 insert-or-update 結果。[^postgres]
2. **key 要綁定使用者或 tenant。** 同一把 UUID 若只全域儲存不一定錯，但把 scope 寫進唯一鍵與查詢條件，權限邊界比較清楚。
3. **response 也要存。** 不要只存「已處理」布林值。第一次已成功、但 response 在網路途中掉了時，重試需要拿到同一個 order id，而不是再做一次商業操作。
4. **fingerprint 防止 key 誤用。** 對正規化後的商業輸入做 hash，例如 userId + cartItems + shippingAddressId。不要把 raw body 連同不穩定欄位直接 hash，也不要把信用卡資料存進 idempotency table。

HTTP 的 PUT、DELETE 與 safe methods 具有標準定義的 idempotent 語意；但 POST 預設沒有。RFC 9110 因此建議 client 不要在不知道 server 語意的情況下自動重試 non-idempotent method。[^rfc9110] 這題的重點就是替特定的 POST /orders 補上明確契約，而不是看到 POST 就假定它安全。

## 資料表與資料流

~~~sql
CREATE TYPE idempotency_status AS ENUM ('processing', 'completed', 'failed');

CREATE TABLE idempotency_requests (
  user_id uuid NOT NULL,
  idempotency_key uuid NOT NULL,
  request_hash text NOT NULL,
  status idempotency_status NOT NULL DEFAULT 'processing',
  response_status integer,
  response_body jsonb,
  order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (user_id, idempotency_key)
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY,
  topic text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
~~~

資料流分兩段：

1. API transaction 先以 (user_id, key) 寫入 processing。插入成功的 request 才能建立 order、寫 outbox、把 idempotency row 改成 completed 並存 response。
2. Worker 在 transaction 外讀取 outbox，再呼叫 payment 或 mail provider。成功後標記 event；失敗可以重試。這讓「訂單已提交但 worker 尚未送出」是可追蹤的狀態，不會因 API process crash 而消失。

若 database 已 commit、server 還沒把 HTTP response 寫出去，client 看起來像失敗但第二次呼叫會讀到 completed。這就是保存 canonical response 的價值。

## TypeScript：把重送與衝突分開處理

以下是服務層的精簡示意，SQL driver API 用抽象名稱表示；重點是 transaction 邊界與每個分支的語意。

~~~ts
type CreateOrderInput = {
  items: Array<{ sku: string; quantity: number }>;
  shippingAddressId: string;
};

type StoredResponse = {
  status: number;
  body: { orderId: string; status: 'created' };
};

async function createOrder(
  db: Database,
  userId: string,
  key: string,
  input: CreateOrderInput,
): Promise<StoredResponse> {
  const requestHash = sha256(stableStringify(input));

  return db.transaction(async (tx) => {
    const claimed = await tx.oneOrNone<{ request_hash: string }>(
      'INSERT INTO idempotency_requests (user_id, idempotency_key, request_hash) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING request_hash',
      [userId, key, requestHash],
    );

    if (!claimed) {
      const previous = await tx.one<{
        request_hash: string;
        status: 'processing' | 'completed' | 'failed';
        response_status: number | null;
        response_body: StoredResponse['body'] | null;
      }>(
        'SELECT request_hash, status, response_status, response_body FROM idempotency_requests WHERE user_id = $1 AND idempotency_key = $2',
        [userId, key],
      );

      if (previous.request_hash !== requestHash) {
        throw new HttpError(409, 'Idempotency-Key is already used for another request');
      }
      if (previous.status === 'completed' && previous.response_body && previous.response_status) {
        return { status: previous.response_status, body: previous.response_body };
      }
      throw new HttpError(409, 'Request is still processing; retry later');
    }

    const order = await tx.one<{ id: string }>(
      'INSERT INTO orders (user_id, shipping_address_id) VALUES ($1, $2) RETURNING id',
      [userId, input.shippingAddressId],
    );
    const response = { status: 201, body: { orderId: order.id, status: 'created' as const } };

    await tx.none(
      'INSERT INTO outbox_events (id, topic, payload) VALUES (gen_random_uuid(), $1, jsonb_build_object(\'orderId\', $2))',
      ['order.created', order.id],
    );
    await tx.none(
      'UPDATE idempotency_requests SET status = \'completed\', order_id = $3, response_status = $4, response_body = $5, completed_at = now() WHERE user_id = $1 AND idempotency_key = $2',
      [userId, key, order.id, response.status, response.body],
    );

    return response;
  });
}
~~~

實作時還要補兩件事：

- processing 卡太久怎麼辦：不可直接無條件重跑。應記錄開始時間、設定 lease 或 watchdog，並依 order/outbox 的實際狀態修復。否則原 request 只是很慢時，第二個 worker 可能重複執行。
- retention 怎麼辦：key 不需要永久保存，但 API 文件要公布 TTL。IETF draft 也要求 resource 定義其 expiration policy。TTL 之後的重送不能再承諾 dedupe，付款等高風險操作的 TTL 通常不能只看快取成本決定。[^ietf-draft]

## 四個等級的示範回答

| 等級 | 示範回答 | 少了或多了什麼 |
| --- | --- | --- |
| 很好 | 「用 client 產生的 key 識別一筆下單意圖，DB unique key 原子 claim；保存 request hash 與 response。duplicate 回原 response，processing 與 payload mismatch 分開回應。order 與 outbox 同 transaction，外部 payment 用 provider key 或 reconciliation；用併發與斷線測試驗證。」 | 同時處理 race、恢復、跨系統限制與驗證。 |
| 好 | 「POST 帶 idempotency key，server 存 key。重送時如果 key 存在就回之前的 order；DB 對 key 做 unique constraint。」 | 已避開大部分 duplicate，但沒有交代不同 payload、processing 狀態與外部副作用。 |
| 普通 | 「前端按下後 disable 按鈕，後端先查訂單是否存在；有的話不要再建。」 | UI 不能防斷線重試；先查再寫有 race；「訂單是否存在」也未定義商業唯一性。 |
| 差 | 「POST 失敗就 retry 三次，或把 endpoint 改成 PUT。」 | 沒有定義 resource identity；把 HTTP verb 換掉不會自動讓付款或寄信只做一次。 |

## 常見失敗方式

### 1. Redis SETNX 就當成完成

Redis lock 可以降低同時進入的機率，但 lock TTL 到期、process crash、response 遺失後，仍需要知道前一次到底做到哪裡。若訂單的 source of truth 是 PostgreSQL，唯一約束與狀態紀錄應放在同一個 transaction；Redis 可以是輔助，不是唯一 correctness mechanism。

### 2. 只回 200，不保存第一次結果

同 key 的第二次 request 如果回「成功」，但沒有第一次的 orderId，client 仍無法把畫面收斂到正確狀態。保存 status code 和 response body，才能在 ambiguous failure 後回到一致結果。

### 3. 宣稱 exactly-once

單一 database transaction 內可以做到一筆 order 與一筆 outbox event 的原子提交；跨 payment provider、email 或 message broker 則沒有免費的全域 exactly-once。較準確的說法是：對可識別的下單意圖提供 at-most-once business effect，並對外部副作用設計可重試、可對帳的流程。

## 怎麼驗證答案真的成立

1. 用同一個 Idempotency-Key 同時送 20 個 request，預期只有一筆 order 與一筆 outbox event。
2. 模擬 transaction commit 後、HTTP response 前斷線；用同 key 重送，預期拿到原本的 201 和相同 orderId。
3. 同 key 改變商品或收件地址，預期得到 409，且沒有建立第二筆 order。
4. 讓 outbox worker 在呼叫 provider 後崩潰；重跑 worker，確認 provider 支援時收到相同 operation key，或以 provider 查詢／內部 reconciliation 防止重複扣款。
5. 監控至少包含 key、request hash、order id、狀態轉換時間與 retry 次數；log 不應寫入 payment token、地址全文等敏感資料。

面試時能先把「一次操作」的邊界、資料庫仲裁與外部副作用分開，答案會比直接背 Idempotency-Key 更完整。真正要改的不是 HTTP method 名稱，而是 server 是否能辨識同一個商業意圖、原子保存結果，並在故障後讓 client 和 downstream system 都有可恢復的下一步。

[^rfc9110]: [RFC 9110 §9.2.2](https://datatracker.ietf.org/doc/html/rfc9110#section-9.2.2)
[^ietf-draft]: [draft-ietf-httpapi-idempotency-key-header-09](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-09)
[^postgres]: [PostgreSQL current documentation: INSERT / ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html)
