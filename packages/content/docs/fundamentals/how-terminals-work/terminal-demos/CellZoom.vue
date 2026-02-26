<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import InfoPanel from "./shared/InfoPanel.vue";

// --- Cell Zoom ---
const COLORS: Record<string, string> = {
  black: "#0a0a0a",
  red: "#f85149",
  green: "#22c55e",
  yellow: "#eab308",
  blue: "#3b82f6",
  magenta: "#a855f7",
  cyan: "#06b6d4",
  white: "#e5e5e5",
  brightBlack: "#525252",
  brightRed: "#ff7b72",
  brightGreen: "#4ade80",
  brightYellow: "#facc15",
  brightBlue: "#60a5fa",
  brightMagenta: "#c084fc",
  brightCyan: "#22d3ee",
  brightWhite: "#fafafa",
};

const BG_COLORS: Record<string, string> = {
  none: "transparent",
  dim: "#171717",
  green: "#22c55e33",
  red: "#f8514933",
  blue: "#3b82f633",
  yellow: "#eab30833",
  magenta: "#a855f733",
  cyan: "#06b6d433",
};

const char = ref("A");
const fg = ref("green");
const bg = ref("none");
const bold = ref(false);
const underline = ref(false);

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%".split("").slice(0, 20);

// --- Color Depth Explorer ---
type ColorMode = "16" | "256" | "truecolor";
const colorMode = ref<ColorMode>("16");
const hue = ref(180);
const sat = ref(80);
const light = ref(50);
const selected256 = ref(196);

function generate256Colors(): string[] {
  const colors: string[] = [];
  const standard16 = [
    "#000000",
    "#cd0000",
    "#00cd00",
    "#cdcd00",
    "#0000ee",
    "#cd00cd",
    "#00cdcd",
    "#e5e5e5",
    "#7f7f7f",
    "#ff0000",
    "#00ff00",
    "#ffff00",
    "#5c5cff",
    "#ff00ff",
    "#00ffff",
    "#ffffff",
  ];
  colors.push(...standard16);
  const levels = [0, 95, 135, 175, 215, 255];
  for (let r = 0; r < 6; r++)
    for (let g = 0; g < 6; g++)
      for (let b = 0; b < 6; b++)
        colors.push(`rgb(${levels[r]}, ${levels[g]}, ${levels[b]})`);
  for (let i = 0; i < 24; i++) {
    const gray = 8 + i * 10;
    colors.push(`rgb(${gray}, ${gray}, ${gray})`);
  }
  return colors;
}

const colors256 = generate256Colors();

const truecolorValue = computed(
  () => `hsl(${hue.value}, ${sat.value}%, ${light.value}%)`,
);

function hslToRgb(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round((l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255);
  };
  return { r: f(0), g: f(8), b: f(4) };
}

const rgb = computed(() => hslToRgb(hue.value, sat.value, light.value));

const colorModes = [
  { mode: "16" as ColorMode, label: "16 色", desc: "经典 ANSI" },
  { mode: "256" as ColorMode, label: "256 色", desc: "扩展调色板" },
  { mode: "truecolor" as ColorMode, label: "真彩色", desc: "1600 万色" },
];

function shortName(name: string) {
  return name.replace("bright", "br");
}
</script>

