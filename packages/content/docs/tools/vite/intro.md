---
title: 重拾 vite
tag:
  - tools
  - vite
date: 2025-02-25
---

由于 vitepress 强依赖 vite 的各种 API，为了阅读他的源码，我不得不附带学习一下这个工具，最开始接触 vite 还是创建一个新的 vue 项目中，我只感觉他比 webpack 快很多，仅此而已，现在为了新的需求，说一声，vite 你好！

我是通过 vite 文档学习的，文档虽然详细，但毕竟条理性和书籍没法比，所以这篇文章没有什么逻辑，更多的像是学习时随手记的笔记，聊作参考

## 开始

Vite 是一个前端构建工具，它由两部分构成：

1. 一个开发服务器，基于原生的 ES 模块，能够提供快速地热更新
2. 一些构建指令，能够使用 rollup 来打包项目

安装方式如下，运行如下命令：

```bash
pnpm create vite
```

然后按照提示操作即可

Vite 6 已经开始彻底拥抱 ESM 了！作为开发者，我们必须编写符合 ESM 的源代码。对于构建产物，开发阶段，构建产物需要目标浏览器环境支持 `ESNext`；生产构建阶段，构建产物需要目标浏览器环境支持诸如控制合并运算符等特性（或者说 ES2020）。对于那些不满足条件的环境，需要使用 [`@vitejs/plugin-legacy`](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy) 来进行 polyfill

和其他的静态 HTTP 服务器一样，vite 开发服务器也有根目录这个概念，他指的是服务文件的位置，源码中绝对路径都是以这个根目录为基准的来解析的。如果想要更换根目录路径，可以通过 `vite serve some/sub/dir` 来指定，需要注意的是，vite 会在根目录下寻找自己的配置文件（`vite.config.js`），因此更改根路径后，也需要移动配置文件到最终的根路径

## 理念

Vite 对速度有一种执念，他做了如下工作来优化开发和构建体验：

1. 借助更快的原生工具：
   开发阶段，vite 会使用 esbuild 或者 SWC 这样原生的构建工具来替换较慢的基于 JavaScript 的工具
2. 源码按需转换：
   vite 将代码区分为**依赖**和**源码**两部分
   依赖是开发时不会变动的纯 JavaScript，vite 会使用 esbuild 进行预构建。
   源码通常是一些非 JavaScript 代码（比如 vue，CSS 文件等），需要转换。同时，并不是所有的源码都要同时被加载（例如按照路由拆分代码模块）
   因此，vite 通过 ESM 的机制，实现了按需转换源码
3. 尽可能的缓存：
   Vite 同时利用 HTTP 头来加速整个页面的重新加载：源码模块的请求会根据 `304 Not Modified` 进行协商缓存，而依赖模块请求则会通过 `Cache-Control: max-age=31536000,immutable` 进行强缓存，因此一旦被缓存它们将不需要再次请求。

> [!tip]
> 有关浏览器缓存，可以看[这篇博客](../../book/MDN/cache.md)

## 特性

### 裸模块导入

原生 ES 不支持下面的裸模块导入：

```js
import { someMethod } from "my-dep";
```

这里的 `my-dep` 就是一个裸模块，实际上他的路径应该类似于 `/node_modules/.vite/deps/my-dep.js?v=f3sf2ebd`。我们可以在源码中写裸模块导入，然后 vite 会自动在打包时将裸模块替换为实际路径，方便我们开发

与此同时，vite 还会对依赖裸模块进行预构建（前面提到），将不是 ESM 的模块（如 CommonJS、UMD）的模块转换成 ESM

