---
title: TypeScript 模块
tag:
  - book
  - typescript
series:
  name: TypeScript 入门与实战阅读笔记
  part: 4
date: 2025-02-26
---

## 模块（ESM）

书中这部分内容和 JavaScript 知识有很多重复，因此基础的不做讲解，同时需要注意的点可以看 [JavaScript module](../JavaScript_info/module.md) 来学习，这里值讨论 TypeScript 特有的模块导入和导出语法

TypeScript 中类和枚举可以同时表示一个类和一个类型，因此在使用 `import` 导入一个类或者枚举的时候，会同时导入他们表示的类型和值。在 [TypeScript 3.8](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export) 中，引入了只针对类型的导入语法

```typescript
import type { SomeType } from "./some-module";

// 这里 SomeType 只会被导入为类型，不会导入值
```

并且在编译时，所有的类型导入都会被删除，他们只是方便我们进行类型检查，显式的导入我们需要的类型

> [!note]
> 说到类型导入会被删除，我们可以想一下如果导入一个带有副作用的模块会发生什么
>
> ::: code-group
>
> ```typescript [index.ts]
> import { Point } from "./point";
> const p: Point = { x: 1, y: 2 };
> if (globalThis.ctrl) {
>   console.log(p);
> }
> ```
>
> ```typescript [point.ts]
> globalThis.ctrl = true;
> export interface Point {
>   x: number;
>   y: number;
> }
> ```
>
> :::
>
> 虽然 TypeScript 源代码中导入了 `point.ts` 文件，但是实际上编译后的代码中并没有导入 `point.js` 文件，因为 `Point` 只是作为一个类型被使用，就被莫名其妙的 treeshaking 了！
> 如果非要这个副作用不可，可以使用 `import "./point"` 再导入一次，这是最简洁有效的方法，当然也可以设置 `tsconfig.json` 中的 `verbatimModuleSyntax` 字段，这是 TypeScript 5.0 引入的新选项。其规则更为简单，任何未使用类型修饰符的导入或导出都会保留，而使用了类型修饰符的内容则会被完全移除。
> 你可能看到有些教程让使用 `preserveValueImports` 或者 `importsNotUsedAsValues`，很遗憾，TypeScript 承认了这两个选项界限比较模糊，难以理解，因此在这个版本中将他们废弃了！

## `--module` 选项

TypeScript 编译器提供了 `--module` 选项来指定输出的模块规范，可以是 `CommonJS`、`AMD`、`System`、`UMD`、`ES6`、`ES2015`、`ESNext` 等，这个选项会影响到模块导入和导出的语法，比如 `CommonJS` 中使用 `module.exports` 导出，`require` 导入，而 `ES6` 中使用 `export` 导出，`import` 导入

```javascript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoPi = void 0;
const constants_1 = require("./constants");
exports.twoPi = constants_1.valueOfPi * 2;
```

给一个编译成 `CommonJS` 以后的例子，注意到其中有一个 `__esModule`，这是表明该文件是由 ESM 编译而来的

## 外部声明

TypeScript 外部声明分为两种

1. 外部类型声明
   他又分为下面五种

   1. 外部变量声明
      语法如下：

      ```typescript
      declare var a: boolean;
      declare let b: number;
      declare const c: string;
      ```

      只举出这一个例子，其他的可以自己搜一下，和普通的声明差不多，只不过多了 `declare` 关键字，还有不能有定义，只能有声明

   2. 外部函数声明
   3. 外部类声明
   4. 外部枚举声明
   5. 外部命名空间声明

2. 外部模块声明
   语法如下：

   ```typescript
   declare module "url" {
     export function parse(
       urlStr: string,
       parseQueryString?,
       slashesDenoteHost?,
     ): Url;
   }
   ```

## 类型声明文件

TypeScript 中的 `.d.ts` 类型声明文件主要来源为：

1. 内置的声明文件，比如 `lib.d.ts`
2. 通过 `@types` 包来安装的第三方库的声明文件
3. 自定义的声明文件

如果作为一个库的开发者，我们肯定希望能够给用户提供完善的类型声明文件，这不仅需要 TypeScript 编译出类型声明文件，还需要在 `package.json` 中指定声明文件的入口路径，这是通过 `types` 或者 `typings` 字段来指定的，比如：

```json
{
  "name": "awesome-lib",
  "types": "dist/index.d.ts"
}
```

这两个字段是 TypeScript 拓展的，并不是标准的 `package.json` 字段，但是 TypeScript 会读取这两个字段来确定类型声明文件的位置。

还有一个特例，如果一个包的类型声明文件是 `index.d.ts`，那么可以省略 `types` 或者 `typings` 字段，TypeScript 会自动去找 `index.d.ts` 文件。

## 模块解析

当我们导入一个模块时，TypeScript 编译器会去根据一定的规则去寻找这个模块的定义，这就是所谓的模块解析策略，并且这和编辑器的 LSP 有很大关系，定义良好的模块解析策略可以让 LSP 充分发挥他的作用！

首先说模块导入的分类，他分为相对导入和绝对导入，这里的相对请不要理解成相对路径的那种相对，他表示导入时是否以 `/`、`./`、`../` 开头，如果是，那么就是相对导入，否则就是绝对导入

```typescript
import { a } from "./module"; // 相对导入
import { b } from "../module"; // 相对导入
import { c } from "module"; // 绝对导入
import { d } from "@angular/core"; // 绝对导入
```

TypeScript 提供了多种模块解析策略，我们可以通过 `moduleResolution` 选项来指定，他有以下几种值：

- `Node16`：或者 `NodeNext`，支持 Node.js 的 ECMAScript 模块解析，遵循 `package.json` 中的 `"type": "module"` 配置
- `Node`：先查找 `.ts、.tsx、.d.ts` 文件，然后查找 `package.json` 中的 types 字段，最后查找 `index.ts、index.tsx、index.d.ts`
- `Classic`：不推荐使用
- `Bundler`：类似 `node16`，但支持 `package.json` 的 `exports` 和 `imports` 字段

由于我们通常使用比较新的开发工具，因此请尽可能 `Node16` 或者 `NodeNext` 或者 `Bundler`，推荐配置：

现代 Web 应用程序：`module: "ESNext", moduleResolution: "Bundler"`
Node.js 应用程序：`module: "NodeNext", moduleResolution: "NodeNext"`

> [!tip]
> 与 module 选项的关系:
>
> 当 `module` 设置为 `CommonJS` 时，默认 `moduleResolution` 为 `Node`
> 当 `module` 设置为 `ES2015`/`ES2020`/`ESNext` 时，建议将 `moduleResolution` 设置为 `Node16`/`NodeNext` 或 `Bundler`

## 扩充模块声明

有时候我们需要给一个已经存在的模块添加一些属性，这时候就需要使用扩充模块声明，比如我们想给 `express` 添加一个 `static` 方法，可以这样写：

```typescript
declare module "express" {
  export interface Application {
    static: (path: string, root: string) => void;
  }
}
```

这就会利用类型合并的知识点来给 `express` 添加一个 `static` 方法

有时候想要全局的一些类型，可以使用 `global` 关键字，比如：

```typescript
declare global {
  interface Window {
    myGlobal: string;
  }
  var variable: string; // 这样我们就可以 globalThis.variable 来访问这个变量
}
```

这里不可以用 let 替换 var，因为 let 声明的变量并不是放在 globalThis 下的，详情可以看 [执行上下文](../../tech_blog/execute_context.md)
