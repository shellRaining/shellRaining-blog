import type { PluginOption } from "vite";
import type { SiteConfig } from "vitepress";
import { preloadLinkCardData } from "./link-card";
import path from "path";
import { logger, LogLevels, buildMetrics } from "../utils/logger";

export interface LinkCardPreloadOptions {
  enabled?: boolean;
  excludeDomains?: string[];
  includeDomains?: string[];
}

export const linkCardPreloadPlugin = (
  options: LinkCardPreloadOptions = {},
): PluginOption => {
  const opts = {
    enabled: true,
    excludeDomains: [],
    includeDomains: [],
    ...options,
  };

  return {
    name: "vite-plugin-link-card-preload",

    async buildStart() {
      const env = this.environment;
      if (!opts.enabled || env.name !== "client") return;

      const startTime = performance.now();

      const siteConfig: SiteConfig = (env.config as any).vitepress;
      const pagesPath = siteConfig.pages.map((pageRelativePath) =>
        path.resolve(siteConfig.srcDir, pageRelativePath),
      );
      await preloadLinkCardData(pagesPath, opts);

      const duration = performance.now() - startTime;
      const details = `${pagesPath.length} pages scanned`;

      buildMetrics.record(
        "Link Card Preload",
        duration,
        pagesPath.length,
        details,
      );
    },
  };
};
