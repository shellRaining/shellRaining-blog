<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";

type Term =
  | "terminal"
  | "shell"
  | "terminal-emulator"
  | "pty"
  | "bash"
  | "zsh"
  | "console"
  | "cli";

interface TermDefinition {
  name: string;
  shortName?: string;
  category: "hardware" | "software" | "shell" | "interface";
  definition: string;
  examples: string[];
  alsoKnownAs?: string[];
}

const TERMS: Record<Term, TermDefinition> = {
  terminal: {
    name: "Terminal",
    category: "hardware",
    definition:
      "最初是连接到大型机的物理设备，带有屏幕和键盘。如今，这个词通常指终端模拟器。",
    examples: ["VT100", "VT220", "IBM 3270"],
    alsoKnownAs: ["TTY", "Teletype"],
  },
  "terminal-emulator": {
    name: "Terminal Emulator",
    category: "software",
    definition:
      "模拟物理终端的程序。它绘制字符网格、处理输入/输出，并连接到 shell。这才是你电脑上实际运行的东西。",
    examples: [
      "iTerm2",
      "Terminal.app",
      "Windows Terminal",
      "Alacritty",
      "kitty",
      "Warp",
      "Ghostty",
      "WezTerm",
    ],
  },
  shell: {
    name: "Shell",
    category: "software",
    definition:
      "解释命令的程序。Shell 读取你的输入、执行程序，处理管道、重定向和脚本。终端模拟器只是窗口；shell 是在里面运行的程序。",
    examples: [
      "sh",
      "bash",
      "zsh",
      "fish",
      "ksh",
      "tcsh",
      "PowerShell",
      "nushell",
    ],
  },
  pty: {
    name: "PTY (Pseudo-Terminal)",
    shortName: "PTY",
    category: "software",
    definition:
      "内核特性，创建一个伪终端设备。它有两端：主端（连接到终端模拟器）和从端（连接到 shell）。这就是连接终端和 shell 的管道。",
    examples: ["/dev/pts/0", "/dev/ttys000"],
    alsoKnownAs: ["Pseudoterminal", "Pseudo-TTY"],
  },
  bash: {
    name: "Bash",
    category: "shell",
    definition:
      '"Bourne Again Shell"——大多数 Linux 系统的默认 shell。以脚本能力和 POSIX 兼容性著称。使用 .bashrc 和 .bash_profile 进行配置。',
    examples: ["#!/bin/bash", "source ~/.bashrc"],
  },
  zsh: {
    name: "Zsh",
    category: "shell",
    definition:
      '"Z Shell"——自 Catalina 起 macOS 的默认 shell。比 bash 有更好的 Tab 补全、主题（Oh My Zsh）和交互功能。语法与 bash 大部分兼容。',
    examples: ["#!/bin/zsh", "source ~/.zshrc"],
  },
  console: {
    name: "Console",
    category: "interface",
    definition:
      '历史上指直接连接到计算机的物理终端。在现代用法中，常与"终端"互换使用，或指基于文本的界面。',
    examples: ["Linux 虚拟控制台 (Ctrl+Alt+F1)", "浏览器开发者控制台"],
    alsoKnownAs: ["System console"],
  },
  cli: {
    name: "CLI (Command-Line Interface)",
    shortName: "CLI",
    category: "interface",
    definition:
      "基于文本的界面，通过输入命令进行交互。与 GUI 相对。Shell 和你在终端中运行的程序都是 CLI。",
    examples: ["git", "npm", "docker", "curl"],
  },
};

const TERM_ORDER: Term[] = [
  "terminal",
  "terminal-emulator",
  "shell",
  "pty",
  "bash",
  "zsh",
  "console",
  "cli",
];

const CATEGORY_COLORS: Record<string, string> = {
  hardware: "#eab308",
  software: "#06b6d4",
  shell: "#22c55e",
  interface: "#a855f7",
};

const CATEGORY_LABELS: Record<string, string> = {
  hardware: "硬件",
  software: "软件",
  shell: "Shell",
  interface: "接口类型",
};

const SHELLS: Record<
  string,
  {
    name: string;
    year: string;
    creator: string;
    description: string;
    config: string;
    defaultOn: string;
    color: string;
  }
