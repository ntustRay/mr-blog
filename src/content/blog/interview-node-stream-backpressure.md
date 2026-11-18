---
title: "[Guide] Node.js 面試題：大檔案串流為什麼還會耗盡記憶體？"
description: "從大型檔案壓縮理解 Node.js stream、backpressure、highWaterMark、pipeline 與失敗清理。"
pubDate: 2026-11-18
category: "Full-stack"
tags: [interview, Node.js, Performance]
draft: false
references:
  - title: "Tarmac：Node.js interview questions"
    url: "https://gettarmac.com/interview-questions/nodejs-interview-questions"
  - title: "Coddy：Node.js Streams and Buffers Interview Questions"
    url: "https://coddy.tech/interview-questions/nodejs/streams-buffers"
  - title: "Node.js 24：Stream"
    url: "https://nodejs.org/download/release/latest-v24.x/docs/api/stream.html"
  - title: "Node.js：Backpressuring in Streams"
    url: "https://nodejs.org/learn/modules/backpressuring-in-streams"
  - title: "Node.js 24：TypeScript"
    url: "https://nodejs.org/download/release/latest-v24.x/docs/api/typescript.html"
  - title: "Node.js 24：process.memoryUsage"
    url: "https://nodejs.org/download/release/latest-v24.x/docs/api/process.html#processmemoryusage"
---

讀取檔案的速度快於寫入時，即使程式用了 stream，仍可能因為忽略 `write()` 的回傳值，讓待寫資料持續累積。連接標準 Node.js streams 時，可用 `pipeline()` 協調資料流、錯誤與清理；仍須處理不完整的輸出檔案及限制同時執行的工作數。

## 這篇的重點

- `write()` 回傳 `false` 時，該 chunk 已被接受，生產者應暫停後續寫入並等待 `drain`，不能重送同一個 chunk。
- `highWaterMark` 是提示暫停的門檻，不是程序的記憶體上限。
- `pipeline()` 能處理串流的 backpressure 與錯誤傳遞，但不會替應用程式刪除半成品或限制併發數。

## 面試題目

一個 Node.js 批次工作要把可能超過可用記憶體的 log 檔案壓縮成 gzip。讀取速度通常快於目標磁碟的寫入速度。目前程式如下：

```ts
const input = createReadStream("events.log");
const output = createWriteStream("events.log.gz");
const gzip = createGzip();

input.pipe(gzip);
gzip.on("data", (chunk: Buffer) => {
  output.write(chunk); // 忽略回傳值
});
gzip.on("end", () => output.end());
```

1. 為什麼使用 stream 後，記憶體仍可能持續增加？
2. `write()` 回傳 `false` 代表資料被拒絕、需要重送嗎？應該如何繼續？
3. 如何改寫、處理錯誤與不完整檔案？如何驗證？
4. 若有多個檔案同時壓縮，還需要考慮什麼？

**練習假設：** 輸入是已存在的本機檔案，任務以獨立目的地檔案輸出；單次工作期間輸入內容不變。假設程式有目的地目錄的讀寫權限，且同一個目的地沒有其他程序同時寫入。範例採 Node.js 24；檔案大小、磁碟速度與併發數沒有固定值。

