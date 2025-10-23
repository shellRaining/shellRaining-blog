<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast" role="status">
        {{ displayMessage }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
  message?: string;
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  message: "",
  duration: 2000,
});

const visible = ref(false);
const displayMessage = ref("");
let hideTimer: number | null = null;

function show(msg: string) {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  displayMessage.value = msg;
  visible.value = true;
  hideTimer = window.setTimeout(() => {
    visible.value = false;
  }, props.duration);
}

function hide() {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  visible.value = false;
}

// Watch message prop changes
watch(
  () => props.message,
  (newMessage) => {
    if (newMessage) {
      show(newMessage);
    }
  },
);

defineExpose({
  show,
  hide,
});
</script>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--vp-c-text-1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.02);
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  min-width: 200px;
  text-align: center;
}

/* Toast 过渡动画 */
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px) scale(0.9);
  filter: blur(4px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px) scale(0.95);
  filter: blur(2px);
}

/* 暗色模式优化 */
.dark .toast {
  background: rgba(30, 30, 32, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  color: var(--vp-c-text-1);
}
</style>
