---
title: 从组件模板到实际 DOM
tag:
  - vue
  - book
series:
  name: Vue 技术内幕
  part: 2
date: 2025-03-15
cfb: true
---

本来这一章节的标题应该是“组件的渲染”，但是想来想去感觉渲染这个名词可能有歧义，因此还是换成更具体的说法。从组件模板到实际 DOM 可以分为下面几步

1. 编译模板产生渲染函数
2. 渲染函数调用产生 vnode
3. 挂载 vnode，生成相应的 DOM 树

编译模板这个事情这章节不讨论了，要涉及到一些编译原理的知识，主要看二三步。我们依次讲解 vnode，渲染函数，挂载这三个概念

## vnode

虚拟节点（vnode）是用来描述 DOM 节点的 JavaScript 对象，简化后例子如下：

```javascript
const vnode = {
  type: "div",
  props: {
    class: "btn",
    style: {
      width: "100px",
      height: "50px",
    },
  },
  children: "hello",
};
```

这个 vnode 就对应着 `<div class="btn" style="width: 100px; height: 50px">hello</div>` 这个 DOM 节点。通过调用挂载函数就可以将他变成实际的 DOM 节点。

但实际上一个 vnode 有更多更复杂的属性，更详细的字段信息，可以看 [vue 有关 vnode 的源码](https://github.com/vuejs/core/blob/fdbd02658301dd794fe0c84f0018d080a07fca9f/packages/runtime-core/src/vnode.ts#L160-L256)。这是因为 vnode 除了可以表示一个普通元素，还可以描述一个组件，比如下面这个 vnode，就对应着 `<custom-component msg="test" />` 这个组件

```javascript
const CustomComponent = {};
const vnode = {
  type: CustomComponent,
  props: {
    msg: "test",
  },
};
```

事实上除了**普通节点**和**组件节点**以外，还有其他一些节点类型，比方说文本节点，注释节点，更详细的节点类型可以看 [Vue 源码](https://github.com/vuejs/core/blob/fdbd02658301dd794fe0c84f0018d080a07fca9f/packages/runtime-core/src/vnode.ts#L73-L84)

通过 vnode，可以将渲染过程抽象，从而更好的实现跨平台的特性。同时通过批量操作，还可以尽可能的减少 DOM 相关操作的耗时

## 创建 vnode

因为 vnode 大致可以分为普通节点和组件，因此相应的创建函数也有两个 `createBaseVNode` 和 `createVNode`，前者创建一个普通节点的 vnode，后者创建组件的 vnode

### createBaseVNode

```TypeScript
function createBaseVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag = 0,
  dynamicProps: string[] | null = null,
  shapeFlag: number = type === Fragment ? 0 : ShapeFlags.ELEMENT,
  isBlockNode = false,
  needFullChildrenNormalization = false,
): VNode {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance,
  } as VNode

  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children)
    // normalize suspense children
    if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
      ;(type as typeof SuspenseImpl).normalize(vnode)
    }
  } else if (children) {
    // compiled element vnode - if children is passed, only possible types are
    // string or Array.
    vnode.shapeFlag |= isString(children)
      ? ShapeFlags.TEXT_CHILDREN
      : ShapeFlags.ARRAY_CHILDREN
  }

  // validate key
  if (__DEV__ && vnode.key !== vnode.key) {
    warn(`VNode created with invalid key (NaN). VNode type:`, vnode.type)
  }

  // track vnode for block tree
  if (
    isBlockTreeEnabled > 0 &&
    // avoid a block node from tracking itself
    !isBlockNode &&
    // has current parent block
    currentBlock &&
    // presence of a patch flag indicates this node needs patching on updates.
    // component nodes also should always be patched, because even if the
    // component doesn't need to update, it needs to persist the instance on to
    // the next vnode so that it can be properly unmounted later.
    (vnode.patchFlag > 0 || shapeFlag & ShapeFlags.COMPONENT) &&
    // the EVENTS flag is only for hydration and if it is the only flag, the
    // vnode should not be considered dynamic due to handler caching.
    vnode.patchFlag !== PatchFlags.NEED_HYDRATION
  ) {
    currentBlock.push(vnode)
  }

  if (__COMPAT__) {
    convertLegacyVModelProps(vnode)
    defineLegacyVNodeProperties(vnode)
  }

  return vnode
}
```

这段代码看着内容很多，实际上做的事情还是比较少的

1. 创建一个 vnode 实例，用传入的函数参数初始化实例字段

2. 通过一个 elif 分支来对子节点做一些标准化或者标记的操作（shapeFlag）

   > [!tip]
   >
   > `shapeFlag` 是一个位标志（bitmap），同时编码了两种关键信息：
   >
   > 1. VNode 自身的类型：
   >    - `ELEMENT`：HTML 元素
   >    - `FUNCTIONAL_COMPONENT`：函数式组件
   >    - `STATEFUL_COMPONENT`：有状态组件
   >    - `TEXT`：文本节点
   >    - `FRAGMENT`：Fragment 片段
   >    - `TELEPORT`：Teleport 传送门
   >    - `SUSPENSE`：Suspense 异步包装器
   > 2. 子节点的类型（通过位运算添加）：
   >    - `TEXT_CHILDREN`：子节点是文本
   >    - `ARRAY_CHILDREN`：子节点是数组
   >    - `SLOTS_CHILDREN`：子节点是插槽
   >
   > 使用 shapeFlag 主要原因是为了性能优化，位运算相比类型校验耗时较少（这个真的会有性能优化的效果吗？有没有 benchmark？）

3. 在开发模式下，如果 vnode 的 key 是 NAN，就爆出警告（这里利用了 `NAN !== NAN`）

4. 第三个分支做了 block tree 优化，后续再讲

5. 最终做一些做一些兼容性处理（如果编译选项指定了的话），并返回 vnode

### createVNode

```TypeScript
function _createVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  isBlockNode = false,
): VNode {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    if (__DEV__ && !type) {
      warn(`Invalid vnode type when creating vnode: ${type}.`)
    }
    type = Comment
  }

  if (isVNode(type)) {
    // createVNode receiving an existing vnode. This happens in cases like
    // <component :is="vnode"/>
    // #2078 make sure to merge refs during the clone instead of overwriting it
    const cloned = cloneVNode(type, props, true /* mergeRef: true */)
    if (children) {
      normalizeChildren(cloned, children)
    }
    if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
      if (cloned.shapeFlag & ShapeFlags.COMPONENT) {
        currentBlock[currentBlock.indexOf(type)] = cloned
      } else {
        currentBlock.push(cloned)
      }
    }
    cloned.patchFlag = PatchFlags.BAIL
    return cloned
  }

  // class component normalization.
  if (isClassComponent(type)) {
    type = type.__vccOpts
  }

  // 2.x async/functional component compat
  if (__COMPAT__) {
    type = convertLegacyComponent(type, currentRenderingInstance)
  }

  // class & style normalization.
  if (props) {
    // for reactive or proxy objects, we need to clone it to enable mutation.
    props = guardReactiveProps(props)!
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
    if (isObject(style)) {
      // reactive state objects need to be cloned since they are likely to be
      // mutated
      if (isProxy(style) && !isArray(style)) {
        style = extend({}, style)
      }
      props.style = normalizeStyle(style)
    }
  }

  // encode the vnode type information into a bitmap
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : __FEATURE_SUSPENSE__ && isSuspense(type)
      ? ShapeFlags.SUSPENSE
      : isTeleport(type)
        ? ShapeFlags.TELEPORT
        : isObject(type)
          ? ShapeFlags.STATEFUL_COMPONENT
          : isFunction(type)
            ? ShapeFlags.FUNCTIONAL_COMPONENT
            : 0

  if (__DEV__ && shapeFlag & ShapeFlags.STATEFUL_COMPONENT && isProxy(type)) {
    type = toRaw(type)
    warn(
      `Vue received a Component that was made a reactive object. This can ` +
        `lead to unnecessary performance overhead and should be avoided by ` +
        `marking the component with \`markRaw\` or using \`shallowRef\` ` +
        `instead of \`ref\`.`,
      `\nComponent that was made reactive: `,
      type,
    )
  }

  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true,
  )
}

