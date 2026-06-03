---
title: git 特定场景使用实例
tag:
  - dev-tools
  - git
date: 2024-09-02
---

## 撤销某次合并提交

```plaintext
*   c935c9f (HEAD -> main, origin/main, origin/HEAD) Merge branch 'katspaugh:main' into main
|\
| * 4567c99 Optimized Method for Calculating Overlap Size in Spectrogram Resampling (#3848)
* | 1a0cc9d fix: #3707
|/
* 5f32d82 feature: [Minimap] more subscribable events (#3843)
* 4ffab8c 7.8.4
```

我想要将 `c935c9f` 这次合并的代码撤销，并且强制覆盖到远程分支，操作流程如下：

1. 确保在 `main` 分支上，若没有使用 `git checkout main` 来切换
2. 将 HEAD 移动到 `1a0cc9d` 分支上，使用 `git reset --hard 1a0cc9d` 实现
3. 强行覆盖远程分支，使用 `git push -f origin main` 实现

执行完这些命令后，最终结果为：

```plaintext
* 1a0cc9d (HEAD -> main) fix: #3707
* 5f32d82 feature: [Minimap] more subscribable events (#3843)
* 4ffab8c 7.8.4
```

> [!note]
>
> reset 共有三种选项，摘抄自[博客园](https://www.cnblogs.com/qdhxhz/p/18084982)
>
> 1. `git reset --mixed`：此为默认方式，将撤回的代码，存放到工作区。同时会保留本地未提交的内容。
> 2. `git reset --soft`：回退到某个版本 。将撤回的代码，存放到暂存区。同时会保留本地未提交的内容。
> 3. `git reset --hard`：彻底回退到某个版本，丢弃将撤回的代码，本地没有 commit 的修改会被全部擦掉。
>
> 这里使用的是 `reset --hard`，是因为我们不需要留存前面提交的内容，

## 分支重命名

本地重命名只需要执行 `git branch -m new-branch-name` 即可，其中 m 的意思表示 move，和系统的 mv 指令很类似

如果想要同时更改远程分支的名称，还需要额外的步骤

1. 先删除原来的分支 `git push origin --delete old-branch-name`
2. 推送新的分支 `git push origin -u new-branch-name`

这里的 `-u` 选项是 `--set-upstream`，用来设置设置本地分支跟踪的远程分支，相当于确定了一个对应关系

## 切换到远程分支

有时候想要切换到远程的分支，并且在本地创建同名分支来跟踪该远程分支，可以输入以下任一命令

- `git checkout --track origin/branch-name`：这个命令会自动创建一个与远程分支同名的本地分支，并设置好跟踪关系
- `git switch branch-name`：如果远程分支存在而本地不存在，Git 会自动创建并跟踪远程分支
- `git checkout -b branch-name origin/branch-name`：这个命令会创建一个新的本地分支，并让它跟踪远程分支

## 对比两个提交之间的差异

有时候为了完成一个大任务，会分很多次进行提交，比如：

```plaintext
* 39e955e (HEAD -> fast-spectrogram) feat: add fast spectrogram plugin
* 9360e00 deps: add glob as dev dpes
* 1a0cc9d (origin/main, main) fix: #3707
```

如果想要比对 `39e955e` 和 `1a0cc9d` 之间的变动，可以执行 `git diff 1a0cc9d 39e955e`

如果想要更详细的输出，可以添加一些选项：

1. 如果只想看文件名的变化，而不是具体内容：

   ```plaintext
   git diff --name-only 1a0cc9d 39e955e
   ```

2. 如果你想看统计信息（比如增加/删除了多少行）：

   ```plaintext
   git diff --stat 1a0cc9d 39e955e
   ```

3. 如果你想在图形界面中查看差异（如果你安装了图形化 diff 工具）：

   ```plaintext
   git difftool 1a0cc9d 39e955e
   ```

提交 ID 的顺序很重要。第一个 ID 是"从"，第二个是"到"。如果你交换它们的位置，会看到相反的变化

> [!tip]
>
> 如果想要使用 neovim 作为 difftool
>
> 1. 设置 Git 的默认 diff 工具为 nvimdiff：
>
>    ```plaintext
>    git config --global diff.tool nvimdiff
>    ```
>
> 2. 设置 Git 使用 nvimdiff 作为合并工具：
>
>    ```plaintext
>    git config --global merge.tool nvimdiff
>    ```
>
> 3. （可选）如果希望 Git 直接启动 diff 工具而不询问，可以设置：
>
>    ```plaintext
>    git config --global difftool.prompt false
>    ```
>
> 4. （可选）如果想要在使用 `git diff` 时自动调用 difftool，可以设置：
>
>    ```plaintext
>    git config --global alias.d difftool
>    ```
>
>    这样，你就可以使用 `git d` 来调用 nvimdiff 了。

## 提交记录压缩

有时候提交记录太多了（比如几千条提交记录），会导致 `.git` 目录过大，每次克隆都会花费比较长的时间，同时这些提交记录我们很多都用不上，因此希望可以进行压缩，可以通过下面的方法。

1. 确保工作区没有文件，为接下来的变基做准备
2. 假设我们希望将 `f7e70c8` 到 `HEAD` 的提交合并为一个提交，可以执行 `git rebase -i f7e70c8^` 命令，找到 `f7e70c8` 之前的一个提交，从这里开始变基操作，将除了 `f7e70c8` 的所有提交打上 squash 的命令，这可以很容易的通过 neovim 来实现
3. 关闭编辑器后会再次打开另一个编辑器，在这里为合并后的提交更新提交记录
4. 强行 push 到远程 `git push --force origin main`
5. 运行垃圾回收 `git gc --aggressive`
6. 删除不再需要的远程跟踪分支 `git remote prune origin`

## 将工作区内容补充到历史 commit 中

```bash
* 86103c1 (HEAD -> refactor) e
* 407bf74 refactor: d
* 27b40b4 style: c
* ...
```

目前工作区中有一些未提交的文件，它的工作内容与 `407bf74` 这个提交相同，我想将他们提交到 `407bf74` 这个提交中，可以通过以下流程解决

1. 暂存（add）当前工作区并存储（stash）其中的内容 `git add . && git stash`
2. 使用交互式变基到 `407bf74` 之前的一个提交，`git rebase -i 407bf74^`
3. 应用之前的储存并暂存 `git stash pop && git add .`
4. 提交到 `407bf74` 中，`git commit --amend --no-edit`
5. 结束变基过程 `git rebase --continue`

> [!tip]
>
> `git commit --amend --no-edit` 里面有一个 `--no-edit` 选项，可以让我们不必打开编辑器修改提交记录，直接使用原有的提交记录

## 工作区忽略特定文件

有时候我们想要更改一些文件，但不希望这些文件一直处于工作区，导致我们无法执行一些可能会清理工作区的指令（比如 pull），可以使用 Git 的 `assume-unchanged` 功能来解决

```bash
git update-index --assume-unchanged 文件名
```

现在，Git 会忽略这个文件的本地更改，它不会出现在 `git status` 中。也不会被意外提交。 如果将来需要提交这个文件的更改，可以使用以下命令取消这个设置：

```bash
git update-index --no-assume-unchanged 文件名
```

如果想查看哪些文件被设置为 `assume-unchanged`，可以使用：

```bash
git ls-files -v | grep '^h'
```

想象这样一个场景，你对文件 A 做了 `assume-unchanged` 操作，假设远端有人修改了 A 的内容，pull 以后就会自动合并远端内容，如果不想让其合并，可以使用 `git update-index --skip-worktree filename` 来彻底忽略这个文件的更改，并且其他人的改动也不会被合并或者更新。如果要取消这个设置，可以使用 `git update-index --no-skip-worktree filename`

## 时间旅行

有时候很想要在一个分支的不同时间段进行时间旅行，来查看代码的工作状态，但是仅凭借 checkout 命令还是感觉力不从心，可以考虑使用 reflog 来进行从老分支到新分支的履行。

但这也许意味着我们必须先从最新的分支跳转到一个最近的可能的分支，然后慢慢的向老分支跳转，直到找到想要的分支后使用 reflog 重新跳回

## 大文件存储

我在给博客添加落霞孤鹜字体时，需要加入一个大小为 20MB 左右的 ttf 文件。Git 可以保存这种文件，但它会把每一次修改后的完整对象都放进历史里，后续 clone、fetch、打包都会被这些对象拖慢。Git LFS 的思路是：Git 仓库里只保存一个很小的 pointer 文件，真正的大文件放在 LFS 存储里。

适合放进 LFS 的一般是字体、图片源文件、音视频、压缩包、模型权重、设计稿、二进制发布包这类文件。不适合放进去的是经常需要 diff 的源码、配置、文本数据，因为 LFS pointer 只告诉 Git “这里有一个外部对象”，不会提供正常文本合并体验。

新项目接入 LFS 的流程比较简单：

1. 安装 `git-lfs` 工具。
2. 在仓库里初始化 LFS filter。
3. 用 `git lfs track` 记录哪些文件模式需要进入 LFS。
4. 提交 `.gitattributes` 和对应的大文件。

```bash
brew install git-lfs
git lfs install
git lfs track "*.ttf"
git add .gitattributes packages/content/public/fonts/LXGWWenKaiGBScreen.ttf
git commit -m "配置 Git LFS 追踪字体文件"
```

`git lfs track` 会改写 `.gitattributes`，常见内容类似这样：

```bash
*.ttf filter=lfs diff=lfs merge=lfs -text
```

这里的 `filter=lfs` 决定提交时写入 pointer、checkout 时还原真实文件，`-text` 表示不要对它做文本换行转换。`.gitattributes` 必须提交到仓库，否则别人 clone 时不知道哪些文件应该交给 LFS 处理。

在其他设备上克隆仓库时，一般只需要先安装 LFS，再执行正常 clone。大多数新版本 Git LFS 会在 checkout 时自动拉取对象，如果遇到文件仍然是 pointer，可以手动拉取：

```bash
git lfs install
git lfs pull
```

## Git LFS 迁移

如果大文件已经作为普通 Git object 进入历史，仅仅添加 `.gitattributes` 不会修复旧提交。旧提交里的 blob 还在，仓库体积也不会明显下降。这时需要做历史改写，把历史里的大文件替换成 LFS pointer。

迁移前先确认两件事：

1. 这个仓库是否允许改写历史。如果很多人都在同一个分支上开发，需要先约定冻结提交窗口。
2. 大文件应该按文件模式迁移，还是只迁移某几个路径。模式越宽，影响的历史越多。

建议先做一个本地备份，不要直接在唯一工作区里操作：

```bash
git clone --mirror git@github.com:owner/repo.git repo-backup.git
git tag before-lfs-migration
```

`--mirror` 会保留所有 refs，适合做灾难恢复。`before-lfs-migration` 则是在当前仓库里留下一个可读的回退锚点。真实迁移前最好确认工作区是干净的：

```bash
git status --short
git branch --show-current
```

然后先分析历史里哪些文件占空间：

```bash
git lfs migrate info --everything
git lfs migrate info --everything --top=20
```

如果只想迁移某些后缀，可以使用 `--include`。多个模式用逗号分隔：

```bash
git lfs migrate import --everything --include="*.zip,*.psd,*.ttf"
```

如果 `.gitattributes` 里已经配置好了 LFS 规则，可以使用 `--fixup`，让 Git LFS 按这些规则迁移历史：

```bash
git lfs migrate import --everything --fixup
```

`--everything` 会处理所有本地 refs，包括分支和标签。对于个人仓库这通常最省心；对于协作仓库，可能只想迁移主分支，避免改写无关分支：

```bash
git lfs migrate import --include-ref=refs/heads/main --include="*.zip,*.psd,*.ttf"
```

迁移完成后要检查三类结果：

```bash
git lfs ls-files
git status --short
git log --all -- packages/content/public/fonts/LXGWWenKaiGBScreen.ttf
```

`git lfs ls-files` 能看到哪些文件已经变成 LFS 对象；`git status --short` 应该是干净的；`git log --all -- <path>` 可以确认相关路径的历史还在，只是文件内容从普通 blob 变成了 pointer。

确认没有问题后，再推送改写后的历史：

```bash
git push --force-with-lease origin main
git push --force-with-lease origin --tags
git lfs push --all origin
```

这里优先使用 `--force-with-lease`，它会检查远端分支是否在你迁移期间被别人推进过。若远端已有新提交，它会拒绝覆盖，比普通 `--force` 更适合协作仓库。

其他协作者在迁移后不要继续基于旧历史提交。最简单的方式是重新 clone；如果要保留本地仓库，需要先备份自己的改动，再重置到新的远端历史：

```bash
git fetch origin
git switch main
git reset --hard origin/main
git lfs pull
```

如果迁移后发现问题，可以从备份恢复。对于本地仓库，可以回到迁移前的 tag；对于远端仓库，可以从 mirror 备份推回原来的 refs：

```bash
git reset --hard before-lfs-migration
git push --force-with-lease origin main
```

> [!IMPORTANT]
> 历史改写只会让新的分支历史不再引用旧 blob，不代表托管平台会立刻释放所有存储。GitHub、GitLab 等平台可能还会保留旧对象、缓存、PR refs 或 LFS 配额记录。迁移后如果目标是减少远端仓库占用，需要结合平台文档处理旧 refs、缓存和垃圾回收。

## stash 部分文件

我们直接使用 `git stash push -m` 暂存时，会存储当前所有的改动，如果我只想要存储 add 的文件，可以通过命令 `git stash push --staged` 完成，如果想要存储未 add 的文件，可以通过命令 `git stash push --keep-index`

可以看到我们这里使用了 `git stash push` 命令，他实际上是 `git stash` 的现代化写法，主要原因是让 stash 命令族结构更统一，这个命令族有比如：

```bash
git stash apply
git stash drop
git stash show
git stash push
```

## 查看两次变更间的详情

有时候想看一次任务（分为多个 commit）之间有哪些文件变动或者变更行数，可以使用 `git diff hashA..hashB --stat` 实现

如果想看当前暂存区的变更行数，可以使用 `git diff --cached --stat HEAD`，但是使用的时候要注意，要把所有的变更都索引起来，如果是新建的文件没有 add 的话，是不会被统计进去的

## git 清理锁文件

```bash
fatal: Unable to create 'xxx/xxx': File exists.

Another git process seems to be running in this repository, e.g.
an editor opened by 'git commit'. Please make sure all processes
are terminated then try again. If it still fails, a git process
may have crashed in this repository earlier:
remove the file manually to continue.
```

这是一个残留的 Git 锁文件，不是当前有进程真的占用了它。直接删除 `.git/index.lock` 文件即可解决问题：

## git 快速克隆相同仓库

我在跑 swe benchmark 的时候，希望能够并行运行项目，但是由于不同任务之间可能存在干扰，我这里决定使用 `git clone --local` 来快速克隆。这样克隆出来的项目之间使用硬链接共享 `.git/objects`，其余文件保持独立，因此速度极快、几乎不占额外磁盘。常用于：

1. 并行任务隔离：先 clone 一次远程仓库作为 base，然后每个任务实例用 --local 从 base 快速派生，各自独立修改互不干扰
2. CI/CD 中并行构建 — 多个 job 共享一份 object store，各自 checkout 不同分支

他跟 worktree 有些区别，`git clone --local` 是两个独立仓库，各自有完整的 `.git` 目录，只是 objects 通过硬链接共享。
git worktree 是同一个仓库，只有一个 `.git`，只是多出几个工作目录。它在 `.git/worktrees/` 下存储每个 worktree 的 HEAD 和 index，但 objects、refs、config 都是共享主仓库的那一份。
