# shellRaining's blog theme

![blog light theme](https://2f0f3db.webp.li/2025/03/blog_day.jpeg)

![blog dark theme](https://2f0f3db.webp.li/2025/03/blog_night.jpeg)

## 特性

1. 性能极佳：lighthouse 四项全部满分，LCP 仅需 0.4s
2. 自定义字体：可以任意设置自己需要的字体，主题会自动进行子集化工作，无需担心引入字体过大
3. 拓展 markdown 语法：新增 math、sup、sub、mark、mark、taskList 语法
4. viewer.js 图片预览：可以在文章页面放大预览
5. 完善的类型支持：主题提供了完善的类型支持，可以在编辑器中获得智能提示
6. 文章编辑历史：通过将 git 提交历史信息注入文章中，可以查看文章的编辑历史
7. 完善的主题配色：博客提供了亮暗两种配色，并对主题做了多种优化

## 安装使用

```bash
ni @shellraining-blog/theme # 将 ni 替换为你喜欢的包管理器
```

现在 `.vitepress/theme/index.ts` 中添加下面代码引入主题：

```typescript
import shellRainingBlogTheme from "@shellraining-blog/theme";
import type { Theme } from "vitepress";

export default {
  extends: shellRainingBlogTheme,
} satisfies Theme;
```

然后你可以在 `.vitepress/config.ts` 中这样修改主题配置

```typescript
import { defineConfigWithTheme } from "vitepress";
import { shellRainingBlogConfig } from "@shellraining-blog/theme/config";
import type { ShellRainingBlogThemeConfig } from "@shellraining-blog/theme/config";

export default defineConfigWithTheme<ShellRainingBlogThemeConfig>({
  extends: shellRainingBlogConfig,
  // 你自己的配置...
});
```
