<script setup lang="ts">
import { useData } from "vitepress";
import { data as collections } from "../../node/loader/series.data";
import { computed } from "vue";

const { frontmatter } = useData();
const seriesName = computed(() => frontmatter.value?.series?.name);
const series = computed(() =>
  seriesName.value ? collections[seriesName.value] : [],
);
const currentIndex = computed(() =>
  seriesName.value ? frontmatter.value?.series?.part - 1 : -1,
);

// 确定每篇文章的阅读状态
const getItemStatus = (index: number) => {
  if (currentIndex.value === -1) return "unread";
  if (index === currentIndex.value) return "current";
  if (index < currentIndex.value) return "read";
  return "unread";
};
</script>

<template>
  <div v-if="seriesName" class="series-navigation">
    <header class="series-header">
      <h3 class="series-title">系列文章</h3>
      <p class="series-description">{{ seriesName }}</p>
    </header>

    <div class="series-content">
      <ul>
        <li
          v-for="(item, index) in series"
          :key="index"
          class="series-item"
          :class="[getItemStatus(index)]"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <a :href="item.url" class="series-link">
            <span class="series-indicator"></span>
            <span class="series-text">{{ item.title }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.series-navigation {
  background-color: var(--sr-c-bg);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.series-header {
  padding: 16px;
  border-bottom: var(--sr-border);
}

.series-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--sr-c-text-active);
}

.series-description {
  font-size: 12px;
  margin: 4px 0 0;
  color: var(--sr-c-text);
}

.series-content {
  position: relative;
  padding: 12px;
}

.series-item {
  position: relative;
  animation: enterFromLeft 0.3s ease-out both;
}

.series-link {
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 0;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
}

.series-item.current .series-link {
  background-color: var(--sr-c-bg-hover);
}

.series-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 0 8px;
  transition: transform 0.3s ease;
}

.series-link:hover .series-indicator {
  transform: scale(1.5);
}

.series-item.read .series-indicator {
  background-color: #22c55e; /* Green */
}

.series-item.current .series-indicator {
  background-color: #3b82f6; /* Blue */
  animation: pulse 2s ease-in-out infinite;
}

.series-item.unread .series-indicator {
  background-color: #d1d5db; /* Gray */
}

.series-text {
  font-size: 12px;
  color: var(--sr-c-small-text);
  transition: color 0.3s;
}

.series-link:hover .series-text {
  color: var(--sr-c-small-text-hover);
}

.series-item.current .series-text {
  font-weight: 600;
  color: var(--sr-c-small-text-active);
}

.series-item.unread .series-text {
  color: var(--sr-c-small-text-muted);
}

@keyframes enterFromLeft {
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
