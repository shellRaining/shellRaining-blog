---
title: TypeScript 配置管理
tag:
  - reading-notes
  - typescript
series:
  name: TypeScript 入门与实战阅读笔记
  part: 5
outline: [2, 3]
date: 2024-07-04
---

## 编译选项

我们通过 `pnpm install -g typescript` 下载的包会附带一个 `bin/tsc`，这就是实际上会使用的 TypeScript 编译器，他的参数可以大体分为输入文件和编译选项两种。如果仅指定了输入文件，就会在指定文件的同目录下编译出同样功能的 JavaScript 代码。之后我们也可以通过编译选项来调整编译器的行为，而这也是我们最需要关注的地方。

编译选项分为 `长名称` 和 `短名称` 两种风格，其中长名称风格的选项会覆盖更广，而短名称只是长名称的缩写，仅仅为了方便使用，可读性和可维护性并不如长名称风格的编译选项。我们下面列出一些常用的编译选项：

| 编译选项名称         | 功能描述                                                                           |
| -------------------- | ---------------------------------------------------------------------------------- |
| `-h` `--help`        | 展示帮助文档                                                                       |
| `-d` `--declaration` | 生成类型描述文件，通常库模块会使用该选项来提高用户体验                             |
| `-m` `--module`      | 指定编译后的 JavaScript 代码使用什么模块类型，可选包括 `CommonJS`，`AMD`，`ESNext` |
| `-p` `--project`     | 指定使用的 `tsconfig.json` 文件路径                                                |
| `-t` `--target`      | 指定编译后的 JavaScript 版本，包括 `ES3`（默认），`ES5`，`ESNext` 等               |
| `-w` `--watch`       | 在观测模式下进行编译                                                               |
| `--strict`           | 启用严格模式，这是一系列的编译选项的总和，一般在 `tsconfig` 中指定                 |

## 配置文件（`tsconfig.json`）

在 `1.5` 版本之后，TypeScript 推出了配置文件的方式来管理工程，在这个配置文件中，能够指定

1. 输入输出文件路径及格式
1. 编译选项
1. 继承配置位置
1. 工程之间的引用关系

我们首先了解 `tsc` 是如何找到这个配置文件的，仅输入 `tsc` 命令时，它先从我们当前指令运行所在的目录开始找起，然后逐级向上，直到家目录下停止，如果还没有找到，则停止编译。我们可以通过上面提到的 `--project` 来改变他的这个行为。

### 输入输出指定

如果目录下包含一个默认的 `tsconfig.json`，那么编译器将会编译目录下所有的文件（包含类型声明文件），我们可以通过下面三种属性来更改这一默认行为：

1. `files` 一个列表， 指定所有需要编译的文件，不支持通配符
1. `include` 也是一个列表，但是支持三种通配符 `*`，`?`，`**/`，分别表示任意多个（包含零个）字符，一个任意字符，任意目录包含其子目录
1. `exclude` 和 `include` 配置方式一样，同时使用它的时候必须加上 `include` 属性

他们都是配置文件的顶层属性，注意使用的位置（虽然说现在 JSON scheme 已经很成熟了，但还是了解为好）

如果要查看编译的所有文件，可以使用 `--listFiles` 编译选项来输出所有被编译的文件

### 编译选项

TypeScript 工程中的 `node_modules/@types` 是一个特殊的目录，TypeScript 会将安装在这个目录下的模块的类型文件自动包含到编译中，但是如果我们需要引入一些自定义的类型文件，可以使用 `typeRoots` 或者 `types` 编译选项来改变这个行为

1. `typeRoots` 编译选项可以指定一个列表，指定所有类型文件的根目录，如果指定了这个属性，那么 `node_modules/@types` 将不会被包含
2. `types` 编译选项可以指定一个列表，指定需要包含的类型文件，是在 `typeRoots` 中继续细化范围，比如有下面的目录结构

   ```plaintext
   src/
     index.ts
   node_modules/
     @types/
       lodash/
         index.d.ts
       jquery/
         index.d.ts
   ```

   我们可以在 `tsconfig.json` 中指定

   ```json tsconfig.json
   {
     "compilerOptions": {
       "types": ["lodash"]
     }
   }
   ```

   来只包含 `lodash` 的类型文件

