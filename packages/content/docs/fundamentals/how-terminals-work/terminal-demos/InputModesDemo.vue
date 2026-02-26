<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import StepNavigation from "./shared/StepNavigation.vue";

type Mode = "cooked" | "raw";

const EXPLAINER_STEPS = {
  cooked: {
    title: "Cooked 模式（行缓冲）",
    description:
      "在 cooked 模式（也称规范模式）下，终端将输入收集到行缓冲区中。你可以用退格键编辑，直到按下回车才会发送给程序。这就是 shell 通常的工作方式。",
  },
  raw: {
    title: "Raw 模式（逐字符）",
    description:
      "在 raw 模式下，每次按键都会立即发送给程序，没有缓冲，没有行编辑。程序在你按下的瞬间就看到每个键。vim、htop 等交互式程序就是这样工作的。",
  },
  difference: {
    title: "为什么有两种模式？",
    description:
      "你的终端总是发送相同的字节，区别在于操作系统内核如何处理它们。在 cooked 模式下，内核的行规程缓冲输入并处理编辑。在 raw 模式下，字节直接传给程序。这让简单程序无需自己实现就能获得行编辑能力，而复杂的 TUI 则能获得完全控制。\n程序通过系统调用告诉内核切换模式，比如 vim 启动时会请求 raw 模式，退出后恢复为 cooked 模式。",
  },
  examples: {
    title: "实际例子",
    description:
      "Shell（bash/zsh）使用 cooked 模式，输入、编辑，然后按回车。\nVim 使用 raw 模式，按 j 就立刻向下移动。\nSSH 使用 raw 模式来转发按键。\nCtrl+C 的行为也不同：在 cooked 模式下，行规程生成 SIGINT；在 raw 模式下，字节直接到达程序。",
  },
};

type ExplainerStep = keyof typeof EXPLAINER_STEPS;

const COMPARISON_ROWS = [
  { label: "输入何时发送", cooked: "按回车后", raw: "立即逐键" },
  { label: "退格键", cooked: "从缓冲区删除", raw: "只是另一个键" },
  { label: "Ctrl+C", cooked: "行规程生成 SIGINT", raw: "程序收到 0x03" },
  { label: "方向键", cooked: "行回溯（历史）", raw: "程序自行处理" },
  { label: "使用者", cooked: "bash, zsh, cat", raw: "vim, htop, ssh, less" },
];

const mode = ref<Mode>("cooked");
const cookedBuffer = ref("");
const cookedHistory = ref<string[]>([]);
const rawKeys = ref<string[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);
const currentStep = ref<ExplainerStep>("cooked");

const steps = Object.keys(EXPLAINER_STEPS) as ExplainerStep[];
const stepContent = computed(() => EXPLAINER_STEPS[currentStep.value]);

function focusInput() {
  inputRef.value?.focus();
}

function handleCookedInput(e: Event) {
  const target = e.target as HTMLInputElement;
  cookedBuffer.value = target.value;
}

function handleCookedKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    if (cookedBuffer.value.length > 0) {
      cookedHistory.value = [...cookedHistory.value, cookedBuffer.value];
      cookedBuffer.value = "";
      const el = inputRef.value;
      if (el) el.value = "";
    }
  }
}

function displayKeyName(key: string): string {
  const map: Record<string, string> = {
    " ": "Space",
    Enter: "Enter",
    Backspace: "BS",
    Tab: "Tab",
    Escape: "Esc",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Shift: "Shift",
    Control: "Ctrl",
    Alt: "Alt",
    Meta: "Meta",
    CapsLock: "Caps",
  };
  return map[key] ?? key;
}

function handleRawKeydown(e: KeyboardEvent) {
  e.preventDefault();
  const name = displayKeyName(e.key);
  rawKeys.value = [...rawKeys.value, name].slice(-12);
}

function clearTerminal() {
  cookedBuffer.value = "";
  cookedHistory.value = [];
  rawKeys.value = [];
  const el = inputRef.value;
  if (el) el.value = "";
}

function switchMode(m: Mode) {
  clearTerminal();
  mode.value = m;
}
</script>

