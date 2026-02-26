<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import InfoPanel from "./shared/InfoPanel.vue";

const COLOR_SEQUENCES = [
  { display: "^[[30m", desc: "Black", effect: "black", color: "#0a0a0a" },
  { display: "^[[31m", desc: "Red", effect: "red", color: "#f85149" },
  { display: "^[[32m", desc: "Green", effect: "green", color: "#22c55e" },
  { display: "^[[33m", desc: "Yellow", effect: "yellow", color: "#eab308" },
  { display: "^[[34m", desc: "Blue", effect: "blue", color: "#3b82f6" },
  { display: "^[[35m", desc: "Magenta", effect: "magenta", color: "#a855f7" },
  { display: "^[[36m", desc: "Cyan", effect: "cyan", color: "#06b6d4" },
  { display: "^[[37m", desc: "White", effect: "white", color: "#e5e5e5" },
  {
    display: "^[[90m",
    desc: "Bright Black",
    effect: "brightBlack",
    color: "#525252",
  },
  {
    display: "^[[91m",
    desc: "Bright Red",
    effect: "brightRed",
    color: "#ff7b72",
  },
  {
    display: "^[[92m",
    desc: "Bright Green",
    effect: "brightGreen",
    color: "#4ade80",
  },
  {
    display: "^[[93m",
    desc: "Bright Yellow",
    effect: "brightYellow",
    color: "#facc15",
  },
  {
    display: "^[[94m",
    desc: "Bright Blue",
    effect: "brightBlue",
    color: "#60a5fa",
  },
  {
    display: "^[[95m",
    desc: "Bright Magenta",
    effect: "brightMagenta",
    color: "#c084fc",
  },
  {
    display: "^[[96m",
    desc: "Bright Cyan",
    effect: "brightCyan",
    color: "#22d3ee",
  },
  {
    display: "^[[97m",
    desc: "Bright White",
    effect: "brightWhite",
    color: "#fafafa",
  },
];

const STYLE_SEQUENCES = [
  { display: "^[[1m", desc: "Bold", effect: "bold" },
  { display: "^[[4m", desc: "Underline", effect: "underline" },
  { display: "^[[0m", desc: "重置所有样式", effect: "reset" },
];

const CURSOR_SEQUENCES = [
  { display: "^[[2J", desc: "清除整个屏幕" },
  { display: "^[[H", desc: "移动光标到 (0,0)" },
  { display: "^[[5;10H", desc: "移动光标到第 5 行第 10 列" },
];

const demoText = ref("Hello World");
const activeColor = ref<string | null>(null);
const activeEffects = ref(new Set<string>());

function handleColorClick(effect: string) {
  activeColor.value = activeColor.value === effect ? null : effect;
}

function toggleEffect(effect: string) {
  if (effect === "reset") {
    activeColor.value = null;
    activeEffects.value = new Set();
    return;
  }
  const next = new Set(activeEffects.value);
  next.has(effect) ? next.delete(effect) : next.add(effect);
  activeEffects.value = next;
}

const activeColorObj = computed(() =>
  COLOR_SEQUENCES.find((c) => c.effect === activeColor.value),
);

const textStyle = computed(() => ({
  color: activeColorObj.value?.color,
  fontWeight: activeEffects.value.has("bold") ? "bold" : undefined,
  textDecoration: activeEffects.value.has("underline")
    ? "underline"
    : undefined,
}));

const activeSequenceList = computed(() => {
  const seqs: string[] = [];
  if (activeColor.value) {
    const c = activeColorObj.value;
    if (c) seqs.push(c.display);
  }
  activeEffects.value.forEach((e) => {
    const s = STYLE_SEQUENCES.find((s) => s.effect === e);
    if (s) seqs.push(s.display);
  });
  return seqs;
});
</script>

