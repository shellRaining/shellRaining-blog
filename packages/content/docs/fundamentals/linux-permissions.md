---
title: Linux 用户权限详解
tag:
  - fundamentals
date: 2026-06-03
---

## 权限模型的核心问题

Linux 权限系统解决的是一个很朴素的问题：某个进程想访问某个文件时，内核应该允许还是拒绝。

这里需要注意，真正发起访问的不是“用户”这个抽象概念，而是进程。进程会带着一组身份信息运行，内核再拿这些身份信息和文件元数据做匹配。

最常见的身份信息包括：

- UID：用户 ID，表示进程属于哪个用户。
- GID：主组 ID，表示进程的主用户组。
- supplementary groups：附加组，表示进程还属于哪些用户组。

文件系统中的每个文件或目录也有一组权限相关元数据：

- owner：文件所有者。
- group：文件所属组。
- mode：权限位，也就是常见的 `rwxr-xr-x`。
- 特殊权限位：setuid、setgid、sticky bit。
- 扩展规则：ACL、文件属性、挂载参数等。

日常排查权限问题时，先理解 owner、group、mode 就够用了；遇到行为和三段权限不一致时，再去检查 ACL、挂载参数和安全模块。

## 三段权限

执行 `ls -l` 可以看到类似下面的输出：

```bash
-rw-r--r-- 1 alice dev 120 Jun  3 10:00 note.txt
drwxr-x--- 2 alice dev  64 Jun  3 10:00 scripts
```

第一列的第一位表示文件类型，后面九位分成三段：

```plaintext
rw- r-- r--
│   │   │
│   │   └── others：既不是 owner，也不在 group 里的其他用户
│   └────── group：文件所属组
└────────── owner：文件所有者
```

三种权限的含义是：

- `r`：read，读取权限。
- `w`：write，写入权限。
- `x`：execute，执行权限。

内核判断权限时会先选择身份段位，而不是把三段权限叠加起来：

1. 如果进程的有效 UID 等于文件 owner，就使用 owner 段。
2. 否则如果进程的有效 GID 或附加组匹配文件 group，就使用 group 段。
3. 否则使用 others 段。

这意味着，如果一个文件是 `alice:dev`，权限是 `---rwxrwx`，那么 alice 访问它时会命中 owner 段，也就是没有权限。后面的 group 和 others 权限不会再补上来。

## 文件权限和目录权限不是一回事

`rwx` 在普通文件和目录上的含义不同。

普通文件：

- `r`：读取文件内容。
- `w`：修改文件内容。
- `x`：把文件作为程序执行。

目录：

- `r`：列出目录项，也就是能看到目录里面有哪些名字。
- `w`：修改目录项，也就是创建、删除、重命名目录里的文件。
- `x`：进入目录并通过路径访问目录中的条目。

目录的 `x` 很容易被忽略。比如你想读取 `/app/logs/a.log`，不仅需要 `a.log` 本身可读，还需要 `/app` 和 `/app/logs` 都有可执行权限。否则即使文件本身是 `644`，路径中间断掉了也会访问失败。

几个常见组合：

- 目录 `r-x`：可以进入目录，也可以列出文件名，但不能创建或删除文件。
- 目录 `--x`：不能列目录，但如果知道准确文件名，可以通过路径访问它。
- 目录 `rw-`：看起来有读写，但不能进入目录，实际很少有用。
- 目录 `rwx`：可以列出、进入、创建、删除或重命名目录项。

还要注意，删除一个文件需要的是它所在目录的写权限，而不是文件自身的写权限。文件本身只读，用户也可能因为拥有目录写权限而删除它。

## 数字权限

权限位常用八进制数字表示。每一段三位权限对应一个数字：

```plaintext
r = 4
w = 2
x = 1
```

把同一段里出现的权限加起来即可：

```plaintext
rwx = 4 + 2 + 1 = 7
rw- = 4 + 2     = 6
r-x = 4     + 1 = 5
r-- = 4         = 4
--- = 0
```

所以：

