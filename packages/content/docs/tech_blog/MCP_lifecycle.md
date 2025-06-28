---
title: MCP client 和 server 通信时的生命周期
tag:
  - MCP
  - tech_blog
date: 2025-06-28
---


MCP 为 client 和 server 通信定义了严谨的时序，一个完整的生命周期可以分为三部分，初始化阶段（initialization），运行阶段（operation），结束阶段（shutdown）

## initialization

该阶段主要进行协议版本的确认和能力协商，为了实现这两点，会进行下面流程

1. 客户端发起 `initialize` **请求（request）**，请求的参数必须带有三个字段 `protocolVersion`、`capabilities`、`clientInfo`
2. 服务端返回请求的响应，同理必须带有三个字段 `protocolVersion`、`capabilities`、`serverInfo`
3. 客户端接收到响应后，会给服务端发送一个 `initialized` **通知（notification）**

下图展示了 MCP 协议的整个流程

![image-20250628142206930](https://2f0f3db.webp.li/2025/06/image-20250628142206930.png)

### 版本确认

在客户端发起 `initialization` 请求时，请求携带的 `protocolVersion` 字段必须填写客户端支持的最新 MCP 协议版本

服务端收到请求后，如果发现能够支持客户端的协议版本，就把响应参数的 `protocolVersion` 也设置成这个版本，否则设置成他支持的最新的 MCP 版本

客户端收到响应后，如果支持响应中提到的 `protocolVersion`，就可以继续后面的操作，否则直接结束此次连接。

通过上述操作，就可以实现版本的确认。我们可以看一下实际请求和响应的包体内容来加深理解

```json
// 请求包
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": {
        "listChanged": true
      },
      "sampling": {},
      "elicitation": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "title": "Example Client Display Name",
      "version": "1.0.0"
    }
  }
}
```

```json
// 响应包
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "logging": {},
      "prompts": {
        "listChanged": true
      },
      "resources": {
        "subscribe": true,
        "listChanged": true
      },
      "tools": {
        "listChanged": true
      }
    },
    "serverInfo": {
      "name": "ExampleServer",
      "title": "Example Server Display Name",
      "version": "1.0.0"
    },
    "instructions": "Optional instructions for the client"
  }
}
```

比方说上面的情况，可以看到客户端支持的是 `2024-11-05` 版本协议，而服务端支持的是 `2025-06-18` 协议，按照规范此时就会结束此次连接，并且如果你使用的是 MCP 提供的官方 SDK，这个行为是不能被修改的，相关代码如下：

```typescript
export const SUPPORTED_PROTOCOL_VERSIONS = [
  LATEST_PROTOCOL_VERSION,
  "2025-03-26",
  "2024-11-05",
  "2024-10-07",
];

export class Client {
	override async connect(transport: Transport, options?: RequestOptions): Promise<void> {
    try {
      if (!SUPPORTED_PROTOCOL_VERSIONS.includes(result.protocolVersion)) {
        throw new Error(
          `Server's protocol version is not supported: ${result.protocolVersion}`,
        );
      }
    } catch (error) {
      // Disconnect if initialization fails.
      void this.close();
      throw error;
    }
  }
}
```

### 能力协商

在上个小节我们提供的两个包体中，都存在 `capabilities` 字段，分别表示客户端和服务端支持的能力，可以看到客户端支持 `roots`、`sampling`、`elicitation` 三种能力，不要看子项是空对象就以为他不支持这个能力！同理可以看到服务端支持 `logging`、`prompts`、`resources`、`tools` 四种能力。

至于为什么他们的值是一个对象，这是考虑到有的能力他还需要提供两种子能力 `listChanged` 和 `subscribe`，前者表示列表变更通知（针对 `prompts`、`tools`、`resources`），后者表示订阅单个项目的变更（只针对 `resources`）

完整的客户端能力如下：

| Category | Capability     | Description                                                  |
| -------- | -------------- | ------------------------------------------------------------ |
| Client   | `roots`        | Ability to provide filesystem [roots](https://modelcontextprotocol.io/specification/2025-06-18/client/roots) |
| Client   | `sampling`     | Support for LLM [sampling](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling) requests |
| Client   | `elicitation`  | Support for server [elicitation](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation) requests |
| Client   | `experimental` | Describes support for non-standard experimental features     |

完整的服务端能力如下：

| Category | Capability     | Description                                                  |
| -------- | -------------- | ------------------------------------------------------------ |
| Server   | `prompts`      | Offers [prompt templates](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts) |
| Server   | `resources`    | Provides readable [resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources) |
| Server   | `tools`        | Exposes callable [tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) |
| Server   | `logging`      | Emits structured [log messages](https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/logging) |
| Server   | `completions`  | Supports argument [autocompletion](https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/completion) |
| Server   | `experimental` | Describes support for non-standard experimental features     |

## operation

运行阶段没有什么好说的，只需要双方都遵循协商好的版本和能力进行通信即可

## shutdown

关闭阶段由客户端发起，对于 stdio 通信模式，客户端首先关闭子进程（即服务器）的输入流，然后等待服务器退出，若在规定时间内没有退出，发送 `SIGTERM`，若还没有退出，发送 `SIGKILL`。对于 HTTP 通信方式，通信断开似乎由 HTTP 链接接管了

## 感想

这个生命周期的文章是给 MCP SDK 开发者参考的，SDK 的源码忠实反映了该规范的每一步，因此透彻的理解该文章就省掉了大量的阅读源码的时间，哪怕是不得以阅读源码时也有了信标，不至于迷路在各种 edge case 中
