import type { PluginOption } from "vite";
import {
  logger,
  LogLevels,
  buildMetrics,
  formatDuration,
} from "../utils/logger";

/**
 * 构建日志插件
 * 在构建结束时输出性能汇总信息
 */
function createBuildLoggerPlugin(): PluginOption {
  let config: any;

  return {
    name: "vite-plugin-build-logger",

    configResolved(resolvedConfig: any) {
      config = resolvedConfig;
    },

    async closeBundle() {
      // 只在 SSR build 结束时输出（最后一次 build）
      if (!config?.vitepress || !config.build?.ssr) return;

      // 只在 info 及以上级别输出汇总
      if (logger.level < LogLevels.info) return;

      const summary = buildMetrics.getSummary();
      if (summary.length === 0) return;

      // 计算总耗时
      const totalDuration = summary.reduce(
        (sum, item) => sum + item.duration,
        0,
      );

      // 输出性能汇总
      console.log("");
      logger.info("📊 Build Performance");
      console.log("─".repeat(70));

      summary.forEach(({ phase, duration, count, details, percentage }) => {
        const timeStr = formatDuration(duration).padStart(8);
        const percentStr = `${percentage.toFixed(1)}%`.padStart(6);
        const countStr = count !== undefined ? ` (${count} items)` : "";
        const bar = "█".repeat(Math.round(percentage / 2.5));

        console.log(
          `${phase.padEnd(25)} ${timeStr} ${percentStr} ${bar}${countStr}`,
        );

        if (details && logger.level >= LogLevels.debug) {
          console.log(`  ↳ ${details}`);
        }
      });

      console.log("─".repeat(70));
      console.log(`Total: ${formatDuration(totalDuration)}`);
      console.log("");

      // 构建结束后清空指标
      buildMetrics.clear();
    },
  };
}

export const buildLoggerPlugin = createBuildLoggerPlugin();
