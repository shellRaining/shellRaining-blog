import typescript from "@rollup/plugin-typescript";
import { defineConfig, type RolldownOptions } from "rolldown";
import nodeExternals from "rollup-plugin-node-externals";
import fs from "fs";
import path from "path";

// Environment detection
const isDev = process.env.NODE_ENV === "development";

// Common plugins
const plugins = [
  nodeExternals(),
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
  plugins,
} as RolldownOptions;

export default defineConfig(mainConfig);
