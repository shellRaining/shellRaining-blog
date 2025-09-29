---
title: view transition API 介绍
tag:
  - tech
date: 2024-08-02
---

## 过渡动画的本质

过渡动画的本质是：在一段有限的时间内，快速而连续的播放一系列图片，通过人眼视觉暂留特点，形成动画效果，view transition API 还有其他一系列和动画相关的 API，都是基于这个本质开展工作的。同时注意前面提到的一系列图片，并不是随机选取的，而是由很多因素共同决定的，比如动画起始状态和终点状态，动画策略等，这里暂不赘述。

下面有一个动画实现的示例，如果你缓慢的拖动进度条，你看到的是一张张静止的动画快照，如果快速拖动，那么这些快照就会组合形成动画

<script setup>
import Animation from "./animation.vue"
</script>

<Animation></Animation>

因此要想实现动画效果，需要先获取初始状态和终点状态的快照，然后根据不同的动画策略插值生成中间的状态，因此一个很自然的想法是，当我们试图通过 JavaScript 修改了 DOM 时，先给原先的页面拍一个快照，然后执行修改 DOM 的操作，再拍一个快照，然后根据这两个快照进行插值计算，得到中间态的快照，依次展示形成动画

## view transition 的生命周期

1. 触发 viewtransition：给 `document.startViewTransition()` 传入一个更改 DOM 的回调函数会触发 view transition。
   一个活动的 view transition 会与一个 ViewTransition 实例相关联，这个实例就是上面提到的 `startViewTransition` 函数的返回值。该实例包含很多 promise，可以用来在一个 view transition 的不同阶段执行不同的钩子函数。我们命名这个实例为 `vt`（后续的讲解会用到）
