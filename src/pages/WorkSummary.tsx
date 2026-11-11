import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Layout, Menu, Breadcrumb, Avatar, Button, Space, Table, Tag, Input, Card, Badge, Modal } from 'antd'
import type { MenuProps, TableColumnsType } from 'antd'
import {
  FileTextOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  CheckSquareOutlined,
  CodeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  PictureOutlined,
} from '@ant-design/icons'
// 复用脚手架的通用后台布局与专属样式，保证“样式一模一样”
import './orgCenter.css'
import './scaffold.css'
import './workSummary.css'

const { Header, Content } = Layout

type WsMenuKey = 'prd' | 'func' | 'data' | 'checklist' | 'dev'

const menuItems: MenuProps['items'] = [
  { key: 'prd', icon: <FileTextOutlined />, label: 'PRD文档' },
  { key: 'func', icon: <SafetyCertificateOutlined />, label: '功能权限' },
  { key: 'data', icon: <DatabaseOutlined />, label: '数据权限' },
  { key: 'checklist', icon: <CheckSquareOutlined />, label: '走查清单' },
  { key: 'dev', icon: <CodeOutlined />, label: '开发文档' },
]

const menuLabelMap: Record<WsMenuKey, string[]> = {
  prd: ['PRD文档'],
  func: ['功能权限'],
  data: ['数据权限'],
  checklist: ['走查清单'],
  dev: ['开发文档'],
}

/* ============================ 文档型内容渲染 ============================ */
type Block =
  | { t: 'h3'; v: string }
  | { t: 'p'; v: string }
  | { t: 'ul'; v: string[] }
  | { t: 'ol'; v: string[] }
  | { t: 'quote'; v: string }
  | { t: 'code'; v: string }
  | { t: 'table'; head: string[]; rows: string[][] }

