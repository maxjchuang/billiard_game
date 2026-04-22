<!--
Sync Impact Report

- Version: 1.3.0 → 1.4.0
- Modified principles:
  - 8. Analyze After Tasks → 9. Analyze After Tasks
- Added principles:
  - 8. Visual Non-Overlap
- Removed sections: none
- Templates requiring updates:
  - ✅ updated: `.specify/templates/plan-template.md`
  - ✅ updated: `.specify/templates/spec-template.md`
  - ✅ updated: `.specify/templates/tasks-template.md`
- Follow-ups: none
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

### 7. Clarify Before Plan
在执行 `/speckit.specify` 生成 `spec.md` 后，必须执行一次 `/speckit.clarify` 完成规格澄清；
若未完成该步骤，不得进入 `/speckit.plan`。

### 8. Visual Non-Overlap
页面上所有可见元素（包括 HUD、按钮、状态区、配置面板、画布及其派生浮层）在任何默认或支持的交互状态下都 MUST 保持视觉上不重叠，且不得遮挡关键玩法信息、主要操作入口或球桌核心可视区域。
新增或调整 UI 时，必须同步验证折叠、展开、错误提示、响应式尺寸与极端文案长度等状态下的布局安全性。

### 9. Analyze After Tasks
在执行 `/speckit.tasks` 生成 `tasks.md` 后，必须执行一次 `/speckit.analyze` 并输出中文分析报告；
若未完成该步骤，不得进入 `/speckit.implement`。

## Governance
本宪章优先级高于 feature 文档、局部约定与临时流程说明；违反 MUST 条款的变更不得进入实现阶段。

宪章修订必须与受影响模板、流程说明及校验提示在同一变更中同步更新，并在 Sync Impact Report 中明确记录影响范围。

版本号遵循语义化规则：新增原则或新增强制性治理要求记为 MINOR，原则删除或不兼容重定义记为 MAJOR，纯措辞澄清且不改变治理含义记为 PATCH。

所有 `/speckit.plan`、`/speckit.tasks`、`/speckit.implement` 输出以及合并前评审都必须显式核对宪章符合性，至少覆盖测试、分层边界、日志、质量门禁与可见 UI 不重叠要求。

**Version**: 1.4.0 | **Ratified**: 2026-04-18 | **Last Amended**: 2026-04-22
