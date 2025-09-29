# 项目概览与结构

## 项目定位
- shellRaining 的个人博客，基于 VitePress + 自研主题构建，承载技术、工具、阅读笔记、翻译、生活等多类型内容。
- 使用 pnpm + Lerna 的 monorepo 架构，主题与内容包分离，内部依赖通过 `workspace:*` 连接。

## 核心技术
- 站点：VitePress v2.0.0-alpha.12，Vue 3.5，TypeScript。
- 工具：pnpm、Bun（脚本执行）、Rolldown（主题构建）、Prettier、Vitest（主题包单测）、Mermaid、markdown-it-mathjax3、feed（RSS）、subset-font。

## 目录结构
```
shellraining-blog/
├── packages/
│   ├── theme/          # 自定义 VitePress 主题包
│   │   ├── src/client/ # 布局与组件
│   │   ├── src/node/   # 插件与构建逻辑
│   │   └── __tests__/  # 主题单测
│   └── content/        # 博客内容包
│       ├── .vitepress/ # 站点配置与主题扩展
│       └── docs/       # 文章内容（已统一为 kebab-case 命名）
│           ├── tech/
│           ├── tooling/
│           ├── reading-notes/
│           ├── translation/
│           └── life/
├── scripts/            # 构建和自动化脚本
├── .claude/            # Claude Code 配置
├── .serena/            # Serena MCP 配置
├── package.json
├── pnpm-workspace.yaml
├── lerna.json
└── CLAUDE.md           # 项目说明
```

## 内容整理现状
- 文章目录已经重命名为 `tech`、`tooling`、`reading-notes`、`translation`、`life`，所有 Markdown/Vue 文件采用小写连字符命名，并同步更新内部链接。
- frontmatter tag 在前序工作中已规范化，构建 (`pnpm run build`) 验证通过。
