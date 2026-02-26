<script setup lang="ts">
defineProps<{
  noPadding?: boolean;
}>();
</script>

<template>
  <div class="terminal-window">
    <div class="terminal-titlebar">
      <span class="terminal-dot" />
      <span class="terminal-dot" />
      <span class="terminal-dot" />
    </div>
    <div :class="['terminal-body', { 'no-padding': noPadding }]">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.terminal-window {
  border: var(--sr-border);
  border-radius: 8px;
  overflow: hidden;
  background: #0a0a0a;
  box-shadow: var(--sr-card-shadow);
}

.terminal-titlebar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid #262626;
  background: #141414;
}

.terminal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(82, 82, 82, 0.4);
}

.terminal-body {
  padding: 16px;
  color: #e5e5e5;
  font-family: "Geist Mono", "SF Mono", "Fira Code", ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.6;
}

.terminal-body.no-padding {
  padding: 0;
}
</style>
