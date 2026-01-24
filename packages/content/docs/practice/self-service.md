---
title: 在 MacBook Air 上自建服务
tag:
  - practice
date: 2025-08-02
---

## why

在日常生活中我们经常需要填写一些表单，里面会有两类头疼的字段

1. 不容易记住的文本字段：比如身份证有效时间、学位证编号等，这些文本我们很少使用，因此很难记忆
2. 无法当场找到的文件：比如学生证、身份证等……一般是要求文件形式，如果手边刚好没有这些文件，只能对着这个字段干瞪眼了

因此一个自然的想法是：我们是否可以将这些数据结构化的存储到一个位置，需要的时候再去查找呢？那么就先梳理一下需求，看一下哪些服务符合

1. 保密性：因为要存储密码还有身份证照片等信息，保密性是不可以妥协的，因此暂时不考虑现有的网盘产品
2. 安全性：存储的数据必须保证安全，除了防止泄露外，还要避免因为意外消失，这么看本地的服务在安全性上稍逊一筹，同时 iCloud 就不考虑了，这个感觉不那么可靠……
3. 便携性：我有很多设备，我希望他们都能够访问这些数据，因此本地存储这条路就走不通，即使使用移动硬盘也会因为文件系统不同造成很多障碍
4. 低成本：当时看了一下市面的网盘产品，年费会员大多在 150-200r 之间，因此希望花费尽可能年花费少于 150r，云服务器在这方面就有点小劣势

综上所述，我打算用我的 MacBook Air 搭服务，首先数据是存储在本地硬盘上的，因此安全性应该没问题（硬盘应该不会炸吧……），其次就是公司发了新电脑，这台 MacBook Air 落灰了一段时间，搭建服务刚好产生点剩余价值🤣

## 开始之前

<img style="width: 50%; display: block; margin: auto;" src="https://2f0f3db.webp.li/2025/08/20250802114424316.png" alt="image.png" />

其实在这之前，我根本没接触过自建服务，不过抱着试试的心态去问了 Claude，她给出了两个解决方案，第一个是使用 Nextcloud 存储文件，第二个是使用 Vaultwarden 存储密码等信息，还给出了具体的解决方案，我会以她给出的教程为模板，写出我这次搭建的过程

顺便一提，如果你搭建时遇到了问题，也可以向 Claude 大小姐提问，这里有一个提问的小心得：如果只是将报错信息发送给她，她可能会一下子回答很多步骤，这不仅浪费 token（Claude code 和 chat 是共用额度的），还让我们不得不阅读大段文字，去里面捞取可能有价值的信息。你可以在 prompt 加上一段话：

> 请不要一口气给很多建议, 请你一条一条交互式的指导我, 我会给你执行结果和反馈，你再根据执行结果给出下一步建议

这个 prompt 亲测有效，不过也有弊端，我们成了终端和 Claude 的黏合剂，一直在两个窗口不停地搬运信息……因此，也许使用 Claude code 或者其他 agent 工具处理这种问题会更有效且方便，大家有兴趣可以尝试一下

## 搭建 Nextcloud 服务

### 环境准备

经过测试，这两个服务总共会占用大概 270 MB 的内存，不算很大，因此哪怕是最丐版 MacBook Air 8G 都可以轻松运行，我们只需要关注硬盘空间即可

```bash
# 检查可用磁盘空间
df -h

# 安装Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Docker Desktop
brew install --cask docker

# 安装其他必要工具
brew install git
brew install wget
```

### 启动Docker Desktop

1. 从Applications文件夹启动Docker Desktop
2. 等待Docker完全启动（状态栏显示Docker图标）
3. 验证Docker安装：

```bash
docker --version
docker-compose --version
```

### 创建项目目录

```bash
# 创建主目录
mkdir ~/nextcloud-server
cd ~/nextcloud-server

# 创建数据目录结构
mkdir -p data/nextcloud
mkdir -p data/db
mkdir -p data/backup
mkdir -p config
mkdir -p logs

# 设置权限
chmod 755 data/nextcloud
chmod 700 data/db
```

### 创建Docker Compose文件