<template>
  <div class="cell-zoom">
    <!-- Cell Inspector -->
    <div class="inspector">
      <TerminalWindow>
        <div class="cell-preview">
          <div
            class="big-cell"
            :class="{ 'is-bold': bold, 'is-underline': underline }"
            :style="{ color: COLORS[fg], backgroundColor: BG_COLORS[bg] }"
          >
            {{ char }}
          </div>
        </div>
      </TerminalWindow>

      <div class="controls">
        <!-- Character -->
        <div class="control-group">
          <div class="control-label">字符</div>
          <div class="char-grid">
            <button
              v-for="c in chars"
              :key="c"
              :class="['char-btn', { active: char === c }]"
              @click="char = c"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <!-- Foreground -->
        <div class="control-group">
          <div class="control-label">前景色</div>
          <div class="color-grid">
            <button
              v-for="(color, name) in COLORS"
              :key="name"
              :class="['color-swatch', { selected: fg === name }]"
              :style="{ backgroundColor: color }"
              :title="name"
              @click="fg = name"
            />
          </div>
        </div>

        <!-- Background -->
        <div class="control-group">
          <div class="control-label">背景色</div>
          <div class="color-grid">
            <button
              v-for="(color, name) in BG_COLORS"
              :key="name"
              :class="['color-swatch', 'bg-swatch', { selected: bg === name }]"
              :style="{ backgroundColor: name === 'none' ? '#0a0a0a' : color }"
              :title="name"
              @click="bg = name"
            />
          </div>
        </div>

        <!-- Attributes -->
        <div class="control-group">
          <div class="control-label">属性</div>
          <div class="attr-row">
            <label class="attr-label">
              <input type="checkbox" v-model="bold" />
              <span :class="{ 'is-bold': bold, active: bold }">Bold</span>
            </label>
            <label class="attr-label">
              <input type="checkbox" v-model="underline" />
              <span :class="{ 'is-underline': underline, active: underline }"
                >Underline</span
              >
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Panel -->
    <InfoPanel>
      <span class="dim">单元格: </span>
      <span class="fg-text">"{{ char }}"</span>
      <span class="dim"> / </span>
      <span :style="{ color: COLORS[fg] }">{{ fg }}</span>
      <template v-if="bg !== 'none'">
        <span class="dim"> on </span>
        <span>{{ bg }}</span>
      </template>
      <template v-if="bold">
        <span class="dim"> / </span>
        <span class="is-bold fg-text">bold</span>
      </template>
      <template v-if="underline">
        <span class="dim"> / </span>
        <span class="is-underline fg-text">underlined</span>
      </template>
    </InfoPanel>

    <!-- Color Depth Explorer -->
    <div class="depth-explorer">
      <div>
        <h3 class="depth-title">终端色彩深度</h3>
        <p class="depth-desc">
          现代终端不只支持 16 色。你可以在下面的区域探索不同的颜色模式
        </p>
      </div>

      <!-- Mode selector -->
      <div class="mode-selector">
        <button
          v-for="m in colorModes"
          :key="m.mode"
          :class="['mode-btn', { active: colorMode === m.mode }]"
          @click="colorMode = m.mode"
        >
          <div class="mode-label">{{ m.label }}</div>
          <div class="mode-desc">{{ m.desc }}</div>
        </button>
      </div>

      <!-- 16 colors -->
      <div v-if="colorMode === '16'" class="mode-content">
        <div class="control-label">原始 16 色</div>
        <div class="ansi16-grid">
          <div v-for="(color, name) in COLORS" :key="name" class="ansi16-item">
            <div
              class="ansi16-swatch"
              :style="{ backgroundColor: color }"
              :title="name"
            />
            <div class="ansi16-name">{{ shortName(name) }}</div>
          </div>
        </div>
        <div class="escape-box">
          <div class="dim">转义序列格式:</div>
          <div>
            <span class="esc-yellow">^[[38;5;</span>
            <span class="esc-cyan">&lt;0-15&gt;</span>
            <span class="esc-yellow">m</span>
            <span class="dim"> — 前景色</span>
          </div>
          <div>
            <span class="esc-yellow">^[[48;5;</span>
            <span class="esc-cyan">&lt;0-15&gt;</span>
            <span class="esc-yellow">m</span>
            <span class="dim"> — 背景色</span>
          </div>
        </div>
      </div>

      <!-- 256 colors -->
      <div v-if="colorMode === '256'" class="mode-content">
        <div class="control-label">256 色扩展调色板</div>

        <div>
          <div class="palette-label">标准 16 色 (0-15)</div>
          <div class="palette-row">
            <button
              v-for="(color, i) in colors256.slice(0, 16)"
              :key="i"
              :class="[
                'palette-cell',
                'palette-cell-lg',
                { selected: selected256 === i },
              ]"
              :style="{ backgroundColor: color }"
              @click="selected256 = i"
            />
          </div>
        </div>

        <div>
          <div class="palette-label">6x6x6 色彩立方 (16-231)</div>
          <div class="cube-grid">
            <button
              v-for="(color, i) in colors256.slice(16, 232)"
              :key="i + 16"
              :class="[
                'palette-cell',
                'palette-cell-sm',
                { selected: selected256 === i + 16 },
              ]"
              :style="{ backgroundColor: color }"
              @click="selected256 = i + 16"
            />
          </div>
        </div>

        <div>
          <div class="palette-label">灰度 (232-255)</div>
          <div class="palette-row">
            <button
              v-for="(color, i) in colors256.slice(232)"
              :key="i + 232"
              :class="[
                'palette-cell',
                'palette-cell-lg',
                { selected: selected256 === i + 232 },
              ]"
              :style="{ backgroundColor: color }"
              @click="selected256 = i + 232"
            />
          </div>
        </div>

        <div class="selected-info">
          <div
            class="selected-preview"
            :style="{ backgroundColor: colors256[selected256] }"
          />
          <div class="selected-detail">
            <div class="fg-text">Color {{ selected256 }}</div>
            <div class="esc-yellow" style="font-size: 12px">
              ^[[38;5;{{ selected256 }}m
            </div>
          </div>
        </div>
      </div>

      <!-- Truecolor -->
      <div v-if="colorMode === 'truecolor'" class="mode-content">
        <div class="control-label">24 位真彩色 (1600 万色)</div>

        <div class="truecolor-layout">
          <div class="sliders">
            <div>
              <label class="slider-label">色相: {{ hue }}°</label>
              <input
                type="range"
                min="0"
                max="360"
                v-model.number="hue"
                class="slider hue-slider"
              />
            </div>
            <div>
              <label class="slider-label">饱和度: {{ sat }}%</label>
              <input
                type="range"
                min="0"
                max="100"
                v-model.number="sat"
                class="slider"
              />
            </div>
            <div>
              <label class="slider-label">亮度: {{ light }}%</label>
              <input
                type="range"
                min="0"
                max="100"
                v-model.number="light"
                class="slider"
              />
            </div>
          </div>

          <div class="truecolor-preview">
            <div
              class="truecolor-swatch"
              :style="{ backgroundColor: truecolorValue }"
            />
            <div class="fg-text">
              RGB({{ rgb.r }}, {{ rgb.g }}, {{ rgb.b }})
            </div>
            <div class="esc-yellow" style="font-size: 12px">
              ^[[38;2;{{ rgb.r }};{{ rgb.g }};{{ rgb.b }}m
            </div>
          </div>
        </div>

        <div>
          <div class="palette-label">平滑渐变 (仅真彩色可实现)</div>
          <div class="gradient-bar" />
        </div>
      </div>

      <!-- Comparison -->
      <div class="comparison">
        <div class="palette-label">颜色数量对比:</div>
        <div class="comparison-grid">
          <div>
            <div class="comparison-num" style="color: #22c55e">16</div>
            <div class="dim">经典 ANSI</div>
          </div>
          <div>
            <div class="comparison-num" style="color: #06b6d4">256</div>
            <div class="dim">扩展</div>
          </div>
          <div>
            <div class="comparison-num" style="color: #a855f7">16,777,216</div>
            <div class="dim">真彩色 (24-bit)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cell-zoom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* --- Inspector layout --- */
.inspector {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 768px) {
  .inspector {
    flex-direction: row;
    align-items: flex-start;
  }
}

.cell-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.big-cell {
  width: 112px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  border: 1px solid #262626;
  transition: all 0.2s;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.is-bold {
  font-weight: bold;
}

.is-underline {
  text-decoration: underline;
}

.controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

/* --- Char grid --- */
.char-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.char-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--sr-border);
  background: transparent;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--sr-c-small-text-muted);
  border-radius: 4px;
}

.char-btn:hover {
  border-color: var(--sr-c-bg-hover);
  color: var(--sr-c-small-text-hover);
}

.char-btn.active {
  border-color: var(--sr-c-small-text-hover);
  background: rgba(255, 255, 255, 0.05);
  color: var(--sr-c-small-text-hover);
}

/* --- Color swatches --- */
.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: box-shadow 0.15s;
}

.color-swatch.selected {
  box-shadow:
    0 0 0 2px var(--sr-c-bg),
    0 0 0 4px var(--sr-c-small-text-hover);
}

.bg-swatch {
  border: 1px solid var(--sr-c-border);
}

/* --- Attributes --- */
.attr-row {
  display: flex;
  gap: 16px;
}

.attr-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
}

.attr-label input {
  width: 16px;
  height: 16px;
  accent-color: var(--sr-c-small-text-hover);
}

.attr-label .active {
  color: var(--sr-c-small-text-hover);
}

/* --- Info text helpers --- */
.dim {
  color: var(--sr-c-small-text-muted);
}

.fg-text {
  font-weight: 500;
  color: var(--sr-c-small-text);
}

/* --- Color Depth Explorer --- */
.depth-explorer {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.depth-title {
  font-size: 14px;
  font-weight: 600;
  color: #f85149;
  margin: 0 0 6px;
}

.depth-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  margin: 0;
}

/* --- Mode selector --- */
.mode-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mode-btn {
  padding: 8px 16px;
  font-size: 13px;
  border: var(--sr-border);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--sr-c-small-text-muted);
  text-align: left;
}

