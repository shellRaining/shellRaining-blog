<template>
  <div class="vue-mounting-diagram" :class="{ dark: isDarkMode }">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 610">
      <!-- Background -->
      <rect width="800" height="610" :fill="bgColor" />

      <!-- Tree connections (behind nodes) -->
      <line
        x1="385"
        y1="100"
        x2="315"
        y2="160"
        :stroke="lineColor"
        stroke-width="2"
      />
      <line
        x1="415"
        y1="100"
        x2="485"
        y2="160"
        :stroke="lineColor"
        stroke-width="2"
      />
      <line
        x1="285"
        y1="200"
        x2="200"
        y2="260"
        :stroke="lineColor"
        stroke-width="2"
      />
      <line
        x1="315"
        y1="200"
        x2="300"
        y2="260"
        :stroke="lineColor"
        stroke-width="2"
      />
      <line
        x1="485"
        y1="200"
        x2="500"
        y2="260"
        :stroke="lineColor"
        stroke-width="2"
      />
      <line
        x1="515"
        y1="200"
        x2="600"
        y2="260"
        :stroke="lineColor"
        stroke-width="2"
      />

      <!-- Root node (Level 1) -->
      <circle
        cx="400"
        cy="80"
        r="30"
        :fill="nodeColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
      <text
        x="400"
        y="85"
        font-family="Arial"
        font-size="18"
        text-anchor="middle"
        :fill="textColor"
      >
        A
      </text>

      <!-- Mount order indicator for Root -->
      <circle
        cx="370"
        cy="65"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="370"
        y="70"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        1
      </text>

      <!-- Insert order indicator for Root -->
      <circle
        cx="430"
        cy="65"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="430"
        y="70"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        7
      </text>

      <!-- Level 2 nodes -->
      <!-- Node B -->
      <circle
        cx="300"
        cy="180"
        r="30"
        :fill="nodeColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
      <text
        x="300"
        y="185"
        font-family="Arial"
        font-size="18"
        text-anchor="middle"
        :fill="textColor"
      >
        B
      </text>

      <!-- Mount order indicator for B -->
      <circle
        cx="270"
        cy="165"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="270"
        y="170"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        2
      </text>

      <!-- Insert order indicator for B -->
      <circle
        cx="330"
        cy="165"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="330"
        y="170"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        3
      </text>

      <!-- Node C -->
      <circle
        cx="500"
        cy="180"
        r="30"
        :fill="nodeColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
      <text
        x="500"
        y="185"
        font-family="Arial"
        font-size="18"
        text-anchor="middle"
        :fill="textColor"
      >
        C
      </text>

      <!-- Mount order indicator for C -->
      <circle
        cx="470"
        cy="165"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="470"
        y="170"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        5
      </text>

      <!-- Insert order indicator for C -->
      <circle
        cx="530"
        cy="165"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="530"
        y="170"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        6
      </text>

      <!-- Level 3 nodes -->
      <!-- Node D -->
      <circle
        cx="200"
        cy="280"
        r="30"
        :fill="nodeColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
      <text
        x="200"
        y="285"
        font-family="Arial"
        font-size="18"
        text-anchor="middle"
        :fill="textColor"
      >
        D
      </text>

      <!-- Mount order indicator for D -->
      <circle
        cx="170"
        cy="265"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="170"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        3
      </text>

      <!-- Insert order indicator for D -->
      <circle
        cx="230"
        cy="265"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="230"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        1
      </text>

      <!-- Node E -->
      <circle
        cx="300"
        cy="280"
        r="30"
        :fill="nodeColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
      <text
        x="300"
        y="285"
        font-family="Arial"
        font-size="18"
        text-anchor="middle"
        :fill="textColor"
      >
        E
      </text>

      <!-- Mount order indicator for E -->
      <circle
        cx="270"
        cy="265"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="270"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        4
      </text>

      <!-- Insert order indicator for E -->
      <circle
        cx="330"
        cy="265"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="330"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        2
      </text>

      <!-- Node F -->
      <circle
        cx="500"
        cy="280"
        r="30"
        :fill="nodeColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
      <text
        x="500"
        y="285"
        font-family="Arial"
        font-size="18"
        text-anchor="middle"
        :fill="textColor"
      >
        F
      </text>

      <!-- Mount order indicator for F -->
      <circle
        cx="470"
        cy="265"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="470"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        6
      </text>

      <!-- Insert order indicator for F -->
      <circle
        cx="530"
        cy="265"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="530"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        4
      </text>

      <!-- Node G -->
      <circle
        cx="600"
        cy="280"
        r="30"
        :fill="nodeColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
      <text
        x="600"
        y="285"
        font-family="Arial"
        font-size="18"
        text-anchor="middle"
        :fill="textColor"
      >
        G
      </text>

      <!-- Mount order indicator for G -->
      <circle
        cx="570"
        cy="265"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="570"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        7
      </text>

      <!-- Insert order indicator for G -->
      <circle
        cx="630"
        cy="265"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="630"
        y="270"
        font-family="Arial"
        font-size="14"
        text-anchor="middle"
        :fill="textColor"
      >
        5
      </text>

      <!-- Detailed Legend -->
      <rect
        x="100"
        y="350"
        width="600"
        height="240"
        rx="10"
        :fill="legendBgColor"
        :stroke="strokeColor"
        stroke-width="2"
        fill-opacity="0.95"
      />

      <text
        x="120"
        y="380"
        font-family="Arial"
        font-size="20"
        :fill="labelColor"
        font-weight="bold"
      >
        Vue 元素挂载与插入顺序
      </text>

      <!-- Mount order legend -->
      <circle
        cx="140"
        cy="420"
        r="12"
        :fill="mountColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="165"
        y="425"
        font-family="Arial"
        font-size="16"
        :fill="labelColor"
        font-weight="bold"
      >
        挂载顺序
      </text>
      <text
        x="140"
        y="455"
        font-family="Arial"
        font-size="14"
        :fill="explanationColor"
      >
        深度优先遍历 (DFS) 顺序：A→B→D→E→C→F→G
      </text>
      <text
        x="140"
        y="480"
        font-family="Arial"
        font-size="14"
        :fill="explanationColor"
      >
        首先为元素创建DOM节点，然后递归处理其子节点
      </text>

      <!-- Insert order legend -->
      <circle
        cx="140"
        cy="520"
        r="12"
        :fill="insertColor"
        :stroke="strokeColor"
        stroke-width="1"
      />
      <text
        x="165"
        y="525"
        font-family="Arial"
        font-size="16"
        :fill="labelColor"
        font-weight="bold"
      >
        插入顺序
      </text>
      <text
        x="140"
        y="555"
        font-family="Arial"
        font-size="14"
        :fill="explanationColor"
      >
        自下而上的顺序：D→E→B→F→G→C→A
      </text>
      <text
        x="140"
        y="580"
        font-family="Arial"
        font-size="14"
        :fill="explanationColor"
      >
        先将子节点插入到父节点中，最后将根节点插入到容器
      </text>

      <text
        x="140"
        y="620"
        font-family="Arial"
        font-size="13"
        :fill="codeColor"
      >
        mountElement(vnode, container) {
      </text>
      <text
        x="140"
        y="640"
        font-family="Arial"
        font-size="13"
        :fill="codeColor"
      >
        const el = hostCreateElement(vnode.type); // 创建元素
      </text>
      <text
        x="140"
        y="660"
        font-family="Arial"
        font-size="13"
        :fill="codeColor"
      >
        for (const childEl of vnode.children) {
      </text>
      <text
        x="140"
        y="680"
        font-family="Arial"
        font-size="13"
        :fill="codeColor"
      >
        mountElement(childEl, el); // 处理子元素
      </text>
      <text
        x="140"
        y="700"
        font-family="Arial"
        font-size="13"
        :fill="codeColor"
      >
        }
      </text>
      <text
        x="140"
        y="720"
        font-family="Arial"
        font-size="13"
        :fill="codeColor"
      >
        hostInsert(el, container); // 插入当前元素
      </text>
      <text
        x="140"
        y="740"
        font-family="Arial"
        font-size="13"
        :fill="codeColor"
      >
        }
      </text>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useDark } from "@vueuse/core";

