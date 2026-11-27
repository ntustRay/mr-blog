---
title: "[Guide] JavaScript 面試題：同步或非同步 callback，怎麼統一處理錯誤？"
description: "用 ECMAScript 2025 的 Promise.try() 拆解同步 throw、Promise rejection 與執行時序；附相容性策略和四級回答。"
pubDate: 2026-11-27
tags:
  - interview
  - JavaScript
  - Promise
  - Error Handling
category: Programming & Algorithms
references:
  - title: "ECMAScript 2025 Language Specification — Promise.try"
    url: "https://tc39.es/ecma262/2025/multipage/control-abstraction-objects.html#sec-promise.try"
  - title: "MDN — Promise.try()"
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/try"
  - title: "TC39 — Promise.try proposal"
    url: "https://github.com/tc39/proposal-promise-try"
draft: false
---

## 題目：有些 plugin callback 直接回傳值、有些回傳 Promise、有些會同步 throw。你要怎麼讓呼叫端只處理一種結果？

假設一個 dashboard 可讓團隊註冊資料轉換器。舊的轉換器是同步函式，新版可以回傳 Promise；壞掉的設定可能在函式一開始就 `throw`。呼叫端想統一用 `.catch()` 或 `await` 收斂錯誤，也不能因為包裝方式把原本同步執行的順序改掉。

**核心答案：** `Promise.resolve(callback())` 不夠，因為 `callback()` 會先執行；它同步 throw 時，例外已經跳出，還沒交給 `Promise.resolve()`。支援 ECMAScript 2025 的 runtime 可用 `Promise.try(callback)`：callback 仍在目前 call stack 執行，普通回傳值會轉成 fulfilled Promise，同步 throw 會轉成 rejected Promise，回傳 Promise 也會被正常採納。舊 runtime 則用 `try…catch` 加 `Promise.resolve()` 做同樣的語意。

這題是**經典 Promise error-handling 題的近期版本**，不是特定公司的公開考題紀錄。 `Promise.try()` 已列入 ECMAScript 2025；MDN 標示它是 Baseline 2025，但「latest browsers 可用」不等於你要支援的每個 browser、embedded WebView 或 Node.js 版本都已具備。[^ecma2025][^mdn]

## 必要假設與練習評分

假設 `runTransform` 接收不受呼叫端控制的 callback，callback 可能：

1. 立即回傳資料；
2. 回傳 `Promise`；
3. 在第一個 `await` 前同步 throw；
4. 回傳一個之後才 reject 的 Promise。

以下分數是**練習參考**，不是任何公司的正式 rubric。

| 評分項目 | 分數 | 面試官在看什麼 |
| --- | ---: | --- |
| 分清呼叫順序 | 25 | 知道 `callback()` 先於 `Promise.resolve()` 執行 |
| 錯誤語意 | 25 | 同步 throw 與非同步 rejection 都能進同一條 error path |
| 時序判斷 | 20 | 知道 `Promise.try` 與 `Promise.resolve().then(callback)` 不同 |
| 相容性與 API 邊界 | 15 | 不把 Baseline 當成自己的支援矩陣；有 fallback 或明確前提 |
| 驗證 | 15 | 會測四種 callback，不只測 happy path |

## 先給一個很好等級的回答

> 我會把 callback 的執行和結果正規化拆開看。不能寫 `Promise.resolve(callback())`，因為 callback 同步 throw 時，`Promise.resolve` 根本還沒被呼叫。若專案的 runtime matrix 確定有 `Promise.try`，我會用 `Promise.try(callback)`，它保留立即呼叫 callback 的時序，又把 return、throw 和 Promise 都收斂成 Promise。需要支援較舊 runtime 時，我會用 `try…catch` 先接住同步例外，再對回傳值做 `Promise.resolve`。不會用 `Promise.resolve().then(callback)` 當完全等價替代，因為它把 callback 延到 microtask，可能改變同一輪程式碼的可觀察順序。最後用同步回傳、同步 throw、非同步 resolve、非同步 reject 四組測試驗證，並把 callback 的同步／非同步契約寫在 plugin API 文件裡。

