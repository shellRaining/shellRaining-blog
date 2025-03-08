import { createContentLoader } from "vitepress";

type SeriesData = {
  /** 这篇文章的标题 */
  title: string;

  /** 这篇文章的 URL */
  url: string;

  /** 这篇文章在系列中的序号，以 1 为起始坐标 */
  part: number;
};

type CollectionsData = Record<string, Array<SeriesData>>;

/** 返回的是一个 collections，他的键为一个系列的名称，通过这个键可以索引到该系列所有的文章信息（包括标题，URL，该文章在系列的序号） */
declare const data: CollectionsData;
export { data };

export default createContentLoader("docs/**/*.md", {
  transform(rawData) {
    const collections: CollectionsData = {};
    rawData
      .filter((post) => post.frontmatter.series)
      .forEach((post) => {
        const { name, part } = post.frontmatter.series;
        if (!collections[name]) collections[name] = [];
        collections[name].push({
          title: post.frontmatter.title,
          part,
          url: post.url,
        });
      });
    Object.keys(collections).forEach((name) => {
      collections[name].sort((a, b) => {
        return a.part - b.part;
      });
    });

    return collections;
  },
});
