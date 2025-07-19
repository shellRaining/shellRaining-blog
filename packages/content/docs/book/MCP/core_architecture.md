---
title: MCP 协议架构与概念
tag:
  - MCP
  - book
date: 2025-07-19
series:
  name: MCP 学习
  part: 1
---

## 核心架构

MCP 和 LSP 类似，就是一个单纯的 CS 架构

![image-20250719202419794](https://2f0f3db.webp.li/2025/07/image-20250719202419794.png)

可以从上图看出来，这里主要分为四部分

1. 宿主（host）：就是我们使用的各种 App，比如 cherry studio，Claude desktop 等，每个宿主可以启动多个客户端
2. 客户端（client）：每个客户端链接唯一的一个服务端，包含在宿主程序内
3. 服务端（server）：服务端会给客户端提供工具，资源，提示词使用
4. 传输层（transport layer）：就是客户端和服务端所依赖的通信方式，目前包含 stdio 通信，SSE 通信，streamableHTTP 三种通信方式，其中 SSE 方式已经在去年年末废弃

### 协议层

协议层主要处理数据的封装，请求响应对的匹配，还有更高层的对话模式。我们上面提到的 client 和 server 可以被视为实现了协议层的实体

```typescript
class Protocol<Request, Notification, Result> {
    // Handle incoming requests
    setRequestHandler<T>(schema: T, handler: (request: T, extra: RequestHandlerExtra) => Promise<Result>): void

    // Handle incoming notifications
    setNotificationHandler<T>(schema: T, handler: (notification: T) => Promise<void>): void

    // Send requests and await responses
    request<T>(request: Request, schema: T, options?: RequestOptions): Promise<T>

    // Send one-way notifications
    notification(notification: Notification): Promise<void>
}
```

通过上面的简化后的代码可以看到，每个实现协议层的实体（包括 client 和 server），都能够发送并监听 request 和 notification

### 传输层

这里的传输层不是计算机网络中的传输层，而是对 client 和 server 实际传输实现的一种抽象，现有的传输实现有三种，考虑到 SSE 方式已经弃用，这里不做介绍：

1. stdio：使用本地 io 进行通信，非常适合本地的进程间通信
2. streamable HTTP：使用**可以**进行流式传输的 HTTP 协议来进行通信，同时 client 还可以通过 post 请求向 server 发送信息

传输层中传送的信息分为四类：

1. 请求（request）：A 向 B 发送请求，同时 B 必须回应 A
2. 结果（result）：收到请求后，B 返回的就是结果
3. 错误（error）：二者建立连接或者对话期间都可能发生错误，并告知对方
4. 通知（notification）：这是一种不期待回复的消息

所有传输的信息的格式都遵循 JSON-RPC 2.0 格式，包括错误处理码也是：

```typescript
enum ErrorCode {
  // Standard JSON-RPC error codes
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}
```

6xx 系列看起来像是请求中出现的问题，比如 600 就是比较笼统的不合法请求，601 就是方法不存在，6202 是参数不合法，603 是内部错误（奇怪，他怎么混进来的，莫非是特例），700 就是更神奇的错误，JSON parse 失败

文档里面还提到一些最佳实践……在我看来没必要专门记载，瞅一眼就行。里面最让我好奇的是进度管理，文档提到要对耗时长的操作使用 process token，逐步报告进度，并尽可能让 client 知情总进度。除了进度管理，还有一个最重要的是安全考量，在我看来这是 MCP 走向大规模应用的一个必须重视的点。有一个博主提到：

> MCP 要想发展普及起来，必须要借助互联网的力量，单纯依靠本地的服务能力，能够做到的事太过有限，而且效果不一定比得上本地专有的工具效率高，比如现有的 git 以及 filesystem 等 MCP 工具。虽然随着开发的提升，这些 server 未来肯定也能做更多的事，但终究不如在线服务给出的想象力高……我希望未来能看到这样的开发模式，开发者说出自己的想法，然后大模型借助 MCP 的能力，精确的编排工作流，而具体的实现细节都隐藏在这些在线服务中！
>
> <br />
>
> <div style="text-align: right">——沃兹基硕德</div>