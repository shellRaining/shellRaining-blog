import markdownItMark from "markdown-it-mark";
import markdownItSup from "markdown-it-sup";
import markdownItSub from "markdown-it-sub";
import markdownItTaskLists from "markdown-it-task-lists";
import type { MarkdownOptions } from "vitepress";
import { createLinkCardPlugin } from "../plugins/link-card";

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
  },
};
