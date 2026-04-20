# Data Model: dev:web 鼠标操作支持

## Entity: MouseInteractionSession

描述一次鼠标交互会话（按下到释放/取消）。

### Fields

- `active`: boolean，是否存在进行中的交互
- `startX`: number，按下时 X 坐标
- `startY`: number，按下时 Y 坐标
- `currentX`: number，当前 X 坐标
- `currentY`: number，当前 Y 坐标
- `aimAngle`: number，当前瞄准角（弧度）
- `powerPercent`: number，当前力度（0~1）
- `cancelled`: boolean，是否已取消

### Validation Rules

- `powerPercent` 必须夹断在 `[0,1]`
- `active=false` 时不得触发 shoot
- `cancelled=true` 的会话释放时不得触发 shoot

### State Transitions

- `idle -> active`：mouse down on table
- `active -> active`：mouse move update aim/power
- `active -> cancelled`：cancel action
- `active/cancelled -> idle`：mouse up 或取消后收敛

## Entity: MatchInputAvailability

描述当前是否接受鼠标击球输入。

### Fields

- `canShoot`: boolean（通常仅在 `aiming`）
- `canStartMatch`: boolean（menu 状态）
- `canRestart`: boolean（match/result）
- `canBackMenu`: boolean（match/result）

### Validation Rules

- `canShoot=false` 时，shoot 请求必须被丢弃
- 状态切换后可用性需同步更新，避免 UI 与行为不一致

## Entity: WebControlAction

描述用户触发的页面控制入口动作。

### Fields

- `type`: enum(`start-match`,`restart-match`,`back-menu`)
- `source`: enum(`button`,`keyboard-shortcut`)
- `timestamp`: number

### Validation Rules

- 仅在 action 对应状态可用时才入队到 `InputManager`