- `755` 表示 owner 可读写执行，group 和 others 可读可执行。
- `644` 表示 owner 可读写，group 和 others 只读。
- `700` 表示只有 owner 可以读写执行。
- `600` 表示只有 owner 可以读写。

常见命令：

```bash
chmod 644 note.txt
chmod 755 scripts
```

数字权限适合一次性设置完整权限，但它会覆盖整组三段权限。如果只想增减某一类权限，符号写法更安全。

## 符号权限

`chmod` 的符号写法由三部分组成：

```plaintext
对象 操作 权限
```

对象：

- `u`：user，也就是 owner。
- `g`：group。
- `o`：others。
- `a`：all，等同于 `ugo`。

操作：

- `+`：增加权限。
- `-`：移除权限。
- `=`：设置为指定权限。

例子：

```bash
chmod u+x deploy.sh
chmod go-w config.json
chmod g=rw report.txt
chmod a+r public.txt
```

递归修改要格外小心：

```bash
chmod -R go-w project
```

递归给所有文件加 `x` 通常是错误的，因为普通文本文件不应该都变成可执行文件。如果想只给目录加执行权限，可以使用 `X`：

```bash
chmod -R a+rX public-dir
```

`X` 的含义是：如果目标是目录，或者目标原本已经有任意执行位，就添加执行权限。它适合修复静态目录、网站资源、共享目录这类场景。

## chown 和 chgrp

权限位只描述“谁能做什么”，owner 和 group 描述“谁是这个文件的归属对象”。

修改 owner 和 group：

```bash
chown alice note.txt
chown alice:dev note.txt
chgrp dev note.txt
```

递归修改：

```bash
chown -R app:app /srv/app
```

递归 `chown` 的风险很高，尤其不要在根目录、家目录或挂载目录上随手执行。执行前先用 `find` 或 `ls` 确认目标范围：

```bash
find /srv/app -maxdepth 2 -ls
```

如果目标目录里有软链接，还要确认命令是否会跟随软链接。不同命令选项对软链接的处理不完全一样，生产环境里应先看手册或用小目录试跑。

## 默认权限和 umask

新文件和新目录的默认权限不是固定写死的，而是由程序给出的初始权限再经过 `umask` 扣减。

常见初始权限：

- 普通文件：`666`，因为普通文件默认不应该可执行。
- 目录：`777`，因为目录如果没有 `x` 就无法进入。

如果 `umask` 是 `022`：

```plaintext
文件：666 - 022 = 644
目录：777 - 022 = 755
```

如果 `umask` 是 `077`：

```plaintext
文件：666 - 077 = 600
目录：777 - 077 = 700
```

查看当前 umask：

```bash
umask
```

临时设置：

```bash
umask 027
```

`umask` 常见于 shell、systemd service、Docker entrypoint、CI 脚本中。遇到“为什么新建文件权限总是不对”时，除了看 `chmod`，也要看创建它的进程继承了什么 umask。

## setuid、setgid 和 sticky bit

除了普通的九位权限，Linux 还有三类特殊权限位。

### setuid

setuid 用在可执行文件上，表示程序运行时使用文件 owner 的有效 UID。

典型例子是 `passwd`。普通用户需要修改自己的密码，但密码数据库不是普通用户可写的，于是 `passwd` 需要在受控逻辑里临时获得更高权限。

显示形式：

```plaintext
-rwsr-xr-x
```

设置方式：

```bash
chmod u+s program
chmod 4755 program
```

setuid 风险很高，因为它会改变进程权限边界。脚本文件上的 setuid 通常不会按你想象的方式工作，生产中也不应该随便给自写程序加 setuid。

### setgid

setgid 用在可执行文件上时，表示程序运行时使用文件 group 的有效 GID。

setgid 用在目录上时更常见：目录中新建的文件会继承该目录的 group，而不是使用创建者的主组。这很适合共享协作目录。

显示形式：

```plaintext
drwxrwsr-x
```

设置方式：

```bash
chmod g+s shared
chmod 2775 shared
```

