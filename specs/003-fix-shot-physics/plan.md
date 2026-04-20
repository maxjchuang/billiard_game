# Implementation Plan: Fix Shot Physics

**Branch**: `003-fix-shot-physics` | **Date**: 2026-04-20 | **Spec**: `specs/003-fix-shot-physics/spec.md`
**Input**: Feature specification from `specs/003-fix-shot-physics/spec.md`

## Summary

本特性修复两类玩家可感知的击球物理异常：

1) 首次击球（开球）运动过慢，影响可玩性与物理可信度。
2) 白球击中球堆后出现异常“力度过大/越撞越快”的现象（疑似碰撞增能）。

交付目标：碰撞不再注入异常能量；开球速度标定合理；补齐自动化回归测试；通过质量门禁（lint/test/build）。

## Technical Context

**Language/Version**: TypeScript (`tsc`)  
**Primary Dependencies**: 无运行时第三方库；开发/测试：Vite、Vitest  
**Storage**: N/A  
**Testing**: Vitest（`npm test`）  
**Target Platform**: WeChat mini game runtime + Web dev（`npm run dev:web`）  
**Project Type**: 游戏 Demo（带简化 2D 物理）  
**Performance Goals**: 60 FPS 视觉体验；物理固定步长 120Hz  
**Constraints**: 不引入新依赖；只在物理/配置层修改；保持既有规则与日志链路  
**Scale/Scope**: 默认 16 球连锁碰撞、进袋、首碰检测

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Test-First：先写/补回归测试再进入实现
- ✅ Layer Boundaries：修改范围限制在 `src/physics` / `src/config` / `src/gameplay/flow`
- ✅ Observability：保留现有关键日志（出杆、碰撞）；不引入噪音
- ✅ Quality Gates：确保 `npm run lint`、`npm test`、`npm run build` 通过
- ✅ Backward Compatibility：不改变 `dev:web` 与小游戏链路的输入/规则契约

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-shot-physics/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── config/
│   └── PhysicsConfig.ts          # 固定步长、衰减、恢复系数、出杆速度上限等
├── gameplay/flow/
│   └── ShotResolver.ts           # 将“瞄准角+力度”映射为白球初速度
└── physics/
    ├── PhysicsWorld.ts           # 物理步进、球-球碰撞解析、首碰检测
    └── body/BallBody.ts

tests/
├── physics/PhysicsWorld.test.ts
└── gameplay/ShotResolver.test.ts
```

**Structure Decision**: 单项目结构；通过“修复碰撞解析 + 调整出杆标定 + 回归测试”闭环交付。