const isDarkMode = useDark();

const bgColor = computed(() => (isDarkMode.value ? "#1a1a1a" : "#f8f9fa"));
const nodeColor = computed(() => (isDarkMode.value ? "#3fb984" : "#42b883"));
const strokeColor = computed(() => (isDarkMode.value ? "#2c3e50" : "#35495e"));
const textColor = computed(() => (isDarkMode.value ? "#ffffff" : "#ffffff"));
const labelColor = computed(() => (isDarkMode.value ? "#e2e8f0" : "#35495e"));
const lineColor = computed(() => (isDarkMode.value ? "#4a5568" : "#35495e"));
const explanationColor = computed(() =>
  isDarkMode.value ? "#cbd5e0" : "#4a5568",
);
const legendBgColor = computed(() =>
  isDarkMode.value ? "#2d3748" : "#ffffff",
);
const codeColor = computed(() => (isDarkMode.value ? "#a0aec0" : "#4a5568"));

// 区分挂载和插入顺序的颜色
const mountColor = computed(() => (isDarkMode.value ? "#ff9d00" : "#ff6b00")); // 橙色系 - 挂载顺序
const insertColor = computed(() => (isDarkMode.value ? "#00c6ff" : "#0077cc")); // 蓝色系 - 插入顺序
</script>

<style scoped>
.vue-mounting-diagram {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  transition: all 0.3s ease;
}

.vue-mounting-diagram svg {
  width: 100%;
  height: auto;
}

.dark {
  color-scheme: dark;
}
</style>
