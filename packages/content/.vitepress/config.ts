import { defineConfig } from "vitepress";
import { createConfig } from "@shellraining/theme/config";
import type { ShellRainingBlogThemeConfig } from "@shellraining/theme/config";

const baseUrl = "https://shellraining.xyz";
const title = "shellRaining's blog";
const shellRainingBlogThemeConfigOpts = createConfig({
  baseUrl,
  rss: {
    title,
    baseUrl,
    copyright: "Copyright (c) 2023-present, shellRaining",
  },
});

export default defineConfig<ShellRainingBlogThemeConfig>({
  extends: shellRainingBlogThemeConfigOpts,
  lang: "zh-cn",
  title,
  description: "A VitePress Site",
  themeConfig: {
    logo: { src: "/favicon.ico", width: 24, height: 24 },
    search: {
      provider: "algolia",
      options: {
        appId: "HXS18HBH21",
        apiKey: "819b70a09dc27f1cece22a43c2845038",
        indexName: "shellraining",
      },
    },
    outline: "deep",
    font: [
      {
        displayName: "霞鹜文楷",
        id: "LXGWWenKaiGBScreen",
        weight: 400,
        src: "/fonts/LXGWWenKaiGBScreen.ttf",
        dest: "/fonts/LXGWWenKaiGBScreen.woff2",
      },
    ],
  },
});
