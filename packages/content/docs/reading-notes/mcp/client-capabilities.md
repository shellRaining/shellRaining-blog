---
title: 客户端能力
tag:
  - reading-notes
  - mcp
date: 2025-07-19
series:
  name: MCP 学习
  part: 4
---

看本文之前，建议先看完前面的章节，了解什么是客户端能力

## Roots

### 定义与用途

在初始化的时候，如果客户端声明了 `roots` 能力，说明服务器可以在 roots 限定的范围内，对客户端所在的文件系统执行一些操作，比如最基础的读写（至于怎么读写不知道，只是知道了能操作的范围），支持该能力的客户端必须能够响应 server 的 roots list 请求，并在该列表发生变更时发送通知。

roots 常被用来定义项目根目录，代码库位置，API 端点，配置位置（文档是这么说的），但我似乎只看到了他在 stdio 方式通信的用武之地，Remote MCP server 似乎不需要客户端提供的这项能力，因为提供了也没法通过文件系统操作访问，我搜了一下官方仓库的 discussion，也看到类似的问题

https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/90#discussioncomment-12972566

### 生命周期

![image-20250720094818771](https://2f0f3db.webp.li/2025/07/image-20250720094818771.png)

上图是 roots 能力在使用时的信息流图

1. 初始化阶段客户端声明 roots 能力
2. 服务端发起 `roots/list` 请求
3. 客户端返回可用 roots 列表
4. 当客户端可用 roots 发生变化时，向服务端发送 `notifications/roots/list_changed` 通知
5. 重复 2 和 3 步

### 实战例子

我们写一个简单的 server 的例子：

```TypeScript
const server = new McpServer(
  {
    name: "simple-roots-server",
    version: "1.0.0",
  },
  { capabilities: {} },
);

let roots: string[] = [];

function extractRoots(response: ListRootsResult) {
  if (response && "roots" in response) {
    return response.roots.map((root) => root.uri);
  }
  return [];
}

server.server.oninitialized = async () => {
  const clientCapabilities = server.server.getClientCapabilities();

  // 由于 roots 是客户端能力，因此使用前需要检查
  if (clientCapabilities?.roots) {
    const response = await server.server.listRoots();
    roots = extractRoots(response);
    console.error("初始工作区的项目路径有: ", roots);
  } else {
    console.error("客户端不支持 roots 能力");
  }
};

server.server.setNotificationHandler(
  RootsListChangedNotificationSchema,
  async () => {
    const response = await server.server.listRoots();
    roots = extractRoots(response);
    console.error("工作区的项目路径更新为: ", roots);
  },
);

// 注册一个使用 roots 功能的工具
server.registerTool(
  "print-pwd",
  { description: "输出当前工作区的所有项目路径" },
  async (): Promise<CallToolResult> => {
    return {
      content: [
        {
          type: "text",
          text: `当前工作区的项目路径有: ${roots.join(", ")}`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
server.connect(transport);
```
