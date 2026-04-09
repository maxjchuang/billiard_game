# 微信小游戏台球游戏技术架构设计（Demo 落地版）

## 1. 文档目的

本文档是 `spec/billiard_game_technical_design.md` 的落地实现补充版，重点不是描述产品方向，而是直接指导代码结构、模块职责、数据流、状态流与开发顺序。

本文档默认以下前提已确认：

- 目标平台：微信小游戏
- 目标阶段：原型 Demo
- 核心玩法：简化 8 球单机对局
- 不实现 AI、不联网、不接商业化
- 横屏
- 偏真实规则
- 弱辅助
- 资源采用极简占位图
- 技术路线：`TypeScript + 微信小游戏原生 Canvas 2D`

## 2. Demo 实现目标

### 2.1 功能性目标

Demo 阶段必须打通以下完整闭环：

1. 启动小游戏并进入标题页
2. 开始一局简化 8 球对局
3. 玩家可以瞄准并出杆
4. 球体完成移动、碰撞、反弹、落袋
5. 所有球静止后触发规则结算
6. 可以进入下一回合或结束整局
7. 可以重开一局或返回标题页

### 2.2 非目标

当前阶段明确不做：

- AI 决策系统
- 多人联网
- 完整资源管理后台
- 正式支付、广告、分享
- 服务端交互
- 云开发依赖
- 高级杆法与旋转系统
- 高级轨迹预测

## 3. 总体架构原则

### 3.1 架构原则

为保证 Demo 可快速落地，整体设计采用以下原则：

- **单向依赖**：上层调用下层，下层不反向依赖上层
- **状态收敛**：核心对局状态只允许通过 `GameSession` 与状态机推进
- **物理独立**：物理计算不依赖渲染层
- **渲染无业务**：渲染层只读状态，不写规则
- **输入无裁判**：输入层只产出用户意图，不直接修改球局结果
- **配置前置**：关键物理参数、规则参数全部走配置
- **易替换资源**：占位图方案不能绑死具体美术资源命名

### 3.2 推荐工程结构

```text
src/
  main.ts
  game/
    GameApp.ts
    GameBootstrap.ts
  core/
    loop/
      FixedStepLoop.ts
    fsm/
      StateMachine.ts
      GameState.ts
    scene/
      SceneManager.ts
    event/
      EventBus.ts
  gameplay/
    session/
      GameSession.ts
      TableState.ts
      TurnState.ts
    rules/
      RuleEngine.ts
      RuleTypes.ts
      FoulDetector.ts
      WinJudge.ts
    flow/
      ShotResolver.ts
      RoundResolver.ts
  physics/
    PhysicsWorld.ts
    body/
      BallBody.ts
    collision/
      CollisionDetector.ts
      CollisionResolver.ts
      PocketResolver.ts
    math/
      Vector2.ts
      MathUtil.ts
  render/
    Renderer.ts
    layers/
      TableRenderer.ts
      BallRenderer.ts
      CueRenderer.ts
      UIRenderer.ts
  input/
    InputManager.ts
    gesture/
      AimController.ts
      PowerController.ts
  platform/
    wx/
      WxAdapter.ts
      StorageService.ts
      AudioService.ts
      DeviceService.ts
  config/
    GameConfig.ts
    PhysicsConfig.ts
    RuleConfig.ts
    RenderConfig.ts
    AssetConfig.ts
  assets/
    images/
    audio/
```

说明：

- `game/` 负责应用级装配
- `core/` 负责生命周期、场景、状态机和主循环
- `gameplay/` 负责规则与对局业务
- `physics/` 负责所有球体运动与碰撞
- `render/` 负责绘制
- `input/` 负责触控意图解析
- `platform/` 负责微信 API 封装
- `config/` 负责可调参数集中管理

## 4. 模块职责设计

### 4.1 `GameApp`

`GameApp` 是全局应用入口对象，负责：

- 初始化微信平台能力
- 初始化配置
- 创建主循环
- 创建场景与状态机
- 启动首个场景

建议职责边界：

- 不直接写规则逻辑
- 不直接参与每帧物理计算
- 只负责组装依赖和驱动启动

### 4.2 `SceneManager`

场景管理器只关心页面级切换，不关心球局细节。

Demo 阶段建议只保留 3 个场景：

- `MenuScene`
- `MatchScene`
- `ResultScene`

每个场景至少实现：

- `enter()`
- `update(dt)`
- `render(ctx)`
- `exit()`

### 4.3 `GameSession`

`GameSession` 是整局对局唯一真实业务状态容器，负责维护：