<template>
  <div class="escape-demo">
    <div class="escape-layout">
      <!-- Left: controls -->
      <div class="escape-controls">
        <!-- 16-Color Palette -->
        <div class="control-group">
          <div class="control-label">16 色调色板</div>
          <div class="color-row">
            <button
              v-for="seq in COLOR_SEQUENCES.slice(0, 8)"
              :key="seq.effect"
              :class="['esc-color', { selected: activeColor === seq.effect }]"
              :style="{ backgroundColor: seq.color }"
              :title="`${seq.desc} (${seq.display})`"
              @click="handleColorClick(seq.effect)"
            />
          </div>
          <div class="color-row">
            <button
              v-for="seq in COLOR_SEQUENCES.slice(8)"
              :key="seq.effect"
              :class="['esc-color', { selected: activeColor === seq.effect }]"
              :style="{ backgroundColor: seq.color }"
              :title="`${seq.desc} (${seq.display})`"
              @click="handleColorClick(seq.effect)"
            />
          </div>
          <div class="color-labels">
            <span>Normal (30-37)</span>
            <span>Bright (90-97)</span>
          </div>
        </div>

        <!-- Style Sequences -->
        <div class="control-group">
          <div class="control-label">样式序列</div>
          <div class="style-btns">
            <button
              v-for="seq in STYLE_SEQUENCES"
              :key="seq.effect"
              :class="['style-btn', { active: activeEffects.has(seq.effect) }]"
              @click="toggleEffect(seq.effect)"
            >
              <code class="esc-code">{{ seq.display }}</code>
              <span>{{ seq.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Cursor Sequences -->
        <div class="control-group">
          <div class="control-label">光标序列</div>
          <div class="cursor-list">
            <div
              v-for="seq in CURSOR_SEQUENCES"
              :key="seq.display"
              class="cursor-item"
            >
              <code class="esc-code">{{ seq.display }}</code>
              <span class="dim">{{ seq.desc }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: preview -->
      <div class="escape-preview">
        <div class="control-label">预览</div>
        <TerminalWindow>
          <div class="preview-inner">
            <div class="preview-status">
              {{
                activeSequenceList.length === 0
                  ? "未激活任何转义序列"
                  : `激活: ${activeSequenceList.join(" ")}`
              }}
            </div>
            <div class="preview-text">
              <span :style="textStyle">{{ demoText }}</span>
            </div>
            <input
              v-model="demoText"
              type="text"
              class="preview-input"
              placeholder="输入文本..."
            />
          </div>
        </TerminalWindow>

        <InfoPanel v-if="activeColorObj" class="color-info">
          <div class="color-info-inner">
            <div
              class="color-info-swatch"
              :style="{ backgroundColor: activeColorObj.color }"
            />
            <div>
              <span class="fg-text">{{ activeColorObj.desc }}</span>
              <code class="esc-code" style="margin-left: 8px">{{
                activeColorObj.display
              }}</code>
            </div>
          </div>
        </InfoPanel>
      </div>
    </div>

    <div class="footnote">
      <code class="esc-code">^[</code> 表示
      <code class="esc-code">ESC</code> 字符（字节 0x1B）。16 色调色板使用代码
      30-37 表示普通色，90-97 表示亮色变体。
    </div>
  </div>
</template>

<style scoped>
.escape-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.escape-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .escape-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.escape-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.escape-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--sr-c-small-text-muted);
  letter-spacing: 0.05em;
}

/* Color palette */
.color-row {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.esc-color {
  height: 28px;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  transition: box-shadow 0.15s;
}

.esc-color.selected {
  box-shadow:
    0 0 0 2px var(--sr-c-bg),
    0 0 0 4px var(--sr-c-small-text-hover);
}

.color-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--sr-c-small-text-muted);
  padding: 0 2px;
}

/* Style buttons */
.style-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-btn {
  padding: 6px 12px;
  border: var(--sr-border);
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--sr-c-small-text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.style-btn:hover {
  color: var(--sr-c-small-text-hover);
}

.style-btn.active {
  border-color: var(--sr-c-small-text-hover);
  background: rgba(255, 255, 255, 0.05);
  color: var(--sr-c-small-text-hover);
}

/* Cursor list */
.cursor-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cursor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: var(--sr-border);
  border-radius: 6px;
  font-size: 13px;
}

/* Preview */
.preview-inner {
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.preview-status {
  font-size: 12px;
  color: #525252;
  margin-bottom: 16px;
}

.preview-text {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #e5e5e5;
}

.preview-input {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #262626;
  padding: 8px 12px;
  font-size: 13px;
  color: #e5e5e5;
  margin-top: 16px;
  outline: none;
  border-radius: 4px;
  font-family: inherit;
}

.preview-input:focus {
  border-color: #525252;
}

.preview-input::placeholder {
  color: #525252;
}

/* Color info */
.color-info-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-info-swatch {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 3px;
}

/* Shared */
.esc-code {
  color: #eab308;
  font-size: 12px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.dim {
  color: var(--sr-c-small-text-muted);
}

.fg-text {
  color: var(--sr-c-small-text);
}

.footnote {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
}
</style>
