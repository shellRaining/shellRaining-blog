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

<style></style>
