---
title: arc 浏览器体验优化
tag:
  - tech_blog
date: 2024-08-26
---

## 回退后无法滚动页面

浏览器版本是 `1.57.1 (52939)`，内核为 `Chromium Engine Version 128.0.6613.85`

最近突然遇到返回上一级页面后无法滚动的情况，具体复现步骤如下：

1. 谷歌搜索一个页面，比如 Reddit 社区

2. 点进去这个链接，然后按下浏览器的返回按钮（或者鼠标的侧键）

3. 回到谷歌搜索的页面后，发现鼠标滚轮无法正常工作，页面像是被冻住了

在 arc 的 discord 群组问了一下才知道是往返缓存的锅，在 [chrome://flags/#back-forward-cache](chrome://flags/#back-forward-cache) 把他关掉就好了

感叹，当初为了 lighting house 多一些分数开的这个选项，没想到带来了那么多的问题！并且这个 bug 几乎在搜索引擎搜不到，只能老手传帮带，故作此文以作记录，供同样遇到问题的人来查阅。

## 禁用自动更新

arc 隔三差五就要更新浏览器版本，chromium 版本也随着更新，但是我不想使用 manifest v3，这会让广告拦截器无法工作，可以通过下面的命令禁用浏览器更新

```bash
test -e /Applications/Arc.app/Contents/Info.plist && ( \
/usr/libexec/PlistBuddy -c "Set SUAutomaticallyUpdate false" /Applications/Arc.app/Contents/Info.plist && \
/usr/libexec/PlistBuddy -c "Set SUEnableAutomaticChecks false" /Applications/Arc.app/Contents/Info.plist && \
/usr/libexec/PlistBuddy -c "Set SUScheduledCheckInterval 0" /Applications/Arc.app/Contents/Info.plist
)
```

重启浏览器后就可以看到效果了，方法源自于 [Reddit](https://www.reddit.com/r/ArcBrowser/comments/14xbgzl/can_we_hide_the_arc_is_ready_to_update_banner_in/)
