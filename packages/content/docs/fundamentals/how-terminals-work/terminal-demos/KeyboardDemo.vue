<script setup lang="ts">
import { ref } from "vue";
import TerminalWindow from "./TerminalWindow.vue";

const SPECIAL_KEYS: Record<
  string,
  { bytes: string; sequence: string; desc: string }
> = {
  ArrowUp: { bytes: "1b 5b 41", sequence: "^[[A", desc: "光标上移" },
  ArrowDown: { bytes: "1b 5b 42", sequence: "^[[B", desc: "光标下移" },
  ArrowRight: { bytes: "1b 5b 43", sequence: "^[[C", desc: "光标右移" },
  ArrowLeft: { bytes: "1b 5b 44", sequence: "^[[D", desc: "光标左移" },
  Enter: { bytes: "0d", sequence: "^M", desc: "回车" },
  Tab: { bytes: "09", sequence: "^I", desc: "水平制表符" },
  Backspace: { bytes: "7f", sequence: "^?", desc: "删除" },
  Escape: { bytes: "1b", sequence: "^[", desc: "Escape" },
};

interface KeyInfo {
  key: string;
  bytes: string;
  sequence: string;
  desc: string;
}

const lastKey = ref<KeyInfo | null>(null);
const history = ref<KeyInfo[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);

function handleKeyDown(e: KeyboardEvent) {
  const special = SPECIAL_KEYS[e.code] || SPECIAL_KEYS[e.key];
  const keyInfo: KeyInfo = special
    ? {
        key: e.key,
        bytes: special.bytes,
        sequence: special.sequence,
        desc: special.desc,
      }
    : {
        key: e.key,
        bytes: e.key.charCodeAt(0).toString(16).padStart(2, "0"),
        sequence: e.key,
        desc: `字符 '${e.key}'`,
      };
  if (special) e.preventDefault();
  lastKey.value = keyInfo;
  history.value = [keyInfo, ...history.value].slice(0, 8);
}

function displayKey(key: string) {
  return key === " " ? "Space" : key;
}

function displayKeyShort(key: string) {
  return key === " " ? "␣" : key;
}
</script>

<template>
  <div class="keyboard-demo">
    <TerminalWindow>
      <div class="keyboard-area" @click="inputRef?.focus()">
        <input
          ref="inputRef"
          type="text"
          class="hidden-input"
          @keydown="handleKeyDown"
        />
        <div v-if="lastKey" class="key-display">
          <div class="key-name">{{ displayKey(lastKey.key) }}</div>
          <div class="key-details">
            <div class="key-box">
              <div class="key-box-label">字节</div>
              <code class="val-yellow">{{ lastKey.bytes }}</code>
            </div>
            <div class="key-box">
              <div class="key-box-label">序列</div>
              <code class="val-cyan">{{ lastKey.sequence }}</code>
            </div>
          </div>
          <div class="key-desc">{{ lastKey.desc }}</div>
        </div>
        <div v-else class="key-placeholder">
          <div>按下任意键</div>
          <div class="key-hint">试试方向键、Enter、Tab 或字母</div>
        </div>
      </div>
    </TerminalWindow>

    <div v-if="history.length > 0" class="key-history">
      <div
        v-for="(k, i) in history"
        :key="i"
        class="history-item"
        :style="{ opacity: 1 - i * 0.1 }"
      >
        <span class="history-key">{{ displayKeyShort(k.key) }}</span>
        <span class="dim">→</span>
        <code class="val-yellow">{{ k.bytes }}</code>
      </div>
    </div>

    <div class="footnote">
      当你按下方向键时，终端不会发送"上移"，它发送的是
      <code class="val-yellow">ESC [ A</code
      >（三个字节）。不理解这个序列的程序会直接打印出
      <code class="val-cyan">^[[A</code>。
    </div>
  </div>
</template>

<style scoped>
.keyboard-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.keyboard-area {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: text;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.key-display {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.key-name {
  font-size: 28px;
  font-weight: 500;
  color: #e5e5e5;
}

.key-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.key-box {
  background: #0a0a0a;
  padding: 10px;
  border-radius: 4px;
}

.key-box-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #525252;
  margin-bottom: 4px;
}

.key-desc {
  font-size: 13px;
  color: #a3a3a3;
}

.key-placeholder {
  text-align: center;
  color: #a3a3a3;
  font-size: 15px;
}

.key-hint {
  font-size: 13px;
  color: #525252;
  margin-top: 4px;
}

/* History */
.key-history {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-key {
  color: var(--sr-c-small-text);
  font-weight: 500;
}

/* Shared */
.val-yellow {
  color: #eab308;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
}

.val-cyan {
  color: #06b6d4;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
}

.dim {
  color: var(--sr-c-small-text-muted);
}

.footnote {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
}
</style>
