import { readFileSync, mkdirSync } from "fs";
import path from "path";
import subsetFontKit from "subset-font";

export interface FontConfig {
  /** 字体在网站上展示的名称 */
  displayName: string;

  /** 字体的唯一标识（或者说字型名称），将会在 font-face 配置中被指定为字体的标识符，以此达到在 font-family 中使用的目的 */
  id: string;

  /** 字体的 weight，一个 id（字型）可能有多个字重 */
  weight: number;

  /** 字体文件的路径，是相对于 /public/ 目录的路径，比如 src 为 `/fonts/font.ttf` 时，将会从 `xxx/public/fonts/font.ttf` 读取字体文件 */
  src: string;

  /** 子集化后输出字体的路径，假设 dest 为 `/fonts/font-subset.woff2` 时，将会输出到 `.vitepress/public/fonts/font-subset.woff2` */
  dest: string;
}

/**
 * @param pages 所有页面的绝对路径
 * @returns 所有页面中出现的字符集合
 */
export function getAllChars(pages: string[]): Set<string> {
  const allChars = new Set<string>();

  for (let i = 0; i < pages.length; i++) {
    try {
      const mdFile = pages[i];
      const content = readFileSync(mdFile, "utf-8");
      for (const char of content) {
        allChars.add(char);
      }
    } catch (error) {
      console.error(`Error reading file ${pages[i]}: ${error}`);
      throw error;
    }
  }

  return allChars;
}

/**
 * @param fonts 字体配置
 * @returns 生成的 CSS 字符串
 */
export function generateFontFaceCSS(fonts: FontConfig[]): string {
  let cssContent = "";

  // 按照字体ID分组
  const fontGroups = Object.groupBy(fonts, (font) => font.id) as Record<
    string,
    FontConfig[]
  >;

  // 为每个字体ID生成@font-face规则
  for (const [id, fontConfigs] of Object.entries(fontGroups)) {
    for (const font of fontConfigs) {
      // 使用 dest 路径的文件名作为引用
      cssContent += `@font-face{font-family:"${id}";src:url("${font.dest}") format("woff2");font-weight:${font.weight};font-display: swap;}`;
    }
  }

  cssContent += `:root {--vp-font-family-base: ${Object.keys(fontGroups).join(",")};}`;

  return cssContent;
}

/**
 * @param src 字体文件的绝对路径
 * @param dest 子集化后输出字体的绝对路径，必须是拥有 .ttf、.otf、.woff、.woff2 之一扩展名的字体文件
 * @param text 需要子集化的文本
 * @returns 一个 Uint8Array，包含子集化后的字体数据
 */
export async function subsetFont(
  src: string,
  dest: string,
  text: string,
): Promise<Uint8Array> {
  if (!src || !dest || text === undefined) {
    throw new Error("src、dest 和 text 参数都必须提供");
  }

  const destDir = path.dirname(dest);
  mkdirSync(destDir, { recursive: true });

  try {
    const fontBuffer = readFileSync(src);

    if (text.length === 0) {
      return new Uint8Array(fontBuffer.buffer);
    }

    const destExt = path.extname(dest).slice(1);
    if (
      destExt !== "woff" &&
      destExt !== "woff2" &&
      destExt !== "ttf" &&
      destExt !== "sfnt"
    )
      throw new Error(`目标文件扩展名 ${destExt} 不支持`);

    const subsetBuffer = await subsetFontKit(fontBuffer, text, {
      targetFormat: destExt === "ttf" ? "truetype" : destExt,
    });

    return new Uint8Array(subsetBuffer.buffer);
  } catch (error) {
    throw new Error(`字体子集化失败: ${error}`);
  }
}
