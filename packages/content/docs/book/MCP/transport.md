---
title: MCP 传输方式
tag:
  - MCP
  - book
date: 2025-08-07
series:
  name: MCP 学习
  part: 3
---

MCP 官方给了两种推荐的通信方式：

1. stdio 模式：此模式下 MCP client 会自己创建 MCP server 子进程，二者通过标准输入输出进行通信
2. Streamable HTTP 模式：此模式下 MCP server 一般部署在远程的服务器，并通过一个端点暴露出来，MCP client 可以通过这个指定的端点连接到 MCP server

除了官方提供的两种通信方式，还有一个 SSE 模式（现已不推荐使用），你甚至可以自己定义一种通信方式，但无论是哪种方式，都是通过 JSON-RPC 对信息进行组织，并且使用 UTF-8 进行编码

> [!TIP]
> JSON-RPC 是一种应用层的协议，它定义了在信道中传输的数据需要遵守哪些规则：
>
> - **消息格式**：如何构造请求和响应
> - **调用约定**：如何表示方法调用、参数传递和错误处理
> - **交互模式**：请求-响应的对应关系
>
> 比起应用层的一个协议，他更贴近于是一种通信规范，可以在不同的信道上运行，比如 HTTP，WebSocket，TCP socket，stdio 等

## stdio 传输

我们平时见到的 MCP server 大多是使用 stdio 模式传输的，比如 [git](https://github.com/modelcontextprotocol/servers/tree/main/src/git)、[filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) 等。他们都有一个特点，由我们的 MCP 客户端（client）启动，新建的 server 进程是客户端的子进程（通过 spawn 创建）

创建后的 MCP server 会通过 stdout 向客户端发送信息，通过 stdin 接收客户端信息，如果 server 想给客户端发送日志，**必须**通过 stderr 通道发送，因为 stdin 和 stdout 是专门留给 JSON-RPC 通信用的，如果你往这里写入东西，就会造成 JSON-RPC 解析失败的问题。

## Streamable HTTP 传输

### 请求形式

当使用 Streamable HTTP 作为传输方式时，客户端**应当**采用 HTTP post 方法向服务端发起请求，然后服务端的回应可以有两种形式：

1. 单一 JSON 响应（ `Content-Type: application/json` ）
2. 一个可以用来发送多条消息的 SSE 流（ `Content-Type: text/event-stream` ）

客户端除了可以使用 post 发起请求，还可以使用 get 方法向服务端发送请求，该操作的目的是为了建立一个 SSE 数据流，使服务器能在客户端未通过 HTTP POST 发送数据前就与之建立通信。我们这里放一个极简化的 server 的代码来加深理解：

```typescript
import express from "express";

const app = express();

// 这是服务器暴露出来的 post 端点
app.post("/mcp", async (req, res) => {
  // 调用 handleRequest 处理一下客户端的 JSON-RPC request，在这里通常完成协议的握手，工具的调用等操作
  await transport.handleRequest(req, res, req.body);
});

// 这是服务器暴露出来的 get 端点
app.get("/mcp", (req, res) => {
  // 这里虽然也调用了 handleRequest 方法，但实际上是用来建立或者恢复 SSE 连接的
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000);
```

可以看到上面的代码对同一个端点 `/mcp` 实现了两种处理方法，一个 post 处理器，一个 get 处理器，分别对应客户端的两种请求

### 会话管理

为了进行会话管理：

- 在 MCP 连接建立时，服务端会生成一个 `Mcp-Session-Id` 并将它附加到 HTTP 头部并发送给客户端
- 后面客户端发送请求或者其他信息时，都需要在 HTTP 头部附加该 `Mcp-Session-Id` 以表明正处于哪个会话
- 当客户端想要终止会话时，他可以发送携带 `Mcp-Session-Id` 的 HTTP delete 请求来显式的终止会话

根据上面的描述，我们可以知道服务端在维持会话这个过程中，主要负责生成 `Mcp-Session-Id`，这部分示例代码如下：

```typescript
// 初始化时 MCP server 创建一个 session ID，并作为 header 发送给 MCP client
app.post("/mcp", (req, res) => {
  if (req.body.method === "initialize") {
    const sessionId = generateSecureId();
    res.setHeader("Mcp-Session-Id", sessionId);
  }
});
```

客户端主要负责在获取该标识后，在每次请求时携带即可（通过设置 HTTP 请求头）

```typescript
// Client includes session ID in subsequent requests
fetch("/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Mcp-Session-Id": sessionId,
  },
  body: JSON.stringify(request),
});
```

实际上我们在自己写 MCP client 和 server 的时候并不需要考虑这些事情，SDK 已经帮我们做了会话管理相关的事情，这些只是 SDK 开发者需要考虑的

### 重连机制

除了维持会话，SDK 还要保证传输的稳定可靠性，当连接因为不明原因断开时，需要重连来恢复原有的会话。首先说我们为什么需要这种重连机制，HTTP 和 SSE 本身不是就有保证可靠传输的能力吗？

> [!note]
> 首先说 HTTP 和 SSE 确实有自动重连和可靠传输的机制，但是这种“可靠”的层面并不相同
> - 传输层的 TCP 协议保证的是端到端传输的可靠，即发送方的每个字节都会完整保序的传送到接收方
> - 应用层的 HTTP 协议没有提供更多传输上的保证，同时他还是一个无状态协议，这导致为了实现业务上的 session 功能，我们必须做一些额外的处理，比如 cookie，token 等
> - 而 Streamable HTTP 形式的 MCP 协议就是建立在 HTTP 协议上的，他既可以是有状态的（使用 SSE 长连接），也可以是无状态的。因此为了在其上维持一个会话，我们需要上面提到的 `Mcp-Session-Id`，同时如果这个会话因为某些原因中断，我们还要提供重连的能力

对于有状态的连接来说，为了实现重连：

- 服务端应该给流中的每个事件加上一个 `ID`
- 当连接断开，开始进行重连操作时，客户端应向 MCP 端点发起 HTTP GET 请求，并在请求头中包含 `Last-Event-ID` 字段以指明其最后接收的事件 ID
- 服务端接收到这个 `Last-Event-ID` 后，发送这个 ID 对应的消息的下一条（因为 `Last-Event-ID` 这条信息已经收到了），来实现通信恢复

### 生命周期

![image.png](https://2f0f3db.webp.li/2025/08/20250821213659001.png)
