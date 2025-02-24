import { defineConfig } from "vitepress";
import { shellRainingBlogConfig } from "@shellraining-blog/theme/config";

const fontPath = "/font/LXGWWenKaiScreen.woff2";

export default defineConfig({
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
  },
  head: [
    [
      "link",
      { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#5bbad5" },
    ],
    ["link", { rel: "icon", href: "/favicon.ico" }],
    [
      "link",
      {
        rel: "preload",
        href: fontPath,
        type: "font/woff2",
        as: "font",
        crossorigin: "anonymous",
      },
    ],
    [
      "style",
      {},
      `@font-face{font-family:"LXGW WenKai Screen";src:url('${fontPath}') format("woff2");font-weight:normal;font-style:normal;font-display:swap}:root{--vp-font-family-base:"LXGW WenKai Screen",sans-serif`,
    ],
  ],
});
