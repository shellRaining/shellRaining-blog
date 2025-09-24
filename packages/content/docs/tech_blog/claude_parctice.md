---
title: Claude code 实践经验
tag:
  - tech_blog
date: 2025-09-10
---

## 积极使用工具

> “君子生非异也,善假于物也”

### MCP 工具

模型能力确实有强弱，不过可以通过使用工具来稍稍补足自己的劣势。比如重命名可以使用 `MCP Language Server` 中的 `rename_symbol` 工具来完成，我做了一个小测试，目标是重命名一个被引用 31 次的变量，使用该 MCP 工具比不使用能够减少 85% 的 token 消耗！并且修改时间和准确率也更占优。同理可以套用到其他的 MCP 工具，比如 ESLint、Serena 等

### 命令行工具

由于某些原因，我需要重构我的 beancount 账单（一个命令行记账工具），最开始我的想法是让 claude code 直接去修改账单文件，但是经过几个小时的修改后，我发现账目虽然被配平，但实际的交易记录却对不上。于是我换了个 prompt，鼓励 claude code 去使用命令行工具（比如 awk）来间接的移动交易条目，账目果然很快就配平了，而且没有丢失任何交易记录！

> [!warning]
> 交易记录是很敏感的东西，所以最好不要让 AI 直接处理，让他使用一些文本处理工具间接执行重构操作是更明智的选择。但总而言之，最好还是不让他接触核心的交易部分，让他做一些杂活即可。

### 临时脚本

还是上面的例子，在重构完脚本后，我想要对交易纪录进行格式化，现有的格式化工具 bean-format 不符合我的需求，所以我让 claude code 写了一个脚本，直接进行格式化，这比直接命令 AI 修改要简单准确多了

### 总结

除了上面介绍的这些案例，我们还可以尝试使用 Claude code 编辑 excel 文档，部署个人服务等。从这些应用场景中可以看出，通过借助工具，Claude code 不仅是一个编码工具，更是一个“超越代码”范畴的工作流助手。

## worktree

使用 git worktree 来开发是最容易实现 2x 或者 3x 工程师的方法，因为我们可以同时处理一个项目的多个问题，同时不用担心模型写入同一个文件导致冲突，比如我自己的博客就是通过 worktree 来进行管理的：

```bash
.
├── main
├── camellia
├── rose
└── violet
```

我将项目分为了四部分，`main`，`camellia`，`rose`，`violet`，第一个仓库是实际会上线的分支，后面三个都是用来进行 feature 或者 bugfix 活动的，这里推荐 worktree 仓库只创建两三个，太多了容易管理不过来。下面介绍一下我个人的 worktree 使用经验

### hook

Claude code hook 能够约束 AI，产生可预期的确定性行为，所以很推荐使用这个功能

#### 任务结束提示

由于有三个分支，我们可以同时进行三个任务，如何判断他们结束就是一个问题，我们可以使用 hooks 来实现，针对每个仓库使用不同的 `Stop` 类型 hook，在结束时发出不同的提示音，比如下面这样：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay workspace/camellia.mp3", // 我们在 Camelia 仓库下使用这个音频文件
            "command": "afplay workspace/rose.mp3" // 在 Rose 仓库下使用另外一个音频文件
          }
        ]
      }
    ]
  }
}
```

为了避免这些文件被 git 管理，我们需要在不同仓库的 `.claude/settings.local.json` 中配置，这样当不同仓库的任务完成后，就可以立刻明白是哪个任务结束了，并且快速跳转过去。

除了使用声音作为任务完成的标识，我们还可以使用系统通知来实现同样的目标。这需要借助到任务命令行工具 terminal-notifier。可以看一下[这个仓库](https://github.com/centminmod/terminal-notifier-setup)，这个脚本能够帮我们快速设置这一系列流程

> [!note]
> 由于 Claude code 是命令行工具，有个问题就是如何快速跳转到我们想要的仓库。我目前使用的方法是：不同的仓库分别对应着一个 terminal 的 tab，然后设置快捷键在不同 tab 进行跳转，支持 tab 的方法有很多，原生支持的比如有 Ghostty，WezTerm，kitty 等，不原生支持的如 alacritty 可以使用终端复用工具如 tmux 等。除了使用终端的 tab 外，还可以使用专门集成了 Claude code 的 GUI，比如 conductor

> [!tip]
> 除了通过这些工具外，还有一个最简单直接的方法，就是不同的仓库使用不同的 window 打开，然后平铺到整个屏幕，这样哪个任务结束就一目了然

#### 自动格式化

格式化 hook 一般是不同的 worktree 仓库都要使用同一套，因此应该放到 `.claude/settings.json` 中，以方便不同仓库之间同步，这样每次任务结束后都会自动格式化

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run format" // 具体的格式化指令需要自己写，有些情况下可能需要全量格式化，有些情况下又可能只格式化修改后的文件
          }
        ]
      }
    ]
  }
}
```

