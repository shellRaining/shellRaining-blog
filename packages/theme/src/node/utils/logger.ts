import { createConsola, LogLevels } from "consola";

// 解析日志级别
function parseLogLevel(): number {
  const levelStr = process.env.VITE_LOG_LEVEL;
  if (!levelStr) {
    return process.env.NODE_ENV === "production"
      ? LogLevels.warn
      : LogLevels.info;
  }

  const levelMap: Record<string, number> = {
    silent: LogLevels.silent,
    error: LogLevels.error,
    warn: LogLevels.warn,
    info: LogLevels.info,
    debug: LogLevels.debug,
    trace: LogLevels.trace,
  };

  return levelMap[levelStr.toLowerCase()] ?? LogLevels.info;
}

export const logger = createConsola({
  level: parseLogLevel(),
});

export { LogLevels };
