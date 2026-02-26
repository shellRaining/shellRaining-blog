<template>
  <div class="info-panel">
    <slot />
  </div>
</template>

<style scoped>
.info-panel {
  padding: 10px 14px;
  font-size: 13px;
  background: var(--sr-c-bg-section);
  border: var(--sr-border);
  border-radius: 6px;
  color: var(--sr-c-small-text-muted);
}
</style>
