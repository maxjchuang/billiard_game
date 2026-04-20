# Billiard Game

一个基于微信小游戏平台的台球游戏 Demo 项目，当前阶段聚焦“可运行、可验证、可迭代”的单机原型实现。

项目当前采用：

- `TypeScript`
- 微信小游戏原生 `Canvas 2D`
- `Vitest` 测试框架
- 固定步长物理循环
- TDD 驱动的核心模块实现

## 项目目标

当前版本不是正式上线版，而是用于验证以下核心能力的 Demo：

- 启动小游戏并进入标题页
- 开始一局简化 8 球对局
- 基础瞄准、蓄力、出杆链路
- 球体移动、碰撞、反弹、落袋
- 回合结算与胜负判断
- 完整链路日志
- 可测试、可构建、可持续扩展的代码结构

## 技术架构设计

### 架构原则

- 单向依赖：上层调用下层，下层不反向依赖业务层
- 物理独立：物理模块不依赖渲染层
- 规则收敛：规则判断集中在 `RuleEngine`
- 状态驱动：核心流程通过状态机推进
- 渲染只读：渲染层只读状态，不写业务结果
- 输入解耦：输入层只产出意图，不直接改球局结论
- 配置集中：物理、规则、渲染参数统一走 `config/`
- 日志贯通：新增模块必须有链路日志，便于调试与测试定位

### 目录结构

```text
.
├── game.js
├── game.json
├── package.json
├── project.config.json
├── spec/
├── src/
│   ├── config/
│   ├── core/
│   ├── game/
│   ├── gameplay/
│   ├── input/
│   ├── physics/
│   ├── platform/
│   ├── render/
│   ├── shared/
│   └── game.ts
├── tests/
├── tsconfig.json
└── vitest.config.ts
```

### 主要模块和作用

- `src/game/`
  - 应用装配层
  - 负责初始化平台能力、主循环、场景、状态机和核心依赖
  - 关键文件：`src/game/GameApp.ts`

- `src/core/`
  - 通用运行时基础设施
  - 包括状态机、固定步长循环、场景管理
  - 关键文件：`src/core/fsm/StateMachine.ts`、`src/core/loop/FixedStepLoop.ts`、`src/core/scene/SceneManager.ts`

- `src/gameplay/`
  - 对局业务逻辑层
  - 负责整局状态、出杆结果、规则判定、回合结算
  - 关键文件：`src/gameplay/session/GameSession.ts`、`src/gameplay/rules/RuleEngine.ts`、`src/gameplay/flow/ShotResolver.ts`、`src/gameplay/flow/RoundResolver.ts`

- `src/physics/`
  - 物理模拟层
  - 负责球体运动、摩擦、碰撞、反弹、落袋和事件收集
  - 关键文件：`src/physics/PhysicsWorld.ts`、`src/physics/body/BallBody.ts`、`src/physics/math/Vector2.ts`

- `src/render/`
  - 渲染层
  - 负责球桌、球体、球杆、HUD 的占位绘制
  - 关键文件：`src/render/Renderer.ts`、`src/render/layers/*.ts`

- `src/input/`
  - 输入层
  - 负责统一输入意图、瞄准角度和力度计算
  - 关键文件：`src/input/InputManager.ts`、`src/input/gesture/AimController.ts`、`src/input/gesture/PowerController.ts`

- `src/platform/wx/`
  - 微信小游戏平台适配层
  - 负责 Canvas、设备信息、存储、音频和震动能力封装
  - 关键文件：`src/platform/wx/WxAdapter.ts`、`src/platform/wx/StorageService.ts`

- `src/shared/logger/`
  - 日志基础设施
  - 提供 `ConsoleLogger` 与 `MemoryLogger`
  - 关键文件：`src/shared/logger/Logger.ts`

- `tests/`
  - 单元测试目录
  - 覆盖状态机、循环、输入、物理、规则、平台封装等核心模块

## 主要代码执行流程

### 启动流程

入口文件：`game.js` -> `dist/game.js` -> `src/game.ts`

