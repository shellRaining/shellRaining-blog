<script setup lang="ts">
defineProps<{
  variant?: "primary" | "secondary" | "toggle";
  active?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button
    :class="['t-btn', `t-btn--${variant ?? 'secondary'}`, { active }]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.t-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-family: inherit;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: var(--sr-border);
  background: transparent;
  color: var(--sr-c-small-text-muted);
}

.t-btn:hover {
  color: var(--sr-c-small-text-hover);
  border-color: var(--sr-c-bg-hover);
}

.t-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.t-btn--primary {
  background: var(--sr-c-btn);
  color: #fff;
  border-color: var(--sr-c-btn);
}

.t-btn--primary:hover:not(:disabled) {
  background: var(--sr-c-btn-hover);
  border-color: var(--sr-c-btn-hover);
}

.t-btn--toggle {
  color: var(--sr-c-small-text-muted);
}

.t-btn--toggle.active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}
</style>
