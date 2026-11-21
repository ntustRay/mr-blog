---
title: "[Guide] React 面試題：即時訂單為什麼一直用到舊篩選條件？"
description: "用 React 19.2 的 useEffectEvent 分清 Effect dependency、stale closure、state updater 與連線生命週期。"
pubDate: 2026-11-21
category: "Frontend"
tags: [interview, React, TypeScript, WebSocket]
draft: false
references:
  - title: "React 19.2：useEffectEvent"
    url: "https://react.dev/blog/2025/10/01/react-19-2"
  - title: "React：useEffectEvent API Reference"
    url: "https://react.dev/reference/react/useEffectEvent"
  - title: "React：Separating Events from Effects"
    url: "https://react.dev/learn/separating-events-from-effects"
  - title: "React Versions"
    url: "https://react.dev/versions"
  - title: "HireDeveloper：React Interview Questions 2026–27"
    url: "https://hiredeveloper.dev/insights/react-interview-questions-answers/"
---

即時訂單面板訂閱 WebSocket 後，使用者切換篩選條件，下一筆訊息卻仍用初始條件判斷；若直接把所有 state 放進 `useEffect` dependency，又會在每次篩選變更時重連。要先分清：**哪個值改變時外部連線必須重建，哪個值只是收到事件時要讀取最新畫面狀態。**

## 這篇的重點

- `tenantId` 決定訂閱哪個外部資源，應留在 `useEffect` dependency；它變更時必須 cleanup 再建立連線。
- `filter`、`theme` 只影響「收到訊息後怎麼處理」，可在 React 19.2 以上用 `useEffectEvent` 讀最新值，不必為此重連。
- `useEffectEvent` 不是拿來刪 dependency 的工具：只要某值改變後確實要重新同步外部系統，就仍要列入 dependency。

## 面試題目

訂單後台使用 React 19.2。切換 `tenantId` 時要訂閱不同租戶的 WebSocket；使用者可用 `filter` 篩選要顯示的訂單，`theme` 會影響新訂單通知顏色。

目前程式為了避免重連，刻意只依賴 `tenantId`：

```tsx title="LiveOrders.tsx"
type Order = {
  id: string;
  status: "pending" | "paid" | "cancelled";
};

function LiveOrders({ tenantId, theme }: { tenantId: string; theme: "light" | "dark" }) {
  const [filter, setFilter] = useState<Order["status"]>("pending");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const socket = connectOrders(tenantId);

    socket.on("order", (order: Order) => {
      if (order.status === filter) {
        setOrders([order, ...orders]);
        showToast(`New order: ${order.id}`, theme);
      }
    });

    return () => socket.close();
  }, [tenantId]);

  // 畫面與 setFilter 省略
}
```

請回答：

1. 為什麼這段程式會使用舊的 `filter`、`orders` 和 `theme`？
2. 為什麼把 `filter`、`orders`、`theme` 全加進 dependency 雖然較新鮮，卻可能是不對的修正？
3. 在 React 19.2 以上，如何修正且保留正確的連線生命週期？
4. `useEffectEvent`、functional state updater、`useRef`、`useCallback` 各自解決什麼問題？如何驗證沒有 reconnect 或 listener leak？

**練習假設：**

- `connectOrders(tenantId)` 只訂閱指定租戶；切換租戶必須關閉舊連線後才能建立新連線。
- 訊息資料已經過 server-side authorization；本題不討論 WebSocket token 更新、事件去重、排序或跨分頁快取。
- 篩選只影響客戶端是否把新訊息加入清單，不需要通知伺服器；theme 只影響 toast 外觀。
- 專案使用 React 19.2+ 與能辨識 Effect Event 的新版 `eslint-plugin-react-hooks`。React 官方在 2025-10-01 的 React 19.2 公告加入 `useEffectEvent`；目前版本頁顯示 React 19.3 已發布，因此新專案應以實際 lockfile 確認版本，不把 API 名稱當成相容性保證。

**題型：經典的 stale closure／Effect dependency 題，以 React 19.2 API 更新。** 近期公開題庫仍將 stale closure 與不必要 Effect 視為資深 React 題目；本文情境與評分內容自行編寫，沒有宣稱來自特定公司。

## 評分標準

以下分數僅供練習參考，不代表業界統一的面試評分標準。