.mode-btn:hover {
  color: var(--sr-c-small-text-hover);
}

.mode-btn.active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.mode-label {
  font-weight: 600;
}

.mode-desc {
  font-size: 11px;
  opacity: 0.7;
}

/* --- Mode content --- */
.mode-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 16 color grid */
.ansi16-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.ansi16-item {
  text-align: center;
}

.ansi16-swatch {
  height: 32px;
  border: 1px solid rgba(38, 38, 38, 0.5);
  border-radius: 2px;
}

.ansi16-name {
  font-size: 9px;
  color: var(--sr-c-small-text-muted);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Escape box */
.escape-box {
  background: #0a0a0a;
  padding: 12px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 4px;
  color: #e5e5e5;
}

.esc-yellow {
  color: #eab308;
}

.esc-cyan {
  color: #06b6d4;
}

/* --- 256 palette --- */
.palette-label {
  font-size: 11px;
  color: var(--sr-c-small-text-muted);
  margin-bottom: 4px;
}

.palette-row {
  display: flex;
  gap: 1px;
}

.palette-cell {
  border: none;
  cursor: pointer;
  padding: 0;
  transition: box-shadow 0.1s;
}

.palette-cell.selected {
  box-shadow: 0 0 0 2px var(--sr-c-small-text-hover);
  z-index: 1;
  position: relative;
}

.palette-cell-lg {
  flex: 1;
  height: 24px;
}

.palette-cell-sm {
  height: 12px;
}

.cube-grid {
  display: grid;
  grid-template-columns: repeat(36, 1fr);
  gap: 1px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #0a0a0a;
  padding: 12px;
  border-radius: 4px;
}

.selected-preview {
  width: 48px;
  height: 48px;
  border: 1px solid #262626;
  flex-shrink: 0;
}

.selected-detail {
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
  color: #e5e5e5;
}

/* --- Truecolor --- */
.truecolor-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .truecolor-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.slider-label {
  font-size: 11px;
  color: var(--sr-c-small-text-muted);
  display: block;
  margin-bottom: 4px;
}

.slider {
  width: 100%;
  height: 12px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--sr-c-bg-hover);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--sr-c-btn);
  cursor: pointer;
}

.hue-slider {
  background: linear-gradient(
    to right,
    hsl(0, 80%, 50%),
    hsl(60, 80%, 50%),
    hsl(120, 80%, 50%),
    hsl(180, 80%, 50%),
    hsl(240, 80%, 50%),
    hsl(300, 80%, 50%),
    hsl(360, 80%, 50%)
  );
}

.truecolor-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
}

.truecolor-swatch {
  width: 96px;
  height: 96px;
  border: 1px solid #262626;
}

.gradient-bar {
  height: 32px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    hsl(0, 80%, 50%),
    hsl(60, 80%, 50%),
    hsl(120, 80%, 50%),
    hsl(180, 80%, 50%),
    hsl(240, 80%, 50%),
    hsl(300, 80%, 50%),
    hsl(360, 80%, 50%)
  );
}

/* --- Comparison --- */
.comparison {
  border-top: var(--sr-border);
  padding-top: 16px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  text-align: center;
  font-size: 13px;
}

.comparison-num {
  font-weight: 700;
}
</style>
