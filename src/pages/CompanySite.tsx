import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlowField } from '@designcodeio/threeui'
import { ORG_TREE, ORG_PEOPLE, ORG_PARENT_MAP, ORG_ROOT_ID } from '../data/org'
import { apps } from '../apps'
import './companySite.css'

/* ============ 星辉科技集团官网（方向 D · 电影沉浸） ============
   设计事实源：项目根 DESIGN.md
   用户反馈「往下没有画面」→ 第 3-8 幕全部配视觉：系统界面示意 / 数据图表 / 背书墙
   丰富度靠「信息块 + 图形 + 数据」，不靠加卡片 */

const NAV = [
  { id: 'overview', label: '集团' },
  { id: 'platform', label: '业务' },
  { id: 'system', label: '系统' },
  { id: 'metrics', label: '数据' },
  { id: 'clients', label: '客户' },
  { id: 'contact', label: '联系' },
]

/* ——— 组织人力分布：真实数据 ——— */
function topOrgOf(leafId: string): string {
  let cur = leafId
  while (ORG_PARENT_MAP[cur] && ORG_PARENT_MAP[cur] !== ORG_ROOT_ID) {
    cur = ORG_PARENT_MAP[cur] as string
  }
  return cur
}

const TOP_ORGS = ORG_TREE[0]?.children ?? []
const ORG_DIST = TOP_ORGS.map((o) => ({
  id: o.id,
  name: o.name,
  n: ORG_PEOPLE.filter((p) => topOrgOf(p.orgId) === o.id).length,
})).sort((a, b) => b.n - a.n)
const ORG_MAX = Math.max(1, ...ORG_DIST.map((o) => o.n))
const ORG_TOTAL = ORG_DIST.reduce((s, o) => s + o.n, 0)
const ORG_COVERED = ORG_DIST.filter((o) => o.n > 0).length

const FACTS = [
  { k: '成立时间', v: '2016 年' },
  { k: '总部地址', v: '上海市闵行区' },
  { k: '办公载体', v: '星辉科技大厦' },
  { k: '在职员工', v: `${ORG_PEOPLE.length} 人` },
  { k: '一级组织', v: `${TOP_ORGS.length} 个` },
  { k: '会议室', v: '16 间' },
]

/* ============ 系统界面示意（CSS 绘制的高保真缩略，不是占位块） ============ */
function MiniUI({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="cs-ui">
      <div className="cs-ui__bar">
        <i />
        <i />
        <i />
        <span>{title}</span>
      </div>
      <div className="cs-ui__body">{children}</div>
    </div>
  )
}

/** 组织树（缩进 + 连接线 + 人数） */
function UITree() {
  return (
    <MiniUI title="人员组织">
      <div className="cs-tree">
        <div className="cs-tree__row lv0">
          <i />
          <span>星辉科技集团</span>
          <em>{ORG_PEOPLE.length}</em>
        </div>
        {ORG_DIST.slice(0, 4).map((o) => (
          <div className="cs-tree__row lv1" key={o.id}>
            <i />
            <span>{o.name}</span>
            <em>{o.n}</em>
          </div>
        ))}
        <div className="cs-tree__row lv2">
          <i />
          <span>后端研发组</span>
          <em>3</em>
        </div>
      </div>
    </MiniUI>
  )
}

