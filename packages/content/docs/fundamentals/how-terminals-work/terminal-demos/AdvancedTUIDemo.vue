<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import StepNavigation from "./shared/StepNavigation.vue";

/* ── Tabs ── */
const tabs = ["持续集成", "集成", "日志"] as const;
const activeTab = ref(0);

/* ── Sidebar items ── */
interface DeployItem {
  name: string;
  status: "success" | "running" | "failed" | "waiting";
  label: string;
  symbol: string;
  color: string;
}

const deployItems: DeployItem[] = [
  {
    name: "ci-fe-be-rules",
    status: "success",
    label: "成功",
    symbol: "✓",
    color: "#22c55e",
  },
  {
    name: "ci-api-test",
    status: "running",
    label: "运行中",
    symbol: "◐",
    color: "#eab308",
  },
  {
    name: "ci-email-service",
    status: "success",
    label: "成功",
    symbol: "✓",
    color: "#22c55e",
  },
  {
    name: "ci-auth-core",
    status: "failed",
    label: "失败",
    symbol: "✗",
    color: "#f85149",
  },
  {
    name: "ci-db-migration",
    status: "waiting",
    label: "等待中",
    symbol: "○",
    color: "#525252",
  },
];

const selectedItem = ref(0);

/* ── Focus management ── */
type FocusRegion = "tabs" | "sidebar" | "content";
const focusedRegion = ref<FocusRegion>("sidebar");

function setFocus(region: FocusRegion) {
  focusedRegion.value = region;
}

/* ── Keyboard handling ── */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Tab") {
    e.preventDefault();
    const regions: FocusRegion[] = ["tabs", "sidebar", "content"];
    const idx = regions.indexOf(focusedRegion.value);
    focusedRegion.value = regions[(idx + 1) % regions.length];
    return;
  }

  if (focusedRegion.value === "sidebar") {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedItem.value = Math.min(
        selectedItem.value + 1,
        deployItems.length - 1,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedItem.value = Math.max(selectedItem.value - 1, 0);
    }
  }

  if (focusedRegion.value === "tabs") {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      activeTab.value = Math.min(activeTab.value + 1, tabs.length - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      activeTab.value = Math.max(activeTab.value - 1, 0);
    }
  }
}

/* ── Selected item detail ── */
const currentItem = computed(() => deployItems[selectedItem.value]);

/* ── Coordinates toggle ── */
const showCoords = ref(false);

const regionCoords = computed(() => {
  const c = terminalSize.value;
  return {
    tabs: { x: 0, y: 0, w: c.cols, h: 1 },
    sidebar: { x: 0, y: 1, w: Math.floor(c.cols * 0.35), h: c.rows - 1 },
    content: {
      x: Math.floor(c.cols * 0.35),
      y: 1,
      w: c.cols - Math.floor(c.cols * 0.35),
      h: c.rows - 1,
    },
  };
});

/* ── Dynamic layout based on terminalSize ── */
const sidebarWidth = computed(() => Math.floor(terminalSize.value.cols * 0.35));

/* ── Resize simulation ── */
const sizes = [
  { cols: 60, rows: 20 },
  { cols: 80, rows: 24 },
  { cols: 50, rows: 16 },
  { cols: 60, rows: 20 },
];
const terminalSize = ref({ cols: 60, rows: 20 });
const isResizing = ref(false);

function simulateResize() {
  if (isResizing.value) return;
  isResizing.value = true;
  let step = 0;
  const interval = setInterval(() => {
    if (step >= sizes.length) {
      clearInterval(interval);
      isResizing.value = false;
      return;
    }
    terminalSize.value = { ...sizes[step] };
    step++;
  }, 600);
}

