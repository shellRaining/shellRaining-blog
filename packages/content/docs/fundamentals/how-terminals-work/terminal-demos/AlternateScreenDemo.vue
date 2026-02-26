<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import StepNavigation from "./shared/StepNavigation.vue";

const isAlternateScreen = ref(false);

const normalLines = [
  { text: "$ ls -la", type: "command" },
  {
    text: "-rw-r--r--  1 user staff  847 Jan  8 10:30 package.json",
    type: "perm",
  },
  {
    text: "-rw-r--r--  1 user staff 1205 Jan  8 10:28 README.md",
    type: "perm",
  },
  { text: "drwxr-xr-x 12 user staff  384 Jan  8 10:30 src", type: "perm" },
  { text: "$ git status", type: "command" },
  { text: "On branch main", type: "normal" },
  { text: "nothing to commit, working tree clean", type: "normal" },
  { text: "$ vim README.md", type: "command" },
];

const vimContentLines = [
  "# README",
  "",
  "This is a sample project.",
  "",
  "## Installation",
  "",
  "npm install",
];

const vimEmptyLineCount = 4;

function toggleScreen() {
  isAlternateScreen.value = !isAlternateScreen.value;
}

const toggleLabel = computed(() =>
  isAlternateScreen.value ? "退出 vim (:q)" : "打开 vim",
);

const bufferLabel = computed(() =>
  isAlternateScreen.value ? "备用缓冲区" : "普通缓冲区",
);

const bufferColor = computed(() =>
  isAlternateScreen.value ? "#06b6d4" : "#22c55e",
);

// Explainer steps
const EXPLAINER_STEPS = {
  what: {
    title: "什么是备用屏幕？",
    description:
      "终端有两个屏幕缓冲区：普通屏幕（包含你的滚动历史）和备用屏幕（独立画布）。程序可以在它们之间切换。退出时，你的原始屏幕重新出现。",
  },
  why: {
    title: "为什么需要它？",
    description:
      "没有备用屏幕，vim 这样的全屏应用会覆盖你的终端历史。退出时，你会看到 vim 的最后画面混在旧输出中。备用屏幕保持你的滚动历史干净。",
  },
  how: {
    title: "工作原理",
    description:
      "程序发送转义序列 ^[[?1049h 进入备用屏幕模式。退出时发送 ^[[?1049l 返回普通屏幕。终端交换缓冲区，保留你的历史。",
  },
  apps: {
    title: "使用它的应用",
    description:
      "vim、less、man、htop、tmux 和大多数 TUI 应用使用备用屏幕。当你退出这些应用时，注意到之前的终端输出重新出现了吗？这就是备用屏幕的作用。",
  },
};

type ExplainerStep = keyof typeof EXPLAINER_STEPS;

const currentStep = ref<ExplainerStep>("what");
const steps = Object.keys(EXPLAINER_STEPS) as ExplainerStep[];
const stepContent = computed(() => EXPLAINER_STEPS[currentStep.value]);
</script>

