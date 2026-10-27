# 微问卷 Web

Vue + TypeScript 的独立问卷填写项目，采用分离的 Model / ViewModel / View。与现有 FastAPI 后端对接，正式填写入口为 `https://www.kiandfn.cn/s/问卷UUID`。

## 本地运行

建议 Node.js 24 LTS，使用随项目提供的 lockfile 安装依赖：

```sh
npm ci
npm run dev
```

打开终端显示的地址。`/demo` 是明确标识的本地示例，所有答案留在浏览器，不调用正式提交接口。访问真实 `/s/问卷UUID` 时只请求真实 API，失败不会切换成演示数据。

需要配置时将 `.env.example` 复制为 `.env.local`。开发环境默认将 `/api` 代理到 `http://127.0.0.1:8000`；设置 `API_PROXY_TARGET` 可切换到自己的测试后端。环境变量变更后重启 Vite。`VITE_` 变量会进入前端包，禁止放密钥。

## 分层

```text
src/models/          数据结构、API 数据校验、答案/可见性规则、分享链接解析
src/services/        HTTP、登录与刷新、问卷 API、浏览器草稿存储
src/viewmodels/      页面状态、交互、异步任务与流程控制
src/views/           页面模板、绑定 ViewModel
src/components/      题卡与登录表单的展示组件
src/router/          HTTPS 路径对应的前端路由
src/fixtures/        仅 /demo 使用的示例问卷
```

Vue 文件只做属性声明、事件绑定与展示，不在组件中请求业务 API 或实现条件判断算法。

## 支持范围

- 单选、多选、下拉、文本和评分；支持评分自定义区间。
- 必答校验、选项有效性、字数/多选数量限制。
- `depends_on` 的 all/any 与 in/not_in；未答或隐藏的父题不能触发条件。隐藏答案立即移除，提交时再过滤。
- 匿名填写与要求登录的问卷；使用已有邮箱/密码账号登录，401 时单次刷新并重试，多请求共享刷新任务。
- 浏览器草稿按问卷、用户身份和版本隔离，有效期 7 天；成功提交清除草稿。没有服务端草稿恢复接口，因此这里不声明跨设备同步。
- 重复提交限制、关闭/截止/私有/登录错误提示、真实提交回执。网络中断后保留答案，先核对状态再由用户决定是否重试。
- 桌面和移动布局、键盘焦点、输入标签、必答错误定位。

## API

默认基地址 `/api/v1`：

| 功能 | 接口 |
| --- | --- |
| 读取问卷与可填状态 | GET /responses/surveys/{id} |
| 提交 | POST /responses/surveys/{id}/submit |
| 邮箱登录 | POST /auth/login |
| 刷新会话 | POST /auth/refresh |
| 获取当前用户 ID | GET /users/me |

提交 JSON 为 `{ "answers": [{ "question_id": "UUID", "value": "答案" }] }`，读取统一 `success/data/error` 信封。每次请求携带稳定的 `X-Client-ID`，登录后携带 Bearer token。匿名重复限制沿用后端客户端标识与 IP 规则，不承诺跨浏览器去重。

会话保存在当前标签页的 sessionStorage，草稿在 localStorage；两种存储不可用时会降级并提示草稿无法保存。公共设备离开前应清空草稿、关闭标签页。

## 验证与构建

```sh
npm test
npm run build
npm run preview
```

测试覆盖条件分支、隐藏答案、验证、草稿隔离、提交防重、失败保留、过期异步结果、401 刷新与 API 合约。它们不能代替正式 API、微信/QQ、华为签名包的设备验证。

## 部署到 www.kiandfn.cn

1. `npm run build`，将 `dist` 完整发布到网站目录，包括 `.well-known`。
2. 配置有效 HTTPS，并将 `/s/*` 等前端路由回退到 `index.html`。
3. 配置 `/api` 反向代理到业务后端。`deploy/nginx.conf.example` 默认上游为 `https://api.kiandfn.cn`，需按实际环境核对；使用其他 API 源时可设置 `VITE_API_BASE_URL`，并在后端精确配置 CORS。
4. 为 `/.well-known/applinking.json` 配置直接文件响应，不能回退到首页。推荐入口名称「微问卷 · 问卷填写」。
5. 按 [自有域名 App Linking 操作说明](docs/app-linking.md) 完成 AGC 发布、手动签名和设备验证。

项目代码不自动部署网站、修改 DNS、发布 AGC 配置或推送远程 Git。域名关联不是网页上线；两项都完成后才可以将链接交付给真实用户。
