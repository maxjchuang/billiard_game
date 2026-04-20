# Research: GitHub Pages 静态单页站点

**Branch**: `005-pages-static-spa`  
**Created**: 2026-04-20  
**Spec**: `specs/005-pages-static-spa/spec.md`

## Decisions

### 决策 1：使用 GitHub Pages + GitHub Actions 在 `main` 变更后自动发布

- **Decision**: 站点托管使用 GitHub Pages，发布由 GitHub Actions 在 `main` 更新后自动构建并部署。
- **Rationale**: Pages 是 GitHub 原生静态托管方案；通过 Actions 可实现“合并即发布”，并提供可追踪的失败日志。
- **Alternatives considered**:
  - 手动上传静态文件：维护成本高、易漂移。
  - `gh-pages` 分支手动/脚本推送：可行但更易产生历史噪音，且与 Pages Actions 流水线相比可观测性更弱。

### 决策 2：Web 静态产物与小游戏 `dist/` 构建解耦

- **Decision**: Web 端静态构建产物使用独立输出目录（与小游戏 `npm run build` 生成的 `dist/` 分离）。
- **Rationale**: 现有 `dist/` 由 `tsc` 产出并被小游戏入口引用；直接复用会产生产物冲突与兼容风险。
- **Alternatives considered**:
  - 复用同一 `dist/`：最省目录，但高风险、回滚困难。

### 决策 3：解决 Pages 子路径与 SPA 刷新 404 问题

- **Decision**: 针对项目页路径（`/<repo>/`）设置正确的资源基路径；并提供“刷新/直达子路径不 404”的回退方案。
- **Rationale**: GitHub Pages 项目站点通常挂载在子路径；SPA 使用 history 路由时，刷新会命中静态服务器 404，需要回退到入口页。
- **Alternatives considered**:
  - 使用 hash 路由：实现简单但 URL 可读性较差。
  - 仅支持根路径访问：不符合“分享与回退体验稳定”的需求。

