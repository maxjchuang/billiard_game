# Contract: Web Mouse Input & UI Controls

## Scope

该契约定义 `dev:web` 模式下浏览器输入层与游戏输入意图之间的行为约束。

## Contract A: Shot Interaction

1. 输入源
- 鼠标按下/移动/释放事件

2. 行为约束
- 一次有效交互会话最多触发一次 `shoot` 意图
- 在非可出杆状态下，任何释放动作都不得产生 `shoot`
- 取消后的会话释放不得产生 `shoot`

3. 数据约束
- `shoot.power` 必须在 `[0,1]`
- `shoot.angle` 为弧度，允许负值和正值

## Contract B: Menu/Control Actions

1. 控制入口
- Start Match
- Restart Match
- Back to Menu

2. 行为约束
- 点击控制入口应映射为对应 `InputIntent`
- 控制入口在不可用状态下应禁用或无效化，不得推进非法状态切换

## Contract C: Robustness

- 球桌外输入不应触发非法 `shoot`
- 快速重复点击/拖拽不应产生重复出杆
- 输入异常不应导致渲染循环中断或应用崩溃
