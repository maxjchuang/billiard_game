# Implementation Plan: dev:web 鼠标操作支持

**Branch**: `001-web-mouse-control` | **Date**: 2026-04-18 | **Spec**: `specs/001-web-mouse-control/spec.md`
**Input**: Feature specification from `specs/001-web-mouse-control/spec.md`

## Summary

为 `dev:web` 调试入口补齐浏览器鼠标交互闭环，使用户无需控制台命令即可完成开始对局、瞄准蓄力出杆、取消出杆、重开/返回菜单。实现方式是在现有 `GameApp` 与 `InputManager` 上增加 Web 输入适配层与最小 UI 交互层，保持规则与物理逻辑不变，并通过单元测试 + Web 手动验证保证稳定性。

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Vite（Web dev server）、原生 Canvas 2D（无新增第三方交互库）  
**Storage**: N/A（不新增持久化）  
**Testing**: Vitest（单元测试）+ `dev:web` 手动冒烟验证  
**Target Platform**: 桌面浏览器（`http://127.0.0.1:5173`）  
**Project Type**: 前端游戏应用（Web debug + 微信小游戏双入口）  
**Performance Goals**: 保持现有调试帧循环稳定，鼠标输入不引入可感知卡顿；单次操作仅触发一次击球  
**Constraints**: 不破坏现有微信小游戏链路；不改动规则判定与物理核心；避免重复出杆与越界输入导致异常  
**Scale/Scope**: 单 feature，小范围改动于 `web.ts / GameApp / Input / render UI` 与对应测试

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

当前 `.specify/memory/constitution.md` 仍为模板占位，未形成正式项目宪章；本计划先依据仓库内现有强约束执行：

- 以 TDD 为主：先补/改测试，再改实现（来源：README 开发原则）
- 所有新增核心逻辑应可测试（来源：README）
- 不把规则写进渲染层，不把物理写进 UI 层（来源：README）
- 提交前通过 `lint` 与 `test`（来源：AGENT.md）

**Gate Result (Pre-Phase-0): PASS（临时）**  
说明：无与上述约束冲突的设计；正式 constitution 建议后续通过 `$speckit-constitution` 补齐。

## Project Structure

### Documentation (this feature)

```text
specs/001-web-mouse-control/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── web-mouse-input.md
└── tasks.md            # 由 /speckit.tasks 生成
```

### Source Code (repository root)

```text
src/
├── web.ts
├── game/
│   └── GameApp.ts
├── input/
│   └── InputManager.ts
└── render/
    └── Renderer.ts

tests/
├── input/
├── gameplay/
└── core/
```

**Structure Decision**: 采用单项目结构，局部扩展现有模块；不新增子应用或服务。

## Phase 0: Research

输出文件：`specs/001-web-mouse-control/research.md`

研究结论目标：
- 明确鼠标事件与现有 `InputIntent` 的映射策略
- 明确取消操作、边界输入、连点防抖的规则
- 明确最小可行 UI 反馈方案，不侵入规则/物理层

## Phase 1: Design & Contracts

输出文件：
- `specs/001-web-mouse-control/data-model.md`
- `specs/001-web-mouse-control/contracts/web-mouse-input.md`
- `specs/001-web-mouse-control/quickstart.md`

设计重点：
- 在 `dev:web` 下新增输入桥接，不改变微信侧行为
- 通过状态约束保证“一次鼠标流程对应一次出杆”
- 保留 `__BILLIARD_DEBUG__` 调试能力并兼容

## Post-Design Constitution Check

**Gate Result (Post-Phase-1): PASS（临时）**

- 设计将交互映射限制在输入层/入口层，未下沉到规则与物理层
- 可通过单元测试覆盖输入语义与状态约束
- 质量门禁保持 `npm run lint && npm test`

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 无 | N/A | N/A |
