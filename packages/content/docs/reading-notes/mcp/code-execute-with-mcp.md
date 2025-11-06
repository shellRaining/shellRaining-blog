---
title: 基于代码执行的 MCP
tag:
  - reading-notes
  - mcp
date: 2025-11-05
series:
  name: MCP 学习
  part: 6
---

## 现有 MCP 存在的问题

1. 工具定义挤占上下文窗口空间

   agent 为了使用 MCP 工具，必须实现加载所有的 tools 到上下文中，当只有一两个 server 的时候，这对上下文的负担不大，但如果有数百乃至数千种工具同时出现在上下文窗口时，agent 的运行速度下降和成本攀升

2. 使用 MCP tool 时，模型需要生成 tool call 的参数，然后接收返回值，这一来一回，可能会非常消耗 token，比如下面这种场景，我们想要给 server 发送一个很大的文件，就需要让模型首先读取文件，然后重新复述文件的内容来作为参数……这也太蠢了，我们可以生成文件的路径来避免这种情况，但 Remote 类型的 server 该如何获取这个文件呢？

> [!note]
> 输入端确实是一个问题，输出端也存在内容量过大的问题，不过我们是否可以通过分页来解决这个问题……似乎也不是很优雅

下图描述了 agent 发现和使用 MCP tools 的流程

![image.png](https://2f0f3db.webp.li/2025/11/20251105102804123.png)

## 一个可能的解决方案，基于代码执行的 MCP

Anthropic 这篇文章给出的解决方案是：将 MCP 服务器呈现为代码 API 而非让 agent 直接进行工具调用。agent 需要通过编写代码与 MCP 服务器交互。实现这一目标有多种方法，其中一种方案是从连接的 MCP 服务器生成所有可用工具的文件树结构。

```bash
servers
├── google-drive
│   ├── getDocument.ts
│   ├── ... (other tools)
│   └── index.ts
├── salesforce
│   ├── updateRecord.ts
│   ├── ... (other tools)
│   └── index.ts
└── ... (other servers)
```

在上面代码可以看到每个工具都对应一个文件，文件内部大致是：

```typescript
// ./servers/google-drive/getDocument.ts
import { callMCPTool } from "../../../client.js";

interface GetDocumentInput {
  documentId: string;
}

interface GetDocumentResponse {
  content: string;
}

/* Read a document from Google Drive */
export async function getDocument(
  input: GetDocumentInput,
): Promise<GetDocumentResponse> {
  return callMCPTool<GetDocumentResponse>("google_drive__get_document", input);
}
```

模型使用这个 tool 时，实际上是生成一段代码：

```typescript
import * as gdrive from "./servers/google-drive";
import * as salesforce from "./servers/salesforce";

const transcript = (await gdrive.getDocument({ documentId: "abc123" })).content;
await salesforce.updateRecord({
  objectType: "SalesMeeting",
  recordId: "00Q5f000001abcXYZ",
  data: { Notes: transcript },
});
```

整个流程变成了下面这样：

1. 发现工具：先列出 `./servers/` 目录以查找可用服务器（如 `google-drive` 和 `salesforce` ）
2. 读取定义：读取所需的特定工具文件（如 `getDocument.ts` 和 `updateRecord.ts` ）来理解每个工具的接口
3. 执行工具：生成上面的代码，然后执行

Anthropic 和 Cloudflare 称这种方式非常节省 token，使用量从 15 万降至 2000 个，节省了 98.7%

> [!info]
> 这种方式需要让很多 server 开发者去调整代码……我感觉这是不现实的，这种方式似乎比较适合我们编写的内置 MCP
> 或者官方对 MCP 协议进行调整，能够在开发者不修改代码的前提下，完成 tools 的按需暴露，他们提到了另一种暴露的方式，即提供一个 `search_tools` 工具，让模型输入所需的工具关键词，然后由 server 执行搜索
>
> 这里提到的搜索是放置到 server 端，有没有可能放置到 client 端？mcp zero 提到他们的实践是分两级进行检索，先搜索 server，再搜索他们的 tools

## 优势

1. 渐进式发现工具：将工具以代码形式呈现在文件系统中，可使模型按需读取工具定义，而非一次性读取所有内容
2. 上下文友好：在处理大型数据集时，智能体可以先通过代码对结果进行筛选和转换（比如做个 slice 或者 map 之类的操作），再将其返回

   ```typescript
   // 不使用 code execution 的情况
   TOOL CALL: gdrive.getSheet(sheetId: 'abc123')
           → 返回完整的 100000 行数据

   // 使用 code execution 的情况
   const allRows = await gdrive.getSheet({ sheetId: 'abc123' });
   const pendingOrders = allRows.filter(row =>
     row["Status"] === 'pending'
   );
   console.log(`Found ${pendingOrders.length} pending orders`);
   console.log(pendingOrders.slice(0, 5)); // 只展示五行结果
   ```

3. 更强大的流程控制：循环、条件判断和错误处理可以通过代码实现，无须让模型去决断

   ```typescript
   let found = false;
   while (!found) {
     const messages = await slack.getChannelHistory({ channel: "C123456" });
     found = messages.some((m) => m.text.includes("deployment complete"));
     if (!found) await new Promise((r) => setTimeout(r, 5000));
   }
   console.log("Deployment notification received");
   ```

   如果不通过代码实现，agent 就需要循环交替调用 MCP 工具和休眠命令，这对执行时间非常长的后台 MCP tool 非常有用

4. 状态持久化：agent 可将中间结果写入文件，从而能够恢复工作并追踪进度

   ```typescript
   const leads = await salesforce.query({
     query: "SELECT Id, Email FROM Lead LIMIT 1000",
   });
   const csvData = leads.map((l) => `${l.Id},${l.Email}`).join("\n");
   await fs.writeFile("./workspace/leads.csv", csvData);

   // 稍后执行就可以读取文件，不会丢失状态
   const saved = await fs.readFile("./workspace/leads.csv", "utf-8");
   ```

   agent 还能将这类代码保存为可复用函数，以供未来使用。这部分就和 Cluade Code 的 skill 关系非常密切！

## 尾声

> [!warning]
> With code execution environments becoming more common for agents, a solution is to present MCP servers as code APIs rather than direct tool calls
>
> 文章里提到了这一句话，“代码执行环境在智能体中日益普及”，我不太明白这里的执行环境指的是什么，node 或者 python 运行环境？但我看主流工具似乎并没有内置运行时（比如 Cluade Code）

原文链接：[https://www.anthropic.com/engineering/code-execution-with-mcp](https://www.anthropic.com/engineering/code-execution-with-mcp)