```

这个函数有更多的判断逻辑

1. 如果 type 为空或者为 `NULL_DYNAMIC_COMPONENT`，则将这个节点类型设置为注释节点
2. 如果传入的 type 已经是 vnode，则克隆一份
3. 处理类组件和兼容性问题
4. 处理 props，比如保护响应式 props，标准化 class，处理 style 等
5. 确定 shapeFlag
6. 防止组件是一个响应式对象，导致运行时性能消耗
7. 创建基础 vnode

### 使用

并非遗憾，你不用亲自使用这两个函数，前面我们提到 Vue 会将模板编译成渲染函数，这两个函数就会在渲染函数中实际调用，比如下面这个模板

```vue
<template>
  <div>
    <p>hello world</p>
    <custom-component></custom-component>
  </div>
</template>
```

会被编译成

```javascript
import {
  createElementVNode as _createElementVNode,
  resolveComponent as _resolveComponent,
  createVNode as _createVNode,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from "vue";

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_custom_component = _resolveComponent("custom-component");

  return (
    _openBlock(),
    _createElementBlock("template", null, [
      _createElementVNode("div", null, [
        _createElementVNode("p", null, "hello world"),
        _createVNode(_component_custom_component),
      ]),
    ])
  );
}
```

## 组件的挂载

### 渲染组件为 subTree

组件挂载的函数是 `mountComponent`，大致流程如下：

```typescript
const mountComponent: MountComponentFn = (
  initialVNode,
  container,
  anchor,
  parentComponent,
  parentSuspense,
  namespace: ElementNamespace,
  optimized,
) => {
  const instance: ComponentInternalInstance = (initialVNode.component =
    createComponentInstance(initialVNode, parentComponent, parentSuspense));
  setupComponent(instance);
  setupRenderEffect(
    instance,
    initialVNode,
    container,
    anchor,
    parentSuspense,
    namespace,
    optimized,
  );
};
```

可以看到主要做了如下三件事

1. 先创建了一个组件实例
2. 然后处理组件实例（比如设置 props，data，methods 等）
3. 最后调用 `setupRenderEffect` 函数来设置渲染组件

我们放过第一步和第二步，主要看一下 `setupRenderEffect`，

```typescript
const setupRenderEffect: SetupRenderEffectFn = (
  instance,
  initialVNode,
  container,
  anchor,
  parentSuspense,
  namespace: ElementNamespace,
  optimized,
) => {
  const componentUpdateFn = () => {
    if (!instance.isMounted) {
      const subTree = (instance.subTree = renderComponentRoot(instance));
      patch(
        null,
        subTree,
        container,
        anchor,
        instance,
        parentSuspense,
        namespace,
      );
      initialVNode.el = subTree.el;
      instance.isMounted = true;
    } else {
    }
  };

  // create reactive effect for rendering
  const effect = (instance.effect = new ReactiveEffect(componentUpdateFn));

  const update = (instance.update = effect.run.bind(effect));
  effect.scheduler = () => queueJob(job);

  // allowRecurse
  // #1801, #2043 component render effects should allow recursive updates
  toggleRecurse(instance, true);
  update();
};
```

会创建一个副作用函数，当首次执行内部的 `componentUpdateFn` 的时候，判定为组件的初次渲染，而后续组件内部数据发生变化时，会自动重新执行 `componentUpdateFn`，判定为组件的更新渲染。我们暂时只看初始渲染流程

可以看到初次渲染时调用 `renderComponentRoot` 来将组件渲染成 subTree（也是 vnode，通过调用组件内部定义的 render 方法获取）。他和 `initialVNode` 有很大的不同，比如有下面这样两个组件 `App.vue` 和 `CustomComponent.vue`：

```vue
<!-- App.vue -->
<template>
  <div>
    <p>hello world</p>
    <custom-component></custom-component>
  </div>