/* ── Explainer steps ── */
const EXPLAINER_STEPS = {
  overview: {
    title: "布局系统",
    description:
      "高级 TUI 将终端划分为区域。每个区域是一个具有自己内容和边框的矩形。TUI 框架跟踪每个区域在字符网格中的位置和大小。",
  },
  "layout-system": {
    title: "区域坐标",
    description:
      "每个区域存储其位置 (x, y) 和尺寸（宽度、高度），单位是字符单元格。制表符绘制字符（如 ┌─┐│）创建可视边框。当内容变化时 TUI 重新计算这些值。",
  },
  "focus-management": {
    title: "焦点与输入路由",
    description:
      "同一时间只有一个区域被'聚焦'（绿色边框标记）。按键被路由到聚焦区域。Tab/方向键在区域间移动焦点。",
  },
  "resize-handling": {
    title: "终端调整大小",
    description:
      "调整终端窗口大小时，会发送 SIGWINCH 信号。TUI 通过 ioctl() 查询新尺寸，重新计算每个区域的大小并重绘整个屏幕。",
  },
  rendering: {
    title: "全屏渲染",
    description:
      "TUI 通常使用备用屏幕模式（CSI ?1049h）作为干净画布。用转义码定位光标并绘制每个单元格。双缓冲防止闪烁。",
  },
} as const;

type ExplainerStep = keyof typeof EXPLAINER_STEPS;

const currentStep = ref<ExplainerStep>("overview");
const steps = Object.keys(EXPLAINER_STEPS) as ExplainerStep[];
const stepContent = computed(() => EXPLAINER_STEPS[currentStep.value]);

/* ── Step-specific extra info ── */
const resizeSequenceSteps = [
  "用户拖动终端窗口边缘",
  "内核发送 SIGWINCH 信号",
  "TUI 捕获信号",
  "调用 ioctl(TIOCGWINSZ) 获取新尺寸",
  "重新计算所有区域的布局",
  "清屏并重绘所有内容",
];

const escapeSequences = [
  { code: "CSI ?1049h", desc: "进入备用屏幕" },
  { code: "CSI 2J", desc: "清除屏幕" },
  { code: "CSI H", desc: "光标归位" },
  { code: "CSI {r};{c}H", desc: "定位光标" },
  { code: "CSI ?25l", desc: "隐藏光标" },
  { code: "CSI ?25h", desc: "显示光标" },
];

/* ── Cursor positioning grid ── */
const gridRows = 5;
const gridCols = 20;
const selectedCell = ref<{ row: number; col: number }>({ row: 1, col: 1 });

function selectCell(row: number, col: number) {
  selectedCell.value = { row, col };
}

/* ── Box drawing characters ── */
const boxChars = [
  { group: "角", chars: ["┌", "┐", "└", "┘"] },
  { group: "线", chars: ["─", "│", "═", "║"] },
  { group: "T 形连接", chars: ["┬", "┴", "├", "┤"] },
  { group: "交叉", chars: ["┼", "╬", "╪", "╫"] },
];
</script>

