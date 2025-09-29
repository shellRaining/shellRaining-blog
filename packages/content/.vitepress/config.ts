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
    description: "feedId:161810250393119744+userId:84194849099223040",
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
    socialLinks: [
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path pathLength="1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2c2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2a4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6c-.6.6-.6 1.2-.5 2V21"/></svg>',
        },
        ariaLabel: "GitHub",
        link: "https://github.com/shellRaining",
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path pathLength="1" fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19t.588-1.412T5 17t1.413.588T7 19t-.587 1.413T5 21m13.5 0q-.65 0-1.088-.475T16.9 19.4q-.275-2.425-1.312-4.537T12.9 11.1T9.138 8.413T4.6 7.1q-.65-.075-1.125-.512T3 5.5t.45-1.062t1.075-.363q3.075.275 5.763 1.563t4.737 3.337t3.338 4.738t1.562 5.762q.05.625-.363 1.075T18.5 21m-6 0q-.625 0-1.075-.437T10.85 19.5q-.225-1.225-.787-2.262T8.65 15.35t-1.888-1.412T4.5 13.15q-.625-.125-1.062-.575T3 11.5q0-.65.45-1.075t1.075-.325q1.825.25 3.413 1.063t2.837 2.062t2.063 2.838t1.062 3.412q.1.625-.325 1.075T12.5 21"/></svg>',
        },
        ariaLabel: "RSS",
        link: "/feed.rss",
      },
    ],
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
