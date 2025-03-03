import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { defineConfig } from "rolldown";
import esmShim from '@rollup/plugin-esm-shim';
import { glob } from "glob";
import path from "path";

const plugins = [
  typescript({
    declaration: true,
    allowSyntheticDefaultImports: true,
    include: "./src/node/*.ts",
    outDir: "dist/node",
  }),
  // terser({ format: { comments: false } }),
  esmShim(),
];

// Use glob to find all entry files
const entries = glob
  .sync("./src/node/[!.]*.ts")
  .filter((file) => !file.endsWith(".d.ts"))
  .map((file) => {
    const baseName = path.basename(file, ".ts");
    return {
      input: file,
      output: {
        file: `dist/node/${baseName}.js`,
        format: "esm",
      },
      external: ["fs", "path"],
      plugins,
    };
  });

export default defineConfig(entries);
