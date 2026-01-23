import path from "path";
import probe from "probe-image-size";
import pLimit from "p-limit";
import { CacheManager } from "./cache-manager";

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: string; // "16/9" 格式
}

const REQUEST_TIMEOUT = 10000; // 10秒超时
const MAX_CONCURRENT = 5; // 最大并发数

// 创建并发限制器
const limit = pLimit(MAX_CONCURRENT);

// 创建缓存管理器
const cache = new CacheManager<ImageDimensions>({
  strategy: "single-file",
  cachePath: path.join(
    process.cwd(),
    ".vitepress",
    "cache",
    "lazy-image-cache.json",
  ),
  ttl: 7 * 24 * 60 * 60 * 1000, // 7天
  logPrefix: "LazyImage",
});

// 简化分数（GCD 算法）
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyAspectRatio(width: number, height: number): string {
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

// 检测单张图片尺寸
export async function detectImageSize(
  url: string,
): Promise<ImageDimensions | null> {
  // 先检查缓存
  const cached = cache.get(url);
  if (cached) {
    return cached;
  }

  try {
    // 使用 probe-image-size 仅下载图片头部
    const result = await probe(url, {
      timeout: REQUEST_TIMEOUT,
    });

    if (!result.width || !result.height) {
      return null;
    }

    const dimensions: ImageDimensions = {
      width: result.width,
      height: result.height,
      aspectRatio: simplifyAspectRatio(result.width, result.height),
    };

    // 写入缓存
    cache.set(url, dimensions);

    return dimensions;
  } catch (error) {
    console.warn(`[LazyImage] Failed to detect size for ${url}:`, error);
    return null;
  }
}

// 批量检测图片尺寸（带并发控制）
export async function batchDetectImageSizes(
  urls: string[],
): Promise<Map<string, ImageDimensions | null>> {
  const tasks = urls.map((url) =>
    limit(() =>
      detectImageSize(url).then((dimensions) => ({ url, dimensions })),
    ),
  );

  const results = await Promise.all(tasks);
  const resultMap = new Map<string, ImageDimensions | null>();

  results.forEach(({ url, dimensions }) => {
    resultMap.set(url, dimensions);
  });

  return resultMap;
}
