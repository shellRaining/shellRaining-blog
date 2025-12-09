---
title: 编写 MCP 的最佳实践
tag:
  - reading-notes
  - mcp
date: 2025-12-09
series:
  name: MCP 学习
  part: 7
---

## 编码通用最佳实践

编写 MCP server 本质上就是写代码，有一些通用的编码最佳实践需要遵循，我们这里简单介绍：

### 安全处理错误与资源

这不仅是 MCP 编写时的最佳实践，更是编写所有生产环境代码的最佳实践，比如 TypeScript，你应该对所有 await 的操作做 try catch 处理，避免遗漏的 error 导致程序崩溃

- 明确区分协议错误、输入校验错误、运行时错误。这里的协议层错误是指 MCP SDK 无法处理的错误，比如 JSON-RPC parse error 等，具体可以看 [这篇文章](https://shellraining.xyz/docs/reading-notes/mcp/core-architecture.html#%E4%BC%A0%E8%BE%93%E5%B1%82)
- 对于输入错误，工具内部采用严格的输入校验（TS 使用 zod，Python 使用类型提示或 Pydantic 等）。下面是两个规定输入输出的例子，使用这些工具可以在 IDE 获取非常精确的类型补全，因此极力推荐编写良好的 schema 定义

  ```typescript
  export const FetchArgsSchema = z.object({
    url: z.string().describe("URL to fetch"),
    max_length: z
      .number()
      .int()
      .positive()
      .max(1000000)
      .default(5000)
      .describe("Maximum number of characters to return"),
    start_index: z.number().int().min(0).default(0).describe("On return ..."),
    raw: z.boolean().default(false).describe("Get the actual xxx"),
  });

  const myToolOutputSchema = z.object({
    status: z.string(),
    data: z.object({
      result: z.number(),
    }),
  });
  ```

- 对于运行时错误，对所有外部交互设置合理超时并捕获异常
- 还有一些 edge case，一般集中在与运行环境的交互上，比如文件 IO，未关闭的句柄、协程、网络连接等资源

### 可观测性

为了排查问题，需要提供明确、可分析的日志。我们这里只大体讲述日志覆盖哪些方面，详细的规则可以看后面的章节

- 使用结构化日志格式（如 JSON），现在很多日志库都支持了，比如 TypeScript 里面的 pino
- 输出 RPC 调用、耗时、错误等关键事件到 stderr，以及时发现代码运行时的异常，以及为性能优化做铺垫
- 在宿主环境中保持 MCP 日志可访问，以便调试协议解析异常

## 编写 MCP 共通的最佳实践

MCP 粗略可以分为两种通信方式，stdio 和 remote，无论哪种方式，都有一些共通的最佳实践需要遵循。这里简单介绍一下：

### 优先使用官方 SDK，而非自行实现 JSON-RPC

官方 SDK 已实现 MCP 的核心机制，包括：

- JSON-RPC 序列化与传输
- 初始化流程、错误处理与协程管理
- 工具、资源、提示模板等能力的注册与调度

强烈建议使用官方 TS SDK 或 Python FastMCP（python 原版的 SDK 不是很易用），以避免低层协议处理错误。自行实现 JSON-RPC 仅适用于非常特殊的场景（VSCode 和 playwright MCP 可能是出于包体积的考虑，自行实现了 MCP 协议）

### 合理设计工具（Tool）

Tool 是 MCP server 的核心抽象，设计良好的 tool 能显著提升可用性，一些良好实践如下：

- 单一职责：一个 tool 应只处理一类操作。
- 明确参数：定义清晰的结构化输入 schema，避免模糊参数。通过
- 结构化输出：工具返回的结果应便于模型进一步处理，而不仅是自然语言文本。我们可以通过给工具返回带上 `structuredContent` 实现这一点
- 幂等或可重复：尽可能降低重复调用带来的副作用风险。
- 无状态 tool：尽可能减少与环境的交互，这也是为了上面幂等所做的努力

比如下面就是一个定义良好的 tool

```TypeScript
const myToolOutputSchema = z.object({
    status: z.string(),
    data: z.object({
        result: z.number(),
    }),
});

server.registerTool(
    'my_tool',
    {
        title: 'My Tool',
        inputSchema: xxx, // 这里定义输入的 schema，这个例子中没有输入，空着就行
        outputSchema: myToolOutputSchema,
    },
    async (args) => {
        // ... tool 逻辑 ...
        const resultData = { status: 'success', data: { result: 42 } };
        return {
            structuredContent: resultData, // 这里返回结构化的数据
            content: 'The tool executed successfully and returned a result.', // 可选的返回非结构化数据
        };
    }
);
```

## stdio 格式

### 严格区分 stdout 与 stderr

Stdio 模式下，MCP server 使用 **stdout 作为唯一的协议输出通道**。任何非 JSON-RPC 内容（例如 print、日志、调试信息）一旦写入 stdout，都会破坏协议解析并导致连接中断

因此有以下建议：

- 日志消息仅通过 stdout 输出，不得混入其他内容。比如：
  - TypeScript 使用 `console.error` 而不是 `console.log`
  - go 使用 `fmt.Fprintf(os.Stderr, ...)` 而非 `fmt.Printf(...)`
  - python 使用 `print(..., file=sys.stderr)` 而非 `print(...)`

  输出的日志一般在控制台可以看到，以 VSCode 和 fetchRaining MCP 为例（一般 IDE 都支持，比如 Trae、Comate），在输出一栏选中对应的通道，VSCode 这里是 `MCP: ${server name}`

  ![](https://2f0f3db.webp.li/2025/12/mcp-channel.png)

- 如果寄宿的客户端一般不展示 stderr 的信息，可以写入到一个文件中，比如使用 `pino` 库，可以参考 [fetchRaining MCP 的实现](https://github.com/shellRaining/fetchRaining/blob/main/src/shared/Log.ts)，使用文件记录日志，方便出现问题后查找现场。同时使用文件记录日志还有一个好处，方便使用各种 coding agent 直接查看文件来分析

  ![image-20251209221615800](https://2f0f3db.webp.li/2025/12/image-20251209221615800.png)

  我这里的例子是上传到了 `~/.local/state/fetchraining/logs/app.jsonl` 下，这样比较符合 XDG 规范

### 按长连接进程的方式设计服务

在 Stdio 模式中，宿主会以子进程方式启动 MCP server，并保持长时间连接。因此需要时刻注意服务的复用和清理，一些最佳实践如下：

- 避免将每次工具调用视为一次性执行。调用工具的实际上是大模型，你可以把他看作一个人，具有很大的不确定性，如果在工具逻辑里初始化大量资源，每次调用都重新加载，就会造成很大的系统负担，我们可以适当的在进程内部使用缓存、连接池或持久化资源
- 实现优雅退出逻辑，处理 SIGTERM、SIGINT 以确保资源正确释放。

## remote 格式

这里的 remote 格式的 MCP server 指的是 Streamable HTTP，相比已经废弃的 SSE 协议，他更稳定，他也分为两种，有状态和无状态，我们这里推荐后者，因为在高并发的环境下更容易拓展，为更多人服务，下面介绍一些最佳实践

### 清晰的 HTTP 接口边界

我们需要将 MCP endpoint 固定在单一路径（如 `/mcp`），这样做有很多好处

- 首先是约定俗成，社区中一般以 `/mcp` 作为 Streamable HTTP 的 server 端点，用 `/sse` 作为 SSE 连接方式的端点
- 其次是有助于 MCP client 自动识别 MCP server 的类型，比如 Comate 就有根据端点自动识别 server 类型的能力

### 多客户端连接与并发处理

与 stdio 只面对“单个本地客户端”不同，Streamable HTTP 服务器天然要处理多个客户端和并发请求。设计时尽量保持无状态，或者使用显式的 session 标识（header、token 中携带）

如果不得不使用有状态的服务，对于并发特别高的服务，使用连接池、协程模型或线程池来处理高并发，避免阻塞整个服务。同时为每个请求配置合理的服务器超时和反向代理超时，防止长时间占用连接

### 网络层面的健壮性与安全性

- 测试环境可以使用 HTTP 来抓包 debug，但生产环境必须运行在 HTTPS 之上，避免被窃取信息
- 实现认证与鉴权机制，如 Bearer token 或 OAuth（比如 GitHub MCP server 就支持 OAuth 认证）
- 针对公网部署，引入限流、IP 过滤、WAF 等通用 Web 安全措施
