import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import type {
  ChildProcess,
  SpawnOptions,
  SpawnSyncOptions,
} from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.resolve(scriptDir, "..", "");
const distConfig = path.join(themeRoot, "dist", "node", "config.js");
const rolldownBin = path.join(
  themeRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "rolldown.cmd" : "rolldown",
);

const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "development" };
const spawnOpts: SpawnOptions = {
  cwd: themeRoot,
  stdio: "inherit",
  env,
};
const spawnSyncOpts: SpawnSyncOptions = { ...spawnOpts };

if (!existsSync(distConfig)) {
  console.log("dist missing, running initial development build...");
  const buildResult = spawnSync(rolldownBin, ["-c", "./rolldown.config.ts"], spawnSyncOpts);
  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1);
  }
}

console.log("starting rolldown in watch mode...");
const watcher: ChildProcess = spawn(
  rolldownBin,
  ["-c", "./rolldown.config.ts", "-w"],
  spawnOpts,
);

const stopWatcher = (signal: NodeJS.Signals) => {
  if (!watcher.killed) {
    watcher.kill(signal);
  }
};

process.once("SIGINT", () => stopWatcher("SIGINT"));
process.once("SIGTERM", () => stopWatcher("SIGTERM"));

watcher.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
