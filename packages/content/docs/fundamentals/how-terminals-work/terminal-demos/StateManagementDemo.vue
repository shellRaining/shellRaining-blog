<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import StepNavigation from "./shared/StepNavigation.vue";

type Mode = "accept" | "plan" | "chat";

interface ModeConfig {
  indicator: string;
  name: string;
  color: string;
}

const MODES: Record<Mode, ModeConfig> = {
  accept: { indicator: ">>", name: "accept edits on", color: "#a855f7" },
  plan: { indicator: "??", name: "plan mode", color: "#eab308" },
  chat: { indicator: "~~", name: "chat mode", color: "#06b6d4" },
};

const MODE_ORDER: Mode[] = ["accept", "plan", "chat"];

interface HistoryEntry {
  mode: Mode;
  text: string;
}

const EXPLAINER_STEPS = {
  overview: {
    title: "终端应用中的状态",
    description:
      "终端应用像 GUI 应用一样在内存中维护状态。区别在于显示方式：通过在特定位置打印字符。状态变化时，重绘屏幕的相关部分。",
  },
  memory: {
    title: "状态存储在哪",
    description:
      "应用在内存中保存变量：currentMode、inputBuffer、history 等。终端本身不存储应用状态，它只显示你发送的字符。",
  },
  rendering: {
    title: "渲染状态变化",
    description: "当状态发生变化时，应用会：",
  },
  "input-handling": {
    title: "输入触发状态变化",
    description:
      "Shift+Tab 这样的组合键只是字节序列。应用接收字节，识别按键，更新内部状态，重新渲染。终端对应用状态一无所知，只是传递字节。",
  },
  persistence: {
    title: "持久化与会话",
    description:
      "终端应用可以将状态保存到文件，但退出时会丢失内存状态。有些应用使用备用屏幕缓冲区，退出时恢复原始屏幕内容。",
  },
} as const;

type ExplainerStep = keyof typeof EXPLAINER_STEPS;

const RENDERING_STEPS = [
  "更新内存中的变量",
  "移动光标到指示器位置",
  "清除该区域",
  "用相应颜色打印新指示器",
];

const currentMode = ref<Mode>("accept");
const inputBuffer = ref("");
const history = ref<HistoryEntry[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);
const showInspector = ref(false);
const currentStep = ref<ExplainerStep>("overview");

const steps = Object.keys(EXPLAINER_STEPS) as ExplainerStep[];
const stepContent = computed(() => EXPLAINER_STEPS[currentStep.value]);
const modeConfig = computed(() => MODES[currentMode.value]);

function cycleMode() {
  const idx = MODE_ORDER.indexOf(currentMode.value);
  currentMode.value = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
}

function focusInput() {
  inputRef.value?.focus();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Tab" && e.shiftKey) {
    e.preventDefault();
    cycleMode();
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    if (inputBuffer.value.length > 0) {
      history.value = [
        ...history.value.slice(-4),
        { mode: currentMode.value, text: inputBuffer.value },
      ];
      inputBuffer.value = "";
    }
    return;
  }
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  inputBuffer.value = target.value;
}
</script>

