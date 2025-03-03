import type { DefaultTheme, SiteConfig, UserConfig } from "vitepress";

import markdownItMark from "markdown-it-mark";
import markdownItSup from "markdown-it-sup";
import markdownItSub from "markdown-it-sub";
import markdownItTaskLists from "markdown-it-task-lists";
import {
  generateFontFaceCSS,
  getAllChars,
  subsetFont,
  type FontConfig,
} from "./fontmin";
import { join } from "path";
import { basename, dirname } from "path/posix";
import { unlinkSync } from "fs";

const APPEARANCE_KEY = "shellRaining-blog-theme";

export type ShellRainingBlogThemeConfig = DefaultTheme.Config & {
  font: FontConfig[];
};

export const shellRainingBlogConfig: UserConfig<ShellRainingBlogThemeConfig> = {
  appearance: false,
  vite: {
    build: {
      target: "esnext",
    },
    plugins: [
      {
        name: "vite-plugin-blog-fontmin",
        async buildStart() {
          const env = this.environment;
          if (env.name !== "client") return;

          const siteConfig: SiteConfig = (env.config as any).vitepress;
          const userFontConfig: FontConfig[] = siteConfig.site.themeConfig.font;
          const allChars = getAllChars(siteConfig.pages);
          const text = Array.from(allChars).join("");

          for (const fontConfig of userFontConfig) {
            const src = fontConfig.src.replace(/^\/+/, ""); // 去掉开头的斜杠
            const dest = fontConfig.dest.replace(/^\/+/, "");
            const absoluteSrc = join(siteConfig.srcDir, "public", src);
            const absoluteDest = join(siteConfig.outDir, dest);
            const subsettedFontBuffer = await subsetFont(
              absoluteSrc,
              absoluteDest,
              text,
            );

            env.mode === "build" &&
              this.emitFile({
                type: "asset",
                fileName: dest,
                source: subsettedFontBuffer,
              });
            siteConfig.site.head.push([
              "link",
              {
                rel: "preload",
                as: "font",
                href: dest,
                type: "font/woff2",
                crossorigin: "anonymous",
              },
              "",
            ]);
          }

          const fontFaceCSS = generateFontFaceCSS(userFontConfig);
          siteConfig.site.head.push(["style", {}, fontFaceCSS]);
        },

        generateBundle() {
          const env = this.environment;
          if (env.name !== "client") return;

          const siteConfig: SiteConfig = (env.config as any).vitepress;
          const userFontConfig: FontConfig[] = siteConfig.site.themeConfig.font;

          for (const fontConfig of userFontConfig) {
            const src = fontConfig.src.replace(/^\/+/, ""); // 去掉开头的斜杠
            const dest = fontConfig.dest.replace(/^\/+/, "");
            const absoluteSrc = join(siteConfig.srcDir, "public", src);
            const absoluteDest = join(siteConfig.outDir, dest);

            const fontname = basename(absoluteSrc);
            const absoluteDestDir = dirname(absoluteDest);
            const copyedFontPath = join(absoluteDestDir, fontname);
            unlinkSync(copyedFontPath);
          }
        },
      },
    ],
  },
  head: [
    [
      "link",
      {
        rel: "sitemap",
        type: "application/xml",
        title: "Sitemap",
        href: "/sitemap.xml",
      },
    ],
    [
      "script",
      { id: "check-dark-mode" },
      `;(() => {
            const preference = localStorage.getItem('${APPEARANCE_KEY}')
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            if (!preference || preference === 'auto' ? prefersDark : preference === 'dark')
              document.documentElement.classList.add('dark')
          })()`,
    ],
    [
      "link",
      { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#5bbad5" },
    ],
    ["link", { rel: "icon", href: "/favicon.ico" }],
  ],
  sitemap: {
    hostname: "https://shellraining.xyz",
  },
  markdown: {
    math: true,
    config(md) {
      md.use(markdownItMark);
      md.use(markdownItSub);
      md.use(markdownItSup);
      md.use(markdownItTaskLists, { enabled: false });
    },
  },
};