> = {
  sh: {
    name: "sh (Bourne Shell)",
    year: "1979",
    creator: "Stephen Bourne (Bell Labs)",
    description:
      "最初的 Unix shell。确立了至今仍在使用的脚本约定。可移植脚本的标准。",
    config: "/etc/profile, ~/.profile",
    defaultOn: "POSIX 系统 (作为 /bin/sh)",
    color: "#525252",
  },
  bash: {
    name: "Bash (Bourne Again Shell)",
    year: "1989",
    creator: "Brian Fox (GNU 项目)",
    description:
      "向后兼容 sh，增加了命令历史、作业控制和更好的脚本能力。Linux 上最常见的 shell。",
    config: "~/.bashrc, ~/.bash_profile",
    defaultOn: "大多数 Linux 发行版",
    color: "#eab308",
  },
  zsh: {
    name: "Zsh (Z Shell)",
    year: "1990",
    creator: "Paul Falstad",
    description:
      "融合了 bash、ksh 和 tcsh 的特性。以强大的 Tab 补全、拼写纠正和通过 Oh My Zsh 的主题功能著称。",
    config: "~/.zshrc, ~/.zprofile",
    defaultOn: "macOS (自 2019 年起)",
    color: "#06b6d4",
  },
  fish: {
    name: "Fish (Friendly Interactive Shell)",
    year: "2005",
    creator: "Axel Liljencrantz",
    description:
      "优先考虑用户友好性而非 POSIX 兼容。内置语法高亮、自动建议和基于 Web 的配置。",
    config: "~/.config/fish/config.fish",
    defaultOn: "无 (需手动安装)",
    color: "#22c55e",
  },
  ksh: {
    name: "Ksh (Korn Shell)",
    year: "1983",
    creator: "David Korn (Bell Labs)",
    description:
      "结合了 sh 兼容性和 C shell 特性。在企业 Unix 环境中流行。有关联数组和更好的循环语法。",
    config: "~/.kshrc",
    defaultOn: "部分商业 Unix",
    color: "#a855f7",
  },
  tcsh: {
    name: "Tcsh (TENEX C Shell)",
    year: "1981",
    creator: "Ken Greer",
    description:
      "增强版 C shell，带命令行编辑和补全。类 C 的脚本语法。曾是旧版 BSD 和早期 macOS 的默认 shell。",
    config: "~/.tcshrc, ~/.cshrc",
    defaultOn: "FreeBSD (历史上)",
    color: "#ef4444",
  },
  nushell: {
    name: "Nushell",
    year: "2019",
    creator: "Jonathan Turner 等",
    description:
      "现代 shell，将数据视为结构化表格而非文本。管道传递类型化数据。不兼容 POSIX 但数据处理能力很强。",
    config: "~/.config/nushell/config.nu",
    defaultOn: "无 (需手动安装)",
    color: "#3b82f6",
  },
};

const TERMINALS: Record<
  string,
  {
    name: string;
    type: string;
    description: string;
    features: string[];
    color: string;
  }
> = {
  vt100: {
    name: "VT100 (1978)",
    type: "硬件",
    description:
      "定义了标准的 DEC 终端。第一个兼容 ANSI 的终端。大多数现代终端模拟器都可以追溯到这里。",
    features: ["ANSI 转义码", "80x24 显示", "滚动区域"],
    color: "#eab308",
  },
  xterm: {
    name: "xterm (1984)",
    type: "经典",
    description:
      "最初的 X Window System 终端模拟器。增加了鼠标追踪和 256 色。至今仍是参考实现。",
    features: ["VT102 模拟", "鼠标追踪", "256 色"],
    color: "#525252",
  },
  iterm2: {
    name: "iTerm2",
    type: "功能丰富",
    description:
      "最流行的 macOS 终端。分栏、搜索、触发器、Python 脚本 API。原生 tmux 集成。",
    features: ["分栏", "Tmux 集成", "自动补全", "触发器"],
    color: "#22c55e",
  },
  alacritty: {
    name: "Alacritty",
    type: "极简/高速",
    description:
      "GPU 加速，用 Rust 编写。专注于速度和简洁。没有标签页、没有分栏——请使用 tmux。",
    features: ["GPU 渲染", "跨平台", "Vi 模式", "高速"],
    color: "#06b6d4",
  },
  kitty: {
    name: "kitty",
    type: "功能丰富",
    description:
      "基于 GPU 并有自己的图片协议。可通过 kittens 扩展。定义了现已被广泛采用的 kitty 键盘协议。",
    features: ["GPU 渲染", "图片支持", "Kittens", "标签/分栏"],
    color: "#a855f7",
  },
  warp: {
    name: "Warp",
    type: "现代/AI",
    description:
      "重新定义终端：区块化、AI 辅助和团队功能。输入在底部，现代文本编辑体验。",
    features: ["AI 辅助", "区块化", "团队协作", "现代 UI"],
    color: "#3b82f6",
  },
  ghostty: {
    name: "Ghostty",
    type: "现代/高速",
    description:
      "Mitchell Hashimoto (Vagrant, Terraform) 的作品。原生 GPU 渲染、kitty 图形、合理的默认配置。2024 年底开源。",
    features: ["原生渲染", "Kitty 图形", "高速", "简洁默认"],
    color: "#ef4444",
  },
};

