# Quickstart: Preview the Physics HUD

## Local

- Install dependencies: `npm ci`
- Start the web debug build: `npm run dev:web`

## Manual validation flow

- 打开 `dev:web` 页面，确认 HUD 可见且能展开物理参数面板。
- 调整一个 `immediate` 参数（如 `friction`），确认无需刷新页面即可影响后续运动表现。
- 输入非法值或超范围值，确认 HUD 明确提示“未生效”，且已有有效参数不回滚。
- 修改一个会影响默认状态标记的参数，确认 HUD 显示该参数已被修改。
- 执行恢复默认，确认所有参数回到默认值且 HUD 清除“已修改”状态。
- 调整一个 `layout-refresh` 参数（如 `railThickness` 或 `pocketCaptureRadius`），确认视觉布局与物理 pocket/rail 行为保持一致。

## Regression checklist

- `npm run lint`
- `npm test`
- `npm run build`
