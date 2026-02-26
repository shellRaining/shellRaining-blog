<script setup lang="ts">
import { ref } from "vue";
import { useResizeObserver } from "@vueuse/core";
import TerminalWindow from "./TerminalWindow.vue";

const GRID_ROWS = 10;
const CELL_WIDTH = 20;

interface ClickInfo {
  x: number;
  y: number;
  button: number;
  sequence: string;
  bytes: string;
}

const containerRef = ref<HTMLElement | null>(null);
const cols = ref(20);
const lastClick = ref<ClickInfo | null>(null);
const mouseEnabled = ref(true);

useResizeObserver(containerRef, (entries) => {
  const width = entries[0]?.contentRect.width;
  if (!width) return;
  cols.value = Math.max(10, Math.floor(width / CELL_WIDTH));
});

function handleCellClick(row: number, col: number, e: MouseEvent) {
  if (!mouseEnabled.value) return;
  const x = col + 1 + 32;
  const y = row + 1 + 32;
  const button = e.button + 32;
  lastClick.value = {
    x: col + 1,
    y: row + 1,
    button: e.button,
    sequence: `^[[M${String.fromCharCode(button)}${String.fromCharCode(x)}${String.fromCharCode(y)}`,
    bytes: `1b 5b 4d ${button.toString(16)} ${x.toString(16)} ${y.toString(16)}`,
  };
}

function onContextMenu(row: number, col: number, e: MouseEvent) {
  e.preventDefault();
  handleCellClick(row, col, e);
}

function isClicked(row: number, col: number) {
  return lastClick.value?.x === col + 1 && lastClick.value?.y === row + 1;
}

const buttonNames = ["左键", "中键", "右键"];
</script>

<template>
  <div class="mouse-demo">
    <TerminalWindow>
      <div class="mouse-inner">
        <div class="mouse-header">
          <label class="mouse-toggle">
            <input type="checkbox" v-model="mouseEnabled" />
            <span>
              鼠标追踪
              <span :class="mouseEnabled ? 'enabled' : 'disabled'">
                {{ mouseEnabled ? "已启用" : "已禁用" }}
              </span>
            </span>
          </label>
          <code class="val-yellow">^[[?1000h</code>
        </div>

        <div
          ref="containerRef"
          :class="['mouse-grid-wrapper', { dimmed: !mouseEnabled }]"
        >
          <div
            class="mouse-grid"
            :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }"
          >
            <template v-for="row in GRID_ROWS" :key="row">
              <div
                v-for="col in cols"
                :key="`${row}-${col}`"
                :class="[
                  'mouse-cell',
                  { clicked: isClicked(row - 1, col - 1) },
                ]"
                @click="handleCellClick(row - 1, col - 1, $event)"
                @contextmenu="onContextMenu(row - 1, col - 1, $event)"
              >
                {{ isClicked(row - 1, col - 1) ? "×" : "" }}
              </div>
            </template>
          </div>
        </div>

        <div v-if="lastClick && mouseEnabled" class="click-info">
          <div class="click-stats">
            <div class="click-stat">
              <div class="click-stat-label">位置</div>
              <div class="click-stat-value">
                ({{ lastClick.x }}, {{ lastClick.y }})
              </div>
            </div>
            <div class="click-stat">
              <div class="click-stat-label">按钮</div>
              <div class="val-yellow">{{ buttonNames[lastClick.button] }}</div>
            </div>
            <div class="click-stat">
              <div class="click-stat-label">序列</div>
              <code class="val-cyan">{{ lastClick.sequence }}</code>
            </div>
          </div>
          <div class="click-bytes">
            <span class="dim">字节: </span>
            <code class="val-yellow">{{ lastClick.bytes }}</code>
          </div>
        </div>
        <div v-else class="click-placeholder">
          {{ mouseEnabled ? "点击网格中的任意位置" : "启用鼠标追踪以捕获点击" }}
        </div>
      </div>
    </TerminalWindow>

    <div class="footnote">
      同理默认情况下终端不会发送鼠标事件。程序需要主动请求鼠标追踪，之后点击会变成带有坐标信息的转义序列。
    </div>
  </div>
</template>

<style scoped>
.mouse-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mouse-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mouse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.mouse-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #a3a3a3;
}

.mouse-toggle input {
  width: 16px;
  height: 16px;
  accent-color: #e5e5e5;
}

.enabled {
  color: #e5e5e5;
}

.disabled {
  color: #525252;
}

.mouse-grid-wrapper {
  border: 1px solid #262626;
  transition: opacity 0.2s;
}

.mouse-grid-wrapper.dimmed {
  opacity: 0.5;
}

.mouse-grid {
  display: grid;
  gap: 0;
}

.mouse-cell {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-right: 1px solid rgba(38, 38, 38, 0.8);
  border-bottom: 1px solid rgba(38, 38, 38, 0.8);
  cursor: crosshair;
  transition: background-color 75ms;
  color: #e5e5e5;
}

.mouse-cell:hover {
  background: #262626;
}

.mouse-cell.clicked {
  background: #e5e5e5;
  color: #0a0a0a;
}

/* Click info */
.click-info {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.click-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  text-align: center;
  font-size: 13px;
}

.click-stat-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #525252;
  margin-bottom: 4px;
}

.click-stat-value {
  color: #e5e5e5;
}

.click-bytes {
  text-align: center;
  font-size: 13px;
}

.click-placeholder {
  text-align: center;
  font-size: 13px;
  color: #a3a3a3;
  padding: 14px;
}

/* Shared */
.val-yellow {
  color: #eab308;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 12px;
}

.val-cyan {
  color: #06b6d4;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
}

.dim {
  color: #525252;
}

.footnote {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
}
</style>
