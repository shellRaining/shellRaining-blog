<script setup lang="ts">
import { ref, computed } from "vue";
import TerminalWindow from "./TerminalWindow.vue";
import TButton from "./shared/TButton.vue";
import InfoPanel from "./shared/InfoPanel.vue";
import StepNavigation from "./shared/StepNavigation.vue";

const NERD_GLYPHS: Record<string, string> = {
  folder: "\ue5ff",
  folderOpen: "\ue5fe",
  file: "\uf15b",
  typescript: "\ue628",
  javascript: "\ue781",
  react: "\ue7ba",
  python: "\ue73c",
  rust: "\ue7a8",
  git: "\uf1d3",
  github: "\uf408",
  json: "\ue60b",
  markdown: "\ue73e",
  docker: "\uf308",
  terminal: "\uf489",
  gear: "\uf013",
  lock: "\uf023",
  check: "\uf00c",
  error: "\uf00d",
  warning: "\uf071",
  info: "\uf05a",
};

interface IconInfo {
  icon: string;
  name: string;
  codepoint: string;
  category: string;
  color: string;
}

const ICONS: IconInfo[] = [
  {
    icon: "folder",
    name: "Folder",
    codepoint: "U+E5FF",
    category: "文件",
    color: "#eab308",
  },
  {
    icon: "folderOpen",
    name: "Folder Open",
    codepoint: "U+E5FE",
    category: "文件",
    color: "#eab308",
  },
  {
    icon: "file",
    name: "File",
    codepoint: "U+F15B",
    category: "文件",
    color: "#e5e5e5",
  },
  {
    icon: "typescript",
    name: "TypeScript",
    codepoint: "U+E628",
    category: "开发",
    color: "#3b82f6",
  },
  {
    icon: "javascript",
    name: "JavaScript",
    codepoint: "U+E781",
    category: "开发",
    color: "#eab308",
  },
  {
    icon: "react",
    name: "React",
    codepoint: "U+E7BA",
    category: "开发",
    color: "#06b6d4",
  },
  {
    icon: "python",
    name: "Python",
    codepoint: "U+E73C",
    category: "开发",
    color: "#3b82f6",
  },
  {
    icon: "rust",
    name: "Rust",
    codepoint: "U+E7A8",
    category: "开发",
    color: "#e5e5e5",
  },
  {
    icon: "git",
    name: "Git",
    codepoint: "U+F1D3",
    category: "开发",
    color: "#f85149",
  },
  {
    icon: "github",
    name: "GitHub",
    codepoint: "U+F408",
    category: "开发",
    color: "#e5e5e5",
  },
  {
    icon: "docker",
    name: "Docker",
    codepoint: "U+F308",
    category: "开发",
    color: "#06b6d4",
  },
  {
    icon: "terminal",
    name: "Terminal",
    codepoint: "U+F489",
    category: "系统",
    color: "#22c55e",
  },
  {
    icon: "gear",
    name: "Gear",
    codepoint: "U+F013",
    category: "系统",
    color: "#525252",
  },
  {
    icon: "lock",
    name: "Lock",
    codepoint: "U+F023",
    category: "系统",
    color: "#eab308",
  },
  {
    icon: "check",
    name: "Check",
    codepoint: "U+F00C",
    category: "状态",
    color: "#22c55e",
  },
  {
    icon: "error",
    name: "Error",
    codepoint: "U+F00D",
    category: "状态",
    color: "#f85149",
  },
  {
    icon: "warning",
    name: "Warning",
    codepoint: "U+F071",
    category: "状态",
    color: "#eab308",
  },
  {
    icon: "info",
    name: "Info",
    codepoint: "U+F05A",
    category: "状态",
    color: "#3b82f6",
  },
];

interface FileItem {
  name: string;
  type: "folder" | "file";
  icon: string;
  color: string;
  indent: number;
  codepoint: string;
}