const FLOW_STEPS = [
  {
    label: "你输入",
    content: "ls -la",
    description: "你在键盘上按下按键",
  },
  {
    label: "终端接收",
    content: "l, s, 空格, -, l, a",
    description: "终端模拟器接收击键并显示它们",
  },
  {
    label: "Shell 接收",
    content: "ls -la\\n",
    description: "当你按下回车，shell 接收到完整的一行",
  },
  {
    label: "Shell 解析",
    content: "command: ls, args: [-l, -a]",
    description: "Shell 解释命令和参数",
  },
  {
    label: "Shell 执行",
    content: "/bin/ls -l -a",
    description: "Shell 找到并运行 ls 程序",
  },
  {
    label: "输出回传",
    content: "drwxr-xr-x  5 user ...",
    description: "程序输出通过 PTY 传回终端",
  },
];

const CONFUSIONS = [
  {
    q: '"我打开了终端"',
    a: "你可能是说打开了一个终端模拟器（如 iTerm2），它在内部启动了一个 shell（如 zsh）。",
    highlights: [
      { text: "终端模拟器", color: "#06b6d4" },
      { text: "shell", color: "#22c55e" },
    ],
  },
  {
    q: '"终端找不到命令"',
    a: "实际上是你的 shell 在 PATH 中搜索命令。终端只是显示 shell 的输出。",
    highlights: [{ text: "shell", color: "#22c55e" }],
  },
  {
    q: '"bash 还是 zsh——该用哪个？"',
    a: "交互使用时 zsh 功能更好。写脚本时 bash 更具可移植性。大多数命令在两者中表现完全一致。",
    highlights: [
      { text: "zsh", color: "#06b6d4" },
      { text: "bash", color: "#eab308" },
    ],
  },
  {
    q: '"终端设置 vs shell 配置"',
    a: "终端设置控制外观（字体、颜色、窗口大小）。Shell 配置（.zshrc）控制别名、PATH 和提示符。",
    highlights: [
      { text: "终端设置", color: "#06b6d4" },
      { text: "Shell 配置", color: "#22c55e" },
    ],
  },
  {
    q: '"上箭头怎么回忆之前的命令？"',
    a: "那是你的 shell 的功能，不是终端。Shell 维护一个历史文件（如 ~/.zsh_history），并将回忆的命令发回终端显示。",
    highlights: [{ text: "shell", color: "#22c55e" }],
  },
  {
    q: '"为什么编辑 .zshrc 后要重启终端？"',
    a: "Shell 在启动时只读取一次 .zshrc。已存在的 shell 已经加载了配置。打开新终端会启动新 shell 来读取更新的文件。（或运行 source ~/.zshrc 来重新加载。）",
    highlights: [
      { text: ".zshrc", color: "#06b6d4" },
      { text: "source ~/.zshrc", color: "#22c55e" },
    ],
  },
];

const activeTerm = ref<Term>("terminal");
const selectedShell = ref("zsh");
const selectedTerminal = ref("iterm2");
const flowStepIndex = ref(0);

const termData = computed(() => TERMS[activeTerm.value]);
const shellData = computed(() => SHELLS[selectedShell.value]);
const terminalData = computed(() => TERMINALS[selectedTerminal.value]);
const currentFlowStep = computed(() => FLOW_STEPS[flowStepIndex.value]);

function flowPrev() {
  if (flowStepIndex.value > 0) flowStepIndex.value--;
}

