---
title: "[News] OpenAI Agents SDK 0.26：升級前先重建 Docker session，並把 tool side effect 排在 guardrail 後面"
description: "OpenAI Agents SDK v0.26.0 改變 Docker session、圖片權限和 guardrail 排程。按升級順序驗證既有 Agent。"
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

OpenAI 於 2026 年 11 月 24 日發布 Python Agents SDK v0.26.0。有舊 Docker session 的 Agent 若直接換版本，可能因原本的掛載方式或容器權限無法繼續。另一方面，guardrail 顯示拒絕，也還要確認工具在此前有沒有開始。兩件事都值得拿一個可復原的測試工作區先驗。[v0.26.0 release](https://github.com/openai/openai-agents-python/releases/tag/v0.26.0)｜[版本變更比較](https://github.com/openai/openai-agents-python/compare/v0.25.0...v0.26.0)

## 保存工作區，再以新規則建 session

官方指出，SDK 會拒絕 `InContainerMountStrategy`，即使標成唯讀；也不重用 privileged 或加額外 capabilities 的容器。先找 manifest 和保存的 `RunState` 是否引用舊 session，備份要保留的檔案，再依新 manifest 建立 session。容器只掛實際需要的檔案，使用相容的 volume driver，或按文件由應用程式授予可信路徑。完成後試著讀需要的文件，也確認不該開放的檔案被拒絕。[Docker 遷移說明](https://github.com/openai/openai-agents-python/releases/tag/v0.26.0)

## 拒絕輸入要發生在外部寫入以前

新版在 input guardrail 觸發時會停止尚未開始的 queued function tools。已經平行跑起來的工具有可能送出請求。要先驗輸入再開始動作，官方建議在第一個 Agent 的 input guardrail 設 `run_in_parallel=False`。高影響流程可先產生草稿，由應用程式核對後才執行。測試時埋一個只會寫測試紀錄的工具，故意送一筆應拒絕的輸入，確認紀錄沒有新增。[Guardrail 排程與修正](https://github.com/openai/openai-agents-python/releases/tag/v0.26.0)

下面是示意片段，故意只檢查空字串來表達執行順序。`approve_plan` 和 `execution_agent` 要由應用程式提供，正式工作仍須按核准的資料和權限執行。

```python
from agents import Agent, GuardrailFunctionOutput, Runner, input_guardrail


@input_guardrail(run_in_parallel=False)
async def reject_empty_request(_ctx, _agent, request):
    is_empty = isinstance(request, str) and not request.strip()
    return GuardrailFunctionOutput(
        output_info={"is_empty": is_empty},
        tripwire_triggered=is_empty,
    )


# Phase 1：先檢查輸入，再規劃，不掛會寫入外部系統的 tools。
planning_agent = Agent(
    name="Planner",
    instructions="Propose a plan without executing it.",
    input_guardrails=[reject_empty_request],
)
plan = await Runner.run(planning_agent, user_input)

# Phase 2：由應用程式審核這份計畫，核准後才交給執行 agent。
if await approve_plan(plan.final_output):
    result = await Runner.run(execution_agent, plan.final_output)
```

Codex tool 的本機圖片也改為由應用程式預先在 `image_attachments` 明列可用的圖片，再透過 key 引用。模型自己提出的檔案路徑不能當作授權。若另用 MCP metadata 路由或打 trace，新版對同一個 key 的順序是單次呼叫、`tool_meta_resolver`、discovery 預設。升級測試可刻意讓三個來源都有該 key，再逐一拿掉前面的值，檢查 fallback 是否符合預期。[圖片與 metadata 變更](https://github.com/openai/openai-agents-python/compare/v0.25.0...v0.26.0)
