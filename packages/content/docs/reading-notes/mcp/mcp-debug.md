---
title: MCP debug 最佳实践
tag:
  - reading-notes
  - mcp
date: 2025-12-10
series:
  name: MCP 学习
  part: 8
---

在具体讲 debug 之前，首先了解一下 VSCode debug 的两种模式，**launch** 和 **attach**，它们的区别在于“谁来启动被调试的进程”。

- launch 模式：是指由 VSCode 来直接启动需要被 debug 的程序，很适合我们 debug 一些随意写的脚本（比如刷力扣……），但是对于 MCP 就不是很合适，因为 stdio 类型的 MCP server 需要由宿主进程（或者说 MCP 客户端）启动，如果直接由 VSCode 启动，我们无法正常完成握手等操作
- attach 模式：是指 VSCode 不负责启动进程，而是“附加”到一个**已经在运行的进程**。我们需要手动先把要调试的进程启动起来，并将他暴露到一个端口上，然后将调试器附加在其上，就可以实现调试的功能

## stdio 类型 server

上面提到，stdio 类型的 server 必须由宿主进程启动，因此我们只能选择第二种调试方式，具体的操作步骤为：

1. 将我们用 TypeScript 编写的 MCP server 编译，注意在 `tsconfig.json` 中开启 `sourceMap` 和 `declaration`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowImportingTsExtensions": false
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts"]
}
```

2.  在 mcp.json 里面添加指定的 server，注意加上 `--inspect-brk` 以调试模式启动

```json
{
  "mcpServers": {
    "color2var": {
      "type": "stdio",
      "command": "node",
      "args": [
        "--inspect-brk",
        "/Users/shellraining/Documents/playground/mcp/evaluation/color2var/dist/main.js"
      ],
      "disabled": true
    }
  }
}
```

3. 浏览器打开 `chrome://inspect`，找到 9229 端口启动的程序，点击 inspect 开始调试（如果没有找到 9229 端口，请点击页面上第二个 checkbox 里面的 configure 按钮，在里面把 9229 端口加上）
   ![image.png](https://2f0f3db.webp.li/2025/12/20251210134334258.png)
   ![image.png](https://2f0f3db.webp.li/2025/12/20251210134344926.png)

4. 如果想要使用 VSCode 进行调试，我们需要在 `.vscode/launch.json` 里面添加配置

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to 9229",
      "port": 9229,
      "request": "attach",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}
```

![image.png](https://2f0f3db.webp.li/2025/12/20251210134404637.png)

## remote 类型

Remote 类型的 MCP server debug 起来就相对轻松多了，因为我们是先启动 server，然后等待 client 的连接，因此可以直接使用 launch 的方式启动，不必通过 attach 的方式间接 debug。由于我们通过 TypeScript SDK 编写代码，因此我这里极力推荐使用 bun 运行时来进行 debug，他能够直接运行 TypeScript 代码。
使用方式也很简单，我们只需要做两步操作，

1. 安装 bun 运行时，可以参照网页 https://bun.com/docs/installation 来做
2. 在 VSCode 拓展商店下载 bun for visual studio code

![image.png](https://2f0f3db.webp.li/2025/12/20251210134425576.png)

然后就可以按下 F5 启动服务器，等待客户端连接后调试了

![image.png](https://2f0f3db.webp.li/2025/12/20251210134445670.png)

## log 输出

如果不喜欢断点调试的方式，可以通过 log 来判断，方式是打开对应 IDE 的控制台（如 VSCode、Trae、Comate），然后跳转到 output 栏，选择 Baidu Comate MCP 输出通道，就可以看到所有的日志信息，因为我们是通过 stderr 通道输出，因此会有一个前缀 “Server xxx stderr:”，后面是实际的日志信息

  ![vscode MCP 日志输出位置](https://2f0f3db.webp.li/2025/12/mcp-channel.png)

> [!CAUTION]
> 但是打日志的时候要注意，必须通过 stderr 通道发送，因为 stdin 和 stdout 是专门留给 JSON-RPC 通信用的，如果你往这里写入东西，就会造成 JSON-RPC 解析失败的问题。
> 比如 JavaScript 要使用 console.error 而不是 console.info 或者 console.log，同理 go 或者其他语言

我们还可以将日志可以写入到一个文件中，可以参考 [fetchRaining MCP 的实现](https://github.com/shellRaining/fetchRaining/blob/main/src/shared/Log.ts)，使用文件记录日志，方便出现问题后查找现场。同时使用文件记录日志还有一个好处，方便使用各种 coding agent 直接查看文件来分析

![image-20251209221615800](https://2f0f3db.webp.li/2025/12/image-20251209221615800.png)

我这里的例子是上传到了 `~/.local/state/fetchraining/logs/app.jsonl` 下，这样比较符合 XDG 规范