我还是很喜欢这个 hook 的，因为 AI 生成的代码会有很多带有空格的空行，我们如果直接提交，后面格式化又会污染 git 提交历史

> [!warning] 一个邪门的想法
> 我们可不可以通过 rules 让 AI 生成两空格的代码，甚至是不换行和没有空格的代码，直接让 hook 去处理格式化的问题，这样做的优劣可能如下：
>
> - 优势：能够减少很多因为换行和空格带来的 token 消耗，一般来说如果用四个空格作为缩进，空格和换行字符占总字符的 20-30%
> - 劣势：我们生成的代码在 CLI 上展示的可读性很差（不过影响应该很小）

#### 提供时间和目录信息（可选）

可以在会话启动时注入一些时间和项目目录的信息，能够很好的帮助模型理解项目和当前时间状态，不过这些似乎可以通过已有的 MCP 工具来让模型调用，可以避免 token 的消耗

---

更多的 hook 可以看[这个仓库](https://github.com/hesreallyhim/awesome-claude-code?tab=readme-ov-file#hooks-)

### 各仓库同步

我目前在使用的时候遇到的同步比较少，主要是分为两种，一种是将子仓库（camellia、rose、violet）中的提交合入到主仓库中，另一种就是将主仓库的提交同步到各个子仓库中。我让 AI 写了一个脚本来加速该过程。其实也可以使用 claude code 的 sub agent 功能来实现对各仓库的管理，但我感觉确定性不够，而且速度太慢，就放弃了这个方法

```bash
#!/bin/sh
# POSIX 版（仅本地）：不进行任何网络操作（不 fetch / pull / push）
# 用法：
#   ./scripts/sync.sh                 # 默认依次处理 camellia rose violet
#   ./scripts/sync.sh camellia rose   # 指定要集成/同步的分支
#
# 语义：
# 1) 在 main 的 worktree 中：对每个 feature 执行 `git rebase feature`（集成 feature -> main）
# 2) 在各 feature 的 worktree 中：执行 `git rebase main`（同步 feature 到最新 main）
#
# 说明：
# - 仅在本地已有分支/工作树上操作；不会自动创建 worktree 或分支。
# - 遇到冲突会自动 `git rebase --abort`，请到对应工作树手动解决后再运行本脚本。

set -eu

MAIN_BRANCH="main"

info() { printf '[INFO] %s\n' "$*"; }
warn() { printf '[WARN] %s\n' "$*"; }
err()  { printf '[ERR ] %s\n' "$*" 1>&2; }

# 确保在 git 仓库
if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  err "当前目录不是 Git 仓库。请在任一 worktree 内运行。"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"

# 解析参数：功能分支列表
if [ "$#" -gt 0 ]; then
  FEATURES="$*"
else
  FEATURES="camellia rose violet"
fi

branch_exists() {
  git show-ref --verify --quiet "refs/heads/$1"
}

# 在 worktree 列表里找出给定分支的工作树路径（无则输出空）
get_worktree_path() {
  br="$1"
  git worktree list --porcelain | awk -v b="$br" '
    $1=="worktree"{p=$2}
    $1=="branch"{
      gsub(/^refs\/heads\//,"",$2);
      if($2==b){print p; exit}
    }
  '
}

# 工作树是否干净（只检查已跟踪文件的修改）
is_clean() {
  path="$1"
  git -C "$path" diff-index --quiet HEAD -- 2>/dev/null
}

do_rebase() {
  path="$1"; upstream="$2"
  info "[$(basename "$path")] git rebase $upstream"
  if git -C "$path" rebase "$upstream"; then
    return 0
  else
    warn "[$(basename "$path")] rebase 冲突，自动执行 git rebase --abort"
    git -C "$path" rebase --abort || true
    return 2
  fi
}

# 找 main 的 worktree
MAIN_PATH="$(get_worktree_path "$MAIN_BRANCH" || true)"
if [ -z "${MAIN_PATH:-}" ]; then
  err "未找到 main 分支对应的 worktree。请先在某个目录检出 main：\n  git worktree add ../main-dir main"
  exit 1
fi

# 结果汇总（字符串拼接，避免数组）
INTEGRATED_OK=""
INTEGRATED_CONFLICT=""
INTEGRATED_SKIP_DIRTY=""
INTEGRATED_SKIP_NOBRANCH=""

SYNC_OK=""
SYNC_CONFLICT=""
SYNC_SKIP_DIRTY=""
SYNC_SKIP_NOWT=""
SYNC_SKIP_NOBRANCH=""

# 1) 在 main 工作树中依次把 feature rebase 到 main（本地操作）
for fb in $FEATURES; do
  info "=== 集成: $fb -> main ==="
  if ! branch_exists "$fb"; then
    warn "[main] 跳过：本地不存在分支 $fb"
    INTEGRATED_SKIP_NOBRANCH="$INTEGRATED_SKIP_NOBRANCH $fb"
    continue
  fi

  if ! is_clean "$MAIN_PATH"; then
    warn "[main] 跳过：main 工作树不干净"
    INTEGRATED_SKIP_DIRTY="$INTEGRATED_SKIP_DIRTY $fb"
    continue
  fi

  if do_rebase "$MAIN_PATH" "$fb"; then
    INTEGRATED_OK="$INTEGRATED_OK $fb"
  else
    INTEGRATED_CONFLICT="$INTEGRATED_CONFLICT $fb"
  fi
done

# 2) 把每个 feature 在各自工作树里 rebase 到 main（本地操作）
for fb in $FEATURES; do
  info "=== 同步: $fb rebase main ==="
  if ! branch_exists "$fb"; then
    warn "[$fb] 跳过：本地不存在分支"
    SYNC_SKIP_NOBRANCH="$SYNC_SKIP_NOBRANCH $fb"
    continue
  fi

  FP="$(get_worktree_path "$fb" || true)"
  if [ -z "${FP:-}" ]; then
    warn "[$fb] 跳过：未找到该分支的 worktree（脚本不自动创建）"
    SYNC_SKIP_NOWT="$SYNC_SKIP_NOWT $fb"
    continue
  fi

  if ! is_clean "$FP"; then
    warn "[$fb] 跳过：工作树不干净"
    SYNC_SKIP_DIRTY="$SYNC_SKIP_DIRTY $fb"
    continue
  fi

  if do_rebase "$FP" "main"; then
    SYNC_OK="$SYNC_OK $fb"
  else
    SYNC_CONFLICT="$SYNC_CONFLICT $fb"
  fi
done

# 3) 总结
echo
info "============= 总结 ============="
printf "集成到 main 成功:        %s\n" "${INTEGRATED_OK:-(无)}"
printf "集成到 main 冲突:        %s\n" "${INTEGRATED_CONFLICT:-(无)}"
printf "集成跳过(工作树不干净):  %s\n" "${INTEGRATED_SKIP_DIRTY:-(无)}"
printf "集成跳过(无该分支):      %s\n" "${INTEGRATED_SKIP_NOBRANCH:-(无)}"
printf "同步 feature 成功:       %s\n" "${SYNC_OK:-(无)}"
printf "同步 feature 冲突:       %s\n" "${SYNC_CONFLICT:-(无)}"
printf "同步跳过(无worktree):    %s\n" "${SYNC_SKIP_NOWT:-(无)}"
printf "同步跳过(工作树不干净):  %s\n" "${SYNC_SKIP_DIRTY:-(无)}"
printf "同步跳过(无该分支):      %s\n" "${SYNC_SKIP_NOBRANCH:-(无)}"
echo
info "说明：有“冲突”的分支已执行 'git rebase --abort'。请到对应 worktree 手动解决后，再次运行本脚本。"
```

## 使用语音输入

语音输入能够快速地将自己的想法表述出来，一个熟练的打字者平均每分钟输出 80-100 字，而我们平日普通的对话能够轻松达到每分钟 200-250 字，因此打字速度经常成为我们表达的瓶颈。我们可以借助 macOS 自带的听写功能，或者是使用一些专用的听写工具（如 MacWhisper），来加速开发的流程

使用语音输入除了能够更快的表达自己的需求，还能够提供更完整的上下文，因为我们打字的时候可能会偷懒，少描述一些细节，但是语音输入能够让我们表述出更多的想法。这也意味着我们需要对语音输入的文字进行一些润色，所以挑选一个好的语音输入工具就很关键。

### macOS 听写功能

![image.png](https://2f0f3db.webp.li/2025/09/20250901083256737.png)

macOS 自带的听写功能可以在设置中开启，他的响应速度比较快，具有打字机效果（终端下我没看到过），但是准确性比较差，尤其是我们说的话中英文混合时，很容易出现英文识别错误的问题

### macWhisper

![image.png](https://2f0f3db.webp.li/2025/09/20250909091817759.png)

这个软件通过利用 OpenAI 的 whisper 模型，实现了诸如听写，字幕识别等各种功能，他的准确性很高，响应速度适中，缺点是硬盘空间占用很大，并且输出的文字没有标点，我们开发时给模型看是足够了，但如果用来完成一些文档工作就显得很不称手

### AI-Voice-Typing

![image.png](https://2f0f3db.webp.li/2025/09/20250909092248082.png)

一个快捷指令，工作原理是将我们语音输入的内容进行 base64 编码后，发送给 Gemini-2.5 flash，最后获取识别到的文字，并且可以搭配 Raycast 来实现更方便的使用，这种方式非常轻量，识别准确率高，缺点是需要自备 API key，并且响应相对较慢

### Spokenly

![image.png](https://2f0f3db.webp.li/2025/09/20250909093307237.png)

这个是推特上的[一篇推文](https://x.com/YinsenHo_/status/1964508408926921150)提到的，还没测试过

## 开发流程

### CLAUDE.md

CLAUDE.md 文件可以视为 claude code 的记忆仓库，分为

- 全局级别：适合存放个人级别的配置，比如模型输出风格等
- 项目级别：主要聚焦于项目结构，模型可以使用哪些工具进行开发等
- 模块级别：同样是项目级的配置，但是适合存放各个模块的详细信息

除了上面三类文件，有时候我们希望模型能读取更多文档，可以在文件内手动导入其他知识类型的文件（使用 @ 符号引用）

我们可以通过执行斜杠命令 `/init` 来创建一个项目级别的 CLAUDE.md。一个写的比较好的文档是 [bun 的 CLAUDE.md](https://github.com/oven-sh/bun/blob/main/CLAUDE.md)

### 小步迭代 & PLAN mode

小步迭代意味着我们要手动拆解一些大任务，这样虽然会增加前置的工作量，但好处也有很多

1. 能有效避免模型跑偏，即使稍微离题也可以及时纠正，并且还可以及时 review 代码，避免项目只有上帝看得懂😄
2. 每次小步迭代完可以清理或者压缩上下文，并且将需要持久化的上下文写入到 `Claude.md` 中，以供下次迭代使用
3. 可以配合版本管理工具及时回退，避免 token 无意义的消耗

PLAN mode 相当于让模型帮我们拆解大任务，我们只需要审核模型生成的计划表，然后让它按照该计划执行即可。我自己在使用时也能明显感受到，使用 PLAN mode 能够解决更复杂的问题，不过 PLAN mode 也有一些缺陷，就是执行时没法使用版本管理工具存档，一旦最终实现效果不合预期，回退的成本会比较高

### 重写而非修改

有时候我们并不能一口气实现我们想要实现的目标。这时候最好的办法是重写而非修改，原因如下：

1. 现在生成代码的成本很低廉，重来并不会耗费太多精力
2. 如果最开始的实现策略不好，在上面打补丁只会让系统更复杂
3. 继续对话会加长上下文，浪费 token

积极重写意味着我们需要完善的版本管理，可以设置一些 git alias 来方便使用，或者可以通过设置一个斜杠命令或者子智能体来让 AI 完成（就是会比较慢）

### `--dangerously-skip-permissions` 模式

claude code 的安全机制做得很好，但这有时也是比较烦人的一点，因为它做每件事都需要申请许可。我经常会遇到这样的情况，输入一条指令让它开始工作，然后离开了 5 分钟，等我回来的时候，我发现它卡在了第一步的申请工具使用😢

为了避免这种情况，我个人比较喜欢打开 `--dangerously-skip-permissions` 模式，在这个模式下，Claude code 能够执行任何命令（类似 cursor 的 yolo 模式），并且无需用户授权。虽然理论上可能会执行恶意的破坏命令，但是我到现在没有遇到过这种情况。如果你很担心这件事情，可以利用前面提到的 hook 功能来阻止这种事情的发生，详情可以看[这个仓库](https://github.com/disler/claude-code-hooks-mastery)。

## 杂项

### router

由于 Claude 最近 bug（降智）有点多，建议切换到 codex 或者使用其他模型，下面是最简单的切换方法，通过在启动时设置一些环境变量来控制具体调用的模型，可以添加到 `.zshrc` 中使用

```bash
# codex
alias codex_yolo='codex --yolo'
alias codex_high='codex -m gpt-5 -c model_reasoning_effort="high" --yolo'

# claude code
alias cc='claude'
alias cc_yolo='claude --dangerously-skip-permissions'
alias cc_yolo_high='claude --dangerously-skip-permissions --model opus'

# claude code with kimi
kimi() {
  export ANTHROPIC_BASE_URL=https://api.moonshot.cn/anthropic
  export ANTHROPIC_AUTH_TOKEN="$KIMI_API_KEY"
  claude "$@"
}

alias kimi_yolo='kimi --dangerously-skip-permissions'

# claude code with deepseek
deepseek() {
  export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
  export ANTHROPIC_AUTH_TOKEN="$DEEPSEEK_API_KEY"
  export API_TIMEOUT_MS=600000
  export ANTHROPIC_MODEL=deepseek-chat
  export ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat
  claude "$@"
}

alias deepseek_yolo='deepseek --dangerously-skip-permissions'
```

除了上面手动修改，还可以使用 Claude code router 或者 cc-switch 等代理工具

### ccstatusline

![image.png](https://2f0f3db.webp.li/2025/09/20250911000243287.png)

这个工具提供了非常友好的初始化界面和配置方式，能够实时显示 Claude code 的状态信息，比如所在仓库的分支，路径，使用的 token 数等，但是对 router 计数不准，需要酌情使用

### 使用终端快捷键

因为 TUI 界面无法利用鼠标，很多人感觉操作不便，这里介绍一些快捷键来优化使用体验（这不是 Claude code 独有的功能，而是命令行的特性），常用快捷键如下：

| **分类**   | **快捷键**        | **功能**                              |
| ---------- | ----------------- | ------------------------------------- |
| 光标移动   | `Ctrl+A`          | 移动到行首                            |
| 光标移动   | `Ctrl+E`          | 移动到行尾                            |
| 光标移动   | `Ctrl/Alt+B`      | 光标向左移动一个单词                  |
| 光标移动   | `Ctrl/Alt+F`      | 光标向右移动一个单词                  |
| 编辑与删除 | `Ctrl+U`          | 删除光标前所有内容                    |
| 编辑与删除 | `Ctrl+K`          | 删除光标后所有内容                    |
| 编辑与删除 | `Ctrl+W`          | 删除光标前的一个单词                  |
| 编辑与删除 | `Ctrl+H`          | 删除光标前的一个字符                  |
| 历史与补全 | `↑ / ↓`           | 浏览历史命令                          |
| 历史与补全 | `Ctrl+P / Ctrl+N` | 上一条/下一条历史命令（等同于 ↑ / ↓） |
| 历史与补全 | `Tab/Ctrl+i`      | 自动补全命令或文件名                  |

强烈推荐使用 Ctrl 系列快捷键，因为相比 ↑ / ↓，我们不用大幅度移动手指的位置。除了这些终端快捷键，还可以尝试一下 Claude code 的 Vim 模式

> [!tip]
> 这些快捷键非常实用，但是只能在终端使用，如果想要在 GUI 界面使用，可以使用一些改键软件，这里很推荐 Karabiner-Elements

## 总结

除了 hook CLAUDE.md 等特有功能外，这里的很多经验都是通用的，可以套用到其他 IDE 里面，

## 参考

- https://linux.do/t/topic/815083 Anthropic 团队如何使用 Claude Code
- https://linux.do/t/topic/880140 Claude Code Max 一个月后的见解
- https://mp.weixin.qq.com/s/bV5Cp3Ai0Q32L_M1m887Lg 从手工作坊到自动化工厂
- https://github.com/sirmalloc/ccstatusline Claude code status line 官方仓库
- https://x.com/axtrur/status/1965293655910126038 命令行 alias
- https://x.com/shao__meng/status/1950196917595754662 七个彻底改变工作方式的实用模式和技巧
- https://x.com/vista8/status/1962867419233538442 终端快捷键

