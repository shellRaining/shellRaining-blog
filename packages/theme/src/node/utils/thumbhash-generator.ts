import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";
import probe from "probe-image-size";
import pLimit from "p-limit";
import { CacheManager } from "./cache-manager";
import path from "path";
import ExifReader from "exifreader";

export interface ThumbHashResult {
  thumbhash: string; // base64 encoded thumbhash
  dataURL: string; // data URL for placeholder
  width: number;
  height: number;
  aspectRatio: number;
  date?: string; // 拍摄日期（从 EXIF 提取）
  location?: string; // 拍摄地点（从 GPS 坐标转换）
}

const REQUEST_TIMEOUT = 15000; // 15秒超时
const MAX_CONCURRENT = 3; // 最大并发数（较保守，避免被限流）

// 创建并发限制器
const limit = pLimit(MAX_CONCURRENT);

// 创建缓存管理器
const cache = new CacheManager<ThumbHashResult>({
  strategy: "single-file",
  cachePath: path.join(
    process.cwd(),
    ".vitepress",
    "cache",
    "photo-thumbhash.json",
  ),
  ttl: 30 * 24 * 60 * 60 * 1000, // 30天
  logPrefix: "PhotoThumbHash",
});

/**
 * 从图片 URL 生成 ThumbHash
 * @param url 图片 URL
 * @returns ThumbHash 结果或 null（失败时）
 */
export async function generateThumbHash(
  url: string,
): Promise<ThumbHashResult | null> {
  // 先检查缓存
  const cached = cache.get(url);
  if (cached) {
    return cached;
  }

  try {
    // 第一步：获取图片尺寸
    const probeResult = await probe(url, { timeout: REQUEST_TIMEOUT });

    if (!probeResult.width || !probeResult.height) {
      console.warn(`[PhotoThumbHash] Failed to get dimensions for ${url}`);
      return null;
    }

    const { width, height } = probeResult;

    // 第二步：下载并解码图片
    // 为了生成 ThumbHash，我们需要完整的像素数据
    // 使用 fetch + sharp 或其他图片库来获取 RGBA 数据
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 提取 EXIF 元信息
    const exifData = await extractExifMetadata(buffer);

    // 生成 ThumbHash
    const result = await generateThumbHashWithSharp(
      buffer,
      width,
      height,
      exifData,
    );

    if (!result) {
      return null;
    }

    // 写入缓存
    cache.set(url, result);

    return result;
  } catch (error) {
    console.warn(
      `[PhotoThumbHash] Failed to generate thumbhash for ${url}:`,
      error,
    );
    return null;
  }
}

/**
 * 提取 EXIF 元信息
 */
async function extractExifMetadata(buffer: Buffer): Promise<{
  date?: string;
  location?: string;
}> {
  try {
    const tags = await ExifReader.load(buffer, { expanded: true });

    let date: string | undefined;
    let location: string | undefined;

    // 提取拍摄日期
    if (tags.exif?.DateTimeOriginal?.description) {
      // EXIF 日期格式: "2024:01:15 10:30:45" -> "2024-01-15"
      const dateStr = tags.exif.DateTimeOriginal.description;
      const match = dateStr.match(/^(\d{4}):(\d{2}):(\d{2})/);
      if (match) {
        date = `${match[1]}-${match[2]}-${match[3]}`;
      }
    }

    // 提取 GPS 坐标并转换为地名
    if (tags.gps?.Latitude && tags.gps?.Longitude) {
      const lat = tags.gps.Latitude;
      const lon = tags.gps.Longitude;
      // 将坐标格式化为字符串（后续可以调用地理编码 API 转换为地名）
      location = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    return { date, location };
  } catch (error) {
    // EXIF 数据不存在或解析失败，返回空对象
    return {};
  }
}

/**
 * 使用 sharp 库处理图片并生成 ThumbHash
 * 注意：需要安装 sharp 依赖
 */
async function generateThumbHashWithSharp(
  buffer: Buffer,
  originalWidth: number,
  originalHeight: number,
  exifData: { date?: string; location?: string } = {},
): Promise<ThumbHashResult | null> {
  try {
    // 动态导入 sharp（如果可用）
    let sharp;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      console.warn("[PhotoThumbHash] sharp is not installed, using fallback");
      return generateFallbackThumbHash(originalWidth, originalHeight);
    }

    // 缩小图片以加快处理速度（ThumbHash 建议 100x100 左右）
    const maxDimension = 100;
    const scale = Math.min(
      maxDimension / originalWidth,
      maxDimension / originalHeight,
    );
    const resizeWidth = Math.round(originalWidth * scale);
    const resizeHeight = Math.round(originalHeight * scale);

    // 转换为 RGBA
    const { data, info } = await sharp(buffer)
      .resize(resizeWidth, resizeHeight, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 生成 ThumbHash
    const thumbHashBytes = rgbaToThumbHash(info.width, info.height, data);
    const thumbHashBase64 = Buffer.from(thumbHashBytes).toString("base64");

    // 生成 Data URL
    const dataURL = thumbHashToDataURL(thumbHashBytes);

    return {
      thumbhash: thumbHashBase64,
      dataURL,
      width: originalWidth,
      height: originalHeight,
      aspectRatio: originalWidth / originalHeight,
      date: exifData.date,
      location: exifData.location,
    };
  } catch (error) {
    console.warn(
      "[PhotoThumbHash] Error in generateThumbHashWithSharp:",
      error,
    );
    return generateFallbackThumbHash(originalWidth, originalHeight);
  }
}

/**
 * 回退方案：生成简单的占位符（不使用 sharp）
 */
function generateFallbackThumbHash(
  width: number,
  height: number,
): ThumbHashResult {
  // 创建一个简单的灰色占位符
  const w = 4;
  const h = 4;
  const rgba = new Uint8Array(w * h * 4);

  // 填充灰色
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 200; // R
    rgba[i + 1] = 200; // G
    rgba[i + 2] = 200; // B
    rgba[i + 3] = 255; // A
  }

  const thumbHashBytes = rgbaToThumbHash(w, h, rgba);
  const thumbHashBase64 = Buffer.from(thumbHashBytes).toString("base64");
  const dataURL = thumbHashToDataURL(thumbHashBytes);

  return {
    thumbhash: thumbHashBase64,
    dataURL,
    width,
    height,
    aspectRatio: width / height,
  };
}

/**
 * 批量生成 ThumbHash（带并发控制）
 */
export async function batchGenerateThumbHash(
  urls: string[],
): Promise<Map<string, ThumbHashResult | null>> {
  const tasks = urls.map((url) =>
    limit(() => generateThumbHash(url).then((result) => ({ url, result }))),
  );

  const results = await Promise.all(tasks);
  const resultMap = new Map<string, ThumbHashResult | null>();

  results.forEach(({ url, result }) => {
    resultMap.set(url, result);
  });

  return resultMap;
}
