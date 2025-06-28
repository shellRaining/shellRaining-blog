import type { DefaultTheme, UserConfig } from "vitepress";
import type { FontConfig } from "./fontmin";
import { getVersions } from "./injectVersion";
import { fontPlugin } from "./plugins/font";
import { headPlugin } from "./plugins/head";
import { markdownPlugin } from "./plugins/markdown";
import { RssPlugin } from "./plugins/rss";

export type ShellRainingBlogThemeConfig = DefaultTheme.Config & {
  font?: FontConfig[];
};

const baseUrl = "https://shellraining.xyz";

const RSS = {
  title: "shellRaining Blog",
  baseUrl,
  copyright: "Copyright (c) 2023-present, shellRaining",
};

export const shellRainingBlogConfig: UserConfig<ShellRainingBlogThemeConfig> = {
  appearance: false,
  vite: {
    build: {
      target: "esnext",
    },
    plugins: [fontPlugin, RssPlugin(RSS)],
  },
  head: headPlugin,
  themeConfig: {
    socialLinks: [],
    sidebar: [
      {
        text: "",
        items: [],
      },
    ],
  },
  sitemap: {
    hostname: baseUrl,
  },
  markdown: markdownPlugin,
  async transformPageData(pageData, ctx) {
    const versions = await getVersions(pageData, ctx);
    pageData.versions = versions;
    pageData.frontmatter.sidebar = !!pageData.frontmatter.series;
  },
};
