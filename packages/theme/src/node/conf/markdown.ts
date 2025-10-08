import markdownItMark from "markdown-it-mark";
import markdownItSup from "markdown-it-sup";
import markdownItSub from "markdown-it-sub";
import markdownItTaskLists from "markdown-it-task-lists";
import type { MarkdownOptions } from "vitepress";
import { createLinkCardPlugin } from "../plugins/link-card";
import { createMermaidMarkdown } from "../plugins/mermaid";
import { createLazyImagePlugin } from "../plugins/lazy-image";

export const markdownConf: MarkdownOptions = {
  math: true,
  config(md) {
    md.use(markdownItMark);
    md.use(markdownItSub);
    md.use(markdownItSup);
    md.use(markdownItTaskLists, { enabled: false });

    md.use(
      createLinkCardPlugin({
        enabled: true,
        excludeDomains: [],
        includeDomains: [],
      }),
    );

    // Mermaid fenced code support: ```mermaid
    md.use(createMermaidMarkdown());

    // LazyImage: 自动将 ![](…) 转换为 <LazyImage>
    md.use(
      createLazyImagePlugin({
        enabled: true,
        defaultAspectRatio: 4 / 3,
        detectRemoteSize: true,
        exclude: [/favicon\.ico$/i, /^\/icons?\//i, /\.svg$/i],
      }),
    );
  },
};
