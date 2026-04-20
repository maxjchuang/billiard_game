# Data Model: GitHub Pages 静态单页站点

**Branch**: `005-pages-static-spa`  
**Created**: 2026-04-20  
**Spec**: `specs/005-pages-static-spa/spec.md`

本特性不引入新的业务数据实体（无账号、无存储、无服务端）。

## Conceptual Entities (for clarity)

- **Static Site Artifact**: 一次构建生成的静态文件集合（入口页、静态资源等），用于被托管与访问。
- **Deployment Run**: 一次自动发布执行过程，用于追踪“从 `main` 更新到线上可访问”的流水线状态与日志。

