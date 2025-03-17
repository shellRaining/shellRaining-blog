import { defineConfigWithTheme } from "vitepress";
import { shellRainingBlogConfig } from "@shellraining/theme/config";
import type { ShellRainingBlogThemeConfig } from "@shellraining/theme/config";

export default defineConfigWithTheme<ShellRainingBlogThemeConfig>({
  extends: shellRainingBlogConfig,
  lang: "zh-cn",
  title: "shellRaining's blog",
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