<template>
  <div class="input-modes-demo">
    <!-- Mode Toggle -->
    <div class="mode-toggle">
      <span class="mode-label">输入模式：</span>
      <div class="mode-buttons">
        <TButton
          variant="toggle"
          :active="mode === 'cooked'"
          @click="switchMode('cooked')"
        >
          Cooked（行缓冲）
        </TButton>
        <TButton
          variant="toggle"
          :active="mode === 'raw'"
          @click="switchMode('raw')"
        >
          Raw（立即）
        </TButton>
      </div>
    </div>

    <!-- Two-column layout: Terminal + What's Happening -->
    <div class="main-grid">
      <!-- Left: Terminal Simulation -->
      <div class="terminal-col">
        <div class="subsection-label">
          {{ mode === "cooked" ? "输入、编辑，然后回车" : "每个按键立即发送" }}
        </div>
        <TerminalWindow>
          <div class="terminal-area" @click="focusInput">
            <input
              ref="inputRef"
              type="text"
              class="hidden-input"
              @input="mode === 'cooked' ? handleCookedInput($event) : undefined"
              @keydown="
                mode === 'cooked'
                  ? handleCookedKeydown($event)
                  : handleRawKeydown($event)
              "
            />

            <!-- Cooked Mode Display -->
            <div v-if="mode === 'cooked'" class="cooked-display">
              <div
                v-for="(line, idx) in cookedHistory"
                :key="idx"
                class="cooked-line"
              >
                <span class="prompt">$</span>
                <span class="line-text">{{ line }}</span>
              </div>
              <div class="cooked-input-line">
                <span class="prompt">$</span>
                <span class="line-text">{{ cookedBuffer }}</span>
                <span class="cursor-blink">█</span>
              </div>
            </div>

            <!-- Raw Mode Display -->
            <div v-if="mode === 'raw'" class="raw-display">
              <div class="raw-keys">
                <span
                  v-for="(k, idx) in rawKeys"
                  :key="idx"
                  class="raw-key-badge"
                  :class="{ 'raw-key-latest': idx === rawKeys.length - 1 }"
                  :style="{ opacity: 0.5 + (idx / rawKeys.length) * 0.5 }"
                >
                  {{ k }}
                </span>
                <span v-if="rawKeys.length === 0" class="hint-text">
                  开始输入...
                </span>
              </div>
              <div class="raw-hint">点击此处开始输入，每个按键立即显示。</div>
            </div>
          </div>
        </TerminalWindow>
        <TButton @click="clearTerminal">清除</TButton>
      </div>

      <!-- Right: What's Happening -->
      <div class="happening-col">
        <div class="subsection-label">发生了什么</div>
        <div class="happening-panel">
          <!-- Cooked Mode Steps -->
          <template v-if="mode === 'cooked'">
            <div class="happening-mode-header">
              <span class="mode-name-green">Cooked 模式</span>
              <span class="mode-alias">（canonical）</span>
            </div>
            <div class="happening-steps">
              <div class="step-row">
                <span class="step-num">1</span>
                <span class="step-text">
                  你输入字符。内核的
                  <span class="hl-yellow">行规程</span>
                  缓冲它们。
                </span>
              </div>
              <div class="step-row">
                <span class="step-num">2</span>
                <span class="step-text">
                  <span class="hl-yellow">退格键</span
                  >：行规程从缓冲区中删除一个字符。
                </span>
              </div>
              <div class="step-row">
                <span class="step-num">3</span>
                <span class="step-text">
                  <span class="hl-yellow">回车</span>
                  将整行发送给程序。
                </span>
              </div>
              <div class="step-row">
                <span class="step-num">4</span>
                <span class="step-text">
                  程序收到：
                  <code class="code-green"
                    >"{{ cookedBuffer || "..." }}\n"</code
                  >
                </span>
              </div>
            </div>
          </template>

          <!-- Raw Mode Steps -->
          <template v-else>
            <div class="happening-mode-header">
              <span class="mode-name-red">Raw 模式</span>
              <span class="mode-alias">（non-canonical）</span>
            </div>
            <div class="happening-steps">
              <div class="step-row">
                <span class="step-num">1</span>
                <span class="step-text">
                  你按下一个键。它被
                  <span class="hl-yellow">立即</span>
                  发送。
                </span>
              </div>
              <div class="step-row">
                <span class="step-num">2</span>
                <span class="step-text">
                  <span class="hl-yellow">没有缓冲</span>，行规程直接传递字节。
                </span>
              </div>
              <div class="step-row">
                <span class="step-num">3</span>
                <span class="step-text">
                  <span class="hl-yellow">退格键</span>
                  只是程序收到的另一个键。
                </span>
              </div>
              <div class="step-row">
                <span class="step-num">4</span>
                <span class="step-text">
                  程序处理一切：光标、显示、编辑。
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Explainer -->
    <InfoPanel>
      <div class="explainer-header">
        <div class="explainer-title">{{ stepContent.title }}</div>
        <StepNavigation
          :steps="steps"
          :current-step="currentStep"
          @update:current-step="currentStep = $event as ExplainerStep"
        />
      </div>
      <p class="explainer-desc">{{ stepContent.description }}</p>
    </InfoPanel>

    <!-- Comparison Table -->
    <div class="comparison">
      <h3 class="comparison-title">Cooked vs Raw 对比</h3>
      <div class="comparison-table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th class="th-label">行为</th>
              <th class="th-cooked">Cooked</th>
              <th class="th-raw">Raw</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in COMPARISON_ROWS" :key="row.label">
              <td class="td-label">{{ row.label }}</td>
              <td class="td-cooked">{{ row.cooked }}</td>
              <td class="td-raw">{{ row.raw }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-modes-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Mode Toggle */
.mode-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--sr-c-small-text);
}

