import { readFileSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import type { SiteConfig } from "vitepress";
import path from "path";
import _debug from "debug";
import subsetFontKit from "subset-font";
import type { ShellRainingBlogThemeConfig } from "./config";

const debug = _debug("blog:fontmin");

export interface FontConfig {
  /** 字体在网站上展示的名称 */
  displayName: string;

  /** 字体的唯一标识（或者说字型名称），将会在 font-face 配置中被指定为字体的标识符，以此达到在 font-family 中使用的目的 */
  id: string;

  /** 字体的 weight，一个 id（字型）可能有多个字重 */
  weight: number;

  /** 字体文件的路径，是相对于 /public/ 目录的路径，比如 src 为 `/fonts/font.ttf` 时，将会从 `xxx/public/fonts/font.ttf` 读取字体文件 */
  src: string;
}

function getAllChars(siteConfig: SiteConfig) {
  const mdFiles = siteConfig.pages;
  const allChars = new Set();

  for (const mdFile of mdFiles) {
    const content = readFileSync(mdFile, "utf-8");
    for (const char of content) {
      allChars.add(char);
    }
  }

  return allChars;
}

function generateFontFaceCSS(fonts: FontConfig[], outputDir: string) {
  const cssFilePath = path.join(outputDir, "custom-fonts.css");
  let cssContent = "";

  // 按照字体ID分组
  const fontGroups = Object.groupBy(fonts, (font) => font.id) as Record<
    string,
    FontConfig[]
  >;

  // 为每个字体ID生成@font-face规则
  for (const [id, fontConfigs] of Object.entries(fontGroups)) {
    for (const font of fontConfigs) {
      const fileName = path.basename(font.src, path.extname(font.src));
      cssContent += `@font-face {
  font-family: "${id}";
  font-weight: ${font.weight};
  font-display: swap;
  src: url("/fonts/${fileName}-subset.woff2") format("woff2");
}
`;
    }
  }

  cssContent += `
:root {
  --vp-font-family-base: ${Object.keys(fontGroups).join(", ")};
  --vp-font-family-mono: ${Object.keys(fontGroups).join(", ")};
}
`;

  writeFileSync(cssFilePath, cssContent);
  debug(`Generated CSS file with @font-face rules: ${cssFilePath}`);
}

export async function subsetFont(siteConfig: SiteConfig) {
  const chars = getAllChars(siteConfig);
  const text = Array.from(chars).join("");
  const publicDir = path.join(siteConfig.root, "/public");
  const fontDestDir = path.join(siteConfig.outDir, "/fonts");

  mkdirSync(fontDestDir, { recursive: true });

  // 获取主题配置中的字体设置
  const themeConfig: ShellRainingBlogThemeConfig = siteConfig.site.themeConfig;
  const fonts = themeConfig.font || [];

  if (!fonts.length) {
    debug("No fonts configured in theme config, skipping font subsetting");
    return;
  }

  debug(`Processing ${fonts.length} font configurations`);

  // 为每个字体生成子集
  for (const font of fonts) {
    const srcPath = path.join(publicDir, font.src.replace(/^\//, ""));
    const fileName = path.basename(font.src, path.extname(font.src));
    const destFileName = `${fileName}-subset.woff2`;
    const destPath = path.join(fontDestDir, destFileName);

    debug(
      `Subsetting font: ${font.displayName} (${font.id}) weight ${font.weight}`,
    );
    debug(`Source: ${srcPath}`);
    debug(`Destination: ${destPath}`);

    try {
      const fontBuffer = readFileSync(srcPath);
      const subsetBuffer = await subsetFontKit(fontBuffer, text, {
        targetFormat: "woff2",
      });
      writeFileSync(destPath, subsetBuffer);

      debug(`Successfully created subset font: ${destPath}`);

      const origDestPath = path.join(fontDestDir, path.basename(font.src));
      try {
        unlinkSync(origDestPath);
        debug(`Removed original font file from output: ${origDestPath}`);
      } catch (err) {
        debug(
          `Could not remove original font (may not exist): ${origDestPath}`,
        );
      }
    } catch (err) {
      console.error(
        `Error processing font ${font.displayName} (${font.id}):`,
        err,
      );
    }
  }

  generateFontFaceCSS(fonts, fontDestDir);
}
