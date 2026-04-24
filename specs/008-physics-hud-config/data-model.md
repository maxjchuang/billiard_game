# Data Model: 物理参数实时 HUD 配置

## Entities

### RuntimePhysicsConfig

代表当前会话内实际生效、且允许通过 HUD 编辑的物理参数集合，初始值来源于默认 `PhysicsConfig`。

- **friction**: 速度衰减系数。
- **minVelocity**: 停球阈值。
- **railRestitution**: 球与库边碰撞反弹系数。
- **ballRestitution**: 球与球碰撞反弹系数。
- **railThickness**: 库边厚度，影响共享桌面布局。
- **pocketCaptureRadius**: 袋口吸附/判袋半径。
- **maxCueSpeed**: 出杆最大速度。

### RuntimePhysicsDiagnostics

代表 HUD 中可选展示、但不参与编辑与重置的只读诊断信息。

- **fixedDt**: 固定物理步长，仅用于观察当前模拟参数，不属于首版可编辑参数集合。

### PhysicsParameterDescriptor

描述一个可由 HUD 编辑的参数元数据；首版仅覆盖 `RuntimePhysicsConfig` 中的可编辑字段，不包含 `fixedDt` 这类诊断项。

- **key**: 参数唯一键，对应 `RuntimePhysicsConfig` 字段名。
- **label**: HUD 显示名称。
- **group**: 参数分组，例如 `motion`、`collision`、`layout`、`shot`。
- **defaultValue**: 默认值。
- **min** / **max**: 合法输入范围。
- **step**: HUD 调整步进。
- **applyMode**: `immediate`、`next-shot` 或 `layout-refresh`。
- **description**: 可选的调参说明文本。

### PhysicsParameterDraftState

代表 HUD 中某个参数当前的编辑/校验状态。

- **valueText**: 用户当前输入的原始文本。
- **parsedValue**: 成功解析后的数值；解析失败时为空。
- **isDirty**: 当前值是否偏离默认值。
- **isValid**: 当前输入是否可应用。
- **message**: 针对非法值或边界修正的反馈信息。

### PhysicsHudState

代表 HUD 面板整体状态。

- **isOpen**: 面板是否展开。
- **parameters**: 所有参数的 `PhysicsParameterDraftState` 集合。
- **hasModifiedValues**: 是否至少存在一个 dirty 参数。
- **lastAppliedAt**: 最近一次成功应用参数的时间戳或序号。
- **lastError**: 最近一次失败反馈（若存在）。

### OverlayLayoutBoundary

代表 Web 顶层 UI 元素在页面中的布局边界，用于验证不重叠规则。

- **elementId**: 元素标识，例如 `web-hud-overlay` 或 `boot-status`。
- **top / right / bottom / left**: 元素边界矩形。
- **visible**: 当前状态下元素是否可见并参与布局校验。

### PhysicsConfigApplyEvent

代表一次用户触发的参数应用结果。

- **parameterKey**: 被修改的参数。
- **requestedValue**: 用户请求值。
- **appliedValue**: 最终生效值。
- **success**: 是否应用成功。
- **reason**: 失败或修正原因。
- **applyMode**: 本次应用使用的生效模式。

## Relationships

- 一个 `PhysicsHudState` 持有多个 `PhysicsParameterDraftState`。
- 每个 `PhysicsParameterDraftState` 对应一个 `PhysicsParameterDescriptor` 与一个 `RuntimePhysicsConfig` 字段。
- 每次成功或失败的参数修改都会产生一个 `PhysicsConfigApplyEvent`。
- `RuntimePhysicsDiagnostics` 可被 HUD 读取展示，但不会生成 `PhysicsParameterDraftState`，也不会参与 reset-to-defaults 流程。
- `PhysicsWorld` 与 `ShotResolver` 共享同一份 `RuntimePhysicsConfig`，但依据 `applyMode` 在不同时间点读取或刷新派生数据。
- `web-hud-overlay` 与 `boot-status` 各自对应一个 `OverlayLayoutBoundary`；当二者都可见时，它们必须满足非重叠约束。

## Invariants

- 所有可编辑参数必须拥有唯一 `key` 和明确的默认值、范围与步进信息。
- 非法输入不得写入 `RuntimePhysicsConfig`。
- 任一参数应用失败时，其他已经成功生效的参数值不得被回滚。
- `layout-refresh` 参数更新后，物理层 pocket/rail 派生数据必须与渲染层使用的共享布局保持一致。
- `fixedDt` 等只读诊断信息不得被纳入可编辑参数描述符或默认值重置流程。
- 当所有参数都等于 `defaultValue` 时，`PhysicsHudState.hasModifiedValues` 必须为 `false`。
- `web-hud-overlay` 与 `boot-status` 的 `OverlayLayoutBoundary` 在页面上不得有交集。
