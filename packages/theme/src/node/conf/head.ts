import type { HeadConfig } from "vitepress";

const APPEARANCE_KEY = "shellRaining-blog-theme";

export const headConf: HeadConfig[] = [
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
];
