import './introSite.css'

/* ============ 作品介绍（项目 Showcase） ============
   介绍本「职场综合应用平台」原型：项目背景 / 产品架构 / 核心页面截图 / AI 使用说明
   视觉沿用门户品牌 token：品牌蓝 #3b5bff、浅灰底、专业简洁，
   不与电影沉浸 / 重科技风冲突；纯 CSS 实现，运行稳定 */

const NAV = [
  { id: 'background', label: '项目背景' },
  { id: 'arch', label: '产品架构' },
  { id: 'shots', label: '核心页面' },
  { id: 'ai', label: 'AI 使用说明' },
]

const SHOTS = [
  { src: '/intro/portal.webp', title: '门户首页', desc: '待办、通知、手册一体化的员工前台门户' },
  { src: '/intro/bigscreen.webp', title: '数据大屏', desc: '员工籍贯分布 · ECharts 离线中国地图' },
  { src: '/intro/building3d.webp', title: '楼宇 3D', desc: '办公楼三维可视化、楼层平面与工位查询' },
  { src: '/intro/persona.webp', title: '人物画像', desc: '员工全息人物建模与多维画像分析' },
  { src: '/intro/bigscreen3d.webp', title: '3D 数据大屏', desc: '图表改用 ThreeUI 3D 组件重构' },
  { src: '/intro/threeui.webp', title: '3D 视觉组件', desc: '基于 ThreeUI 的 WebGL 特效与可视化组件库' },
]

const AI_ITEMS = [
  {
    t: '设计方向',
    d: 'design-taste-frontend 定调反模板；qiaomu-design 出四方向预览 + 评审门禁；web-design-engineer 负责生产落地。',
  },
  {
    t: '3D / 可视化',
    d: 'ThreeUI 组件库提供 WebGL 特效；ECharts 离线中国地图零 Key、零地图服务请求、零额度消耗。',
  },
  {
    t: '数据处理',
    d: 'Excel / Apache POI → MySQL 的数据加工链路，支持多轮精修与抽样校验，落库为可复用 SQL。',
  },
  {
    t: '智能评审',
    d: 'AI 多视角评审（产品 / 研发 / 设计 / 测试 / 运营 / 法务）发现体验、一致性与合规问题。',
  },
]

export default function IntroSite() {
  return (
    <div className="intro">
      <header className="intro-top">
        <span className="intro-brand">职场综合应用平台</span>
        <nav className="intro-nav">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="intro-hero" id="top">
        <p className="intro-eyebrow">作品介绍 · PROJECT SHOWCASE</p>
        <h1>把分散的职场系统，收进一个入口</h1>
        <p className="intro-lead">
          这是一套面向企业 / 高校的「职场综合应用平台」原型，以制度管理为核心，整合前台门户、应用中心与多套业务
          / 可视化子系统，并用 AI 贯穿设计、可视化与数据处理。
        </p>
        <div className="intro-stats">
          <div>
            <b>18+</b>
            <span>子系统应用</span>
          </div>
          <div>
            <b>3</b>
            <span>后台管理域</span>
          </div>
          <div>
            <b>1</b>
            <span>统一门户入口</span>
          </div>
        </div>
      </section>

      <section className="intro-section" id="background">
        <h2>项目背景</h2>
        <div className="intro-cols">
          <div className="intro-card">
            <h3>痛点</h3>
            <p>企业内部系统碎片化：制度查询难、审批流分散、数据呈现不直观，员工与管理者缺乏统一入口。</p>
          </div>
          <div className="intro-card">
            <h3>目标</h3>
            <p>用原型验证「门户 + 应用中心 + 后台」一体化架构，并探索 AI 辅助设计与 3D 可视化在管理系统的落地。</p>
          </div>
          <div className="intro-card">
            <h3>范围</h3>
            <p>覆盖门户前台（首页 / 待办 / 通知 / 手册）、应用中心（18+ 应用）与三大后台（制度 / 人员 / 文档）。</p>
          </div>
        </div>
      </section>

      <section className="intro-section" id="arch">
        <h2>产品架构</h2>
        <div className="arch">
          <div className="arch-layer arch-portal">
            <span className="arch-tag">前台门户</span>
            <div className="arch-items">
              <i>首页</i>
              <i>待办</i>
              <i>通知</i>
              <i>手册</i>
            </div>
          </div>
          <div className="arch-arrow">▼</div>
          <div className="arch-layer arch-center">
            <span className="arch-tag">应用中心</span>
            <div className="arch-items">
              <i>考勤</i>
              <i>审批</i>
              <i>通讯录</i>
              <i>文档</i>
              <i>薪资</i>
              <i>会议室</i>
              <i>任务</i>
              <i>公告</i>
              <i>假期</i>
              <i>组织</i>
              <i>制度</i>
              <i>大屏</i>
              <i>画像</i>
              <i>楼宇3D</i>
              <i>ThreeUI</i>
            </div>
          </div>
          <div className="arch-arrow">▼</div>
          <div className="arch-layer arch-back">
            <span className="arch-tag">三大后台</span>
            <div className="arch-items">
              <i>制度管理</i>
              <i>人员组织</i>
              <i>企业文档</i>
            </div>
          </div>
        </div>
        <p className="intro-tech">
          技术栈：React 18 · Vite 5 · TypeScript · Ant Design · ECharts 6 · Three.js / R3F · mermaid · wangeditor
        </p>
      </section>

      <section className="intro-section" id="shots">
        <h2>核心页面截图</h2>
        <div className="intro-grid">
          {SHOTS.map((s) => (
            <figure className="intro-shot" key={s.title}>
              <img src={s.src} alt={s.title} />
              <figcaption>
                <b>{s.title}</b>
                <span>{s.desc}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="intro-section" id="ai">
        <h2>AI 使用说明</h2>
        <div className="intro-ai">
          {AI_ITEMS.map((a) => (
            <div className="ai-item" key={a.t}>
              <h3>{a.t}</h3>
              <p>{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="intro-foot">
        <span>职场综合应用平台 · 原型作品</span>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </div>
  )
}
