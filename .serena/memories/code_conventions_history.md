# 代码规范与历史修复

## TypeScript 与工程设定
- `tsconfig`：ESNext 模块/目标、`moduleResolution: bundler`、`strict: true`、`noUnusedLocals: true`、`verbatimModuleSyntax: true`。
- 包与版本：依赖使用 `workspace:*`，包名归属 `@shellraining/` 命名空间，Lerna 独立版本控制。
- 构建输出：Rolldown 负责主题打包，主入口 `./src/index.ts`，配置入口 `./dist/node/config.js`，类型定义 `./dist/node/config.d.ts`。

## Vue 与代码风格
- 组件默认 `<script setup lang="ts">`，组合式 API。
- 组件命名 PascalCase，可复用逻辑以 `use` 前缀 camelCase 命名。
- 主题包按 `src/client`（运行时）与 `src/node`（构建期）分层，组件依功能模块（Home、Sidebar、Doc 等）组织。
- Prettier 覆盖 theme 的 `src/**/*.{ts,vue,js,json}` 与 content 的 `**/*.{md,vue,js,ts,json}`。
- 倡导使用成熟第三方库，避免重复造轮子。

## 历史问题与修复记录
- 开发模式出现字体子集 404：`fontPlugin` 仅在构建阶段发射文件。
- 修复：在 `packages/theme/src/node/plugins/font.ts` 中引入 `devSubsetAssets` 缓存，`configureServer` 挂载中间件直接返回字体流，同时保留构建期 `emitFile`。
- 本地 `http://localhost:5173/` 通过 `document.fonts.check("LXGWWenKaiGBScreen")` 验证字体已正常加载。
