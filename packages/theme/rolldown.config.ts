import typescript from "@rollup/plugin-typescript";
import { defineConfig, type RolldownOptions } from "rolldown";
import pkg from "./package.json";
import fs from "fs";
import path from "path";

// Define external dependencies
const external = [
  "fs",
  "path",
  "child_process",
  "crypto",
  "url",
  "node:fs",
  "node:path",
  "node:child_process",
  "node:crypto",
  "node:url",
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

// Environment detection
const isDev = process.env.NODE_ENV === "development";

// Common plugins
const plugins = [
  typescript({
    tsconfig: "./src/node/tsconfig.json",
  }),
  // Note: skip minification for faster builds; node-side ESM doesn't need terser
];

// Auto-discover plugins
const pluginsDir = "src/node/plugins";
const pluginInputs = fs
  .readdirSync(pluginsDir)
  .filter((file) => file.endsWith(".ts"))
  .reduce(
    (acc, file) => {
      const name = path.basename(file, ".ts");
      acc[`plugins/${name}`] = `./${path.join(pluginsDir, file)}`;
      return acc;
    },
    {} as Record<string, string>,
  );

// Build configuration for the main modules
const mainConfig = {
  input: {
    // Core utility modules
    fontmin: "./src/node/fontmin.ts",
    injectVersion: "./src/node/injectVersion.ts",

    ...pluginInputs,

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
