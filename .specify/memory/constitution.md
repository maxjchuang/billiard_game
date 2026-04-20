<!--
Sync Impact Report

- Version: 1.1.0 → 1.2.0
- Modified principles: none
- Added principles:
  - 7. Analyze After Tasks
- Removed sections: none
- Templates requiring updates:
  - ✅ updated: .specify/templates/tasks-template.md
- Follow-ups:
  - none
-->

# Billiard Game Constitution

## Core Principles

### 1. Test-First
所有功能改动必须有对应自动化测试；实现前先补失败测试，提交前测试必须通过。

### 2. Layer Boundaries
规则逻辑不得写入渲染层；物理逻辑不得写入 UI 层；输入层只产生意图，不直接改对局结论。

### 3. Observability
新增关键链路必须有日志，至少覆盖开始、关键分支、失败或拒绝路径。

### 4. Quality Gates
合入前必须通过 `npm run lint`、`npm test`、`npm run build`。

### 5. Backward Compatibility
`dev:web` 增量能力不得破坏微信小游戏原有链路。

### 6. README 同步
新增功能或关键改动 MUST 更新 `README.md` 的对外描述（目的、用法、运行方式等相关内容）；纯 bug fix 可不更新。

### 7. Analyze After Tasks
在执行 `/speckit.tasks` 生成 `tasks.md` 后，必须执行一次 `/speckit.analyze` 并输出中文分析报告；
若未完成该步骤，不得进入 `/speckit.implement`。

## Governance
本宪章优先级高于 feature 文档；违反 MUST 条款的变更不得进入实现阶段。

**Version**: 1.2.0 | **Ratified**: 2026-04-18 | **Last Amended**: 2026-04-20