<template>
  <div class="alt-screen-demo">
    <!-- Main layout -->
    <div class="main-layout">
      <!-- Left: Terminal -->
      <div class="terminal-section">
        <div class="terminal-header">
          <TButton @click="toggleScreen">
            {{ toggleLabel }}
          </TButton>
          <span
            class="buffer-badge"
            :style="{
              color: bufferColor,
              borderColor: bufferColor,
              backgroundColor: bufferColor + '15',
            }"
          >
            {{ bufferLabel }}
          </span>
        </div>

        <TerminalWindow>
          <div class="screen-container">
            <!-- Normal screen -->
            <div
              :class="[
                'screen',
                'screen-normal',
                {
                  'screen-active': !isAlternateScreen,
                  'screen-hidden': isAlternateScreen,
                },
              ]"
            >
              <div
                v-for="(line, idx) in normalLines"
                :key="idx"
                :class="{
                  'line-command': line.type === 'command',
                  'line-perm': line.type === 'perm',
                }"
              >
                {{ line.text }}
              </div>
            </div>

            <!-- Alternate screen (vim) -->
            <div
              :class="[
                'screen',
                'screen-alternate',
                {
                  'screen-active': isAlternateScreen,
                  'screen-hidden': !isAlternateScreen,
                },
              ]"
            >
              <div class="vim-header">README.md [+]</div>
              <div class="vim-body">
                <div
                  v-for="(line, idx) in vimContentLines"
                  :key="'content-' + idx"
                  class="vim-line"
                >
                  <span class="vim-lineno">{{ idx + 1 }}</span>
                  <span>{{ line || " " }}</span>
                </div>
                <div
                  v-for="n in vimEmptyLineCount"
                  :key="'empty-' + n"
                  class="vim-line"
                >
                  <span class="vim-lineno">{{ " " }}</span>
                  <span class="vim-tilde">~</span>
                </div>
              </div>
              <div class="vim-statusbar">
                <span class="vim-mode">-- INSERT --</span>
                <span class="vim-pos">1,1&nbsp;&nbsp;&nbsp;All</span>
              </div>
            </div>
          </div>
        </TerminalWindow>
      </div>

      <!-- Right: Escape sequences panel -->
      <div class="sequences-section">
        <div class="control-label">转义序列</div>

        <div class="seq-cards">
          <div :class="['seq-card', { 'seq-card-active': !isAlternateScreen }]">
            <div class="seq-card-header">
              <span class="seq-card-title">进入备用屏幕</span>
              <code class="esc-code">^[[?1049h</code>
            </div>
            <div class="seq-card-desc dim">
              保存当前屏幕，清除显示，切换到备用缓冲区。打开 vim、less、htop
              等时发送。
            </div>
          </div>

          <div :class="['seq-card', { 'seq-card-active': isAlternateScreen }]">
            <div class="seq-card-header">
              <span class="seq-card-title">退出备用屏幕</span>
              <code class="esc-code">^[[?1049l</code>
            </div>
            <div class="seq-card-desc dim">
              恢复保存的屏幕缓冲区。之前的终端内容完好如初地重新出现。退出应用时发送。
            </div>
          </div>
        </div>

        <div class="buffer-diagram">
          <div
            :class="[
              'buffer-box',
              { 'buffer-box-active-normal': !isAlternateScreen },
            ]"
          >
            <div class="buffer-box-label">普通缓冲区</div>
            <div class="buffer-box-content dim">滚动历史</div>
            <div class="buffer-box-content dim">命令输出</div>
          </div>
          <div class="buffer-arrow dim">&#8644;</div>
          <div
            :class="[
              'buffer-box',
              { 'buffer-box-active-alt': isAlternateScreen },
            ]"
          >
            <div class="buffer-box-label">备用缓冲区</div>
            <div class="buffer-box-content dim">独立画布</div>
            <div class="buffer-box-content dim">全屏应用</div>
          </div>
        </div>
        <p class="buffer-hint dim">
          同一时间只有一个缓冲区可见，另一个保存在内存中。
        </p>
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
      <p class="detail-desc" style="margin-top: 10px">
        {{ stepContent.description }}
      </p>
    </InfoPanel>

    <!-- Comparison section -->
    <div class="comparison">
      <h3 class="comparison-title">没有备用屏幕会怎样？</h3>
      <div class="comparison-grid">
        <div class="comparison-terminal">
          <div class="comparison-label">
            <span class="comparison-marker marker-bad">&#10007;</span>
            没有备用屏幕
          </div>
          <TerminalWindow>
            <div class="comparison-content">
              <div class="line-command">$ vim README.md</div>
              <div class="dim">... 编辑文件 ...</div>
              <div class="line-command">$</div>
              <div class="dim">(vim 的残留画面混在终端输出中)</div>
              <div class="vim-tilde">~</div>
              <div class="vim-tilde">~</div>
              <div class="line-command">$ ls</div>
              <div>package.json README.md src</div>
            </div>
          </TerminalWindow>
        </div>

        <div class="comparison-terminal">
          <div class="comparison-label">
            <span class="comparison-marker marker-good">&#10003;</span>
            有备用屏幕
          </div>
          <TerminalWindow>
            <div class="comparison-content">
              <div class="line-command">$ vim README.md</div>
              <div class="dim">... 编辑文件 ...</div>
              <div class="line-command">$</div>
              <div class="dim">(退出 vim 后，原始屏幕完好恢复)</div>
              <div class="line-command">$ ls</div>
              <div>package.json README.md src</div>
              <div class="line-command">$ git status</div>
              <div>On branch main</div>
            </div>
          </TerminalWindow>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alt-screen-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Main layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr 1fr;
  }
}