/** 会议室卡片（状态点 + 时段条） */
function UIRooms() {
  return (
    <MiniUI title="会议室预订 · 周三">
      <div className="cs-rooms">
        {[
          { n: '301 会议室', s: 'idle', t: '空闲' },
          { n: '302 洽谈室', s: 'busy', t: '使用中' },
          { n: '401 培训室', s: 'soon', t: '即将开始' },
        ].map((r) => (
          <div className="cs-room" key={r.n}>
            <span className="cs-room__n">{r.n}</span>
            <span className="cs-room__track">
              <i className={'is-' + r.s} style={{ width: r.s === 'busy' ? '78%' : r.s === 'soon' ? '46%' : '22%' }} />
            </span>
            <span className={'cs-room__s is-' + r.s}>{r.t}</span>
          </div>
        ))}
        <div className="cs-slots">
          {['09', '10', '11', '13', '14', '15', '16', '17'].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      </div>
    </MiniUI>
  )
}

/** 制度与文档列表（行 + 状态） */
function UIList() {
  return (
    <MiniUI title="制度管理">
      {[
        { t: '员工考勤管理办法', s: '已发布' },
        { t: '会议室使用规范', s: '评审中' },
        { t: '信息安全管理制度', s: '已发布' },
        { t: '差旅报销标准', s: '起草中' },
      ].map((d) => (
        <div className="cs-li" key={d.t}>
          <i />
          <span>{d.t}</span>
          <em className={'is-' + (d.s === '已发布' ? 'ok' : d.s === '评审中' ? 'mid' : 'draft')}>{d.s}</em>
        </div>
      ))}
    </MiniUI>
  )
}

/** 数据看板（条形 + 折线） */
function UIChart() {
  const bars = [42, 68, 55, 88, 61, 74, 49]
  return (
    <MiniUI title="数据看板">
      <div className="cs-chartMini">
        {bars.map((b, i) => (
          <span key={i} style={{ height: b + '%' }} />
        ))}
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden>
          <path d="M0 46 L28 34 L57 40 L86 20 L114 30 L143 16 L171 26 L200 12" />
        </svg>
      </div>
      <div className="cs-chartMini__axis">
        <span>1 月</span>
        <span>2 月</span>
        <span>3 月</span>
        <span>4 月</span>
        <span>5 月</span>
        <span>6 月</span>
        <span>7 月</span>
      </div>
    </MiniUI>
  )
}

/** 楼宇线框 */
function UIWire() {
  return (
    <MiniUI title="楼宇 3D">
      <div className="cs-wire">
        <svg viewBox="0 0 200 110" aria-hidden>
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M40 96V34l60-22 60 22v62z" />
            <path d="M40 34l60 22 60-22M100 56v40" />
            <path d="M56 44v46M144 44v46M100 24v26" />
            <path d="M68 62h14M118 62h14M68 78h14M118 78h14" />
          </g>
        </svg>
        <span className="cs-wire__cap">星辉科技大厦 · 4 层 16 间</span>
      </div>
    </MiniUI>
  )
}

/** 制度检索（搜索框 + 分类 + 结果） */
function UISearch() {
  return (
    <MiniUI title="制度前台">
      <div className="cs-search">
        <span className="cs-search__input">搜索制度、条款关键词</span>
      </div>
      <div className="cs-search__tags">
        {['人事', '财务', '行政', '安全', '考勤'].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="cs-hit">
        <i />
        员工考勤管理办法
        <em>3 月修订</em>
      </div>
      <div className="cs-hit">
        <i />
        会议室使用规范
        <em>已公开</em>
      </div>
    </MiniUI>
  )
}

/** 文档目录（文件夹 + 数量） */
function UIArchive() {
  return (
    <MiniUI title="企业文档">
      {[
        { n: '制度文件', c: 128 },
        { n: '会议纪要', c: 86 },
        { n: '技术文档', c: 214 },
        { n: '培训资料', c: 45 },
      ].map((f) => (
        <div className="cs-folder" key={f.n}>
          <svg viewBox="0 0 20 16" aria-hidden>
            <path d="M1 2.5h6l1.6 2H19v9H1z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span>{f.n}</span>
          <em>{f.c}</em>
        </div>
      ))}
    </MiniUI>
  )
}

/** 人物画像（头像 + 属性条） */
function UIPersona() {
  return (
    <MiniUI title="人物画像">
      <div className="cs-persona">
        <span className="cs-persona__ava">李</span>
        <span className="cs-persona__meta">
          <b>李敏</b>
          <em>运营中心 · 高级专员</em>
        </span>
      </div>
      {[
        { k: '专业度', v: 82 },
        { k: '协作度', v: 74 },
        { k: '稳定性', v: 91 },
      ].map((b) => (
        <div className="cs-pbar" key={b.k}>
          <span>{b.k}</span>
          <span className="cs-pbar__tk">
            <i style={{ width: b.v + '%' }} />
          </span>
          <em>{b.v}</em>
        </div>
      ))}
    </MiniUI>
  )
}

const UI_KIND: Record<string, ReactNode> = {
  org: <UITree />,
  meeting: <UIRooms />,
  system: <UIList />,
  policy: <UISearch />,
  docs: <UIArchive />,
  bigscreen: <UIChart />,
  persona: <UIPersona />,
  building: <UIWire />,
}

/* ——— 业务线（图标 + 指标 + 界面示意） ——— */
const PLATFORM = [
  {
    name: '组织与人事',
    desc: '组织架构、人员档案、权限与调配收在一棵树上，跨部门协作不必再问"这个人归谁管"。',
    metric: `${TOP_ORGS.length} 个组织 · ${ORG_PEOPLE.length} 份档案`,
    ui: <UITree />,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="12" y="3.5" width="8" height="6" rx="1.2" />
        <rect x="3" y="22.5" width="8" height="6" rx="1.2" />
        <rect x="21" y="22.5" width="8" height="6" rx="1.2" />
        <path d="M16 9.5v5M7 22.5v-4h18v4" />
      </svg>
    ),
  },
  {
    name: '智能办公空间',
    desc: '会议室按周课表排布、楼宇三维可下钻、访客与工位统一登记，办公资源随取随用。',
    metric: '16 间会议室 · 1 栋楼宇',
    ui: <UIRooms />,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <rect x="4" y="6" width="24" height="20" rx="1.6" />
        <path d="M4 16h24M16 6v20" />
      </svg>
    ),
  },
  {
    name: '制度与知识',
    desc: '制度从起草、评审到发布全流程留痕，企业文档与知识库集中管理，版本可追溯。',
    metric: '起草 → 评审 → 发布',
    ui: <UIList />,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M7 4.5h13l5 5v18H7z" />
        <path d="M20 4.5v5h5" />
        <path d="M11 15h10M11 19.5h7" />
      </svg>
    ),
  },
  {
    name: '数据与决策',
    desc: '人员分布、经营看板与三维可视化大屏，让管理层在同一处看清集团的运行状态。',
    metric: '4 块看板 · 实时刷新',
    ui: <UIChart />,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M5 27V9M5 27h22" />
        <path d="M10 27v-7M16 27v-12M22 27v-5" />
        <path d="M9 12l6-4 5 3 7-6" />
      </svg>
    ),
  },
]

