---
id: typescript-clamp
version: 1
title: 將數字限制在區間內
summary: 用三筆測資驗證數字低於下限、位於區間內、高於上限時的行為。
minutes: 8
tags: [TypeScript]
prerequisites: [typescript-narrowing]
---

<!-- block: clamp-cases -->

## 先寫出三種結果

在 0 到 10 的區間，-3 應回傳 0，6 應回傳 6，18 應回傳 10。先用這三種輸入測試，再考慮兩個邊界值。
