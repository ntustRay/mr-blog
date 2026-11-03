---
title: "[Review] GitHub Actions、GitLab CI、Azure Pipelines：CI/CD 怎麼選"
description: "CI/CD 要分開看 Repository Events、Runner、Cache、Secrets、Deployment Gate、Artifact 與成本。平台選型通常受現有 Git 與內部網路邊界影響。"
pubDate: 2026-11-03
category: "Dev Tools & Quality"
series: tech-stack-comparisons
seriesOrder: 27
tags:
  - "GitHub Actions"
  - "GitLab CI"
  - "Azure"
  - "CI/CD"
draft: false
references:
  - title: "GitHub Actions Runner Repository"
    url: "https://github.com/actions/runner"
  - title: "GitLab CE Mirror Repository"
    url: "https://github.com/gitlabhq/gitlabhq"
  - title: "Azure Pipelines Agent Repository"
    url: "https://github.com/microsoft/azure-pipelines-agent"
  - title: "GitHub Actions Docs"
    url: "https://docs.github.com/en/actions"
  - title: "GitLab CI/CD Docs"
    url: "https://docs.gitlab.com/ci/"
  - title: "Azure Pipelines Docs"
    url: "https://learn.microsoft.com/en-us/azure/devops/pipelines/"
---

CI/CD 要分開看 Repository Events、Runner、Cache、Secrets、Deployment Gate、Artifact 與成本。平台選型通常受現有 Git 與內部網路邊界影響。

## 先說結論

GitHub 上的開源/個人專案從 Actions 開始；GitLab Repo 與 Runner 既有體系優先 GitLab CI；與 Azure 企業環境高度耦合則可考慮 Azure Pipelines。

## GitHub Stars、Pros、Cons

| 工具 | GitHub Stars | Pros | Cons | 適合情境 |
| --- | ---: | --- | --- | --- |
| [GitHub Actions Runner](https://github.com/actions/runner) | 6,376 | GitHub Events/Marketplace/Actions 整合 | Secret/Workflow Permissions 要設計 | GitHub Repo |
| [GitLab CE Mirror](https://github.com/gitlabhq/gitlabhq) | 24,550 | GitLab 流程與 Runner 整合 | 維運/版本/執行環境需管理 | GitLab 生態 |
| [Azure Pipelines Agent](https://github.com/microsoft/azure-pipelines-agent) | 1,925 | Azure Service Connection 與 Release 整合 | 平台與帳號治理較複雜 | Azure 產品 |

*Stars：2026-11-03 各工具所連結的 GitHub Repository 快照。部分 Repo 代表 Runtime、SDK、CLI 或平台，不是同一層級的產品；Stars 不能當成成熟度、效能或用戶數排名。列入比較不表示作者使用過每個工具。*

## Trade-offs 與必要原理

- 這張 Stars 表比較的是不同範圍的 Runner/平台程式碼，不是 CI/CD 產品人氣，也不代表 SaaS 功能量。
- Cache 命中、Parallelism、Artifact Retention 與 Hosted Runner Minute 才決定實際 CI 花費；要用自己 Repository 的 log。
- Supply Chain Security 要限制 Workflow Permissions、Pin Action/Container 版本、保護部署環境與分隔非可信 PR。

## 實際使用案例

[mr-blog](https://github.com/ntustRay/mr-blog) 和 [engineer-stock-data](https://github.com/ntustRay/engineer-stock-data) 都有 GitHub Actions。企業內部 Pipeline 設定、Runner Host、Credential 與環境拓樸不公開。

## 導入驗收

1. 執行 Lint、Unit、Build、Artifact、Deploy 五個標準 Job。
2. 檢查 PR 和 Main 權限、Secret 使用與 Approval Gate。
3. 統計 30 次 Job 耗時、Failure Rate、Cache Hit 與費用。

## 什麼時候不要換工具

不要只為使用新平台搬遷既有 CI；除非 Runner、安全控管、管制要求或維護成本可以量化改善。

此篇提供官方文件與公開專案可查證的選型邏輯，並未聲稱所有方案已有作者獨立實測；實際版本與環境變更時應重跑驗收。
