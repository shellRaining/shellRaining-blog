import {
  generateFontFaceCSS,
  getAllChars,
  subsetFont,
  type FontConfig,
} from "../fontmin";
import { join } from "path";
import { basename, dirname } from "path";
import { unlinkSync } from "fs";
import type { HeadConfig, SiteConfig } from "vitepress";

export const fontPlugin = {
  name: "vite-plugin-blog-fontmin",

  // 这个钩子函数用来进行字体子集化
  async buildStart() {
    const env = this.environment;
    if (env.name !== "client") return;

    const siteConfig: SiteConfig = (env.config as any).vitepress;
    const userFontConfig: FontConfig[] = siteConfig.site.themeConfig.font;
    const allChars = getAllChars(siteConfig.pages);
    const text = Array.from(allChars).join("");

    const appendHeads: HeadConfig[] = [];
    for (const fontConfig of userFontConfig) {
      const src = fontConfig.src.replace(/^\/+/, ""); // 去掉开头的斜杠
      const dest = fontConfig.dest.replace(/^\/+/, "");
      const absoluteSrc = join(siteConfig.srcDir, "public", src);
      const absoluteDest = join(siteConfig.outDir, dest);
      const subsettedFontBuffer = await subsetFont(
        absoluteSrc,
        absoluteDest,
        text,
      );

      // 为了提高加载速度，我们使用 preload 预加载字体
      appendHeads.push([
        "link",
        {
          rel: "preload",
          href: join("/", dest), // 必须是绝对路径，否则刷新文章会导致 font 404
          as: "font",
          type: "font/woff2",
          crossorigin: "anonymous",
        },
      ]);
      env.mode === "build" &&
        this.emitFile({
          type: "asset",
          fileName: dest,
          source: subsettedFontBuffer,
        });
    }

    const fontFaceCSS = generateFontFaceCSS(userFontConfig);
    appendHeads.push(["style", {}, fontFaceCSS]);
    siteConfig.site.head.push(...appendHeads);
  },

  // 这个钩子函数用来删除 vitepress 默认复制的字体文件
  generateBundle() {
    const env = this.environment;
    if (env.name !== "client") return;

    const siteConfig: SiteConfig = (env.config as any).vitepress;
    const userFontConfig: FontConfig[] = siteConfig.site.themeConfig.font;

    for (const fontConfig of userFontConfig) {
      const src = fontConfig.src.replace(/^\/+/, ""); // 去掉开头的斜杠
      const dest = fontConfig.dest.replace(/^\/+/, "");
      const absoluteSrc = join(siteConfig.srcDir, "public", src);
      const absoluteDest = join(siteConfig.outDir, dest);

      const fontname = basename(absoluteSrc);
      const absoluteDestDir = dirname(absoluteDest);
      const copyedFontPath = join(absoluteDestDir, fontname);
      unlinkSync(copyedFontPath);
    }
  },
} as any;
