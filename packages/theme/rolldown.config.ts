import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { defineConfig, type RolldownOptions } from "rolldown";

// Define external dependencies
const external = [
  "fs",
  "path",
  "child_process",
  "vitepress",
  "subset-font",
  "dayjs",
  "markdown-it-mark",
  "markdown-it-sup",
  "markdown-it-sub",
  "markdown-it-task-lists",
];

// Common plugins
const plugins = [
  typescript({
    tsconfig: "./src/node/tsconfig.json",
  }),
  terser({ format: { comments: false } }),
];

// Build configuration for the main modules
const mainConfig = {
  input: {
    // Core utility modules
    fontmin: "./src/node/fontmin.ts",
    injectVersion: "./src/node/injectVersion.ts",

    // Plugin modules
    "plugins/font": "./src/node/plugins/font.ts",
    "plugins/head": "./src/node/plugins/head.ts",
    "plugins/markdown": "./src/node/plugins/markdown.ts",

    // Main config
    config: "./src/node/config.ts",
  },
  output: {
    dir: "dist/node",
    format: "esm",
    entryFileNames: "[name].js",
    chunkFileNames: "chunks/[name]-[hash].js",
    preserveModules: true,
    preserveModulesRoot: "src/node",
  },
  external,
  plugins,
} as RolldownOptions;

export default defineConfig(mainConfig);
