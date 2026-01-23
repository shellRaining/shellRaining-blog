import {
  generateFontFaceCSS,
  getAllChars,
  subsetFont,
  type FontConfig,
} from "../fontmin";
import { join } from "path";
import { basename, dirname } from "path";
import {
  unlinkSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import crypto from "crypto";
import type { HeadConfig, SiteConfig } from "vitepress";
import type { PluginOption, ViteDevServer } from "vite";

const devSubsetAssets = new Map<string, Buffer>();

export const fontPlugin = {
  name: "vite-plugin-blog-fontmin",

  // 这个钩子函数用来进行字体子集化
  async buildStart() {
    const env = this.environment;
    if (env.name !== "client") return;

    const siteConfig: SiteConfig = (env.config as any).vitepress;
    const themeFonts = siteConfig.site?.themeConfig?.font;
    const userFontConfig: FontConfig[] = Array.isArray(themeFonts)
      ? themeFonts
      : [];

    if (userFontConfig.length === 0) {
      if (env.mode !== "build") {
        devSubsetAssets.clear();
      }
      return;
    }

    if (env.mode !== "build") {
      devSubsetAssets.clear();
    }
    const allChars = getAllChars(siteConfig.pages, siteConfig.srcDir);
    const text = Array.from(allChars).join("");

    // Prepare cache directory and manifest under .vitepress/cache/font-subset
    const cacheDir = join(
      siteConfig.srcDir,
      ".vitepress",
      "cache",
      "font-subset",
    );
    mkdirSync(cacheDir, { recursive: true });
    const manifestPath = join(cacheDir, "manifest.json");
    let manifest: Record<string, { hash: string; cacheFile: string }> = {};
    if (existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      } catch {}
    }

    const appendHeads: HeadConfig[] = [];
    for (const fontConfig of userFontConfig) {
      const src = fontConfig.src.replace(/^\/+/, ""); // 去掉开头的斜杠
      const dest = fontConfig.dest.replace(/^\/+/, "");
      const absoluteSrc = join(siteConfig.srcDir, "public", src);
      const absoluteDest = join(siteConfig.outDir, dest);

      // Compute a content hash to detect changes (font file + text)
      const fontStat = existsSync(absoluteSrc)
        ? readFileSync(absoluteSrc)
        : undefined;
      const textHash = crypto.createHash("sha256").update(text).digest("hex");
      const inputHash = crypto
        .createHash("sha256")
        .update(
          Buffer.concat([fontStat ?? Buffer.alloc(0), Buffer.from(textHash)]),
        )
        .digest("hex");

      const destBase = basename(dest);
      const cacheBase = `${destBase}.${inputHash}.bin`;
      const cacheFile = join(cacheDir, cacheBase);

      let subsettedFontBuffer: Uint8Array;

      // Try cache first
      if (
        manifest[dest]?.hash === inputHash &&
        existsSync(manifest[dest].cacheFile)
      ) {
        subsettedFontBuffer = new Uint8Array(
          readFileSync(manifest[dest].cacheFile),
        );
      } else if (existsSync(cacheFile)) {
        subsettedFontBuffer = new Uint8Array(readFileSync(cacheFile));
        manifest[dest] = { hash: inputHash, cacheFile };
      } else {
        // Generate subset and cache it
        subsettedFontBuffer = await subsetFont(absoluteSrc, absoluteDest, text);
        writeFileSync(cacheFile, Buffer.from(subsettedFontBuffer));
        manifest[dest] = { hash: inputHash, cacheFile };
      }

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
      if (env.mode === "build") {
        this.emitFile({
          type: "asset",
          fileName: dest,
          source: subsettedFontBuffer,
        });
      } else {
        const publicPath = `/${dest}`;
        devSubsetAssets.set(publicPath, Buffer.from(subsettedFontBuffer));
      }
    }

    // Persist manifest updates
    try {
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    } catch {}

    const fontFaceCSS = generateFontFaceCSS(userFontConfig);
    appendHeads.push(["style", {}, fontFaceCSS]);
    siteConfig.site.head.push(...appendHeads);
  },

  configureServer(server: ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split("?")[0];
      if (!url) {
        return next();
      }

      const asset = devSubsetAssets.get(url);
      if (!asset) {
        return next();
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "font/woff2");
      res.setHeader("Cache-Control", "no-cache");
      res.end(asset);
    });
  },

  // 这个钩子函数用来删除 vitepress 默认复制的字体文件
  generateBundle() {
    const env = this.environment;
    if (env.name !== "client") return;

    const siteConfig: SiteConfig = (env.config as any).vitepress;
    const themeFonts = siteConfig.site?.themeConfig?.font;
    const userFontConfig: FontConfig[] = Array.isArray(themeFonts)
      ? themeFonts
      : [];

    if (userFontConfig.length === 0) {
      return;
    }

    for (const fontConfig of userFontConfig) {
      const src = fontConfig.src.replace(/^\/+/, ""); // 去掉开头的斜杠
      const dest = fontConfig.dest.replace(/^\/+/, "");
      const absoluteSrc = join(siteConfig.srcDir, "public", src);
      const absoluteDest = join(siteConfig.outDir, dest);

      const fontname = basename(absoluteSrc);
      const absoluteDestDir = dirname(absoluteDest);
      const copyedFontPath = join(absoluteDestDir, fontname);
      if (existsSync(copyedFontPath)) {
        unlinkSync(copyedFontPath);
      }
    }
  },
} satisfies PluginOption as any;