/* ——— 系统全景：8 个真实应用 ——— */
const APP_IDS = ['org', 'system', 'policy', 'meeting', 'docs', 'bigscreen', 'persona', 'building']
const APP_LIST = apps.filter((a) => APP_IDS.includes(a.id))

const STACK = ['React 18', 'TypeScript', 'Vite', 'WebGL', 'Three.js', 'ECharts', 'Ant Design', 'Spring Boot', 'MySQL', 'Redis']

/* ——— 数据在跑：三个指标 ——— */
const METRICS = [
  { k: '在编员工', v: ORG_TOTAL, u: '人', d: `覆盖 ${ORG_COVERED} 个一级组织` },
  { k: '会议室', v: 16, u: '间', d: '可约时段 09:00 - 18:00' },
  { k: '系统应用', v: APP_LIST.length, u: '个', d: '组织 / 空间 / 制度 / 数据四线' },
]

/* ——— 客户与背书 ——— */
const CLIENTS = ['华远制造', '恒信物流', '北岸医疗', '青梧教育', '长风能源', '明州建设']
const QUOTES = [
  {
    q: '原来查一个人的部门和电话要翻三张表，现在组织树点两下就到。跨部门拉会的时间省了一半。',
    n: '运营中心 · 李敏',
    r: '日常使用者',
  },
  {
    q: '制度从起草到发布要过五道审核，以前靠邮件追。现在每一步谁批的、什么时候批的都留痕。',
    n: '内审部 · 罗静',
    r: '流程负责人',
  },
]
const HONORS = [
  { y: '2025', t: '上海市专精特新企业' },
  { y: '2024', t: '企业数字化服务优秀案例' },
  { y: '2023', t: 'ISO 27001 信息安全管理认证' },
]