如果团队共享目录希望新文件都属于 `dev` 组，可以这样设置：

```bash
chown root:dev shared
chmod 2775 shared
```

然后再配合合适的 umask，让组成员能持续写入。

### sticky bit

sticky bit 用在目录上，表示目录里的文件只能由文件 owner、目录 owner 或 root 删除。典型例子是 `/tmp`。

显示形式：

```plaintext
drwxrwxrwt
```

设置方式：

```bash
chmod +t shared
chmod 1777 shared
```

如果一个目录对多人开放写权限，但又不希望用户互相删除文件，就需要 sticky bit。

## ACL

传统权限只有 owner、group、others 三段，有时不够表达复杂规则。比如一个文件属于 `dev` 组，但还想额外允许 `bob` 读取，就可以使用 ACL。

查看 ACL：

```bash
getfacl report.txt
```

设置 ACL：

```bash
setfacl -m u:bob:r report.txt
setfacl -m g:qa:rx app
```

删除 ACL：

```bash
setfacl -x u:bob report.txt
setfacl -b report.txt
```

如果 `ls -l` 的权限位后面出现 `+`，通常表示存在 ACL：

```plaintext
-rw-r-----+ 1 alice dev 120 Jun  3 10:00 report.txt
```

这时只看 `rwx` 三段可能会误判，要用 `getfacl` 查看完整规则。

## root 和能力边界

root 不是简单地“拥有所有文件权限”，而是拥有绕过或执行许多权限检查的能力。传统上这些能力集中在 UID 0 上，现代 Linux 也可以通过 capabilities 拆分成更细的权限。

例如：

- `CAP_NET_BIND_SERVICE` 允许绑定 1024 以下端口。
- `CAP_CHOWN` 允许修改文件所有者。
- `CAP_DAC_OVERRIDE` 允许绕过普通文件读写执行权限检查。

容器里尤其需要注意这一点。容器内的 root 不一定等于宿主机的完整 root，具体取决于用户命名空间、capabilities、挂载方式和安全策略。

## 常见排查顺序

遇到 `Permission denied`，可以按下面的顺序排查：

1. 确认当前进程身份。

   ```bash
   id
   ps -o user,group,comm -p <pid>
   ```

2. 确认目标路径每一级目录权限。

   ```bash
   namei -l /srv/app/logs/a.log
   ```

3. 确认文件 owner、group、mode。

   ```bash
   ls -l /srv/app/logs/a.log
   ```

4. 检查 ACL。

   ```bash
   getfacl /srv/app/logs/a.log
   ```

5. 检查文件系统挂载参数。

   ```bash
   mount | grep /srv/app
   ```

   `ro`、`noexec`、`nosuid` 这类挂载参数会影响读写、执行和特殊权限位。

6. 检查安全模块和服务限制。

   ```bash
   systemctl show <service> | grep -E 'User=|Group=|UMask=|ReadWritePaths=|NoNewPrivileges='
   ```

   如果启用了 SELinux、AppArmor 或 systemd sandbox，普通 Unix 权限正确也可能被额外策略拦住。

## 几个容易混淆的结论

1. 读取文件需要文件 `r` 权限，也需要路径上每一级目录的 `x` 权限。
2. 删除文件需要父目录的 `w` 和 `x` 权限，不需要文件本身的 `w` 权限。
3. owner、group、others 是三选一匹配，不是累加匹配。
4. 目录的 `x` 表示可以穿过目录，不是执行目录。
5. 普通文件默认不带 `x`，通常是因为创建时初始权限就是 `666`。
6. `chmod 777` 不是修复权限问题的通用解法，它只是把权限边界抹掉，后面通常会制造更难查的问题。
7. `ls -l` 后面有 `+` 时要看 ACL，三段权限不再是完整规则。
8. 共享目录常用 `setgid` 继承 group，用 sticky bit 防止互删，用 umask 控制新文件默认权限。

理解这些规则后，大多数 Linux 权限问题都可以拆成三步：进程是谁，路径属于谁，命中的那一段权限允许什么。
