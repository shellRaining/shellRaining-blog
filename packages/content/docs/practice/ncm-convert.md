---
title: ncm 格式转换
tag:
  - practice
date: 2026-05-31
---

## 简述

NCM 不是一种音频编码格式，而是网易云音乐的加密容器。一个 `.ncm` 文件解开之后，里面可能是 MP3，也可能是 FLAC。是否无损取决于内层音频，不取决于文件扩展名是否是 `.ncm`。

更准确地说，NCM 不是只把音频文件整体加密一下。它通常包含文件头、加密后的音频密钥、加密 JSON 元数据、封面数据和加密音频流。元数据里可能有标题、歌手、专辑、时长、码率、内层格式提示、封面 URL 等信息；封面图片也可能直接嵌在 NCM 文件里。解包工具除了还原内层音频，也常常会把这些元数据和封面写回 MP3/FLAC 标签。

判断方法：

1. 先用 NCM 工具解包。
2. 再用 `file`、`afinfo`、`ffprobe` 等工具检查解包后的音频。
3. 如果解出来是 MP3，即使再转成 FLAC，也只是把有损音频重新编码成 FLAC，不能恢复无损音质。
4. 如果解出来本来就是 FLAC，才可以认为这份下载文件对应的是无损音源。

这次测试的文件：

```text
/Users/shellraining/Music/网易云音乐/志倉千代丸 - 雨のち想い出.ncm
```

实测结果：

```text
解包后原始音频：MP3, 320 kbps, 44.1 kHz, Stereo
生成的 FLAC：FLAC, 24-bit, 44.1 kHz, Stereo
```

结论：这首歌的 NCM 内层音频是 320 kbps MP3，不是无损源。生成的 FLAC 只是为了兼容 FLAC 工作流，不代表音质变成无损。

## 工具选择

正确的 NCM 解包工具本质上是在解密并还原内层音频，同时尽量恢复标题、歌手、专辑、封面等标签信息。音质不会因为工具不同而提升；工具差异主要在稳定性、批量处理、UTF-8 文件名、元数据和封面处理。这里推荐 ncmdump，主要是因为：

- 项目成熟，C++ 实现。
- Homebrew 已收录，macOS 安装方便。
- 支持输出 MP3 或 FLAC，实际输出取决于 NCM 内层音频。
- 支持单文件、多文件、目录、递归目录和指定输出目录。
- README 说明 1.3.0 之后修复了中文、日文、韩文、表情符号等 UTF-8 文件名问题。

安装：

```bash
brew install ncmdump
```

单文件转换：

```bash
ncmdump "/path/to/song.ncm" -o "/path/to/output"
```

目录批量转换：

```bash
ncmdump -d "/path/to/ncm-dir" -o "/path/to/output" -r
```

注意：`-m` 会在转换成功后删除源文件，默认不建议使用。

## 参考文献

[ncm2mp3](https://github.com/Johnserf-Seed/ncm2mp3/blob/main/docs/ARCHITECTURE.md)