const FILE_TREE: FileItem[] = [
  {
    name: "src",
    type: "folder",
    icon: "folder",
    color: "#eab308",
    indent: 0,
    codepoint: "U+E5FF",
  },
  {
    name: "components",
    type: "folder",
    icon: "folder",
    color: "#eab308",
    indent: 1,
    codepoint: "U+E5FF",
  },
  {
    name: "App.tsx",
    type: "file",
    icon: "react",
    color: "#06b6d4",
    indent: 2,
    codepoint: "U+E7BA",
  },
  {
    name: "Button.tsx",
    type: "file",
    icon: "react",
    color: "#06b6d4",
    indent: 2,
    codepoint: "U+E7BA",
  },
  {
    name: "utils",
    type: "folder",
    icon: "folder",
    color: "#eab308",
    indent: 1,
    codepoint: "U+E5FF",
  },
  {
    name: "index.ts",
    type: "file",
    icon: "typescript",
    color: "#3b82f6",
    indent: 1,
    codepoint: "U+E628",
  },
  {
    name: "package.json",
    type: "file",
    icon: "json",
    color: "#22c55e",
    indent: 0,
    codepoint: "U+E60B",
  },
  {
    name: ".gitignore",
    type: "file",
    icon: "git",
    color: "#f85149",
    indent: 0,
    codepoint: "U+F1D3",
  },
  {
    name: "README.md",
    type: "file",
    icon: "markdown",
    color: "#e5e5e5",
    indent: 0,
    codepoint: "U+E73E",
  },
  {
    name: "Dockerfile",
    type: "file",
    icon: "docker",
    color: "#06b6d4",
    indent: 0,
    codepoint: "U+F308",
  },
];

const EXPLAINER_STEPS = {
  what: {
    title: "什么是终端图标？",
    description:
      "现代终端应用（如文件浏览器、状态栏、开发工具）会显示文件、文件夹和状态指示器的图标。这些并非图片，而是由特殊字体渲染的 Unicode 字符。",
  },
  how: {
    title: "工作原理",
    description:
      "终端图标本质上就是普通的 Unicode 字符，终端像处理字母或数字一样处理它们，每个字符占一个单元格。关键在于字体将这些码位映射到了图标字形。",
  },
  pua: {
    title: "私有使用区",
    description:
      "Unicode 保留了称为私有使用区的范围（U+E000-U+F8FF）。Nerd Fonts 在此放置了数千个图标，涵盖开发语言 Logo、文件类型、git 符号等。应用输出这些码位，字体负责将它们渲染为图标。",
  },
  fonts: {
    title: "Nerd Fonts",
    description:
      "Nerd Fonts 是普通编程字体（如 JetBrains Mono 或 Fira Code）加上 3600+ 图标的补丁版本。安装一个，设为终端字体，图标就能直接显示。无需额外配置。",
  },
  rendering: {
    title: "渲染流程",
    description:
      "当应用输出图标时：1) 打印一个 Unicode 字符（如 U+E628 表示 TypeScript）。2) 终端在字体中查找该字符。3) 字体将 U+E628 映射到 TypeScript Logo 字形。4) 终端在单元格中绘制该字形。",
  },
};

type ExplainerStep = keyof typeof EXPLAINER_STEPS;

const selectedIcon = ref<IconInfo>(ICONS[0]);
const showWithIcons = ref(true);
const hoveredFile = ref<number | null>(null);
const currentStep = ref<ExplainerStep>("what");

const steps = Object.keys(EXPLAINER_STEPS) as ExplainerStep[];
const stepContent = computed(() => EXPLAINER_STEPS[currentStep.value]);

const categories = computed(() => [...new Set(ICONS.map((i) => i.category))]);

const ICON_SETS = [
  {
    name: "Powerline",
    description: "状态栏分隔符和箭头",
    range: "U+E0A0-E0D4",
    glyphs: ["\ue0b0", "\ue0b2", "\ue0b4"],
    fontSize: 12,
  },
  {
    name: "Font Awesome",
    description: "通用图标",
    range: "U+F000-F2E0",
    glyphs: [
      NERD_GLYPHS.folder,
      NERD_GLYPHS.file,
      NERD_GLYPHS.gear,
      NERD_GLYPHS.lock,
    ],
    fontSize: 14,
  },
  {
    name: "Devicons",
    description: "编程语言 Logo",
    range: "U+E700-E7C5",
    glyphs: [
      NERD_GLYPHS.typescript,
      NERD_GLYPHS.javascript,
      NERD_GLYPHS.react,
      NERD_GLYPHS.python,
      NERD_GLYPHS.rust,
    ],
    fontSize: 16,
  },
  {
    name: "Octicons",
    description: "GitHub 风格图标",
    range: "U+F400-F532",
    glyphs: [NERD_GLYPHS.github, NERD_GLYPHS.git, NERD_GLYPHS.terminal],
    fontSize: 14,
  },
];
</script>

