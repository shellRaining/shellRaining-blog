import type { Theme } from "vitepress";
import DefaultThemeWithoutFonts from "vitepress/theme-without-fonts";
import Layout from "./Layout.vue";

import "./styles/custom.css";

export default {
  extends: DefaultThemeWithoutFonts,
  Layout,
} satisfies Theme;

export * from "./config";
