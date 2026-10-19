import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  BankOutlined,
  TeamOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import './floorPlan.css'

/* 顶部日期（不写死） */
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const _d = new Date()
const TODAY = `${_d.getFullYear()}年${String(_d.getMonth() + 1).padStart(2, '0')}月${String(_d.getDate()).padStart(2, '0')}日 ${WEEKDAYS[_d.getDay()]}`

/* ============================ 类型 ============================ */

type ViewKey = 'room' | 'people' | 'device' | 'safety' | 'chem'

interface GridItem {
  label: string
  value: string
}
interface LeftCard {
  title: string
  icon: ReactNode
  items: GridItem[]
}
interface RightRow {
  name: string
  area: string
  rooms: string
}
interface ViewDef {
  key: ViewKey
  label: string
  icon: ReactNode
  leftCards: [LeftCard, LeftCard]
  rightTitle: string
  rightHead: [string, string, string]
  rightRows: RightRow[]
}

/* ============================ 视图数据 ============================ */

const VIEWS: Record<ViewKey, ViewDef> = {
  /* ---- 用房管理（参考图默认态） ---- */
  room: {
    key: 'room',
    label: '用房管理',
    icon: <BankOutlined />,
    leftCards: [
      {
        title: '房间情况',
        icon: <AppstoreOutlined />,
        items: [
          { label: '校区', value: '1' },
          { label: '栋楼', value: '15' },
          { label: '房间', value: '52' },
          { label: '面积', value: '3652' },
        ],
      },
      {
        title: '房间类型',
        icon: <DashboardOutlined />,
        items: [
          { label: '科研', value: '15' },
          { label: '教学', value: '30' },
          { label: '学生宿舍', value: '52' },
          { label: '行政办公', value: '10' },
          { label: '经营', value: '52' },
          { label: '其他', value: '10' },
        ],
      },
    ],
    rightTitle: '系所',
    rightHead: ['系所', '面积', '房间'],
    rightRows: [
      { name: '测试系所01', area: '150㎡', rooms: '12间' },
      { name: '测试系所02', area: '180㎡', rooms: '14间' },
      { name: '测试系所03', area: '150㎡', rooms: '12间' },
      { name: '测试系所04', area: '200㎡', rooms: '16间' },
      { name: '测试系所05', area: '150㎡', rooms: '12间' },
      { name: '测试系所06', area: '120㎡', rooms: '10间' },
      { name: '测试系所07', area: '180㎡', rooms: '14间' },
      { name: '测试系所08', area: '150㎡', rooms: '12间' },
      { name: '测试系所09', area: '220㎡', rooms: '18间' },
      { name: '测试系所10', area: '150㎡', rooms: '12间' },
      { name: '测试系所11', area: '160㎡', rooms: '13间' },
      { name: '测试系所12', area: '150㎡', rooms: '12间' },
    ],
  },

  /* ---- 人员管理 ---- */
  people: {
    key: 'people',
    label: '人员管理',
    icon: <TeamOutlined />,
    leftCards: [
      {
        title: '人员情况',
        icon: <AppstoreOutlined />,
        items: [
          { label: '总人数', value: '107' },
          { label: '在岗', value: '78' },
          { label: '部门', value: '9' },
          { label: '工位', value: '120' },
        ],
      },
      {
        title: '人员类型',
        icon: <DashboardOutlined />,
        items: [
          { label: '科研', value: '45' },
          { label: '教学', value: '30' },
          { label: '行政', value: '12' },
          { label: '实验', value: '8' },
          { label: '博士后', value: '6' },
          { label: '访问学者', value: '6' },
        ],
      },
    ],
    rightTitle: '部门',
    rightHead: ['部门', '人数', '工位'],
    rightRows: [
      { name: '测试部门01', area: '32人', rooms: '40个' },
      { name: '测试部门02', area: '18人', rooms: '22个' },
      { name: '测试部门03', area: '14人', rooms: '18个' },
      { name: '测试部门04', area: '11人', rooms: '14个' },
      { name: '测试部门05', area: '9人', rooms: '12个' },
      { name: '测试部门06', area: '8人', rooms: '10个' },
      { name: '测试部门07', area: '8人', rooms: '10个' },
      { name: '测试部门08', area: '7人', rooms: '9个' },
      { name: '测试部门09', area: '6人', rooms: '8个' },
      { name: '测试部门10', area: '5人', rooms: '6个' },
    ],
  },

  /* ---- 大区设备 ---- */
  device: {
    key: 'device',
    label: '大区设备',
    icon: <ToolOutlined />,
    leftCards: [
      {
        title: '设备情况',
        icon: <AppstoreOutlined />,
        items: [
          { label: '台套', value: '40' },
          { label: '在用', value: '28' },
          { label: '原值', value: '860' },
          { label: '利用率', value: '72' },
        ],
      },
      {
        title: '设备类别',
        icon: <DashboardOutlined />,
        items: [
          { label: '分析仪器', value: '14' },
          { label: '制备设备', value: '9' },
          { label: '检测设备', value: '11' },
          { label: '辅助设备', value: '6' },
          { label: '大型仪器', value: '5' },
          { label: '共享设备', value: '8' },
        ],
      },
    ],
    rightTitle: '设备',
    rightHead: ['设备', '原值', '状态'],
    rightRows: [
      { name: '测试设备01', area: '48万', rooms: '在用' },
      { name: '测试设备02', area: '3.2万', rooms: '在用' },
      { name: '测试设备03', area: '12万', rooms: '维修' },
      { name: '测试设备04', area: '8.6万', rooms: '在用' },
      { name: '测试设备05', area: '260万', rooms: '在用' },
      { name: '测试设备06', area: '180万', rooms: '闲置' },
      { name: '测试设备07', area: '36万', rooms: '在用' },
      { name: '测试设备08', area: '22万', rooms: '在用' },
      { name: '测试设备09', area: '4.5万', rooms: '报废' },
      { name: '测试设备10', area: '2.8万', rooms: '在用' },
    ],
  },

  /* ---- 实验室安全 ---- */
  safety: {
    key: 'safety',
    label: '实验室安全',
    icon: <SafetyCertificateOutlined />,
    leftCards: [
      {
        title: '安全情况',
        icon: <AppstoreOutlined />,
        items: [
          { label: '消防栓', value: '6' },
          { label: '门禁', value: '4' },
          { label: '监控', value: '18' },
          { label: '烟感', value: '12' },
        ],
      },
      {
        title: '安全等级',
        icon: <DashboardOutlined />,
        items: [
          { label: '一级', value: '8' },
          { label: '二级', value: '20' },
          { label: '三级', value: '24' },
          { label: '危化品间', value: '3' },
          { label: '气瓶间', value: '2' },
          { label: '废弃物间', value: '1' },
        ],
      },
    ],
    rightTitle: '安全设施',
    rightHead: ['设施', '数量', '状态'],
    rightRows: [
      { name: '测试设施01', area: '6处', rooms: '正常' },
      { name: '测试设施02', area: '4处', rooms: '正常' },
      { name: '测试设施03', area: '18处', rooms: '正常' },
      { name: '测试设施04', area: '12处', rooms: '正常' },
      { name: '测试设施05', area: '5处', rooms: '正常' },
      { name: '测试设施06', area: '3处', rooms: '正常' },
      { name: '测试设施07', area: '26处', rooms: '正常' },
      { name: '测试设施08', area: '6处', rooms: '正常' },
      { name: '测试设施09', area: '14处', rooms: '1处检修' },
      { name: '测试设施10', area: '4处', rooms: '正常' },
    ],
  },

  /* ---- 化学品 ---- */
  chem: {
    key: 'chem',
    label: '化学品',
    icon: <ExperimentOutlined />,
    leftCards: [
      {
        title: '化学品情况',
        icon: <AppstoreOutlined />,
        items: [
          { label: '种类', value: '99' },
          { label: '库存', value: '1.24' },
          { label: '预警', value: '9' },
          { label: '温区', value: '3' },
        ],
      },
      {
        title: '化学品分类',
        icon: <DashboardOutlined />,
        items: [
          { label: '处方药', value: '38' },
          { label: '非处方药', value: '22' },
          { label: '危化品', value: '12' },
          { label: '试剂', value: '27' },
          { label: '易制毒', value: '6' },
          { label: '易制爆', value: '4' },
        ],
      },
    ],
    rightTitle: '危化品',
    rightHead: ['名称', '存量', '状态'],
    rightRows: [
      { name: '测试化学品01', area: '500ml×12', rooms: '充足' },
      { name: '测试化学品02', area: '500ml×8', rooms: '充足' },
      { name: '测试化学品03', area: '500ml×5', rooms: '预警' },
      { name: '测试化学品04', area: '500g×20', rooms: '充足' },
      { name: '测试化学品05', area: '5L×6', rooms: '充足' },
      { name: '测试化学品06', area: '5L×4', rooms: '预警' },
      { name: '测试化学品07', area: '500g×3', rooms: '充足' },
      { name: '测试化学品08', area: '500ml×2', rooms: '缺货' },
      { name: '测试化学品09', area: '500ml×1', rooms: '预警' },
      { name: '测试化学品10', area: '500ml×7', rooms: '充足' },
    ],
  },
}

