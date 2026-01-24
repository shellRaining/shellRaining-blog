---
title: MCPB 介绍
tag:
  - mcp
date: 2026-01-08
series:
  name: MCP 学习
  part: 10
---

# MCPB 打包指南

## 概述

MCPB (MCP Bundle) 是 zip 格式的分发包，包含 MCP 服务器和元数据描述文件。支持 Claude Desktop 一键安装。

使用之前需要先安装 CLI 工具

```bash
npm install -g @anthropic-ai/mcpb
```

## 目录结构

我们使用 unzip 对 MCPB 格式进行解压，就能够看到上面提到的 MCP 服务器和元数据文件。常见的目录结构如下

### 二进制类型

```
bundle/
├── manifest.json       # 必需
└── server/
    └── my-server       # 可执行文件（Windows 自动识别 .exe）
```

### Node.js 类型

```
bundle/
├── manifest.json
├── server/
│   └── index.js
└── node_modules/       # 所有依赖
```

## manifest.json 规范

### 最小配置（二进制类型）

```json
{
  "manifest_version": "0.3",
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "服务器简介",
  "author": {
    "name": "作者名"
  },
  "server": {
    "type": "binary",
    "entry_point": "server/my-server",
    "mcp_config": {
      "command": "${__dirname}/server/my-server",
      "args": [],
      "env": {}
    }
  }
}
```

### 必填字段

| 字段               | 说明                                              |
| ------------------ | ------------------------------------------------- |
| `manifest_version` | 规范版本，当前为 `"0.3"`                          |
| `name`             | 包名（机器可读）                                  |
| `version`          | 语义版本号                                        |
| `description`      | 简短描述                                          |
| `author.name`      | 作者名称                                          |
| `server`           | 服务器配置，支持 `"binary"`、`"node"`、`"python"` |

### 可选字段

```json
{
  "display_name": "显示名称",
  "repository": {
    "type": "git",
    "url": "https://github.com/user/repo"
  },
  "tools": [
    {
      "name": "tool_name",
      "description": "工具描述"
    }
  ],
  "keywords": ["tag1", "tag2"],
  "license": "MIT",
  "compatibility": {
    "platforms": ["darwin", "win32", "linux"]
  }
}
```

### 变量替换

manifest.json 支持以下变量：

- `${__dirname}` - 扩展安装目录
- `${HOME}` - 用户主目录
- `${DOCUMENTS}` - 文档目录
- `${user_config.KEY}` - 用户配置值，会在用户安装该 MCPB 文件的时候要求其提供，可以看下面的示例

### 用户配置

允许用户在安装时提供配置：

```json
{
  "user_config": {
    "api_key": {
      "type": "string",
      "title": "API Key",
      "description": "认证密钥",
      "sensitive": true,
      "required": true
    },
    "max_results": {
      "type": "number",
      "title": "最大结果数",
      "default": 10,
      "min": 1,
      "max": 100
    },
    "workspace": {
      "type": "directory",
      "title": "工作目录",
      "default": "${HOME}/Documents"
    }
  },
  "server": {
    "mcp_config": {
      "command": "${__dirname}/server/my-server",
      "args": ["--max=${user_config.max_results}"],
      "env": {
        "API_KEY": "${user_config.api_key}"
      }
    }
  }
}
```

支持的配置类型：

- `string` - 文本输入（可标记 `sensitive` 来安全存储）
- `number` - 数值（支持 min/max 约束）
- `boolean` - 布尔开关
- `file` - 文件选择器
- `directory` - 目录选择器

### 跨平台支持

二进制类型需为每个平台提供对应文件：

```
server/
├── my-server           # macOS/Linux
└── my-server.exe       # Windows（自动识别）
```

manifest.json 中可使用平台覆盖：

```json
{
  "server": {
    "mcp_config": {
      "command": "${__dirname}/server/my-server",
      "platform_overrides": {
        "win32": {
          "command": "${__dirname}/server/my-server.exe"
        }
      }
    }
  }
}
```

## 完整示例

```bash
# 1. 编译二进制
bun build src/index.ts --compile --minify --outfile my-server

# 2. 创建 bundle
mkdir -p my-bundle/server
cp my-server my-bundle/server/
# 创建 `.mcpbignore` 排除不需要的文件，格式与 .gitignore 相同（可选）
touch my-bundle/.mcpbignore

# 3. 编写 manifest.json
cat > my-bundle/manifest.json << 'EOF'
{
  "manifest_version": "0.3",
  "name": "my-mcp",
  "version": "1.0.0",
  "description": "My MCP Server",
  "author": { "name": "Me" },
  "server": {
    "type": "binary",
    "entry_point": "server/my-server",
    "mcp_config": {
      "command": "${__dirname}/server/my-server",
      "args": [],
      "env": {}
    }
  }
}
EOF

# 4. 验证
mcpb validate manifest.json

# 5. 打包
cd my-bundle && mcpb pack
```

## 参考

- MCPB 仓库：https://github.com/modelcontextprotocol/mcpb
- Manifest 规范：MANIFEST.md
- 示例项目：examples/
