import dayjs from "dayjs";
import { createContentLoader } from "vitepress";
import type { ContentData } from "vitepress";

interface PostData extends ContentData {
  frontmatter: {
    date?: string;
    title?: string;
    [key: string]: any;
  };
}

declare const data: PostData[];
export { data };

export default createContentLoader("docs/**/*.md", {
  transform(rawData) {
    return rawData
      .filter((post): post is PostData => {
        return post.frontmatter?.title && post.frontmatter?.date;
      })
      .sort((a, b) => {
        const timeA = dayjs(a.frontmatter.date);
        const timeB = dayjs(b.frontmatter.date);
        return timeA.isBefore(timeB) ? 1 : -1;
      });
  },
}) as any;
