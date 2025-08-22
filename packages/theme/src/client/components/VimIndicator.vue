<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import {
  loadVimConfig,
  KeyUtils,
  DEFAULT_VIM_CONFIG,
} from "../config/vimKeybindings";
import { PAGE_TYPES } from "../config/vimConstants";

const props = defineProps<{
  pageType: "home" | "article" | "other";
}>();

const config = ref(DEFAULT_VIM_CONFIG);

onMounted(() => {
  config.value = loadVimConfig();
});

const indicators = computed(() => {
  switch (props.pageType) {
    case PAGE_TYPES.HOME:
      return [
        {
          key: `${KeyUtils.formatForDisplay(config.value.navigation.down)}/${KeyUtils.formatForDisplay(config.value.navigation.up)}`,
          action: "navigate",
        },
        {
          key: KeyUtils.formatForDisplay(config.value.navigation.enter),
          action: "select",
        },
        {
          key: KeyUtils.formatForDisplay(config.value.panels.help),
          action: "help",
        },
      ];
    case PAGE_TYPES.ARTICLE:
      return [
        {
          key: `${KeyUtils.formatForDisplay(config.value.scrolling.lineDown)}/${KeyUtils.formatForDisplay(config.value.scrolling.lineUp)}`,
          action: "scroll",
        },
        {
          key: `${config.value.scrolling.top}/${KeyUtils.formatForDisplay(config.value.scrolling.bottom)}`,
          action: "top/bottom",
        },
        {
          key: KeyUtils.formatForDisplay(config.value.navigation.back),
          action: "back",
        },
        {
          key: KeyUtils.formatForDisplay(config.value.panels.help),
          action: "help",
        },
      ];
    default:
      return [
        {
          key: KeyUtils.formatForDisplay(config.value.panels.help),
          action: "help",
        },
      ];
  }
});
</script>

<template>
  <div class="vim-indicator">
    <span
      v-for="(indicator, index) in indicators"
      :key="indicator.key"
      class="indicator-item"
    >
      <kbd>{{ indicator.key }}</kbd>
      <span class="action">{{ indicator.action }}</span>
      <span v-if="index < indicators.length - 1" class="separator">•</span>
    </span>
  </div>
</template>

<style scoped>
.vim-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
}

.vim-indicator:hover {
  opacity: 1;
}

.indicator-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.separator {
  margin: 0 0.25rem;
  opacity: 0.5;
}

kbd {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 3px;
  padding: 0.125rem 0.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.6rem;
}

.action {
  font-size: 0.7rem;
  opacity: 0.8;
}

@media (max-width: 640px) {
  .vim-indicator {
    bottom: 10px;
    right: 10px;
    font-size: 0.65rem;
    padding: 0.375rem 0.5rem;
  }

  kbd {
    font-size: 0.55rem;
    padding: 0.1rem 0.2rem;
  }

  .action {
    font-size: 0.6rem;
  }
}
</style>
