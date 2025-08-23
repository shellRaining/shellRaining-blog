import type MarkdownIt from "markdown-it";
import { batchGetOpenGraphData, type OpenGraphData } from "../utils/og-parser";
import { readFileSync, existsSync } from "fs";

interface LinkCardOptions {
  // 是否启用链接卡片功能
  enabled?: boolean;
  // 需要排除的域名列表
  excludeDomains?: string[];
  // 需要包含的域名列表，如果设置了这个，只有在这个列表中的域名才会生成卡片
  includeDomains?: string[];
  // 是否并行处理链接（提升构建性能）
  parallel?: boolean;
  // 最大并行数
  maxParallel?: number;
}

const defaultOptions: Required<LinkCardOptions> = {
  enabled: true,
  excludeDomains: [],
  includeDomains: [],
  parallel: true,
  maxParallel: 5,
};

// 全局存储Open Graph数据
const globalOgDataCache: Map<string, OpenGraphData | null> = new Map();

// 判断域名是否应该生成卡片
function shouldGenerateCard(
  url: string,
  options: Required<LinkCardOptions>,
): boolean {
  try {
    const domain = new URL(url).hostname;

    // 检查排除列表
    if (options.excludeDomains.some((excluded) => domain.includes(excluded))) {
      return false;
    }

    // 检查包含列表
    if (options.includeDomains.length > 0) {
      return options.includeDomains.some((included) =>
        domain.includes(included),
      );
    }

    return true;
  } catch {
    return false;
  }
}

// 验证是否为有效的HTTP/HTTPS链接
function isValidHttpUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

// 生成唯一的链接ID
function generateLinkId(url: string): string {
  return Buffer.from(url)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12);
}

// 转义HTML属性值
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// 转义JSON字符串，用于Vue组件属性
function escapeJson(str: string): string {
  // 使用JSON.stringify，然后转义单引号以便在单引号属性中使用
  return JSON.stringify(str).replace(/'/g, "\\'");
}

// 渲染链接卡片的HTML
function renderLinkCard(url: string, ogData: OpenGraphData | null): string {
  if (!ogData) {
    // 降级为普通链接
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeAttr(url)}</a>`;
  }

  const linkId = generateLinkId(url);
  const title = ogData.title || url;
  const description = ogData.description || "";
  const image = ogData.image || "";
  const siteName = ogData.siteName || "";

  try {
    const domain = new URL(url).hostname;
    const finalSiteName = siteName || domain;

    const result = `<LinkCard
      id="${escapeAttr("link-" + linkId)}"
      :url='${escapeJson(url)}'
      :title='${escapeJson(title)}'
      :description='${escapeJson(description)}'
      :image='${escapeJson(image)}'
      :siteName='${escapeJson(finalSiteName)}'
    ></LinkCard>`;

    return result;
  } catch (e) {
    // URL解析失败，降级为普通链接
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeAttr(url)}</a>`;
  }
}

// 块级规则：匹配独立行的链接
function createLinkCardBlockRule(options: Required<LinkCardOptions>) {
  return function (state: any, start: number, end: number, silent: boolean) {
    // 获取当前行内容
    const lineText = state.getLines(start, start + 1, 0, false).trim();

    // 检查是否是独立的HTTP/HTTPS链接
    const linkMatch = lineText.match(/^(https?:\/\/[^\s<>\[\]]+)$/);

    if (!linkMatch) {
      return false;
    }

    const url = linkMatch[1];

    // 验证URL
    if (!isValidHttpUrl(url)) {
      return false;
    }

    // 检查是否应该生成卡片
    if (!shouldGenerateCard(url, options)) {
      return false;
    }

    if (silent) return true;

    // 创建token
    const token = state.push("link_card", "div", 0);
    token.content = url;
    token.map = [start, start + 1];
    token.block = true;

    state.line = start + 1;
    return true;
  };
}

export function linkCardPlugin(md: MarkdownIt, options: LinkCardOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  if (!opts.enabled) {
    return;
  }

  // 添加块级规则
  md.block.ruler.before(
    "paragraph",
    "link_card",
    createLinkCardBlockRule(opts) as any,
    {
      alt: ["paragraph"],
    },
  );

  // 渲染器
  md.renderer.rules.link_card = function (
    tokens: any[],
    idx: number,
    options: any,
    env: any,
  ) {
    const token = tokens[idx];
    const url = token.content;

    const ogData = globalOgDataCache.get(url);
    return renderLinkCard(url, ogData || null);
  };
}

/**
 * @param pages 博客所有文章的绝对路径
 * @param [options={}] 预加载卡片的配置选项
 */
export async function preloadLinkCardData(
  pages: string[],
  options: LinkCardOptions = {},
) {
  const opts = { ...defaultOptions, ...options };
  if (!opts.enabled) return;
  const allUrls = new Set<string>();

  pages
    .filter((pagePath) => pagePath.endsWith(".md") && existsSync(pagePath))
    .forEach((pagePath) => {
      const content = readFileSync(pagePath, "utf-8");
      const linkMatches = content.match(
        /^[ \t]*(https?:\/\/[^\s<>\[\]]+)[ \t]*$/gm,
      );

      linkMatches?.forEach((match) => {
        const url = match.trim();
        if (isValidHttpUrl(url) && shouldGenerateCard(url, opts)) {
          allUrls.add(url);
        }
      });
    });

  const results = await batchGetOpenGraphData(Array.from(allUrls));

  Object.entries(results).forEach(([url, data]) => {
    globalOgDataCache.set(url, data);
  });
}

// 导出一个用于VitePress配置的便捷函数
export function createLinkCardPlugin(options: LinkCardOptions = {}) {
  return function (md: MarkdownIt) {
    linkCardPlugin(md, options);
  };
}