执行链路如下：

1. `src/game.ts` 调用 `GameBootstrap.autoBoot()`
2. `GameBootstrap` 创建 `GameApp`
3. `GameApp.boot()` 通过 `WxAdapter` 获取 Canvas 和系统信息
4. 初始化 `Renderer`
5. 切换到 `MenuScene`
6. 状态机从 `boot` 进入 `menu`

对应关键代码：

- `src/game.ts:1`
- `src/game/GameBootstrap.ts:1`
- `src/game/GameApp.ts:56`

### 对局流程

开始一局时：

1. `GameApp.startMatch()` 创建初始球组
2. 初始化 `GameSession`
3. 初始化 `PhysicsWorld`
4. 初始化 `ShotResolver` 与 `RoundResolver`
5. 切换到 `MatchScene`
6. 状态机进入 `aiming`

对应代码：`src/game/GameApp.ts:79`

### 每帧运行流程

固定步长由 `FixedStepLoop` 驱动，推荐逻辑顺序如下：

1. `SceneManager.update(dt)` 更新当前场景
2. `InputManager.drainIntents()` 消费输入意图
3. 如果收到 `shoot`，则调用 `ShotResolver.shoot()` 给母球赋初速度
4. 状态机切换到 `ballsMoving`
5. `PhysicsWorld.step(dt)` 推进物理
6. 收集首碰、落袋、停球结果
7. 球全部静止后调用 `RoundResolver.resolve()`
8. `RoundResolver` 内部调用 `RuleEngine.resolve()` 完成规则判定
9. 将结果回写到 `GameSession`
10. `Renderer.render()` 完成绘制

对应关键代码：

- `src/game/GameApp.ts:102`
- `src/game/GameApp.ts:106`
- `src/physics/PhysicsWorld.ts:42`
- `src/gameplay/flow/RoundResolver.ts:11`
- `src/gameplay/rules/RuleEngine.ts:12`

## 日志设计

项目要求新增功能模块必须具备完整链路日志，当前日志方案如下：

- `ConsoleLogger`
  - 面向运行时调试
  - 输出到控制台

- `MemoryLogger`
  - 面向测试断言
  - 把日志记录在内存数组中

日志覆盖的主要模块包括：

- `GameApp`
- `StateMachine`
- `SceneManager`
- `FixedStepLoop`
- `InputManager`
- `AimController`
- `PowerController`
- `ShotResolver`
- `PhysicsWorld`
- `RuleEngine`
- `RoundResolver`
- `Renderer`
- `WxAdapter`
- `StorageService`

日志实现入口：`src/shared/logger/Logger.ts:1`

## 配置项说明

### `src/config/GameConfig.ts`

基础游戏配置：

- `title`：游戏标题
- `tableWidth`：逻辑桌面宽度
- `tableHeight`：逻辑桌面高度
- `deviceOrientation`：设备方向，当前为 `landscape`

### `src/config/PhysicsConfig.ts`

物理相关参数：

- `fixedDt`：固定步长
- `friction`：摩擦衰减系数
- `minVelocity`：停球阈值
- `railRestitution`：库边反弹系数
- `ballRestitution`：球体碰撞恢复系数
- `pocketCaptureRadius`：袋口吸附半径
- `maxCueSpeed`：最大出杆速度

### `src/config/RuleConfig.ts`

规则策略配置：

- `useRealisticRuleStyle`：偏真实规则
- `allowWeakAimAssist`：启用弱辅助
- `demoMode`：启用 Demo 模式
- `enableAi`：是否启用 AI，当前为 `false`

### `src/config/RenderConfig.ts`

渲染占位配置：

- 背景色
- 球桌色
- 库边色
- HUD 文字色

### `src/config/AssetConfig.ts`

占位资源配置：

- 是否启用占位资源
- 球桌与球杆资源占位标识

## 如何运行项目

### 1. 安装依赖

```bash
npm install
```

### 2. 运行测试

```bash
npm test
```

### 3. 构建项目

