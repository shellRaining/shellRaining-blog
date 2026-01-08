---
title: MCP 易用性探索
tag:
  - reading-notes
  - mcp
date: 2026-01-07
series:
  name: MCP 学习
  part: 9
---

## 背景

MCP server 让 agent 能够利用更多工具与外界交互，但是这种能力也伴随这一个代价，就是让 server 运行起来并不是一个容易的事情，我们可以用下面的类比来更清晰的理解：

假设说 agent 是一台笔记本电脑，它自带了很多的部件，比如屏幕，音响等，但是和专业的工具相比，他们又显得比较孱弱，这时候我们自然想外接专业的工具，比如显示素质更好的屏幕，又或者音效更好的音响，但当你把插头插到笔记本的接口时候，他们可能并不能直接使用，因为我们还需要外接电源……

这里的电源就是我们这篇文章最关心的东西，他实际上就是 MCP server 代码的运行时，比如官方提供的 fetch 就需要 uv 运行时，everything 需要 node 运行时，但我们的 MCP 客户端（Claude Code，Cursor，Codex 等）一般不会内置各种运行时，这对小白用户来说，无疑是一个巨大的负担

> 这里有个例外，Claude Desktop 内置了两个运行时，一个 node25，一个 python 3.14.0，目前不知道是通过什么方式做到的
>
![image-20251117232836644](https://2f0f3db.webp.li/2025/11/image-20251117232836644.png)

基于上面的问题，我们会主要讨论如何更好的让 MCP 更易用

## skill 或基于代码执行的 MCP

可以先看一下我的这篇文章来了解什么是基于代码执行的 MCP server

https://shellraining.xyz/docs/reading-notes/mcp/code-execute-with-mcp.html

严格意义上来说，这种方法并不能解决运行时的问题，它只是间接的缓解运行时的影响。Agent 可以借助 skill 下载运行时，或者指定已有的运行时路径。这在某些场合是有用的，比如我们通过 VSCode 连接开发机，`.vscode-server` 下面就有一个 node 二进制文件，我们可以通过 skill 让模型率先知道二进制文件的路径，然后通过这个特殊的运行时将 server 跑起来，算是一个非常无奈的方案

## MCPB（MCP bundle）

MCPB 是一种基于 ZIP 的分发包格式，专门用来分发 MCP server 及其描述文件，具体的信息可以看[这篇文章](./mcpb-packaging-guide.md)。当我们内置的不是源码，而是一个独立的可执行文件时，这种方案就几乎能够随意运行 MCP server

缺点也有很多：

1. 我们需要为不同的平台打包不同的二进制文件，并且还要考虑动态链接库版本的问题，打包 musl 版本也是必要的
1. 除了打包外，分发也是一个困难的问题，这需要我们建成自己的 registry，而这在短时间内显然是不可能完成的
1. 打包后由于携带了一个 bun 运行时，体积比较大，有 60MB，Windows 平台甚至有 100 多 MB

## MCP client 与 server 内联

内联是指使用 InMemory 通信方式，将 MCP Client 和 MCP Server 连接起来，让 server 可以直接依靠 client 的运行时启动，一个例子如下：

```typescript
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// 创建一对相互链接的内存传输通道
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

// 创建并配置 Server
const server = new Server(
  {
    name: "my-inline-server",
    version: "1.0.0",
  },
  { capabilities: {} },
);

server.setRequestHandler("tools/list", async () => ({
  tools: [{ name: "echo", description: "回显工具" }],
}));

// 创建 Client
const client = new Client(
  {
    name: "my-client",
    version: "1.0.0",
  },
  { capabilities: {} },
);

// 启动连接
await server.connect(serverTransport);
await client.connect(clientTransport);

// 使用 client 调用 server 的工具
const tools = await client.request({ method: "tools/list" }, {});
console.log(tools); // { tools: [{ name: 'echo', description: '回显工具' }] }
```

这样做有很多好处：

1. 首先就是我们节省了一个运行时，可以依靠宿主的运行时，不会占用多余的系统磁盘，而且运行除了 server 自身内存开销，没有额外成本
2. 它的通信成本很低，不用经过 STDIO 或者是 HTTP 请求来进行交互通信
3. 还有就是它的进程启动关闭受宿主控制，因此不会像 STDIO 模式一样，经常出现宿主进程关闭，server 没有关闭的悬挂进程问题

但也存在一些问题：

1. server 的代码我们需要进行一些改动才能够嵌入到原有的项目中
2. 如果 server 依赖外部库，这些户必须集成到项目中，增大打包体积
3. 这种方式只能改造和宿主同语言类型的 server

## Remote 类型的 MCP server

Remote 类型的 server 是最省心的，但是他也面临着一些问题，就是 server 不能及时获取用户本地的信息，这对于 coding agent 来说是比较吃亏的，但是对某些场景（如滴滴打车）似乎不是问题
