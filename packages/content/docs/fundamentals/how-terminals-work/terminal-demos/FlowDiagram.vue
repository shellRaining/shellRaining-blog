<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";

type Phase =
  | "idle"
  | "keystroke"
  | "terminal-encode"
  | "pty-to-shell"
  | "shell-process"
  | "shell-output"
  | "pty-to-terminal"
  | "terminal-render"
  | "done";

type LayerId = "keyboard" | "terminal" | "pty" | "shell";

interface Step {
  phase: Phase;
  title: string;
  description: string;
  terminalContent: string[];
  highlight: LayerId | null;
  dataPacket?: string;
  dataDirection?: "down" | "up";
}

const STEPS: Step[] = [
  {
    phase: "idle",
    title: "就绪",
    description: "终端正在等待。光标闪烁。",
    terminalContent: ["$ \u258C"],
    highlight: null,
  },
  {
    phase: "keystroke",
    title: "你输入 'ls'",
    description: "每次按键是一个独立事件发送给终端。",
    terminalContent: ["$ ls\u258C"],
    highlight: "keyboard",
    dataPacket: "l s",
    dataDirection: "down",
  },
  {
    phase: "terminal-encode",
    title: "终端编码按键",
    description: "终端将按键转换为字节：'l' → 0x6C, 's' → 0x73",
    terminalContent: ["$ ls\u258C"],
    highlight: "terminal",
    dataPacket: "0x6C 0x73",
    dataDirection: "down",
  },
  {
    phase: "pty-to-shell",
    title: "PTY 转发给 Shell",
    description: "伪终端将字节通过管道传给 shell 进程（如 bash 或 zsh）。",
    terminalContent: ["$ ls\u258C"],
    highlight: "pty",
    dataPacket: "0x6C 0x73",
    dataDirection: "down",
  },
  {
    phase: "shell-process",
    title: "Shell 接收并回显",
    description: "Shell 读取 'ls'，回显它让你看到输入的内容，然后等待回车。",
    terminalContent: ["$ ls\u258C"],
    highlight: "shell",
  },
  {
    phase: "shell-output",
    title: "你按回车 → Shell 执行 'ls'",
    description: "Shell 执行 'ls'，列出文件。输出只是带有颜色转义码的文本。",
    terminalContent: [
      "$ ls",
      "\x1b[34mDocuments\x1b[0m  \x1b[34mDownloads\x1b[0m  \x1b[32mscript.sh\x1b[0m",
      "$ \u258C",
    ],
    highlight: "shell",
    dataPacket: "\\x1b[34mDocuments...",
    dataDirection: "up",
  },
  {
    phase: "pty-to-terminal",
    title: "输出通过 PTY 回传",
    description: "Shell 的输出通过 PTY 回传到终端。",
    terminalContent: [
      "$ ls",
      "\x1b[34mDocuments\x1b[0m  \x1b[34mDownloads\x1b[0m  \x1b[32mscript.sh\x1b[0m",
      "$ \u258C",
    ],
    highlight: "pty",
    dataPacket: "\\x1b[34mDocuments...",
    dataDirection: "up",
  },
  {
    phase: "terminal-render",
    title: "终端渲染输出",
    description: "终端解析转义序列（\\x1b[34m = 蓝色）并将彩色文本绘制到网格。",
    terminalContent: [
      "$ ls",
      "\x1b[34mDocuments\x1b[0m  \x1b[34mDownloads\x1b[0m  \x1b[32mscript.sh\x1b[0m",
      "$ \u258C",
    ],
    highlight: "terminal",
  },
  {
    phase: "done",
    title: "完成",
    description:
      "完整的往返：按键 → 编码 → Shell → 执行 → 输出 → 渲染。循环往复！",
    terminalContent: [
      "$ ls",
      "\x1b[34mDocuments\x1b[0m  \x1b[34mDownloads\x1b[0m  \x1b[32mscript.sh\x1b[0m",
      "$ \u258C",
    ],
    highlight: null,
  },
];

interface LayerDef {
  id: LayerId;
  icon: string;
  label: string;
  sub: string;
}