const VIEW_KEYS = Object.keys(VIEWS) as ViewKey[]

/* ============================ 校园楼栋（等距立体建模） ============================ */
/* x/y 为俯视平面位置，w 面宽，d 进深，h 楼高 */

interface Bld {
  id: string
  name: string
  x: number
  y: number
  w: number
  d: number
  h: number
  info: string
}

const BUILDINGS: Bld[] = [
  { id: 'b1', name: '1号楼', x: 64, y: 92, w: 150, d: 92, h: 110, info: '实验楼 · 3,200㎡ · 42间' },
  { id: 'b2', name: '2号楼', x: 452, y: 80, w: 185, d: 112, h: 150, info: '综合楼 · 5,600㎡ · 68间' },
  { id: 'b3', name: '3号楼', x: 858, y: 96, w: 165, d: 100, h: 128, info: '教学楼 · 4,100㎡ · 52间' },
  { id: 'b4', name: '4号楼', x: 690, y: 190, w: 145, d: 90, h: 112, info: '办公楼 · 2,900㎡ · 36间' },
  { id: 'b5', name: '5号楼', x: 322, y: 230, w: 155, d: 95, h: 120, info: '科研楼 · 3,200㎡ · 42间' },
  { id: 'b6', name: '6号楼', x: 972, y: 300, w: 150, d: 92, h: 116, info: '实验楼 · 3,800㎡ · 46间' },
  { id: 'b7', name: '7号楼', x: 156, y: 420, w: 162, d: 100, h: 124, info: '宿舍楼 · 4,500㎡ · 120间' },
  { id: 'b8', name: '8号楼', x: 432, y: 450, w: 172, d: 106, h: 130, info: '科研楼 · 3,600㎡ · 48间' },
  { id: 'b9', name: '9号楼', x: 792, y: 420, w: 268, d: 120, h: 170, info: '综合楼 · 8,600㎡ · 96间' },
]

