这是 shellRaining 的博客仓库，该博客使用 vitepress 搭建（一个静态博客框架），并使用 Vue 书写博客的自定义主题。

## 项目结构

该项目是一个使用 Lerna 管理的 monorepo，共有两个子包，`theme` 和 `content`。前者是书写自定义 vitepress 主题的地方，后者是书写博客正文的地方。项目使用 pnpm 作为包管理器，通过 workspace 和 Lerna 实现包依赖管理和版本控制。

### theme 子包

由于 vitepress 是一个 SSG 框架，他生成的页面是预先渲染的，而为了保证页面的灵活性，vitepress 允许我们编写仅在客户端运行的代码，因此博客主题具有两部分：

- `node`：用来放置编译时逻辑
- `client`：用来放置客户端逻辑

### content 子包

这个子包使用标准的 vitepress 博客组织结构

```
.
├── .vitepress
│   ├── config.ts     用来放置博客站点级别配置
│   ├── theme         用来放置博客主题配置
│   └── dist          存放博客构建产物，偶尔可以通过他来检查构建结果来 debug
├── docs
│   ├── book          放置读书或者一些系列文章
│   ├── daily_life    放置一些日常生活写的文章，比如游记，感悟等
│   ├── tech_blog     存放一些简单的技术博客，通常不构成系列文章
│   ├── tools         存放一些工具的使用方法
│   └── translation   存放一些翻译文章
└── public
    └── fonts         存放博客的自定义字体，用来美化
```

## 项目偏好

本项目激进的使用所有最新的依赖，比如 vitepress 使用未 release 的 v2 版本，其依赖的 Vite 版本为 v7，vueuse 使用 v13，Vue 使用 3.6 版本。

本项目为了代码的可维护性，积极使用依赖所提供的 API，而不是手写辅助函数，以避免产生额外的维护负担

## Lerna 管理

项目使用 Lerna v8 进行 monorepo 管理，提供简化的开发命令：

### 可用命令
- `npm run dev` - 启动开发服务器（content 包）
- `npm run build` - 按顺序构建所有包（theme → content）
- `npm run preview` - 预览构建结果
- `npm run test` - 运行测试（仅 theme 包有测试）
- `npm run format` - 代码格式化（需要各包配置格式化工具）
- `npm run clean` - 清理构建产物和缓存

### 包依赖关系
- `@shellraining/content` 依赖 `@shellraining/theme`
- 使用 `workspace:*` 协议管理内部包依赖
- 项目采用独立版本控制（independent versioning）

## AI 修改准则

如果修改代码（比如添加功能或者重构）后导致文档和代码逻辑出现不一致的情况，请你酌情修改
