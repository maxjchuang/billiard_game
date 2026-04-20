# Quickstart: Fix Shot Physics

## Run

- 安装依赖：`npm install`
- 运行单测：`npm test`
- 质量门禁：`npm run lint`、`npm run build`
- Web 调试：`npm run dev:web`

## Manual Validation

1. 开球：满力度时白球不应“慢慢爬”，应在合理时间内撞到球堆。
2. 撞球堆：不应出现异常爆能（明显比输入力度更大的散开）。