這個回答先處理了三個容易混在一起的問題：

1. **執行 callback 時會不會 throw？** 這是同步例外邊界。
2. **callback 的結果是不是 Promise？** 這是值的 Promise adoption。
3. **callback 在這一輪執行，還是排到 microtask？** 這是時序契約；不能因為最後都能 `await` 就忽略。

ECMAScript 2025 規格中，`Promise.try` 會建立 Promise capability、直接呼叫 callback，再用 resolve/reject 收斂 completion；不是只替 `Promise.resolve` 換一個名字。[^ecma2025]

## 為什麼 `Promise.resolve(callback())` 接不住同步錯誤？

函式呼叫的參數要先算完。所以下面這段若 `callback` throw，程式會直接跳出 `runWrong`；回傳 rejected Promise 的那行根本不會執行。

~~~js
function runWrong(callback) {
  return Promise.resolve(callback());
}

runWrong(() => {
  throw new Error('bad config');
}).catch(console.error); // catch 不會執行；錯誤已同步拋出
~~~

要讓同步 throw 也變成 rejection，必須把「呼叫 callback」本身包在 exception boundary 裡。

~~~js
function runWithFallback(callback) {
  try {
    return Promise.resolve(callback());
  } catch (error) {
    return Promise.reject(error);
  }
}
~~~

如果支援矩陣已確認包含 `Promise.try`，可直接寫成：

~~~js
function runTransform(callback) {
  return Promise.try(callback);
}
~~~

MDN 的說明也特別指出：`Promise.try(callback)` 與 `Promise.resolve().then(callback)` 的差異在於後者總是非同步呼叫 callback；前者會同步呼叫。[^mdn]

## 一個可直接放進 library 的相容性包裝

如果你在做 reusable package，不能只看本機 Chrome。先定義支援版本；只有在不支援 `Promise.try` 的 runtime 仍要執行時，才需要 fallback。以下範例不改變 callback 原本「先同步執行」的行為。

~~~ts
type MaybePromise<T> = T | PromiseLike<T>;

type PromiseTry = {
  try<T>(callback: () => MaybePromise<T>): Promise<T>;
};

function hasPromiseTry(value: PromiseConstructor): value is PromiseConstructor & PromiseTry {
  return typeof (value as Partial<PromiseTry>).try === 'function';
}

export function callAsPromise<T>(callback: () => MaybePromise<T>): Promise<T> {
  if (hasPromiseTry(Promise)) {
    return Promise.try(callback);
  }

  try {
    return Promise.resolve(callback());
  } catch (error) {
    return Promise.reject(error);
  }
}
~~~

這裡的 type guard 只是在補 TypeScript 的 lib 定義與實際 runtime 是否提供 API 的落差；它不是 feature support 的證明。若 package 已宣告最低 Node.js／browser version 都原生支援 `Promise.try`，可以拿掉 fallback，讓 API surface 更小。反過來說，若會跑在未知的 WebView 或客戶端 plugin host，保留 fallback 比「Basline 2025」更可靠。

## 時序：能 `await` 不代表語意相同

下面三種寫法都能取得一個 Promise，但 callback 執行時機不同。

| 寫法 | callback 何時執行 | 同步 throw 的結果 | 適合的條件 |
| --- | --- | --- | --- |
| `Promise.try(callback)` | 目前 call stack | rejected Promise | runtime 已支援，且要保留立即執行 |
| fallback 的 `try` + `Promise.resolve` | 目前 call stack | rejected Promise | 需要舊 runtime 相容 |
| `Promise.resolve().then(callback)` | 下一個 microtask | rejected Promise | 刻意要延後執行，且文件明定這個時序 |

可用這段最小測試看出差異：

~~~js
const trace = [];

Promise.try(() => trace.push('try callback'));
Promise.resolve().then(() => trace.push('then callback'));
trace.push('after scheduling');

queueMicrotask(() => console.log(trace));
// ['try callback', 'after scheduling', 'then callback']
~~~

