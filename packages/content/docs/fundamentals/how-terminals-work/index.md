---
title: 终端是如何工作的
tag:
  - fundamentals
date: 2026-02-26
---

<script setup>
import GridDemo from "./terminal-demos/GridDemo.vue"
import CellZoom from "./terminal-demos/CellZoom.vue"
import EscapeDemo from "./terminal-demos/EscapeDemo.vue"
import KeyboardDemo from "./terminal-demos/KeyboardDemo.vue"
import MouseDemo from "./terminal-demos/MouseDemo.vue"
import SignalsDemo from "./terminal-demos/SignalsDemo.vue"
import InputModesDemo from "./terminal-demos/InputModesDemo.vue"
import FlowDiagram from "./terminal-demos/FlowDiagram.vue"
import AdvancedTUIDemo from "./terminal-demos/AdvancedTUIDemo.vue"
import AlternateScreenDemo from "./terminal-demos/AlternateScreenDemo.vue"
import IconsDemo from "./terminal-demos/IconsDemo.vue"
import StateManagementDemo from "./terminal-demos/StateManagementDemo.vue"
import TextSelectionDemo from "./terminal-demos/TextSelectionDemo.vue"
import CapabilityDiscoveryDemo from "./terminal-demos/CapabilityDiscoveryDemo.vue"
import VocabularyDemo from "./terminal-demos/VocabularyDemo.vue"
</script>

本文是对 [How Terminals Work](https://how-terminals-work.vercel.app/) 的中文翻译与交互式复刻，通过可操作的 Demo 帮助你理解终端模拟器和 TUI 的工作原理。

## 01 网格模型

终端本质上就是一个由等宽单元格组成的网格，就像一块屏幕，只不过像素非常大，每个像素只能显示一个字符。

当程序向终端输出文本时，字符会从左到右、从上到下依次填入这些单元格。到达行尾自动换行，到达底部则整个网格向上滚动。

<GridDemo />

## 02 单元格里有什么

每个单元格存储一个字符加上这个字符的样式信息，如前景色、背景色、粗体、下划线等。

终端的颜色系统经历了从 16 色到 256 色再到真彩色（1600 万色）的演进。下面的 Demo 可以让你直观地体验单元格的各项属性，以及不同颜色深度之间的差异。

<CellZoom />

## 03 转义序列

你有时可能会看到类似 `^[[31m` 这样的奇怪字符，这些特殊的字符序列可以控制终端，进行移动光标、改变颜色、清除屏幕等操作，他们就是转义序列字符。

<EscapeDemo />

## 04 终端是按键与程序的中介

当你按下一个键时，终端首先接收到这个信息，然后终端会向程序发送字节。方向键和鼠标点击也会变成转义序列。

<KeyboardDemo />

---

<MouseDemo />

## 05 信号

Ctrl+C 不是输入一个字符，它触发了一个信号（signal）。当你按下 Ctrl-C 后，终端发送一个字节（0x03），但在程序接收到之前，系统内核会先拦截它，并生成 SIGINT 信号。

<SignalsDemo />

## 06 输入模式

终端有两种基本的输入模式。在 cooked 模式（行缓冲）下，内核收集你的输入直到按回车；在 raw 模式下，每个按键立即发送给程序。你的 shell 使用 cooked 模式，vim 使用 raw 模式。

<InputModesDemo />

## 07 完整的往返

从按键到屏幕显示，数据经历了一次完整的往返旅程：你的按键被终端编码为字节，通过 PTY 传给 shell，shell 执行命令并产生输出，输出再沿着相同路径返回，最终被终端渲染为你看到的文字。

<FlowDiagram />

## 08 构建复杂的 TUI

全屏终端应用（如 htop、vim、lazygit）将终端网格划分为多个区域，包括标签栏、侧边栏、内容区。每个区域有自己的坐标、尺寸和焦点状态。这些应用通过转义序列精确控制每个单元格的显示。

<AdvancedTUIDemo />

## 09 备用屏幕缓冲区

终端有两个屏幕缓冲区：普通屏幕和备用屏幕。当你打开 vim 时，它切换到备用屏幕；退出后，你的终端历史完好如初。这就是为什么全屏应用不会弄乱你的滚动历史。

<AlternateScreenDemo />

## 10 终端图标

现代终端中的文件图标、语言 Logo、状态指示灯都不是图片，而是 Unicode 私有使用区中的字符，由 Nerd Fonts 等特殊字体渲染为图标字形。

<IconsDemo />

## 11 状态管理

终端应用在内存中维护状态（当前模式、输入缓冲区、历史记录等），与 GUI 应用无异。区别在于它们通过在特定位置打印字符来显示状态变化。终端本身并不了解应用的状态，它只是一个字符显示器。

<StateManagementDemo />

## 12 文本选择与光标定位

你无法通过点击来移动光标，因为终端的文本选择与应用的光标是分开处理的。Option+Click 之所以能移动光标，是因为终端在模拟方向键按压，这是一种 hack，而非原生行为。

<TextSelectionDemo />

## 13 能力发现

程序如何知道终端支持哪些功能？有两种方式：通过 TERM 环境变量查询 terminfo 数据库，或直接向终端发送查询序列（如 DA1）。特性默认是关闭的，程序需要主动发送转义序列来启用它们。

<CapabilityDiscoveryDemo />

## 14 术语表

终端、Shell、控制台、CLI——这些词经常被混用，但它们各有所指。理解这些术语的区别，以及它们在整体架构中的位置，能帮助你更好地理解终端的工作原理。

<VocabularyDemo />