</template>
```

编译后的 render 函数为：

```javascript
import {
  createElementVNode as _createElementVNode,
  resolveComponent as _resolveComponent,
  createVNode as _createVNode,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from "vue";

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_custom_component = _resolveComponent("custom-component");

  return (
    _openBlock(),
    _createElementBlock("template", null, [
      _createElementVNode("div", null, [
        _createElementVNode("p", null, "hello world"),
        _createVNode(_component_custom_component),
      ]),
    ])
  );
}
```

他内部的 `custom-component` 模板如下：

```vue
<!-- CustomComponent.vue -->
<template>
  <div>custom-component</div>
</template>
```

编译后的 render 函数为：

```javascript
import {
  createElementVNode as _createElementVNode,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from "vue";

export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (
    _openBlock(),
    _createElementBlock("template", null, [
      _createElementVNode("div", null, "custom-component"),
    ])
  );
}
```

编译后的父组件中包含一个 `_createVNode(_component_custom_component)`，他创建的 vnode 在后续子组件的挂载中就会被作为 `initialVNode` 传入。而子组件挂载时候的 subTree 就是调用他自己的 render 函数返回的 vnode。前者可以称为**渲染初始化 vnode**，后者称为**子树 vnode**

### 挂载 subTree

渲染组件为子树 vnode 后，就可以通过 patch 方法来挂载了

`patch` 方法的简化定义如下

```typescript
const patch: PatchFn = (
  n1,
  n2,
  container,
  anchor = null,
  parentComponent = null,
  parentSuspense = null,
  namespace = undefined,
  slotScopeIds = null,
  optimized = __DEV__ && isHmrUpdating ? false : !!n2.dynamicChildren,
) => {
  const { type, ref, shapeFlag } = n2;
  switch (type) {
    case Text:
      processText(n1, n2, container, anchor);
      break;
    case Comment:
      processCommentNode(n1, n2, container, anchor);
      break;
    case Static:
      // 处理静态节点
      break;
    case Fragment:
      // 处理 Fragment
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(...args);
      } else if (shapeFlag & ShapeFlags.COMPONENT) {
        processComponent(...args);
      } else if (shapeFlag & ShapeFlags.TELEPORT) {
      } else if (__FEATURE_SUSPENSE__ && shapeFlag & ShapeFlags.SUSPENSE) {
      } else if (__DEV__) {
        warn("Invalid VNode type:", type, `(${typeof type})`);
      }
  }
};
```

patch 函数和 `setupRenderEffect` 一样，也有两个功能，当传入 n1 为 null 时，判定为初次挂载，而后续 n1 不为 null 时，判定为更新挂载。我们这里只看初次挂载的流程。在 switch 语句中，针对不同的 vnode 类型进行不同的处理，比如文本节点和注释节点，还有我们最常用的普通节点和组件，我们主要看这两个

#### 普通节点

```typescript
const processElement = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  namespace: ElementNamespace,
  slotScopeIds: string[] | null,
  optimized: boolean,
) => {
  if (n1 == null) {
    mountElement(...args);
  } else {
    patchElement(...args);
  }
};

