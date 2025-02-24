import type { DefaultTheme, UserConfig } from "vitepress";

const APPEARANCE_KEY = "shellRaining-blog-theme";

export const shellRainingBlogConfig: UserConfig<DefaultTheme.Config> = {
  appearance: false,
  vite: {
    build: {
      target: "es2020",
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
  },
};
