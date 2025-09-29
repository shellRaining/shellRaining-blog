<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, defineComponent, h } from "vue";

const props = defineProps<{
  title: string;
  defaultVal: string;
}>();

// 各部分的展开状态，默认都是关闭的
const expandedSections = reactive({
  background: false,
  function: false,
  example: false,
  extra: false,
});

// 创建单独的ref引用
const backgroundRef = ref<HTMLElement | null>(null);
const functionRef = ref<HTMLElement | null>(null);
const exampleRef = ref<HTMLElement | null>(null);
const extraRef = ref<HTMLElement | null>(null);

// 存储各部分的高度
const sectionHeights = reactive({
  background: "0px",
  function: "0px",
  example: "0px",
  extra: "0px",
});

// 切换指定部分的展开状态
const toggleSection = (section: keyof typeof expandedSections) => {
  expandedSections[section] = !expandedSections[section];
};

// 计算所有部分的实际高度
onMounted(async () => {
  // 等待下一个 DOM 更新周期
  await nextTick();

  // 为每个部分单独计算高度
  if (backgroundRef.value) {
    backgroundRef.value.style.height = "auto";
    sectionHeights.background = `${backgroundRef.value.scrollHeight}px`;
    backgroundRef.value.style.height = "0px";
  }

  if (functionRef.value) {
    functionRef.value.style.height = "auto";
    sectionHeights.function = `${functionRef.value.scrollHeight}px`;
    functionRef.value.style.height = "0px";
  }

  if (exampleRef.value) {
    exampleRef.value.style.height = "auto";
    sectionHeights.example = `${exampleRef.value.scrollHeight}px`;
    exampleRef.value.style.height = "0px";
  }

  if (extraRef.value) {
    extraRef.value.style.height = "auto";
    sectionHeights.extra = `${extraRef.value.scrollHeight}px`;
    extraRef.value.style.height = "0px";
  }
});

// 创建箭头图标组件
const ArrowIcon = defineComponent({
  props: {
    expanded: Boolean,
  },
  setup(props) {
    return () =>
      h(
        "div",
        {
          class: ["toggle-icon", { "is-expanded": props.expanded }],
        },
        [
          h(
            "svg",
            {
              width: 14,
              height: 14,
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
            },
            [
              h("path", {
                d: "M9 6L15 12L9 18",
                stroke: "currentColor",
                "stroke-width": 2,
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
              }),
            ],
          ),
        ],
      );
  },
});
</script>

<template>
  <div class="card">
    <header class="opt-name">
      <h3 :id="title" class="title">{{ props.title }}</h3>
      <span class="default-value"
        >默认值: <code>{{ props.defaultVal }}</code></span
      >
    </header>

    <div class="card-content">
      <div v-if="$slots.background" class="section background">
        <h4 @click="toggleSection('background')" class="section-header">
          <ArrowIcon :expanded="expandedSections.background" />
          背景说明
        </h4>
        <div
          ref="backgroundRef"
          class="content-wrapper"
          :style="{
            height: expandedSections.background
              ? sectionHeights.background
              : '0px',
          }"
        >
          <div class="content-inner">
            <slot name="background"></slot>
          </div>
        </div>
      </div>

      <div v-if="$slots.function" class="section function">
        <h4 @click="toggleSection('function')" class="section-header">
          <ArrowIcon :expanded="expandedSections.function" />
          功能描述
        </h4>
        <div
          ref="functionRef"
          class="content-wrapper"
          :style="{
            height: expandedSections.function ? sectionHeights.function : '0px',
          }"
        >
          <div class="content-inner">
            <slot name="function"></slot>
          </div>
        </div>
      </div>

      <div v-if="$slots.example" class="section example">
        <h4 @click="toggleSection('example')" class="section-header">
          <ArrowIcon :expanded="expandedSections.example" />
          示例代码
        </h4>
        <div
          ref="exampleRef"
          class="content-wrapper"
          :style="{
            height: expandedSections.example ? sectionHeights.example : '0px',
          }"
        >
          <div class="content-inner">
            <slot name="example"></slot>
          </div>
        </div>
      </div>

      <div v-if="$slots.extra" class="section extra">
        <h4 @click="toggleSection('extra')" class="section-header">
          <ArrowIcon :expanded="expandedSections.extra" />
          补充说明
        </h4>
        <div
          ref="extraRef"
          class="content-wrapper"
          :style="{
            height: expandedSections.extra ? sectionHeights.extra : '0px',
          }"
        >
          <div class="content-inner">
            <slot name="extra"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 24px 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider, #eaeaea);
}

.opt-name {
  background-color: var(--vp-c-brand-3);
  color: var(--sr-c-text-active);
  padding: 12px 20px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.opt-name .title {
  font-size: 1.2rem;
  margin: 0;
}

.default-value {
  font-size: 0.9rem;
  font-weight: normal;
}

.default-value code {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-content {
  padding: 0;
}

.section {
  padding: 0;
  border-bottom: var(--sr-border);
  transition: background-color 0.2s ease;
}

.section:last-child {
  border-bottom: none;
}

.section:hover {
  background-color: var(--vp-c-bg);
}

.section-header {
  font-size: 0.95rem;
  margin: 0;
  color: var(--vp-c-text-1, #2c3e50);
  display: flex;
  align-items: center;
  position: relative;
  transition: color 0.2s ease;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}

.section-header:hover {
  color: var(--vp-c-brand, #3eaf7c);
}

.section-header::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: var(--vp-c-brand, #3eaf7c);
  margin-right: 8px;
  border-radius: 2px;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.section:hover .section-header::before {
  transform: scaleY(1.2);
}

.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: rotate(0deg);
}

.toggle-icon.is-expanded {
  transform: rotate(90deg);
}

.content-wrapper {
  overflow: hidden;
  transition: height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.content-inner {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--vp-c-text-1, #2c3e50);
  padding: 0 20px 16px;
}

.background .section-header::before {
  background-color: var(--vp-c-indigo-1);
}
.function .section-header::before {
  background-color: var(--vp-c-purple-1);
}
.example .section-header::before {
  background-color: var(--vp-c-green-1);
}
.extra .section-header::before {
  background-color: var(--vp-c-yellow-1);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .opt-name {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-header {
    padding: 14px 16px;
  }

  .content-inner {
    padding: 0 16px 14px;
  }
}
</style>