<template>
  <div class="icons-demo">
    <!-- File Explorer Demo -->
    <TerminalWindow>
      <div class="file-explorer">
        <div class="explorer-header">
          <TButton @click="showWithIcons = !showWithIcons">
            {{ showWithIcons ? "图标 ON" : "图标 OFF" }}
          </TButton>
          <span class="dim">
            {{ showWithIcons ? "显示 Nerd Font 字形" : "仅纯文本" }}
          </span>
        </div>

        <div class="file-tree">
          <div
            v-for="(item, idx) in FILE_TREE"
            :key="idx"
            :class="['file-item', { hovered: hoveredFile === idx }]"
            :style="{ paddingLeft: `${item.indent * 16 + 8}px` }"
            @mouseenter="hoveredFile = idx"
            @mouseleave="hoveredFile = null"
          >
            <span
              v-if="showWithIcons"
              class="nerd-icon"
              :style="{ color: item.color }"
            >
              {{ NERD_GLYPHS[item.icon] }}
            </span>
            <span v-else class="dim file-type-letter">
              {{ item.type === "folder" ? "D" : "F" }}
            </span>
            <span :class="{ 'text-green': hoveredFile === idx }">
              {{ item.name }}
            </span>
          </div>
        </div>

        <div v-if="hoveredFile !== null" class="file-tooltip">
          <div
            class="tooltip-icon"
            :style="{ color: FILE_TREE[hoveredFile].color }"
          >
            {{ NERD_GLYPHS[FILE_TREE[hoveredFile].icon] }}
          </div>
          <div class="tooltip-info">
            <div class="val-cyan">{{ FILE_TREE[hoveredFile].name }}</div>
            <div class="val-yellow">{{ FILE_TREE[hoveredFile].codepoint }}</div>
          </div>
          <div class="dim tooltip-note">一个字符<br />一个单元格</div>
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
      <p class="detail-desc" style="margin-top: 10px">
        {{ stepContent.description }}
      </p>

      <div v-if="currentStep === 'pua'" class="code-block">
        <div class="dim">// Unicode 私有使用区范围</div>
        <div>
          <span class="val-cyan">U+E000 - U+F8FF</span>
          <span class="dim">— 基本多语言平面 PUA</span>
        </div>
        <div>
          <span class="val-cyan">U+F0000 - U+FFFFD</span>
          <span class="dim">— 补充 PUA-A</span>
        </div>
        <div>
          <span class="val-cyan">U+100000 - U+10FFFD</span>
          <span class="dim">— 补充 PUA-B</span>
        </div>
        <div class="val-yellow" style="margin-top: 8px">
          Nerd Fonts 在这些范围中使用了约 3600 个码位
        </div>
      </div>

      <div v-if="currentStep === 'rendering'" class="rendering-flow">
        <div class="flow-step">
          <span class="dim">应用输出</span>
          <span class="val-yellow">U+E628</span>
        </div>
        <span class="dim">→</span>
        <div class="flow-step">
          <span class="dim">字体查找</span>
          <span class="val-green">Nerd Font</span>
        </div>
        <span class="dim">→</span>
        <div class="flow-step">
          <span class="dim">渲染结果</span>
          <span class="nerd-icon" style="color: #3b82f6; font-size: 18px">{{
            NERD_GLYPHS.typescript
          }}</span>
        </div>
      </div>

      <div v-if="currentStep === 'fonts'" class="fonts-list">
        <div class="dim">常用 Nerd Fonts:</div>
        <div class="fonts-grid">
          <div
            v-for="font in [
              'JetBrainsMono Nerd Font',
              'FiraCode Nerd Font',
              'Hack Nerd Font',
              'CaskaydiaCove Nerd Font',
            ]"
            :key="font"
            class="font-item"
          >
            <span class="nerd-icon" style="color: #22c55e">{{
              NERD_GLYPHS.check
            }}</span>
            <span>{{ font }}</span>
          </div>
        </div>
        <div class="val-cyan" style="margin-top: 8px">下载: nerdfonts.com</div>
      </div>
    </InfoPanel>

    <!-- Icon Gallery -->
    <div class="gallery-section">
      <h3 class="section-title">Nerd Font 图标画廊</h3>
      <p class="dim">点击任意图标查看其 Unicode 码位和使用方式。</p>

      <div class="gallery-layout">
        <div class="gallery-grid">
          <div
            v-for="category in categories"
            :key="category"
            class="category-group"
          >
            <div class="control-label">{{ category }}</div>
            <div class="icon-buttons">
              <button
                v-for="item in ICONS.filter((i) => i.category === category)"
                :key="item.codepoint"
                :class="[
                  'icon-btn',
                  { selected: selectedIcon.codepoint === item.codepoint },
                ]"
                @click="selectedIcon = item"
                :title="item.name"
              >
                <span class="nerd-icon" :style="{ color: item.color }">
                  {{ NERD_GLYPHS[item.icon] }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="icon-detail">
          <div class="icon-detail-header">
            <div class="icon-detail-preview">
              <span
                class="nerd-icon"
                :style="{ color: selectedIcon.color, fontSize: '20px' }"
              >
                {{ NERD_GLYPHS[selectedIcon.icon] }}
              </span>
            </div>
            <div class="fg-text" style="font-weight: 600">
              {{ selectedIcon.name }}
            </div>
            <div class="val-cyan">{{ selectedIcon.codepoint }}</div>
          </div>
          <div class="icon-detail-code">
            <div>
              <span class="dim">Shell: </span>
              <span class="val-green"
                >echo -e "\u{{
                  selectedIcon.codepoint.replace("U+", "").toLowerCase()
                }}"</span
              >
            </div>
            <div>
              <span class="dim">Code: </span>
              <span class="val-magenta">printf</span
              ><span class="val-yellow">(</span
              ><span class="val-green"
                >"\\u{{
                  selectedIcon.codepoint.replace("U+", "").toLowerCase()
                }}"</span
              ><span class="val-yellow">)</span>
            </div>
            <div>
              <span class="dim">Decimal: </span>
              <span class="val-cyan">{{
                parseInt(selectedIcon.codepoint.replace("U+", ""), 16)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Under the Hood -->
    <div class="width-section">
      <h3 class="section-title">为什么只占一个单元格？</h3>

      <div class="feature-boxes">
        <div class="feature-box">
          <div class="feature-box-title">
            <span class="feature-box-num">1</span> 单码位
          </div>
          <div class="feature-box-desc dim">
            每个 Nerd Font 图标是一个 Unicode 码位。终端将其视为一个字符，与 'A'
            或 '中' 一样。一个字符 = 一个单元格。
          </div>
        </div>
        <div class="feature-box">
          <div class="feature-box-title">
            <span class="feature-box-num">2</span> 字体字形
          </div>
          <div class="feature-box-desc dim">
            字体文件为每个码位包含一个字形（矢量图）。Nerd Fonts
            添加了数千个图标字形，尺寸适配终端的单元格大小。
          </div>
        </div>
        <div class="feature-box">
          <div class="feature-box-title">
            <span class="feature-box-num">3</span> 单元格尺寸设计
          </div>
          <div class="feature-box-desc dim">
            图标字形被设计为适配等宽单元格。它们是正方形或略呈矩形，以完美匹配终端的字符网格。
          </div>
        </div>
      </div>

      <div class="width-demo">
        <div class="width-row">
          <div class="dim" style="width: 80px">单宽:</div>
          <div class="width-cells">
            <div v-for="c in ['A', 'B', 'C']" :key="c" class="width-cell">
              {{ c }}
            </div>
            <div
              v-for="(g, i) in [
                NERD_GLYPHS.folder,
                NERD_GLYPHS.file,
                NERD_GLYPHS.check,
              ]"
              :key="'i' + i"
              class="width-cell"
            >
              <span class="nerd-icon">{{ g }}</span>
            </div>
          </div>
          <span class="dim" style="font-size: 11px">每个 1 格</span>
        </div>
        <div class="width-row">
          <div class="dim" style="width: 80px">双宽:</div>
          <div class="width-cells">
            <div
              v-for="c in ['中', '文', '字']"
              :key="c"
              class="width-cell width-cell-wide"
            >
              {{ c }}
            </div>
          </div>
          <span class="dim" style="font-size: 11px">每个 2 格 (CJK)</span>
        </div>
      </div>
    </div>

    <!-- Icon Sets Reference -->
    <div class="sets-section">
      <h3 class="section-title">Nerd Fonts 中的图标集</h3>
      <p class="dim" style="font-size: 13px">
        Nerd Fonts 将多个图标集合并到一个字体中。每个集合占据不同的 Unicode
        范围。
      </p>

      <div class="sets-list">
        <div v-for="set in ICON_SETS" :key="set.name" class="set-item">
          <div class="set-info">
            <div class="fg-text" style="font-weight: 600; font-size: 13px">
              {{ set.name }}
            </div>
            <div
              class="val-cyan"
              style="
                font-size: 11px;
                font-family: &quot;Geist Mono&quot;, monospace;
              "
            >
              {{ set.range }}
            </div>
          </div>
          <div class="dim set-desc">{{ set.description }}</div>
          <div class="set-glyphs">
            <div
              v-for="(g, i) in set.glyphs"
              :key="i"
              class="set-glyph-cell"
              :style="{ fontSize: set.fontSize + 'px' }"
            >
              <span class="nerd-icon">{{ g }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icons-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* File Explorer */
.file-explorer {
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
  min-height: 280px;
  position: relative;
}

.explorer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #262626;
}

.file-tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;
  color: #e5e5e5;
}

