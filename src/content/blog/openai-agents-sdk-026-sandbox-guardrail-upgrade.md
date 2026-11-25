---
title: "[News] OpenAI Agents SDK 0.26：升級前先重建 Docker session，並把 tool side effect 排在 guardrail 後面"
description: "OpenAI Agents SDK v0.26.0 修正 Docker mount、Codex tool 本機圖片與 queued function tools 的安全邊界。這篇整理會影響既有 Agent 的升級點：哪些 session 必須重建、何時 tool 可能已開始執行，以及如何把 input guardrail 放到 side effect 前。"
pubDate: 2026-11-25
category: "AI & Agents"
tags:
  - AI Agents
  - OpenAI
  - Security
  - MCP
references:
  - title: "OpenAI Agents SDK Python v0.26.0 release"
    url: "https://github.com/openai/openai-agents-python/releases/tag/v0.26.0"
  - title: "OpenAI Agents SDK v0.25.0...v0.26.0 comparison"
    url: "https://github.com/openai/openai-agents-python/compare/v0.25.0...v0.26.0"
relatedPostIds:
  - pydantic-ai-agent-runtime-brakes
  - nvidia-openshell-agent-security-boundary
  - agent-host-protocol-cross-device-session
draft: false
---

Agent framework 的升級，最容易被低估的是「版本能裝起來」和「既有 session 還安全可用」不是同一件事。尤其 Agent 已經能碰 Docker、檔案、MCP 和 function tools 時，release note 裡一條安全修正，可能直接改變 mount、請求排程或 input trust boundary。

