---
title: TypeScript 类型深入
tag:
  - book
  - typescript
series:
  name: TypeScript 入门与实战阅读笔记
  part: 3
date: 2025-02-19
---

## 子类型兼容性

首先说 TypeScript 的类型系统并不是绝对可靠的，但他能保证绝大多数情况下的类型安全，并且留下了诸如类型断言这样的手段来方便编码和应急，然后我们学习一下类型之间关系的符号约定

- `S <: T` 表示 S 是 T 的子类型，也就是 S 可以赋值给 T
- `S >: T` 表示 S 是 T 的父类型，也就是 T 可以赋值给 S

这个符号定义具有：

1. 自反性：对于一个类型 T，有 `T <: T` 和 `T >: T`
2. 传递性：如果 `S <: T` 且 `T <: U`，那么 `S <: U`

知道这些，我们就可以开始具体深入 TypeScript 的类型了！

### 顶端类型、尾端类型、null、undefined

这些已经在 [TypeScript 类型基础](./basic_type.md#顶端类型) 中介绍过了，这里不再赘述。唯一需要注意的是他们的类型优先级

`any =: unknown >: null =: undefined >: never`

### 枚举类型

联合枚举成员类型是联合枚举类型的子类型，通过下面的例子可以显然看出

```typescript
enum E {
  X,
  Y,
  Z,
}

let a: E = E.X;
let b: E.X = E.X;
```

数值型枚举类型是 `number` 的子类型，因为数值型枚举的范围实际上是 number 的子集，因此可以赋值给 number 类型，自然可以推断出数值型枚举类型是 number 的子类型。

> [!warning]
> 第一章节提到可以直接将 number 类型变量赋值给数值型枚举变量，这样难道意味着 number 是数值型枚举的子类型？
> 实则不然！这是赋值兼容性发力了！这是为数不多的特例，因此只需要特殊记忆即可，下一个章节我们会详细讲解（不过这部分内容确实不多）

---

在开始一个新的小节之前，我们先回顾一下刚学的子类型兼容性，他们都是针对比较简单的类型来判断的，就好像是对多项式函数等基本函数进行单调性判断，只需要稍加思考就能弄明白，但现实总是复杂的，简单的函数组合起来也会变得复杂，单调性判断就会费一点力气，类型兼容性也是如此，因此需要引入新的概念：**变型**

变型这个概念可以大致理解为，如果有类型 `A` 和 `B`，那么对于由他构建出来的 `Complex(A)` 和 `Complex(B)`，他们之间的关系是什么？一般来说，有三种关系：

1. 协变：如果 `A <: B`，那么 `Complex(A) <: Complex(B)`
2. 逆变：如果 `A <: B`，那么 `Complex(B) <: Complex(A)`
3. 不变：如果 `A <: B`，那么 `Complex(A)` 和 `Complex(B)` 之间没有任何关系

这里的 `Complex` 可以是数组、函数等等，我们马上讲解

### 函数

要想判断两个函数的子类型关系，要从两个部分看：

1. 参数列表
2. 返回值

对于第一点，首先检查参数个数。如果 `S` 是 `T` 的子类型，那么 `S` 中的必选参数数量必须小于等于 `T` 中的所有参数数量，比如：

```typescript
type R = (x: number) => void;
type S = (x: number, y?: number) => void; // S <: R
type T = (x: number, y: number) => void; // R <: T
type U = (x?: number, y?: number) => void; // R <: U
```

这很好理解，如果你将一个参数多的函数类型赋值给参数少的函数类型，那么实际调用的时候无法提供这么多的参数，报错是肯定的！

```typescript
type S = (x: number) => void;
type T = (x: number, y: number) => void;

let f1: S = (x) => {};
let f2: T = (x, y) => {};

f2 = f1;
f2(1, 2); // right，第二个参数会虽然被多传了，但是会被忽略
f1 = f2;
f1(1); // false，少一个必选参数
```

然而这样的检测是不可靠的，比如下面的例子：

```typescript
type S = (x: number) => void;
type T = (x?: number, y?: number) => void; // S <: T

let f1: S = (x) => {};
let f2: T = (x, y) => {};

f2 = f1;
f2(); // 报错
```

上面 `f2` 是 T 类型，按照类型定义，我们可以不传参数（因为有两个可选参数），但实际上 `f1` 需要一个必选参数，这种不可靠的检测暂时没法避免，因为 JavaScript 就是这么设计的！

除了检查参数个数，还有参数的类型兼容性，我们先假设 `S` 和 `T` 的参数个数相同，且 `S` 是 `T` 的子类型，那么对于每一个参数 `T` 的参数类型必须是 `S` 的参数类型的子类型，即**逆变**关系，比如：

```typescript
type S = (x: number) => void;
type T = (x: 0 | 1) => void; // S <: T

let f1: S = (x) => {};
let f2: T = (x) => {};

f2 = f1;
f2(1); // right
```

对于第二点，返回值类型和返回类型保持协变关系，也就是说，如果 `S` 是 `T` 的子类型，那么 `S` 的返回值类型必须是 `T` 的返回值类型的子类型，比如：

```typescript
type S = () => 0 | 1;
type T = () => number; // S <: T

let f1: S = () => 1;
let f2: T = () => 1;

f2 = f1;
f2(); // right
```

函数还有重载这个概念，如果 `S` 是 `T` 的子类型，且 `T` 具有重载，那么对于 `T` 的每一个重载，都需要在 `S` 中找到相应的子类型

```typescript
type S = {
  (x: number): number;
  (x: string): string;
};

type T = {
  (x: 0 | 1): number;
  (x: "a"): string;
};
```

### 对象类型

诶，前面的函数重载你是否有注意，我们使用的不是普通的函数重载语法，而是对象的调用签名语法，从他我们似乎隐隐约约可以感觉到，一个对象类型 `S` 如果是 `T` 的子类型，那么 `T` 中的每一个属性，都必须能在 `S` 中找到对应的子属性，这就是对象类型的子类型关系

```typescript
type S = {
  x: number;
  y: 0 | 1;
  z?: number;
};

type T = {
  x: number;
  y: number;
};
```

### 泛型

假设有 `S <: T`，那么由其演变出来的泛型 `Complex<S>` 和 `Complex<T>` 之间的关系并不能简单的确定，因为三种情况都有可能，具体要根据泛型的定义来考虑，就像是数学中函数的斜率，`f(x) = x` 和 `g(x) = 2x`，后者的斜率更大，但是如果套一个 `k(x) = -x`，那么 `k(f(x))` 的斜率就会大于 `k(g(x))`

```typescript
interface Empty<T> {}

type T = Empty<number>; // {}
type S = Empty<0 | 1>; // {}，即 S =: T
```

要想真正做出判断，需要先通过类型推断来统一两个泛型函数的类型参数，然后确定二者的关系：

```typescript
type A = <T, U>(x: T, y: U) => [T, U];
type B = <S>(x: S, y: S) => [S, S];
```

我们先假设 `A` 是 `B` 的子类型，那么我们可以通过类型推断得到 `A` 的类型参数是 `<S, S>`，替换后的结果是

```typescript
type A = <S>(x: S, y: S) => [S, S];
type B = <S>(x: S, y: S) => [S, S];
```

可以看到二者相同，可以推断出 `A <: B`，但是反过来就不一定了，我们假设 `B` 是 `A` 的子类型，那么 `B` 的参数类型应该是 `A` 的参数的超类型，即 `S` 应该被放宽为 `T | U`，替换后可以得到

```typescript
type A = <T, U>(x: T, y: U) => [T, U];
type B = <T, U>(x: T | U, y: T | U) => [T | U, T | U];
```

按理来说，我们假设了 `B` 是 `A` 的子类型，那么 `B` 的返回值类型理应是 `A` 的子类型（满足协变关系），但此时发现 `A` 和 `B` 的返回值之间不构成任何子类型关系，因此 `A` 和 `B` 之间没有任何关系

### 联合类型和交叉类型

其实复杂的内容前面已经讲过了，这两种凭直觉就可以推断出来子类型关系，因此不多赘述

## 赋值兼容性

子类型兼容性和赋值兼容性大抵相当，只有一些例外需要记住

1. any 虽然是顶端类型，但他可以赋值给任意类型
2. 前面提到的 number 和数值型枚举的特例，number 可以赋值给数值型枚举，但实际上 number 类型是数值型枚举的父类型
3. 带有可选属性的对象类型，如果对象类型 `T` 中有可选属性 `M`，那么即使在对象类型 `S` 中没有这个属性时，`S` 也可以赋值给 `T`，
