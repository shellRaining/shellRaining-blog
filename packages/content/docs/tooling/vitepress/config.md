---
title: vitepress 配置文件的工作流程
tag:
  - tooling
  - vitepress
date: 2024-07-07
collection: vitepress
---

vitepress 的配置文件是位于 `.vitepress/config.ts` 下的，我们需要在这个文件中默认导出一个 `UserConfig` 类型的对象，但是这个配置文件是如何反映到客户端上的呢？我们从零开始看一下。

## 服务端获取解析用户配置

### 执行 vitepress 命令

参照 [vitepress 文档](https://vitepress.dev/zh/guide/getting-started) 初始化一个项目后，我们会执行 `bun run docs:dev` 来启动一个热更新服务器（对应 `vitepress dev`），我们编译后的页面就可以通过 `localhost:5173` 来访问。执行这个命令时，包管理器会查看 `vitepress` 的 `package.json`，并在其中找到了一个 `bin` 字段，他指向了一个编译后的 JS 文件 `bin/vitepress.js`，这个文件并不复杂，内容如下：

```javascript
#!/usr/bin/env node
import("../dist/node/cli.js");
```

可以看到引入了另一个编译后的 JS 文件 `dist/node/cli.js`，这个文件是 vitepress 的 CLI 入口文件，其对应的未编译前的 TS 文件是 `src/node/cli.ts`

### 运行 vitepress cli

`src/node/cli.ts` 这个脚本解析用户输入的命令，我们刚才执行的是 `vitepress dev`，因此会进入代码中的 `if dev` 分支，做如下操作：

```typescript src/node/cli.ts
if (!command || command === "dev") {
  // ...

  const createDevServer = async (isRestart = true) => {
    const server = await createServer(root, argv, async () => {
      if (!restartPromise) {
        restartPromise = (async () => {
          await server.close();
          await createDevServer();
        })().finally(() => {
          restartPromise = undefined;
        });
      }

      return restartPromise;
    });
    await server.listen(undefined, isRestart);
    logVersion(server.config.logger);
    server.printUrls();
    bindShortcuts(server, createDevServer);
  };
  createDevServer(false).catch((err) => {
    createLogger().error(
      `${c.red(`failed to start server. error:`)}\n${err.message}\n${err.stack}`,
    );
    process.exit(1);
  });
}
```

简而言之就是通过 `src/node/server.ts` 中的 `createServer` 函数创建一个服务器，然后监听端口，打印一些信息，绑定一些快捷键

### 创建开发服务器

```typescript src/node/server.ts
import { createServer as createViteServer, type ServerOptions } from "vite";

export async function createServer(
  root: string = process.cwd(),
  serverOptions: ServerOptions & { base?: string } = {},
  recreateServer?: () => Promise<void>,
) {
  const config = await resolveConfig(root);

  if (serverOptions.base) {
    config.site.base = serverOptions.base;
    delete serverOptions.base;
  }

  return createViteServer({
    root: config.srcDir,
    base: config.site.base,
    cacheDir: config.cacheDir,
    plugins: await createVitePressPlugin(config, false, {}, {}, recreateServer),
    server: serverOptions,
    customLogger: config.logger,
    configFile: config.vite?.configFile,
  });
}
```

在创建服务器之前，先调用了 `src/node/config.ts` 中的 `resolveConfig` 函数，这个函数会解析用户的配置文件，我们在这里的配置文件是 `.vitepress/config.ts`，自此，我们就在服务端获取了用户的配置，并将他保存到了 `config` 变量中，以供后续客户端使用

## 客户端请求用户配置流程

在开发阶段，我们首先输入命令 `bun run docs:dev` 启动一个开发服务器，然后在浏览器打开首页，这个过程向服务器请求文件的顺序为：

1. `index.html`
1. `client/app/index.js`
1. `client/app/data.js`
1. `@siteData`

### 客户端初始化

我们这里介绍的初始化过程是从文档加载起，到向服务器请求配置文件结束，不包含其他诸如路由初始化等。下面是我们执行初始化过程的栈帧

```plaintext
initData (data.ts:74)
createApp (index.ts:75)
（匿名） (index.ts:169)
```

我们从匿名函数开始执行（实际上就是入口脚本的全局作用域代码），调用了 `createApp` 来创建一个 app，而在这个过程中我们会调用 `initData` 来初始化站点配置

### 向服务器请求配置

前三步都是正常的文档和脚本请求，只有最后一个是虚拟模块请求，我们通过配置 `vite` 开发服务器，使用了一个 `vitePressPlugin` 插件，这个插件包含 `resolveId` 和 `load` 钩子，前者用来解析客户端 `@siteData`，后者用来实际加载这个模块的内容，从而来最终返回需要的 `siteData`。

`resolveId` 没有什么好讲的，主要看 `load`，他的定义如下：

```typescript
// plugin.ts
load(id) {
  if (id === SITE_DATA_REQUEST_PATH) {
    let data = siteData
    data = serializeFunctions(data)
    return `${deserializeFunctions};export default deserializeFunctions(JSON.parse(${JSON.stringify(
      JSON.stringify(data)
    )}))`
  }
},
```

可以看到有一个 `siteData` 变量，我们先不管他，先看一下我们这个虚拟模块到底最终返回了什么，可以看到显示对 `siteData` 进行了序列化的操作，然后返回了一个字符串（最终需要浏览器执行的脚本），这个返回的字符串中还贴心地包含了一个反序列化的函数代码，等该文件传送到客户端的时候浏览器直接用该函数反序列化 `siteData` 对象，从而获取站点数据。

> [!tip]
>
> 这里的 siteData 实际上就是服务端解析用户配置出来的 `config` 的一个字段，由此可以看出在 C/S 架构中，Server 必须先启动，Client 才能发起请求（笑）

### 处理传送过来的配置

我们从服务端返回到客户端，看一下导入 `siteData` 后发生了什么。

导入后，我们调用的 `initData` 函数使用了这个 `siteData`，并且将其包裹在一个 `VitePressData` 类型的对象中返回

```TypeScript
export function initData(route: Route): VitePressData {
  const site = computed(() =>
    resolveSiteDataByRoute(siteDataRef.value, route.data.relativePath)
  )

  // ...

  return {
    site,
    theme: computed(() => site.value.themeConfig),
    page: computed(() => route.data),
    // ...
  }
}
```

并最终将这个返回的对象作为一个 symbol 注入到创建的 app 中。

```typescript
export async function createApp() {
  const router = newRouter();
  const app = newApp();

  app.provide(RouterSymbol, router);
  const data = initData(router.route);
  app.provide(dataSymbol, data);

  return { app, router, data };
}
```

## 总结

用户执行 vitepress dev 后，首先解析用户的配置，然后启动一个 vite 开发服务器，服务端的部分暂时告一段落

然后用户打开浏览器并且输入 `localhost:5173` 后，浏览器首先请求了一个 `index.html`，并且执行其中的脚本，引入了 `client/app/app.js` 和 `client/app/data.js`。

在执行 `data.js` 的过程中，浏览器会解析一个 `import siteData from '@siteData'` 引入指令，开发服务器接收到 `@site` 的请求，会交由 `VitepressPlugin` 进行处理，并最终返回被序列化后的用户配置数据，并且包含一个反序列化的函数。

客户端接收到用户数据后，将其赋值给 `siteData` 变量，并最终通过 vue 的 `provide` API 将其注入到第一步创建的 APP 中，从而可以使用 `useData` 来引入用户的配置数据。