| 項目 | 分數 | 評分重點 |
| --- | ---: | --- |
| 找出 stale closure | 20 | 說明 callback 保留建立它的那次 render snapshot，不是 WebSocket「快取錯誤」 |
| dependency 判斷 | 25 | 分出會改變連線生命週期的值與只影響事件處理的值 |
| 正確修正 | 25 | `useEffectEvent`、functional updater、cleanup 與 React 版本前提 |
| 替代方案與限制 | 15 | 不誤用 `useRef`、`useCallback` 或忽略 ESLint 警告 |
| 驗證與邊界 | 15 | 測試重連次數、最新值、unmount cleanup 與 tenant 切換 |

## 四個等級的回答

### 很好：85–100 分

> 每次 render 的 `filter`、`orders`、`theme` 都是該次 render 的值。第一個 Effect 建立 socket callback 後，socket 持有的是那次 callback；之後畫面重 render 不會改寫它閉包裡的變數，所以會讀到初始值。
>
> `tenantId` 改變代表外部訂閱目標變了，必須留在 dependency，讓 cleanup 關閉舊 socket，再建立新 socket。`filter` 和 `theme` 不改變訂閱本身，只決定事件到達後的行為；把它們放進 dependency 會造成無意義的 reconnect。用 `useEffectEvent` 讓事件處理函式讀最新 `filter`、`theme`，並用 functional updater 讓 `setOrders` 以 React 排程中的最新前值計算。要測試切換 filter 或 theme 不會 reconnect、下一筆訊息採用新值、換 tenant 正好 close 舊連線並開一條新連線、unmount 後不再有 listener。

**差異：** 同時處理 closure、resource lifetime、state transition 與驗證；沒有把「少寫 dependency」誤當成原則。

### 好：70–84 分

> callback 捕捉到舊 state。`tenantId` 留在 dependency；用 `useEffectEvent` 包住 socket 的訊息處理，並以 `setOrders(previous => ...)` 更新陣列。切換篩選不需要重連，切換 tenant 才需要。

**差異：** 核心修正正確，但還少了 cleanup、lint／版本前提，或沒有說明如何測 reconnect 與 unmount。

### 普通：40–69 分

> 把 `filter`、`theme` 放進 dependency，或改用 `useRef` 存最新值。

**差異：** 這能避免部分舊值，但前者會把 UI 調整變成連線重建；後者必須在每次 render 手動同步 `.current`，容易漏掉，而且沒有說清楚何時該真的重連。

### 差：0–39 分

> 在 dependency array 留空、關掉 `exhaustive-deps`，或用 `useCallback(fn, [])` 固定 callback。

**差異：** `useCallback(fn, [])` 只固定函式 identity，也固定第一次 render 的 closure；關掉 lint 只把訊號藏起來，沒有改變資料流。

## 核心修正：把「連線」和「連線內事件」拆開

React 官方將 Effect Event 定義為可從 Effect 內呼叫、但每次會讀到最新 props/state 的 callback。它適合外部系統觸發的事件，例如 socket 已連線、收到訊息或 timer tick；它不應被當作一般 click handler 傳給子元件。

```tsx title="LiveOrders.tsx"
import { useEffect, useEffectEvent, useState } from "react";

type Order = {
  id: string;
  status: "pending" | "paid" | "cancelled";
};

type Socket = {
  on(event: "order", listener: (order: Order) => void): void;
  close(): void;
};

declare function connectOrders(tenantId: string): Socket;
declare function showToast(message: string, theme: "light" | "dark"): void;

export function LiveOrders({
  tenantId,
  theme,
}: {
  tenantId: string;
  theme: "light" | "dark";
}) {
  const [filter, setFilter] = useState<Order["status"]>("pending");
  const [orders, setOrders] = useState<Order[]>([]);

  const onOrder = useEffectEvent((order: Order) => {
    if (order.status !== filter) return;

    setOrders((previous) => [order, ...previous].slice(0, 100));
    showToast(`New order: ${order.id}`, theme);
  });

  useEffect(() => {
    const socket = connectOrders(tenantId);
    socket.on("order", onOrder);

    return () => socket.close();
  }, [tenantId]);

  return (
    <section>
      <select
        aria-label="order status"
        value={filter}
        onChange={(event) => setFilter(event.target.value as Order["status"])}
      >
        <option value="pending">pending</option>
        <option value="paid">paid</option>
        <option value="cancelled">cancelled</option>
      </select>
      <p>{orders.length} orders</p>
    </section>
  );
}
```

