<script lang="ts" setup>
import type { ContentData } from "vitepress";
import { data } from "../../node/loader/posts.data";
import GroupedPostsCard from "./GroupedPostsCard.vue";
import VimHelpPanel from "../components/VimHelpPanel.vue";
import VimIndicator from "../components/VimIndicator.vue";
import { useVimKeyBindings } from "../composables/useVimKeyBindings";
import dayjs from "dayjs";
import { onMounted, watch } from "vue";
import { useData } from "vitepress";

const { page } = useData();
const vimBindings = useVimKeyBindings();

const posts = data.filter(({ frontmatter }) => {
  return Object.keys(frontmatter).length !== 0;
});
const groupedPosts = posts.reduce(
  (acc, post) => {
    const date = dayjs(post.frontmatter.date);
    const groupKey = date.format("YYYY-MM");

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }

    acc[groupKey].push(post);
    return acc;
  },
  {} as Record<string, ContentData[]>,
);

// Initialize vim bindings when component mounts
onMounted(() => {
  vimBindings.initializeSelection();
});

// Re-initialize selection when route changes to home
watch(
  () => page.value.relativePath,
  (newPath) => {
    if (newPath === "index.md") {
      vimBindings.initializeSelection();
    }
  },
);
</script>

<template>
  <article class="doc">
    <h1 class="doc-head">shellRaining's blog</h1>

    <ul>
      <li
        class="grouped-posts"
        v-for="(posts, date) in groupedPosts"
        :key="date"
      >
        <GroupedPostsCard :date="date" :posts="posts"></GroupedPostsCard>
      </li>
    </ul>

    <!-- Vim panels -->
    <VimHelpPanel
      :visible="vimBindings.showHelp.value"
      :key-bindings="vimBindings.keyBindings.value"
      @close="vimBindings.showHelp.value = false"
    />

    <!-- Vim indicator for homepage -->
    <VimIndicator page-type="home" />
  </article>
</template>

<style scoped>
.doc {
  margin: 20px auto;
  max-width: 32rem;

  .doc-head {
    font-size: 1.5rem;
    line-height: 2rem;
    color: black;
    text-align: center;

    .dark & {
      color: white;
    }
  }

  .grouped-posts {
    padding: 0.5rem;
  }
}

.box {
  position: absolute;
  left: 50%;
  height: 100px;
}
</style>