/* 等距深度排序：y 越大越靠前，后绘制 */
const BLD_SORTED = [...BUILDINGS].sort((p, q) => p.y - q.y)

/* 树木装饰点（避开楼栋占位） */
const TREES: [number, number, number][] = [
  [280, 66, 9], [380, 56, 7], [720, 58, 8], [762, 104, 9], [1100, 244, 7],
  [250, 300, 8], [60, 258, 8], [540, 380, 7], [640, 402, 8], [880, 400, 8],
  [900, 258, 7], [700, 620, 7], [250, 600, 9], [60, 600, 8], [420, 640, 7],
  [1130, 620, 8],
]

/* ============================ 中央校园平面 ============================ */

/* 生成立面窗户：楼层横线 + 亮灯窗阵列（平行四边形按行列排布） */
function FaceWindows({
  o,
  u,
  v,
  cols,
  rows,
  seed,
}: {
  o: [number, number]
  u: [number, number]
  v: [number, number]
  cols: number
  rows: number
  seed: number
}) {
  const out: ReactNode[] = []
  const at = (a: number, b: number): [number, number] => [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b]

  /* 楼层线 */
  for (let r = 1; r < rows; r++) {
    const p1 = at(0, r / rows)
    const p2 = at(1, r / rows)
    out.push(<line key={`fl${r}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} className="fp-win-line" />)
  }

  /* 亮灯窗 */
  const winW = 0.6 / cols
  const winH = 0.42 / rows
  const padC = (1 / cols - winW) / 2
  const padR = (1 / rows - winH) / 2
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if ((seed + c * 7 + r * 13) % 100 >= 40) continue
      const a0 = c / cols + padC
      const b0 = r / rows + padR
      const p1 = at(a0, b0)
      const p2 = at(a0 + winW, b0)
      const p3 = at(a0 + winW, b0 + winH)
      const p4 = at(a0, b0 + winH)
      out.push(
        <polygon
          key={`w${c}-${r}`}
          className="fp-win"
          points={`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}`}
        />,
      )
    }
  }
  return <g className="fp-wins">{out}</g>
}

/* 楼顶设备间 + 天线（增强楼宇辨识度） */
function RoofBox({ b }: { b: Bld }) {
  const rx = b.x + b.w * 0.5
  const ry = b.y + b.d * 0.1
  const rw = b.w * 0.32
  const rd = b.d * 0.34
  const rh = b.h * 0.16
  const hw = rw / 2
  const hd = rd / 2
  const n = `${rx + hw},${ry}`
  const e = `${rx + rw},${ry + hd}`
  const s = `${rx + hw},${ry + rd}`
  const wp = `${rx},${ry + hd}`
  const s2 = `${rx + hw},${ry + rd + rh}`
  const w2 = `${rx},${ry + hd + rh}`
  const e2 = `${rx + rw},${ry + hd + rh}`
  const ax = rx + rw * 0.72
  return (
    <g className="fp-roof">
      <polygon className="fp-bld-left" points={`${wp} ${s} ${s2} ${w2}`} />
      <polygon className="fp-bld-right" points={`${s} ${e} ${e2} ${s2}`} />
      <polygon className="fp-bld-top" points={`${n} ${e} ${s} ${wp}`} />
      <line x1={ax} y1={ry - 2} x2={ax} y2={ry - 16} className="fp-antenna" />
      <circle cx={ax} cy={ry - 18} r="2.4" className="fp-antenna-tip" />
    </g>
  )
}

function CampusPlan({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <svg viewBox="0 0 1200 720" className="fp-plan-svg" role="img" aria-label="校园三维建模平面图">
      <defs>
        <pattern id="fp-map-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M60 0H0V60" fill="none" stroke="rgba(79,216,255,.09)" strokeWidth="1" />
        </pattern>
        <linearGradient id="fp-scan-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(79,216,255,0)" />
          <stop offset="50%" stopColor="rgba(79,216,255,.22)" />
          <stop offset="100%" stopColor="rgba(79,216,255,0)" />
        </linearGradient>
      </defs>

      {/* 地图底 */}
      <rect x="8" y="8" width="1184" height="704" rx="14" fill="#081d38" stroke="#2f7bd6" strokeWidth="1.5" />
      <rect x="20" y="20" width="1160" height="680" rx="10" fill="url(#fp-map-grid)" />
      <rect x="20" y="20" width="1160" height="680" rx="10" fill="none" stroke="rgba(79,216,255,.18)" strokeWidth="1" />

      {/* 道路网 */}
      <g stroke="rgba(96,170,255,.28)" strokeWidth="14" fill="none">
        <path d="M20 330 H1180" />
        <path d="M620 20 V700" />
        <path d="M20 560 H1180" opacity=".7" />
        <path d="M300 20 V700" opacity=".7" />
        <path d="M920 20 V700" opacity=".7" />
      </g>
      <g stroke="rgba(127,228,255,.4)" strokeWidth="1.2" strokeDasharray="14 10" fill="none">
        <path d="M20 330 H1180" />
        <path d="M620 20 V700" />
        <path d="M20 560 H1180" />
        <path d="M300 20 V700" />
        <path d="M920 20 V700" />
      </g>

      {/* 树木装饰 */}
      {TREES.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} className="fp-tree" />
      ))}

      {/* 楼栋（等距立体建模：顶面 + 双立面窗户 + 楼顶设备间） */}
      {BLD_SORTED.map((b) => {
        const on = selectedId === b.id
        const hw = b.w / 2
        const hd = b.d / 2
        const n = `${b.x + hw},${b.y}`
        const e = `${b.x + b.w},${b.y + hd}`
        const s = `${b.x + hw},${b.y + b.d}`
        const w = `${b.x},${b.y + hd}`
        const sB = `${b.x + hw},${b.y + b.d + b.h}`
        const wB = `${b.x},${b.y + hd + b.h}`
        const eB = `${b.x + b.w},${b.y + hd + b.h}`
        const cols = Math.max(3, Math.round(b.w / 46))
        const rows = Math.max(3, Math.round(b.h / 30))
        const seed = b.id.charCodeAt(0) * 31 + b.w
        return (
          <g
            key={b.id}
            className={`fp-bld${on ? ' is-on' : ''}`}
            onClick={() => onSelect(b.id)}
            tabIndex={0}
          >
            {/* 左暗面 + 窗户 */}
            <polygon className="fp-bld-left" points={`${w} ${s} ${sB} ${wB}`} />
            <FaceWindows
              o={[b.x, b.y + hd]}
              u={[hw, hd]}
              v={[0, b.h]}
              cols={cols}
              rows={rows}
              seed={seed}
            />
            {/* 右暗面 + 窗户 */}
            <polygon className="fp-bld-right" points={`${s} ${e} ${eB} ${sB}`} />
            <FaceWindows
              o={[b.x + hw, b.y + b.d]}
              u={[hw, -hd]}
              v={[0, b.h]}
              cols={cols + 1}
              rows={rows}
              seed={seed + 5}
            />
            {/* 顶亮面 */}
            <polygon className="fp-bld-top" points={`${n} ${e} ${s} ${w}`} />
            {/* 楼顶设备间 */}
            <RoofBox b={b} />
            {/* 楼名标签（悬浮楼顶上方） */}
            <text x={b.x + hw} y={b.y - 14} className="fp-bld-name" textAnchor="middle">
              {b.name}
            </text>
          </g>
        )
      })}

      {/* 扫描线（动效） */}
      <g className="fp-scan">
        <rect x="20" y="0" width="1160" height="60" fill="url(#fp-scan-grad)">
          <animate attributeName="y" values="20;640;640" keyTimes="0;0.92;1" dur="6s" repeatCount="indefinite" />
        </rect>
      </g>

      {/* 四角蓝图角标 */}
      <path d="M8 28 V8 H28" fill="none" stroke="#57e0ff" strokeWidth="2.5" />
      <path d="M1192 28 V8 H1172" fill="none" stroke="#57e0ff" strokeWidth="2.5" />
      <path d="M8 696 V716 H28" fill="none" stroke="#57e0ff" strokeWidth="2.5" />
      <path d="M1192 696 V716 H1172" fill="none" stroke="#57e0ff" strokeWidth="2.5" />

      {/* 图签 */}
      <g transform="translate(1020,656)">
        <rect x="0" y="0" width="160" height="36" rx="4" fill="rgba(8,30,62,.88)" stroke="rgba(127,228,255,.5)" strokeWidth="1" />
        <line x1="0" y1="18" x2="160" y2="18" stroke="rgba(127,228,255,.35)" strokeWidth="1" />
        <text x="10" y="13" className="fp-titleblock-text">校区建模 · 比例 1:2000</text>
        <text x="10" y="31" className="fp-titleblock-text">CAMPUS MODEL · REV.2026</text>
      </g>
    </svg>
  )
}

/* ============================ 左统计卡片 ============================ */

function LeftPanel({ card }: { card: LeftCard }) {
  return (
    <section className="fp-card">
      <header className="fp-card-head">
        <span className="fp-card-ico">{card.icon}</span>
        <span className="fp-card-title">{card.title}</span>
      </header>
      <div className="fp-card-grid">
        {card.items.map((it) => (
          <div className="fp-grid-item" key={it.label}>
            <span className="fp-grid-value">{it.value}</span>
            <span className="fp-grid-label">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ============================ 主组件 ============================ */

export default function FloorPlan() {
  const [active, setActive] = useState<ViewKey>('room')
  const [selected, setSelected] = useState<string | null>(null)
  const def = VIEWS[active]
  const selectedBld = BUILDINGS.find((b) => b.id === selected) ?? null

  return (
    <div className="fp-screen">
      <div className="fp-halo" />
      <div className="fp-vignette" />

      {/* 顶栏 */}
      <header className="fp-topbar">
        <Link to="/" className="fp-back">‹ 应用中心</Link>
        <span className="fp-tb-date">{TODAY}</span>
        <div className="fp-tb-title">
          <span className="fp-tb-deco l">
            <i />
            <i />
            <i />
          </span>
          <h1>实验室三维可视化平台</h1>
          <span className="fp-tb-deco r">
            <i />
            <i />
            <i />
          </span>
        </div>
        <span className="fp-tb-status">
          <i />
          数据实时更新
        </span>
        <div className="fp-line" />
      </header>

      {/* 主体：左面板 + 中央平面 + 右列表 */}
      <div className="fp-main">
        <aside className="fp-left">
          {def.leftCards.map((card) => (
            <LeftPanel key={card.title} card={card} />
          ))}
        </aside>

        <div className="fp-center">
          <div className="fp-plan-wrap">
            <CampusPlan selectedId={selected} onSelect={setSelected} />
          </div>
          <div className="fp-plan-caption">
            {selectedBld ? (
              <>
                已选楼栋：<b>{selectedBld.name}</b> · {selectedBld.info}
              </>
            ) : (
              '点击平面图中的楼栋，查看楼栋用房详情'
            )}
          </div>
        </div>

        <aside className="fp-right">
          <div className="fp-right-head">
            <span className="fp-right-title">{def.rightTitle}</span>
            <span className="fp-right-cols">
              <em>{def.rightHead[1]}</em>
              <em>{def.rightHead[2]}</em>
            </span>
          </div>
          <div className="fp-right-body">
            {def.rightRows.map((row, i) => (
              <div className="fp-right-row" key={`${row.name}-${i}`}>
                <span className="fp-rr-name" title={row.name}>
                  {row.name}
                </span>
                <span className="fp-rr-area">{row.area}</span>
                <span className="fp-rr-rooms">{row.rooms}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* 底部功能按钮组 */}
      <nav className="fp-tabbar">
        {VIEW_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={`fp-tab${active === k ? ' is-on' : ''}`}
            onClick={() => {
              setActive(k)
              setSelected(null)
            }}
          >
            {VIEWS[k].icon}
            <span>{VIEWS[k].label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
