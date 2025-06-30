<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { VimKeyBinding } from "../composables/useVimKeyBindings";

const props = defineProps<{
  visible: boolean;
  keyBindings: VimKeyBinding[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const overlayRef = ref<HTMLElement>();

const groupedBindings = computed(() => {
  const groups = {
    Navigation: [] as VimKeyBinding[],
    Panels: [] as VimKeyBinding[],
  };

  props.keyBindings.forEach((binding) => {
    if (
      binding.action.includes("navigate") ||
      binding.action.includes("select") ||
      binding.action.includes("back") ||
      binding.action.includes("series")
    ) {
      groups.Navigation.push(binding);
    } else {
      groups.Panels.push(binding);
    }
  });

  return groups;
});

const handleKeyDown = (event: KeyboardEvent) => {
  // Prevent all key events from propagating when modal is open
  event.stopPropagation();
  
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
  }
};

// Focus management
const focusModal = async () => {
  await nextTick();
  if (overlayRef.value) {
    overlayRef.value.focus();
  }
};

// Watch for visibility changes
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    document.addEventListener("keydown", handleKeyDown, true);
    focusModal();
  } else {
    document.removeEventListener("keydown", handleKeyDown, true);
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        ref="overlayRef"
        class="vim-help-overlay"
        @click="$emit('close')"
        tabindex="0"
      >
        <div class="vim-help-panel" @click.stop>
          <header class="vim-help-header">
            <h2>Vim Key Bindings</h2>
            <button
              class="close-btn"
              @click="$emit('close')"
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <div class="vim-help-content">
            <div
              v-for="(bindings, groupName) in groupedBindings"
              :key="groupName"
              class="binding-group"
            >
              <h3>{{ groupName }}</h3>
              <div class="binding-list">
                <div
                  v-for="binding in bindings"
                  :key="binding.key"
                  class="binding-item"
                >
                  <kbd class="key">{{ binding.key }}</kbd>
                  <span class="description">{{ binding.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <footer class="vim-help-footer">
            <p>
              Press <kbd>?</kbd> to toggle this panel, <kbd>Esc</kbd> to close
            </p>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.vim-help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.vim-help-panel {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.vim-help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-alt);

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--vp-c-text-1);
  }
}

.close-btn {
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

.vim-help-content {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.binding-group {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: var(--vp-c-text-1);
    border-bottom: 1px solid var(--vp-c-border);
    padding-bottom: 0.5rem;
  }
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.binding-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.key {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  color: var(--vp-c-text-1);
  min-width: 2.5rem;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.description {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  flex: 1;
}

.vim-help-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-alt);

  p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--vp-c-text-2);
    text-align: center;
  }

  kbd {
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-border);
    border-radius: 3px;
    padding: 0.125rem 0.25rem;
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
  }
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .vim-help-panel,
.modal-leave-active .vim-help-panel {
  transition: transform 0.2s ease;
}

.modal-enter-from .vim-help-panel,
.modal-leave-to .vim-help-panel {
  transform: scale(0.9);
}
</style>