```bash
npm run build
```

构建产物会输出到 `dist/`。

### 3.1 在 Web 模式试玩（dev:web）

```bash
npm run dev:web
```

打开 `http://127.0.0.1:5173/` 后可直接使用鼠标操作：

1. 点击右上角 `开始对局`
2. 在球桌区域按下鼠标并拖动（瞄准 + 蓄力）
3. 释放鼠标完成出杆
4. `Esc` 或右键可取消当前蓄力
5. 右上角可点击 `重开`、`返回菜单`

### 3.2 构建 Web 静态站点（用于 GitHub Pages）

> 说明：Web 静态站点产物会输出到 `dist-web/`，与小游戏 `dist/` 产物解耦。

```bash
npm run build:web
```

默认按 GitHub Pages 项目页子路径构建（`/billiard_game/`）。如果你 fork 后仓库名不同，可用环境变量覆盖：

```bash
BASE_PATH="/<your-repo-name>/" npm run build:web
```

本地预览（可选）：

```bash
npx vite preview --host 127.0.0.1 --port 4173
```

### 3.3 GitHub Pages 在线试玩

当 `main` 分支合并后会自动构建并部署到 GitHub Pages。

- 项目页地址：`https://maxjchuang.github.io/billiard_game/`
- 支持刷新/深链访问：Pages 通过 `404.html` 回退到入口页，保证 SPA 入口可加载

### 4. 在微信开发者工具中运行

1. 打开微信开发者工具
2. 导入当前项目根目录
3. 当前 `project.config.json` 使用的是测试号配置：`touristappid`
4. 执行一次 `npm run build`
5. 确保 `game.js` 会加载 `dist/game.js`
6. 在开发者工具中运行与调试

注意：

- 当前项目默认按测试号 / Demo 模式开发
- 若后续切换正式小游戏，需要替换 `project.config.json` 中的 `appid`

## 如何开发

### 开发原则

- 遵循 TDD：先写测试，再写实现，再修复失败测试
- 所有新增核心逻辑都必须有测试覆盖
- 所有新增功能模块必须带链路日志
- 规则不要写进渲染层
- 物理不要写进 UI 层
- 输入不要直接改对局结果

### 推荐开发步骤

1. 先补测试文件到 `tests/`
2. 再在 `src/` 中实现模块
3. 运行 `npm test`
4. 运行 `npm run build`
5. 在微信开发者工具中验证运行结果

### 常用命令

```bash
npm install
npm test
npm run build
npm run test:watch
```

## 测试说明

当前测试覆盖以下模块：

- 状态机：`tests/core/StateMachine.test.ts`
- 固定步长循环：`tests/core/FixedStepLoop.test.ts`
- 场景管理：`tests/core/SceneManager.test.ts`
- 输入与手势：`tests/input/*.test.ts`
- 向量与物理世界：`tests/physics/*.test.ts`
- 对局状态、规则、回合、出杆：`tests/gameplay/*.test.ts`
- 平台适配与存储：`tests/platform/*.test.ts`

## 当前 Demo 的已实现范围

当前已经实现：

- 基础工程结构
- 配置体系
- 基础状态机
- 固定步长循环
- 球体基础物理
- 首碰与落袋事件记录
- 简化规则判断
- 回合结算
- 占位渲染结构
- 微信平台适配骨架
- 测试与构建链路

当前尚未完整实现：

- 真正可交互的完整触控 UI
- 更完整的球桌布局与摆球规则
- 精细瞄准和力度拖拽交互
- 更真实的台球规则细节
- 美术资源替换
- 商业化能力

## 相关设计文档

- 技术方案：`spec/billiard_game_technical_design.md`
- 技术架构：`spec/billiard_game_architecture_design.md`

## 后续建议

下一阶段建议优先做：

1. 接通真实触控出杆链路
2. 完善球桌与摆球布局
3. 增强 `MatchScene` 的真实对局渲染
4. 增加更多规则测试与物理边界测试
5. 在微信开发者工具中完成首轮真机调试