- [ ] [裸模块导入的原理](https://zhuanlan.zhihu.com/p/414663301)

### 热更新

在开发时，我们不希望一刷新页面，之前的操作状态都消失不见，HMR 就能为我们解决这个问题。vite 提供了一系列的 HMR API，让我们可以即时、准确的更新页面的同时，无需重新加载页面或清除应用程序状态。当然对于常用的框架，vite 提供的插件已经帮我们把 HMR 做好了，无需我们操心

- [ ] [深入浅出 HMR 原理](https://zhuanlan.zhihu.com/p/690033522) 阅读
- [ ] vitepress 依赖了 vue，同时自定义主题依赖了 vue，后者应该如何指定 vue 版本，避免打包重复
- [ ] 类型声明文件为什么要单独置于一个新的 `types/index.d.ts`

### TypeScript 支持

Vite 天然支持导入 TypeScript，开发阶段能够按需转换，但是这个过程并不支持类型检查，因为按需检查需要了解整个模块图，导致拖慢性能。因此开发时推荐使用 `tsc --noEmit --watch` 来实现实时类型检查，或者使用 [vite-plugin-checker](https://github.com/fi3ework/vite-plugin-checker)，它能够在浏览器显示 TypeScript 相关的类型错误

但是需要注意一些 `tsconfig.json` 的配置：

1. `isolatedModules`：由于 vite 使用 esbuild 进行逐文件的构建，并不会使用 tsc 进行整个工程的类型检查，所以这个选项是需要打开的，具体可以看 [TypeScript isolatedModules](../../book/TypeScript/config.md#isolatedModules)
2. `target`：还是由于使用了 esbuild，`tsconfig.json` 中的 `target` 选项会被忽略，应该优先指定 `vite.config.js` 中的 `build.target` 或者 `esbuild.target` 字段
3. 除了这些还有很多的编译选项都会收到影响，可以查看[官方文档](https://cn.vite.dev/guide/features#other-compiler-options-affecting-the-build-result)

还有就是 vite 的类型提示工具都是为了 nodejs 环境编写的，如果要需要给客户端代码提供类型支持，可以使用三斜线指令或者 `types` 编译选项手动引入，他提供了以下类型定义补充

- 资源导入 (例如：导入一个 `.svg` 文件)
- `import.meta.env` 上 Vite 注入的 [常量](https://cn.vite.dev/guide/env-and-mode.html#env-variables) 的类型定义
- `import.meta.hot` 上的 [HMR API](https://cn.vite.dev/guide/api-hmr.html) 类型定义

看一个资源导入类型定义的例子

```typescript main.ts
// 如果没有手动引入客户端类型支持，这一行会报错，并且不能推导出 src 是 string 类型
import src from "./assets/img.png";

console.log(src); // /src/assets/img.png
```

```json tsconfig.json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

注意如果在 `tsconfig.json` 中引入，需要手动将 `@types` 下的类型文件都包含进来，这是这个指令的限制之处，因此 vite 的模板默认采用下面的三斜线指令

```typescript src/vite-env.d.ts
/// <reference types="vite/client" />
```

### HTML 处理

由 HTML 元素引用的资源，例如 `<script type="module" src>` 和 `<link href>`，会作为应用的一部分进行处理和打包。除此之外，还有很多标签中引用元素的路径也会被处理，比如 `audio`，`img` 等，甚至 `meta` 标签也会进行特殊处理，比如 opengraph 协议需要的 `og:image` 等

要退出对某些元素的 HTML 处理，可以在元素上添加 `vite-ignore` 属性，这在引用外部 assets 或 CDN 时非常有用。

### CSS

#### css 导入和 @import 内联

vite 甚至可以让你在 JavaScript 或者 vue 代码中直接导入 css，导入的 css 文件的内容会被插入到 `<style>` 标签中

::: code-group

```js [main.ts]
import "./style.css";

console.log(src);
```

```css [style.css]
body {
  background-color: black;
}
```

```html [output.html]
<head>
  <script type="module" src="/@vite/client"></script>
  <link href="style.css" rel="stylesheet" />
  <style
    type="text/css"
    data-vite-dev-id="/Users/shellraining/Documents/archive/vite/vite-plain/src/style.css"
  >
    body {
      background-color: black;
    }
  </style>
</head>
```

:::

> [!tip]
>
> 这里引入的 css 已经被内联到了 HTML 了，为什么还有一个 link 标签去请求 css 文件呢？
>
> 这是因为在 Vite 的开发服务器中，同时存在两种方式来处理 CSS：
>
> 1. 通过 `<link>` 标签引用外部 CSS 文件
> 2. 通过内联 `<style>` 标签直接插入 CSS 内容
>
> 存在这种机制是处于下面的考量
>
> - **快速热更新机制**
>
>   Vite 设计的核心之一是提供极快的热模块替换(HMR)体验。内联的 CSS 样式（带有 `data-vite-dev-id` 属性）是为了支持高效的 HMR。当你修改 CSS 文件时，Vite 只需要更新这个内联样式块，而不需要重新加载整个页面或外部资源。
>
> - **兼容性和渐进式加载**
>
>   外部的 `<link>` 标签是为了确保在某些情况下（如 HMR 连接失败或初始化前）CSS 仍能正常工作。它提供了一种后备机制。
>
> - **开发调试友好**
>
>   保留对原始 CSS 文件的引用有助于在开发者工具中更容易地定位和调试样式问题。
>
> 这种行为仅存在于**开发模式**下。当你构建生产版本时，Vite 会进行适当的优化：
>
> - 在生产构建中，CSS 通常会被提取到单独的文件中
> - 小型 CSS 可能会被内联以减少HTTP请求
> - 不会出现这种重复引入的情况
>
> 这种开发模式下的处理方式是经过精心设计的，目的是提供最佳的开发体验：快速的热更新、可靠的样式应用和良好的调试体验。虽然看起来有些冗余，但这是开发环境优化的结果，不会影响生产环境的性能。

如果想要禁用自动注入 CSS 的行为，可以通过 `?inline` 参数来关闭，被处理过的 CSS 字符串将会作为该模块的默认导出，但样式并没有被注入到页面中。默认导出的类型是 string

```css
import './foo.css' // 样式将会注入页面
import otherStyles from './bar.css?inline' // 样式不会注入页面
```

还有就是 Vite 通过 `postcss-import` 预配置支持了 CSS `@import` 内联，内联的链接也支持使用 vite 设置的路径别名

::: code-group

```javascript [vite.config.js]
export default {
  resolve: {
    alias: {
      "@styles": "/src/styles",
    },
  },
};
```

```css [style.css]
@import "@styles/colors.css";
@import "@styles/buttons.css";
```

:::

#### postcss 支持

如果项目中包含有效的 postcss 配置，例如 `postcss.config.js`，它将会自动应用于所有已导入的 CSS。

除了 postcss，还可以使用正处于试验阶段的 [Lightning CSS](https://lightningcss.dev/)。它是由 rust 编写的类似后处理器的东西，速度胜 postcss 一筹！首先安装依赖

```bash
npm add -D lightningcss
```

然后在 `vite.config.js` 中通过 [`css.transformer: 'lightningcss'`](https://cn.vite.dev/config/shared-options.html#css-transformer) 来启用，如果启用，CSS 文件将由 Lightning CSS 处理，而不是 PostCSS。可以将 Lightning CSS 的选项传递给 [`css.lightningcss`](https://cn.vite.dev/config/shared-options.html#css-lightningcss) 选项来配置。

#### CSS Modules

传统的纯 CSS 开发面临几个问题：

- 全局作用域：所有 CSS 选择器都是全局的，容易造成冲突
- 样式污染：一个组件的样式可能意外影响到其他组件
- 难以维护：随着项目增大，管理全局 CSS 变得复杂

CSS Modules 是一种将 CSS 类名称局部作用域化的技术，它会自动为 CSS 类名生成唯一的标识符，从而防止样式冲突。当在组件中导入 CSS Module 时，你获得的是一个包含所有定义类名映射的对象。

::: code-group

```css [Button.module.css]
.button {
  background-color: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}

.primary {
  background-color: #1890ff;
}
```

```jsx [Button.jsx]
import styles from "./Button.module.css";

function Button(props) {
  const { primary, children } = props;
  return (
    <button className={`${styles.button} ${primary ? styles.primary : ""}`}>
      {children}
    </button>
  );
}

export default Button;
```

:::

如果在 `vite.config.js` 中将 `css.modules.localsConvention` 设置为 `camelCaseOnly`，还可以使用按名导入。

```javascript
// CSS 中类名 .apply-color 在设置完转换后变为 applyColor，这是一个合法的 JavaScript 标识符，可以直接使用
import { applyColor } from "./example.module.css";
document.getElementById("foo").className = applyColor;
```

> [!tip]
>
> 这里将 CSS Modules 放在了 postcss 章节后面，是因为前者的实现依赖于后者，vite 在转换模块 CSS 的时候使用的就是 postcss 这个工具（还有对应的插件 `postcss-modules`

#### CSS 预处理器

vite 鼓励使用原生的 CSS 语法，但是也对预处理器提供了一流的支持，比如 sass，只需要安装对应的预处理器依赖，vite 会自动检测并处理`.scss`和`.sass`文件。

```bash
npm add -D sass
```

> [!note]
>
> 这里讲一下预处理器和 postcss 之间的差异：
>
> CSS 预处理器工作在 CSS **编写阶段**，它们是:
>
> - 扩展了 CSS 语法的工具
> - 提供变量、嵌套、混合、函数等编程特性
> - 使用自己的语法（如 `.scss`、`.less`、`.styl` 文件）
> - 将这些扩展语法编译为原生 CSS
>
> PostCSS 工作在 CSS **处理阶段**，它是:
>
> - 一个用 JavaScript 转换 CSS 的工具
> - 通过插件系统工作，每个插件执行特定任务
> - 处理的是标准 CSS 或已经被预处理器处理过的 CSS
> - 可以进行自动添加浏览器前缀、压缩、代码检查等操作
>
> ```plaintext
> 开发者代码(.scss/.less/.stylus) → CSS预处理器 → 标准CSS → PostCSS → 最终CSS
>                                                   ↑
>                       原生CSS文件 ────────────────┘
> ```

### 静态资源处理

前面我们在 TypeScript 支持处提到，vite 可以处理你直接导入的静态资源，返回的是解析后的 URL

```typescript
import imgUrl from "./img.png";
document.getElementById("hero-img").src = imgUrl;
```

添加一些特殊的查询参数可以更改引入方式，详细信息可以看 [静态资源导入](https://cn.vite.dev/guide/assets.html) 文档