```bash
# 创建docker-compose.yml文件
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  nextcloud:
    image: nextcloud:latest
    container_name: nextcloud
    ports:
      - "8080:80"
    environment:
      - POSTGRES_DB=nextcloud
      - POSTGRES_USER=nextcloud
      - POSTGRES_PASSWORD=your_secure_password_here
      - POSTGRES_HOST=db
      - NEXTCLOUD_ADMIN_USER=admin
      - NEXTCLOUD_ADMIN_PASSWORD=admin_password_here
      - TRUSTED_DOMAINS=localhost,127.0.0.1,cloud.yourdomain.com
    volumes:
      - ./data/nextcloud:/var/www/html
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - nextcloud-network

  db:
    image: postgres:13
    container_name: nextcloud-db
    environment:
      - POSTGRES_DB=nextcloud
      - POSTGRES_USER=nextcloud
      - POSTGRES_PASSWORD=your_secure_password_here
    volumes:
      - ./data/db:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - nextcloud-network

networks:
  nextcloud-network:
    driver: bridge
EOF
```

### 修改配置文件中的密码

```bash
# 使用文本编辑器修改密码
nvim docker-compose.yml

# 需要修改的地方：
# - POSTGRES_PASSWORD=your_secure_password_here (两处)
# - NEXTCLOUD_ADMIN_PASSWORD=admin_password_here
# - TRUSTED_DOMAINS=localhost,127.0.0.1,cloud.yourdomain.com (替换为您的域名)
```

这里的编辑器可以任选，不过我就夹带点私货，使用 Neovim 谢谢喵

### 启动服务

```bash
# 确保在项目目录中
cd ~/nextcloud-server

# 启动服务
docker-compose up -d

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f nextcloud
```

### 验证安装

```bash
# 等待几分钟后检查服务状态
docker-compose ps

# 检查容器日志
docker-compose logs nextcloud | tail -20

# 在浏览器中访问
open http://localhost:8080
```

### 首次登录配置