<template>
  <div class="state-demo">
    <!-- Interactive Terminal -->
    <TerminalWindow>
      <div class="terminal-area" @click="focusInput">
        <input
          ref="inputRef"
          type="text"
          class="hidden-input"
          :value="inputBuffer"
          @input="handleInput"
          @keydown="handleKeydown"
        />

        <!-- History -->
        <div v-for="(entry, idx) in history" :key="idx" class="history-line">
          <span
            class="history-indicator"
            :style="{ color: MODES[entry.mode].color }"
            >{{ MODES[entry.mode].indicator }}</span
          >
          <span class="history-text">{{ entry.text }}</span>
        </div>

        <!-- Current prompt -->
        <div class="prompt-line">
          <span class="prompt">&gt; </span>
          <span class="input-text">{{ inputBuffer }}</span>
          <span class="cursor-blink">█</span>
        </div>

        <!-- Mode indicator -->
        <div class="mode-line">
          <span class="mode-indicator" :style="{ color: modeConfig.color }">{{
            modeConfig.indicator
          }}</span>
          <span class="mode-name" :style="{ color: modeConfig.color }">{{
            modeConfig.name
          }}</span>
          <span class="mode-hint">(shift+tab 切换)</span>
        </div>

        <div
          v-if="history.length === 0 && inputBuffer.length === 0"
          class="hint-text"
        >
          点击此处开始输入，按 Shift+Tab 切换模式
        </div>
      </div>
    </TerminalWindow>

    <!-- Controls -->
    <div class="controls">
      <TButton @click="cycleMode">切换模式 (Shift+Tab)</TButton>
      <TButton @click="showInspector = !showInspector">
        {{ showInspector ? "隐藏状态检查器" : "显示状态检查器" }}
      </TButton>
    </div>

    <!-- State Inspector -->
    <div v-if="showInspector" class="inspector">
      <div class="inspector-col">
        <div class="inspector-label">状态变量</div>
        <div class="inspector-code">
          <div class="code-comment">// 当前状态变量</div>
          <div>
            <span class="code-cyan">currentMode</span>:
            <span :style="{ color: modeConfig.color }"
              >"{{ currentMode }}"</span
            >
          </div>
          <div>
            <span class="code-cyan">inputBuffer</span>:
            <span class="code-green">"{{ inputBuffer }}"</span>
          </div>
          <div>
            <span class="code-cyan">historyLength</span>:
            <span class="code-yellow">{{ history.length }}</span>
          </div>
        </div>
      </div>
      <div class="inspector-col">
        <div class="inspector-label">渲染输出</div>
        <div class="inspector-code">
          <div class="code-comment">// 模式指示器的渲染输出</div>
          <div><span class="code-magenta">moveCursor</span>(3, 1);</div>
          <div>
            <span class="code-magenta">setColor</span>(<span
              :style="{ color: modeConfig.color }"
              >{{
                currentMode === "accept"
                  ? "MAGENTA"
                  : currentMode === "plan"
                    ? "YELLOW"
                    : "CYAN"
              }}</span
            >);
          </div>
          <div>
            <span class="code-magenta">print</span>("{{ modeConfig.indicator }}
            {{ modeConfig.name }}");
          </div>
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

      <!-- memory step -->
      <div v-if="currentStep === 'memory'" class="explainer-code">
        <div class="code-comment">// App's internal state (in memory)</div>
        <div><span class="code-cyan">struct</span> AppState {</div>
        <div class="code-indent">
          <span class="code-yellow">current_mode</span>: Mode,
        </div>
        <div class="code-indent">
          <span class="code-yellow">input_buffer</span>: String,
        </div>
        <div class="code-indent">
          <span class="code-yellow">history</span>: Vec&lt;Entry&gt;,
        </div>
        <div class="code-indent">
          <span class="code-yellow">cursor_pos</span>: (u16, u16),
        </div>
        <div>}</div>
      </div>

      <!-- rendering step -->
      <template v-if="currentStep === 'rendering'">
        <div class="step-sequence">
          <div v-for="(s, idx) in RENDERING_STEPS" :key="idx" class="step-item">
            <span class="step-num">{{ idx + 1 }}</span>
            <span class="step-label">{{ s }}</span>
          </div>
        </div>
        <div class="explainer-code">
          <div class="code-comment">// On mode change:</div>
          <div><span class="code-cyan">state.mode</span> = new_mode;</div>
          <div>
            <span class="code-green">print!("\x1b[3;1H")</span>;
            <span class="code-comment">// move to line 3</span>
          </div>
          <div>
            <span class="code-green">print!("\x1b[2K")</span>;
            <span class="code-comment">// clear line</span>
          </div>
          <div>
            <span class="code-green">print!("\x1b[35m")</span>;
            <span class="code-comment">// set color</span>
          </div>
          <div>
            <span class="code-green">print!(">> accept edits on")</span>;
          </div>
        </div>
      </template>

      <!-- input-handling step -->
      <div v-if="currentStep === 'input-handling'" class="explainer-code">
        <div class="code-comment">// Shift+Tab byte sequence</div>
        <div>
          Bytes received:
          <span class="code-yellow">1b 5b 5a</span>
        </div>
        <div>
          Sequence:
          <span class="code-cyan">ESC [ Z</span> (CSI Z = Shift+Tab)
        </div>
        <div class="code-comment" style="margin-top: 8px">
          // App's key handler:
        </div>
        <div><span class="code-magenta">match</span> key {</div>
        <div class="code-indent">
          ShiftTab =&gt; <span class="code-cyan">cycle_mode()</span>,
        </div>
        <div class="code-indent">
          Enter =&gt; <span class="code-cyan">submit_input()</span>,
        </div>
        <div class="code-indent">
          _ =&gt; <span class="code-cyan">append_to_buffer(key)</span>,
        </div>
        <div>}</div>
      </div>

      <!-- persistence step -->
      <div v-if="currentStep === 'persistence'" class="explainer-code">
        <div class="code-comment">// State persistence options</div>
        <div>
          <span class="code-green">~/.config/app/settings.json</span>
          <span class="code-comment"> — user preferences</span>
        </div>
        <div>
          <span class="code-green">~/.local/state/app/history</span>
          <span class="code-comment"> — command history</span>
        </div>
        <div>
          <span class="code-green">/tmp/app.sock</span>
          <span class="code-comment"> — inter-process state</span>
        </div>
        <div class="code-comment" style="margin-top: 8px">
          // But current mode? Just in memory.
        </div>
        <div class="code-comment">
          // When you restart, it resets to default.
        </div>
      </div>
    </InfoPanel>

    <!-- State Update Cycle -->
    <div class="cycle-section">
      <div class="cycle-title">状态更新循环</div>
      <div class="cycle-boxes">
        <div class="cycle-box">
          <div class="cycle-box-number">1</div>
          <div class="cycle-box-label">输入</div>
          <div class="cycle-box-desc">用户按下 Shift+Tab</div>
          <code class="cycle-box-code">ESC [ Z</code>
        </div>
        <div class="cycle-arrow">→</div>
        <div class="cycle-box">
          <div class="cycle-box-number">2</div>
          <div class="cycle-box-label">处理</div>
          <div class="cycle-box-desc">应用识别序列</div>
          <code class="cycle-box-code">mode = nextMode()</code>
        </div>
        <div class="cycle-arrow">→</div>
        <div class="cycle-box">
          <div class="cycle-box-number">3</div>
          <div class="cycle-box-label">渲染</div>
          <div class="cycle-box-desc">重绘模式指示器</div>
          <code class="cycle-box-code">print(indicator)</code>
        </div>
      </div>
      <p class="cycle-footer">
        终端从不"知道"模式。它只显示应用发送的字符。所有智能行为（跟踪状态、响应输入、决定绘制内容）都在应用中。
      </p>
    </div>
  </div>
</template>

<style scoped>
.state-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Terminal Area */
.terminal-area {
  min-height: 160px;
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

/* History */
.history-line {
  display: flex;
  gap: 8px;
  color: #525252;
}

.history-indicator {
  flex-shrink: 0;
  user-select: none;
}

.history-text {
  white-space: pre-wrap;
  word-break: break-all;
}

/* Current Prompt */
.prompt-line {
  display: flex;
  gap: 0;
  color: #e5e5e5;
  margin-top: 4px;
}

.prompt {
  color: #22c55e;
  user-select: none;
  flex-shrink: 0;
  margin-right: 4px;
}

.input-text {
  white-space: pre-wrap;
  word-break: break-all;
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

/* Mode indicator line */
.mode-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
}

.mode-indicator {
  font-weight: 600;
  flex-shrink: 0;
}

.mode-name {
  flex-shrink: 0;
}

.mode-hint {
  color: #525252;
  font-size: 11px;
  margin-left: 4px;
}

.hint-text {
  color: #525252;
  font-size: 13px;
  margin-top: 12px;
}

/* Controls */
.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* State Inspector */
.inspector {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  border: var(--sr-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--sr-c-bg-section);
}

@media (min-width: 768px) {
  .inspector {
    grid-template-columns: 1fr 1fr;
  }
}

.inspector-col {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .inspector-col:first-child {
    border-right: var(--sr-border);
  }
}

@media (max-width: 767px) {
  .inspector-col:first-child {
    border-bottom: var(--sr-border);
  }
}

.inspector-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--sr-c-small-text-muted);
  letter-spacing: 0.05em;
}

.inspector-code {
  margin: 0;
  padding: 10px 12px;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 4px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 2px;
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

.explainer-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 10px 0 0;
}

.explainer-code {
  margin: 10px 0 0;
  padding: 10px 12px;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 4px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.code-indent {
  padding-left: 16px;
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
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
}

.code-comment {
  color: #525252;
}

.code-cyan {
  color: #06b6d4;
}

.code-yellow {
  color: #eab308;
}

.code-green {
  color: #22c55e;
}

.code-magenta {
  color: #a855f7;
}

/* State Update Cycle */
.cycle-section {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cycle-title {
  font-size: 14px;
  font-weight: 600;
  color: #a855f7;
  margin: 0;
}

.cycle-boxes {
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow-x: auto;
}

@media (max-width: 600px) {
  .cycle-boxes {
    flex-direction: column;
    align-items: stretch;
  }

  .cycle-arrow {
    transform: rotate(90deg);
  }
}

.cycle-box {
  flex: 1;
  min-width: 0;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cycle-box-number {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #a855f7;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cycle-box-label {
  font-size: 13px;
  font-weight: 600;
  color: #e5e5e5;
}

.cycle-box-desc {
  font-size: 12px;
  color: #a3a3a3;
}

.cycle-box-code {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
  color: #eab308;
  margin-top: auto;
}

.cycle-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #525252;
  font-size: 18px;
  flex-shrink: 0;
  user-select: none;
}

.cycle-footer {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 0;
}
</style>
