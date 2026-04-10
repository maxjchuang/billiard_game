# 台球游戏方案 A：浏览器可调试运行时技术实现方案

## 1. 文档目的

本文档定义本项目的“方案 A”技术路线：**通过运行时抽象与平台适配层解耦，使项目既能运行在微信小游戏环境，也能运行在浏览器环境**，从而降低日常调试成本，提高开发效率。

该方案的核心目标不是替代微信小游戏真机验证，而是建立一个**浏览器本地开发壳（Browser Debug Shell）**，用于完成绝大多数逻辑开发、日志观察、测试联调与渲染调试。

## 2. 问题定义

当前项目虽然目标平台是微信小游戏，但如果强绑定微信开发者工具，会带来以下问题：

- 日常调试链路较重，启动与迭代速度慢
- 浏览器 DevTools 无法直接用于核心逻辑断点调试
- 前端渲染、输入、状态流排查效率不高
- 自动化调试与本地可视化验证能力不足
- 平台 API 与业务逻辑耦合后，后续扩展成本高

因此，方案 A 的核心判断是：

**项目不应强绑定只能在微信开发者工具中运行。**

正确做法是：

- 微信小游戏继续作为正式目标运行时
- 浏览器环境作为开发调试运行时
- 两者共享同一套核心业务逻辑、物理逻辑、规则逻辑与测试体系

## 3. 方案 A 总体思路

### 3.1 核心思路

通过“平台能力抽象 + 双入口启动 + 浏览器适配器”实现双运行时：

1. 把微信平台 API 从业务代码中抽离出来
2. 定义统一的平台抽象接口
3. 为微信小游戏实现 `WxPlatformAdapter`
4. 为浏览器实现 `BrowserPlatformAdapter`
5. 把 `GameApp` 改为依赖抽象接口，而不是直接依赖 `wx`
6. 分别提供小游戏入口与浏览器入口

### 3.2 方案收益

- 浏览器中可直接运行游戏原型
- 可以使用浏览器开发者工具调试渲染、状态、输入和日志
- 可以在不打开微信开发者工具的情况下完成大量开发工作
- 平台相关问题被隔离到适配层，主逻辑更纯净
- 更利于单元测试、集成测试和后续 CI 扩展

## 4. 目标与非目标

### 4.1 本方案目标

- 让项目在浏览器中可运行
- 保持核心逻辑对微信小游戏与浏览器双端共享
- 浏览器端支持基础输入、渲染、日志与对局调试
- 后续代码开发优先在浏览器完成，再回归微信环境验证
- 保持当前 TDD 和日志体系不被破坏

### 4.2 本方案非目标

- 不要求浏览器环境 100% 模拟微信小游戏全部 API
- 不要求浏览器版本直接替代真机测试
- 不在本方案内接入云能力、支付、广告、分享等微信专属能力
- 不在本方案内实现正式发布流程

## 5. 架构设计

### 5.1 设计原则

方案 A 必须遵守以下原则：

- **核心逻辑跨平台共享**：物理、规则、状态机、渲染逻辑不复制两套
- **平台能力边界清晰**：所有平台相关 API 统一收敛到 `platform/`
- **入口分离**：小游戏入口和浏览器入口独立
- **配置可切换**：运行时通过配置选择平台模式
- **日志一致**：浏览器与微信侧使用统一日志接口
- **测试优先**：新增跨平台抽象必须先有测试

### 5.2 推荐目录调整

在现有工程基础上，建议演进为如下结构：

```text
src/
  app/
    createGameApp.ts
  bootstrap/
    bootstrapWx.ts
    bootstrapBrowser.ts
  platform/
    types/
      PlatformAdapter.ts
      PlatformCanvas.ts
      PlatformInput.ts
    wx/
      WxPlatformAdapter.ts
      WxCanvasAdapter.ts
      WxInputAdapter.ts
    browser/
      BrowserPlatformAdapter.ts
      BrowserCanvasAdapter.ts
      BrowserInputAdapter.ts
      BrowserMount.ts
  game/
  core/
  gameplay/
  physics/
  render/
  input/
  shared/
```

其中：

- `bootstrap/`：放不同运行时的启动入口
- `platform/types/`：平台抽象接口定义
- `platform/wx/`：微信小游戏实现
- `platform/browser/`：浏览器实现
- `app/createGameApp.ts`：统一创建 `GameApp` 的工厂

## 6. 关键抽象设计

### 6.1 平台适配器总接口

建议抽象一个统一平台接口：

```ts
export interface PlatformAdapter {
  getSystemInfo(): PlatformSystemInfo
  createCanvas(): PlatformCanvas
  createInputSource(): PlatformInputSource
  createStorage(): StoragePort
  createAudio(): AudioPort
  createDevice(): DevicePort
  getRuntimeName(): 'wx' | 'browser'
}
```

目的：

