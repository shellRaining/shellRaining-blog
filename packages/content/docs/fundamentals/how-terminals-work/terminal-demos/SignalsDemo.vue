<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import StepNavigation from "./shared/StepNavigation.vue";

type Signal = "SIGINT" | "SIGTSTP";

interface SignalInfo {
  key: string;
  signal: Signal;
  name: string;
  action: string;
  description: string;
  example: string;
}

const SIGNALS: SignalInfo[] = [
  {
    key: "Ctrl+C",
    signal: "SIGINT",
    name: "中断",
    action: "停止正在运行的程序",
    description:
      "发送 SIGINT（中断信号）给前台进程。大多数程序会立即停止。这就是你取消一个长时间运行的命令或退出卡住程序的方式。",
    example: "运行 `sleep 100` 然后按 Ctrl+C 会立即停止它。",
  },
  {
    key: "Ctrl+Z",
    signal: "SIGTSTP",
    name: "挂起",
    action: "暂停并移到后台",
    description:
      "发送 SIGTSTP（终端停止信号）来挂起进程。程序会暂停但保留在内存中。使用 `fg` 在前台恢复它，或用 `bg` 让它在后台继续运行。",
    example: "用 Ctrl+Z 挂起 vim，执行其他命令，然后输入 `fg` 返回。",
  },
];

const EXPLAINER_STEPS = {
  what: {
    title: "什么是信号？",
    description:
      "信号是操作系统与运行中的程序通信的方式。当你按下 Ctrl+C 时，终端会发送一个字节（0x03）到 PTY，但内核会拦截它，在程序接收到之前将其转换为信号。",
  },
  how: {
    title: "行规程",
    description:
      "内核的 PTY 有一个叫做行规程（line discipline）的组件。它检查每个通过的字节。当它看到 0x03（Ctrl+C）且信号处理已启用时，它会生成 SIGINT 而不是把字节传给程序。这发生在内核中，不是在终端模拟器中。",
  },
  path: {
    title: "信号路径",
    description: "当你按下 Ctrl+C 时：",
  },
  handling: {
    title: "信号处理",
    description:
      "程序可以选择如何处理信号。有些会忽略 Ctrl+C（比如 vim 在某些操作中）。有些会捕获它以便在退出前做清理。有些（比如 sleep）直接终止。默认行为是终止进程。",
  },
};

type ExplainerStep = keyof typeof EXPLAINER_STEPS;

const SIGNAL_PATH_STEPS = [
  "终端发送字节 0x03 到 PTY 主端。",
  "内核行规程拦截它。",
  "不转发字节，而是向前台进程组发送 SIGINT。",
  "进程处理信号或终止。",
];

const selectedSignal = ref<SignalInfo>(SIGNALS[0]);
const terminalState = ref<"idle" | "running" | "interrupted" | "suspended">(
  "idle",
);
const output = ref<string[]>(["$ "]);
const currentStep = ref<ExplainerStep>("what");

const steps = Object.keys(EXPLAINER_STEPS) as ExplainerStep[];
const stepContent = computed(() => EXPLAINER_STEPS[currentStep.value]);

function simulateCommand() {
  terminalState.value = "running";
  output.value = ["$ sleep 100", "sleeping..."];
}

function applySignalEffect(signal: Signal) {
  if (signal === "SIGINT") {
    terminalState.value = "interrupted";
    output.value = [...output.value, "^C", "$ "];
  } else {
    terminalState.value = "suspended";
    output.value = [
      ...output.value,
      "^Z",
      "[1]+  Stopped                 sleep 100",
      "$ ",
    ];
  }
}

function simulateSignal(signal: Signal) {
  if (terminalState.value !== "running") {
    simulateCommand();
    setTimeout(() => applySignalEffect(signal), 500);
  } else {
    applySignalEffect(signal);
  }
}

function resetTerminal() {
  terminalState.value = "idle";
  output.value = ["$ "];
}
</script>

