# 项目结构详解

## 根目录结构

```
shellraining-blog/
├── packages/           # monorepo 包目录
│   ├── theme/         # VitePress 主题包
│   └── content/       # 博客内容包
├── scripts/           # 构建和开发脚本
├── .claude/           # Claude Code 配置
├── .serena/           # Serena MCP 配置
├── package.json       # 根包配置和脚本
├── lerna.json         # Lerna monorepo 配置
├── pnpm-workspace.yaml # pnpm workspace 配置
└── CLAUDE.md          # 项目说明文档
```

## packages/theme - VitePress 主题包

**目的**: 自定义 VitePress 主题开发

### 关键目录

- `src/client/` - 客户端代码（浏览器运行）
  - `Layout.vue` - 主题布局组件
  - `components/` - Vue 组件
  - `styles/` - CSS 样式
- `src/node/` - 服务端代码（构建时运行）
  - 配置处理逻辑
  - 插件和扩展
- `__tests__/` - 测试文件
- `dist/` - 构建输出

### 构建配置

- 使用 Rolldown 构建（Rollup 下一代）
- 支持 TypeScript
- 导出 ES 模块和 CommonJS

## packages/content - 博客内容包

**目的**: 博客文章和站点配置

### 关键目录

- `.vitepress/` - VitePress 配置
  - `config.ts` - 站点配置
  - `theme/` - 主题自定义
  - `dist/` - 构建输出
- `docs/` - 文章内容
  - `tech_blog/` - 技术博客
  - `book/` - 读书笔记和系列文章
  - `daily_life/` - 日常生活文章
  - `tools/` - 工具使用方法
  - `translation/` - 翻译文章
- `public/` - 静态资源
  - `fonts/` - 自定义字体文件

## 包依赖关系

- `@shellraining/content` 依赖 `@shellraining/theme`
- 主题包提供 VitePress 主题实现
- 内容包使用主题包构建博客站点

