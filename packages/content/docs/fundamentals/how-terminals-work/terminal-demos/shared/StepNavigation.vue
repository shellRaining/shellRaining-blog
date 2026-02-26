<script setup lang="ts">
const props = defineProps<{
  steps: string[];
  currentStep: string;
}>();

const emit = defineEmits<{
  (e: "update:currentStep", step: string): void;
}>();

function currentIndex() {
  return props.steps.indexOf(props.currentStep);
}

function prev() {
  const i = currentIndex();
  if (i > 0) emit("update:currentStep", props.steps[i - 1]);
}

function next() {
  const i = currentIndex();
  if (i < props.steps.length - 1)
    emit("update:currentStep", props.steps[i + 1]);
}
</script>

<template>
  <div class="step-nav">
    <button class="step-nav-btn" :disabled="currentIndex() === 0" @click="prev">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10 12L6 8L10 4" />
      </svg>
    </button>
    <span class="step-nav-label"
      >{{ currentIndex() + 1 }}/{{ steps.length }}</span
    >
    <button
      class="step-nav-btn"
      :disabled="currentIndex() === steps.length - 1"
      @click="next"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M6 12L10 8L6 4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.step-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.step-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  color: var(--sr-c-small-text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.2s;
}

.step-nav-btn:hover:not(:disabled) {
  color: var(--sr-c-small-text-hover);
}

.step-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.step-nav-label {
  font-size: 12px;
  color: var(--sr-c-small-text-muted);
  min-width: 3ch;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>