function flowNext() {
  if (flowStepIndex.value < FLOW_STEPS.length - 1) flowStepIndex.value++;
}

function isArchHighlighted(terms: Term[]) {
  return terms.includes(activeTerm.value);
}
</script>

<template>
  <div class="vocab-demo">
    <!-- Glossary -->
    <div class="glossary-panel">
      <div class="glossary-list">
        <div class="glossary-list-inner">
          <div
            v-for="term in TERM_ORDER"
            :key="term"
            :class="['glossary-item', { active: activeTerm === term }]"
            @mouseenter="activeTerm = term"
          >
            <span
              class="glossary-cat"
              :style="{ color: CATEGORY_COLORS[TERMS[term].category] }"
            >
              {{ CATEGORY_LABELS[TERMS[term].category].split(" ")[0] }}
            </span>
            <span class="glossary-name">{{
              TERMS[term].shortName || TERMS[term].name
            }}</span>
          </div>
        </div>
      </div>

      <div class="glossary-detail">
        <div
          class="detail-category"
          :style="{ color: CATEGORY_COLORS[termData.category] }"
        >
          {{ CATEGORY_LABELS[termData.category] }}
        </div>
        <div class="detail-name">{{ termData.name }}</div>
        <div v-if="termData.alsoKnownAs" class="detail-aka">
          AKA: {{ termData.alsoKnownAs.join(", ") }}
        </div>
        <p class="detail-def">{{ termData.definition }}</p>
        <div class="detail-examples">
          <div class="detail-examples-label">示例</div>
          <div class="detail-examples-list">
            <span
              v-for="ex in termData.examples"
              :key="ex"
              class="example-tag"
              :style="{ color: CATEGORY_COLORS[termData.category] }"
            >
              {{ ex }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Architecture Diagram -->
    <div class="arch-panel">
      <div class="arch-title">它们如何组合在一起</div>
      <div class="arch-layers">
        <div
          :class="[
            'arch-layer',
            'layer-blue',
            {
              highlighted: isArchHighlighted(['terminal-emulator', 'terminal']),
            },
          ]"
        >
          <div class="layer-header">
            <span class="layer-label" style="color: #3b82f6">终端模拟器</span>
            <span class="layer-examples">iTerm2, Ghostty, kitty</span>
          </div>
          <div
            :class="[
              'arch-layer',
              'layer-yellow',
              { highlighted: isArchHighlighted(['pty']) },
            ]"
          >
            <div class="layer-header">
              <span class="layer-label" style="color: #eab308">PTY</span>
              <span class="layer-examples">内核中的伪终端</span>
            </div>
            <div
              :class="[
                'arch-layer',
                'layer-green',
                { highlighted: isArchHighlighted(['shell', 'bash', 'zsh']) },
              ]"
            >
              <div class="layer-header">
                <span class="layer-label" style="color: #22c55e">Shell</span>
                <span class="layer-examples">zsh, bash, fish</span>
              </div>
              <div
                :class="[
                  'arch-layer',
                  'layer-magenta',
                  { highlighted: isArchHighlighted(['cli']) },
                ]"
              >
                <div class="layer-header">
                  <span class="layer-label" style="color: #a855f7"
                    >CLI 程序</span
                  >
                  <span class="layer-examples">git, npm, vim</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="arch-note">
          <span class="arch-note-highlight">数据双向流动：</span>
          击键向内传递，输出向外传递。每一层都会对数据进行转换。
        </div>
      </div>
    </div>

    <!-- Shell Landscape -->
    <div class="landscape-panel">
      <div class="landscape-title">Shell 家族谱</div>
      <div class="landscape-buttons">
        <TButton
          v-for="key in Object.keys(SHELLS)"
          :key="key"
          :variant="selectedShell === key ? 'toggle' : 'secondary'"
          :active="selectedShell === key"
          @click="selectedShell = key"
        >
          {{ key }}
        </TButton>
      </div>
      <div v-if="shellData" class="landscape-detail">
        <div>
          <span class="landscape-name" :style="{ color: shellData.color }">{{
            shellData.name
          }}</span>
          <span class="landscape-year">({{ shellData.year }})</span>
        </div>
        <p class="landscape-desc">{{ shellData.description }}</p>
        <div class="landscape-meta">
          <div>
            <div class="meta-label">配置文件</div>
            <div class="meta-value mono">{{ shellData.config }}</div>
          </div>
          <div>
            <div class="meta-label">默认于</div>
            <div class="meta-value">{{ shellData.defaultOn }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Terminal Landscape -->
    <div class="landscape-panel">
      <div class="landscape-title">终端模拟器一览</div>
      <div class="landscape-buttons">
        <TButton
          v-for="key in Object.keys(TERMINALS)"
          :key="key"
          :variant="selectedTerminal === key ? 'toggle' : 'secondary'"
          :active="selectedTerminal === key"
          @click="selectedTerminal = key"
        >
          {{ key === "vt100" ? "VT100" : key === "iterm2" ? "iTerm2" : key }}
        </TButton>
      </div>
      <div v-if="terminalData" class="landscape-detail">
        <div>
          <span class="landscape-name" :style="{ color: terminalData.color }">{{
            terminalData.name
          }}</span>
          <span class="landscape-year">&bull; {{ terminalData.type }}</span>
        </div>
        <p class="landscape-desc">{{ terminalData.description }}</p>
        <div>
          <div class="meta-label">主要特性</div>
          <div class="feature-tags">
            <span
              v-for="f in terminalData.features"
              :key="f"
              class="feature-tag"
              >{{ f }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Command Flow Demo -->
    <div class="landscape-panel">
      <div class="landscape-title">跟踪一条命令</div>
      <div class="flow-nav">
        <TButton :disabled="flowStepIndex === 0" @click="flowPrev"
          >上一步</TButton
        >
        <div class="flow-steps-row">
          <button
            v-for="(_, i) in FLOW_STEPS"
            :key="i"
            :class="['flow-step-dot', { active: flowStepIndex === i }]"
            @click="flowStepIndex = i"
          >
            {{ i + 1 }}
          </button>
        </div>
        <TButton
          :disabled="flowStepIndex === FLOW_STEPS.length - 1"
          @click="flowNext"
          >下一步</TButton
        >
      </div>
      <div class="flow-box">
        <div class="flow-step">
          <div class="flow-step-label">{{ currentFlowStep.label }}</div>
          <div class="flow-step-content">{{ currentFlowStep.content }}</div>
          <div class="flow-step-desc">{{ currentFlowStep.description }}</div>
        </div>
      </div>
    </div>

    <!-- Common Confusions -->
    <div class="landscape-panel">
      <div class="landscape-title">常见混淆</div>
      <div class="confusions-grid">
        <div v-for="(item, i) in CONFUSIONS" :key="i" class="confusion-card">
          <div class="confusion-q">{{ item.q }}</div>
          <p class="confusion-a">{{ item.a }}</p>
        </div>
      </div>
    </div>

    <!-- Quick Reference -->
    <div class="landscape-panel">
      <div class="landscape-title">快速参考</div>
      <TerminalWindow>
        <div class="quick-ref">
          <div class="ref-comment"># 我在用哪个 shell？</div>
          <div class="ref-cmd">echo $SHELL</div>
          <div class="ref-comment"># 我在哪个终端里？</div>
          <div class="ref-cmd">echo $TERM_PROGRAM</div>
          <div class="ref-comment"># 我的 PTY 设备是什么？</div>
          <div class="ref-cmd">tty</div>
          <div class="ref-comment"># 列出可用的 shell</div>
          <div class="ref-cmd">cat /etc/shells</div>
          <div class="ref-comment"># 将默认 shell 改为 zsh</div>
          <div class="ref-cmd">chsh -s /bin/zsh</div>
        </div>
      </TerminalWindow>
    </div>
  </div>
</template>

<style scoped>
.vocab-demo {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Glossary */
.glossary-panel {
  display: flex;
  border: var(--sr-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--sr-c-bg-section);
}

@media (max-width: 768px) {
  .glossary-panel {
    flex-direction: column;
  }
}

.glossary-list {
  padding: 16px;
  border-right: var(--sr-border);
  width: 50%;
}

@media (max-width: 768px) {
  .glossary-list {
    width: 100%;
    border-right: none;
    border-bottom: var(--sr-border);
  }
}

.glossary-list-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 320px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 14px;
}

.glossary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  cursor: default;
  border-left: 2px solid transparent;
  transition: all 0.15s ease;
}

.glossary-item.active {
  background: rgba(255, 255, 255, 0.05);
  border-left-color: #e5e5e5;
}

.glossary-cat {
  font-size: 11px;
  text-transform: uppercase;
  width: 48px;
  flex-shrink: 0;
}

.glossary-name {
  color: #e5e5e5;
}

.glossary-detail {
  padding: 16px;
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 768px) {
  .glossary-detail {
    width: 100%;
  }
}

.detail-category {
  font-size: 11px;
  text-transform: uppercase;
}

.detail-name {
  color: #e5e5e5;
  font-size: 16px;
  font-weight: 600;
  margin-top: 4px;
}

.detail-aka {
  color: #737373;
  font-size: 12px;
}

.detail-def {
  color: #737373;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.detail-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-examples-label {
  color: #737373;
  font-size: 11px;
  text-transform: uppercase;
}

.detail-examples-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-tag {
  padding: 4px 8px;
  background: #0a0a0a;
  border: 1px solid #333;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
}

/* Architecture Diagram */
.arch-panel {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 24px;
}

.arch-title {
  font-size: 14px;
  font-weight: 600;
  color: #e5e5e5;
  margin-bottom: 24px;
}

.arch-layers {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 13px;
}

.arch-layer {
  padding: 16px;
  transition: all 0.2s ease;
}

.layer-blue {
  border: 2px solid rgba(59, 130, 246, 0.4);
}

.layer-blue.highlighted {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.layer-yellow {
  border: 2px solid rgba(234, 179, 8, 0.4);
}

.layer-yellow.highlighted {
  border-color: #eab308;
  background: rgba(234, 179, 8, 0.05);
}

.layer-green {
  border: 2px solid rgba(34, 197, 94, 0.4);
}

.layer-green.highlighted {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.layer-magenta {
  border: 2px solid rgba(168, 85, 247, 0.4);
}

.layer-magenta.highlighted {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.05);
}

.layer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.layer-label {
  font-weight: 600;
}

.layer-examples {
  color: #737373;
  font-size: 12px;
}

.arch-note {
  margin-top: 16px;
  padding-top: 16px;
  border-top: var(--sr-border);
  font-size: 12px;
  color: #737373;
}

.arch-note-highlight {
  color: #e5e5e5;
}

/* Landscape panels (Shell, Terminal, Flow, Confusions, Quick Ref) */
.landscape-panel {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.landscape-title {
  font-size: 14px;
  font-weight: 600;
  color: #e5e5e5;
}

.landscape-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.landscape-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.landscape-name {
  font-weight: 600;
}

.landscape-year {
  color: #525252;
  font-size: 13px;
  margin-left: 8px;
}

.landscape-desc {
  color: #737373;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.landscape-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  font-size: 13px;
}

.meta-label {
  color: #525252;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.meta-value {
  color: #e5e5e5;
  font-size: 12px;
}

.meta-value.mono {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  color: #06b6d4;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.feature-tag {
  padding: 4px 8px;
  background: #0a0a0a;
  border: 1px solid #333;
  color: #e5e5e5;
  font-size: 12px;
}

/* Command Flow */
.flow-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flow-steps-row {
  display: flex;
  gap: 4px;
}

.flow-step-dot {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #333;
  background: transparent;
  color: #737373;
  font-size: 12px;
  font-family: inherit;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.flow-step-dot:hover {
  color: #e5e5e5;
  border-color: #525252;
}

.flow-step-dot.active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.flow-box {
  background: #0a0a0a;
  border: 1px solid #333;
  padding: 16px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flow-step-label {
  color: #06b6d4;
  font-size: 14px;
  font-weight: 600;
}

.flow-step-content {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  color: #22c55e;
  font-size: 14px;
}

.flow-step-desc {
  color: #737373;
  font-size: 13px;
}

/* Common Confusions */
.confusions-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.confusion-card {
  padding: 16px;
  background: var(--sr-c-bg-section);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confusion-q {
  color: #e5e5e5;
  font-weight: 600;
  font-size: 14px;
}

.confusion-a {
  color: #737373;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

/* Quick Reference */
.quick-ref {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ref-comment {
  color: #737373;
  margin-top: 8px;
}

.ref-comment:first-child {
  margin-top: 0;
}

.ref-cmd {
  color: #22c55e;
}
</style>
