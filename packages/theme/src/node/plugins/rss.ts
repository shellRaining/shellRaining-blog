import fs from "node:fs";
import path from "node:path";
import type { PluginOption } from "vite";
import type { SiteConfig, MarkdownEnv } from "vitepress";
import { Feed } from "feed";
import type { FeedOptions } from "feed";
import matter from "gray-matter";

// Helper functions that were in @sugarat/theme-shared

function getVitePressPages(config: SiteConfig) {
  return config.pages.map((page) => ({
    filepath: path.join(config.srcDir, page),
    page,
    // These are simplified assumptions
    isDynamic: false,
    dynamicRoute: undefined,
    rewritePath: undefined,
    env: {} as MarkdownEnv,
  }));
}

async function getFileLastModifyTime(filepath: string): Promise<Date> {
  const stats = await fs.promises.stat(filepath);
  return stats.mtime;
}

function getDefaultTitle(content: string): string {
  const match = content.match(/^#\s+(.*)/m);
  return match?.[1] || "";
}

function getTextSummary(content: string, length: number): string {
  return content
    .replace(/---\r?\n[\s\S]+?---\r?\n/, "")
    .replace(/#\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|<[^>]+>/g, "")
    .replace(/#|\*|_|`/g, "")
    .trim()
    .slice(0, length);
}

function formatDate(date: Date | string | number | undefined): string {
  if (!date) {
    return new Date().toISOString();
  }
  return new Date(date).toISOString();
}

// Types from type.ts
export type RSSOptions = Omit<FeedOptions, "id"> & {
  id?: string;
  baseUrl: string;
  filename?: string;
  transform?: (content: string) => string;
};

export interface PostInfo {
  filepath: string;
  fileContent: string;
  description: string;
  date: string;
  title: string;
  url: string;
  frontmatter: {
    [key: string]: any;
  };
  env: MarkdownEnv;
}

// Logic from node.ts
const htmlCache = new Map<string, string | undefined>();

export async function getPostsData(config: SiteConfig, ops: RSSOptions) {
  const pagesData = getVitePressPages(config);

  const { createMarkdownRenderer } = await import("vitepress");

  const mdRender = await createMarkdownRenderer(
    config.srcDir,
    config.markdown,
    config.site.base,
    config.logger,
  );
  let posts: PostInfo[] = [];

  for (const page of pagesData) {
    const fileContent = await fs.promises.readFile(page.filepath, "utf-8");
    const {
      data: frontmatter,
      excerpt,
      content,
    } = matter(fileContent, {
      excerpt: true,
    });

    if (frontmatter.layout === "home" || frontmatter.publish === false) {
      continue;
    }

    if (!frontmatter.title) {
      frontmatter.title = getDefaultTitle(content);
    }
    frontmatter.title = `${frontmatter.title}`;

    const date = await (frontmatter.date ||
      getFileLastModifyTime(page.filepath));
    frontmatter.date = formatDate(date);

    frontmatter.description =
      frontmatter.description || excerpt || getTextSummary(content, 100);

    const url = `/${page.page.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, config.cleanUrls ? "" : ".html")}`;

    posts.push({
      filepath: page.filepath,
      env: page.env,
      fileContent,
      description: frontmatter.description,
      date: frontmatter.date,
      title: frontmatter.title,
      url,
      frontmatter,
    });
  }

  posts.sort(
    (a, b) => +new Date(b.date as string) - +new Date(a.date as string),
  );

  for (const post of posts) {
    const { fileContent, filepath, env } = post;
    if (!htmlCache.has(filepath)) {
      const html = mdRender.render(fileContent, env);
      htmlCache.set(filepath, html);
    }
  }

  return posts;
}

export async function genFeed(config: SiteConfig, rssOptions: RSSOptions) {
  if (!rssOptions) return;

  const {
    baseUrl,
    filename,
    transform = (v: string) => v,
    ...restOps
  } = rssOptions;
  const feed = new Feed({ id: baseUrl, link: baseUrl, ...restOps });

  const posts = await getPostsData(config, rssOptions);

  for (const post of posts) {
    const { title, description, date, frontmatter, url } = post;
    const author = frontmatter.author || rssOptions.author?.name;
    const link = `${baseUrl}${url}`;
    feed.addItem({
      title,
      id: link,
      link,
      description,
      content: transform(
        (htmlCache.get(post.filepath) ?? "").replaceAll("&ZeroWidthSpace;", ""),
      ),
      author: [{ name: author }],
      date: new Date(date),
    });
  }
  const RSSFilename = filename || "feed.rss";
  const RSSFilepath = path.join(config.outDir, RSSFilename);
  await fs.promises.writeFile(RSSFilepath, feed.rss2());
  console.log("\n🎉 RSS generated", RSSFilename);
}

// Logic from index.ts
export function RssPlugin(rssOptions: RSSOptions): PluginOption {
  let config: any;
  return {
    name: "vitepress-plugin-rss-custom",
    enforce: "pre",
    configResolved(resolvedConfig: any) {
      config = resolvedConfig;
    },
    async buildEnd() {
      if (config?.vitepress && config.build.ssr) {
        await genFeed(config.vitepress, rssOptions);
      }
    },
  };
}
