<script setup lang="ts">
import DefaultTheme from "vitepress/theme-without-fonts";
import Title from "./Doc/Title.vue";
import Viewer from "./Viewer/Viewer.vue";
import Home from "./Home/Home.vue";
import AppearanceSwitcher from "./Home/AppearanceSwitcher.vue";
import Sidebar from "./Sidebar/Sidebar.vue";
import SeriesNavigation from "./components/SeriesNavigation.vue";
import VimHelpPanel from "./components/VimHelpPanel.vue";
import VimIndicator from "./components/VimIndicator.vue";
import { useVimKeyBindings } from "./composables/useVimKeyBindings";
import { useMobile } from "./composables/useMobile";

const { Layout } = DefaultTheme;
const vimBindings = useVimKeyBindings();
const { isMobile } = useMobile();
</script>

<template>
  <AppearanceSwitcher />
  <Layout>
    <template #sidebar-nav-after>
      <Sidebar />
    </template>

    <template #doc-before>
      <Title />
      <ClientOnly><Viewer /></ClientOnly>
    </template>

    <template #doc-after>
      <SeriesNavigation />
    </template>

    <template #home-features-after>
      <Home />
    </template>
  </Layout>

  <!-- Global Vim panels for article pages -->
  <VimHelpPanel
    v-if="!isMobile"
    :visible="vimBindings.showHelp.value"
    :key-bindings="vimBindings.keyBindings.value"
    @close="vimBindings.showHelp.value = false"
  />

  <!-- Vim indicator for article pages -->
  <VimIndicator v-if="!isMobile" :page-type="vimBindings.pageType.value" />
</template>
