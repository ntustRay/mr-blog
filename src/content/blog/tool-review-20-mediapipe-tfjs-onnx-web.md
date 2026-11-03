---
title: "[Review] MediaPipe、TensorFlow.js、ONNX Runtime Web：Browser AI Vision 怎麼選"
description: "Browser ML 的模型大小、Session 初始化、Inference Latency、輸入資料前處理與 Client Privacy 都會影響產品。先確定是否需要手勢、臉部 Landmark、Segment，還是通用自帶模型推論"
pubDate: 2026-11-03
category: "Frontend"
series: tech-stack-comparisons
seriesOrder: 20
tags:
  - "MediaPipe"
  - "WebAssembly"
  - "Machine Learning"
  - "WebGL"
draft: false
references:
  - title: "MediaPipe Repository"
    url: "https://github.com/google-ai-edge/mediapipe"
  - title: "TensorFlow.js Repository"
    url: "https://github.com/tensorflow/tfjs"
  - title: "ONNX Runtime Repository"
    url: "https://github.com/microsoft/onnxruntime"
  - title: "MediaPipe Tasks Vision"
    url: "https://ai.google.dev/edge/mediapipe/solutions/vision"
  - title: "TensorFlow.js Guide"
    url: "https://www.tensorflow.org/js/guide"
  - title: "ONNX Runtime Web Docs"
    url: "https://onnxruntime.ai/docs/tutorials/web/"
---

Browser ML 的模型大小、Session 初始化、Inference Latency、輸入資料前處理與 Client Privacy 都會影響產品。先確定是否需要手勢、臉部 Landmark、Segment，還是通用自帶模型推論。

## 先說選擇

現成 Landmark、Face/Pose/Hands Tasks 可先評估 MediaPipe；若要部署 TensorFlow 模型可考慮 TensorFlow.js；已有 ONNX Model 並需要執行 Provider 選項可評估 ONNX Runtime Web。

## Pros / Cons 比較

| 方案 | GitHub Stars | Pros | Cons | 適合 |
| --- | ---: | --- | --- | --- |
| [MediaPipe](https://github.com/google-ai-edge/mediapipe) | 37,525 | 可直接使用特定 Vision Tasks | Task Model、WASM Asset 與授權需確認 | AR Face/Hands |
| [TensorFlow.js](https://github.com/tensorflow/tfjs) | 19,157 | TensorFlow Model/Backend 生態 | Model Conversion、效能與體積需測 | 多種 ML 模型 |
| [ONNX Runtime](https://github.com/microsoft/onnxruntime) | 22,211 | ONNX 推論、Web Backend 選項 | Operator Support、Model 相容要驗證 | 已有 ONNX 模型 |

*Stars 查詢日：2026-11-03；指上表連結的 GitHub Repository，而不是使用者數、客戶數、效能或安全評分。不同平台/SDK/Monorepo 範圍不對等，不能直接推論產品成熟度。備選工具未必由作者實際使用。*

## 選型的核心 Trade-offs

- Model Size 跟 Inference Delay 是兩回事；Model Download、Warm-up、Camera Frame Conversion 可能比模型核心執行更耗時。
- 不要每個 Camera Frame 都無限制排隊 Inference；可使用 Worker、Frame Throttle 與最新影格優先策略。
- Client-only 並不代表第三方 CDN 一定不收集資料；權限、模型下載、Image Export 都應檢查 Network Requests。

## 實際案例與安全邊界

這個主題來自已評估的前端影像處理路線，但不公開私人產品實作、模型資產或未授權的圖片。公開文章只用官方模型和可重現的測試資料。

## 最小驗收流程

1. 測 720p、1080p 輸入及首次模型載入耗時。
2. 在主流手機測 P50/P95 Inference、UI responsiveness、Memory。
3. 驗證離線模型載入、Camera Permission、Network 與錯誤回退。

## 何時不選預設方案

如果只是 Resize、Sharpen、去簡單背景色，優先以 Canvas/Shader/傳統影像演算法達成；不應先引入 ML。

以上依官方文件與公開 Repository 內容整理；未對全部候選做同環境效能測試，設計與選型應以實際需求及部署條件核對。
