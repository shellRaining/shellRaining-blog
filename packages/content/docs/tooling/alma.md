## 详细介绍

这是一款类似 cherry studio 的桌面 agent 应用，可以编排各种 AI 服务提供商（如 ChatGPT、Anthropic、Gemini 等），值得一提的是，他支持通过 ACP 协议使用其他应用的 API，打开 API 提供商配置页面，可以看到提供了易用的界面方便用户配置

![image.png](https://2f0f3db.webp.li/2025/12/20251229182426675.png)

![image.png](https://2f0f3db.webp.li/2025/12/20251229194240193.png)

### 自动选取 tools

Alma 有一个很有意思的点，他不是一口气将所有工具暴露给模型，而是根据用户输入，自己决定在下次对话时使用的工具，

![image.png](https://2f0f3db.webp.li/2025/12/20251230104547955.png)

并且可以让用户自己选择开启哪些工具，这一点和 VSCode copilot 的做法很像，copilot 也是可以自由开启关闭使用的 tool，但是没有根据对话自动路由下一轮使用工具的功能。通过查找他们的 changelog，发现作者比较强调检索工具的性能，阈值为 2.5 秒，结合 changelog 中其他的一些信息，推测可能使用语义搜索来动态获取工具

![image.png](https://2f0f3db.webp.li/2025/12/20251230104705098.png)

除了对话初选择工具外，他还有一个专门的 ToolSearch 工具，遇到未知领域，Alma 会使用 `ToolSearch` 主动发现可用的新能力。在测试 MCP 的时候，我提问 nano banana MCP 有几个 tools 可以使用，发现 Alma 会调用该工具，再结合他有一个叫作“工具模型”的配置项，不禁怀疑他是不是把这个查找的任务交给了另一个模型

![image.png](https://2f0f3db.webp.li/2025/12/20251230191746178.png)

### skill

Alma 的 skill 和 Claude Code 的格式保持一致，可以方便的迁移使用，配置位置在 `~/.config/alma/skills/` 下

我这里测试了一个自己编写的生成透明图像的 skill（nano banana 等模型无法生成透明图像，为此需要生成后进行后处理），可以看到正确的读取了 skill 并切实的遵循了里面的内容，最终生成了一张透明底的图片

![image.png](https://2f0f3db.webp.li/2025/12/20251230204932912.png)

### memory

> [!IMPORTANT]
> Failed to create memory: Google Embedding API error: 404 - { "error": { "code": 404, "message": "models/text-embedding-3-small is not found for API version v1beta, or is not supported for embedContent. Call ListModels to see the list of available models and their supported methods.", "status": "NOT_FOUND" } }
>
> Failed to create memory: Dimension mismatch for inserted vector for the "embedding" column. Expected 1536 dimensions but received 768.

我在使用时遇到了上面的问题，但是根据作者及[其他人调查的帖子](https://x.com/hkdom/status/1998937106790408700)可知，Alma memory 的实现细节大致如下：

Alma 的 Memory 系统基于 SQLite 向量数据库实现，数据存储在 `~/Library/Application Support/alma/chat_threads.db`。采用混合记忆架构，结合了结构化记忆和历史搜索两种机制：

#### 结构化记忆系统（Memory System）

工作流程：

1. Tool Model 分析对话内容，提取关键信息
2. 根据重要性分类为 Permanent（永久）或 Temporary（临时）记忆
3. 生成 1536 维向量 embedding（兼容 OpenAI、Google Gemini、AiHubMix 等模型），存储到向量数据库
4. 对话时自动进行语义搜索（相似度阈值 0.1，最多返回 5 个相关记忆）
5. 临时记忆在会话结束后自动清理

#### 聊天历史搜索（SearchChatHistory Tool）

根据作者的[设计理念](https://x.com/yetone/status/1999387452122006008)，Alma 不将 RetrieveMemories 作为独立工具，而是将完整的聊天历史搜索能力包装为 SearchChatHistory 工具。AI 可以像人类一样不断变换关键词搜索历史记录，找寻未被提取为结构化记忆的细节信息。

### preview & terminal

Alma 内置了 preview 功能，当使用 Artifacts 功能的时候，会创建一个临时目录，然后在里面生成前端代码，preview 能够自动启动开发服务器并打开一个网页，如下图所示

![image.png](https://2f0f3db.webp.li/2025/12/20251230112507714.png)

除了通过 preview 页面打开，Alma 内置的终端甚至还会识别 URL，当我们点击下图的 `http://localhost:5174` 后，会自动拦截并创建一个新的窗口，里面是我们的 Artifacts 预览

![image.png](https://2f0f3db.webp.li/2025/12/20251230112611860.png)

### 唤起其他应用

他是通过AppleScript来实现的，可以管理 macOS 上的原生应用，比如日历、邮件、待办事项等

![image.png](https://2f0f3db.webp.li/2025/12/20251231101747261.png)

> [!note]
> 我感到特殊的地方是，Alma 通过提示词的方式告诉模型如何去唤起其他应用，而 Claude desktop 是通过 extension（本质是 MCP server）来控制，Alma 为什么没有选择这种形态

### 配色方案

我觉得 Alma 的配色实现方案值得我们去学习，他使用了 base46 主题设计模式，能够快速地将 TUI 中设计精良的主题迁移到 GUI 中。

![image-20251230232745907](https://2f0f3db.webp.li/2025/12/image-20251230232745907.png)

甚至还可以让用户自己定制主题

![image.png](https://2f0f3db.webp.li/2026/01/20260107171343481.png)

> [!note]
>
> base46 指的是 NvChad（一个流行的 Neovim 配置框架）中用于管理和生成主题（Themes）的核心插件或设计规范
>
> Base46 定义了一个标准的 Lua Table 结构。一个主题仅仅是一个简单的 Lua 表，其中 30 个主题色用于定义界面上的颜色，剩下 16 个主题定义代码高亮
>
> 因此，只要给界面上的元素分配对应的主题色，就可以方便地切换主题，同时，它与我们日常使用的 CSS 变量也有区别，我们平时使用的时候并没有定义一个标准，因此复用社区已有主题会比较困难，通过 base46 可以很好的解决。
>
> ```lua
> M.base_30 = {
>   white = "#ced4df",
>   darker_black = "#05080e",
>   black = "#0B0E14", --  nvim bg
>   black2 = "#14171d",
>   one_bg = "#1c1f25",
>   one_bg2 = "#24272d",
>   one_bg3 = "#2b2e34",
>   grey = "#33363c",
>   grey_fg = "#3d4046",
>   grey_fg2 = "#46494f",
>   light_grey = "#54575d",
>   red = "#F07178",
>   baby_pink = "#ff949b",
>   pink = "#ff8087",
>   line = "#24272d", -- for lines like vertsplit
>   green = "#AAD84C",
>   vibrant_green = "#b9e75b",
>   blue = "#36A3D9",
>   nord_blue = "#43b0e6",
>   yellow = "#E7C547",
>   sun = "#f0df8a",
>   purple = "#c79bf4",
>   dark_purple = "#A37ACC",
>   teal = "#74c5aa",
>   orange = "#ffa455",
>   cyan = "#95E6CB",
>   statusline_bg = "#12151b",
>   lightbg = "#24272d",
>   pmenu_bg = "#ff9445",
>   folder_bg = "#98a3af",
> }
>
> M.base_16 = {
>   base00 = "#0B0E14",
>   base01 = "#1c1f25",
>   base02 = "#24272d",
>   base03 = "#2b2e34",
>   base04 = "#33363c",
>   base05 = "#c9c7be",
>   base06 = "#E6E1CF",
>   base07 = "#D9D7CE",
>   base08 = "#c9c7be",
>   base09 = "#FFEE99",
>   base0A = "#56c3f9",
>   base0B = "#AAD84C",
>   base0C = "#FFB454",
>   base0D = "#F07174",
>   base0E = "#FFB454",
>   base0F = "#CBA6F7",
> }
> ```

### 输出音效（选择性使用）

在输出文本的时候，它会配合着打字机效果播放一些音效，让人在等待的时候不觉得无聊😄算是一个比较有意思的点

![image-20251230230936601](https://2f0f3db.webp.li/2025/12/image-20251230230936601.png)

### 语音输入

Alma 具有语音输入功能，我们可以在设置页下载识别语音输入的模型，他默认推荐使用的是 OpenAI 的 Whisper 模型。

![image-20251230225737116](https://2f0f3db.webp.li/2025/12/image-20251230225737116.png)

### 流程图

Alma 支持 mermaid 和 infographic 两种绘图及预览方式，前者会在侧边栏打开一个预览窗口，可以在预览和原始代码两种模式间切换。后者是通过 antv 库实现的。

![image-20251231083838157](https://2f0f3db.webp.li/2025/12/image-20251231083838157.png)
下面是 Alma 生成的 infographic 源码，不过作者说到，LLM 对 infographic 的语法不熟悉，所以经常生成错误的语法

```infographic
infographic hierarchy-tree-curved-line-rounded-rect-node
data
  title Base46 架构示意图
  items
    - label Base46 核心引擎
      icon mdi/engine
      children
        - label 1. 数据层 (Data)
          icon mdi/palette-swatch
          children
            - label Base16 定义
              icon mdi/code-json
              description 语法高亮 (Syntax)
            - label Base30 定义
              icon mdi/monitor-dashboard
              description UI 组件 (Widgets)
        - label 2. 逻辑层 (Logic)
          icon mdi/function-variant
          children
            - label 映射集成 (Integrations)
              icon mdi/map-marker-path
              description 将变量分配给组件
        - label 3. 表现层 (View)
          icon mdi/layers-triple
          children
            - label Neovim (TUI)
              icon mdi/console-line
            - label Alma (GUI)
              icon mdi/desktop-mac-dashboard

```

## 使用体验

整体来说确实很精美，但是让人想吐槽并且放弃这款应用的点很多

1. ACP 协议提供的三种接入都需要用户手动安装额外的 npm 包，比如 Claude Code 需要执行 `npm install -g @zed-industries/claude-code-acp`，同理 codex 需要 `npm install -g @zed-industries/codex-acp`
2. <del>他可以作为 coding agent，但离 IDE 差的比较远，更多的像 Claude Code for VSCode 这样，是一个对话窗口，他内置的文件管理器是只读的，不能进行增删改查</del>（最新版本已经添加简单的增删功能）
3. <del>存在比较频繁的性能问题，社区里反馈也很多（似乎是由于监听工作区变动，或者文件索引导致的）</del>（最新版通过使用原生文件监听解决该问题）
   ![image.png](https://2f0f3db.webp.li/2025/12/20251230110826383.png)
4. 输入框的光标很灵动，但是有时候它这个光标位置和我们正在输入的位置不同，很影响使用体验。具体可以看这个 [issue](https://feedback.alma.now/p/guang-biao-xian-shi-cuo-wu)
5. 不遵循 `AGENT.md`、`CLAUDE.md` 等规则
6. 在一个 sub task 中无法指定使用的新模型，使用场景为：主 task 使用 sonnet 模型，但需要子 task 使用 nano banana 模型生成一张图片，这一点还是没有实现
7. MCP 不支持工具输出图片，这一口 base64 编码的图片喂给模型实在是狠毒
   ![image.png](https://2f0f3db.webp.li/2025/12/20251230195658924.png)

直言不讳，这个作品有很多有创意的点，但对不起他说的优雅二字。首先是数不清的 bug 和视觉小缺陷，再看到作者发推说他用 Claude Code 开发这个产品，我更是对这款产品没有信心，连自举都没有办法做到，那这款产品开发给谁的呢。
