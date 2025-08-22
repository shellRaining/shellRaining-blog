---
title: TSConfig
tag:
  - book
  - typescript
series:
  name: TypeScript 入门与实战阅读笔记
  part: 6
date: 2025-03-10
---

这里的 TSConfig 并不是误拼，他是 `tsconfig.json` 和 `jsconfig.json` 的统称，这两个文件所在的目录就可以被看做是一个 TypeScript 或者 JavaScript 工程的根目录。这两个文件可以配置的选项是一样的，你可以通过 `tsc --init` 来初始化一个这样的工程，但是他默认给的配置项比较老，不是针对 esnext 规范进行的配置，可以考虑使用 GitHub 上的一些预配置项来拓展

一个 `tsconfig.json` 的配置分为以下几类：

- 顶层配置：包括 `files`、`extends`、`include`、`exclude`、`references`，负责控制哪些文件被用来编译
- 编译选项：负责编译时的具体行为，有些还和类型检查相关，甚至可以影响到语言服务器的表现。编译选项可以进一步分为下面这些小类，每个小类都有一些相关的具体的编译选项，比如 `Modules` 下的 `typeRoots`
  - `Type Checking`
  - `Modules`
  - `Emit`
  - `JavaScript Support`
  - `Backwards Compatibility`
  - `Language and Environment`
  - `Compiler Diagnostics`
  - `Project`
  - `Output Formatting`
  - `Completeness`
  - `Command Line`
  - `Watch Options`
- 监视选项，就是使用 `tsc -w` 后的表现

## 顶层配置

### files

可以传入一个文件名的数组，用来管理哪些文件需要被编译，如果任一文件没有被找到，编译时会爆出错误。因为不可以使用通配符，仅适合文件少的时候使用

### include

files 的升级版，可以传入一个 pattern 数组，里面的每一项都可以使用通配符来匹配更多文件，解析路径时是相对该 TSConfig 文件所在目录。如果某项的最后一段不包含文件名或者通配符，他被作为一个目录看待，目录下所有和 ts 相关的文件（`.ts`、`.d.ts`、`.tsx`）都会被编译，如果 `allowJs` 选项打开，`.js` 和 `.jsx` 也会被编译