---

`target` 上面我们提到过，只是说他会决定编译产物的版本，但也会决定能否使用某些方法。比如我们指定了 `target` 为 `ES6`，那么我们就无法使用 `ES2017` 中支持的 `padStart` 方法，强行使用会爆出错误（这是否也可以体现出 TypeScript 实际上只是完成了编译的任务，没有做 Polyfill 的工作呢）

但如果指定了 `lib` 这个字段，使其包含 `ES2017.String`，那么就可以正常通过编译，虽然此时 `target` 已经形同虚设了……因为你的编译产物已经包含了一个 `ES6` 平台无法执行的函数。

---

`outDir` 指定了所有输出产物（包含 JavaScript 文件和类型声明文件）的输出位置，通常和 `package.json` 中的 `main` 和 `types` 字段综合使用，指定我们编写的工具模块的类型声明文件和入口文件路径。

如果希望最后输出一个文件，那么可以指定 `outFile` 字段， 但是该字段需要配合 `module` 使用，`module` 用来指定编译产物使用的模块语法，可选的有 `CommonJS`，`AMD` 等，且只有后者才能输出单文件。

---

除此之外还有很多的编译选项，比如针对 JavaScript 的类型检查编译等，我们后续补充

### 继承配置

在大型项目中，我们可能需要针对源码，测试等不同部分分别进行编译，而他们可能有共同的配置，为了提高维护性，可以使用 `extends` 字段来实现配置文件的继承。他有两种解析模式

1. 相对路径解析：以相对该配置文件的路径来查找（而不是我们运行 `tsc` 指令时候的相对路径，因为想也知道不可能，如果换个路径编译就无法成功也太荒谬了）
1. 绝对路径解析：这里的绝对路径不是文件系统绝对路径，而是 `node_modules` 的绝对路径，比如 `"extends": "tsconfig/tsconfig.standard.json"` 实际查找的位置为 `app/node_modules/tsconfig/tsconfig.standard.json`，还有全局的 `node_modules` 下的绝对路径

## 三斜线指令

三斜线指令是一类指令，是 TypeScript 早期版本支持的编译指令，现在已经不推荐使用了，更多的推荐在 `tsconfig.json` 中指定编译选项。

三斜线指令是以 `///` 开头的注释，后面跟上一个 XML 标签，比如 `reference` 等，同时三斜线指令必须在文件的最开始，否则会被作为普通注释对待

### `/// <reference path="..." />`

这个指令用来声明源文件之间的依赖关系，编译一个带有该指令的文件时，编译器会顺带把引用的文件也添加到编译列表，如果使用了前面的 `outFile` 编译选项，这个指令还可以用作代码排序的手段：

```typescript lib1.ts
const a = "lib1";
```

```typescript lib2.ts
const b = "lib2";
```

```typescript index.ts
/// <reference path="lib2.ts" />
/// <reference path="lib1.ts" />

const index = "index";
```

```typescript tsconfig.json
{
  "compilerOptions": {
    "outFile": "dist/index.js"
  }
}
```

这样最后输出的 `dist/index.js` 文件中类似下面

```javascript dist/index.js
var b = "lib2";
var a = "lib1";
var index = "index";
```

如果想要忽略引用文件的三斜线指令，可以使用 `--noResolve` 编译选项

### `/// <reference types="..." />`

这个指令用来定义对某个类型文件的依赖，比如我们想要使用 `jquery` 的类型文件，可以使用下面的指令

```typescript index.d.ts
/// <reference types="jquery" />

declare var settings: JQuery.AjaxSettings;
```

需要注意的是这个指令只应该在类型声明文件中使用，在普通的源文件中应该使用 `typeRoots` 和 `types` 编译选项

### `/// <reference lib="..." />`

用来指定对语言内置的某个声明文件的依赖，他和编译选项中的 `target` 是一样的，因此不推荐使用这个指令
