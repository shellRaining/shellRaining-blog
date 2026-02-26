<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { useResizeObserver } from "@vueuse/core";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";

const ROWS = 12;
const CELL_WIDTH = 12;
const DEMO_TEXT = "Hello, terminal world!";

const containerRef = ref<HTMLElement | null>(null);
const cols = ref(40);

function makeGrid(rows: number, columns: number, old?: string[][]) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: columns }, (_, c) => old?.[r]?.[c] ?? " "),
  );
}

const grid = ref<string[][]>(makeGrid(ROWS, cols.value));
const hoveredCell = ref<{ row: number; col: number } | null>(null);
const isTyping = ref(false);
const typingIndex = ref(0);

useResizeObserver(containerRef, (entries) => {
  const width = entries[0]?.contentRect.width;
  if (!width) return;
  const newCols = Math.max(20, Math.floor(width / CELL_WIDTH));
  cols.value = newCols;
  grid.value = makeGrid(ROWS, newCols, grid.value);
});

function clearGrid() {
  grid.value = makeGrid(ROWS, cols.value);
  typingIndex.value = 0;
  isTyping.value = false;
}

function startTyping() {
  clearGrid();
  isTyping.value = true;
  typingIndex.value = 0;
}

let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  [isTyping, typingIndex],
  () => {
    clearTimeout(timer);
    if (!isTyping.value) return;
    if (typingIndex.value >= DEMO_TEXT.length) {
      isTyping.value = false;
      return;
    }
    timer = setTimeout(() => {
      const i = typingIndex.value;
      if (i < cols.value) {
        grid.value[0][i] = DEMO_TEXT[i];
      }
      typingIndex.value++;
    }, 80);
  },
  { immediate: true },
);

onUnmounted(() => clearTimeout(timer));

function handleCellClick(row: number, col: number) {
  const chars = [" ", "#", "@", "*", "X", "O"];
  const idx = chars.indexOf(grid.value[row][col]);
  grid.value[row][col] = chars[(idx + 1) % chars.length];
}

function isCursor(row: number, col: number) {
  return isTyping.value && row === 0 && col === typingIndex.value;
}

function isHovered(row: number, col: number) {
  return hoveredCell.value?.row === row && hoveredCell.value?.col === col;
}
</script>

<template>
  <div class="grid-demo">
    <TerminalWindow no-padding>
      <div ref="containerRef" class="grid-container">
        <div
          class="grid-inner"
          :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }"
        >
          <template v-for="(row, rowIdx) in grid" :key="rowIdx">
            <div
              v-for="(char, colIdx) in row"
              :key="`${rowIdx}-${colIdx}`"
              :class="[
                'grid-cell',
                { hovered: isHovered(rowIdx, colIdx) },
                { cursor: isCursor(rowIdx, colIdx) },
              ]"
              @click="handleCellClick(rowIdx, colIdx)"
              @mouseenter="hoveredCell = { row: rowIdx, col: colIdx }"
              @mouseleave="hoveredCell = null"
            >
              <span :class="{ 'cursor-text': isCursor(rowIdx, colIdx) }">{{
                char
              }}</span>
            </div>
          </template>
        </div>
      </div>
    </TerminalWindow>

    <InfoPanel>
      <span v-if="hoveredCell">
        单元格
        <span class="cell-coord"
          >({{ hoveredCell.row }}, {{ hoveredCell.col }})</span
        >
      </span>
      <span v-else class="hint">将鼠标悬停在单元格上</span>
    </InfoPanel>

    <div class="actions">
      <TButton variant="primary" @click="startTyping">输入文本</TButton>
      <TButton @click="clearGrid">清空</TButton>
      <span class="hint">点击单元格可以绘制</span>
    </div>
  </div>
</template>

<style scoped>
.grid-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid-container {
  width: 100%;
}

.grid-inner {
  display: grid;
  gap: 0;
}

.grid-cell {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-right: 1px solid rgba(38, 38, 38, 0.8);
  border-bottom: 1px solid rgba(38, 38, 38, 0.8);
  cursor: pointer;
  transition: background-color 75ms;
  color: #e5e5e5;
}

.grid-cell:hover {
  background: rgba(38, 38, 38, 0.5);
}

.grid-cell.hovered {
  background: rgba(34, 197, 94, 0.2);
  box-shadow: inset 0 0 0 1px #22c55e;
}

.grid-cell.cursor {
  background: #22c55e;
}

.cursor-text {
  color: #0a0a0a;
}

.cell-coord {
  font-weight: 500;
  color: var(--sr-c-small-text);
}

.hint {
  color: var(--sr-c-small-text-muted);
  font-size: 13px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
</style>