- `GameApp` 只依赖 `PlatformAdapter`
- 不再直接读取全局 `wx`
- 浏览器与微信运行时在同一个装配点注入不同实现

### 6.2 Canvas 抽象

当前项目中 `Renderer` 直接使用 `CanvasRenderingContext2D`，这本身对浏览器很友好；小游戏环境也具备兼容的 2D Canvas 概念，因此重点不是重写渲染器，而是统一 Canvas 获取方式。

建议抽象：

```ts
export interface PlatformCanvas {
  getContext2D(): CanvasRenderingContext2D
  resize(width: number, height: number): void
  getSize(): { width: number; height: number }
}
```

### 6.3 输入抽象

浏览器与微信小游戏最大的差异之一是输入事件来源。

建议新增统一输入源抽象：

```ts
export interface PlatformInputSource {
  onPointerDown(handler: PointerHandler): void
  onPointerMove(handler: PointerHandler): void
  onPointerUp(handler: PointerHandler): void
}
```

映射关系：

- 微信小游戏：触摸事件 -> `PlatformInputSource`
- 浏览器：`pointerdown / pointermove / pointerup` -> `PlatformInputSource`

## 7. Browser Debug Shell 设计

### 7.1 浏览器调试壳职责

浏览器调试壳不是新的游戏版本，而是本地开发宿主，负责：

- 在页面上挂载 Canvas
- 提供浏览器侧输入源
- 提供浏览器侧本地存储实现
- 显示运行时日志
- 提供开发调试按钮

### 7.2 建议能力

浏览器调试壳建议至少提供：

- 挂载游戏画布
- 显示当前运行时状态
- 一键开始对局
- 一键重开
- 输出链路日志
- 可选显示 FPS / 当前状态机状态 / 当前回合信息

### 7.3 页面结构建议

浏览器调试页面可分成三个区域：

1. 游戏画布区
2. 调试信息区
3. 日志输出区

## 8. 启动链路设计

### 8.1 微信小游戏入口

小游戏入口继续保留：

- `game.js`
- `src/game.ts` 或 `src/bootstrap/bootstrapWx.ts`

小游戏启动时：

1. 创建 `WxPlatformAdapter`
2. 调用 `createGameApp(platformAdapter)`
3. 启动游戏

### 8.2 浏览器入口

新增浏览器入口，例如：

- `src/bootstrap/bootstrapBrowser.ts`

浏览器启动时：

1. 创建 DOM 容器和 Canvas
2. 创建 `BrowserPlatformAdapter`
3. 调用 `createGameApp(platformAdapter)`
4. 把画布挂到页面
5. 启动固定步长循环

### 8.3 统一装配工厂

建议新增：

- `src/app/createGameApp.ts`

该工厂负责：

- 注入平台适配器
- 注入 logger
- 注入 renderer 所需上下文
- 返回已组装完成的 `GameApp`

好处：

- 微信和浏览器共用一套装配逻辑
- 平台差异集中在适配器构造阶段

## 9. 对现有代码的落地改造建议

### 9.1 `GameApp` 改造点

当前 `GameApp` 在 `src/game/GameApp.ts` 中直接实例化 `WxAdapter`。这会造成运行时绑定。

建议修改为：

- 通过构造函数接收 `PlatformAdapter`
- 不再读取全局 `wx`
- `boot()` 内部只调用平台抽象接口

改造前思路：

- `new WxAdapter((globalThis as ...).wx, logger)`

改造后思路：

- `new GameApp(platformAdapter, logger)`

### 9.2 `WxAdapter` 改造点

当前 `WxAdapter` 只封装了极少的平台能力，可保留其基础实现，但需要升级为正式的 `WxPlatformAdapter`，并补齐：

- Canvas 获取
- 系统信息
- 输入源桥接
- 存储服务
- 音频服务
- 设备能力服务

### 9.3 新增 `BrowserPlatformAdapter`

浏览器实现建议提供：

- `document.createElement('canvas')`
- `window.innerWidth / innerHeight`
- `localStorage`
- DOM Pointer Events
- 浏览器控制台日志
- 可选浏览器振动降级实现

### 9.4 `InputManager` 改造点

当前 `InputManager` 更像一个意图队列，还没有真正和平台事件接通。

建议改造为：

- 接收 `PlatformInputSource`
- 在平台事件与意图之间做统一转换
- 支持浏览器鼠标 / 触控调试

### 9.5 `Renderer` 改造点

`Renderer` 本身跨平台成本较低，原则上无需拆两套。

只需要保证：

- Canvas 由平台层提供
- 渲染上下文获取方式统一
- 页面挂载与尺寸变化由浏览器适配器负责

## 10. 构建与开发链路设计

### 10.1 当前问题

当前项目只有 TypeScript 构建，适合小游戏输出，但不适合浏览器快速调试。