這段程式有兩個不同的正確性條件：

1. **同步條件：** `tenantId` 變了，Effect 必須 cleanup、重建 socket，因此在 dependency array。
2. **事件處理條件：** 訊息抵達時需要最新 `filter` 和 `theme`，但這兩個值變了不代表 socket 的訂閱目標變了，因此由 `onOrder` 讀取。

`setOrders((previous) => ...)` 解決的是另一件事：新 state 依賴舊 state 時，由 React 提供當下的 `previous`。即使 `useEffectEvent` 已解決最新 filter，直接寫 `setOrders([order, ...orders])` 仍會讀到 callback 建立時的 `orders`。

## 名詞與工具，不要混用

| 工具 | 正確用途 | 不能取代什麼 |
| --- | --- | --- |
| Effect dependency | 值變動時，外部系統需要重新同步 | 不能讓已註冊的舊 callback 自動讀到最新值 |
| `useEffectEvent` | Effect 擁有的 callback 讀最新值，且不因此重跑 Effect | 不能隱藏真正需要重連的 dependency；不能傳到子元件或從 click handler 呼叫 |
| functional state updater | 下一個 state 從前一個 state 計算 | 不決定 socket 該不該重連 |
| `useRef` | 保存不驅動畫面的 mutable 值，例如 socket instance | 不是省略 reactive dependency 的預設替代品；手動同步 `.current` 容易漏 |
| `useCallback` | 需要穩定函式 identity 的 props 或 Hook API | `useCallback(fn, [])` 不會讓 `fn` 取得最新 closure |

## 常見失敗方式

### 1. 為了安靜而關閉 lint

```tsx
useEffect(() => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [tenantId]);
```

這不能證明 dependency 正確。要先說出每個值的意義：值變動後是要重建外部連線，還是只要在既有連線事件中讀最新值？前者放 dependency，後者才考慮 Effect Event。

### 2. 每次篩選都重連

```tsx
useEffect(() => {
  // ...
}, [tenantId, filter, theme]);
```

如果篩選本來就要送到 server 以改變訂閱 query，`filter` 應該在 dependency；這是正確重連。題目的假設是 client-side filter，所以重連只會造成短暫漏訊、重複訂閱成本與較複雜的 race condition。

### 3. 把 Effect Event 當成通用 callback

Effect Event 只能從它所屬的 Effect 或另一個 Effect Event 呼叫。若是按鈕事件或 child prop，請用一般 function 或 `useCallback`，不要用它規避 dependency。

## 驗證方式

以下是可自動化的測試規格，不是本文已執行的實測結果。

| 情境 | 操作 | 預期結果 |
| --- | --- | --- |
| 最新篩選 | 建立 `pending` 訂閱後改選 `paid`，再推送 `paid` 訂單 | 清單加入該訂單；不重新呼叫 `connectOrders` |
| 最新 theme | 建立連線後切換 theme，再推送符合篩選的訂單 | toast 使用新 theme；不重連 |
| state 競爭 | 快速推送兩筆符合條件的訂單 | 兩筆都存在，不被舊 `orders` 覆蓋 |
| tenant 切換 | `tenantId` 由 A 改為 B | A 的 socket 被 close；B 只建立一次 |
| unmount | 建立連線後卸載 component，再推送訊息 | socket 已 close，component 不再更新 state |

測試時可把 `connectOrders` 換成可記錄 `connect`、`close`、listener 的 fake socket。這比只檢查畫面文字更能驗證外部資源的生命週期；在 React Strict Mode 的開發環境，也應確認 setup/cleanup 可以重複執行而不留下 listener。

## 這題的判斷邊界

`useEffectEvent` 解決的是 Effect callback 的最新值與不必要重跑，沒有處理網路訊息可能重複、亂序或遺失。若訂單狀態對正確性有要求，仍要由 server 事件 ID、版本號或 sequence number 定義去重與順序策略。面試時先指出這個邊界，比硬把它塞進 Hook 題目更能表達設計能力。
