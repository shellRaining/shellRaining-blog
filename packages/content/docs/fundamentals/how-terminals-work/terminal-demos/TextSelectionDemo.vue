<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import StepNavigation from "./shared/StepNavigation.vue";

type InteractionMode = "terminal-select" | "app-cursor";

const SAMPLE_TEXT = [
  "~/projects $ ls -la",
  "total 24",
  "drwxr-xr-x  5 user staff  160 Jan  7 10:00 .",
  "drwxr-xr-x 12 user staff  384 Jan  6 15:30 ..",
  "-rw-r--r--  1 user staff  234 Jan  7 09:45 README.md",
  "-rw-r--r--  1 user staff 1024 Jan  7 10:00 index.ts",
  "drwxr-xr-x  3 user staff   96 Jan  5 14:20 src",
  '~/projects $ echo "Hello, World!"',
  "Hello, World!",
  "~/projects $ _",
];

const GRID_WIDTH = Math.max(40, ...SAMPLE_TEXT.map((l) => l.length));

const EXPLAINER_STEPS = {
  overview: {
    title: "两种类型的选择",
    description:
      "终端中有两种完全不同的“选择”：终端级文本选择（由终端模拟器处理）和光标位置（应用认为光标在哪里）。它们相互独立，这常常让人困惑。",
  },
  "terminal-selection": {
    title: "终端级选择",
    description:
      "在终端中点击拖动时，终端模拟器（iTerm、Terminal.app 等）处理选择。它高亮屏幕上的文本用于复制粘贴。运行中的程序对此毫不知情，它只看到网格上的字符。",
  },
  "cursor-positioning": {
    title: "应用光标位置",
    description:
      "vim 或 shell 提示符中闪烁的光标由应用控制，不是终端。应用发送转义序列（如 ESC[5;10H 将光标移动到第 5 行第 10 列）来定位光标。点击屏幕不会自动移动这个光标。",
  },
  "option-click": {
    title: "Option+Click：桥梁",
    description:
      "某些终端支持 Option+Click（或 Alt+Click）来移动光标。终端计算点击位置并发送方向键序列来移动光标到目标处。它是在模拟按键，不是直接移动光标！",
  },
  "why-different": {
    title: "为什么它们是分开的",
    description:
      "终端只是字符显示器。它不知道你在运行 vim（点击应该移动光标）还是 cat（没有光标可移动）。应用必须主动启用鼠标处理，否则点击只会触发终端级的文本选择。",
  },
};

type ExplainerStep = keyof typeof EXPLAINER_STEPS;

const mode = ref<InteractionMode>("terminal-select");
const currentStep = ref<ExplainerStep>("overview");

const steps = Object.keys(EXPLAINER_STEPS) as ExplainerStep[];
const stepContent = computed(() => EXPLAINER_STEPS[currentStep.value]);

// --- Terminal Selection mode state ---
const isDragging = ref(false);
const selectionStart = ref<{ row: number; col: number } | null>(null);
const selectionEnd = ref<{ row: number; col: number } | null>(null);

// --- App Cursor mode state ---
const cursorPos = ref({ row: 9, col: 15 }); // at the _ position
const arrowBadges = ref<{ key: string; count: number }[]>([]);
const badgeTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const hintVisible = ref(true);

// Pad each line to GRID_WIDTH
const paddedLines = computed(() =>
  SAMPLE_TEXT.map((line) => line.padEnd(GRID_WIDTH, " ")),
);

// Selection range helpers
function isCellSelected(row: number, col: number): boolean {
  if (!selectionStart.value || !selectionEnd.value) return false;

  let startRow = selectionStart.value.row;
  let startCol = selectionStart.value.col;
  let endRow = selectionEnd.value.row;
  let endCol = selectionEnd.value.col;

  // Normalize direction
  if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
    [startRow, endRow] = [endRow, startRow];
    [startCol, endCol] = [endCol, startCol];
  }

  if (startRow === endRow) {
    return row === startRow && col >= startCol && col <= endCol;
  } else {
    if (row === startRow) {
      return col >= startCol;
    } else if (row === endRow) {
      return col <= endCol;
    } else if (row > startRow && row < endRow) {
      return true;
    }
    return false;
  }
}

const selectedText = computed(() => {
  if (!selectionStart.value || !selectionEnd.value) return "";

  let startRow = selectionStart.value.row;
  let startCol = selectionStart.value.col;
  let endRow = selectionEnd.value.row;
  let endCol = selectionEnd.value.col;

  if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
    [startRow, endRow] = [endRow, startRow];
    [startCol, endCol] = [endCol, startCol];
  }

  if (startRow === endRow) {
    return paddedLines.value[startRow]
      .substring(startCol, endCol + 1)
      .trimEnd();
  }

  const lines: string[] = [];
  lines.push(paddedLines.value[startRow].substring(startCol).trimEnd());
  for (let r = startRow + 1; r < endRow; r++) {
    lines.push(paddedLines.value[r].trimEnd());
  }
  lines.push(paddedLines.value[endRow].substring(0, endCol + 1).trimEnd());
  return lines.join("\n");
});

