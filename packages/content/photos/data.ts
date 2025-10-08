export interface Photo {
  url: string;
  caption?: string;
  date?: string;
  location?: string;
  tags?: string[];
  thumbhash?: string;
  thumbhashDataURL?: string;
  aspectRatio?: number;
}

// 示例照片数据
// 请替换为你自己的照片 URL
export const photos: Photo[] = [
  {
    url: "https://imgs.shellraining.xyz/2025/10/Emma.png",
    caption: "1999 的夏活还是挺有意思的，美术和音乐一直在线，还有感人的剧情和立绘（笑）",
    date: "2025-10-07",
    tags: ["游戏"],
    thumbhash: "jvcFC4Tfi1dqqQdlb5D6J4o=",
    thumbhashDataURL: "data:image/png;base64,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",
    aspectRatio: 2.2222222222222223,
  }
];
