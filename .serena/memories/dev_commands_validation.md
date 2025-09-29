# 开发命令与验收流程

## 常用命令
- `pnpm run dev`：根目录启动整体开发流程，先构建主题再启动内容包开发服务器。
- `pnpm run dev:theme` / `pnpm run dev:content`：分别调试主题或内容包。
- `pnpm run build`：按顺序构建主题与内容；`pnpm run build:theme`、`pnpm run build:content` 可独立执行。
- `pnpm run preview`：本地预览构建结果。
- `pnpm run test`：运行 Vitest（仅主题包包含单测）。
- `pnpm run format`：调用 Prettier 统一格式；`pnpm run clean` 清理产物与缓存。

## 多工作区
- Git worktree 规划：main（当前）、camellia、rose、violet 等，默认 dev 端口依次为 5173、5174、5175。
- 根目录 `pnpm run dev` 通过 Bun 执行 `tooling/dev.ts`，并行管理主题与内容的开发任务，输出带前缀日志，可统一 Ctrl+C 退出。
- theme 包内由 Bun 调用 `scripts/dev.ts`，若缺少 `dist` 会先构建再进入 Rolldown watch。

## 任务完成检查
1. `pnpm run test`：确认单测全部通过。
2. `pnpm run build`：验证主题与内容均可构建，关注 TypeScript 类型或告警。
3. （可选）`pnpm run format`：提交前统一格式。
4. 遵循约定：未经明确要求不要 `git commit`/`git push`，避免长时间占用型命令（如常驻 `pnpm run dev`），不创建不必要的临时文件。