/* ——— 历程与动态 ——— */
const MILESTONES = [
  { y: '2016', t: '集团成立', d: '在上海设立总部，聚焦企业数字化协同。' },
  { y: '2019', t: '协同平台上线', d: '组织人事与办公空间两条业务线合入同一平台。' },
  { y: '2022', t: '数字总部建成', d: '星辉科技大厦落成，16 间会议室接入统一预订。' },
  { y: '2025', t: '四线业务成型', d: '组织、空间、制度、数据四条业务线全部上线运行。' },
]
const NEWS = [
  { d: '2026-08', t: '数字总部上线访客管理', s: '来访登记、被访人确认与离场归档收进同一条流程。' },
  { d: '2026-05', t: '会议室预订接入周课表视图', s: '按周一到周五铺开时段，冲突时段自动置灰。' },
  { d: '2026-02', t: '企业文档中心开放全员检索', s: '全文检索覆盖制度、文档与知识库三类内容。' },
]

export default function CompanySite() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll('[data-reveal]')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    root
      .querySelectorAll('.cs-hero__copy, .cs-hero__meta, .cs-sec__inner, .cs-contact__copy')
      .forEach((group) => {
        group.querySelectorAll('[data-reveal]').forEach((el, i) => {
          ;(el as HTMLElement).style.transitionDelay = i * 60 + 'ms'
        })
      })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const goTo = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="cs-root" ref={rootRef}>
      <header className={'cs-nav' + (scrolled ? ' is-solid' : '')}>
        <button type="button" className="cs-nav__brand" onClick={() => goTo('top')}>
          星辉科技集团
        </button>
        <nav className="cs-nav__links" aria-label="官网导航">
          {NAV.map((n) => (
            <button key={n.id} type="button" className="cs-nav__link" onClick={() => goTo(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <Link className="cs-ghost cs-ghost--sm" to="/">
          进入数字总部
        </Link>
      </header>

      {/* 第一幕 · Hero */}
      <section className="cs-hero" id="top">
        <div className="cs-hero__field" aria-hidden>
          <FlowField mode="dark" hue={190} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="cs-hero__veil" aria-hidden />
        <div className="cs-hero__copy">
          <span className="cs-label" data-reveal>
            XINGHUI TECHNOLOGY GROUP
          </span>
          <h1 className="cs-hero__title" data-reveal>
            一座楼，
            <br />
            装着整个集团。
          </h1>
          <p className="cs-hero__sub" data-reveal>
            星辉科技集团把组织、协作与决策收进同一个数字总部。{TOP_ORGS.length} 个一级组织、{ORG_PEOPLE.length} 名员工、16 间会议室，在同一套系统里运转。
          </p>
          <div className="cs-actions" data-reveal>
            <Link className="cs-ghost" to="/">
              进入数字总部
            </Link>
            <button type="button" className="cs-textlink" onClick={() => goTo('system')}>
              看看系统长什么样
            </button>
          </div>
        </div>
        <dl className="cs-hero__meta">
          <div className="cs-hero__cell">
            <dt>成立于</dt>
            <dd>2016 年</dd>
          </div>
          <div className="cs-hero__cell">
            <dt>在职员工</dt>
            <dd>{ORG_PEOPLE.length} 人</dd>
          </div>
          <div className="cs-hero__cell">
            <dt>一级组织</dt>
            <dd>{TOP_ORGS.length} 个</dd>
          </div>
          <div className="cs-hero__cell">
            <dt>业务线</dt>
            <dd>4 条</dd>
          </div>
        </dl>
      </section>

      {/* 第二幕 · 集团概览 */}
      <section className="cs-sec" id="overview">
        <div className="cs-sec__inner">
          <div className="cs-split">
            <div className="cs-split__text">
              <h2 className="cs-h2" data-reveal>
                集团的脸，和它的骨架
              </h2>
              <p className="cs-lead" data-reveal>
                星辉科技集团是一家以企业数字化协同为主业的科技公司，总部设在星辉科技大厦。
                我们不卖软件许可，而是把一家集团每天真正要办的事收进同一处入口：谁来管、在哪开会、按哪条制度、看什么数据。
              </p>
              <dl className="cs-facts" data-reveal>
                {FACTS.map((f) => (
                  <div className="cs-fact" key={f.k}>
                    <dt>{f.k}</dt>
                    <dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="cs-chart" data-reveal>
              <div className="cs-chart__head">
                <span className="cs-chart__title">一级组织人力分布</span>
                <span className="cs-chart__note">
                  {ORG_COVERED} / {TOP_ORGS.length} 个组织在编 · 合计 {ORG_TOTAL} 人
                </span>
              </div>
              <div className="cs-chart__body">
                {ORG_DIST.map((o) => (
                  <div className="cs-bar" key={o.id}>
                    <span className="cs-bar__n">{o.name}</span>
                    <span className="cs-bar__track">
                      <i style={{ width: `${(o.n / ORG_MAX) * 100}%` }} />
                    </span>
                    <span className="cs-bar__v">{o.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 第三幕 · 业务线：文 + 界面示意（左右交替） */}
      <section className="cs-sec cs-sec--plain" id="platform">
        <div className="cs-sec__inner">
          <h2 className="cs-h2" data-reveal>
            四条业务线，各有各的界面
          </h2>
          <ul className="cs-lanes">
            {PLATFORM.map((p, i) => (
              <li className={'cs-lane' + (i % 2 ? ' is-flip' : '')} key={p.name} data-reveal>
                <div className="cs-lane__copy">
                  <span className="cs-lane__ico">{p.icon}</span>
                  <span className="cs-lane__idx">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="cs-lane__name">{p.name}</h3>
                  <p className="cs-lane__desc">{p.desc}</p>
                  <span className="cs-lane__metric">{p.metric}</span>
                </div>
                <div className="cs-lane__shot">{p.ui}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 第四幕 · 系统全景：8 个应用的界面缩略 */}
      <section className="cs-sec" id="system">
        <div className="cs-sec__inner">
          <h2 className="cs-h2" data-reveal>
            八个应用，就是八个界面
          </h2>
          <p className="cs-lead" data-reveal>
            每个应用都是一个能独立打开的工作台，界面与数据来自同一套系统。
          </p>
          <ul className="cs-screens">
            {APP_LIST.map((a) => (
              <li className="cs-screen" key={a.id} data-reveal>
                <div className="cs-screen__shot">{UI_KIND[a.id] ?? <UIList />}</div>
                <div className="cs-screen__cap">
                  <span className="cs-screen__ico">{a.icon}</span>
                  <span className="cs-screen__name">{a.name}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="cs-stack" data-reveal>
            <span className="cs-stack__label">技术栈</span>
            <ul className="cs-stack__list">
              {STACK.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 第五幕 · 数据在跑 */}
      <section className="cs-sec cs-sec--scene" id="metrics">
        <div className="cs-sec__scene" aria-hidden>
          <FlowField mode="dark" hue={172} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="cs-sec__sceneVeil" aria-hidden />
        <div className="cs-sec__inner">
          <h2 className="cs-h2" data-reveal>
            系统里跑着这些数
          </h2>
          <div className="cs-metrics" data-reveal>
            {METRICS.map((m) => (
              <div className="cs-metric" key={m.k}>
                <div className="cs-metric__v">
                  {m.v}
                  <span className="cs-metric__u">{m.u}</span>
                </div>
                <div className="cs-metric__k">{m.k}</div>
                <div className="cs-metric__d">{m.d}</div>
              </div>
            ))}
          </div>
          <div className="cs-mix" data-reveal>
            <div className="cs-mix__item">
              <span className="cs-mix__lb">组织人力分布</span>
              <div className="cs-mix__bars">
                {ORG_DIST.slice(0, 8).map((o) => (
                  <span key={o.id} title={`${o.name} ${o.n}`}>
                    <i style={{ height: `${(o.n / ORG_MAX) * 100}%` }} />
                  </span>
                ))}
              </div>
            </div>
            <div className="cs-mix__item">
              <span className="cs-mix__lb">会议室状态</span>
              <div className="cs-mix__ring">
                <svg viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(240,245,255,.12)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="var(--cs-cold)"
                    strokeWidth="10"
                    strokeDasharray="150 239"
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                </svg>
                <b>10 / 16</b>
                <em>当前空闲</em>
              </div>
            </div>
            <div className="cs-mix__item">
              <span className="cs-mix__lb">近 7 月预约量</span>
              <div className="cs-mix__bars is-line">
                {[42, 68, 55, 88, 61, 74, 49].map((b, i) => (
                  <span key={i}>
                    <i style={{ height: b + '%' }} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 第六幕 · 客户与背书 */}
      <section className="cs-sec" id="clients">
        <div className="cs-sec__inner">
          <h2 className="cs-h2" data-reveal>
            谁在用这套系统
          </h2>
          <ul className="cs-clients" data-reveal>
            {CLIENTS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="cs-quotes">
            {QUOTES.map((q) => (
              <blockquote className="cs-quote" key={q.n} data-reveal>
                <p>{q.q}</p>
                <footer>
                  <span>{q.n}</span>
                  <em>{q.r}</em>
                </footer>
              </blockquote>
            ))}
          </div>
          <ul className="cs-honors" data-reveal>
            {HONORS.map((h) => (
              <li key={h.t}>
                <span>{h.y}</span>
                {h.t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 第七幕 · 历程与动态 */}
      <section className="cs-sec cs-sec--plain" id="milestones">
        <div className="cs-sec__inner">
          <div className="cs-split">
            <div className="cs-split__text">
              <h2 className="cs-h2" data-reveal>
                从一间办公室到一座总部
              </h2>
              <ol className="cs-time">
                {MILESTONES.map((m) => (
                  <li className="cs-time__item" key={m.y} data-reveal>
                    <span className="cs-time__y">{m.y}</span>
                    <span className="cs-time__t">{m.t}</span>
                    <span className="cs-time__d">{m.d}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="cs-split__text">
              <h2 className="cs-h2" data-reveal>
                最近的更新
              </h2>
              <ul className="cs-news">
                {NEWS.map((n) => (
                  <li className="cs-news__item" key={n.t} data-reveal>
                    <span className="cs-news__d">{n.d}</span>
                    <span className="cs-news__body">
                      <span className="cs-news__t">{n.t}</span>
                      <span className="cs-news__s">{n.s}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 第八幕 · 联系 */}
      <section className="cs-contact" id="contact">
        <div className="cs-contact__field" aria-hidden>
          <FlowField mode="dark" hue={206} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="cs-contact__veil" aria-hidden />
        <div className="cs-contact__copy">
          <span className="cs-label" data-reveal>
            CONTACT
          </span>
          <h2 className="cs-contact__title" data-reveal>
            想看看数字总部长什么样？
          </h2>
          <p className="cs-contact__sub" data-reveal>
            留一个工作日的时间，我们把组织、空间、制度与数据四条线走一遍。
          </p>
          <div className="cs-contact__acts" data-reveal>
            <a className="cs-ghost" href="mailto:contact@xinghui.example">
              预约一次演示
            </a>
            <a className="cs-textlink" href="tel:02162880000">
              021-62888000
            </a>
          </div>
          <dl className="cs-contact__meta" data-reveal>
            <div>
              <dt>总部地址</dt>
              <dd>上海市闵行区星辉科技大厦</dd>
            </div>
            <div>
              <dt>商务合作</dt>
              <dd>contact@xinghui.example</dd>
            </div>
            <div>
              <dt>工作时间</dt>
              <dd>周一至周五 09:00 - 18:00</dd>
            </div>
          </dl>
        </div>
      </section>

      <footer className="cs-foot">
        <span>星辉科技集团 · 数字总部</span>
        <span className="cs-foot__egg">本站的 3D 画面由 WebGL 实时生成，不是视频。</span>
        <span>© 2026 Xinghui Technology Group</span>
      </footer>
    </div>
  )
}
