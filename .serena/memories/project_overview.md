# shellRaining 博客项目概览

## 项目目的

这是 shellRaining 的个人博客网站，使用 VitePress 静态站点生成器构建，采用 Vue.js 编写自定义主题。博客支持技术文章、读书笔记、日常感悟、翻译文章等多种内容类型。

## 技术栈

- **框架**: VitePress v2.0.0-alpha.12 (未正式发布版本)
- **前端**: Vue 3.5.18
- **组合式API**: VueUse v13.6.0
- **包管理**: pnpm + Lerna v8.2.3 (monorepo)
- **构建工具**: Rolldown (用于主题包)
- **测试**: Vitest (仅主题包)
- **代码格式化**: Prettier
- **图表**: Mermaid v11.10.1
- **数学公式**: markdown-it-mathjax3
- **RSS**: feed
- **字体优化**: subset-font

## 项目特点

- 激进使用最新版本依赖
- 采用 monorepo 架构，主题与内容分离
- 支持多个 git worktree 并行开发
- 积极使用第三方库而非手写工具函数
- 自定义 VitePress 主题，支持双模式渲染（SSG + 客户端）

## 版本控制策略

- 使用 Lerna 的独立版本控制 (independent versioning)
- 内部包依赖使用 `workspace:*` 协议
- 主题包版本独立于内容包
