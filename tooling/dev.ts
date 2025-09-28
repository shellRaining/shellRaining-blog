import { spawn } from "node:child_process";
import type { ChildProcess, SpawnOptions } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

interface TaskHandle {
  name: string;
  process: ChildProcess;
}

const tasks = new Set<TaskHandle>();
let shuttingDown = false;
let exitCode: number | null = null;

function log(name: string, message: string) {
  process.stdout.write(`[${name}] ${message}\n`);
}

function pipeStream(stream: NodeJS.ReadableStream | null, name: string) {
  if (!stream) return;
  let buffer = "";
  stream.on("data", (chunk: Buffer | string) => {
    buffer += chunk.toString();
    let index: number;
    while ((index = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      log(name, line);
    }
  });
  stream.on("end", () => {
    if (buffer.length > 0) {
      log(name, buffer);
      buffer = "";
    }
  });
}

function spawnTask(name: string, command: string, args: string[], options: SpawnOptions) {
  const child = spawn(command, args, options);
  const handle: TaskHandle = { name, process: child };
  tasks.add(handle);

  pipeStream(child.stdout, name);
  pipeStream(child.stderr, name);

  child.on("exit", (code, signal) => {
    tasks.delete(handle);
    if (!shuttingDown) {
      if (code && code !== 0) {
        exitCode = code;
        shutdown(signal ?? "SIGTERM");
      } else if (signal) {
        shutdown(signal);
      }
    }

    if (tasks.size === 0) {
      process.exit(exitCode ?? code ?? 0);
    }
  });

  child.on("error", (error) => {
    log(name, `Process error: ${error instanceof Error ? error.message : String(error)}`);
    exitCode = exitCode ?? 1;
    shutdown("SIGTERM");
  });

  return child;
}

function shutdown(signal: NodeJS.Signals | "SIGTERM") {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  log("dev", `Received ${signal}, stopping tasks...`);
  for (const { process: child } of tasks) {
    child.kill(signal === "SIGTERM" ? undefined : signal);
  }
}

function main() {
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  const baseEnv = {
    ...process.env,
    FORCE_COLOR: process.env.FORCE_COLOR ?? "1",
  } as NodeJS.ProcessEnv;

  spawnTask(
    "theme",
    "bun",
    ["run", "./scripts/dev.ts"],
    {
      cwd: path.join(repoRoot, "packages/theme"),
      env: baseEnv,
      stdio: ["inherit", "pipe", "pipe"],
    },
  );

  spawnTask(
    "content",
    "pnpm",
    ["run", "dev"],
    {
      cwd: path.join(repoRoot, "packages/content"),
      env: baseEnv,
      stdio: ["inherit", "pipe", "pipe"],
    },
  );
}

main();
