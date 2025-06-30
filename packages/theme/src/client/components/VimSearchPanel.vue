<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { withBase } from "vitepress";
import { data as postsData } from "../../node/loader/posts.data";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const searchQuery = ref("");
const searchInput = ref<HTMLInputElement>();
const selectedIndex = ref(0);

const filteredPosts = computed(() => {
  if (!searchQuery.value.trim()) return [];

  const query = searchQuery.value.toLowerCase().trim();
  return postsData
    .filter(
      (post) =>
        post.frontmatter.title?.toLowerCase().includes(query) ||
        post.frontmatter.description?.toLowerCase().includes(query) ||
        post.frontmatter.tags?.some((tag: string) =>
          tag.toLowerCase().includes(query),
        ),
    )
    .slice(0, 10); // Limit results
});

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case "Escape":
      emit("close");
      break;
    case "ArrowDown":
      event.preventDefault();
      selectedIndex.value = Math.min(
        filteredPosts.value.length - 1,
        selectedIndex.value + 1,
      );
      break;
    case "ArrowUp":
      event.preventDefault();
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
      break;
    case "Enter":
      event.preventDefault();
      selectCurrent();
      break;
  }
};

const selectCurrent = () => {
  const currentPost = filteredPosts.value[selectedIndex.value];
  if (currentPost) {
    window.location.href = withBase(currentPost.url);
  }
};

const selectPost = (index: number) => {
  selectedIndex.value = index;
  selectCurrent();
};

// Reset state when panel opens
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      searchQuery.value = "";
      selectedIndex.value = 0;
      nextTick(() => {
        searchInput.value?.focus();
      });
    }
  },
);

// Reset selected index when search changes
watch(searchQuery, () => {
  selectedIndex.value = 0;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="search-modal">
      <div v-if="visible" class="vim-search-overlay" @click="$emit('close')">
        <div class="vim-search-panel" @click.stop>
          <div class="search-input-container">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Search articles..."
              class="search-input"
              @keydown="handleKeyDown"
            />
            <button
              class="close-btn"
              @click="$emit('close')"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div v-if="searchQuery.trim()" class="search-results">
            <div v-if="filteredPosts.length === 0" class="no-results">
              No articles found for "{{ searchQuery }}"
            </div>

            <div v-else class="results-list">
              <div
                v-for="(post, index) in filteredPosts"
                :key="post.url"
                :class="['result-item', { selected: index === selectedIndex }]"
                @click="selectPost(index)"
                @mouseenter="selectedIndex = index"
              >
                <h3 class="result-title">{{ post.frontmatter.title }}</h3>
                <p
                  v-if="post.frontmatter.description"
                  class="result-description"
                >
                  {{ post.frontmatter.description }}
                </p>
                <div v-if="post.frontmatter.tags" class="result-tags">
                  <span
                    v-for="tag in post.frontmatter.tags.slice(0, 3)"
                    :key="tag"
                    class="tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="search-placeholder">
            <p>Start typing to search articles...</p>
            <div class="search-shortcuts">
              <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
              <span><kbd>Enter</kbd> to select</span>
              <span><kbd>Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.vim-search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  z-index: 1000;
}

.vim-search-panel {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.search-input-container {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--vp-c-border);
}

.search-input {
  flex: 1;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: var(--vp-c-text-1);
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--vp-c-brand);
  }

  &::placeholder {
    color: var(--vp-c-text-3);
  }
}

.close-btn {
  margin-left: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--vp-c-text-2);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
  }
}

.search-results {
  max-height: 50vh;
  overflow-y: auto;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.results-list {
  padding: 0.5rem 0;
}

.result-item {
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 1px solid var(--vp-c-border-soft);
  transition: background-color 0.2s ease;

  &:hover,
  &.selected {
    background: var(--vp-c-bg-soft);
  }

  &:last-child {
    border-bottom: none;
  }
}

.result-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.result-description {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.search-placeholder {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-2);

  p {
    margin: 0 0 1.5rem 0;
    font-size: 1rem;
  }
}

.search-shortcuts {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-3);

  kbd {
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-border);
    border-radius: 3px;
    padding: 0.125rem 0.25rem;
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
    margin: 0 0.125rem;
  }
}

/* Search modal transitions */
.search-modal-enter-active,
.search-modal-leave-active {
  transition: opacity 0.2s ease;
}

.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
}

.search-modal-enter-active .vim-search-panel,
.search-modal-leave-active .vim-search-panel {
  transition: transform 0.2s ease;
}

.search-modal-enter-from .vim-search-panel,
.search-modal-leave-to .vim-search-panel {
  transform: translateY(-20px) scale(0.95);
}
</style>
