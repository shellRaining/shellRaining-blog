# 建议的开发命令

## 主要开发命令

### 开发服务器

- `pnpm run dev` - 启动完整开发环境（先构建主题，再启动内容开发服务器）
- `pnpm run dev:theme` - 仅启动主题包开发模式（watch 模式构建）
- `pnpm run dev:content` - 仅启动内容包开发服务器

### 构建命令

- `pnpm run build` - 按顺序构建所有包（theme → content）
- `pnpm run build:theme` - 仅构建主题包
- `pnpm run build:content` - 仅构建内容包

### 预览和测试

- `pnpm run preview` - 预览构建结果
- `pnpm run test` - 运行测试（仅主题包有测试）

### 代码质量

- `pnpm run format` - 代码格式化（所有包）
- `pnpm run clean` - 清理构建产物和缓存

## 包级别命令（在对应包目录下执行）

### theme 包 (packages/theme/)

- `pnpm run build` - 生产构建
- `pnpm run build:watch` - 监听模式构建
- `pnpm run dev` - 开发模式构建
- `pnpm run test` - 运行 Vitest 测试
- `pnpm run format` - 格式化 TypeScript/Vue/JavaScript/JSON 文件

### content 包 (packages/content/)

- `pnpm run dev` - VitePress 开发服务器
- `pnpm run build` - VitePress 构建
- `pnpm run preview` - VitePress 预览
- `pnpm run format` - 格式化 Markdown/Vue/JavaScript/TypeScript/JSON 文件

## Git Worktree 相关

项目配置了多个 worktree 用于并行开发：

- `main` - 主工作区（当前）
- `camellia` - 开发分支（端口 5173）
- `rose` - 开发分支（端口 5174）
- `violet` - 开发分支（端口 5175）

## 系统命令 (macOS)

- `ls` - 列出文件
- `find . -name "*.ts"` - 查找 TypeScript 文件
- `grep -r "pattern" .` - 递归搜索文本
- `git status` - Git 状态
- `git log --oneline` - 简洁提交历史

## 任务完成检查

完成开发任务后应执行：

1. `pnpm run test` - 确保测试通过
2. `pnpm run build` - 确保构建成功
3. 不要手动提交代码（除非明确要求）

