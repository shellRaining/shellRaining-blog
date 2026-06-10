---
title: mihomo rules
tag:
  - dev-tools
date: 2026-04-20
---

公司内网访问 GitHub 等站点速度太慢，因此考虑使用代理来访问，但同时担心公司内网无法访问，于是采用规则覆写解决该问题，同时要注意，不要开启虚拟网卡，同时让规则全局启用

```yaml
# https://mihomo.party/docs/guide/override/yaml

dns:
  fake-ip-filter!:
    - "*"
    - "+.lan"
    - "+.local"
    - "time.*.com"
    - "ntp.*.com"
    - "+.market.xiaomi.com"
    - "+.baidu-int.com"
    - "+.baidu.com"
  nameserver-policy:
    ".baidu-int.com":
      - system
    ".baidu.com":
      - system
  direct-nameserver:
    - system

+rules:
  - DOMAIN-SUFFIX,baidu.com,DIRECT
  - DOMAIN-SUFFIX,baidu-int.com,DIRECT
  - IP-CIDR,10.11.152.208/32,DIRECT,no-resolve
```
