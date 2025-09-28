# 代码风格和约定

## TypeScript 配置

- **模块系统**: ESNext modules (`"module": "esnext"`)
- **目标版本**: ESNext (`"target": "esnext"`)
- **模块解析**: Bundler (`"moduleResolution": "bundler"`)
- **严格模式**: 启用 (`"strict": true`)
- **未使用变量检查**: 启用 (`"noUnusedLocals": true`)
- **逐字模块语法**: 启用 (`"verbatimModuleSyntax": true`)

## Vue 组件风格

- **组合式 API**: 使用 `<script setup lang="ts">` 语法
- **导入风格**: 明确导入所需组件和 composables
- **命名约定**:
  - 组件名使用 PascalCase (如 `DefaultTheme`, `CopyInlineCode`)
  - Composables 使用 camelCase 前缀 `use` (如 `useVimKeyBindings`)
  - 文件名使用 PascalCase for 组件，camelCase for utilities

## 项目架构约定

- **关注点分离**:
  - `src/client/` - 客户端代码
  - `src/node/` - 服务端/构建时代码
- **组件组织**: 按功能模块分目录 (Home, Sidebar, Doc, Viewer)
- **可复用逻辑**: 使用 composables 模式

## 依赖管理原则

- **激进更新**: 使用最新版本依赖，包括 alpha 版本
- **避免重复造轮子**: 积极使用第三方库而非手写工具函数
- **内部依赖**: 使用 `workspace:*` 协议管理 monorepo 内部依赖

## 代码格式化

- **工具**: Prettier
- **范围**:
  - Theme 包: `"src/**/*.{ts,vue,js,json}"`
  - Content 包: `"**/*.{md,vue,js,ts,json}"`

## 构建和导出约定

- **构建工具**: Rolldown (新一代 Rollup)
- **导出方式**:
  - 主入口: `"."` -> `"./src/index.ts"`
  - 配置入口: `"./config"` -> `"./dist/node/config.js"`
- **类型定义**: `"./dist/node/config.d.ts"`

## 命名和组织模式

- **包名**: `@shellraining/` 命名空间
- **版本控制**: 独立版本控制 (independent versioning)
- **测试**: 仅在 theme 包中使用 Vitest
- **文档**: Markdown 格式，支持扩展语法 (数学公式、任务列表等)

## 开发环境约定

- **Node.js**: 使用 `.nvmrc` 指定版本
- **包管理器**: pnpm (性能优化)
- **Monorepo**: Lerna + pnpm workspace
- **Git Worktree**: 支持多分支并行开发

