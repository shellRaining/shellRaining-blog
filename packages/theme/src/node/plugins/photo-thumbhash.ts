import type { PluginOption } from "vite";
import type { SiteConfig } from "vitepress";
import { batchGenerateThumbHash } from "../utils/thumbhash-generator";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { logger, LogLevels, buildMetrics } from "../utils/logger";

export interface PhotoThumbHashOptions {
  enabled?: boolean;
  // 照片数据文件的相对路径（相对于 srcDir）
  dataFilePath?: string;
}

export interface Photo {
  url: string;
  caption?: string;
  date?: string;
  location?: string;
  tags?: string[];
  thumbhash?: string;
  thumbhashDataURL?: string;
  aspectRatio?: number;
}

const defaultOptions: Required<PhotoThumbHashOptions> = {
  enabled: true,
  dataFilePath: "docs/photos/data.ts",
};

export const photoThumbHashPlugin = (
  options: PhotoThumbHashOptions = {},
): PluginOption => {
  const opts = { ...defaultOptions, ...options };

  return {
    name: "vite-plugin-photo-thumbhash",

    async buildStart() {
      const env = this.environment;
      if (!opts.enabled || env.name !== "client") return;

      const siteConfig: SiteConfig = (env.config as any).vitepress;
      const dataFilePath = path.resolve(siteConfig.srcDir, opts.dataFilePath);

      // 检查文件是否存在
      if (!existsSync(dataFilePath)) {
        return;
      }

      // 性能监控开始
      const startTime = performance.now();

      try {
        // 读取照片数据文件
        const photos = await extractPhotosFromDataFile(dataFilePath);

        if (photos.length === 0) {
          return;
        }

        // 找出需要生成 thumbhash 的照片（没有 thumbhash 的）
        const photosNeedingHash = photos.filter((photo) => !photo.thumbhash);

        if (photosNeedingHash.length === 0) {
          return;
        }

        // 批量生成 thumbhash
        const urls = photosNeedingHash.map((p) => p.url);
        const results = await batchGenerateThumbHash(urls);

        // 更新照片数据
        let updateCount = 0;
        photosNeedingHash.forEach((photo) => {
          const result = results.get(photo.url);
          if (result) {
            photo.thumbhash = result.thumbhash;
            photo.thumbhashDataURL = result.dataURL;
            if (!photo.aspectRatio) {
              photo.aspectRatio = result.aspectRatio;
            }
            // 从 EXIF 提取的数据：仅在原数据没有时才使用
            if (!photo.date && result.date) {
              photo.date = result.date;
            }
            if (!photo.location && result.location) {
              photo.location = result.location;
            }
            updateCount++;
          }
        });

        if (updateCount > 0) {
          // 回写文件
          await writePhotosToDataFile(dataFilePath, photos);
        }

        // 性能监控结束
        const duration = performance.now() - startTime;
        const details = `${updateCount} photos updated, ${photos.length} total`;

        buildMetrics.record("Photo ThumbHash", duration, updateCount, details);
      } catch (error) {
        logger.error("[PhotoThumbHash] Error processing photos:", error);
      }
    },
  };
};

/**
 * 从数据文件中提取照片数组
 * 支持 TypeScript 和 JavaScript 文件
 */
async function extractPhotosFromDataFile(filePath: string): Promise<Photo[]> {
  try {
    // 动态导入文件
    const module = await import(filePath + "?t=" + Date.now());
    const photos = module.photos || module.default;

    if (!Array.isArray(photos)) {
      console.warn(
        "[PhotoThumbHash] Invalid data format: expected array of photos",
      );
      return [];
    }

    return photos;
  } catch (error) {
    console.error("[PhotoThumbHash] Failed to import data file:", error);
    return [];
  }
}

/**
 * 将更新后的照片数据写回文件
 * 策略：直接更新内存中的数组，不修改文件
 * 因为 Vite 会缓存模块，直接修改文件可能导致重复导出
 */
async function writePhotosToDataFile(
  filePath: string,
  photos: Photo[],
): Promise<void> {
  try {
    // 读取原文件内容
    const originalContent = readFileSync(filePath, "utf-8");

    // 将照片数据序列化为 TypeScript 代码
    const photosCode = generatePhotosCode(photos);

    // 查找 export const photos 的起始位置和结束位置
    // 匹配: export const photos: Photo[] = [ ... ];
    const exportPattern =
      /export\s+const\s+photos\s*:\s*Photo\[\]\s*=\s*\[[\s\S]*?\n\];/;

    let newContent: string;
    if (exportPattern.test(originalContent)) {
      // 替换现有的数组
      newContent = originalContent.replace(exportPattern, photosCode);
    } else {
      console.warn(
        "[PhotoThumbHash] Could not find 'export const photos' pattern, skipping file write",
      );
      return;
    }

    writeFileSync(filePath, newContent, "utf-8");
  } catch (error) {
    console.error("[PhotoThumbHash] Failed to write data file:", error);
    throw error;
  }
}

/**
 * 生成 TypeScript 代码表示的照片数组
 */
function generatePhotosCode(photos: Photo[]): string {
  const items = photos.map((photo) => {
    const lines: string[] = ["  {"];

    // url
    lines.push(`    url: "${photo.url}",`);

    // caption
    if (photo.caption) {
      lines.push(`    caption: "${escapeString(photo.caption)}",`);
    }

    // date
    if (photo.date) {
      lines.push(`    date: "${photo.date}",`);
    }

    // location
    if (photo.location) {
      lines.push(`    location: "${escapeString(photo.location)}",`);
    }

    // tags
    if (photo.tags && photo.tags.length > 0) {
      const tagsStr = JSON.stringify(photo.tags);
      lines.push(`    tags: ${tagsStr},`);
    }

    // thumbhash
    if (photo.thumbhash) {
      lines.push(`    thumbhash: "${photo.thumbhash}",`);
    }

    // thumbhashDataURL
    if (photo.thumbhashDataURL) {
      lines.push(`    thumbhashDataURL: "${photo.thumbhashDataURL}",`);
    }

    // aspectRatio
    if (photo.aspectRatio !== undefined) {
      lines.push(`    aspectRatio: ${photo.aspectRatio},`);
    }

    lines.push("  }");
    return lines.join("\n");
  });

  return `export const photos: Photo[] = [\n${items.join(",\n")}\n];`;
}

/**
 * 转义字符串中的特殊字符
 */
function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
