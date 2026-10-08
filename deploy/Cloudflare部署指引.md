# Cloudflare 部署指引（深链回退 + 手机访问）

## 一、你当前遇到的两个问题

### 1. 手机打不开 `workplace-system.15003861779.workers.dev`

**原因不是站点有问题，而是域名被墙。** `*.workers.dev` 在中国大陆被 DNS 污染：

- 用国内公共 DNS（阿里 223.5.5.5）解析该域名，返回的是 `31.13.87.19` —— 这是 Facebook 的 IP，典型的污染特征
- 绕过代理直连，15 秒超时无响应
- 你电脑上能打开，是因为走了本机代理（`HTTPS_PROXY=127.0.0.1:7890`）

**关键结论**：Cloudflare 的边缘节点本身在国内是**可以直连**的（实测 `www.cloudflare.com`、`cdnjs.cloudflare.com` 直连均返回 200，不到 1 秒）。被墙的只是 `workers.dev` 这个域名后缀。

➡️ **所以：给 Worker 绑一个自己的域名，手机就能直接访问。** 绑域名：Cloudflare 控制台 → Workers & Pages → 选择该 Worker → Settings → Domains & Routes → Add → Custom Domain。

### 2. 直接打开 / 刷新 `/app/meal` 等子页面返回 404

首页和图片正常，但深链 404。原因是本项目是单页应用（SPA），所有页面由前端路由接管，而静态托管默认会去找同名文件。

- 部署成 **Worker** 时，必须在 `wrangler.jsonc` 里声明 `not_found_handling: "single-page-application"`（仓库里已加好）
- **不要用 `_redirects` 给 Workers 做 SPA 回退**：Workers 会严格校验该规则，报 `Infinite loop detected in this rule`（code 100324），**直接导致 `wrangler deploy` 失败**（已实测踩到，构建日志里是 `Failed: error occurred while running deploy command`）
- `_redirects`（`/* /index.html 200`）只在 **Cloudflare Pages / Netlify** 上可用。本项目已改用 `wrangler.jsonc`，因此该文件已从仓库移除

**注意**：「控制台上传 dist 目录」这种部署方式不会读取仓库里的 wrangler 配置，所以配置文件加了也不会生效。需要换成下面两种方式之一。

## 二、两种修法

### 方案 A：改用命令行部署（改动最小）

仓库已配好 `wrangler.jsonc` 与一键脚本。在项目目录执行：

```bash
npx wrangler login      # 首次需要，浏览器里点授权
npm run deploy          # = 构建 + wrangler deploy（会读取 wrangler.jsonc）
```

之后每次改完代码，跑一次 `npm run deploy` 即可。首次登录也可以改用 API Token（控制台 → My Profile → API Tokens 创建，权限选 Edit Cloudflare Workers）：

```bash
# PowerShell
$env:CLOUDFLARE_API_TOKEN="你的token"; npm run deploy
# Git Bash
CLOUDFLARE_API_TOKEN=你的token npm run deploy
```

### 方案 B：改用 Cloudflare Pages 连仓库（推荐，以后不用管部署）

Pages 的 SPA 回退：沿用构建产物里的 `404.html` 即可（`scripts/build.mjs` 会自动生成），或按 Pages 文档在 `public/` 下自行添加 `_redirects`。它的优势是**每次 push 自动重新部署**，不用在本地敲命令。

控制台 → Workers & Pages → Create → Pages → Connect to Git → 选 `workplace-system` 仓库：

| 配置项 | 值 |
| --- | --- |
| Framework preset | Vite（或 None） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| 环境变量 | `NODE_VERSION` = `20` |

部署完会拿到 `workplace-system.pages.dev`。同样是海外域名，手机访问仍需绑自有域名，但自动部署体验最好。

## 三、用于简历的链接怎么选

| 链接 | 国内手机直连 | 说明 |
| --- | --- | --- |
| `xxx.app.workbuddy.host`（当前发布地址） | ✅ 实测 200 | 首页、深链、图片全部可访问；平台预览地址，长期稳定性无保障 |
| `xxx.workers.dev` / `xxx.pages.dev` | ❌ 被污染 | 必须绑自有域名后才能给国内用户 |
| 自有域名 + Cloudflare | ✅ 边缘可达 | 最正式的方案，约 ¥60-100/年 |

## 四、绑自有域名的完整流程

1. 买域名（Namesilo / Cloudflare Registrar / 阿里云均可，约 ¥60-100/年）
2. 域名接入 Cloudflare（DNS 托管），按提示把域名的 NS 记录改成 Cloudflare 给的两个地址
3. Worker 或 Pages 项目 → Settings → Domains & Routes → Add → Custom Domain → 填 `你的域名`
4. 等证书签发（通常几分钟），手机上直接访问验证

**注意**：托管在境外（Cloudflare）**不需要 ICP 备案**；如果换成国内云服务器/对象存储绑定自定义域名，则必须备案（约 1-2 周）。
