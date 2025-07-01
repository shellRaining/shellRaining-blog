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
    const normalize = (url: string) =>
      url
        .replace(/^\/+/, "")
        .replace(/\.html$/, "")
        .replace(/\.md$/, "");

    const normalizedItem = normalize(itemUrl);
    const normalizedCurrent = normalize(currentPath);

    return normalizedItem === normalizedCurrent;
  };

  const currentPath = page.value.relativePath;

  return currentSeries.value.findIndex((item) =>
    matchUrl(item.url, currentPath),
  );
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
  margin: 3rem 0 2rem;
  border-top: var(--sr-border);
  padding-top: 2rem;
}

.series-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--sr-c-text-muted);
}

.series-label {
  color: var(--sr-c-small-text-muted);
  font-weight: 400;
}

.series-name {
  color: var(--sr-c-link);
  font-weight: 500;
}

.series-progress {
  color: var(--sr-c-small-text-muted);
  margin-left: auto;
  font-size: 0.8125rem;
}

.series-controls {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

.series-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  text-decoration: none;
  color: var(--sr-c-text);
  transition: color 0.2s ease;
  min-width: 0;
  flex: 1;

  &:hover {
    color: var(--sr-c-link-hover);
  }

  &:hover .btn-icon {
    transform: translateX(0.25rem);
  }

  &.prev:hover .btn-icon {
    transform: translateX(-0.25rem);
  }

  &.next {
    justify-content: flex-end;
    text-align: right;
  }

  &.prev {
    justify-content: flex-start;
    text-align: left;
  }
}

.btn-icon {
  font-size: 1rem;
  color: var(--sr-c-link);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.btn-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.btn-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--sr-c-small-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-title {
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9375rem;
}

kbd {
  display: inline-block;
  padding: 0.0625rem 0.25rem;
  font-size: 0.625rem;
  font-family: var(--vp-font-family-mono);
  background: var(--sr-c-bg-section);
  border: 1px solid var(--sr-c-border);
  border-radius: 3px;
  color: var(--sr-c-small-text-muted);
  margin-left: 0.25rem;
}

@media (max-width: 768px) {
  .series-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .series-btn {
    justify-content: flex-start !important;
    text-align: left !important;

    &.next {
      flex-direction: row-reverse;
    }

    &.next .btn-content {
      text-align: left;
    }
  }

  .btn-title {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .series-navigation {
    margin: 2rem 0 1.5rem;
    padding-top: 1.5rem;
  }

  .series-info {
    margin-bottom: 1rem;
    font-size: 0.8125rem;
  }

  .btn-label {
    font-size: 0.6875rem;
  }

  .btn-title {
    font-size: 0.8125rem;
  }
}
</style>
