<script setup lang="ts">
import DefaultTheme from "vitepress/theme-without-fonts";
import Title from "./Doc/Title.vue";
import Viewer from "./Viewer/Viewer.vue";
import Home from "./Home/Home.vue";
import AppearanceSwitcher from "./Home/AppearanceSwitcher.vue";
import Sidebar from "./Sidebar/Sidebar.vue";

const { Layout } = DefaultTheme;
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

    <template #home-features-after>
      <Home />
    </template>
  </Layout>
</template>