若 callback 會讀寫同一個 in-memory state、開始一個 tracing span，或呼叫端在下一行立刻檢查副作用，改成 `.then(callback)` 就可能是 bug。反之，若 API 的目的就是 batch 或避免 re-entrancy，延到 microtask 是可選的設計，但要把它當成 API 契約說出來。

## 四個等級的示範回答

| 等級 | 示範回答 | 少了或多了什麼 |
| --- | --- | --- |
| 很好 | 「`Promise.resolve(callback())` 先執行 callback，接不到同步 throw。支援 ES2025 時用 `Promise.try(callback)`；否則 `try…catch` 後再 `Promise.resolve`。不要把 `.then(callback)` 當成等價，因為它改成 microtask。用四種 callback 測試並依 runtime matrix 決定 fallback。」 | 同時覆蓋 exception boundary、Promise adoption、時序、相容性與驗證。 |
| 好 | 「用 `Promise.try(callback)`，它可以處理普通回傳、throw 和 Promise；舊環境用 `try…catch` 包住 callback。」 | 答對主做法，但未說明為何 `Promise.resolve(callback())` 失敗，也沒有談時序。 |
| 普通 | 「全部包 `Promise.resolve`，然後 `.catch()`。」 | 忽略參數先求值；同步 throw 仍逃出 Promise chain。 |
| 差 | 「callback 一律改成 `async`。」 | `async` 會改變 callback 的回傳型別與執行／錯誤行為，無權強迫第三方或舊 plugin 照做。 |

## 常見失敗方式

### 1. 把 `new Promise` 當成通用修補

`new Promise((resolve) => resolve(callback()))` 的 executor 會把 throw 轉成 rejection，因此效果接近；但它永遠新建一個 Promise，即使 callback 已回傳 native Promise。對應的 `Promise.try` 設計是讓回傳值按 `Promise.resolve` 的規則被採納，語意更直接。[^mdn]

### 2. 只測 `async () => {}`

`async function` 裡的 throw 會變成 rejection，因此測試全是 async callback 時，錯誤包裝很容易看似正確。這題要刻意保留一個普通 function 的同步 throw，才能驗證 exception boundary 是否真的包住 callback invocation。

### 3. 沒寫清楚 runtime 前提

ES2025 已納入 `Promise.try`，不表示編譯器 target、TypeScript lib、Node.js 版本、browser 與 WebView 都已跟上。發布 library 前，要以實際支援矩陣跑 integration test；不能把本地能執行當成所有 consumer 都能執行。這是相容性判斷，不是 `Promise.try` 本身的效能宣稱。

## 怎麼驗證答案

以下 Vitest 範例只檢查契約，不假裝它已覆蓋所有 runtime。要測舊環境，應在 CI 用實際目標版本執行，或在測試環境暫時移除 `Promise.try` 走 fallback branch。

~~~ts
import { describe, expect, it } from 'vitest';
import { callAsPromise } from './call-as-promise';

describe('callAsPromise', () => {
  it('wraps a synchronous value', async () => {
    await expect(callAsPromise(() => 42)).resolves.toBe(42);
  });

  it('turns a synchronous throw into rejection', async () => {
    await expect(callAsPromise(() => {
      throw new Error('sync failure');
    })).rejects.toThrow('sync failure');
  });

  it('adopts an asynchronous result', async () => {
    await expect(callAsPromise(async () => 'done')).resolves.toBe('done');
  });

  it('keeps an asynchronous rejection in the same error path', async () => {
    await expect(callAsPromise(async () => {
      throw new Error('async failure');
    })).rejects.toThrow('async failure');
  });
});
~~~

面試時先說清楚「callback 呼叫」也是可能失敗的操作，再決定要保留同步時序還是刻意排到 microtask，就不會只背 `Promise.try` 這個新 API。這個判斷同樣適用在 plugin system、middleware、rule engine 和可插拔的資料轉換流程。

[^ecma2025]: [ECMAScript 2025, §27.2.4.8 Promise.try](https://tc39.es/ecma262/2025/multipage/control-abstraction-objects.html#sec-promise.try)
[^mdn]: [MDN: Promise.try()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/try)