const LAYERS: LayerDef[] = [
  { id: "keyboard", icon: "kbd", label: "你（键盘）", sub: "物理按键" },
  {
    id: "terminal",
    icon: "tty",
    label: "终端模拟器",
    sub: "编码输入，渲染输出",
  },
  { id: "pty", icon: "pty", label: "PTY（伪终端）", sub: "双向管道" },
  {
    id: "shell",
    icon: "sh",
    label: "Shell / 程序",
    sub: "bash, zsh 或任意 CLI 程序",
  },
];

const PACKET_COLORS: Record<LayerId, string> = {
  keyboard: "#22c55e",
  terminal: "#eab308",
  pty: "#a855f7",
  shell: "#06b6d4",
};

const stepIndex = ref(0);
const isAnimating = ref(false);
let animTimer: ReturnType<typeof setTimeout> | undefined;

const currentStep = computed(() => STEPS[stepIndex.value]);

function startAnimation() {
  if (isAnimating.value) return;
  isAnimating.value = true;
  stepIndex.value = 0;
}

watch(
  [isAnimating, stepIndex],
  () => {
    clearTimeout(animTimer);
    if (!isAnimating.value) return;
    if (stepIndex.value >= STEPS.length - 1) {
      isAnimating.value = false;
      return;
    }
    animTimer = setTimeout(() => {
      stepIndex.value++;
    }, 1500);
  },
  { immediate: true },
);

onUnmounted(() => {
  clearTimeout(animTimer);
});

function goToStep(idx: number) {
  isAnimating.value = false;
  stepIndex.value = idx;
}

function prev() {
  goToStep(Math.max(0, stepIndex.value - 1));
}

function next() {
  goToStep(Math.min(STEPS.length - 1, stepIndex.value + 1));
}

// ANSI color code mapping
const ANSI_COLORS: Record<string, string> = {
  "30": "#000",
  "31": "#ef4444",
  "32": "#22c55e",
  "33": "#eab308",
  "34": "#3b82f6",
  "35": "#a855f7",
  "36": "#06b6d4",
  "37": "#e5e5e5",
};

interface Segment {
  text: string;
  color: string | null;
}

function parseAnsiLine(line: string): Segment[] {
  const segments: Segment[] = [];
  let current = "";
  let currentColor: string | null = null;
  let i = 0;

  while (i < line.length) {
    if (line[i] === "\x1b" && line[i + 1] === "[") {
      if (current) {
        segments.push({ text: current, color: currentColor });
        current = "";
      }
      let j = i + 2;
      while (j < line.length && line[j] !== "m") j++;
      const code = line.slice(i + 2, j);
      if (code === "0") currentColor = null;
      else if (ANSI_COLORS[code]) currentColor = ANSI_COLORS[code];
      i = j + 1;
    } else {
      current += line[i];
      i++;
    }
  }
  if (current) segments.push({ text: current, color: currentColor });
  return segments;
}

function hasCursor(line: string): boolean {
  return line.includes("\u258C");
}

function shouldShowPacket(
  layerId: LayerId,
  position: "top" | "bottom",
): boolean {
  const step = currentStep.value;
  if (!step.dataPacket || !step.highlight) return false;
  if (step.highlight !== layerId) return false;
  if (step.dataDirection === "down" && position === "bottom") return true;
  if (step.dataDirection === "up" && position === "top") return true;
  return false;
}

function packetColor(): string {
  const hl = currentStep.value.highlight;
  if (!hl) return "#eab308";
  return PACKET_COLORS[hl];
}
</script>

