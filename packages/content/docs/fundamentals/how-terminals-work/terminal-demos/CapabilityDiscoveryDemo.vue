<script setup lang="ts">
import { ref, computed, watch } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";

interface TermCapability {
  colors: number;
  mouse: boolean;
  altScreen: boolean;
  unicode: boolean;
  description: string;
}

const TERM_CAPABILITIES: Record<string, TermCapability> = {
  "xterm-256color": {
    colors: 256,
    mouse: true,
    altScreen: true,
    unicode: true,
    description: "支持 256 色的现代终端",
  },
  xterm: {
    colors: 16,
    mouse: true,
    altScreen: true,
    unicode: true,
    description: "标准 X 终端模拟器",
  },
  "screen-256color": {
    colors: 256,
    mouse: true,
    altScreen: true,
    unicode: true,
    description: "支持 256 色的 GNU Screen",
  },
  vt100: {
    colors: 0,
    mouse: false,
    altScreen: false,
    unicode: false,
    description: "1978 年的 DEC 终端",
  },
  dumb: {
    colors: 0,
    mouse: false,
    altScreen: false,
    unicode: false,
    description: "无特殊能力",
  },
};

const FEATURES = [
  {
    id: "mouse",
    name: "鼠标追踪",
    enable: "^[[?1000h",
    disable: "^[[?1000l",
    description: "将鼠标点击报告为转义序列",
  },
  {
    id: "altscreen",
    name: "备用屏幕",
    enable: "^[[?1049h",
    disable: "^[[?1049l",
    description: "切换到独立的屏幕缓冲区",
  },
  {
    id: "bracketed",
    name: "括号粘贴",
    enable: "^[[?2004h",
    disable: "^[[?2004l",
    description: "用特殊标记包裹粘贴的文本",
  },
];

const DA1_CODES: Record<string, string> = {
  "1": "132 列",
  "2": "打印端口",
  "4": "Sixel 图形",
  "6": "选择性擦除",
  "7": "软字体 (DRCS)",
  "8": "用户自定义键",
  "9": "国家替换字符集",
  "15": "技术字符集",
  "18": "窗口能力",
  "21": "水平滚动",
  "22": "ANSI 颜色",
  "28": "矩形编辑",
  "29": "ANSI 文本定位器",
};

type QueryPhase = "idle" | "sending" | "responding" | "done";

const selectedTerm = ref("xterm-256color");
const queryPhase = ref<QueryPhase>("idle");
const enabledFeatures = ref(new Set<string>());

const capabilities = computed(() => TERM_CAPABILITIES[selectedTerm.value]!);

const CAPABILITY_ITEMS = [
  { key: "colors", label: "颜色" },
  { key: "mouse", label: "鼠标" },
  { key: "altScreen", label: "备用屏幕" },
  { key: "unicode", label: "Unicode" },
] as const;

function capValue(key: string) {
  const cap = capabilities.value;
  if (key === "colors") return cap.colors === 0 ? "无" : String(cap.colors);
  return (cap as Record<string, unknown>)[key] ? "支持" : "不支持";
}

function capSupported(key: string) {
  const cap = capabilities.value;
  if (key === "colors") return cap.colors > 0;
  return !!(cap as Record<string, unknown>)[key];
}

function runQuery() {
  if (queryPhase.value !== "idle" && queryPhase.value !== "done") return;
  queryPhase.value = "sending";
}

let sendingTimer: ReturnType<typeof setTimeout> | undefined;
let respondingTimer: ReturnType<typeof setTimeout> | undefined;

watch(queryPhase, (phase) => {
  clearTimeout(sendingTimer);
  clearTimeout(respondingTimer);
  if (phase === "sending") {
    sendingTimer = setTimeout(() => {
      queryPhase.value = "responding";
    }, 800);
  } else if (phase === "responding") {
    respondingTimer = setTimeout(() => {
      queryPhase.value = "done";
    }, 800);
  }
});

function toggleFeature(featureId: string) {
  const next = new Set(enabledFeatures.value);
  if (next.has(featureId)) {
    next.delete(featureId);
  } else {
    next.add(featureId);
  }
  enabledFeatures.value = next;
}

const queryButtonText = computed(() => {
  switch (queryPhase.value) {
    case "sending":
      return "发送中...";
    case "responding":
      return "接收中...";
    case "done":
      return "再次发送";
    default:
      return "发送 DA1 查询";
  }
});
</script>