2. 捕获旧快照：浏览器会捕获**所有**声明了 `view-transition-name` 这个 css 属性的 DOM 元素，并且为他们分别设置一个快照（快照类似于图片，而不是实际的 DOM 元素）。
3. 用户界面渲染暂停
4. 被传入 `startViewTransition` 的回调函数被调用，用来更改 DOM
5. 在回调函数执行成功后，`vt.updateCallbackDone` 这个 promise 会被兑现
6. 在新的页面上捕获一个新快照
7. view transition 相关的伪元素被创建（后面会讲到，和动画执行相关）
8. 用户界面解冻，展示伪元素
9. `vt.ready` 这个 promise 被兑现，允许我们执行自定义的动画效果，而不是默认的渐入渐出效果。
10. 老的页面执行 `out` 动画，新的页面执行 `in` 动画，默认情况下 `out` 动画是透明度（opacity）逐渐从 1 变为 0，`in` 动画反之，实现一个交叉过渡的效果。除了默认的交叉过渡效果，还有一些属性可以进行插值动画，具体可以看谷歌的[这篇文章](https://developer.chrome.com/docs/web-platform/view-transitions/same-document#transition_multiple_elements)，对应着[仓库](https://github.com/shellRaining/google-view-transtion-example)的第四和第五章节代码
    - Position and transform (using a `transform`)
    - Width
    - Height

11. 前面创建的伪元素被移除
12. 动画结束：结束后会兑现 `vt.finished` 这个 promise

整个生命周期可以用一个动画来方便理解，详情可以看 [https://www.w3.org/TR/css-view-transitions-1/#lifecycle](https://www.w3.org/TR/css-view-transitions-1/#lifecycle)

> 如果 page visibility 为 `hidden`，那么将不会执行动画效果
>
> 至于这个 page visibility API，可以看 [MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)，可以简单认为是浏览器为了节省性能提出的一个 API

## view transition 伪元素树

为了我们能够处理动画过程中的节点，view transition API 创建了一棵伪元素树来供我们使用，其结构如下：

```plaintext
::view-transition
└─ ::view-transition-group(root)
  └─ ::view-transition-image-pair(root)
      ├─ ::view-transition-old(root)
      └─ ::view-transition-new(root)
```

在 SPA 应用中，这棵树可以在文档顶层（HTML 节点处）看到，在 MPA 应用中，我们可以在新页面中看到这棵树。我们依次看一下这些伪元素

1. `::view-transition` 是整棵树的根节点。当我们触发了一个 view transition 过程，这个伪元素就会被插入到 `<html>` 节点下。它**覆盖**在整个页面的上方，作为所有 `::view-transition-group` 的根容器

2. `::view-transition-group` 是一个盛放 view transition 快照的容器。上一个小节中提到，一个过渡动画会有两个快照（过渡前，过渡后）我们把他们整合到一个伪元素中。

   由于我们在触发一个 view transition 的时候会捕获所有声明了 `view-transition-name` 的元素，因此要想选取某个或者某类 `::view-transition-group`，可以通过后面的括号来指定，括号内可以填一个已经设置好的 `view-transition-name` 或者 `view-transition-name-class`

   ```css
   ::view-transition-group(figure-caption) {
     animation-duration: 5s; /* 这里的动画时间我理解为快照容器切换时的动画持续时间，对 size position 有影响 */
   }
   ```

   前面提到的 `view-transition-name` 是一个 css 声明，用法如下：

   ```css
   figcaption {
     view-transition-name: figure-caption; /* 绝对不可以加引号 */
   }
   ::view-transition-old(figure-caption),
   ::view-transition-new(figure-caption) {
     animation-duration: 0.5s; /* 这里的动画持续时间我理解为快照图片切换时的动画持续时间，对 color 有影响 */
     height: 100%;
   }
   ```

   在我们设定了这个 css 属性后，就可以像 `::view-transition-group(figure-caption)` 这样来选取。注意，每当你设置一个 `view-transition-name` 的同时，一个对应的 group 就在过渡动画触发时生成。

3. `::view-transition-old(root)` 和 `::view-transition-new(root)` 表示元素过渡前后的快照，我们可以在其上设置各种 css 属性，包括动画等。既然是快照，你可以把他们理解成一种另类的图片，他们可以被拉伸或者压缩，也可以调整长宽比（`object-fit`）等行为

## 创建一个基础的视图过渡动画

### 基础的 SPA 过渡效果

```JavaScript
function updateView(event) {
  const displayNewImage = () => {
    const mainSrc = `${targetIdentifier.src.split("_th.jpg")[0]}.jpg`;
    galleryImg.src = mainSrc;
    galleryCaption.textContent = targetIdentifier.alt;
  };

  // Fallback for browsers that don't support View Transitions:
  if (!document.startViewTransition) {
    displayNewImage();
    return;
  }
  // With View Transitions:
  const transition = document.startViewTransition(() => displayNewImage());
}
```

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s;
}
figcaption {
  view-transition-name: figure-caption;
}
::view-transition-old(figure-caption),
::view-transition-new(figure-caption) {
  position: absolute;
  top: 0;
  right: 0;
  left: auto;
  transform-origin: right center;
}
::view-transition-old(figure-caption) {
  animation: 0.25s linear both shrink-x;
}
::view-transition-new(figure-caption) {
  animation: 0.25s 0.25s linear both grow-x;
}
```

这里我省略了很多不相干的代码，只是为了展示使用的样例，完整代码可以看 [MDN 的样例](https://glitch.com/edit/#!/basic-view-transitions-api)

可以看到这里设置了两个 css 过渡效果，当我们触发过渡后，整个页面会拍摄一个旧快照和一个新快照，然后进行对比，执行切换的动画效果，但是 `figcaption` 标签自定义了它自己的动画，不用遵循默认动画，因此有了新的效果。

> [!note]
>
> 但这带来了一个新问题，以我的博客为例，点击切换主题的按钮后，会触发全页面的过渡效果，但是他还检测到我的切换页面的过渡设置，导致页面切换动画也被执行，为此我没有直接设置链接的 `view_transtion_name` 属性，而是当点击后动态设置，动画执行后再移除这些属性。
>
> 顺便提一下，如果不想要某个节点发生过渡效果，可以将该节点的 `view_transition_name` 设置为 `none`
