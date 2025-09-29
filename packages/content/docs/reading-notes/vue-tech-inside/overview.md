---
title: Vue 整体设计
tag:
  - reading-notes
  - vue
series:
  name: Vue 技术内幕
  part: 1
date: 2025-03-13
---

这个系列记录了我阅读《Vue 技术内幕》这本书的笔记，由于该书是 2022 年发行，可能有部分内容过时，因此我会更多的结合最新的 Vue 版本（`v3.5.13`）代码一起阅读和实践

## Vue3 的优化

### 源码结构

在 Vue2 的时候，所有的源码都是堆积在一个仓库中下的，都放置于 `src` 目录下，根据功能不同拆分出不同的子文件夹。Vue3 则采用 mono repo 结构，这样做有一些好处

1. 每个子包可以单独分发使用，并且可以有单独的 API、类型定义和测试代码
2. 每个子包的职责划分更加清晰，粒度更细，模块依赖关系明确
3. 可以单独引入子包来减少包体积大小

Vue2 使用 Flow 来进行 JavaScript 静态类型检查，切换到 TypeScript 后，省去了单独维护 `d.ts` 文件的烦恼，并且能支持更复杂的类型推导。我使用 tokei 计算了一下项目代码

```bash
-> % tokei packages/**/src
===============================================================================
 Language            Files        Lines         Code     Comments       Blanks
===============================================================================
 TypeScript            231        53773        43622         6224         3927
===============================================================================
```

五万行代码，确实是一个非常大的项目了

### 打包体积与性能优化

通过下面的方式，Vue3 减少了打包体积，能够更好的适应低网速环境

1. 通过 ESM 引入 tree-shaking，能够分析出用户未使用的 API，从而在打包期间使用 `terser` 等工具删除
2. 删除冷门的功能。（这也是 Vue2 和 Vue3 之间不兼容的来源吧，不过挺好的，喜新厌旧）

---

另一个老生常谈（面试经典）的就是 Vue3 是通过哪些方法实现性能优化

之前使用的是 `Object.defineProperty`，他的缺点是在劫持之前必须知道劫持哪个字段，因此如果添加或者删除对象字段，他是不能检测出来的。并且如果遇到了一个嵌套层级很深的对象，为了让他实现响应式，必须递归的将每一层的字段都设置 getter 和 setter，很消耗性能

在 Vue3 中，使用 proxy 劫持对象，可以在访问或者设置对象字段的时候获知正在操作哪个键，因此天然的没有第一个缺陷。除此之外，对于深层对象，只有真正访问到的内部对象才会被设置为响应式的，从而提升性能

---

Vue2 的更新粒度是组件，但是组件也有可能很大，同时需要响应式的数据很少，比如

```vue
<template>
  <div>static</div>
  <div>static</div>
  <div>static</div>
  <div>static</div>
  <div>{{ message }}</div>
  <div>static</div>
</template>
```

如果每次都要对这些静态节点 diff，毫无疑问是很浪费性能的。Vue3 因此引入了编译优化，在编译时生成 block tree，可以基于动态节点将模板切分成一个个嵌套区块，区块内部节点是固定的，每个区块只需要一个 Array 来追踪自身包含的动态节点

因此借助 block tree，vnode 的更新性能开始和动态数据量相关，而不是和节点数量相关

### 语法优化

语法优化主要体现在 composition API 和组合式函数两点

Vue2 使用的是 option API，会导致对同一个功能点的代码散落在单文件组件的各处，编辑一个功能点要在文件中跳转很多次，使用 composition API 后，可以将这些代码组织到一处，更方便修改（在滴滴实习的时候深有感觉）

组合式函数是用来取代 mixin 的，因为 mixin 存在命名空间冲突和数据来源不明确的问题，组合式函数可以利用类型推断更好的提供开发体验

### RFC