const selectionCoords = computed(() => {
  if (!selectionStart.value || !selectionEnd.value) return null;

  let startRow = selectionStart.value.row;
  let startCol = selectionStart.value.col;
  let endRow = selectionEnd.value.row;
  let endCol = selectionEnd.value.col;

  if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
    return { start: selectionEnd.value, end: selectionStart.value };
  }
  return { start: selectionStart.value, end: selectionEnd.value };
});

// Mouse handlers for terminal selection
function onCellMouseDown(row: number, col: number, e: MouseEvent) {
  if (mode.value === "terminal-select") {
    e.preventDefault();
    isDragging.value = true;
    selectionStart.value = { row, col };
    selectionEnd.value = { row, col };
  } else {
    // App cursor mode
    if (e.altKey) {
      moveAppCursor(row, col);
      hintVisible.value = false;
    }
  }
}

function onCellMouseMove(row: number, col: number, e: MouseEvent) {
  if (mode.value === "terminal-select" && isDragging.value) {
    e.preventDefault();
    selectionEnd.value = { row, col };
  }
}

function onGlobalMouseUp() {
  if (isDragging.value) {
    isDragging.value = false;
  }
}

// App cursor movement
function moveAppCursor(targetRow: number, targetCol: number) {
  const rowDiff = targetRow - cursorPos.value.row;
  const colDiff = targetCol - cursorPos.value.col;
  const badges: { key: string; count: number }[] = [];

  if (rowDiff !== 0) {
    badges.push({
      key: rowDiff > 0 ? "↓" : "↑",
      count: Math.abs(rowDiff),
    });
  }
  if (colDiff !== 0) {
    badges.push({
      key: colDiff > 0 ? "→" : "←",
      count: Math.abs(colDiff),
    });
  }

  arrowBadges.value = badges;
  cursorPos.value = { row: targetRow, col: targetCol };

  if (badgeTimer.value) {
    clearTimeout(badgeTimer.value);
  }
  badgeTimer.value = setTimeout(() => {
    arrowBadges.value = [];
    badgeTimer.value = null;
  }, 1500);
}

function switchMode(m: InteractionMode) {
  mode.value = m;
  // Clear state
  selectionStart.value = null;
  selectionEnd.value = null;
  isDragging.value = false;
  arrowBadges.value = [];
  hintVisible.value = true;
  if (badgeTimer.value) {
    clearTimeout(badgeTimer.value);
    badgeTimer.value = null;
  }
}

const appCursorStatus = computed(() => {
  return `光标位置: 行 ${cursorPos.value.row}, 列 ${cursorPos.value.col}`;
});

onMounted(() => {
  document.addEventListener("mouseup", onGlobalMouseUp);
});

onUnmounted(() => {
  document.removeEventListener("mouseup", onGlobalMouseUp);
  if (badgeTimer.value) {
    clearTimeout(badgeTimer.value);
  }
});
</script>

