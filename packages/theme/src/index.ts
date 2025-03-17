import type { Theme } from "vitepress";
import DefaultThemeWithoutFonts from "vitepress/theme-without-fonts";
import Layout from "./client/Layout.vue";

import "./client/styles/custom.css";

export default {
  extends: DefaultThemeWithoutFonts,
  Layout,
} satisfies Theme;