- 当前球桌状态
- 当前回合
- 当前玩家占位信息
- 分组状态
- 当前允许击打的球型
- 本杆是否已发生首碰
- 本杆进袋结果
- 本杆是否犯规
- 当前是否结束
- 胜负结果

约束：

- UI 不允许直接修改 `GameSession`
- 输入层不允许直接修改 `GameSession`
- 只有 `RuleEngine`、`RoundResolver`、`ShotResolver` 可以推进对局业务状态

### 4.4 `PhysicsWorld`

`PhysicsWorld` 是对局中所有球体的物理容器，负责：

- 维护活动球列表
- 推进球体运动
- 执行碰撞检测与响应
- 处理边界反弹
- 处理袋口落袋
- 统计本帧物理事件

产出内容：

- 球碰撞事件
- 球落袋事件
- 首碰对象记录
- 是否全部静止

### 4.5 `RuleEngine`

`RuleEngine` 不做物理更新，只消费物理结果，负责：

- 判定首碰是否合法
- 判定本杆是否犯规
- 判定是否续杆或换手
- 判定是否分组
- 判定黑八是否合法结束
- 生成回合结算结果

### 4.6 `Renderer`

渲染器负责从 `GameSession + PhysicsWorld + InputManager` 读取当前只读状态，然后绘制：

- 球桌
- 球体
- 球杆
- 辅助线
- HUD
- 结算信息

渲染器不能：

- 改写球速度
- 改写回合结果
- 直接触发规则判定

### 4.7 `InputManager`

输入管理器负责将微信触摸事件转换成统一的游戏输入意图：

- 开始瞄准
- 更新瞄准角度
- 开始蓄力
- 更新力度
- 确认出杆
- 点击 UI 按钮

输入层只发意图，不直接操作球体位置与速度。

## 5. 核心数据模型

### 5.1 `BallBody`

建议字段：

```ts
interface BallBody {
  id: number
  type: 'cue' | 'solid' | 'stripe' | 'black'
  number: number
  radius: number
  mass: number
  position: Vector2
  velocity: Vector2
  active: boolean
  pocketed: boolean
}
```

说明：

- `active=false` 表示该球当前不参与物理更新
- `pocketed=true` 表示该球已落袋
- Demo 阶段可以不加入真实旋转字段，后续再扩展

### 5.2 `TableState`

建议字段：

```ts
interface TableState {
  balls: BallBody[]
  cueBallId: number
  blackBallId: number
  shotCount: number
  allStopped: boolean
}
```

### 5.3 `TurnState`

```ts
interface TurnState {
  currentPlayer: 1 | 2
  targetGroup: 'solid' | 'stripe' | 'unassigned'
  cueBallInHand: boolean
  keepTurn: boolean
  foul: boolean
}
```

### 5.4 `ShotContext`

`ShotContext` 用于承载一杆内的临时事件，建议每次出杆开始时重置。

```ts
interface ShotContext {
  firstHitBallId: number | null
  pocketedBallIds: number[]
  cueBallPocketed: boolean
  blackBallPocketed: boolean
  railHitAfterContact: boolean
  foulReasons: string[]
}
```

### 5.5 `RoundResult`

```ts
interface RoundResult {
  foul: boolean
  foulReasons: string[]
  keepTurn: boolean
  nextPlayer: 1 | 2
  gameOver: boolean
  winner: 1 | 2 | null
}
```

## 6. 状态机设计

### 6.1 顶层状态机

Demo 阶段建议顶层状态枚举：

```ts
type GameState =
  | 'boot'
  | 'menu'
  | 'aiming'
  | 'powering'
  | 'shooting'
  | 'ballsMoving'
  | 'roundSettlement'
  | 'result'
```

### 6.2 状态迁移

推荐迁移关系：

- `boot -> menu`
- `menu -> aiming`
- `aiming -> powering`
- `powering -> shooting`
- `shooting -> ballsMoving`
- `ballsMoving -> roundSettlement`
- `roundSettlement -> aiming`
- `roundSettlement -> result`
- `result -> menu`

约束：

- `ballsMoving` 状态必须屏蔽出杆输入
- `roundSettlement` 状态不允许继续推进物理出杆
- `result` 状态只允许响应重开与返回菜单

### 6.3 状态职责

- `boot`：初始化平台、资源、配置
- `menu`：标题页与开始按钮
- `aiming`：更新方向瞄准
- `powering`：更新力度值
- `shooting`：把力度与角度转换为母球初速度
- `ballsMoving`：交给物理世界持续模拟
- `roundSettlement`：执行业务结算
- `result`：显示胜负并等待用户操作

