import type { DefaultTheme, UserConfig } from "vitepress";
import type { FontConfig } from "./fontmin";
import { getVersions } from "./injectVersion";
import { fontPlugin } from "./plugins/font";
import { headConf } from "./conf/head";
import { markdownConf } from "./conf/markdown";
import { RssPlugin, type RSSOptions } from "./plugins/rss";
import { linkCardPreloadPlugin } from "./plugins/link-card-preload";

type themeOpts = {
  baseUrl: string;
  rss: RSSOptions;
};
export interface ShellRainingBlogThemeConfig extends DefaultTheme.Config {
  font?: FontConfig[];
}

export function createConfig({
  baseUrl,
  rss,
}: themeOpts): UserConfig<ShellRainingBlogThemeConfig> {
  return {
    appearance: false,
    vite: {
      build: {
        target: "esnext",
      },
      plugins: [
        fontPlugin,
        RssPlugin(rss),
        linkCardPreloadPlugin({
          enabled: true,
          excludeDomains: [],
          includeDomains: [],
        }),
      ],
    },
    head: headConf,
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
    markdown: markdownConf,
    async transformPageData(pageData, ctx) {
      const versions = await getVersions(pageData, ctx);
      pageData.versions = versions;
      pageData.frontmatter.sidebar = !!pageData.frontmatter.series;
    },
  };
}