const mountElement = (
  vnode: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  namespace: ElementNamespace,
  slotScopeIds: string[] | null,
  optimized: boolean,
) => {
  let el: RendererElement;
  const { props, shapeFlag, transition, dirs } = vnode;

  el = vnode.el = hostCreateElement(
    vnode.type as string,
    namespace,
    props && props.is,
    props,
  );

  // mount children first, since some props may rely on child content
  // being already rendered, e.g. `<select value>`
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    hostSetElementText(el, vnode.children as string);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(
      vnode.children as VNodeArrayChildren,
      el,
      null,
      parentComponent,
      parentSuspense,
      resolveChildrenNamespace(vnode, namespace),
      slotScopeIds,
      optimized,
    );
  }

  // props
  if (props) {
    for (const key in props) {
      if (key !== "value" && !isReservedProp(key)) {
        hostPatchProp(el, key, null, props[key], namespace, parentComponent);
      }
    }
  }

  hostInsert(el, container, anchor);
};
```

普通节点通过 `processElement` -> `mountElement` 这个流程进行挂载，主要还是在 `mountElement` 中进行的，主要做了如下几件事

1. 创建 DOM 元素
2. 处理 children
3. 处理 props
4. 挂载 DOM 元素到 container 上

在第一步相关的代码中，我们看到这里并没有直接使用 `document.createElement` 来创建 DOM 元素，而是通过 `hostCreateElement` 来创建，这是因为 Vue 为了实现跨平台，对 DOM 操作进行了封装，这个函数实际上由传入渲染器的 options 决定，比方说如果选用浏览器平台，传入的 options 就类似于下面这样

```typescript
export const nodeOps: Omit<RendererOptions<Node, Element>, "patchProp"> = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },

  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  createElement: (tag, namespace, is, props): Element => {
    const el =
      namespace === "svg"
        ? doc.createElementNS(svgNS, tag)
        : namespace === "mathml"
          ? doc.createElementNS(mathmlNS, tag)
          : is
            ? doc.createElement(tag, { is })
            : doc.createElement(tag);

    if (tag === "select" && props && props.multiple != null) {
      (el as HTMLSelectElement).setAttribute("multiple", props.multiple);
    }

    return el;
  },

  createText: (text) => doc.createTextNode(text),

  createComment: (text) => doc.createComment(text),

  setText: (node, text) => {
    node.nodeValue = text;
  },

  setElementText: (el, text) => {
    el.textContent = text;
  },

  parentNode: (node) => node.parentNode as Element | null,

  nextSibling: (node) => node.nextSibling,

  querySelector: (selector) => doc.querySelector(selector),

  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
};
```

第二步代码中可以看到针对不同的 children 类型，采用不同的策略，文本节点使用 `hostSetElementText`，数组节点使用 `mountChildren`，这个函数会递归调用 `patch` 函数，来挂载子节点，之所以不使用 `mountElement`，是因为 subTree 的 children 也有可能是一个组件或者其他节点类型，如果使用 `mountElement` 就无法处理这部分流程

```typescript
const mountChildren: MountChildrenFn = (
  children,
  container,
  anchor,
  parentComponent,
  parentSuspense,
  namespace: ElementNamespace,
  slotScopeIds,
  optimized,
  start = 0,
) => {
  for (let i = start; i < children.length; i++) {
    const child = (children[i] = optimized
      ? cloneIfMounted(children[i] as VNode)
      : normalizeVNode(children[i]));
    patch(...args);
  }
};
```

第三步和第四步都与前面有些重复，因此这里不做讲解

#### 组件节点

```typescript
const processComponent = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  namespace: ElementNamespace,
  slotScopeIds: string[] | null,
  optimized: boolean,
) => {
  if (n1 == null) {
    mountComponent(...args);
  } else {
    updateComponent(n1, n2, optimized);
  }
};
```

mountComponent 我们在前面已经讲过了，在处理组件的时候就是通过三部曲进行操作，创建组件实例，处理组件实例，渲染组件实例

## 应用程序初始化

我们在使用 Vue 的时候，首先是会引入初始组件，然后使用 `createApp` 函数来创建 Vue app，最后利用返回的 `mount` 方法挂载到文档中，具体实例如下：

```typescript
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

