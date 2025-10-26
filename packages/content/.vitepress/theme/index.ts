import shellRainingBlogTheme from "@shellraining/theme";
import type { Theme } from "vitepress";
import { enhanceAppWithPwa } from "@vite-pwa/vitepress";

export default {
  extends: shellRainingBlogTheme,
  enhanceApp({ app }) {
    enhanceAppWithPwa(app);
  },
} satisfies Theme;