<template>
  <div class="cap-demo">
    <!-- Section 1: TERM Variable -->
    <div class="cap-section">
      <div class="subsection-label">TERM 环境变量</div>

      <TerminalWindow>
        <div class="term-selector-area">
          <div class="term-selector-row">
            <div class="term-prompt">
              <span class="dim">$</span>
              <span class="cyan">TERM</span>
              <span class="dim">=</span>
              <select v-model="selectedTerm" class="term-select">
                <option
                  v-for="term in Object.keys(TERM_CAPABILITIES)"
                  :key="term"
                  :value="term"
                >
                  {{ term }}
                </option>
              </select>
            </div>
            <span class="term-desc">{{ capabilities.description }}</span>
          </div>

          <div class="cap-grid">
            <div
              v-for="item in CAPABILITY_ITEMS"
              :key="item.key"
              :class="['cap-item', { supported: capSupported(item.key) }]"
            >
              <div class="cap-label">{{ item.label }}</div>
              <div
                :class="['cap-value', { supported: capSupported(item.key) }]"
              >
                {{ capValue(item.key) }}
              </div>
            </div>
          </div>
        </div>
      </TerminalWindow>

      <p class="section-note">
        程序通过检查 <code class="cyan">TERM</code> 环境变量在 terminfo
        数据库中查找能力。它只是一个字符串，终端并不强制执行。
      </p>
    </div>

    <!-- Section 2: Query/Response -->
    <div class="cap-section">
      <div class="subsection-label">查询与响应</div>

      <TerminalWindow>
        <div class="query-area">
          <div class="query-viz">
            <div class="endpoint">
              <div class="endpoint-label">程序</div>
              <div class="endpoint-box">vim</div>
            </div>

            <div class="arrows-container">
              <div :class="['arrow-row', { active: queryPhase === 'sending' }]">
                <div class="arrow-line" />
                <div class="arrow-text green">ESC[c</div>
                <div class="arrow-head green">&rarr;</div>
              </div>
              <div
                :class="[
                  'arrow-row',
                  {
                    active:
                      queryPhase === 'responding' || queryPhase === 'done',
                  },
                ]"
              >
                <div class="arrow-head yellow">&larr;</div>
                <div class="arrow-text yellow">ESC[?64;1;4;22c</div>
                <div class="arrow-line yellow" />
              </div>
            </div>

            <div class="endpoint">
              <div class="endpoint-label">终端</div>
              <div class="endpoint-box">tty</div>
            </div>
          </div>

          <div
            v-if="queryPhase === 'responding' || queryPhase === 'done'"
            class="response-decoder"
          >
            <div class="decoder-title">响应解码</div>
            <div class="decoder-grid">
              <div class="decoder-item">
                <span class="decoder-code">64</span>
                <span class="decoder-meaning">VT420</span>
              </div>
              <div class="decoder-item">
                <span class="decoder-code">1</span>
                <span class="decoder-meaning">{{ DA1_CODES["1"] }}</span>
              </div>
              <div class="decoder-item">
                <span class="decoder-code">4</span>
                <span class="decoder-meaning">{{ DA1_CODES["4"] }}</span>
              </div>
              <div class="decoder-item">
                <span class="decoder-code">22</span>
                <span class="decoder-meaning">{{ DA1_CODES["22"] }}</span>
              </div>
            </div>
          </div>

          <div class="query-btn-row">
            <TButton
              variant="primary"
              :disabled="
                queryPhase === 'sending' || queryPhase === 'responding'
              "
              @click="runQuery"
            >
              {{ queryButtonText }}
            </TButton>
          </div>
        </div>
      </TerminalWindow>

      <p class="section-note">
        程序也可以直接查询终端。DA1（<code class="cyan">ESC[c</code
        >）询问"你是什么"，终端以能力代码作为响应。
      </p>
    </div>

    <!-- Section 3: Feature Toggles -->
    <div class="cap-section">
      <div class="subsection-label">启用特性</div>

      <TerminalWindow>
        <div class="features-area">
          <div
            v-for="feature in FEATURES"
            :key="feature.id"
            class="feature-row"
          >
            <label class="feature-label">
              <input
                type="checkbox"
                :checked="enabledFeatures.has(feature.id)"
                @change="toggleFeature(feature.id)"
              />
              <span
                :class="[
                  'feature-name',
                  { enabled: enabledFeatures.has(feature.id) },
                ]"
              >
                {{ feature.name }}
              </span>
            </label>

            <code
              :class="[
                'feature-seq',
                { enabled: enabledFeatures.has(feature.id) },
              ]"
            >
              {{
                enabledFeatures.has(feature.id)
                  ? feature.enable
                  : feature.disable
              }}
            </code>

            <span class="feature-desc">{{ feature.description }}</span>
          </div>
        </div>
      </TerminalWindow>

      <p class="section-note">
        特性默认是关闭的。程序通过发送转义序列来启用它们——这就是为什么 vim
        启动时发送
        <code class="cyan">^[[?1049h</code>（进入备用屏幕），退出时发送
        <code class="cyan">^[[?1049l</code>。
      </p>
    </div>
  </div>
</template>

<style scoped>
.cap-demo {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.cap-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subsection-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--sr-c-small-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-note {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 0;
}

.section-note code {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
  padding: 1px 4px;
  background: rgba(6, 182, 212, 0.1);
  border-radius: 3px;
}

.section-note code.cyan {
  color: #06b6d4;
}

/* TERM selector */
.term-selector-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.term-selector-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.term-prompt {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 14px;
}

.term-prompt .dim {
  color: #525252;
}

.term-prompt .cyan {
  color: #06b6d4;
}

.term-select {
  background: #0a0a0a;
  border: 1px solid #333;
  color: #eab308;
  padding: 4px 8px;
  font-size: 14px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  cursor: pointer;
}

.term-select:hover {
  border-color: #525252;
}

.term-select:focus {
  outline: none;
  border-color: #e5e5e5;
}

.term-desc {
  color: #737373;
  font-size: 13px;
}

.cap-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .cap-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.cap-item {
  padding: 8px 12px;
  border: 1px solid #333;
  background: rgba(10, 10, 10, 0.5);
}

.cap-item.supported {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(34, 197, 94, 0.05);
}

.cap-label {
  font-size: 11px;
  color: #525252;
  text-transform: uppercase;
}

.cap-value {
  font-size: 13px;
  font-weight: 500;
  color: #525252;
}

.cap-value.supported {
  color: #22c55e;
}

/* Query & Response */
.query-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-viz {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
}

.endpoint {
  text-align: center;
  flex: 1;
}

.endpoint-label {
  font-size: 11px;
  color: #525252;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.endpoint-box {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #737373;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 13px;
}

.arrows-container {
  flex: 1;
  position: relative;
  height: 64px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.arrow-row {
  display: flex;
  align-items: center;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.arrow-row.active {
  opacity: 1;
}

.arrow-line {
  flex: 1;
  border-top: 1px dashed #22c55e;
}

.arrow-line.yellow {
  border-top-color: #eab308;
}

.arrow-text {
  padding: 0 8px;
  font-size: 11px;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  white-space: nowrap;
}

.arrow-text.green {
  color: #22c55e;
}

.arrow-text.yellow {
  color: #eab308;
}

.arrow-head {
  font-size: 14px;
}

.arrow-head.green {
  color: #22c55e;
}

.arrow-head.yellow {
  color: #eab308;
}

.response-decoder {
  background: rgba(10, 10, 10, 0.5);
  border: 1px solid #333;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.decoder-title {
  font-size: 11px;
  color: #525252;
  text-transform: uppercase;
}

.decoder-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 13px;
}

.decoder-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.decoder-code {
  color: #eab308;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
}

.decoder-meaning {
  color: #737373;
}

.query-btn-row {
  display: flex;
  justify-content: center;
}

/* Feature Toggles */
.features-area {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.feature-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(51, 51, 51, 0.5);
  flex-wrap: wrap;
}

.feature-row:last-child {
  border-bottom: none;
}

.feature-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.feature-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #e5e5e5;
}

.feature-name {
  font-size: 13px;
  font-weight: 500;
  color: #737373;
  transition: color 0.2s ease;
}

.feature-name.enabled {
  color: #e5e5e5;
}

.feature-seq {
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 12px;
  padding: 2px 8px;
  color: #525252;
  background: rgba(10, 10, 10, 0.5);
  transition: all 0.2s ease;
}

.feature-seq.enabled {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.feature-desc {
  color: #525252;
  font-size: 12px;
  margin-left: auto;
}

@media (max-width: 600px) {
  .feature-desc {
    margin-left: 0;
    width: 100%;
  }
}
</style>