**題型：經典題。** [Tarmac 於 2026 年 11 月 2 日更新的題目整理](https://gettarmac.com/interview-questions/nodejs-interview-questions)列出 `write()`、`highWaterMark` 與 `pipeline()`；[Coddy 於 2026 年 10 月 10 日更新的整理](https://coddy.tech/interview-questions/nodejs/streams-buffers)也有 backpressure 題目。此處改成檔案壓縮情境，不宣稱概念或題目是 2026 年才出現，也不歸屬特定出題公司。

## 評分標準

以下分數僅供練習參考，不代表業界統一標準。

| 項目 | 分數 | 評分重點 |
| --- | ---: | --- |
| 找出原因 | 20 | 寫入端較慢，忽略回傳值使資料累積 |
| 解釋 backpressure | 25 | `false`、`drain`、chunk 已接受與門檻的關係 |
| 改寫及清理 | 25 | `pipeline()`、錯誤處理、不完整檔案 |
| 系統邊界 | 15 | 併發、單次 buffer、取消與輸出完整性 |
| 驗證 | 15 | 慢寫入、資料完整、錯誤與取消情境 |

## 四個等級的回答

### 很好：85–100 分

> `gzip` 的 `data` handler 持續呼叫 `output.write()`，但寫入端說需要暫停時沒有停下；慢磁碟可能讓待寫資料越積越多。`write()` 回傳 `false` 時，這次 chunk 已交給 stream，不應重送，應等待 `drain` 後才寫下一筆。
>
> 我會用 `pipeline()` 串接讀取、壓縮和寫入，等待完成並捕捉錯誤。先寫入獨立暫存路徑，成功後再移到目的地；失敗時清理暫存檔。`highWaterMark` 不是硬上限，也要限制同時處理的檔案數。驗證時會模擬慢寫入、錯誤與取消，並解壓比對原始資料。

**差異：** 說清楚資料是否已被接受，也處理串流以外的輸出與併發問題。

### 好：70–84 分

> 改用 `pipeline(input, gzip, output)` 並捕捉錯誤。它會協調 backpressure；如果直接呼叫 `write()`，看到 `false` 就要等 `drain`。

**差異：** 找到主要修正，但還要交代半成品、併發和驗證。

### 普通：50–69 分

> 應該用 stream 逐段處理大檔案，避免先把整個檔案讀進記憶體。

**差異：** 方向正確，但原程式已經使用 stream；回答沒有指出寫入端較慢時的累積問題。

### 差：0–49 分

> `write()` 回傳 `false` 代表這段資料沒有寫入，立刻重送；把 `highWaterMark` 調大就能保證不會耗盡記憶體。

**差異：** 這可能造成重複輸出，繼續寫入也會加劇緩衝；`highWaterMark` 不是硬性上限。

## 步驟 1：理解資料如何累積

以讀檔每秒提供的資料多於磁碟每秒能寫入的資料為例：

1. `input.pipe(gzip)` 把檔案資料交給壓縮 stream。
2. `gzip` 持續產出壓縮後的 chunks；`data` handler 呼叫 `output.write(chunk)`。
3. 若 `output` 處理跟不上，尚待處理的資料會留在它的內部佇列。
4. 當 `write()` 回傳 `false`，原程式仍繼續寫入，佇列可能不斷變大。

這個讓較慢的消費端通知上游暫停的機制稱為 **backpressure**。本題第一段 `input.pipe(gzip)` 有自己的流量協調，但第二段由手動 `data` handler 寫入，沒有依照 `output.write()` 的回傳值暫停 `gzip`。上游即使採用 stream，只要其中一段忽略訊號，仍可能出現大量緩衝。

### `write(false)` 具體代表什麼？

當 `output.write(chunk)` 回傳 `false`，這個 chunk 已交給 `output`；這是「暫停繼續餵資料」的訊號。之後收到 `drain` 才繼續寫**下一個** chunk。還要處理寫入錯誤、提早關閉與取消；不能只等待 `drain` 而忽略可能永遠不會正常恢復的情況。[Node.js Stream 文件](https://nodejs.org/download/release/latest-v24.x/docs/api/stream.html#writablewritechunk-encoding-callback)說明了 `write()` 與 `drain` 的契約。

在一般 byte stream 中，`highWaterMark` 用 bytes 表示門檻；object mode 則用物件數。加入這次 chunk 後，緩衝大小達到或超過門檻時，`write()` 會回傳 `false`。**門檻不是記憶體硬上限**：單筆 chunk 可以大於它，呼叫端也仍能繼續寫入。每個 stream 都有自己的 buffer；`Transform` 同時有讀取與寫入兩側的 buffer。實際佔用還包括壓縮器、應用程式與其他同時執行的工作。[Node.js Buffering 文件](https://nodejs.org/download/release/latest-v24.x/docs/api/stream.html#buffering)

## 步驟 2：用 `pipeline()` 串接

以下將完整 gzip 先寫入目的地目錄下的獨立暫存目錄；pipeline 成功後，才把檔案移至目的地。`destination` 假設是新的檔名，且輸入路徑與輸出路徑不同；不要把不受信任的使用者路徑直接傳入。

```ts title="gzip-file.mts"
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

export async function gzipFile(
  source: string,
  destination: string,
  signal: AbortSignal,
): Promise<void> {
  const workDir = await mkdtemp(join(dirname(destination), ".gzip-"));
  const temporaryFile = join(workDir, "data.gz");

  try {
    await pipeline(
      createReadStream(source),
      createGzip(),
      createWriteStream(temporaryFile, { flags: "wx" }),
      { signal },
    );
    await rename(temporaryFile, destination);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
```

建立呼叫端並處理失敗：

```ts title="run.mts"
import { gzipFile } from "./gzip-file.mts";

const controller = new AbortController();

try {
  await gzipFile("events.log", "events.log.gz", controller.signal);
  console.log("壓縮完成");
} catch (error) {
  console.error("壓縮或清理失敗", error);
  process.exitCode = 1;
}
```

在 Node.js 24.12 以上，將兩個檔案和 `events.log` 放在同一目錄，可執行 `node run.mts`。此範例只使用 Node 支援移除的 TypeScript 型別語法；Node 執行時不做 type checking。其他環境可使用 TypeScript compiler 或支援 TypeScript 的 runner。[Node.js TypeScript 文件](https://nodejs.org/download/release/latest-v24.x/docs/api/typescript.html)

`pipeline()` 讓讀取、壓縮、寫入依下游速度協調，並在串流出錯時拒絕 Promise、清理尚未結束的 streams。傳入的 `AbortSignal` 被取消時，pipeline 會以錯誤結束。不要重複使用失敗後的 stream；要重試，應建立新的 streams。[Node.js pipeline 文件](https://nodejs.org/download/release/latest-v24.x/docs/api/stream.html#streampipelinesource-transforms-destination-options)

### 暫存與失敗的邊界

- `pipeline()` 不會自動刪除已寫到磁碟的部分檔案；這裡由 `finally` 移除本次獨立的暫存目錄。若程序被強制終止，`finally` 可能來不及執行，需要另外清理遺留暫存目錄。
- 範例假設目的地不存在且沒有競爭寫入。`rename()` 在某些平台可能覆寫既有目的地；需要保證不覆寫時，應採用檔案系統支援的安全發布策略，不能只靠事先檢查檔案是否存在。
- 暫存與目的地放在同一目錄所在的檔案系統，避免跨檔案系統搬移；檔案系統的原子性與斷電後持久性仍要依部署環境確認。清理本身也可能失敗：此範例會回報錯誤，甚至可能在檔案已成功移動後才回報清理失敗。
- `pipeline()` 與 `pipe()` 都能協調連接的 streams；差別之一是 `pipeline()` 集中處理錯誤及銷毀未完成的 streams。單純 `pipe()` 遇到來源錯誤時，目的地不一定自動關閉。[Node.js pipe 文件](https://nodejs.org/download/release/latest-v24.x/docs/api/stream.html#readablepipedestination-options)

## 步驟 3：從單一檔案擴展到服務

一個正確的 pipeline 仍會保有多個 buffer，也會佔用檔案 descriptor、CPU 與磁碟頻寬。同時處理的工作越多，總資源需求通常也越高。應根據實際限制設定併發上限，並在相近大小的檔案和磁碟條件下觀察等待時間與記憶體；不要假設每增加一個工作都會讓整體吞吐量上升。

可以用 `process.memoryUsage()` 觀察 RSS、heap 與 external／ArrayBuffer 等欄位。Buffer 等資料不一定反映在 `heapUsed`，也不能只靠單一數字判定 memory leak；要比較相同工作量下的變化、並發數與工作完成後的狀態。[Node.js process.memoryUsage 文件](https://nodejs.org/download/release/latest-v24.x/docs/api/process.html#processmemoryusage)

如果把目的地換成 HTTP response，客戶端斷線或讀取失敗時仍要釋放來源。使用 `pipeline()` 也可能在錯誤時銷毀 response 的 socket，因此錯誤發生後不一定還能回傳 JSON 錯誤訊息；要在開始傳送前盡可能完成授權及必要檢查，傳送開始後記錄失敗並讓客戶端辨識下載中斷。[Node.js pipeline 的 HTTP 注意事項](https://nodejs.org/download/release/latest-v24.x/docs/api/stream.html#streampipeline)

## 驗證

| 情境 | 預期結果 |
| --- | --- |
| 正常壓縮並解壓 | 解壓內容與原檔逐 byte 相同，目的地存在 |
| 模擬慢寫入 | 資料完整；觀察 `write()` 回傳 `false`、後續 `drain` 與緩衝量，不假設記憶體恆定不變 |
| 來源讀取或目的地寫入失敗 | pipeline 回報錯誤；不將半成品當成成功的目的檔案 |
| 工作期間取消 | pipeline 回報取消；暫存資料依清理策略處理 |
| 多個工作同時執行 | 設定併發上限，比較 RSS、耗時、錯誤與磁碟使用量 |
| 強制終止程序 | 下次啟動或排程能識別並清理過期的暫存目錄 |

範例已在 Node.js 24.22.3 執行，驗證 gzip 解壓後與原始資料相同、來源不存在與事先取消時清理暫存目錄，另以模擬慢速 Writable 驗證 pipeline 傳輸；並以 TypeScript 5.9.3 執行 strict 型別檢查。尚未測試工作中途取消、磁碟寫入失敗、強制終止、實際 HTTP 斷線或多工作效能。表中的其他項目是建議的驗證情境，不代表已完成。