createApp(App).mount("#app");
```

`createApp` 的大致流程如下：

```typescript
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args);

  const { mount } = app;
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    // 重写 mount 方法
  };

  return app;
}) as CreateAppFunction<Element>;
```

主要做了两件事，创建 app 对象，重写 mount 方法，我们分别看一下

### 渲染器与创建 app

`ensureRenderer` 是为了创建针对某种平台的渲染器，相关简化代码如下：

```typescript
// packages/runtime-dom/src/index.ts
const rendererOptions = /*@__PURE__*/ extend({ patchProp }, nodeOps);
function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer<Node, Element | ShadowRoot>(rendererOptions))
  );
}
```

上面的代码出自 `packages/runtime-dom` 子包，因此是用来创建浏览器平台的渲染器，他的 rendererOptions 部分配置我们[前面](#普通节点)也介绍过了，现在我们看渲染器的抽象实现

```typescript
// packages/runtime-core/src/renderer.ts
export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement,
>(options: RendererOptions<HostNode, HostElement>): Renderer<HostElement> {
  return baseCreateRenderer<HostNode, HostElement>(options);
}

function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions,
): any {
  function render(vnode, container, namespace) {}
  return {
    render,
    createApp: createAppAPI(render),
  };
}
```

最终调用的是 `baseCreateRenderer` 函数，返回一个包含 `render` 和 `createApp` 方法的对象，其中 `createApp` 方法是通过调用 `createAppAPI` 获取的，`createAppAPI` 的定义如下：

```typescript
export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
): CreateAppFunction<HostElement> {
  return function createApp(rootComponent, rootProps = null) {
    const app: App = (context.app = {
      _component: rootComponent as ConcreteComponent,
      _props: rootProps,

      mount(rootContainer: HostElement): any {
        const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
        render(vnode, rootContainer);
        app._container = rootContainer;
        return getComponentPublicInstance(vnode.component!);
      },
    });

    return app;
  };
}
```

我们在调用 `createApp(App).mount("#app")` 的时候，就会最终调用这个 `createAppAPI` 的返回值，这里通过闭包等操作，简化了用户的输入参数（只需要挂载的位置即可），不需要传入包括 render 函数，组件对象，组件 props 等参数

### 重写 mount

上面代码中的 mount 方法并不能直接让用户使用，因为他是一个通用的，较为抽象的 mount 方法，我们要针对不同平台实现他们各自的 mount 方法，下面是浏览器平台的实现

```typescript
export const createApp = (...args) => {
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;

    const component = app._component;
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML;
    }

    // clear content before mounting
    if (container.nodeType === 1) {
      container.textContent = "";
    }
    const proxy = mount(container, false, resolveRootNamespace(container));
    return proxy;
  };
};
```

通过 `normalizeContainer` 来将用户传入参数规范化为一个 DOM 元素（用户可能传入一个字符串或者一个 DOM 元素），然后如果组件对象没有 render 函数或者 template 模板，就取容器的 innerHTML 作为模板，然后在挂载之前清空容器内容，最终调用之前保存的未重写的 mount 方法

### 执行 mount 渲染应用

未重写的 mount 函数中调用了 `render` 函数来渲染应用，这个 `render` 函数是在 `baseCreateRenderer` 中定义，并通过闭包传送进来的，他的定义如下

```typescript
function baseCreateRenderer(
  options: RendererOptions,
  createHydrationFns?: typeof createHydrationFunctions,
): any {
  const render: RootRenderFunction = (vnode, container, namespace) => {
    if (vnode == null) {
      // 销毁组件
    } else {
      // 创建或者更新组件
      patch(container._vnode || null, vnode, container);
    }
    // 缓存组件，表示已渲染
    container._vnode = vnode;
  };

  return {
    render,
    createApp: createAppAPI(render),
  };
}
```

传入的 vnode 是通过 `createVNode(rootComponent)` 创建的，container 是通过 `normalizeContainer` 获取的，有了这些信息，还有缓存的 `_vnode`，就可以调用 `patch` 函数来挂载或者更新应用了！至此，应用渲染的流程已经跑通！
