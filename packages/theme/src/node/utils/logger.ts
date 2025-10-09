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

/**
 * 构建性能指标收集器
 */
export class BuildMetrics {
  private metrics = new Map<
    string,
    { duration: number; count?: number; details?: string }
  >();

  /**
   * 记录一个构建阶段的性能指标
   * @param phase 阶段名称
   * @param duration 耗时（毫秒）
   * @param count 可选的处理项数量
   * @param details 可选的详细信息
   */
  record(
    phase: string,
    duration: number,
    count?: number,
    details?: string,
  ): void {
    this.metrics.set(phase, { duration, count, details });
  }

  /**
   * 获取性能汇总信息
   */
  getSummary(): Array<{
    phase: string;
    duration: number;
    count?: number;
    details?: string;
    percentage: number;
  }> {
    if (this.metrics.size === 0) {
      return [];
    }

    const total = Array.from(this.metrics.values()).reduce(
      (sum, m) => sum + m.duration,
      0,
    );

    return Array.from(this.metrics.entries())
      .map(([phase, { duration, count, details }]) => ({
        phase,
        duration,
        count,
        details,
        percentage: total > 0 ? (duration / total) * 100 : 0,
      }))
      .sort((a, b) => b.duration - a.duration); // 按耗时降序排列
  }

  /**
   * 清空所有指标
   */
  clear(): void {
    this.metrics.clear();
  }
}

// 全局构建指标收集器
export const buildMetrics = new BuildMetrics();

/**
 * 格式化时间显示
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}