.mode-buttons {
  display: inline-flex;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.terminal-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.happening-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subsection-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sr-c-small-text-muted);
}

/* Terminal Area */
.terminal-area {
  min-height: 200px;
  cursor: text;
  position: relative;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 13px;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* Cooked Mode */
.cooked-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cooked-line {
  display: flex;
  color: var(--sr-c-small-text-muted);
}

.cooked-input-line {
  display: flex;
  align-items: center;
}

.prompt {
  color: #22c55e;
  user-select: none;
  flex-shrink: 0;
}

.line-text {
  color: #e5e5e5;
  white-space: pre-wrap;
  word-break: break-all;
  margin-left: 8px;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
  color: #e5e5e5;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Raw Mode */
.raw-display {
  display: flex;
  flex-direction: column;
}

.raw-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 60px;
}

.raw-key-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
  color: #e5e5e5;
  background: var(--sr-c-bg-section);
  border: 1px solid var(--sr-c-bg-hover, #333);
  border-radius: 0;
  white-space: nowrap;
}

.raw-key-latest {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
}

.hint-text {
  color: #525252;
  font-size: 12px;
}

.raw-hint {
  color: #525252;
  font-size: 12px;
  margin-top: 16px;
}

/* What's Happening Panel */
.happening-panel {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.happening-mode-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-name-green {
  color: #22c55e;
  font-weight: 700;
  font-size: 14px;
}

.mode-name-red {
  color: #ef4444;
  font-weight: 700;
  font-size: 14px;
}

.mode-alias {
  color: var(--sr-c-small-text-muted);
  font-size: 12px;
}

.happening-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  color: var(--sr-c-small-text-muted);
}

.hl-yellow {
  color: #eab308;
}

.code-green {
  color: #22c55e;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

/* Explainer */
.explainer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.explainer-title {
  font-weight: 500;
  font-size: 14px;
  color: #22c55e;
}

.explainer-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 10px 0 0;
  white-space: pre-line;
}

/* Comparison Table */
.comparison {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.comparison-title {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
  margin: 0;
}

.comparison-table-wrap {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.comparison-table th,
.comparison-table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--sr-c-bg-hover, #262626);
}

.comparison-table thead tr {
  border-bottom: 2px solid var(--sr-c-bg-hover, #262626);
}

.th-label {
  color: var(--sr-c-small-text-muted);
  font-weight: 500;
  width: 30%;
}

.th-cooked {
  color: #22c55e;
  font-weight: 600;
}

.th-raw {
  color: #06b6d4;
  font-weight: 600;
}

.td-label {
  color: var(--sr-c-small-text);
  font-weight: 500;
}

.td-cooked {
  color: var(--sr-c-small-text-muted);
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.td-raw {
  color: var(--sr-c-small-text-muted);
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}
</style>