.file-item.hovered {
  background: rgba(34, 197, 94, 0.15);
}

.file-type-letter {
  width: 16px;
  text-align: center;
}

.text-green {
  color: #22c55e;
}

.nerd-icon {
  font-family: "JetBrainsMono Nerd Font", "Symbols Nerd Font", monospace;
  display: inline-block;
  text-align: center;
  line-height: 1;
}

.file-tooltip {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #171717;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
}

.tooltip-icon {
  font-family: "JetBrainsMono Nerd Font", "Symbols Nerd Font", monospace;
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 4px;
}

.tooltip-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-note {
  text-align: right;
  font-size: 11px;
  line-height: 1.3;
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

.detail-desc {
  font-size: 13px;
  color: var(--sr-c-small-text-muted);
  line-height: 1.6;
  margin: 0;
}

.code-block {
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 4px;
  padding: 12px;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 12px;
  color: #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
}

.rendering-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  font-size: 13px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.fonts-list {
  margin-top: 12px;
  font-size: 12px;
}

.fonts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.font-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e5e5e5;
}

/* Gallery */
.gallery-section,
.width-section,
.sets-section {
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #f85149;
  margin: 0;
}

.gallery-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .gallery-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.gallery-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.category-group {
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

.icon-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--sr-border);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 4px;
}

