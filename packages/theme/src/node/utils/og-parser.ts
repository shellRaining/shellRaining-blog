import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  type?: string;
}

interface CachedData {
  data: OpenGraphData;
  timestamp: number;
}

const CACHE_DIR = path.join(process.cwd(), ".vitepress", ".link-card-cache");
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

// 确保缓存目录存在
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// 生成URL的缓存key
function getCacheKey(url: string): string {
  return createHash("md5").update(url).digest("hex");
}

// 从缓存中读取数据
function getCachedData(url: string): OpenGraphData | null {
  try {
    ensureCacheDir();
    const cacheKey = getCacheKey(url);
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const cached: CachedData = JSON.parse(fs.readFileSync(cachePath, "utf-8"));

    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      fs.unlinkSync(cachePath);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.warn(`[LinkCard] Error reading cache for ${url}:`, error);
    return null;
  }
}

// 将数据写入缓存
function setCachedData(url: string, data: OpenGraphData) {
  try {
    ensureCacheDir();
    const cacheKey = getCacheKey(url);
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

    const cached: CachedData = {
      data,
      timestamp: Date.now(),
    };

    fs.writeFileSync(cachePath, JSON.stringify(cached, null, 2));
  } catch (error) {
    console.warn(`[LinkCard] Error writing cache for ${url}:`, error);
  }
}

// 解析HTML中的Open Graph标签
function parseOpenGraphTags(html: string): OpenGraphData {
  const ogData: OpenGraphData = {};

  // 匹配meta标签的正则表达式
  const metaTagRegex =
    /<meta\s+([^>]*property\s*=\s*["']og:([^"']+)["'][^>]*)>/gi;

  let match;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const fullTag = match[1];
    const property = match[2];

    // 提取content属性
    const contentMatch = fullTag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (contentMatch) {
      const content = contentMatch[1];

      switch (property.toLowerCase()) {
        case "title":
          ogData.title = content;
          break;
        case "description":
          ogData.description = content;
          break;
        case "image":
          ogData.image = content;
          break;
        case "url":
          ogData.url = content;
          break;
        case "site_name":
          ogData.siteName = content;
          break;
        case "type":
          ogData.type = content;
          break;
      }
    }
  }

  // 如果没有og:title，尝试使用普通的title标签
  if (!ogData.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      ogData.title = titleMatch[1].trim();
    }
  }

  // 如果没有og:description，尝试使用meta description
  if (!ogData.description) {
    const descMatch = html.match(
      /<meta\s+name\s*=\s*["']description["']\s+content\s*=\s*["']([^"']*)["']/i,
    );
    if (descMatch) {
      ogData.description = descMatch[1].trim();
    }
  }

  return ogData;
}

// 获取URL的域名
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// 验证URL是否为有效的HTTP/HTTPS链接
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

// 获取Open Graph数据
export async function getOpenGraphData(
  url: string,
): Promise<OpenGraphData | null> {
  // 验证URL
  if (!isValidUrl(url)) {
    return null;
  }

  // 检查缓存
  const cached = getCachedData(url);
  if (cached) {
    return cached;
  }

  try {
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkCardBot/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[LinkCard] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      console.warn(
        `[LinkCard] Non-HTML content type for ${url}: ${contentType}`,
      );
      return null;
    }

    const html = await response.text();
    const ogData = parseOpenGraphTags(html);

    // 如果没有获取到任何有用信息，返回基本信息
    if (!ogData.title && !ogData.description && !ogData.image) {
      const domain = getDomain(url);
      ogData.title = domain || url;
      ogData.url = url;
    }

    // 设置默认URL
    if (!ogData.url) {
      ogData.url = url;
    }

    // 缓存结果
    setCachedData(url, ogData);

    return ogData;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`[LinkCard] Request timeout for ${url}`);
    } else {
      console.warn(`[LinkCard] Error fetching ${url}:`, error);
    }
    return null;
  }
}

// 批量获取多个URL的Open Graph数据
export async function batchGetOpenGraphData(
  urls: string[],
): Promise<Record<string, OpenGraphData | null>> {
  const promises = urls.map(async (url) => {
    const data = await getOpenGraphData(url);
    return { url, data };
  });

  const results = await Promise.all(promises);
  const resultMap: Record<string, OpenGraphData | null> = {};

  results.forEach(({ url, data }) => {
    resultMap[url] = data;
  });

  return resultMap;
}