OpenAI 在 **2026 年 11 月 24 日**發布 Python Agents SDK **v0.26.0**。這次包含一個 GPT-Live demo 更新，但更值得工程端先處理的是：Docker storage mount 限制、experimental Codex tool 的本機圖片授權、input guardrail 後 queued function tools 的停止行為，以及 MCP metadata 的 precedence。以下都來自官方 release；沒有把它們當成我已實測的結果。 [官方 release](https://github.com/openai/openai-agents-python/releases/tag/v0.26.0)

## TL;DR

- 若既有 Docker session 使用 `InContainerMountStrategy`、privileged container 或額外 Linux capabilities，官方 release 表示 v0.26.0 會拒絕建立或 reuse；升級前要把可恢復檔案 snapshot 下來，並以新 manifest 建新 session。
- input guardrail 被觸發時，SDK 現在會停止**尚未開始**的 queued function tools；但已平行啟動的 tool 仍可能有 side effect。高風險流程要把 guardrail 與 side effect 切成兩個 phase，或關閉 parallel execution。
- experimental Codex tool 不再把 model 提供的本機路徑視為自動授權。要以固定 key 明確 grant 圖片，再讓 tool 使用那個 key。
- 這是 minor release，但官方 release review 明列 Docker mounts、custom Realtime tracing 和 local images 都有 migration 影響；有 stateful Agent 的專案不應直接只改 lockfile。

## 哪些既有 Docker session 不能沿用？

v0.26.0 對 Docker storage mount 的限制是這次最需要先盤點的變更。官方說明指出，SDK 會拒絕 `InContainerMountStrategy`，即使 mount 是 read-only；也不會 reuse privileged containers 或具 added capabilities 的 containers。官方建議改用 `DockerVolumeMountStrategy` 搭配相容 driver，若原先把 S3 Files 之類的 storage 掛在 container 內，則先掛到 Docker host，再以受信任的 `SandboxPathGrant` 暴露需要的路徑。 [migration note](https://github.com/openai/openai-agents-python/releases/tag/v0.26.0)

重點不在於「新版比較嚴」，而是舊 session 的 runtime 假設已變。請先確認：

1. session manifest 是否用到 `InContainerMountStrategy`、privileged 或額外 capability；
2. `RunState` 是否序列化了舊 session reference；
3. workspace 是否有未同步的檔案、patch 或 artifact；
4. 新 mount 下 Agent 真正需要哪些 prefix，而不是把整個 host 路徑重新開回去。

官方的 migration 路徑是 snapshot workspace、不要帶入舊 session 或含它的 `RunState`，再依新 manifest 建立 fresh session。這會中斷 in-flight work，所以適合安排在可恢復的 checkpoint，而不是讓長任務跨版本繼續跑。

## Guardrail 成功不代表 tool 沒動過

release 也修正了 input guardrail rejection 後仍可能留在 queue 的 function tools：現在 tripwire 觸發時，尚未執行的 queued tools 會被停止。不過官方同時提醒：若要確定 input 在任何 tool 開始前就先被檢查，應使用 `run_in_parallel=False`。

這揭露的是 Agent workflow 常見的邊界：**guardrail 與 tool call 平行排程時，guardrail 的結果可能晚於某個 side effect。** 不要把「最後回覆被拒絕」當成「外部系統沒有收到請求」。

付款、寄信、刪除、權限異動等流程，建議用下面的兩階段形式：

```python
# Phase 1: only validate and plan; no side-effecting tools
plan = await Runner.run(
    planning_agent,
    user_input,
    run_config=RunConfig(run_in_parallel=False),
)

# Phase 2: show the reviewed intent, then execute with a narrow credential
# This phase should be entered only after application-level approval.
result = await Runner.run(execution_agent, plan.final_output)
```

這不是 SDK 唯一可用的寫法，而是把「輸入是否允許」和「寫入外部系統」分開。第二段仍需要 application-level approval、idempotency key、最小權限 credential 與 audit log；`run_in_parallel=False` 只處理順序，不能回收已經發出的 request。

## Codex tool 的本機圖片改成顯式 grant

官方 release 的另一個 security 修正是 experimental Codex tool 的 `local_image`。以前若 model 給出一個 path，應用程式可能把它當成可讀取的檔案。v0.26.0 不再信任這個 model-supplied path；應用程式要先把受信任的絕對路徑放進 `image_attachments`，tool 再透過 attachment key 取用。

```python
# 只由 application 決定實際檔案；model 只能引用 "diagram" 這個名稱。
codex_tool = CodexTool(
    image_attachments={
        "diagram": "/app/approved-inputs/diagram.png",
    },
)
```

這個模式的好處是 capability 比 path 更小：模型無法藉由改字串去讀任意本機檔案。但它仍不是完整 sandbox；application 需要自己確保路徑固定、來源可信、附件清單不含 secret 或不應外流的 artifact。

## MCP metadata 的 precedence 要寫成可測規則

release 說明中，per-call MCP metadata 現在優先於 discovery defaults；其次是 `tool_meta_resolver`。這會讓「這次 call 的 context」可以覆蓋 discovery 期間的預設，但也表示相同 key 的設定來源不同時，行為會有明確覆蓋順序。

若 MCP metadata 會帶 tenant、approval scope、trace label 或 routing hint，升級前應加一個 focused regression：

| case | 預期 |
| --- | --- |
| per-call 與 discovery 使用同 key | per-call 值生效 |
| 沒有 per-call、resolver 有值 | resolver 值生效 |
| 兩者都沒有 | 使用 discovery default |
| security-critical key | 不允許 model 自行決定 metadata 的來源或值 |

最後一列是架構判斷，不是本次 release 的宣稱。SDK 的 precedence 能讓整合一致，但 metadata 來源若混進 model output，仍可能變成權限繞行點。

## 升級順序

這次不適合只做 `pip install -U` 後看 happy path。比較穩的順序是：

1. 鎖住目前版本並保存可恢復的 workspace／session 資料。
2. 搜尋 Docker manifest、`RunState` 和 image input；先找出會被新版拒絕或需要改為 explicit grant 的地方。
3. 在非 production credential 下建立 fresh session，驗證 read-only path、patch、snapshot 與 timeout。
4. 把有 side effect 的 tool flow 拆成 validate → approval → execute，並測 tripwire 發生時沒有未核准的後續 call。
5. 對 MCP metadata 寫 precedence test；不要只從 trace 推測。
6. 觀察一段時間的 denied operation、tool error、重新建立 session 失敗與人工接手率，再擴大升級。

v0.26.0 的價值不是多一個功能，而是把幾個原本容易被 framework 默默處理的 trust boundary 拉到 application 面前。對有 sandbox 或 coding agent 的專案，先把它們變成可重跑的升級檢查，會比先追新版 API 更實際。

## References

- [OpenAI Agents SDK Python v0.26.0 release](https://github.com/openai/openai-agents-python/releases/tag/v0.26.0)
- [v0.25.0…v0.26.0 source comparison](https://github.com/openai/openai-agents-python/compare/v0.25.0...v0.26.0)