## 7. 运行时数据流

### 7.1 单帧调用顺序

每帧建议按下面的固定顺序执行：

1. 采集平台输入
2. `InputManager` 生成意图
3. 状态机根据当前状态决定是否消费意图
4. 如果当前状态允许出杆，则更新 `AimController/PowerController`
5. 如果进入 `shooting`，由 `ShotResolver` 创建本杆初始速度
6. `PhysicsWorld.step(fixedDt)` 推进物理
7. 收集碰撞与落袋事件写入 `ShotContext`
8. 所有球静止后，`RoundResolver` 调用 `RuleEngine` 结算
9. 根据 `RoundResult` 更新 `GameSession`
10. `Renderer.render()` 统一绘制

### 7.2 关键原则

- 输入先于状态机消费
- 物理先于规则结算
- 规则先于 UI 结果展示
- 渲染始终排在最后

## 8. 出杆链路设计

### 8.1 瞄准阶段

瞄准阶段只维护两个值：

- `aimAngle`
- `powerPercent`

建议放在 `AimController` 与 `PowerController` 中，而不是直接放在 `Renderer`。

### 8.2 出杆触发

当玩家完成蓄力并确认出杆后：

1. 从 `aimAngle` 和 `powerPercent` 计算单位方向向量
2. 结合 `PhysicsConfig.maxCueSpeed` 得到母球初速度
3. 写入母球 `velocity`
4. 重置当前杆的 `ShotContext`
5. 状态切换到 `ballsMoving`

### 8.3 出杆参数建议

```ts
cueVelocity = direction.normalized() * maxCueSpeed * powerPercent
```

Demo 阶段建议先使用线性力度曲线；若手感不佳，再考虑非线性曲线：

- `powerPercent ^ 1.2`
- `powerPercent ^ 1.4`

## 9. 物理系统实现建议

### 9.1 更新顺序

每个物理子步建议执行：

1. 根据速度更新位置
2. 应用摩擦衰减
3. 检测球与库边碰撞
4. 检测球与球碰撞
5. 检测球与袋口关系
6. 低速归零
7. 判断是否所有球停止

### 9.2 碰撞记录

为了支持规则判断，物理层需要把“事件”上报，而不是只做结果更新。

至少要记录：

- 第一颗被母球碰到的球
- 落袋球 ID
- 母球是否落袋
- 黑八是否落袋
- 是否发生过碰库

### 9.3 Demo 阶段的精度策略

为了降低复杂度，Demo 阶段采用以下取舍：

- 不做连续碰撞预测
- 不做复杂旋转
- 不做塞球偏移
- 使用固定迭代次数处理重叠修正

### 9.4 关键可调参数

建议集中放在 `PhysicsConfig.ts`：

```ts
export const PhysicsConfig = {
  fixedDt: 1 / 120,
  ballRadius: 10,
  ballMass: 1,
  friction: 0.985,
  minVelocity: 0.02,
  railRestitution: 0.92,
  ballRestitution: 0.98,
  pocketCaptureRadius: 18,
  maxCueSpeed: 38,
}
```

## 10. 规则系统实现建议

### 10.1 建议拆分

- `RuleEngine`：统一对外规则入口
- `FoulDetector`：负责犯规检测
- `WinJudge`：负责胜负判断
- `RoundResolver`：负责把物理事件转成回合结果

### 10.2 规则判断顺序

一杆结束后建议按以下顺序判定：

1. 母球是否落袋
2. 首碰是否合法
3. 是否有目标球进袋
4. 是否发生分组确定
5. 黑八是否落袋
6. 是否犯规
7. 是否续杆
8. 是否结束整局

### 10.3 Demo 阶段简化规则约定

为了更快落地，建议采用下面的简化规则约定：

- 开球后首次合法进球决定分组
- 未分组前击中任意非黑八目标球视为合法
- 犯规后下一回合 `cueBallInHand=true`
- 黑八必须在己方目标球全部清空后合法打进
- 非法打进黑八直接判负

## 11. 渲染系统实现建议

### 11.1 渲染层次

建议渲染按以下顺序绘制：

1. 背景色
2. 球桌主体
3. 球袋
4. 球影
5. 球体
6. 球杆
7. 辅助线
8. 顶部 HUD
9. 结算浮层

### 11.2 Demo 资源策略

Demo 阶段建议所有资源都可替换：

