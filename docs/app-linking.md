# 微问卷自有域名应用链接

## 控制台填写

| 字段 | 值 |
| --- | --- |
| 名称（若界面提供） | 微问卷 · 问卷填写 |
| 关联网址域名 | https://www.kiandfn.cn |
| APP ID | 6917613377314952961 |
| Bundle name | com.kiandfn.microquestionnaire |
| 分享地址 | https://www.kiandfn.cn/s/问卷UUID |

使用 AGC「增长 → App Linking → 应用链接」，无须申请聚合链接前缀。域名字段不带末尾斜杠，不填写 `/s/…`。

## 网站部署

将 `public/.well-known/applinking.json` 发布为：

`https://www.kiandfn.cn/.well-known/applinking.json`

文件必须公开返回 HTTP 200 和 JSON 正文，APP ID 为字符串；不能要求登录、返回 SPA 首页或被点目录过滤规则拦截。构建工具会将此文件复制到 `dist/.well-known/`，上传时需包含隐藏目录。建议采用 `deploy/nginx.conf.example` 中的精确路径配置。

网站 HTTPS 证书需有效，`/s/问卷UUID` 刷新时也应返回 SPA。Web 端通过 `/api/v1` 访问业务 API；默认开发代理与生产反代配置不同，参见 README。

## AGC 发布

先开通 App Linking 服务，再创建上述关联网址域名。网站文件可访问后发布，等待校验成功；本地代码与文件不代表云侧发布成功。该文档不包含任何 AGC 自动发布操作。

## 客户端

ArkUI 的 `entry/src/main/module.json5` 已配置独立的 browsable/viewData skill、HTTPS host、填卷路径规则和 `domainVerify: true`。分享面板、碰一碰、复制链接共用 HTTPS 生成器。

`EntryAbility` 在冷启动/热启动解析 `want.uri`，校验域名、路径、问卷 UUID，跳转到 Fill 页面。原自定义 Scheme 不再注册或接收。

网页不主动循环重定向或强拉 App。官方说明：系统浏览器/ArkWeb 从同一域名网页点击同域链接时会继续打开网页，所以当前页面不能靠再次跳转同一地址保证唤起 App。

## 验证顺序

1. 确认网站验证文件及真实问卷网页可访问，AGC 关联状态发布成功。
2. 在 DevEco 中配置与该 AGC 应用对应的有效手动签名；官方验证指南要求手动签名。当前 checkout 的旧签名路径需要开发者修正，本文不包含证书或密码。
3. 重新构建并安装新版 App。可在备忘录点击真实 HTTPS 问卷链接，检查冷启动、热启动是否到正确问卷。
4. 若需诊断，可使用如下 HDC 命令（替换问卷 UUID）：

```text
hdc shell aa start -U "https://www.kiandfn.cn/s/问卷UUID" --pb appLinkingOnly true
hdc shell hidumper -s AppDomainVerifyManager
```

5. 检查未安装 App 的设备是否进入网页，分别测试微信/QQ 的链接点击、扫码和浏览器入口。这些客户端的实际唤起行为必须在目标设备验证，云侧发布成功不能替代此项。

依据：[华为 App Linking 指南](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/app-linking-startupapp)、[域名与路径排查](https://developer.huawei.com/consumer/cn/doc/doccenter-dev-faq/share-kit-troubleshooting-0002)。
