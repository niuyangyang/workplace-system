# 职场综合应用系统

一套面向企业内部的**综合办公门户原型**：统一入口 + 应用中心 + 多个业务子系统，覆盖制度、文档、人事组织、会议、订餐、数据可视化等场景。纯前端实现，构建产物为静态站点，可直接托管。

## 在线演示

- 演示地址：<https://814f3140e54148928da83eeb71028418.app.workbuddy.host>
- 建议入口：首页应用中心（各子系统卡片点击进入）

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 门户前台 | 首页工作台、待办中心、通知中心、使用手册 |
| 应用中心 | 统一应用入口，卡片式导航 |
| 制度管理 / 制度前台 | 制度清单、详情、**历史版本对比（code-diff 行级差异）**、意见征集 |
| 企业文档中心 | 知识库工作区（目录树 + 富文本编辑器）、文档检索、多类型文档 |
| 人员组织 | 组织架构树、人员信息、人员结构分析 |
| 会议室预订 | **主检查台布局**：左侧周时间轴选时段 + 右侧实时预约面板，零弹窗；组织树选人、RSVP 回执、容量校验、预约记录 |
| 员工订餐 | **H5 单形态**：分类浏览菜品、购物车、备注、行政统一采购；桌面浏览器直接呈现移动端效果 |
| 数据大屏 | 员工籍贯分布可视化（离线中国地图，运行时零 Key、零外部请求） |
| 人物画像 | 员工多维画像与结构分析 |

## 技术栈

- **框架**：React 18 + TypeScript + Vite 5
- **UI**：Ant Design 5/6 + 自研设计系统（`DESIGN*.md`）
- **可视化**：ECharts 6（离线地图）、Three.js / @react-three/fiber（3D 场景）、ThreeUI WebGL 组件
- **富文本**：wangEditor 5
- **差异对比**：react-diff-viewer-continued

## 本地运行

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建（输出 dist/）
npm run preview  # 本地预览构建产物
```

## 部署说明

本项目是单页应用（SPA），所有页面由前端路由接管，静态托管需要额外配置「未知路径回退到 index.html」，否则直接访问或刷新 `/app/xxx` 会 404。

| 托管方式 | 深链回退做法 |
| --- | --- |
| Cloudflare Workers（当前使用） | 仓库根 `wrangler.jsonc` 中 `assets.not_found_handling: "single-page-application"` |
| 通用静态托管 | 构建会自动产出 `dist/404.html`（由 `scripts/build.mjs` 复制 index.html 生成） |
| Cloudflare Pages / Netlify | 二选一：沿用上面的 `404.html`，或自行在 `public/` 下添加 `_redirects`（内容 `/* /index.html 200`） |

> ⚠️ 不要直接把 `_redirects` 用于 Workers：Workers 会校验该规则并报 `Infinite loop detected in this rule`（code 100324），**导致部署直接失败**。Workers 请使用 `wrangler.jsonc`。

### Cloudflare Workers 部署

仓库根已提供 `wrangler.jsonc`。两种方式任选：

- **连仓库自动构建**：在 Cloudflare 控制台连接本仓库，构建命令 `npm run build`，部署命令 `npx wrangler deploy`
- **本地命令行**：`npx wrangler login` 后执行 `npm run deploy`（= 构建 + `wrangler deploy`）

### Cloudflare Pages 部署

连接本仓库后：

| 配置项 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| 环境变量 | `NODE_VERSION=20` |

## 说明

项目为**演示原型**：数据为内置的模拟数据，交互流程完整可走通，但不接入真实后端与数据库。
