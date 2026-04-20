# Tasks: GitHub Pages 静态单页站点

**Input**: Design documents from `specs/005-pages-static-spa/`  
**Prerequisites**: `specs/005-pages-static-spa/plan.md`, `specs/005-pages-static-spa/spec.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 明确构建/发布边界，避免与小游戏产物冲突

- [ ] T001 盘点并确认现有构建产物入口关系（小游戏 `game.js` 引用 `dist/game.js`）并记录关键约束在 `specs/005-pages-static-spa/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 先打通“可构建的静态产物 + 可部署的流水线骨架”

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 新增 Web 静态构建脚本（例如 `npm run build:web`）并确保输出目录与小游戏 `dist/` 分离（`package.json`, `vite.config.ts`）
- [ ] T003 配置 Vite 的构建基路径以适配 GitHub Pages 项目页子路径（`vite.config.ts`）
- [ ] T004 新增 GitHub Pages 部署工作流（main 合并后自动构建并部署）（`.github/workflows/pages.yml`）

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 访问即可运行的静态单页站点 (Priority: P1) 🎯 MVP

**Goal**: 用户打开 GitHub Pages 地址即可加载并交互

**Independent Test**: 本地运行静态构建并用静态服务器预览，页面可加载并可交互

### Implementation for User Story 1

- [ ] T005 [P] [US1] 确认并补齐 Web 入口在生产构建下可运行（静态资源引用正确）（`index.html`, `src/web/index.ts`, `src/web.ts`）
- [ ] T006 [US1] 实现/验证静态产物可在子路径下正确加载（必要时调整资源路径/入口初始化）（`vite.config.ts`, `index.html`）

**Checkpoint**: User Story 1 should be runnable from built static artifacts

---

## Phase 4: User Story 2 - 合并到 main 后自动发布更新 (Priority: P2)

**Goal**: 合并到 `main` 后自动发布站点更新

**Independent Test**: Push 到分支触发 CI（或模拟工作流），能产出可发布 artifact；合并到 `main` 后站点更新

### Implementation for User Story 2

- [ ] T007 [US2] 配置工作流触发条件为 `push` 到 `main`（或 PR 合并等价路径），并把构建产物发布到 Pages（`.github/workflows/pages.yml`）
- [ ] T008 [US2] 增加失败可追踪信息（明确 build/deploy 步骤、输出关键日志/失败原因）（`.github/workflows/pages.yml`）

---

## Phase 5: User Story 3 - 分享与回退体验稳定 (Priority: P3)

**Goal**: 刷新/直达深链不 404；加载失败有清晰反馈

**Independent Test**: 使用静态服务器模拟 Pages：访问根路径与任意子路径、刷新页面，均能回到应用入口并正常运行

### Implementation for User Story 3

- [ ] T009 [US3] 增加 SPA 刷新/直达子路径的回退方案（例如提供 404 回退到入口页或等价策略）（`index.html`, `public/404.html` 或构建产物配置）
- [ ] T010 [US3] 增加资源加载失败的用户可理解反馈（最小可行：入口加载失败提示/重试指引）（`index.html` 或 `src/web/ui/*`）

---

## Phase 6: Quality Gates

**Goal**: 通过质量门禁 + 满足宪章 README 同步要求

- [ ] T011 更新 `README.md` 增加 GitHub Pages 试玩入口与部署说明（新增功能必须同步 README）（`README.md`）
- [ ] T012 Run quality gates: `npm run lint`, `npm test`, `npm run build`（以及新增的 Web 构建命令，如有）（`package.json`）

---

## Dependencies & Execution Order

- Setup (T001) → Foundational (T002–T004) → US1 (T005–T006) → US2 (T007–T008) → US3 (T009–T010) → Gates (T011–T012)

## Parallel Opportunities

- T002 与 T003 可并行推进（同一子系统但改动点不同，注意冲突）
- T004 可在 T002 明确构建命令后推进（可部分并行编写工作流骨架）
- T011 可在实现过程中并行起草（但以最终命令/URL 细节为准）

