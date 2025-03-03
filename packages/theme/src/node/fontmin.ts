import { readFileSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import type { SiteConfig } from "vitepress";
import path from "path";
import subsetFontKit from "subset-font";
import type { ShellRainingBlogThemeConfig } from "./config";
import pc from "picocolors"; // 引入 picocolors 用于着色

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

  for (let i = 0; i < mdFiles.length; i++) {
    const mdFile = mdFiles[i];
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
}

export async function subsetFont(siteConfig: SiteConfig) {
  console.log(pc.cyan(pc.bold("\n📦 开始字体子集化处理...")));

  const chars = getAllChars(siteConfig);
  const text = Array.from(chars).join("");
  const publicDir = path.join(siteConfig.root, "/public");
  const fontDestDir = path.join(siteConfig.outDir, "/fonts");

  mkdirSync(fontDestDir, { recursive: true });

  // 获取主题配置中的字体设置
  const themeConfig: ShellRainingBlogThemeConfig = siteConfig.site.themeConfig;
  const fonts = themeConfig.font || [];

  if (!fonts.length) {
    console.log(pc.yellow("⚠️ 未在主题配置中找到字体设置，跳过字体子集化"));
    return;
  }

  console.log(pc.cyan(`找到 ${pc.bold(fonts.length.toString())} 个字体配置`));

  let processedCnt = 0;
  const fontProcesses = fonts.map(async (font) => {
    const srcPath = path.join(publicDir, font.src.replace(/^\//, ""));
    const fileName = path.basename(font.src, path.extname(font.src));
    const destFileName = `${fileName}-subset.woff2`;
    const destPath = path.join(fontDestDir, destFileName);

    try {
      // 字体子集化并写入文件
      const fontBuffer = readFileSync(srcPath);
      const originalSizeKB = Math.round(fontBuffer.length / 1024);
      const subsetBuffer = await subsetFontKit(fontBuffer, text, {
        targetFormat: "woff2",
      });
      const subsetSizeKB = Math.round(subsetBuffer.length / 1024);
      writeFileSync(destPath, subsetBuffer);

      processedCnt++;
      console.log(
        pc.cyan(
          `🔍 (${processedCnt}/${fonts.length}) 已子集化字体 ${font.displayName} (${font.id})...`,
        ),
      );

      // 删除原始文件
      const origDestPath = path.join(fontDestDir, path.basename(font.src));
      try {
        unlinkSync(origDestPath);
      } catch (err) {}

      return {
        success: true,
        font,
        originalSize: originalSizeKB,
        subsetSize: subsetSizeKB,
      };
    } catch (err) {
      processedCnt++;
      console.error(
        pc.red(`❌ 处理字体 ${font.displayName} (${font.id}) 时出错:`),
        err,
      );
      return {
        success: false,
        font,
        error: err,
      };
    }
  });

  const results = await Promise.all(fontProcesses);

  // 显示汇总信息
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log("\n" + pc.cyan(pc.bold("📊 字体子集化完成汇总:")));

  if (successful.length > 0) {
    const totalOriginal = successful.reduce(
      (sum, r: any) => sum + r.originalSize,
      0,
    );
    const totalSubset = successful.reduce(
      (sum, r: any) => sum + r.subsetSize,
      0,
    );
    const savingsPercent = Math.round((1 - totalSubset / totalOriginal) * 100);

    console.log(pc.green(`✅ 成功处理: ${successful.length} 个字体`));
    console.log(
      pc.green(
        `💾 总大小减少: ${totalOriginal}KB → ${totalSubset}KB (节省了 ${savingsPercent}%)`,
      ),
    );
  }

  if (failed.length > 0) {
    console.log(pc.red(`❌ 处理失败: ${failed.length} 个字体`));
  }

  // 最后生成CSS
  generateFontFaceCSS(fonts, fontDestDir);
  console.log(pc.green(pc.bold("\n✨ 字体子集化全部处理完成!\n")));
}
