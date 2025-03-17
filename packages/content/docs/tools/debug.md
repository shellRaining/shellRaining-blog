---
title: JavaScript debug 模块
tag:
  - tools
date: 2025-02-24
---

按理来说，debug 模块应该是非常常用的一个包，但是直到今天我才在 vitepress 中注意到他。先看一下我当时面对的代码上下文

```typescript config.ts
export async function resolveUserConfig(
  root: string,
  command: "serve" | "build",
  mode: string,
): Promise<[UserConfig, string | undefined, string[]]> {
  // ...
  if (!configPath) {
    debug(`no config file found.`);
  } else {
    const configExports = await loadConfigFromFile(
      { command, mode },
      configPath,
      root,
    );
    if (configExports) {
      userConfig = configExports.config;
      configDeps = configExports.dependencies.map((file) =>
        normalizePath(path.resolve(file)),
      );
      console.log(configDeps); // [!code focus]
    }
    debug(`loaded config at ${c.yellow(configPath)}`); // [!code focus]
  }

  return [await resolveConfigExtends(userConfig), configPath, configDeps];
}
```

我当时正在学习 vitepress 配置是如何解析，随手使用 `console.log` 打了个日志，正如上面代码块聚焦的部分

```json package.json
{
  "scripts": {
    "docs:dev": "wait-on -d 100 dist/node/cli.js && pnpm -F=docs dev",
    "docs:debug": "NODE_OPTIONS='--inspect-brk' pnpm docs:dev"
  }
}
```

然后执行了 `docs:dev` 命令，发现 `console.log` 的输出存在，但是 `debug` 函数的输出没有！一阵惊奇感传来，不禁怀疑是不是错误信息被重定向到了其他地方，伴着这个疑问，我开始重新学习 `debug` 这个模块

## 为什么要使用这个模块

平时我都是使用 `console.log` 来调试的，这没有什么问题，但是如果你面对的是一个非常大的项目呢（就比如 vitepress），你很难想象从一堆 `console.log` 中找到你想要的信息是多么痛苦的事，同时如果你某天不想要这些 debug 信息了，你还需要一个个删除这些语句，除此之外，一口气打印很多 log 也是不可接受的，我们希望一个项目能够

1. 有一个统一的 debug 开关，方便控制
2. 能够清晰、快速地从一些 debug 信息中找到你想要的信息（即美观输出）
3. 能够提供命名空间功能，将不同地方的信息分组，有选择的展示，从而减少输出量

自己写一个函数当然是可以的，但是你还要面对复杂的输出环境（比如 TTY，浏览器，不同的终端），光是适配就已经是很大的工作量了，因此选择一个现成的库是一个更好的选择！这就是 `debug` 存在的意义

## 痛点解决

我们只讨论 node.js 环境下的使用，浏览器环境请自行看[文档](https://github.com/debug-js/debug)

先从一个样例来讲起：

```typescript
const _debug = require("debug");
const debug = _debug("my-namespace");

debug("这是一个调试消息");
debug("对象: %O", { key: "value" });
```

我们可以看到前两行代码首先引入了模块，然后定义了命名空间 `my-namespace`，定义命名空间后返回了一个函数，通过这个函数我们可以输出调试信息
