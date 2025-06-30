<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { data as seriesData } from "../../node/loader/series.data";

const { page } = useData();

const currentSeries = computed(() => {
  const seriesName = page.value.frontmatter.series?.name;
  if (!seriesName) return null;

  return seriesData[seriesName] || null;
});

const currentIndex = computed(() => {
  if (!currentSeries.value) return -1;

  // Create a comprehensive URL matcher that handles VitePress URL variations
  const matchUrl = (itemUrl: string, currentPath: string): boolean => {
    // Normalize both URLs for comparison
    const normalize = (url: string) => url.replace(/^\/+/, '').replace(/\.html$/, '').replace(/\.md$/, '');
    
    const normalizedItem = normalize(itemUrl);
    const normalizedCurrent = normalize(currentPath);
    
    return normalizedItem === normalizedCurrent;
  };

  const currentPath = page.value.relativePath;
  
  return currentSeries.value.findIndex((item) => matchUrl(item.url, currentPath));
});

const prevArticle = computed(() => {
  if (!currentSeries.value || currentIndex.value <= 0) return null;
  return currentSeries.value[currentIndex.value - 1];
});

const nextArticle = computed(() => {
  if (
    !currentSeries.value ||
    currentIndex.value >= currentSeries.value.length - 1
  )
    return null;
  return currentSeries.value[currentIndex.value + 1];
});
</script>

<template>
  <nav v-if="currentSeries" class="series-navigation" data-series-nav>
    <div class="series-info">
      <span class="series-label">Series:</span>
      <span class="series-name">{{ page.frontmatter.series.name }}</span>
      <span class="series-progress">
        {{ currentIndex + 1 }} of {{ currentSeries.length }}
      </span>
    </div>

    <div class="series-controls">
      <a
        v-if="prevArticle"
        :href="withBase(prevArticle.url)"
        class="series-btn prev"
        rel="prev"
        :title="`Previous: ${prevArticle.title} (vim: p)`"
        :aria-label="`Navigate to previous article: ${prevArticle.title}`"
      >
        <span class="btn-icon">←</span>
        <div class="btn-content">
          <span class="btn-label">Previous <kbd>p</kbd></span>
          <span class="btn-title">{{ prevArticle.title }}</span>
        </div>
      </a>

      <a
        v-if="nextArticle"
        :href="withBase(nextArticle.url)"
        class="series-btn next"
        rel="next"
        :title="`Next: ${nextArticle.title} (vim: n)`"
        :aria-label="`Navigate to next article: ${nextArticle.title}`"
      >
        <div class="btn-content">
          <span class="btn-label">Next <kbd>n</kbd></span>
          <span class="btn-title">{{ nextArticle.title }}</span>
        </div>
        <span class="btn-icon">→</span>
      </a>
    </div>
  </nav>
</template>

<style scoped>
.series-navigation {
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border-soft);
  border-radius: 8px;
}

.series-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.series-label {
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.series-name {
  color: var(--vp-c-brand);
  font-weight: 600;
}

.series-progress {
  color: var(--vp-c-text-3);
  margin-left: auto;
}

.series-controls {
  display: flex;
  gap: 1rem;
}

.series-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: all 0.2s ease;

  &:hover {
    background: var(--vp-c-bg-alt);
    border-color: var(--vp-c-brand);
    transform: translateY(-1px);
  }

  &.next {
    justify-content: flex-end;
    text-align: right;
  }
}

.btn-icon {
  font-size: 1.25rem;
  color: var(--vp-c-brand);
  flex-shrink: 0;
}

.btn-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.btn-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-title {
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

kbd {
  display: inline-block;
  padding: 0.1rem 0.3rem;
  font-size: 0.6rem;
  font-family: var(--vp-font-family-mono);
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-border);
  border-radius: 3px;
  margin-left: 0.25rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .series-controls {
    flex-direction: column;
  }

  .series-btn {
    justify-content: flex-start;
    text-align: left;

    &.next {
      justify-content: flex-start;
      text-align: left;
      flex-direction: row-reverse;
    }
  }
}
</style>