### 10.2 方案 A 推荐开发链路

建议拆成两条开发链路：

#### 1）小游戏链路

- `npm run build`
- 微信开发者工具打开项目
- 调试小游戏运行结果

#### 2）浏览器链路

- `npm run dev:web`
- 本地启动浏览器开发服务器
- 在浏览器中完成逻辑联调

### 10.3 推荐工具方案

浏览器调试推荐引入轻量 dev server，例如：

- `Vite`

原因：

- 启动快
- 支持 TS
- 浏览器热更新体验好
- 易于挂载调试页面

### 10.4 推荐脚本

后续建议新增：

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "dev:web": "vite",
    "build:web": "vite build"
  }
}
```

## 11. 测试策略

方案 A 引入后，测试要覆盖以下内容：

### 11.1 平台无关测试

继续测试：

- 状态机
- 物理系统
- 规则系统
- 回合结算
- 输入意图转换

### 11.2 平台适配层测试

新增测试：

- `BrowserPlatformAdapter`
- `WxPlatformAdapter`
- `PlatformInputSource` 事件转换
- Canvas 尺寸同步逻辑

### 11.3 浏览器联调验证

至少验证：

- 浏览器页面可正常挂载 Canvas
- 可以开始一局
- 可以完成一次基础出杆
- 日志可见
- 不依赖 `wx` 也能正常运行

## 12. 日志设计要求

方案 A 不能破坏当前“完整链路日志”的要求，反而要加强：

- 启动时打印运行时类型：`wx` / `browser`
- 平台适配器打印初始化日志
- 浏览器输入桥打印输入事件映射日志
- Canvas 创建与尺寸更新打印日志
- 关键状态切换与对局结算继续打印日志

建议新增日志范围：

- `BrowserPlatformAdapter`
- `BrowserInputAdapter`
- `BrowserMount`
- `createGameApp`
- `bootstrapBrowser`

## 13. 分阶段落地计划

### Phase 1：抽象平台接口

目标：去掉 `GameApp` 对 `wx` 的直接依赖。

任务：

- 定义 `PlatformAdapter`
- 改造 `GameApp` 构造函数
- 改造 `WxAdapter` 为平台接口实现
- 保证原微信小游戏链路不回归

### Phase 2：补浏览器运行时

目标：在浏览器中跑通最小启动链路。

任务：

- 新增 `BrowserPlatformAdapter`
- 新增浏览器入口
- 新增调试页
- 浏览器中显示标题页与球桌占位画面

### Phase 3：补浏览器输入调试

目标：浏览器中可完成基础对局调试。

任务：

- 接入浏览器 pointer 事件
- 接通 `InputManager`
- 支持开始对局与基础出杆
- 显示运行时日志与当前状态

### Phase 4：统一开发工作流

目标：形成“双端开发 + 单套逻辑”的稳定工作流。

任务：

- 增加 `dev:web`
- 优化 README 和开发说明
- 增加跨平台测试
- 明确“浏览器开发，微信回归验证”的团队流程

## 14. 风险与注意事项

### 14.1 浏览器和微信 Canvas 行为差异

风险：

- 字体、尺寸、像素比、事件行为可能略有差异

策略：

- 浏览器作为高效调试环境
- 微信开发者工具和真机作为最终回归环境

### 14.2 平台抽象过度设计

风险：

- 为了跨平台而抽象过多，导致开发复杂度上升

策略：

- 只抽象当前真实需要的平台能力
- 不做无用接口

### 14.3 两套入口产生偏差

风险：

- 小游戏入口和浏览器入口逻辑分叉

策略：

- 装配逻辑统一走 `createGameApp`
- 两端只在“平台注入”和“挂载方式”上不同

## 15. 最终结论

方案 A 的结论非常明确：

**本项目不应强绑定只能在微信开发者工具中运行。**

最合理的工程实践是：

- 继续以微信小游戏作为正式目标平台
- 增加浏览器可调试运行时作为开发壳
- 通过平台适配层把运行时差异隔离出去
- 保持核心逻辑、日志体系、测试体系完全共享

这样可以显著提升后续代码实现效率，并且不会破坏项目当前的架构方向。

## 16. 直接指导后续代码实现的落地清单

下一步编码建议严格按以下顺序执行：

1. 新增 `PlatformAdapter` 接口
2. 改造 `GameApp`，去除对全局 `wx` 的直接依赖
3. 把当前 `WxAdapter` 升级为 `WxPlatformAdapter`
4. 新增 `BrowserPlatformAdapter`
5. 新增浏览器入口 `bootstrapBrowser.ts`
6. 接入浏览器 Canvas 挂载
7. 接入浏览器输入桥
8. 增加浏览器端日志面板
9. 补平台适配层测试
10. 增加 `dev:web` 脚本并形成新的开发流程

该清单可直接作为后续实现任务拆解基础。