<template>
  <div class="flow-demo">
    <!-- Main two-column layout -->
    <div class="flow-layout">
      <!-- Left: layer diagram -->
      <div class="layer-col">
        <div class="col-label">Terminal Stack</div>

        <template v-for="(layer, idx) in LAYERS" :key="layer.id">
          <!-- Layer box -->
          <div
            :class="[
              'layer-box',
              { highlighted: currentStep.highlight === layer.id },
            ]"
          >
            <span class="layer-icon">[{{ layer.icon }}]</span>
            <div class="layer-info">
              <span class="layer-label">{{ layer.label }}</span>
              <span class="layer-sub">{{ layer.sub }}</span>
            </div>
            <!-- Data packet on layer edge -->
            <div
              v-if="shouldShowPacket(layer.id, 'bottom')"
              class="packet packet-bottom"
              :style="{ background: packetColor(), color: '#0a0a0a' }"
            >
              {{ currentStep.dataPacket }}
            </div>
            <div
              v-if="shouldShowPacket(layer.id, 'top')"
              class="packet packet-top"
              :style="{ background: packetColor(), color: '#0a0a0a' }"
            >
              {{ currentStep.dataPacket }}
            </div>
          </div>

          <!-- Arrow between layers -->
          <div v-if="idx < LAYERS.length - 1" class="arrow-row">
            <span
              class="arrow-char"
              :class="{
                'arrow-active': currentStep.dataDirection === 'down',
              }"
              >↓</span
            >
            <span class="arrow-sep">/</span>
            <span
              class="arrow-char"
              :class="{
                'arrow-active': currentStep.dataDirection === 'up',
              }"
              >↑</span
            >
          </div>
        </template>
      </div>

      <!-- Right: terminal preview + step info -->
      <div class="preview-col">
        <div class="col-label">Output</div>
        <TerminalWindow>
          <div class="term-lines">
            <div
              v-for="(line, lIdx) in currentStep.terminalContent"
              :key="lIdx"
              class="term-line"
            >
              <template
                v-for="(seg, sIdx) in parseAnsiLine(
                  hasCursor(line) ? line.replace('\u258C', '') : line,
                )"
                :key="sIdx"
              >
                <span :style="seg.color ? { color: seg.color } : {}">{{
                  seg.text
                }}</span>
              </template>
              <span v-if="hasCursor(line)" class="cursor-blink">▌</span>
            </div>
          </div>
        </TerminalWindow>

        <!-- Step info (inside right column) -->
        <div class="step-info">
          <div class="step-title">{{ currentStep.title }}</div>
          <p class="step-desc">{{ currentStep.description }}</p>
        </div>
      </div>
    </div>

    <!-- Step dots -->
    <div class="step-dots">
      <button
        v-for="(step, idx) in STEPS"
        :key="step.phase"
        :class="[
          'step-dot',
          {
            'dot-current': idx === stepIndex,
            'dot-past': idx < stepIndex,
          },
        ]"
        :title="step.title"
        @click="goToStep(idx)"
      />
    </div>

    <!-- Controls -->
    <div class="controls">
      <TButton :disabled="stepIndex === 0" @click="prev">上一步</TButton>
      <TButton
        variant="primary"
        :disabled="isAnimating"
        @click="startAnimation"
      >
        {{ isAnimating ? "播放中..." : "播放" }}
      </TButton>
      <TButton :disabled="stepIndex === STEPS.length - 1" @click="next"
        >下一步</TButton
      >
    </div>
  </div>
</template>

<style scoped>
.flow-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.flow-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 1024px) {
  .flow-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.layer-col,
.preview-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.col-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #eab308;
}

/* Layer boxes */
.layer-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--sr-c-bg-hover, #262626);
  background: rgba(10, 10, 10, 0.5);
  transition: all 0.3s ease;
}

.layer-box.highlighted {
  border-color: var(--sr-c-small-text);
  background: rgba(229, 229, 229, 0.05);
}

.layer-icon {
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 12px;
  color: var(--sr-c-small-text-muted);
  flex-shrink: 0;
}

.layer-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.layer-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--sr-c-small-text);
}

.layer-sub {
  font-size: 11px;
  color: var(--sr-c-small-text-muted);
}

/* Data packet labels */
.packet {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 2px 8px;
  font-size: 11px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  white-space: nowrap;
  border-radius: 2px;
}

.packet-bottom {
  bottom: -14px;
}

.packet-top {
  top: -14px;
}

/* Arrows between layers */
.arrow-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 0;
}

.arrow-char {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  transition: color 0.3s ease;
}

.arrow-char.arrow-active {
  color: #22c55e;
}

.arrow-sep {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
}

/* Terminal preview */
.term-lines {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.6;
  min-height: 120px;
  color: #e5e5e5;
}

.term-line {
  white-space: pre;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
  color: #22c55e;
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

/* Step info */
.step-info {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  padding: 12px 16px;
}

.step-title {
  font-size: 13px;
  font-weight: 500;
  color: #22c55e;
  margin-bottom: 4px;
}

.step-desc {
  margin: 0;
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
}

/* Step dots */
.step-dots {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--sr-c-bg-hover, #262626);
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.step-dot.dot-current {
  background: var(--sr-c-small-text);
  transform: scale(1.25);
}

.step-dot.dot-past {
  background: var(--sr-c-small-text-muted);
}

/* Controls */
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
