import type MarkdownIt from "markdown-it";
import type { PluginSimple } from "markdown-it";
import {
  batchDetectImageSizes,
  type ImageDimensions,
} from "../utils/image-size-detector";

export interface LazyImagePluginOptions {
  enabled?: boolean;
  defaultAspectRatio?: number | string;
  // 排除的图片 URL 模式
  exclude?: RegExp[];
  // 是否检测外部图片尺寸
  detectRemoteSize?: boolean;
  // 批量检测（构建时）
  batchDetect?: boolean;
}

const defaultOptions: Required<LazyImagePluginOptions> = {
  enabled: true,
  defaultAspectRatio: 4 / 3,
  exclude: [
    /favicon\.ico$/i,
    /^\/icons?\//i, // 排除 /icon/ 或 /icons/ 目录
    /\.svg$/i, // 排除 SVG（通常是图标）
  ],
  detectRemoteSize: true,
  batchDetect: true,
};

// 全局收集的图片 URL
const globalImageUrls = new Set<string>();
// 全局尺寸缓存（内存中）
const globalSizeCache = new Map<string, ImageDimensions | null>();
// 批量检测是否已完成
let batchDetectionDone = false;

export function createLazyImagePlugin(
  options: LazyImagePluginOptions = {},
): PluginSimple {
  const opts = { ...defaultOptions, ...options };

  return (md: MarkdownIt) => {
    if (!opts.enabled) return;

    // 保存原始的 image 渲染规则
    const defaultImageRender =
      md.renderer.rules.image ||
      ((tokens, idx, options, env, self) =>
        self.renderToken(tokens, idx, options));

    // 覆盖 image 渲染规则
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const src = token.attrGet("src") || "";
      const alt = token.content || "";
      const title = token.attrGet("title") || "";

      // 检查是否需要排除
      if (opts.exclude.some((pattern) => pattern.test(src))) {
        return defaultImageRender(tokens, idx, options, env, self);
      }

      // 收集图片 URL（用于批量检测）
      if (opts.batchDetect && opts.detectRemoteSize) {
        globalImageUrls.add(src);
      }

      // 构建组件属性
      const attrs: string[] = [
        `src="${md.utils.escapeHtml(src)}"`,
        `alt="${md.utils.escapeHtml(alt)}"`,
      ];

      // 保留原生 HTML 属性
      const htmlWidth = token.attrGet("width");
      const htmlHeight = token.attrGet("height");

      if (title) {
        attrs.push(`title="${md.utils.escapeHtml(title)}"`);
      }

      // 尝试获取宽高比
      let aspectRatio: string | null = null;

      // 1. 从全局缓存获取（批量检测后会填充）
      if (globalSizeCache.has(src)) {
        const dimensions = globalSizeCache.get(src);
        if (dimensions) {
          aspectRatio = dimensions.aspectRatio;
        }
      }
      // 2. 从 HTML 属性推断
      else if (htmlWidth && htmlHeight) {
        const w = parseInt(htmlWidth, 10);
        const h = parseInt(htmlHeight, 10);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          // 简化分数
          const gcd = (a: number, b: number): number =>
            b === 0 ? a : gcd(b, a % b);
          const divisor = gcd(w, h);
          aspectRatio = `${w / divisor}/${h / divisor}`;
        }
      }

      // 添加宽高比属性
      if (aspectRatio) {
        attrs.push(`:aspect-ratio="${aspectRatio}"`);
      }

      return `<LazyImage ${attrs.join(" ")} />`;
    };
  };
}

// 导出批量检测方法（供构建脚本调用）
export async function preloadImageSizes() {
  if (batchDetectionDone || globalImageUrls.size === 0) {
    return;
  }

  const urls = Array.from(globalImageUrls);
  const results = await batchDetectImageSizes(urls);

  // 将结果填充到全局缓存
  results.forEach((dimensions, url) => {
    globalSizeCache.set(url, dimensions);
  });

  batchDetectionDone = true;
}

// 重置状态（用于测试或多次构建）
export function resetLazyImageState() {
  globalImageUrls.clear();
  globalSizeCache.clear();
  batchDetectionDone = false;
}
