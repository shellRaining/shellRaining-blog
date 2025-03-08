<script lang="ts" setup>
import type { ContentData } from "vitepress";
import { withBase } from "vitepress";

defineProps<{ post: ContentData }>();
</script>

<template>
  <a class="post-title" :href="withBase(post.url)">
    {{ post.frontmatter.title }}
  </a>
</template>

<style scoped>
.post-title {
  overflow-x: hidden;
  text-wrap: nowrap;
  text-overflow: ellipsis;
  color: var(--sr-c-text);
  font-weight: normal;
  padding: 0 1rem;
  transition: color 0.5s ease;

  &:hover {
    color: var(--sr-c-text-hover);
  }
}
</style>

<style>
@keyframes shift-to-left {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  50% {
    opacity: 0;
    transform: translateX(-100px);
  }
  100% {
    opacity: 0;
    transform: translateX(-100px);
  }
}
@keyframes push-from-right {
  0% {
    opacity: 0;
    transform: translateX(100px);
  }
  50% {
    opacity: 0;
    transform: translateX(100px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
::view-transition-old(route) {
  animation: shift-to-left 0.6s linear;
}
::view-transition-new(route) {
  animation: push-from-right 0.6s linear;
}
</style>
