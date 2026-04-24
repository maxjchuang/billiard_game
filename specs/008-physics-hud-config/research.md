# Research: 物理参数实时 HUD 配置

## Decision 1: 运行时物理配置的唯一数据源

**Decision**: 以 `PhysicsConfig` 默认值为初始来源，在应用层维护一份可变的运行时配置对象，并将其作为同一引用注入 `PhysicsWorld` 与 `ShotResolver`。

**Rationale**: 当前代码同时存在“直接导入配置单例”和“通过 `config` 注入依赖”两种模式。若继续由 DOM 层直接改全局单例，容易造成测试串扰，也难以保证物理层、渲染层和 HUD 状态始终一致。应用层持有单一运行时配置，可将校验、日志、重置与默认值对比统一收口。

**Alternatives considered**:

- 直接在 HUD 中修改 `PhysicsConfig` 模块导出的全局对象  
  - Rejected because it weakens ownership boundaries and increases hidden coupling across tests and runtime.
- 每次参数变化都重建整个 `GameApp`  
  - Rejected because it is too heavy for real-time tuning and breaks the “stay in the same play session” goal.

## Decision 2: HUD 交互载体采用 Web DOM 叠层

**Decision**: 在 `src/web/ui/WebHudOverlay.ts` 上扩展交互式 DOM 调试面板，Canvas HUD 仅保留文本展示职责，不承载表单控件。

**Rationale**: 当前项目已经存在 `WebHudOverlay` / `WebControls` 的 DOM 叠层模式，适合承载滑杆、数值输入、错误提示和重置按钮。若把交互控件放进 Canvas HUD，会显著增加命中测试、输入管理和可维护性复杂度。

**Alternatives considered**:

- 在 `UIRenderer` 中绘制伪控件并手工处理点击  
  - Rejected because it introduces custom UI hit-testing into the render layer and violates the current layering direction.
- 新建独立 Web 调试页面而非叠层 HUD  
  - Rejected because it breaks the requirement that users tune physics without leaving the active game screen.

## Decision 3: 参数按生效方式分组，而不是一刀切即时应用

**Decision**: 将受支持参数划分为三类生效模式：
- `immediate`：下一物理步即可使用的新值（如 `friction`、`minVelocity`、`ballRestitution`、`railRestitution`）
- `next-shot`：对下一次出杆计算生效（如 `maxCueSpeed`）
- `layout-refresh`：更新值后需同步刷新布局缓存与 pocket/rail 派生数据（如 `railThickness`、`pocketCaptureRadius`）

**Rationale**: 当前 `PhysicsWorld` 在构造阶段缓存了 table layout 与 pocket 数据，而 `TableRenderer` 每帧会重新读取配置。若对所有参数都简单写入同一个对象，会产生“渲染已更新、物理未更新”的不一致。显式区分生效模式可以避免同步语义模糊。

**Alternatives considered**:

- 所有参数都按“立即生效”处理  
  - Rejected because geometry-related parameters already have cached physics derivations.
- 仅支持非几何参数，跳过 `railThickness` / `pocketCaptureRadius`  
  - Rejected because the current feature scope expects the supported runtime-tunable physics set to remain coherent for end users.

## Decision 4: 参数元数据采用描述符驱动

**Decision**: 为每个受支持参数定义参数描述符，至少包含键名、显示名称、默认值、最小值、最大值、步进值、分组和生效模式。

**Rationale**: 描述符可以让 HUD 渲染、输入校验、dirty 状态标识和重置逻辑共享同一份元信息，避免在 UI、应用层、测试中重复写规则。

**Alternatives considered**:

- 在 HUD 组件内手写每个参数的控件和校验规则  
  - Rejected because it duplicates business rules and makes future parameter additions error-prone.
- 仅依赖 `PhysicsConfig` 当前键值而无额外元数据  
  - Rejected because range, step, label and apply semantics are not encoded in the raw config object.

## Decision 5: 首版不做持久化，仅保证会话内实时调参闭环

**Decision**: 运行时 HUD 仅在当前 Web 会话内生效；刷新页面后恢复默认配置，不实现本地存储、导入导出或共享。

**Rationale**: 该边界与规格中的假设一致，能把实现重点集中在实时应用、校验、防呆和重置路径，而不是扩展为配置管理系统。

**Alternatives considered**:

- 使用浏览器存储保留上次调参结果  
  - Rejected because persistence is explicitly out of the initial scope and adds backward-compatibility considerations.
- 提供 JSON 导入导出  
  - Rejected because it belongs to a later workflow focused on sharing and reproducibility, not the current HUD MVP.

## Decision 6: `web-hud-overlay` 与 `boot-status` 采用显式边界隔离策略

**Decision**: 将 `boot-status` 视为 Web 顶部状态区的保留占位，`web-hud-overlay` 在计算自身位置时必须读取或推导该状态区边界，并保证两者最终 `element.boundary` 不相交；若默认锚点会冲突，则优先调整 HUD 位置与间距，而不是压缩或隐藏 `boot-status`。

**Rationale**: 仅要求“不要遮挡关键内容”不足以防止两个顶层 DOM 元素在视觉上发生边界重叠。把 `boot-status` 作为明确的布局约束，可以把新需求 `FR-013` 转化为可测量、可回归验证的矩形分离规则。

**Alternatives considered**:

- 继续依赖人工目测判断是否重叠  
  - Rejected because it is subjective and cannot prevent regressions reliably.
- 只在某个固定窗口尺寸下微调 CSS 偏移  
  - Rejected because the overlap rule must hold across collapsed/expanded and small-window states, not only one viewport.