<template>
  <div class="text-selection-demo">
    <!-- Terminal Window -->
    <TerminalWindow>
      <div class="terminal-inner">
        <!-- Mode Toggle (inside terminal like original) -->
        <div class="mode-toggle">
          <div :class="{ 'blue-toggle-wrap': mode === 'terminal-select' }">
            <TButton
              variant="toggle"
              :active="mode === 'terminal-select'"
              @click="switchMode('terminal-select')"
            >
              终端选择
            </TButton>
          </div>
          <TButton
            variant="toggle"
            :active="mode === 'app-cursor'"
            @click="switchMode('app-cursor')"
          >
            应用光标 (Option+Click)
          </TButton>
        </div>
        <!-- Character Grid -->
        <div
          :class="[
            'char-grid',
            {
              'mode-terminal': mode === 'terminal-select',
              'mode-app': mode === 'app-cursor',
            },
          ]"
        >
          <div
            v-for="(line, rowIdx) in paddedLines"
            :key="rowIdx"
            class="char-row"
          >
            <span
              v-for="(ch, colIdx) in line.split('')"
              :key="colIdx"
              :class="[
                'char-cell',
                {
                  selected:
                    mode === 'terminal-select' &&
                    isCellSelected(rowIdx, colIdx),
                  'app-cursor-cell':
                    mode === 'app-cursor' &&
                    cursorPos.row === rowIdx &&
                    cursorPos.col === colIdx,
                },
              ]"
              @mousedown="onCellMouseDown(rowIdx, colIdx, $event)"
              @mousemove="onCellMouseMove(rowIdx, colIdx, $event)"
              >{{ ch }}</span
            >
          </div>
        </div>

        <!-- Arrow badges (app cursor mode) -->
        <div
          v-if="mode === 'app-cursor' && arrowBadges.length > 0"
          class="arrow-badges"
        >
          <span
            v-for="(badge, idx) in arrowBadges"
            :key="idx"
            class="arrow-badge"
          >
            {{ badge.key }} x{{ badge.count }}
          </span>
        </div>

        <!-- Status bar -->
        <div class="status-bar">
          <template v-if="mode === 'terminal-select'">
            <template v-if="selectionCoords">
              <div class="status-row">
                <span class="dim" style="font-size: 12px">选择范围:</span>
                <code class="status-coords"
                  >({{ selectionCoords.start.row }},{{
                    selectionCoords.start.col
                  }}) → ({{ selectionCoords.end.row }},{{
                    selectionCoords.end.col
                  }})</code
                >
              </div>
              <div class="dim" style="font-size: 12px">
                应用对此选择一无所知。它完全由终端模拟器处理，用于复制粘贴。
              </div>
              <div v-if="selectedText" class="copy-preview">
                <span class="copy-label">将会复制:</span>
                <code class="copy-text">{{
                  selectedText.length > 60
                    ? selectedText.substring(0, 60) + "..."
                    : selectedText
                }}</code>
              </div>
            </template>
            <div v-else class="hint-text" style="text-align: center">
              点击并拖动以选择文本。这由终端处理，不是运行中的程序。
            </div>
          </template>
          <template v-else>
            <span class="status-text status-green">{{ appCursorStatus }}</span>
            <div v-if="hintVisible" class="hint-text">
              按住 Option 并点击任意位置来移动光标，观察方向键模拟过程！
            </div>
          </template>
        </div>
      </div>
    </TerminalWindow>

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

      <!-- Code block for terminal-selection -->
      <div v-if="currentStep === 'terminal-selection'" class="explainer-code">
        <div class="code-comment">// 终端模拟器处理选择</div>
        <div><span class="code-yellow">1.</span> 你在位置 (5, 10) 点击</div>
        <div><span class="code-yellow">2.</span> 终端模拟器记录选择起点</div>
        <div><span class="code-yellow">3.</span> 你拖动到 (5, 20)</div>
        <div>
          <span class="code-yellow">4.</span> 终端高亮单元格并存入剪贴板
        </div>
        <div class="code-comment" style="margin-top: 8px">
          // 运行中的程序什么也看不到
        </div>
        <div class="code-comment">// （除非它启用了鼠标追踪）</div>
      </div>

      <!-- Code block for cursor-positioning -->
      <div v-if="currentStep === 'cursor-positioning'" class="explainer-code">
        <div class="code-comment">// 应用通过转义序列控制光标</div>
        <div>
          <span class="code-green">ESC[H</span>
          <span class="code-comment"> — 移动光标到 (1,1)</span>
        </div>
        <div>
          <span class="code-green">ESC[5;10H</span>
          <span class="code-comment"> — 移动到第 5 行第 10 列</span>
        </div>
        <div>
          <span class="code-green">ESC[A</span>
          <span class="code-comment"> — 光标上移一行</span>
        </div>
        <div>
          <span class="code-green">ESC[C</span>
          <span class="code-comment"> — 光标右移一列</span>
        </div>
        <div class="code-comment" style="margin-top: 8px">
          // 终端只是执行这些命令
        </div>
        <div class="code-comment">// 它不会在点击时移动光标！</div>
      </div>

      <!-- Code block for option-click -->
      <div v-if="currentStep === 'option-click'" class="explainer-code">
        <div class="code-comment">
          // Option+Click 位置 (5, 15)，当前光标在 (3, 5)
        </div>
        <div>
          <span class="code-yellow">1.</span> 终端计算：需要下移 2 行，右移 10
          列
        </div>
        <div>
          <span class="code-yellow">2.</span> 终端发送：
          <span class="code-cyan">ESC[B ESC[B</span>
          <span class="code-comment"> (下移 2 次)</span>
        </div>
        <div>
          <span class="code-yellow">3.</span> 终端发送：
          <span class="code-cyan">ESC[C ESC[C ...</span>
          <span class="code-comment"> (右移 10 次)</span>
        </div>
        <div><span class="code-yellow">4.</span> 应用收到方向键，移动光标</div>
        <div class="code-comment" style="margin-top: 8px">
          // 它模拟了 12 次按键！
        </div>
      </div>

      <!-- Code block for why-different -->
      <div v-if="currentStep === 'why-different'" class="explainer-code">
        <div class="code-comment">// 终端不知道你在运行什么：</div>
        <div style="margin-top: 8px">
          <span class="code-cyan">$ vim file.txt</span>
          <span class="code-comment"> ← 点击应该移动光标</span>
        </div>
        <div>
          <span class="code-cyan">$ cat longfile.txt</span>
          <span class="code-comment"> ← 没有光标可移动</span>
        </div>
        <div>
          <span class="code-cyan">$ python</span>
          <span class="code-comment"> ← REPL 提示符中的光标</span>
        </div>
        <div>
          <span class="code-cyan">$ htop</span>
          <span class="code-comment"> ← 点击选择进程</span>
        </div>
        <div class="code-comment" style="margin-top: 8px">
          // 每个应用处理鼠标的方式不同
        </div>
        <div class="code-comment">// 所以终端不能做任何假设！</div>
      </div>
    </InfoPanel>

    <!-- "Why can't you just click to move cursor" section -->
    <div class="why-section">
      <h3 class="why-title">为什么不能直接点击移动光标？</h3>
      <div class="why-boxes">
        <div class="why-box why-box-expect">
          <div class="why-box-title">你的期望</div>
          <p class="why-box-desc">
            点击位置 → 光标立即移动，像文本编辑器或浏览器一样。
          </p>
        </div>
        <div class="why-neq">&ne;</div>
        <div class="why-box why-box-actual">
          <div class="why-box-title">实际发生的</div>
          <p class="why-box-desc">
            点击 → 终端显示选择，或发送鼠标事件给应用（如果启用了鼠标追踪）→
            由应用决定怎么做。
          </p>
        </div>
      </div>
      <div class="why-footer">
        终端是一个简单的显示设备。它在应用指定的位置显示字符。光标位置由运行中的程序控制，终端只能通过发送按键事件来间接影响它。
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-selection-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Mode Toggle */
.mode-toggle {
  display: flex;
  gap: 8px;
}

.blue-toggle-wrap :deep(.t-btn--toggle.active) {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* Terminal inner */
.terminal-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Character Grid */
.char-grid {
  user-select: none;
  overflow-x: auto;
  line-height: 1.4;
}

.char-grid.mode-terminal {
  cursor: text;
}

.char-grid.mode-app {
  cursor: pointer;
}

.char-row {
  display: flex;
  white-space: pre;
  height: 1.4em;
}

.char-cell {
  display: inline-block;
  width: 0.6em;
  text-align: center;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 13px;
  color: #e5e5e5;
  transition:
    background-color 50ms,
    color 50ms;
}

.char-cell.selected {
  background: #ffffff;
  color: #000000;
}

.char-cell.app-cursor-cell {
  background: #22c55e;
  color: #0a0a0a;
  animation: cursor-pulse 1.2s ease-in-out infinite;
}

@keyframes cursor-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Arrow badges */
.arrow-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 6px 0;
  animation: badges-fade-in 0.15s ease-out;
}

@keyframes badges-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.arrow-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 13px;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 4px;
  white-space: nowrap;
}

/* Status bar */
.status-bar {
  padding: 8px 0 0;
  border-top: 1px solid #262626;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-text {
  font-size: 12px;
  color: #a3a3a3;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-coords {
  color: #3b82f6;
  font-size: 12px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
}

.status-green {
  color: #22c55e;
}

.copy-preview {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.copy-label {
  color: #525252;
  flex-shrink: 0;
}

.copy-text {
  color: #eab308;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hint-text {
  font-size: 12px;
  color: #525252;
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

/* Explainer code block */
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

.code-comment {
  color: #525252;
}

.code-yellow {
  color: #eab308;
}

.code-green {
  color: #22c55e;
}

.code-cyan {
  color: #06b6d4;
}

/* "Why can't you click" section */
.why-section {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.why-title {
  font-size: 14px;
  font-weight: 600;
  color: #f85149;
  margin: 0;
}

.why-boxes {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.why-box {
  flex: 1;
  padding: 16px;
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
}

.why-box-expect {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.why-box-actual {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.why-box-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sr-c-small-text);
  margin-bottom: 8px;
}

.why-box-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.5;
  margin: 0;
}

.why-neq {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  font-size: 24px;
  font-weight: 700;
  color: #f85149;
  flex-shrink: 0;
  background: var(--sr-c-bg-section);
  border-top: var(--sr-border);
  border-bottom: var(--sr-border);
}

.why-footer {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  text-align: center;
  padding: 0 8px;
}

/* Shared utility */
.dim {
  color: var(--sr-c-small-text-muted);
}
</style>