- 球桌：先用纯色矩形 + 袋口圆形绘制
- 球体：先用颜色区分全色、花色、黑八、母球
- 球杆：先用简单矩形/线段绘制
- HUD：先用原生文本绘制

这样可避免在逻辑未稳定前被资源制作阻塞。

### 11.3 渲染接口建议

```ts
interface Renderer {
  render(sceneState: RenderSceneState): void
}
```

其中 `RenderSceneState` 是由 `MatchScene` 统一组织后的只读快照，不建议让各个渲染器直接相互读取底层对象。

## 12. 输入系统实现建议

### 12.1 触控映射

建议把触控分两类：

- 场景触控：用于瞄准、蓄力、出杆
- UI 触控：用于开始、重开、返回

### 12.2 输入事件抽象

```ts
type InputIntent =
  | { type: 'aimStart'; x: number; y: number }
  | { type: 'aimMove'; x: number; y: number }
  | { type: 'aimEnd' }
  | { type: 'powerStart'; x: number; y: number }
  | { type: 'powerMove'; x: number; y: number }
  | { type: 'shoot' }
  | { type: 'clickStartGame' }
  | { type: 'clickRestart' }
  | { type: 'clickBackMenu' }
```

### 12.3 输入约束

- 所有输入都必须先经过状态校验
- UI 区域优先级高于球桌区域
- 移动端误触必须通过拖拽阈值做过滤

## 13. 平台封装建议

### 13.1 `WxAdapter`

用于隔离微信 API 与业务逻辑。

建议封装：

- `onShow/onHide`
- 屏幕信息获取
- Canvas 获取
- 存储读写
- 音频播放
- 振动调用

### 13.2 测试号开发策略

当前阶段采用测试号开发，因此平台层约束如下：

- 不依赖正式上线能力
- 不依赖商业化接口
- 不依赖服务端登录态
- 项目配置层只预留正式 `AppID` 替换入口

## 14. 配置设计

所有关键参数不得散落在业务代码中。

建议配置拆分如下：

- `GameConfig.ts`：游戏基础设置
- `PhysicsConfig.ts`：物理参数
- `RuleConfig.ts`：规则参数
- `RenderConfig.ts`：渲染尺寸与颜色
- `AssetConfig.ts`：资源映射

### 14.1 示例

```ts
export const RuleConfig = {
  useRealisticRuleStyle: true,
  allowWeakAimAssist: true,
  demoMode: true,
  enableAi: false,
}
```

## 15. 推荐开发顺序

### 第一步：搭基础运行骨架

- 初始化微信小游戏入口
- 接通 Canvas
- 跑通 `GameApp`
- 跑通 `SceneManager`
- 在屏幕上渲染一个空球桌

### 第二步：搭单球物理

- 实现 `Vector2`
- 实现 `BallBody`
- 实现单球移动
- 实现库边反弹
- 实现停球逻辑

### 第三步：搭出杆输入

- 实现瞄准
- 实现蓄力
- 实现母球出杆
- 渲染弱辅助线

### 第四步：搭多球物理

- 加入完整球组初始化
- 支持球与球碰撞
- 支持落袋
- 支持物理事件记录

### 第五步：搭规则系统

- 实现 `ShotContext`
- 实现 `RuleEngine`
- 实现犯规与回合切换
- 实现黑八结算

### 第六步：搭页面闭环

- 标题页
- 对局页 HUD
- 结算页
- 重开与返回菜单

## 16. 测试建议

### 16.1 单元测试优先级

优先测试：

- `Vector2`
- 碰撞响应
- 停球判定
- 犯规判定
- 胜负判定

### 16.2 人工验证清单

必须人工验证：

- 母球出杆方向是否准确
- 弱辅助线是否只显示基础方向
- 球是否会明显穿模
- 黑八规则是否按预期结算
- 犯规后是否正确切换回合
- 横屏布局是否稳定

## 17. 后续演进预留点

当前架构需为以下能力留扩展点：

- `PlayerController` 扩展为本地双人或 AI
- `PlatformService` 扩展为正式 `AppID`、分享、广告
- `RenderAssetLoader` 扩展为正式美术资源
- `RuleEngine` 扩展为更完整的真实规则
- `PhysicsWorld` 扩展为旋转与杆法系统

## 18. 结论

这份架构设计的核心目的，是把 Demo 阶段的实现拆成可直接编码的模块边界与数据流。

在实际编码时，应严格遵守以下三条：

1. 规则不写进渲染层
2. 物理不写进 UI 层
3. 输入不直接改对局结论

只要维持这三条边界，后续从 Demo 过渡到正式版时，代码重构成本会明显更低。