/* Terminal section */
.terminal-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--sr-c-small-text-muted);
  letter-spacing: 0.05em;
}

.buffer-badge {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 9999px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  transition: all 0.3s ease;
}

/* Screen container & transitions */
.screen-container {
  position: relative;
  height: 300px;
  overflow: hidden;
}

.screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.screen-alternate {
  display: flex;
  flex-direction: column;
}

.screen-active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.screen-hidden {
  opacity: 0;
  pointer-events: none;
}

.screen-hidden.screen-normal {
  transform: translateX(-20px);
}

.screen-hidden.screen-alternate {
  transform: translateX(20px);
}

/* Normal screen lines */
.line-command {
  color: #22c55e;
}

.line-perm {
  color: #06b6d4;
}

/* Vim simulation */
.vim-header {
  color: #3b82f6;
  padding: 2px 0 6px;
  border-bottom: 1px solid #262626;
  font-size: 13px;
}

.vim-body {
  flex: 1;
  padding: 4px 0;
}

.vim-line {
  display: flex;
  gap: 12px;
  line-height: 1.6;
}

.vim-lineno {
  color: #525252;
  min-width: 2ch;
  text-align: right;
  user-select: none;
}

.vim-tilde {
  color: #3b82f6;
}

.vim-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 2px 8px;
  margin-top: auto;
  background: #525252;
  color: #e5e5e5;
  font-size: 12px;
}

.vim-mode {
  font-weight: 600;
}

.vim-pos {
  font-variant-numeric: tabular-nums;
}

/* Sequences section */
.sequences-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.seq-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seq-card {
  padding: 14px;
  border: var(--sr-border);
  border-radius: 8px;
  background: var(--sr-c-bg-section);
  transition:
    border-color 0.3s ease,
    background 0.3s ease;
}

.seq-card-active {
  border-color: #eab308;
  background: rgba(234, 179, 8, 0.05);
}

.seq-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.seq-card-title {
  font-size: 13px;
  color: var(--sr-c-small-text);
}

.seq-card-desc {
  font-size: 12px;
  margin-top: 6px;
}

/* Buffer diagram */
.buffer-diagram {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.buffer-box {
  flex: 1;
  border: 2px solid;
  border-color: var(--sr-c-border, #262626);
  border-radius: 6px;
  padding: 12px;
  background: var(--sr-c-bg-section);
  text-align: center;
  transition:
    border-color 0.3s ease,
    background 0.3s ease;
}

.buffer-box-active-normal {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}

.buffer-box-active-normal .buffer-box-label {
  color: #22c55e;
}

.buffer-box-active-alt {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
}

.buffer-box-active-alt .buffer-box-label {
  color: #06b6d4;
}

.buffer-box-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--sr-c-small-text);
  margin-bottom: 6px;
}

.buffer-box-content {
  font-size: 11px;
  line-height: 1.6;
}

.buffer-arrow {
  font-size: 24px;
  flex-shrink: 0;
}

.buffer-hint {
  font-size: 11px;
  text-align: center;
  margin: 0;
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
  color: #3b82f6;
}

.detail-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 0;
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
  color: var(--sr-c-small-text);
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

.comparison-terminal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-label {
  font-size: 13px;
  color: var(--sr-c-small-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.comparison-marker {
  font-size: 12px;
  font-weight: 600;
}

.marker-bad {
  color: #f85149;
}

.marker-good {
  color: #22c55e;
}

.comparison-content {
  font-size: 12px;
  line-height: 1.6;
  color: #e5e5e5;
}

/* Shared */
.esc-code {
  color: #eab308;
  font-size: 13px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.dim {
  color: var(--sr-c-small-text-muted);
}

.fg-text {
  color: var(--sr-c-small-text);
}
</style>
