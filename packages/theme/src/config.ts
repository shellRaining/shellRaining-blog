import type { DefaultTheme, UserConfig } from "vitepress";

import markdownItMark from "markdown-it-mark";
import markdownItSup from "markdown-it-sup";
import markdownItSub from "markdown-it-sub";
import markdownItTaskLists from "markdown-it-task-lists";

const APPEARANCE_KEY = "shellRaining-blog-theme";

export const shellRainingBlogConfig: UserConfig<DefaultTheme.Config> = {
  appearance: false,
  vite: {
    build: {
      target: "esnext",
    },
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
