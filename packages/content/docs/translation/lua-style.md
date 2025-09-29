---
title: Lua 代码风格指南
tag:
  - translation
  - lua
date: 2025-04-07
---

## 简介

在应用这些 Lua 风格指南之前，请先思考来自 [Python 风格指南](http://www.python.org/dev/peps/pep-0008/) 的警示，这些警示同样适用于 Lua。代码被阅读的频率远高于编写，本风格指南旨在通过一致性提升代码的可读性。一致性在不同项目间、项目内部、单个模块或函数中都极为重要。但最关键的是：懂得何时打破规则，并运用你的最佳判断——有时风格指南并不适用。当遵循规则会降低代码可读性时，明智的做法是打破规则。

Lua 拥有独特的语法和惯用法，因此需要自己的风格指南，这正是我们在此尝试制定的。不过，许多从其他更成熟语言（尤其是相关脚本语言）数十年经验中汲取的教训无需重复，我们可以从这些语言的风格指南中获取灵感：

- [Python 风格指南](http://www.python.org/dev/peps/pep-0008/)
- [Perl 风格指南](http://search.cpan.org/dist/perl/pod/perlstyle.pod)
- [多种 C/C++ 风格指南](https://web.archive.org/web/20101022064326/http://www.chris-lott.org/resources/cstyle/)

编程风格是一门艺术。规则虽有一定随意性，但背后有其合理依据。不仅提供风格建议有用，理解其背后的逻辑和人文因素同样重要：

- [Roedy Green 的《如何编写难以维护的代码》](http://mindprod.com/jgloss/unmain.html)
- [Damian Conway 的《Perl 最佳实践》](http://www.oreilly.com/catalog/perlbp/)
- [Steve McConnell 的《代码大全》](http://books.google.com/books?id=QnghAQAAIAAJ)

现在，进入 Lua 的世界……在定义推荐风格时，我们参考了一些准权威的 Lua 代码来源，包括官方文档、Lua 原作者或其他可靠来源：

- Roberto Ierusalimschy 的 [《Lua 编程》](http://www.lua.org/pil/)
- R. Ierusalimschy、L. H. de Figueiredo 和 W. Celes 的 [《Lua 5.1 参考手册》](http://www.lua.org/manual/5.1/)

## 格式

### 缩进

通常使用两个空格缩进。这一惯例见于《Lua 编程》、《Lua 参考手册》、《Lua 编程入门》及 Lua 用户维基。（原因不明，可能是由于 Lua 语句常深度嵌套，甚至类似 LISP 或函数式风格，或受示例代码短小且教学性质影响。）其他常见约定如 3-4 空格或制表符也存在。

```lua
for i,v in ipairs(t) do
  if type(v) == "string" then
    print(v)
  end
end
```

## 命名

### 变量名长度

一般规则（非 Lua 特有）是作用域较大的变量名应比作用域较小的更具描述性。例如，`i` 在大型程序中作为全局变量可能不合适，但在小循环中作为计数器则完全可行。

### 值和对象变量命名

存储值或对象的变量通常为小写且简短（如 `color`）。《Lua 编程入门》对用户变量使用 `CamelCase`，但这主要是教学需要，以区分用户定义变量与内置变量。

- **布尔值** - 布尔值或谓词函数可加 `is` 前缀，如 `is_directory` 而非 `directory`（后者可能存储目录对象本身）。

### 函数命名

函数命名规则与值和对象变量类似（函数为一等公民）。多词函数名可连写（如 `getmetatable`），这是标准 Lua 函数的做法，也可用下划线（如 `print_table`）。其他编程背景者可能使用 `CamelCase`，如 `obj::GetValue()`。

### Lua 内部变量命名

[Lua 5.1 参考手册-词法约定](http://www.lua.org/manual/5.1/manual.html##2.1) 指出："约定以 `_` 加大写字母开头的名称（如 `_VERSION`）保留给 Lua 内部全局变量。"这些通常是常量，但不绝对，如 `_G`。

### 常量命名

常量（尤其是简单值）通常用 `ALL_CAPS`，单词间可选下划线分隔（如《Lua 编程》第 4.3 节的 `MAXLINES` 及第 10.6 节的 Markov 示例）。

### 模块/包命名

模块名通常为简短小写的名词，单词间无分隔。Kepler 中常见此模式：`luasql.postgres`（而非 `Lua-SQL.Postgres`）。例如："lxp"、"luasql"、"socket"、"xmlrpc" 等。

仅含下划线 `_` 的变量常用作占位符以忽略变量：

```lua
for _,v in ipairs(t) do print(v) end
```

`i`、`k`、`v` 和 `t` 常见于以下场景：

```lua
for k,v in pairs(t) ... end
for i,v in ipairs(t) ... end
mt.__newindex = function(t, k, v) ... end
```

`M` 有时表示"当前模块表"。

`self` 指方法调用的对象（类似 C++ 或 Java 的 `this`）。这是由 `:` 语法糖强制实现的：

```lua
function Car:move(distance)
  self.position = self.position + distance
end
```

### 类名

（或代表类的元表）可能为混合大小写（如 `BankAccount`），也可能不是。若采用混合大小写，缩写（如 `XML`）可能仅首字母大写（如 `XmlDocument`）。

### 匈牙利命名法

在变量名中编码语义信息有助于代码阅读，尤其是当信息难以推断时。但过度使用会冗余并降低可读性。静态语言（如 C）中，数据类型已知，编码类型信息冗余，但数据类型并非唯一或最有用的语义信息。

```lua
local function paint(canvas, ntimes)
  for i=1,ntimes do
    local hello_str_asc_lc_en_const = "hello world"
    canvas:draw(hello_str_asc_lc_en_const:toupper())
  end
end
```

## 库与特性

避免使用调试库（除非必要），尤其在运行可信代码时（使用调试库有时是 hack，如 StringInterpolation）。

避免已弃用特性。Lua 5.1 中包括 `table.getn`、`table.setn`、`table.foreach[i]` 和 `gcinfo`。替代方案见 [Lua 5.1 参考手册-7-与之前版本的不兼容性](http://www.lua.org/manual/5.1/manual.html##7)。

## 作用域

尽可能使用局部变量而非全局变量。

```lua
local x = 0
local function count()
  x = x + 1
  print(x)
end
```

全局变量作用域和生命周期更大，增加耦合和复杂性。不要污染环境。Lua 中，局部变量访问速度更快（[《Lua 编程》4.2](http://www.lua.org/pil/4.2.html)），因全局变量需运行时表查找，而局部变量存在于寄存器中。

有时可用 do 块进一步限制局部变量作用域：

```lua
local v
do
  local x = u2*v3-u3*v2
  local y = u3*v1-u1*v3
  local z = u1*v2-u2*v1
  v = {x,y,z}
end

local count
do
  local x = 0
  count = function() x = x + 1; return x end
end
```

## 模块

推荐使用 Lua 5.1 模块系统。但该系统存在一些批评。简而言之，模块可如下编写：

```lua
-- hello/mytest.lua
module(..., package.seeall)
local function test() print(123) end
function test1() test() end
function test2() test1(); test1() end
```

使用方式：

```lua
require "hello.mytest"
hello.mytest.test2()
```

避免这些问题的方法是不使用 `module` 函数，而是简单定义模块：

```lua
-- hello/mytest.lua
local M = {}

local function test() print(123) end
function M.test1() test() end
function M.test2() M.test1(); M.test1() end

return M
```

导入模块：

```lua
local MT = require "hello.mytest"
MT.test2()
```

包含类构造函数的模块可多种方式组织。以下是一种合理方式：

```lua
-- file: finance/BankAccount.lua
local M = {}; M.__index = M

local function construct()
  local self = setmetatable({balance = 0}, M)
  return self
end
setmetatable(M, {__call = construct})

function M:add(value) self.balance = self.balance + value end

return M
```

使用方式：

```lua
local BankAccount = require "finance.BankAccount"
local account = BankAccount()
```

## 注释

`--` 后加空格。

```lua
return nil  -- not found    (推荐)
return nil  --not found     (不推荐)
```

注释无统一标准。

Kepler 有时使用类似 doxygen/Javadoc 的风格：

```lua
-- 取自 cgilua/src/cgilua/session.lua
-------------------------------------
-- 删除会话。
-- @param id 会话标识。
-------------------------------------
function delete (id)
        assert (check_id (id))
        remove (filename (id))
end
```

## 结束符

因 `end` 终止多种结构，在大块代码中用注释说明终止的结构有助于阅读：

```lua
for i,v in ipairs(t) do
  if type(v) == "string" then
    ...大量代码...
  end -- if string
end -- for each t
```

## Lua 惯用法

条件中测试变量非 `nil` 时，直接写变量名比显式比较更简洁。Lua 在条件中视 `nil` 和 `false` 为假，其他值为真：

```lua
local line = io.read()
if line then  -- 而非 line ~= nil
  ...
end
...
if not line then  -- 而非 line == nil
  ...
end
```

`and` 和 `or` 可用于简化代码：

```lua
local function test(x)
  x = x or "idunno"  -- 而非 if x == false or x == nil then x = "idunno" end
  print(x == "yes" and "YES!" or x)  -- 而非 if x == "yes" then print("YES!") else print(x) end
end
```

克隆**小**表 `t`（警告：仅适用于整数键；表大小有系统限制；某系统中略超 2000）：

```lua
u = {unpack(t)}
```

判断表 `t` 是否为空（含非整数键，`##t` 会忽略）：

```lua
if next(t) == nil then ... end
```

追加数组元素时，`t[##t+1] = 1` 比 `table.insert(t, 1)` 更简洁高效。

## 编码标准

以下是 Lua 项目中的编码标准列表：

- [Sputnik 编码标准](http://sputnik.freewisdom.org/en/Coding_Standard)