Vue 还引入了 [RFC](https://github.com/vuejs/rfcs) 机制来更好的把控新功能的添加，确实是开发大型项目的一个启发，如果动辄为一个 feature request 花费很多时间是很不值当的

## 源码总览

### 子包功能

- `compiler-core`：用来将模板字符串编译为渲染函数，既可以在浏览器端使用，也可以在服务端使用。流程包括，从模板到 AST，AST 到节点，以及最后的生成代码
- `compiler-dom`：浏览器端编译相关代码，是对 `compiler-core` 的封装
- `compiler-ssr`：服务端编译相关代码，也是对 `compiler-core` 的封装
- `compiler-sfc`：单文件组件不能直接被浏览器解析，因此有了该子包，先将 sfc 的 script template style 抽离出来，然后分别解析
- `runtime-core`：包含了与平台无关的运行时核心实现，包含虚拟 DOM 渲染器，还有一些全局的 JavaScript API，可以在其上创建高阶运行时
- `runtime-dom`：以浏览器为目标的运行时，包含对原生 DOM API，属性样式等的管理
- `runtime-test`：用于测试 `runtime-core` 的轻量运行时，可以在任意 JavaScript 环境使用
- `reactivity`：响应式相关代码，也是最熟悉和欣赏的部分，不到三千行的代码居然实现了这么有意思的功能
- `template-explorer`：用来调试模板编译成渲染函数的工具
- `sfc-playground`：调试 sfc 编译输出的工具
- `shared`：内部实用工具
- `server-renderer`：ssr 的核心实现
- `vue`：用户不是直接使用上面的这些子包，而是统一使用这个包构建产物，包括运行时版本和带有模板编译器的版本
- `vue-compat`：提供了可配置的 Vue2 兼容行为

![vue sub package structure](https://2f0f3db.webp.li/2025/03/mermaid-diagram-2025-03-13-204514.png)

### 不同的构建版本

在根目录下运行 `pnpm run build` 后，可以在 `/packages/vue/dist` 目录下看到下面一些文件

```bash
.
├── vue.cjs.js
├── vue.cjs.prod.js
├── vue.esm-browser.js
├── vue.esm-browser.prod.js
├── vue.esm-bundler.js
├── vue.global.js
├── vue.global.prod.js
├── vue.runtime.esm-browser.js
├── vue.runtime.esm-browser.prod.js
├── vue.runtime.esm-bundler.js
├── vue.runtime.global.js
└── vue.runtime.global.prod.js
```

可以看到每个 Vue 编译后的产物都携带了一些后缀，我们一一讲解

- runtime：表示这个编译产物没有携带模板编译器，因此只能执行已经编译后的渲染函数。我们一般选择他作为生产环境实际使用的版本，因为 Vue 在使用的时候本身就要编译（sfc 或者模板字符串），同时这个版本的产物由于不携带编译器，更加轻量，性能更好
- global：构建产物可以通过 `<script src="xxx">` 引入（以 CDN 的形式），他的内容实际上是一个 iife
- esm-browser：构建产物可以通过 `<script type="module">` 来引入（同样是 CDN 的形式），本质是一个 ESM
- esm-bundler：需要配合打包工具使用，这也是我们最常用的方式，一般通过包管理器下载到 `node_modules`，这种方式更适合 tree-shaking
- cjs：表示该产物用来做服务端渲染，遵循 CommonJS 规范，可以通过 require 方式引入

> [!tip]
> `vue.esm-bundler.js` 和 `vue.runtime.esm-bundler.js` 二者之间差别可能很难理解，为什么后者在生产环境更常用呢？如果不携带模板编译器为什么能够将我们编写的 Vue sfc 编译成模板函数呢？
> 这是因为如果选用 bundler 的版本，我们通常会搭配 webpack 或者 vite 来进行预构建，这些工具通过利用编译器插件（如 `vue-loader`）来将 sfc 编译成渲染函数，不再需要在运行时编译模板，因此我们不需要在生产环境携带编译器

### 构建流程

执行 `pnpm run build` 的时候，我们实际上是执行 `scripts/build.js` 这个脚本，其中过程可以简化为下面三个阶段

1. 收集编译目标
2. 并行编译
3. 编译单个子包

#### 收集编译目标

::: code-group

```javascript [scripts/build.js]
run()

async function run() {
  try {
    const resolvedTargets = targets.length
      ? fuzzyMatchTarget(targets, buildAllMatching)
      : allTargets
    await buildAll(resolvedTargets)
  }
}
```

```javascript [scripts/utils.js]
export const targets = fs
  .readdirSync("packages")
  .filter((f) => {
    if (
      !fs.statSync(`packages/${f}`).isDirectory() ||
      !fs.existsSync(`packages/${f}/package.json`)
    ) {
      return false;
    }
    const pkg = require(`../packages/${f}/package.json`);
    if (pkg.private && !pkg.buildOptions) {
      return false;
    }
    return true;
  })
  .concat("template-explorer");
```

:::

`scripts/build.js` 就是一个小脚本，执行里面的 `run` 函数，首先搜索所有的编译目标（`allTargets`），发现它定义在 `scripts/utils.js` 中，进入一看就能找到搜索逻辑

先遍历 `packages` 目录下的所有子包，读取其中的 `package.json` 文件，如果该包是私有的或者没有构建配置，那么就排除在构建目标外

经历遍历处理后，发现需要构建的包有如下：

```json
[
  "compiler-core",
  "compiler-dom",
  "compiler-sfc",
  "compiler-ssr",
  "reactivity",
  "runtime-core",
  "runtime-dom",
  "server-renderer",
  "shared",
  "vue",
  "vue-compat",
  "template-explorer"
]
```

#### 并行编译

面试常考题了，如何在 CPU 核心有限的情况下尽可能多的同时执行任务

```javascript
async function buildAll(targets) {
  await runParallel(cpus().length, targets, build);
}

async function runParallel(maxConcurrency, source, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (maxConcurrency <= source.length) {
      const e = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}
```

按照遍历顺序依次进行编译，如果发现已经在编译的任务个数多于 CPU 核心数，就一直等待，直到某个任务编译完成，接着遍历添加任务

这里面的 `runParallel` 函数和我们自己写的 [Promise.all](../../tech/promise.md#Promise.all) 函数很像，只不过他将构建函数作为参数传到了这个并行控制函数中，我们是将他作为一个 task 放入到数组，并无差异

#### 编译单个子包

相关的代码就是我们第二步传入的 build 函数

```javascript
async function build(target) {
  const pkgBase = privatePackages.includes(target)
    ? `packages-private`
    : `packages`;
  const pkgDir = path.resolve(`${pkgBase}/${target}`);
  const pkg = JSON.parse(readFileSync(`${pkgDir}/package.json`, "utf-8"));

  // if this is a full build (no specific targets), ignore private packages
  if ((isRelease || !targets.length) && pkg.private) {
    return;
  }

  // if building a specific format, do not remove dist.
  if (!formats && existsSync(`${pkgDir}/dist`)) {
    fs.rmSync(`${pkgDir}/dist`, { recursive: true });
  }

  const env =
    (pkg.buildOptions && pkg.buildOptions.env) ||
    (devOnly ? "development" : "production");

  await exec(
    "rollup",
    [
      "-c",
      "--environment",
      [
        `COMMIT:${commit}`,
        `NODE_ENV:${env}`,
        `TARGET:${target}`,
        formats ? `FORMATS:${formats}` : ``,
        prodOnly ? `PROD_ONLY:true` : ``,
        sourceMap ? `SOURCE_MAP:true` : ``,
      ]
        .filter(Boolean)
        .join(","),
    ],
    { stdio: "inherit" },
  );
}
```

这里传入的参数只有 target（即需要编译的子包名），我们根据子包名获取他的 `package.json`，进而获取里面定义的编译选项，然后运行 rollup 命令，与此同时传入一些环境变量，就可以编译这些包了！

### rollup 配置

我们在自己的 vitepress 博客中也使用了 rollup，他的配置文件实际要求返回一个对象，大致结构如下：

```javascript
export default {
  input, output, external, plugins;
}
```

#### 输入输出配置

Vue 的 `rollup.config.js` 并没有直接按照上述结构返回配置对象，而是类似于下面这样，通过一个函数构造出配置对象

```javascript
const packageConfigs = createConfig(format, outputConfigs[format]);
export default packageConfigs;
```

因此我们可以看一下 `createConfig` 函数

```javascript
function createConfig(format, output, plugins = []) {
  // ...
  let entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`;
  // ...
  return {
    input: resolve(entryFile),
    output,
  };
}
```

这是极度精简后的代码，我们可以看到输入文件是根据 `format` 的值来决定的，如果编译的 format 要求不包含模板编译器，那么就使用 `src/runtime.ts`，否则使用 `src/index.ts`。输出文件的配置我这里省略了，但是其实没有什么大影响，因为都是一些针对 `sourceMap` 之类的配置，他的核心在这个函数传入的参数 output（即 `outputConfigs[format]`）

```javascript
// 前面还有通过 package.json 获取 name 的代码，这里省略了
const outputConfigs = {
  "esm-bundler": {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: "es",
  },
  "esm-browser": {
    file: resolve(`dist/${name}.esm-browser.js`),
    format: "es",
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: "iife",
  },
  // runtime-only builds, for main "vue" package only
  "esm-bundler-runtime": {
    file: resolve(`dist/${name}.runtime.esm-bundler.js`),
    format: "es",
  },
  "esm-browser-runtime": {
    file: resolve(`dist/${name}.runtime.esm-browser.js`),
    format: "es",
  },
  "global-runtime": {
    file: resolve(`dist/${name}.runtime.global.js`),
    format: "iife",
  },
};
// format 取值可以是 keyof outputConfigs
const defaultFormats = ["esm-bundler", "cjs"];
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(",");
const packageFormats =
  inlineFormats || packageOptions.formats || defaultFormats;
const packageConfigs = process.env.PROD_ONLY
  ? []
  : packageFormats.map((format) => createConfig(format, outputConfigs[format]));
```

可以看到，输出的配置是根据 `format` 的值来决定的，而 `format` 又是从 `packageFormats` 中遍历得到的，我们只需要关注这个数组的来源即可。`inlineFormats || packageOptions.formats || defaultFormats;` 这行代码告诉了我们他的内容来源，首先读取环境变量中的 format，如果不存在接着查看 `package.json` 中的构建配置，如果还有没就选择默认 format

以 `vue` 这个包为例子，假设我们没有通过命令行设置环境变量，我们会读取 `packages/vue/package.json` 这个文件，发现它的构建配置如下：

```json
{
  "buildOptions": {
    "name": "Vue",
    "formats": [
      "esm-bundler",
      "esm-bundler-runtime",
      "cjs",
      "global",
      "global-runtime",
      "esm-browser",
      "esm-browser-runtime"
    ]
  }
}
```

因此可以知道，这个包一共有两种输入文件，对应了七个不同的输出文件

#### external

我们肯定希望编译得到的产物体积越小越好，因此 `Vue` 使用的外部库我们一律不打包到产物中，而是作为依赖项留给用户去安装。这在我写博客自定义主题的时候也遇到了，如果将 `dayjs` 之类的东西一并打包到构建产物中，那么假设用户也要使用这个包，就会平白无故增加一份 `dayjs` 的副本。因此我们需要配置 `external` 项来避免将外部依赖打包进去

```javascript
function createConfig(format, output, plugins = []) {
  function resolveExternal() {
    const treeShakenDeps = [
      "source-map-js",
      "@babel/parser",
      "estree-walker",
      "entities/lib/decode.js",
    ];

    if (isGlobalBuild || isBrowserESMBuild || isCompatPackage) {
      if (!packageOptions.enableNonBrowserBranches) {
        // normal browser builds - non-browser only imports are tree-shaken,
        // they are only listed here to suppress warnings.
        return treeShakenDeps;
      }
    } else {
      // Node / esm-bundler builds.
      // externalize all direct deps unless it's the compat build.
      return [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        // for @vue/compiler-sfc / server-renderer
        ...["path", "url", "stream"],
        // somehow these throw warnings for runtime-* package builds
        ...treeShakenDeps,
      ];
    }
  }

  return {
    external: resolveExternal(),
  };
}
```

这部分代码已经和书上的不一样了，可以看到 Vue 的沧海桑田……不过核心很明确，对于 `global` 和 `esm-browser` 构建，我们只需要将浏览器端的依赖项排除在外，对于其他构建，我们需要将所有依赖项排除在外

#### 插件配置

和插件相关的代码如下

```javascript
function createConfig(format, output, plugins = []) {
  // ...
  return {
    plugins: [
      json({ namedExports: false }),
      alias({ entries }),
      enumPlugin,
      ...resolveReplace(),
      esbuild({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
        sourceMap: output.sourcemap,
        minify: false,
        target: isServerRenderer || isCJSBuild ? "es2019" : "es2016",
        define: resolveDefine(),
      }),
      ...resolveNodePlugins(),
      ...plugins,
    ],
  };
}
```

用的插件还是蛮多的，分点介绍一下

1. json 引入：能够让 JSON 格式的文件直接导入，`namedExports: false` 意思是导入整个 JSON 对象而不是解构导入

2. 别名引入：允许为导入路径创建别名，简化导入语句，使 Vue 的内部包可以使用简短路径相互引用，在编译时，这些裸模块名都会被替换为实际的模块路径

   ```javascript
   const entries = {
     vue: "~/Documents/core/packages/vue/src/index.ts",
     "vue/compiler-sfc": "~/Documents/core/packages/compiler-sfc/src/index.ts",
     "@vue/shared": "~/Documents/core/packages/shared/src/index.ts",
     "..."
   };
   ```

3. 枚举内联插件：扫描项目所有的 TypeScript 枚举声明，将枚举转换为内联常量，能够避免运行时的性能消耗，保留了常量枚举的优势，同时避免了 TypeScript 常量枚举的一些问题

   > [!note]
   >
   > 最近 TypeScript 官方都不支持写带有 enum 的代码了，就不要学习相关的知识了！而且确实不好用……

4. 替换插件：用来在代码中替换字符串 pattern，比如：
   - 替换环境变量和特性标志（如 `__DEV__`, `__BROWSER__`, `__FEATURE_SUSPENSE__`）
   - 在生产构建中添加 `/*@__PURE__*/` 注释，帮助压缩工具执行更好的 tree-shaking
   - 根据构建目标（浏览器或 Node.js）替换平台特定代码

5. TypeScript 编译：这个部分和书上有很大不同，书上说 Vue 使用的是 `rollup-plugin-typescript2` 这个插件来编译打包 TypeScript 相关代码的，但我看现在的版本改用了 esbuild 来执行这部分工作

除了他们还有很多插件，比如用于生产环境的 minify 插件，用来照顾老版本浏览器的 polyfill 插件等等，这里就不过多介绍了