.icon-btn:hover {
  border-color: var(--sr-c-small-text-muted);
}

.icon-btn.selected {
  border-color: var(--sr-c-small-text-hover);
  background: rgba(255, 255, 255, 0.05);
  transform: scale(1.1);
}

.icon-detail {
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-detail-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #171717;
  border: 1px solid #262626;
  border-radius: 4px;
}

.icon-detail-code {
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 12px;
  color: #525252;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Feature Boxes */
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

/* Width Demo */
.width-demo {
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.width-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.width-cells {
  display: flex;
}

.width-cell {
  width: 20px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #262626;
  background: #171717;
  color: #e5e5e5;
  font-size: 13px;
}

.width-cell-wide {
  width: 40px;
}

/* Sets Reference */
.sets-list {
  display: flex;
  flex-direction: column;
  border-top: var(--sr-border);
}

.set-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-bottom: var(--sr-border);
}

@media (min-width: 768px) {
  .set-item {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }

  .set-info {
    width: 130px;
    flex-shrink: 0;
  }

  .set-desc {
    flex: 1;
  }
}

.set-glyphs {
  display: flex;
  gap: 6px;
}

.set-glyph-cell {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: "JetBrainsMono Nerd Font", "Symbols Nerd Font", monospace;
  color: #e5e5e5;
}

/* Shared colors */
.val-yellow {
  color: #eab308;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.val-cyan {
  color: #06b6d4;
  font-family: "Geist Mono", "SF Mono", ui-monospace, monospace;
}

.val-green {
  color: #22c55e;
}

.val-magenta {
  color: #a855f7;
}

.fg-text {
  color: var(--sr-c-small-text);
}

.dim {
  color: var(--sr-c-small-text-muted);
}
</style>