1. 打开浏览器访问 `http://localhost:8080`
2. 如果自动安装成功，使用配置的管理员账号登录
   - 管理员用户名：admin
   - 管理员密码：您在[这一步](#修改配置文件中的密码)设置的密码

---

至此，我们就完成了 Nextcloud 服务的搭建！（并没有）

## 内网穿透

上一步搭建其实只是最基本的启动服务，我们只能在局域网下通过 `http://localhost:8080` 来访问，毫无疑问这是很不实用的，因此我们还需要进行内网穿透，让我们的服务可以间接暴露在公网，同时分配一个域名，让访问更加简单！

首先说一下我的情况，我只有一个在 NameSilo 购买的域名，并将他分配给了我的静态博客，博客是托管在 Vercel 上的，DNS 解析在 Cloudflare 管理。

内网穿透的方法有很多，比如自己买个云服务器，或者去一些平台合租，又或者用 Cloudflare tunnel，我最开始尝试的方法是 Cloudflare tunnel

### 配置 Cloudflare tunnel

```bash
# 安装cloudflared
brew install cloudflared

# 登录Cloudflare
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create nextcloud-tunnel

# 配置路由
cloudflared tunnel route dns nextcloud-tunnel cloud.yourdomain.com(替换为您的域名)

# 启动隧道
cloudflared tunnel run nextcloud-tunnel
```

执行 `cloudflared tunnel create nextcloud-tunnel` 命令后，会输出类似的信息

```bash
Tunnel credentials written to /Users/xxx/.cloudflared/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX.json
Created tunnel nextcloud-tunnel with id: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

其中XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX就是 Tunnel ID。我们下一步创建配置文件时会用到

### 创建配置文件

```
# 创建配置文件（使用您的实际隧道ID）
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: c85a31c9-ce40-486f-b286-bbae1629cebe
credentials-file: ~/.cloudflared/c85a31c9-ce40-486f-b286-bbae1629cebe.json

ingress:
  - hostname: cloud.yourdomain.com (替换为您的域名)
    service: http://localhost:8080
  - service: http_status:404
EOF
```

### 验证配置

浏览器访问 `https://cloud.yourdomain.com`，如果看到 Nextcloud 登录页面，说明配置成功

### 后续优化

#### 强制 HTTPS

```bash
# 进入容器
docker exec -it nextcloud bash

# 配置强制HTTPS
php occ config:system:set overwriteprotocol --value=https
php occ config:system:set overwrite.cli.url --value=https://cloud.yourdomain.com

exit
```

#### 端到端加密

```bash
# 进入容器
docker exec -it nextcloud bash

# 启用端到端加密应用
php occ app:enable end_to_end_encryption

exit
```

#### 创建新用户（可选）

我自己不想用默认的 admin 作为用户名，因此会删除旧有的账户，创建一个全新的 shellRaining 账户

```bash
# 进入容器
docker exec -it nextcloud bash

# 创建新的管理员用户（替换 shellRaining 为您想要的用户名）系统会提示输入密码
php occ user:add shellRaining --display-name="shellRaining" --group="admin"
```

删除默认 admin 账户

```bash
# 确认新账户正常工作后，删除admin账户
docker exec -it nextcloud bash

# 删除admin用户（谨慎操作！）
php occ user:delete admin

exit
```

#### 双因素认证

在 Nextcloud Web 界面中：

1. 点击右上角头像 → 设置
2. 在"安全"部分启用双因素认证
3. 使用你最喜欢的软件来设置，这里推荐一波 2FAS，在 Google Play 就可以搜到

### 使用其他内网穿透服务

Cloudflare 的隧道服务限速有点狠，我记得当时只有 200KB/s，这个速度可以跟百度网盘掰掰手腕了（笑），而且 SSL 握手时间会很长，让我们每次执行操作都要等一小段时间，使用体验很差，因此可以换用其他内网穿透服务，我这里选择合租，因为自己搭建实在是太奢侈了，而且如果买了云服务器，那我为什么还要做内网穿透……

我最终选择合租了香港的服务器，因为使用我的域名指向这里不需要备案，后续测试速度也可以跑满给定的限额，nice catch!!! 😄

## 搭建 Vaultwarden 服务

上面我们跑通了全套的 Nextcloud 服务，现在开始搭建 Vaultwarden 服务，之所以不使用 Nextcloud 管理密码，是出于专业的活就交给专业的工具来干的心理，Claude 大小姐提到：

```
Vaultwarden：专门管理密码、2FA密钥
Nextcloud：管理文档、照片、其他文件
```

这样我们就可以同时享受到文件和密码存储的服务了！

### 环境准备

```bash
# 创建项目目录
mkdir ~/vaultwarden-server
cd ~/vaultwarden-server

# 创建数据和配置目录
mkdir -p data config backup

# 查看目录结构
ls -la
```

### 创建 Docker Compose 文件

```bash
# 创建docker-compose.yml文件
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    environment:
      # 基础配置
      WEBSOCKET_ENABLED: "true"
      SIGNUPS_ALLOWED: "true"
      ADMIN_TOKEN: "your_admin_token_here"
      DOMAIN: "https://cloud.yourdomain.com"

      # 安全配置
      ROCKET_PORT: "80"
      ROCKET_WORKERS: "10"

    volumes:
      - ./data:/data
    ports:
      - "8081:80"
    networks:
      - vaultwarden-network

networks:
  vaultwarden-network:
    driver: bridge
EOF

# 查看文件内容
cat docker-compose.yml
```

### 生成随机令牌

```bash
# 生成随机的管理员令牌
openssl rand -base64 48
```

### 更新配置文件中的管理员令牌

```bash
# 替换配置文件中的管理员令牌
sed -i '' 's/your_admin_token_here/Q9nkRVq0PcSMa5OeWlTNqeer5dS2l\/4EV62vFFcv6v+OzAEBR2XDHh0JNxZE2XGh/' docker-compose.yml

# 验证替换是否成功
grep "ADMIN_TOKEN" docker-compose.yml
```

### 启动 Vaultwarden 服务

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看启动日志
docker-compose logs vaultwarden | tail -10
```

### 测试本地访问

```bash
# 测试Vaultwarden Web界面是否可访问
curl -I http://localhost:8081

# 在浏览器中打开Vaultwarden
open http://localhost:8081
```

---

经过上面的步骤，我们成功启动了 Vaultwarden 服务，后面还需要域名指向，这部分和上面讲到的内容重叠，除了域名指向，为了方便使用，我们需要配置 Vaultwarden 的客户端 Bitwarden

### 配置 Bitwarden

安装浏览器插件和桌面应用（可选），比方说已经安装好了插件，我们点刚安装好的插件，可以看到底部有个选择器组件，我们点击其中“自托管”的选项，输入上面配置的服务位置和密码等信息，就可以正常使用！

## 应用集成

Nextcloud 有手机客户端，但是只保证了最基础的文件访问，一些应用没有集成，比如 tasks、notes 等，我们需要使用第三方的应用来连接

tasks 可以使用 tasks.org 这个应用，他支持与 Nextcloud 集成，就是需要付费，花的不多，任意等级的赞助都可以，你甚至可以选择每年 0.99 刀，为了开源生态发展，希望大家不要吝惜！

notes 可以使用 obsidian 替代，说实话 notes 这个应用真的很难用，编辑体验和 Typora、obsidian 差远了，甚至不如配置好的 Neovim（笑）

我们集成应用时，一般需要输入 WebDAV 地址，注意这里不要输入我们的域名地址，而应该加上一些后缀。假设我们的域名是 `https://cloud.yourdomain.com`，那么我们就应该填入 `https://cloud.yourdomain.com/remote.php/webdav/`，为什么要这么输入呢？Claude 说到：

> Nextcloud 为不同的协议提供了不同的访问端点：
>
> ```bash
> https://cloud.yourdomain.com/                    # Web 界面
> https://cloud.yourdomain.com/remote.php/webdav/  # WebDAV 协议
> https://cloud.yourdomain.com/remote.php/dav/     # CalDAV/CardDAV 协议
> https://cloud.yourdomain.com/ocs/v2.php/         # OCS API
> ```
>
> 在这里可以看到有两种路径
>
> - **`/remote.php/webdav/`**：相当于一个快捷方式，会自动重定向到下面的路径
> - **`/remote.php/dav/files/[用户名]/`**：这是**完整的 CalDAV/WebDAV 标准路径**，直接指向用户文件根目录

我们一般来说选用前者即可，以 cherry studio 为例：

![image.png](https://2f0f3db.webp.li/2025/08/20250803002047385.png)

可以看到图中有一个 WebDAV 密码，注意这里的密码不是我们 Nextcloud 的密码，而是应用密码，具体设置位置见下图：

![image.png](https://2f0f3db.webp.li/2025/08/20250803003302429.png)

## 域名备案

上面内网穿透我使用的是香港的服务器，访问需要科学上网，而众所周知，一年中经常会有那么几段时间，梯子不是很好使，这让我们服务的稳定性大打折扣，因此我就寻思使用国内的服务器进行穿透，这就要求我们做好备案的手续

但是备案要求填写的手续非常多，我感觉折腾下来头都会大一圈，就看了一下阿里云的备案管家，我敲，好贵……

![image.png](https://2f0f3db.webp.li/2025/08/20250802233202890.png)

本来都快死心了，偶然看到 Linux Do 论坛里面提到可以使用备案码，这样即使不购买服务器也能拜托备案，于是着手准备，去淘宝上买了个腾讯云的备案码。

填写信息后第二天，我就收到腾讯云的电话，说是域名没有进行主体备案，需要转移到腾讯云（原来是在 NameSilo 下购买的，因为是境外服务，因此没进行主体备案），这部分花了五天时间。

域名成功转移后，重新提交被驳回的申请，又过了一天，腾讯云这边审核通过，提交管局备案，这部分又花了八天左右，最终成功管局备案！

管局备案后，收到腾讯云的邮件，说是要在二十天内进行公安备案，询问论坛中的大佬得知无须公安备案，原文如下：

> GA 备案，一般都是各地通管局把 ICP 备案信息下发到备案主体所在县区 GA 局网安大队，然后网安大队工作人员会主动跟你打电话确认，有些地区是提交资料后直接通过，有些地区是要本人到网安大队参加网络培训之后才通过。
>
> GA 备案，是被动备案的，如果没人联系你，不用理会就是了。其实比 ICP 备案更简单、快速，通过后，除非有人举报，否则一般没人管的。

备案完成后，将穿透的服务器切换到大陆，能够非常明显的感受到服务稳定性的提高！前几天一直出现的 503 错误在切换后几乎没有出现了！

## 总结

折腾完这一套下来，算一下成本

- 时间成本，总共 15 小时左右
- 合租内网穿透服务，每月 10 元
- 备案码，总共 8 元
- 域名转移，重新购买一年，花费 88 元
- MacBook 功耗，一般低于 10 瓦

## 致谢

- Linux Do 论坛
  - @calm66
  - @popfish
  - @sakuraikaede
- CC98 论坛
  - @絢瀬絵里
  - @h272377502
