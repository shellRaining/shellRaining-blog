import type { DefaultTheme, UserConfig } from "vitepress";
import type { FontConfig } from "./fontmin";
import { getVersions } from "./injectVersion";
import { fontPlugin } from "./plugins/font";
import { headPlugin } from "./plugins/head";
import { markdownPlugin } from "./plugins/markdown";

export type ShellRainingBlogThemeConfig = DefaultTheme.Config & {
  font?: FontConfig[];
};

export const shellRainingBlogConfig: UserConfig<ShellRainingBlogThemeConfig> = {
  appearance: false,
  vite: {
    build: {
      target: "esnext",
    },
    plugins: [fontPlugin],
  },
  head: headPlugin,
  themeConfig: {
    sidebar: [
      {
        text: "",
        items: [],
      },
    ],
  },
  sitemap: {
    hostname: "https://shellraining.xyz",
  },
  markdown: markdownPlugin,
  async transformPageData(pageData, ctx) {
    const versions = await getVersions(pageData, ctx);
    pageData.versions = versions;
    pageData.frontmatter.sidebar = !!pageData.frontmatter.series;
  },
};