function renderBlock(b: Block, i: number): ReactNode {
  switch (b.t) {
    case 'h3':
      return <h3 key={i} className="ws-doc-h3">{b.v}</h3>
    case 'p':
      return <p key={i} className="ws-doc-p">{b.v}</p>
    case 'ul':
      return <ul key={i} className="ws-doc-ul">{b.v.map((x, j) => <li key={j}>{x}</li>)}</ul>
    case 'ol':
      return <ol key={i} className="ws-doc-ol">{b.v.map((x, j) => <li key={j}>{x}</li>)}</ol>
    case 'quote':
      return <blockquote key={i} className="ws-doc-quote">{b.v}</blockquote>
    case 'code':
      return <pre key={i} className="ws-doc-code"><code>{b.v}</code></pre>
    case 'table':
      return (
        <div key={i} className="ws-doc-table-wrap">
          <table className="ws-doc-table">
            <thead>
              <tr>{b.head.map((h, j) => <th key={j}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r, j) => (
                <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

function DocView({ updatedAt, sections }: { updatedAt: string; sections: { title: string; blocks: Block[] }[] }) {
  return (
    <div className="ws-doc">
      <div className="ws-doc-meta">最后更新：{updatedAt}　·　版本 v1.2</div>
      {sections.map((s) => (
        <section key={s.title} className="ws-doc-sec">
          <h2 className="ws-doc-h2">{s.title}</h2>
          {s.blocks.map((b, i) => renderBlock(b, i))}
        </section>
      ))}
    </div>
  )
}

/* ============================ PRD 文档 ============================ */
function PrdView() {
  const sections = useMemo(
    () => [
      {
        title: '一、项目背景与目标',
        blocks: [
          { t: 'p', v: '本系统面向高校行政与教学管理场景，将原本分散在多个独立系统中的人事、考勤、制度、审批等能力统一收敛到一个门户中，解决“系统多、入口散、数据不通”的痛点。' },
          { t: 'p', v: '核心目标：统一入口提升使用效率、沉淀制度知识、打通跨系统数据、为后续智能问答与数据大屏提供统一的数据底座。' },
          { t: 'quote', v: '衡量成功的关键指标：新员工从录入到可用账号的耗时 ≤ 3 分钟；制度发布到全员可见 ≤ 5 分钟；90% 的日常操作可在 2 次点击内完成。' },
        ] as Block[],
      },
      {
        title: '二、用户角色',
        blocks: [
          { t: 'ul', v: ['超级管理员：拥有全部模块的最高权限，可管理配置与账号。', '学院管理员：管理学院内师生数据与考勤规则。', '教师：管理本人课程、查看所授班级学生信息。', '学生：查看个人信息、选课与校园服务。', '普通员工：使用考勤、订餐、审批等自助服务。'] } as Block,
        ] as Block[],
      },
      {
        title: '三、功能概述',
        blocks: [
          { t: 'ul', v: ['人员组织：组织架构、教师、学生、用户的统一维护与同步。', '系统设置：角色、菜单、密钥、令牌、操作日志等后台能力。', '制度管理：制度起草、评审、发布与公开门户。', '工作台应用：考勤、订餐、会议室、审批、文档等高频场景。', '智能问答：基于知识库的多轮问答助手。'] } as Block,
        ] as Block[],
      },
      {
        title: '四、核心流程',
        blocks: [
          { t: 'ol', v: ['入职流程：录入教师/学生 → 自动同步创建用户 → 分配角色 → 开通账号。', '审批流程：发起申请 → 按规则路由审批人 → 通过/驳回 → 回写业务系统。', '制度发布流程：起草 → 评审 → 超级管理员发布 → 前台门户可见。'] } as Block,
        ] as Block[],
      },
      {
        title: '五、非功能性需求',
        blocks: [
          { t: 'ul', v: ['性能：万级数据列表首屏 ≤ 1.5s；关键接口 P95 ≤ 300ms。', '安全：敏感信息（手机/邮箱/薪资）列表脱敏；越权访问一律拦截。', '兼容性：Chrome / Edge 最新两版；移动端 ≤ 520px 无横向滚动。'] } as Block,
        ] as Block[],
      },
      {
        title: '六、里程碑',
        blocks: [
          {
            t: 'table',
            head: ['阶段', '时间', '交付物'],
            rows: [
              ['M1 基础框架', '2026-09', '门户 + 应用中心 + 脚手架'],
              ['M2 核心模块', '2026-10', '用户/令牌/制度/智能问答'],
              ['M3 数据打通', '2026-11', '数据大屏 + 工作总结闭环'],
            ],
          } as Block,
        ] as Block[],
      },
    ],
    [],
  )
  return <DocView updatedAt="2026-11-08 14:20" sections={sections} />
}

/* ============================ 开发文档（左目录 + 右内容） ============================ */
type Kv = { k: string; v: string }

interface EnvDoc {
  key: string
  title: string
  db: Kv[]
  nacos: Kv[]
  third: Kv[]
  server: Kv[]
  deploy: Kv[]
}

const ENVS: EnvDoc[] = [
  {
    key: 'dev',
    title: '开发环境',
    db: [
      { k: '数据库地址', v: '192.168.10.21:3306' },
      { k: '数据库名', v: 'workplace_dev' },
      { k: '账号', v: 'dev_rw' },
      { k: '密码', v: '已加密存储（Dev@2026）' },
      { k: '版本', v: 'MySQL 8.0.36' },
    ],
    nacos: [
      { k: 'Nacos 地址', v: 'http://192.168.10.30:8848/nacos' },
      { k: '命名空间', v: 'dev' },
      { k: '分组', v: 'WORKPLACE_GROUP' },
      { k: '配置 ID', v: 'workplace-dev.yaml' },
    ],
    third: [
      { k: '企业微信', v: '审批 / 消息推送（测试企业 corpid）' },
      { k: '阿里云 OSS', v: '头像与附件存储（开发桶）' },
      { k: '短信', v: '阿里云短信（测试模板）' },
    ],
    server: [
      { k: '内网 IP', v: '192.168.10.21' },
      { k: '操作系统', v: 'CentOS 7.9' },
      { k: '配置', v: '8C 16G' },
      { k: '用途', v: '开发综合服务器' },
    ],
    deploy: [
      { k: '前端目录', v: '/data/apps/workplace-web' },
      { k: '后端目录', v: '/data/apps/workplace-backend' },
      { k: '日志目录', v: '/data/logs/workplace' },
      { k: '启动命令', v: 'sh deploy.sh dev' },
    ],
  },
  {
    key: 'test',
    title: '测试环境',
    db: [
      { k: '数据库地址', v: '10.20.30.11:3306' },
      { k: '数据库名', v: 'workplace_test' },
      { k: '账号', v: 'test_rw' },
      { k: '密码', v: '已加密存储（Test@2026）' },
      { k: '版本', v: 'MySQL 8.0.36' },
    ],
    nacos: [
      { k: 'Nacos 地址', v: 'http://10.20.30.20:8848/nacos' },
      { k: '命名空间', v: 'test' },
      { k: '分组', v: 'TEST_GROUP' },
      { k: '配置 ID', v: 'workplace-test.yaml' },
    ],
    third: [
      { k: '企业微信', v: '审批 / 消息推送（测试企业）' },
      { k: '阿里云 OSS', v: '头像与附件存储（测试桶）' },
      { k: '短信', v: '阿里云短信（测试模板）' },
    ],
    server: [
      { k: '内网 IP', v: '10.20.30.11' },
      { k: '操作系统', v: 'CentOS 7.9' },
      { k: '配置', v: '8C 16G' },
      { k: '用途', v: '测试服务器' },
    ],
    deploy: [
      { k: '前端目录', v: '/data/apps/workplace-web' },
      { k: '后端目录', v: '/data/apps/workplace-backend' },
      { k: '日志目录', v: '/data/logs/workplace' },
      { k: '启动命令', v: 'sh deploy.sh test' },
    ],
  },
  {
    key: 'prod',
    title: '正式环境',
    db: [
      { k: '数据库地址', v: 'rm-bp1****.mysql.rds.aliyuncs.com:3306' },
      { k: '数据库名', v: 'workplace_prod' },
      { k: '账号', v: 'prod_rw' },
      { k: '密码', v: '已加密存储（主备分离）' },
      { k: '版本', v: 'RDS MySQL 8.0 高可用版（主备）' },
    ],
    nacos: [
      { k: 'Nacos 地址', v: 'http://nacos.internal:8848/nacos' },
      { k: '命名空间', v: 'prod' },
      { k: '分组', v: 'PROD_GROUP' },
      { k: '配置 ID', v: 'workplace-prod.yaml' },
    ],
    third: [
      { k: '企业微信', v: '审批 / 消息推送（正式企业）' },
      { k: '阿里云 OSS', v: '正式桶 + CDN 加速' },
      { k: '短信', v: '阿里云短信（正式签名）' },
      { k: 'Cloudflare', v: 'Pages / Workers 托管与加速' },
    ],
    server: [
      { k: '公网 IP', v: '49.233.240.214（以及多节点 ECS）' },
      { k: '操作系统', v: 'Ubuntu 22.04' },
      { k: '配置', v: '4C 8G × 2（负载均衡）' },
      { k: '用途', v: '生产环境集群' },
    ],
    deploy: [
      { k: '前端目录', v: '/opt/workplace/web' },
      { k: '后端目录', v: '/opt/workplace/backend' },
      { k: '日志目录', v: '/var/log/workplace' },
      { k: '启动命令', v: 'sh deploy.sh prod（CF Pages 自动部署）' },
    ],
  },
]

/* 仓库按前后端拆分 */
const REPOS = [
  { name: '前端仓库', url: 'https://github.com/niuyangyang/workplace-system-web' },
  { name: '后端仓库', url: 'https://github.com/niuyangyang/workplace-system-backend' },
]

/* 分支模型「知识图谱」：应用 → 前端/后端 仓库 → dev / test / master 三分支 */
const APP_NAME = '职场综合应用系统'

const GC = {
  dev: '#12b886',
  test: '#f59e0b',
  master: '#3b5bff',
  feat: '#8b5cf6',
  merge: '#94a3b8',
  ink: '#1f2733',
  sub: '#7b8499',
}

function EnvChip({ x, y, color, text }: { x: number; y: number; color: string; text: string }) {
  return (
    <g>
      <rect x={x} y={y - 13} width={100} height={26} rx={13} fill={color} opacity={0.12} />
      <circle cx={x + 14} cy={y} r={4} fill={color} />
      <text x={x + 26} y={y + 4} fontSize={11} fontWeight={600} fill={color}>
        {text}
      </text>
    </g>
  )
}

function RepoFlow({ name, url, top }: { name: string; url: string; top: number }) {
  const devY = top + 30
  const testY = top + 90
  const masterY = top + 150
  const x0 = 130
  const x1 = 742
  const featXa = 250
  const featXb = 440
  const m1X = 545
  const m2X = 675
  return (
    <g>
      {/* 仓库标签 */}
      <rect x={18} y={top + 68} width={98} height={48} rx={9} fill="#f4f7fb" stroke="#dbe3ef" />
      <text x={67} y={top + 90} textAnchor="middle" fontSize={13} fontWeight={700} fill={GC.ink}>
        {name}
      </text>
      <text x={67} y={top + 107} textAnchor="middle" fontSize={9} fill={GC.sub}>
        {url}
      </text>

      {/* 三条主分支线 */}
      <line x1={x0} y1={devY} x2={x1} y2={devY} stroke={GC.dev} strokeWidth={3} strokeLinecap="round" />
      <line x1={x0} y1={testY} x2={x1} y2={testY} stroke={GC.test} strokeWidth={3} strokeLinecap="round" />
      <line x1={x0} y1={masterY} x2={x1} y2={masterY} stroke={GC.master} strokeWidth={3} strokeLinecap="round" />

      {/* feature 功能分支：从 dev 拉取 → 合回 dev */}
      <path
        d={`M${featXa},${devY} C${featXa + 50},${devY - 46} ${featXb - 50},${devY - 46} ${featXb},${devY}`}
        fill="none"
        stroke={GC.feat}
        strokeWidth={2.2}
        strokeDasharray="5 4"
      />
      <circle cx={featXa} cy={devY} r={4.5} fill={GC.dev} />
      <circle cx={featXb} cy={devY} r={4.5} fill={GC.dev} />
      <text x={(featXa + featXb) / 2} y={devY - 52} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={GC.feat}>
        feature/* 从 dev 拉取
      </text>

      {/* dev → test 合并发布测试 */}
      <path
        d={`M${m1X},${devY} C${m1X + 12},${devY + 30} ${m1X + 12},${testY - 30} ${m1X + 18},${testY}`}
        fill="none"
        stroke={GC.merge}
        strokeWidth={2}
        markerEnd="url(#ws-arrow)"
      />
      <text x={m1X + 26} y={(devY + testY) / 2 - 2} fontSize={9.5} fill={GC.sub}>
        发布测试
      </text>

      {/* test → master 合并发布正式 */}
      <path
        d={`M${m2X},${testY} C${m2X + 12},${testY + 30} ${m2X + 12},${masterY - 30} ${m2X + 18},${masterY}`}
        fill="none"
        stroke={GC.merge}
        strokeWidth={2}
        markerEnd="url(#ws-arrow)"
      />
      <text x={m2X + 26} y={(testY + masterY) / 2 - 2} fontSize={9.5} fill={GC.sub}>
        发布正式
      </text>

      {/* 右侧环境标签 */}
      <EnvChip x={x1 + 8} y={devY} color={GC.dev} text="开发环境" />
      <EnvChip x={x1 + 8} y={testY} color={GC.test} text="测试环境" />
      <EnvChip x={x1 + 8} y={masterY} color={GC.master} text="生产环境" />
    </g>
  )
}

function BranchGraph() {
  return (
    <div className="ws-graph-wrap">
      <svg className="ws-branch-graph" viewBox="0 0 880 510" role="img" aria-label="分支模型知识图谱">
        <defs>
          <marker id="ws-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L7,3 L0,6 Z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* 应用名称节点 */}
        <rect x={290} y={14} width={300} height={40} rx={11} fill="#1f2733" />
        <text x={440} y={39} textAnchor="middle" fontSize={15} fontWeight={700} fill="#fff">
          {APP_NAME}
        </text>
        {/* 应用 → 前端 / 后端 仓库（左侧树状连线，避让分支区） */}
        <path d="M290,34 L67,34 L67,368" stroke="#c9d6ee" strokeWidth={1.6} fill="none" />
        <circle cx={67} cy={160} r={4.5} fill="#3b5bff" />
        <circle cx={67} cy={368} r={4.5} fill="#3b5bff" />

        <RepoFlow name="前端仓库" url="workplace-system-web" top={92} />
        <RepoFlow name="后端仓库" url="workplace-system-backend" top={300} />

        {/* 图例 */}
        <g transform="translate(18,482)">
          <rect x={0} y={0} width={14} height={14} rx={3} fill={GC.dev} />
          <text x={20} y={11} fontSize={10.5} fill="#5b647a">
            dev 开发环境
          </text>
          <rect x={130} y={0} width={14} height={14} rx={3} fill={GC.test} />
          <text x={150} y={11} fontSize={10.5} fill="#5b647a">
            test 测试环境
          </text>
          <rect x={260} y={0} width={14} height={14} rx={3} fill={GC.master} />
          <text x={280} y={11} fontSize={10.5} fill="#5b647a">
            master 生产环境
          </text>
          <line x1={400} y1={7} x2={424} y2={7} stroke={GC.merge} strokeWidth={2} markerEnd="url(#ws-arrow)" />
          <text x={430} y={11} fontSize={10.5} fill="#5b647a">
            合并发布
          </text>
          <line x1={520} y1={7} x2={544} y2={7} stroke={GC.feat} strokeWidth={2} strokeDasharray="5 4" />
          <text x={550} y={11} fontSize={10.5} fill="#5b647a">
            feature 功能分支
          </text>
        </g>
      </svg>
    </div>
  )
}

function KvTable({ rows }: { rows: Kv[] }) {
  return (
    <table className="ws-kv-table">
      <tbody>
        {rows.map((r) => (
          <tr key={r.k}>
            <td className="ws-kv-k">{r.k}</td>
            <td className="ws-kv-v">{r.v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DevView() {
  const [active, setActive] = useState<string>('git')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.querySelector('.org-content') as HTMLElement | null
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-docsec]'))
    if (!sections.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.docsec as string)
        })
      },
      { root, rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(`docsec-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const tocTop = [
    { id: 'git', label: 'Git 仓库地址' },
    { id: 'dev', label: '开发环境' },
    { id: 'test', label: '测试环境' },
    { id: 'prod', label: '正式环境' },
  ]
  const envSubs = [
    { id: 'db', label: '数据库配置信息' },
    { id: 'nacos', label: 'Nacos 配置信息' },
    { id: 'third', label: '第三方对接信息' },
    { id: 'server', label: '服务器信息' },
    { id: 'deploy', label: '部署目录信息' },
  ]

  return (
    <div className="ws-doc2">
      <aside className="ws-doc-toc">
        <div className="ws-doc-toc-title">目录</div>
        <ul className="ws-doc-toc-list">
          {tocTop.map((t) => (
            <li key={t.id} className="ws-doc-toc-item">
              <button
                className={`ws-doc-toc-link${active === t.id ? ' active' : ''}`}
                onClick={() => scrollTo(t.id)}
              >
                {t.label}
              </button>
              {(t.id === 'dev' || t.id === 'test' || t.id === 'prod') && (
                <ul className="ws-doc-toc-sub">
                  {envSubs.map((s) => (
                    <li key={s.id}>
                      <button className="ws-doc-toc-sublink" onClick={() => scrollTo(`${t.id}-${s.id}`)}>
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>

      <div className="ws-doc-main" ref={scrollRef}>
        <section className="ws-doc-sec2" id="docsec-git" data-docsec="git">
          <h2 className="ws-doc-h2">Git 仓库地址</h2>
          <div className="ws-git-cards">
            {REPOS.map((r) => (
              <div className="ws-git-card" key={r.name}>
                <div className="ws-git-card-head">
                  <CodeOutlined className="ws-git-card-ico" />
                  <span className="ws-git-name">{r.name}</span>
                </div>
                <code className="ws-git-url">{r.url}</code>
                <Button
                  type="primary"
                  size="small"
                  icon={<CodeOutlined />}
                  className="ws-git-copy"
                  onClick={() => navigator.clipboard?.writeText(r.url)}
                >
                  复制
                </Button>
              </div>
            ))}
          </div>
          <p className="ws-doc-p">
            仓库按前后端拆分：<code className="scaf-mono">workplace-system-web</code> 为前端（React + Vite），
            <code className="scaf-mono">workplace-system-backend</code> 为后端（Spring Boot）。两端遵循统一的
            <code className="scaf-mono">dev / test / master</code> 分支模型：<b>dev</b> 对应开发环境、<b>test</b> 对应测试环境、<b>master</b> 对应生产环境。
          </p>
          <BranchGraph />
          <ul className="ws-graph-legend">
            <li>开发新功能：从 <code className="scaf-mono">dev</code> 拉取 <code className="scaf-mono">feature/*</code> 分支，开发完成后合并回 <code className="scaf-mono">dev</code>（开发环境）。</li>
            <li><code className="scaf-mono">dev</code> 稳定后合并到 <code className="scaf-mono">test</code>，发布到测试环境。</li>
            <li>测试通过后，从 <code className="scaf-mono">test</code> 合并到 <code className="scaf-mono">master</code>，发布到正式（生产）环境。</li>
          </ul>
        </section>

        {ENVS.map((env) => (
          <section className="ws-doc-sec2" key={env.key} id={`docsec-${env.key}`} data-docsec={env.key}>
            <h2 className="ws-doc-h2">{env.title}</h2>

            <h3 className="ws-doc-h3" id={`docsec-${env.key}-db`}>数据库配置信息</h3>
            <KvTable rows={env.db} />

            <h3 className="ws-doc-h3" id={`docsec-${env.key}-nacos`}>Nacos 配置信息</h3>
            <KvTable rows={env.nacos} />

            <h3 className="ws-doc-h3" id={`docsec-${env.key}-third`}>第三方对接信息</h3>
            <KvTable rows={env.third} />

            <h3 className="ws-doc-h3" id={`docsec-${env.key}-server`}>服务器信息</h3>
            <KvTable rows={env.server} />

            <h3 className="ws-doc-h3" id={`docsec-${env.key}-deploy`}>服务器部署目录相关信息</h3>
            <KvTable rows={env.deploy} />
          </section>
        ))}
      </div>
    </div>
  )
}

/* ============================ Excel 表格型视图（通用骨架） ============================ */
function ExcelToolbar({ title, kw, setKw }: { title: string; kw: string; setKw: (v: string) => void }) {
  return (
    <div className="ws-view-head">
      <h4 className="org-page-title">{title}</h4>
      <div className="ws-xl-tools">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#b8c0d0' }} />}
          placeholder="搜索关键字"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          style={{ width: 220 }}
        />
        <Button>筛选</Button>
        <Button type="primary">导出 Excel</Button>
      </div>
    </div>
  )
}

/* ----------------------------- 功能权限 ----------------------------- */
interface FuncRow {
  id: number
  module: string
  fn: string
  roles: string
  op: string
  status: string
}

function FuncPermView() {
  const [kw, setKw] = useState('')
  const data: FuncRow[] = [
    { id: 1, module: '用户管理', fn: '用户列表查看', roles: '超级管理员、教师', op: '查看', status: '启用' },
    { id: 2, module: '用户管理', fn: '新增 / 编辑用户', roles: '超级管理员', op: '编辑', status: '启用' },
    { id: 3, module: '用户管理', fn: '删除用户', roles: '超级管理员', op: '删除', status: '启用' },
    { id: 4, module: '考勤管理', fn: '打卡记录查看', roles: '超级管理员、教师', op: '查看', status: '启用' },
    { id: 5, module: '考勤管理', fn: '考勤规则配置', roles: '超级管理员', op: '管理', status: '启用' },
    { id: 6, module: '薪资管理', fn: '工资条查看', roles: '员工本人', op: '查看', status: '启用' },
    { id: 7, module: '薪资管理', fn: '薪资核算', roles: '超级管理员', op: '编辑', status: '禁用' },
    { id: 8, module: '制度管理', fn: '制度起草', roles: '制度管理员、超级管理员', op: '编辑', status: '启用' },
    { id: 9, module: '制度管理', fn: '制度发布', roles: '超级管理员', op: '管理', status: '启用' },
    { id: 10, module: '数据大屏', fn: '大屏查看', roles: '全部角色', op: '查看', status: '启用' },
    { id: 11, module: '通讯录', fn: '同事信息查询', roles: '全部角色', op: '查看', status: '启用' },
    { id: 12, module: '系统设置', fn: '参数配置', roles: '超级管理员', op: '管理', status: '启用' },
  ]
  const list = useMemo(
    () => (kw ? data.filter((r) => Object.values(r).join(' ').includes(kw)) : data),
    [kw],
  )
  const columns: TableColumnsType<FuncRow> = [
    { title: '模块', dataIndex: 'module', key: 'module', width: 120, fixed: 'left', render: (v: string) => <span className="xl-cell-strong">{v}</span> },
    { title: '功能点', dataIndex: 'fn', key: 'fn' },
    { title: '可见角色', dataIndex: 'roles', key: 'roles', render: (v: string) => v.split('、').map((r) => <Tag key={r} color="blue">{r}</Tag>) },
    {
      title: '操作权限',
      dataIndex: 'op',
      key: 'op',
      width: 96,
      align: 'center',
      render: (v: string) => <Tag color={v === '管理' ? 'purple' : v === '删除' ? 'red' : 'default'}>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag>,
    },
  ]
  return (
    <div className="ws-view">
      <ExcelToolbar title="功能权限" kw={kw} setKw={setKw} />
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<FuncRow>
          className="xl-table"
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: 640 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条权限` }}
        />
      </Card>
    </div>
  )
}

/* ----------------------------- 数据权限 ----------------------------- */
interface DataRow {
  id: number
  object: string
  scope: string
  roles: string
  fields: string
  rule: string
  status: string
}

function DataPermView() {
  const [kw, setKw] = useState('')
  const data: DataRow[] = [
    { id: 1, object: '员工基本信息', scope: '全量', roles: '超级管理员', fields: '全部字段', rule: '无限制', status: '启用' },
    { id: 2, object: '员工基本信息', scope: '本学院', roles: '学院管理员', fields: '脱敏(手机/邮箱)', rule: 'dept = 当前学院', status: '启用' },
    { id: 3, object: '考勤记录', scope: '全量', roles: '超级管理员', fields: '全部字段', rule: '无限制', status: '启用' },
    { id: 4, object: '考勤记录', scope: '本学院', roles: '学院管理员、教师', fields: '全部字段', rule: 'dept = 当前学院', status: '启用' },
    { id: 5, object: '薪资数据', scope: '本人', roles: '员工本人', fields: '仅本人字段', rule: 'owner = 当前用户', status: '启用' },
    { id: 6, object: '薪资数据', scope: '全量', roles: '超级管理员', fields: '全部字段', rule: '无限制', status: '启用' },
    { id: 7, object: '学生信息', scope: '本班', roles: '班主任', fields: '全部字段', rule: 'class = 当前班级', status: '启用' },
    { id: 8, object: '课程数据', scope: '任教课程', roles: '教师', fields: '全部字段', rule: 'teacher = 当前用户', status: '启用' },
    { id: 9, object: '制度文档', scope: '全量', roles: '全部角色', fields: '公开字段', rule: '无限制', status: '启用' },
    { id: 10, object: '操作日志', scope: '全量', roles: '超级管理员', fields: '全部字段', rule: '无限制', status: '启用' },
  ]
  const list = useMemo(
    () => (kw ? data.filter((r) => Object.values(r).join(' ').includes(kw)) : data),
    [kw],
  )
  const columns: TableColumnsType<DataRow> = [
    { title: '数据对象', dataIndex: 'object', key: 'object', width: 130, fixed: 'left', render: (v: string) => <span className="xl-cell-strong">{v}</span> },
    { title: '数据范围', dataIndex: 'scope', key: 'scope', width: 100, align: 'center' },
    { title: '可见角色', dataIndex: 'roles', key: 'roles', render: (v: string) => v.split('、').map((r) => <Tag key={r} color="blue">{r}</Tag>) },
    { title: '字段权限', dataIndex: 'fields', key: 'fields' },
    { title: '行级规则', dataIndex: 'rule', key: 'rule', render: (v: string) => <span className="scaf-mono">{v}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (v: string) => <Tag color={v === '启用' ? 'green' : 'default'}>{v}</Tag>,
    },
  ]
  return (
    <div className="ws-view">
      <ExcelToolbar title="数据权限" kw={kw} setKw={setKw} />
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<DataRow>
          className="xl-table"
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: 720 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条数据规则` }}
        />
      </Card>
    </div>
  )
}

/* ----------------------------- 走查清单 ----------------------------- */
interface CheckRow {
  id: string
  module: string // 所属模块
  account: string // 操作账号
  desc: string // 问题描述（允许有截图）
  shot?: boolean // 是否附带截图
  fixer: string // 修改人
  status: '未开始' | '进行中' | '已完成' // 状态
  result: '验证通过' | '验证未通过' | '' // 验证结果
}

function ChecklistView() {
  const [kw, setKw] = useState('')
  const [shot, setShot] = useState<CheckRow | null>(null)
  const data: CheckRow[] = [
    { id: 'C01', module: '用户管理', account: 'zhangsan', desc: '新增用户提交按钮偶发无响应，附浏览器控制台报错截图。', shot: true, fixer: '李四', status: '已完成', result: '验证通过' },
    { id: 'C02', module: '考勤管理', account: 'lisi', desc: '打卡记录导出为 Excel 后中文出现乱码。', shot: true, fixer: '王五', status: '已完成', result: '验证未通过' },
    { id: 'C03', module: '移动端适配', account: 'zhangsan', desc: '窄屏（≤520px）页面底部出现横向滚动条。', shot: false, fixer: '李四', status: '进行中', result: '' },
    { id: 'C04', module: '制度管理', account: 'wangwu', desc: '富文本编辑器粘贴图片后比例失真、清晰度下降。', shot: true, fixer: '赵六', status: '进行中', result: '' },
    { id: 'C05', module: '智能问答', account: 'zhaoliu', desc: '多轮对话中上下文偶发丢失，答非所问。', shot: false, fixer: '', status: '未开始', result: '' },
    { id: 'C06', module: '数据权限', account: 'wangwu', desc: '学院管理员可越级查看非本学院薪资数据。', shot: true, fixer: '钱七', status: '已完成', result: '验证通过' },
    { id: 'C07', module: '系统设置', account: 'admin', desc: '令牌过期后旧令牌仍可调用接口，未返回 401。', shot: false, fixer: '钱七', status: '已完成', result: '验证未通过' },
    { id: 'C08', module: '会议室预订', account: 'lisi', desc: '同一时段重复预订未做冲突校验。', shot: false, fixer: '王五', status: '进行中', result: '' },
    { id: 'C09', module: '员工订餐', account: 'zhaoliu', desc: '移动端提交订单后金额显示延迟约 1 秒。', shot: false, fixer: '', status: '未开始', result: '' },
    { id: 'C10', module: '门户首页', account: 'zhangsan', desc: '待办角标数字与列表实际条数不一致。', shot: true, fixer: '李四', status: '已完成', result: '验证通过' },
  ]
  const list = useMemo(
    () => (kw ? data.filter((r) => Object.values(r).join(' ').includes(kw)) : data),
    [kw],
  )
  const statusColor: Record<CheckRow['status'], string> = { 未开始: 'default', 进行中: 'processing', 已完成: 'green' }
  const resultColor: Record<Exclude<CheckRow['result'], ''>, string> = { 验证通过: 'green', 验证未通过: 'red' }
  const columns: TableColumnsType<CheckRow> = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 70, fixed: 'left', render: (v: string) => <span className="xl-cell-strong">{v}</span> },
    { title: '所属模块', dataIndex: 'module', key: 'module', width: 110, render: (v: string) => <span className="xl-cell-strong">{v}</span> },
    { title: '操作账号', dataIndex: 'account', key: 'account', width: 110, render: (v: string) => <span className="scaf-mono">{v}</span> },
    {
      title: '问题描述',
      dataIndex: 'desc',
      key: 'desc',
      render: (v: string, r: CheckRow) => (
        <div className="ws-desc-cell">
          <span className="ws-desc-text">{v}</span>
          {r.shot && (
            <Button type="link" size="small" className="ws-shot-link" icon={<PictureOutlined />} onClick={() => setShot(r)}>
              查看截图
            </Button>
          )}
        </div>
      ),
    },
    { title: '修改人', dataIndex: 'fixer', key: 'fixer', width: 90, align: 'center', render: (v: string) => (v ? v : <span className="ws-muted">—</span>) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 96,
      align: 'center',
      render: (v: CheckRow['status']) => <Tag color={statusColor[v]}>{v}</Tag>,
    },
    {
      title: '验证结果',
      dataIndex: 'result',
      key: 'result',
      width: 110,
      align: 'center',
      render: (v: CheckRow['result']) =>
        v ? <Tag color={resultColor[v]}>{v}</Tag> : <span className="ws-muted">—</span>,
    },
  ]
  return (
    <div className="ws-view">
      <ExcelToolbar title="走查清单" kw={kw} setKw={setKw} />
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<CheckRow>
          className="xl-table"
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: 920 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 项检查` }}
        />
      </Card>
      <Modal
        open={!!shot}
        title={shot ? `问题截图 · ${shot.id} ${shot.module}` : ''}
        footer={null}
        onCancel={() => setShot(null)}
        width={560}
      >
        {shot && (
          <div className="ws-shot-preview">
            <div className="ws-shot-box">
              <PictureOutlined className="ws-shot-icon" />
              <span>问题截图占位（{shot.id}）</span>
            </div>
            <p className="ws-shot-desc">{shot.desc}</p>
            <p className="ws-shot-meta">操作账号：{shot.account}　·　修改人：{shot.fixer || '—'}　·　状态：{shot.status}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ============================ 主组件（布局与脚手架一致） ============================ */
export default function WorkSummary() {
  const [menu, setMenu] = useState<WsMenuKey>('prd')
  const [collapsed, setCollapsed] = useState(false)
  const crumbs = menuLabelMap[menu]

  return (
    <Layout className="org-layout">
      <Header className="site-header site-header--solid">
        <div className="header-inner">
          <div className="header-left">
            <Link to="/" className="brand">
              <span className="brand-logo" aria-hidden>
                <svg viewBox="0 0 32 32" width="30" height="30" fill="none">
                  <rect x="2" y="2" width="28" height="28" rx="8" fill="#3b5bff" />
                  <rect x="8" y="8" width="7" height="7" rx="2" fill="#fff" />
                  <rect x="17" y="8" width="7" height="7" rx="2" fill="#fff" opacity="0.7" />
                  <rect x="8" y="17" width="7" height="7" rx="2" fill="#fff" opacity="0.7" />
                  <rect x="17" y="17" width="7" height="7" rx="2" fill="#fff" />
                </svg>
              </span>
              {!collapsed && (
                <span className="brand-name" style={{ fontWeight: 600 }}>
                  工作总结
                </span>
              )}
            </Link>
          </div>

          <div
            className="header-breadcrumb"
            style={{ left: `calc(${collapsed ? 80 : 220}px + var(--content-gap, 16px))` }}
          >
            <Button
              type="text"
              className="sider-collapse-btn"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
              aria-label="收起/展开菜单"
            />
            <Breadcrumb items={[{ title: '工作总结' }, ...crumbs.map((c) => ({ title: c }))]} />
          </div>

          <Space size={14} align="center">
            <Badge count={2} size="small" offset={[-2, 2]}>
              <BellOutlined className="scaf-header-bell" />
            </Badge>
            <div className="scaf-user-entry">
              <div className="scaf-user-trigger">
                <Avatar size={30} src="/avatar.webp" />
                <span className="scaf-user-name">张明</span>
              </div>
              <div className="scaf-user-menu">
                <div className="scaf-user-menu-item">
                  <SettingOutlined />
                  <span>账号设置</span>
                </div>
                <div className="scaf-user-menu-item scaf-user-menu-logout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </div>
              </div>
            </div>
          </Space>
        </div>
      </Header>
      <div className="org-body">
        <aside className={`org-sider${collapsed ? ' collapsed' : ''}`}>
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[menu]}
            items={menuItems}
            onClick={({ key }) => setMenu(key as WsMenuKey)}
          />
        </aside>
        <Content className="org-content">
          <div className="org-container">
            {menu === 'prd' && <PrdView />}
            {menu === 'func' && <FuncPermView />}
            {menu === 'data' && <DataPermView />}
            {menu === 'checklist' && <ChecklistView />}
            {menu === 'dev' && <DevView />}
          </div>
        </Content>
      </div>
    </Layout>
  )
}