<template>
  <div class="tui-demo">
    <!-- Interactive TUI Simulation -->
    <TerminalWindow>
      <div
        class="tui-container"
        tabindex="0"
        :style="{ minWidth: terminalSize.cols + 'ch' }"
        @keydown="handleKeydown"
      >
        <!-- Tab bar -->
        <div
          :class="['tui-tabs', { 'tui-focused': focusedRegion === 'tabs' }]"
          @click="setFocus('tabs')"
        >
          <div
            v-for="(tab, idx) in tabs"
            :key="tab"
            :class="['tui-tab', { 'tui-tab-active': activeTab === idx }]"
            @click.stop="
              activeTab = idx;
              setFocus('tabs');
            "
          >
            {{ tab }}
          </div>
          <div v-if="showCoords" class="coord-overlay">
            ({{ regionCoords.tabs.x }},{{ regionCoords.tabs.y }})
            {{ regionCoords.tabs.w }}x{{ regionCoords.tabs.h }}
          </div>
        </div>

        <!-- Main body: sidebar + content -->
        <div
          class="tui-body"
          :style="{ height: (terminalSize.rows - 3) * 1.25 + 'em' }"
        >
          <!-- Sidebar -->
          <div
            :class="[
              'tui-sidebar',
              { 'tui-focused': focusedRegion === 'sidebar' },
            ]"
            :style="{ width: sidebarWidth + 'ch' }"
            @click="setFocus('sidebar')"
          >
            <div
              v-for="(item, idx) in deployItems"
              :key="item.name"
              :class="[
                'tui-sidebar-item',
                { 'tui-sidebar-selected': selectedItem === idx },
              ]"
              @click.stop="
                selectedItem = idx;
                setFocus('sidebar');
              "
            >
              <span class="tui-status-symbol" :style="{ color: item.color }">{{
                item.symbol
              }}</span>
              <span class="tui-item-name">{{ item.name }}</span>
            </div>
            <div v-if="showCoords" class="coord-overlay">
              ({{ regionCoords.sidebar.x }},{{ regionCoords.sidebar.y }})
              {{ regionCoords.sidebar.w }}x{{ regionCoords.sidebar.h }}
            </div>
          </div>

          <!-- Content area -->
          <div
            :class="[
              'tui-content',
              { 'tui-focused': focusedRegion === 'content' },
            ]"
            @click="setFocus('content')"
          >
            <div class="tui-content-name">{{ currentItem.name }}</div>
            <div class="tui-detail-row dim">
              Status:
              <span :style="{ color: currentItem.color }">{{
                currentItem.status
              }}</span>
            </div>
            <div class="tui-detail-row dim">
              Updated: 2024-01-15 14:32:00 UTC
            </div>

            <!-- Running: progress bar -->
            <div
              v-if="currentItem.status === 'running'"
              class="tui-progress-section"
            >
              <div class="tui-progress-text">
                Building... ████████░░░░░░░░ 52%
              </div>
            </div>

            <!-- Failed: error message -->
            <div
              v-if="currentItem.status === 'failed'"
              class="tui-error-section"
            >
              <span class="tui-error-text"
                >Error: Test suite failed (3 failures)</span
              >
            </div>

            <div v-if="showCoords" class="coord-overlay">
              ({{ regionCoords.content.x }},{{ regionCoords.content.y }})
              {{ regionCoords.content.w }}x{{ regionCoords.content.h }}
            </div>
          </div>
        </div>
      </div>
    </TerminalWindow>

    <!-- Controls below terminal -->
    <div class="controls-row">
      <TButton
        variant="toggle"
        :active="showCoords"
        @click="showCoords = !showCoords"
      >
        {{ showCoords ? "隐藏坐标" : "显示坐标" }}
      </TButton>
      <TButton :disabled="isResizing" @click="simulateResize">
        模拟调整大小
      </TButton>
      <span class="size-display"
        >尺寸: {{ terminalSize.cols }}x{{ terminalSize.rows }}</span
      >
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
      <p class="detail-desc">
        {{ stepContent.description }}
      </p>

      <!-- Step-specific extra content -->
      <div v-if="currentStep === 'layout-system'" class="step-extra">
        <div class="region-data">
          <div
            v-for="(coords, region) in regionCoords"
            :key="region"
            class="region-data-item"
          >
            <code class="esc-code">{{ region }}</code>
            <span class="dim">
              ({{ coords.x }}, {{ coords.y }}) {{ coords.w }}x{{ coords.h }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 'focus-management'" class="step-extra">
        <div class="focus-info">
          当前焦点: <code class="esc-code">{{ focusedRegion }}</code>
          <span class="dim"> — 点击区域或按 Tab 键切换焦点</span>
        </div>
      </div>

      <div v-if="currentStep === 'resize-handling'" class="step-extra">
        <div class="step-sequence">
          <div
            v-for="(s, idx) in resizeSequenceSteps"
            :key="idx"
            class="step-item"
          >
            <span class="step-num">{{ idx + 1 }}</span>
            <span class="step-label">{{ s }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 'rendering'" class="step-extra">
        <p class="dim" style="font-size: 12px; margin: 0 0 8px">
          CSI 即 Control Sequence
          Introducer（\x1b[），是大多数终端控制序列的开头。
        </p>
        <div class="esc-list">
          <div
            v-for="seq in escapeSequences"
            :key="seq.code"
            class="esc-list-item"
          >
            <code class="esc-code">{{ seq.code }}</code>
            <span class="dim">{{ seq.desc }}</span>
          </div>
        </div>
      </div>
    </InfoPanel>

    <!-- TUI Architecture section -->
    <div class="architecture-section">
      <div class="section-title">TUI 架构揭秘</div>
      <div class="feature-boxes">
        <div class="feature-box">
          <div class="feature-box-title">
            <span class="feature-box-num">1</span> 布局引擎
          </div>
          <div class="feature-box-desc dim">
            TUI 维护一个区域树（类似
            DOM）。每个节点存储位置、尺寸和约束。布局变更时自顶向下重新计算，确保子区域适配父区域。
          </div>
        </div>
        <div class="feature-box">
          <div class="feature-box-title">
            <span class="feature-box-num">2</span> 事件分发
          </div>
          <div class="feature-box-desc dim">
            输入事件先到聚焦区域。如果未处理，事件冒泡到父区域。全局快捷键（如
            Ctrl+C）在分发前被拦截。
          </div>
        </div>
        <div class="feature-box">
          <div class="feature-box-title">
            <span class="feature-box-num">3</span> 渲染循环
          </div>
          <div class="feature-box-desc dim">
            每个区域渲染到缓冲区。渲染引擎对比新旧缓冲区，只发送差异部分的转义序列，最小化
            I/O 开销。
          </div>
        </div>
      </div>

      <!-- Box drawing characters (inside architecture section) -->
      <div class="box-chars-inner">
        <div class="box-chars-inner-title">制表符绘制字符</div>
        <div class="box-chars-grid">
          <div
            v-for="group in boxChars"
            :key="group.group"
            class="box-chars-group-inline"
          >
            <div class="box-chars-label dim">{{ group.group }}</div>
            <div class="box-chars-row">{{ group.chars.join(" ") }}</div>
          </div>
        </div>
        <p class="dim box-chars-note">
          这些 Unicode
          字符构成了你在终端应用中看到的边框。它们是普通字符，终端像渲染其他文本一样渲染它们。
        </p>
      </div>
    </div>

    <!-- Cursor positioning sub-section -->
    <div class="cursor-section">
      <div class="section-title">光标定位</div>
      <p class="cursor-desc dim">
        终端维护一个光标位置。TUI
        通过转义序列不断移动光标来在不同区域绘制内容。点击下面的单元格查看移动光标到该位置的转义序列。
      </p>

      <div class="cursor-layout">
        <div class="cursor-grid-wrapper">
          <div class="cursor-grid">
            <template v-for="r in gridRows" :key="'row-' + r">
              <div
                v-for="c in gridCols"
                :key="'cell-' + r + '-' + c"
                :class="[
                  'cursor-cell',
                  {
                    'cursor-cell-selected':
                      selectedCell?.row === r && selectedCell?.col === c,
                  },
                ]"
                @click="selectCell(r, c)"
              >
                {{
                  selectedCell?.row === r && selectedCell?.col === c ? "█" : "·"
                }}
              </div>
            </template>
          </div>
        </div>

        <div class="cursor-info-panel">
          <template v-if="selectedCell">
            <div class="cursor-info-block">
              <div class="dim" style="font-size: 11px; margin-bottom: 4px">
                移动光标的转义序列:
              </div>
              <code class="esc-code"
                >\x1b[{{ selectedCell.row }};{{ selectedCell.col }}H</code
              >
            </div>
            <div class="cursor-info-block">
              <div class="dim" style="font-size: 11px; margin-bottom: 4px">
                代码写法:
              </div>
              <code class="esc-code"
                ><span style="color: #a855f7">printf</span
                ><span style="color: #eab308">(</span
                ><span style="color: #22c55e"
                  >"\033[{{ selectedCell.row }};{{ selectedCell.col }}H"</span
                ><span style="color: #eab308">)</span></code
              >
            </div>
            <p class="dim" style="font-size: 11px; margin: 0">
              位置 ({{ selectedCell.row }}, {{ selectedCell.col }}) — 第
              {{ selectedCell.row }} 行，第 {{ selectedCell.col }}
              列。终端坐标从 1 开始（第 1 行第 1 列是左上角）。
            </p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tui-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── TUI Container ── */
.tui-container {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #e5e5e5;
  outline: none;
  min-height: 280px;
  transition: min-width 0.3s ease;
}

/* ── Tab bar ── */
.tui-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #333;
  background: #111;
  position: relative;
  padding: 0 4px;
}

.tui-tabs.tui-focused {
  box-shadow: inset 0 0 0 1px #22c55e;
}

.tui-tab {
  padding: 6px 16px;
  cursor: pointer;
  color: #737373;
  border-bottom: 2px solid transparent;
  transition:
    color 0.15s,
    border-color 0.15s;
  user-select: none;
}

.tui-tab:hover {
  color: #a3a3a3;
}

.tui-tab-active {
  color: #22c55e;
  border-bottom-color: #22c55e;
}

/* ── Body: sidebar + content ── */
.tui-body {
  display: flex;
  min-height: 220px;
  transition: height 0.3s ease;
}

/* ── Sidebar ── */
.tui-sidebar {
  border-right: 1px solid #333;
  padding: 4px 0;
  position: relative;
  background: #0d0d0d;
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.3s ease;
}

.tui-sidebar.tui-focused {
  box-shadow: inset 0 0 0 1px #22c55e;
}

.tui-sidebar-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  cursor: pointer;
  transition: background 0.1s;
  font-size: 12px;
  overflow: hidden;
}

.tui-sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tui-sidebar-selected {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.tui-status-symbol {
  flex-shrink: 0;
  width: 1.5ch;
  text-align: center;
}

.tui-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Content area ── */
.tui-content {
  flex: 1;
  padding: 8px 12px;
  position: relative;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.tui-content.tui-focused {
  box-shadow: inset 0 0 0 1px #22c55e;
}

.tui-content-name {
  font-size: 12px;
  font-weight: 700;
  color: #e5e5e5;
  margin-bottom: 4px;
}

.tui-detail-row {
  font-size: 12px;
}

.tui-progress-section {
  margin-top: 8px;
}

.tui-progress-text {
  font-size: 12px;
  color: #eab308;
}

.tui-error-section {
  margin-top: 8px;
}

.tui-error-text {
  color: #f85149;
  font-size: 10px;
}

/* ── Coordinate overlay ── */
.coord-overlay {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
  padding: 1px 4px;
  border-radius: 2px;
  pointer-events: none;
}

/* ── Controls row ── */
.controls-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.size-display {
  font-size: 13px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  color: var(--sr-c-small-text-muted);
  font-variant-numeric: tabular-nums;
}

/* ── Explainer ── */
.explainer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.explainer-title {
  font-weight: 500;
  font-size: 14px;
  color: #3b82f6;
}

.detail-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 10px 0 0;
}

.step-extra {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* Region data */
.region-data {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.region-data-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

/* Focus info */
.focus-info {
  font-size: 12px;
  color: var(--sr-c-small-text);
}

/* Step sequence */
.step-sequence {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

/* Escape sequence list */
.esc-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}

@media (max-width: 480px) {
  .esc-list {
    grid-template-columns: 1fr;
  }
}

.esc-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

/* ── Architecture section ── */
.architecture-section {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
}

.feature-boxes {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .feature-boxes {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feature-box {
  background: var(--sr-c-bg-section);
  padding: 14px;
}

.feature-box-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sr-c-small-text);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.feature-box-num {
  color: var(--sr-c-small-text-muted);
}

.feature-box-desc {
  font-size: 12px;
  line-height: 1.6;
}

/* ── Box drawing chars (inside architecture) ── */
.box-chars-inner {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.box-chars-inner-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--sr-c-small-text);
}

.box-chars-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 14px;
}

@media (min-width: 640px) {
  .box-chars-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.box-chars-group-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.box-chars-label {
  font-size: 11px;
}

.box-chars-row {
  color: #e5e5e5;
  letter-spacing: 0.15em;
}

.box-chars-note {
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

/* ── Cursor positioning ── */
.cursor-section {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cursor-desc {
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.cursor-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .cursor-layout {
    flex-direction: row;
  }
}

.cursor-grid-wrapper {
  flex: 1;
}

.cursor-grid {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  gap: 0;
  border: 1px solid var(--sr-c-bg-hover, #262626);
}

.cursor-cell {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.1s;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 10px;
  color: #333;
  border-right: 1px solid rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.cursor-cell:hover {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.cursor-cell-selected {
  background: #22c55e;
  color: #0a0a0a;
}

.cursor-info-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cursor-info-block {
  background: var(--sr-c-bg-section);
  padding: 10px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
}

/* ── Shared ── */
.esc-code {
  color: #eab308;
  font-size: 12px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.dim {
  color: var(--sr-c-small-text-muted);
}
</style>