<template>
  <div class="signals-demo">
    <!-- Signal Glossary -->
    <div class="glossary">
      <div class="glossary-list">
        <div
          v-for="sig in SIGNALS"
          :key="sig.key"
          :class="['glossary-item', { active: selectedSignal.key === sig.key }]"
          @mouseenter="selectedSignal = sig"
        >
          <div class="glossary-left">
            <code class="val-yellow">{{ sig.key }}</code>
            <span class="fg-text">{{ sig.name }}</span>
          </div>
          <span class="val-cyan">{{ sig.signal }}</span>
        </div>
      </div>

      <div class="glossary-detail">
        <div>
          <div class="detail-header">
            <code class="val-yellow">{{ selectedSignal.key }}</code>
            <span class="dim">→</span>
            <span class="val-green">{{ selectedSignal.signal }}</span>
          </div>
          <p class="detail-action">{{ selectedSignal.action }}</p>
        </div>
        <p class="detail-desc">{{ selectedSignal.description }}</p>
        <div class="detail-example">
          <span class="dim">示例: </span>
          <span class="fg-text">{{ selectedSignal.example }}</span>
        </div>
      </div>
    </div>

    <!-- Interactive Terminal -->
    <div class="try-section">
      <div class="control-label">试一试</div>
      <div class="try-layout">
        <TerminalWindow>
          <div class="term-output">
            <div
              v-for="(line, idx) in output"
              :key="idx"
              :class="{ 'line-signal': line.startsWith('^') }"
            >
              {{ line
              }}<span
                v-if="
                  idx === output.length - 1 &&
                  (terminalState === 'idle' || terminalState === 'running')
                "
                class="cursor-blink"
                >█</span
              >
            </div>
          </div>
        </TerminalWindow>

        <div class="try-controls">
          <div class="try-btns">
            <TButton
              @click="simulateCommand"
              :disabled="terminalState === 'running'"
            >
              运行命令
            </TButton>
            <TButton @click="simulateSignal('SIGINT')">Ctrl+C</TButton>
            <TButton @click="simulateSignal('SIGTSTP')">Ctrl+Z</TButton>
            <TButton @click="resetTerminal">重置</TButton>
          </div>

          <div
            v-if="terminalState === 'interrupted'"
            class="state-msg state-red"
          >
            进程被中断（已终止）
          </div>
          <div
            v-else-if="terminalState === 'suspended'"
            class="state-msg state-yellow"
          >
            进程已挂起（使用 `fg` 恢复）
          </div>

          <p class="dim try-hint">
            点击"运行命令"启动模拟进程，然后尝试发送不同的信号。
          </p>
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
      <p class="detail-desc" style="margin-top: 10px; white-space: pre-line">
        {{ stepContent.description }}
      </p>
      <div v-if="currentStep === 'path'" class="step-sequence">
        <div v-for="(s, idx) in SIGNAL_PATH_STEPS" :key="idx" class="step-item">
          <span class="step-num">{{ idx + 1 }}</span>
          <span class="step-label">{{ s }}</span>
        </div>
      </div>
    </InfoPanel>

    <!-- Signals vs Regular Keys -->
    <div class="comparison">
      <h3 class="comparison-title">信号键 vs 普通键</h3>
      <div class="comparison-grid">
        <div class="comparison-box">
          <div class="comparison-box-title">普通键</div>
          <div class="comparison-rows">
            <div>
              <span class="val-yellow">a</span>
              <span class="dim"> → </span>
              <span class="val-cyan">0x61</span>
              <span class="dim"> (字符发送给程序)</span>
            </div>
            <div>
              <span class="val-yellow">Enter</span>
              <span class="dim"> → </span>
              <span class="val-cyan">0x0D</span>
              <span class="dim"> (回车)</span>
            </div>
            <div>
              <span class="val-yellow">↑</span>
              <span class="dim"> → </span>
              <span class="val-cyan">^[[A</span>
              <span class="dim"> (转义序列)</span>
            </div>
          </div>
        </div>

        <div class="comparison-box">
          <div class="comparison-box-title">信号键</div>
          <div class="comparison-rows">
            <div>
              <span class="val-yellow">Ctrl+C</span>
              <span class="dim"> → </span>
              <span class="val-cyan">0x03</span>
              <span class="dim"> → </span>
              <span class="val-red">SIGINT</span>
            </div>
            <div>
              <span class="val-yellow">Ctrl+Z</span>
              <span class="dim"> → </span>
              <span class="val-cyan">0x1A</span>
              <span class="dim"> → </span>
              <span class="val-red">SIGTSTP</span>
            </div>
            <div class="dim" style="font-size: 11px; margin-top: 6px">
              字节被行规程拦截 → 转换为信号
            </div>
          </div>
        </div>
      </div>

      <p class="dim comparison-footer">
        普通键变成字节，通过 PTY
        流向程序。信号键也变成字节，但内核的行规程会在字节到达程序之前拦截它们并生成操作系统信号。
      </p>
    </div>
  </div>
</template>

<style scoped>
.signals-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Glossary */
.glossary {
  display: flex;
  flex-direction: column;
  border: var(--sr-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--sr-c-bg-section);
}

@media (min-width: 1024px) {
  .glossary {
    flex-direction: row;
  }
}

.glossary-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
}

@media (min-width: 1024px) {
  .glossary-list {
    width: 50%;
    border-right: var(--sr-border);
  }
}

.glossary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: default;
  border-left: 2px solid transparent;
  transition: all 0.15s;
  border-radius: 4px;
}

.glossary-item.active {
  background: var(--sr-c-bg-hover);
  border-left-color: var(--sr-c-small-text-hover);
}

.glossary-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.glossary-detail {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: var(--sr-border);
}

@media (min-width: 1024px) {
  .glossary-detail {
    width: 50%;
    border-top: none;
  }
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}

.detail-action {
  font-size: 12px;
  color: var(--sr-c-small-text-muted);
  margin: 2px 0 0;
}

.detail-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 0;
}

/* Step sequence */
.step-sequence {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
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

.step-label {
  color: var(--sr-c-small-text-muted);
}

.detail-example {
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 13px;
  color: #e5e5e5;
}

/* Try section */
.try-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--sr-c-small-text-muted);
  letter-spacing: 0.05em;
}

.try-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 1024px) {
  .try-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.term-output {
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
  min-height: 180px;
  color: #e5e5e5;
}

.line-signal {
  color: #f85149;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
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

.try-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.try-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.try-hint {
  font-size: 13px;
  margin: 0;
}

.state-msg {
  font-size: 13px;
}

.state-red {
  color: #f85149;
}

.state-yellow {
  color: #eab308;
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
  color: #f85149;
}

/* Comparison */
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
  color: #f85149;
  margin: 0;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 768px) {
  .comparison-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.comparison-box {
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comparison-box-title {
  font-weight: 600;
  font-size: 13px;
  color: #e5e5e5;
}

.comparison-rows {
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #e5e5e5;
}

.comparison-footer {
  font-size: 13px;
  margin: 0;
}

/* Shared */
.val-yellow {
  color: #eab308;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.val-cyan {
  color: #06b6d4;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.val-green {
  color: #22c55e;
  font-weight: 600;
}

.val-red {
  color: #f85149;
}

.fg-text {
  color: var(--sr-c-small-text);
}

.dim {
  color: var(--sr-c-small-text-muted);
}
</style>
