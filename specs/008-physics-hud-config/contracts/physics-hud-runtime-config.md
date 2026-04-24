# Contract: Physics HUD Runtime Configuration

## Scope

该契约定义 `dev:web` 模式下物理参数 HUD、应用层运行时配置以及物理/渲染同步之间必须满足的行为约束。

## Contract A: Supported Parameter Descriptor

1. 描述符要求
- 每个受支持参数必须有稳定唯一的 `key`
- 每个受支持参数必须暴露 `label`、`defaultValue`、`min`、`max`、`step` 与 `applyMode`

2. HUD 展示要求
- HUD 必须同时展示当前值与默认值
- HUD 必须能够标识参数是否已偏离默认值

## Contract B: Parameter Update Semantics

1. 合法值应用
- 当输入值合法时，系统必须将新值写入运行时配置
- `immediate` 参数必须在下一物理步读取到新值
- `next-shot` 参数必须在下一次出杆计算中读取到新值
- `layout-refresh` 参数必须在继续模拟前完成 pocket/rail 布局刷新

2. 非法值保护
- 非法值、空值或不可解析值不得进入运行时配置
- 非法输入必须向用户显示“未生效”反馈
- 某一参数应用失败不得回滚其他已成功应用的参数

## Contract C: Reset to Defaults

1. 恢复行为
- 重置操作必须将所有受支持参数恢复为默认值
- 重置后 HUD 必须清除所有 dirty 标记

2. 生效要求
- 恢复默认后的结果必须立即对后续模拟/出杆可见
- 若包含 `layout-refresh` 参数，重置流程必须执行相同的布局同步逻辑

## Contract D: Layer Boundary Rules

- DOM 输入、按钮和表单逻辑仅允许出现在 `src/web/*`
- `GameApp` 负责参数编排、状态汇总与日志，不直接创建 DOM
- `PhysicsWorld` 负责物理应用与布局派生数据刷新
- `TableRenderer` / `UIRenderer` 只读取状态，不决定规则或校验结果

## Contract E: Robustness & Observability

- 参数快速连续修改不得导致渲染循环中断或应用崩溃
- 在球仍在运动时修改参数时，系统必须保持配置可用且行为可预期
- 成功应用、拒绝与重置操作必须具备可追踪的日志信号

## Contract F: DOM Layout Separation

- 当 `web-hud-overlay` 与 `boot-status` 同时可见时，两者的 `element.boundary` 必须不相交
- 该约束必须在 HUD 默认折叠、展开以及较小窗口尺寸等支持状态下成立
- 当 HUD 展示非法输入错误提示、较长状态文案或较长参数说明时，该约束仍必须成立
- 若默认定位会导致冲突，系统必须优先调整 HUD 定位或间距，而不是允许边界重叠
