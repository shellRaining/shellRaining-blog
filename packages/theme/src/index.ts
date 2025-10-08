import type { Theme } from "vitepress";
import DefaultThemeWithoutFonts from "vitepress/theme-without-fonts";
import Layout from "./client/Layout.vue";
import LinkCard from "./client/components/LinkCard.vue";
import LazyImage from "./client/components/LazyImage.vue";
import PhotoGrid from "./client/components/PhotoGrid.vue";
import PhotoViewer from "./client/components/PhotoViewer.vue";

import "./client/styles/custom.css";

export default {
  extends: DefaultThemeWithoutFonts,
  Layout,
  enhanceApp({ app }) {
    // 注册全局组件
    app.component("LinkCard", LinkCard);
    app.component("LazyImage", LazyImage);
    app.component("PhotoGrid", PhotoGrid);
    app.component("PhotoViewer", PhotoViewer);
  },
} satisfies Theme;
