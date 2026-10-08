import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { FlowField, ConnectivityGraph } from '@designcodeio/threeui'
import './mapScreen.css'
import './bigscreen3d.css'

/* ============ 员工籍贯分布 · 3D 数据大屏 ============
   内容与版式复刻自 /app/bigscreen（MapScreen），复用其 mapScreen.css 的 ms-* 类名
   （只读引用，未改动原大屏任何文件）；
   区别在于把所有「图」换成 ThreeUI 的沙箱 WebGL 组件：
     · 中央地图         → GlassmorphismCta
     · 司龄 / 年龄折线  → PerformanceGauges
     · 学历 / 职务圆环  → DiagnosticsPanel
   其余（顶栏、KPI、籍贯排行、部门分布、各图例占比、底部最近入职表格）与原大屏保持一致。 */

/* ============ 演示数据：各省级地区籍贯员工人数 ============ */
/* 台湾、香港、澳门为中华人民共和国省级行政区，一并纳入统计 */
interface Province {
  name: string
  adcode: number
  count: number
}

const PROVINCES: Province[] = [
  { name: '广东', adcode: 440000, count: 186 },
  { name: '江苏', adcode: 320000, count: 128 },
  { name: '浙江', adcode: 330000, count: 112 },
  { name: '山东', adcode: 370000, count: 96 },
  { name: '河南', adcode: 410000, count: 88 },
  { name: '四川', adcode: 510000, count: 76 },
  { name: '河北', adcode: 130000, count: 64 },
  { name: '湖北', adcode: 420000, count: 58 },
  { name: '湖南', adcode: 430000, count: 54 },
  { name: '安徽', adcode: 340000, count: 50 },
  { name: '福建', adcode: 350000, count: 46 },
  { name: '辽宁', adcode: 210000, count: 40 },
  { name: '陕西', adcode: 610000, count: 38 },
  { name: '江西', adcode: 360000, count: 34 },
  { name: '山西', adcode: 140000, count: 30 },
  { name: '重庆', adcode: 500000, count: 28 },
  { name: '广西', adcode: 450000, count: 26 },
  { name: '云南', adcode: 530000, count: 24 },
  { name: '黑龙江', adcode: 230000, count: 22 },
  { name: '吉林', adcode: 220000, count: 20 },
  { name: '贵州', adcode: 520000, count: 20 },
  { name: '甘肃', adcode: 620000, count: 18 },
  { name: '内蒙古', adcode: 150000, count: 16 },
  { name: '新疆', adcode: 650000, count: 14 },
  { name: '上海', adcode: 310000, count: 12 },
  { name: '北京', adcode: 110000, count: 12 },
  { name: '天津', adcode: 120000, count: 10 },
  { name: '海南', adcode: 460000, count: 8 },
  { name: '宁夏', adcode: 640000, count: 6 },
  { name: '青海', adcode: 630000, count: 5 },
  { name: '西藏', adcode: 540000, count: 4 },
  { name: '香港', adcode: 810000, count: 3 },
  { name: '台湾', adcode: 710000, count: 2 },
  { name: '澳门', adcode: 820000, count: 1 },
]

const TOTAL = PROVINCES.reduce((s, p) => s + p.count, 0)
const BASE_TOTAL = TOTAL
const FULL_TICK_MS = 90000 // 约 1~2 分钟刷新一次
const DOCK_VISIBLE = 4 // 底部表格可见行数

/** 0~1 的确定性伪随机 */
function rand01(seed: number): number {
  const r = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return r - Math.floor(r)
}

/** 对一组数做 ±amp 扰动 */
function jitterSeq(base: number[], seed: number, amp = 0.06, min = 1): number[] {
  return base.map((v, i) =>
    Math.max(min, Math.round(v * (1 + (rand01(seed * 31 + i * 7.3) - 0.5) * 2 * amp))),
  )
}

/** 按比例缩放到总和恰好 = target（并修正取整误差） */
function fitToSum(vals: number[], target: number): number[] {
  const s = vals.reduce((a, b) => a + b, 0)
  if (!s || s === target) return vals
  const out = vals.map((v) => Math.max(1, Math.round((v * target) / s)))
  let diff = target - out.reduce((a, b) => a + b, 0)
  for (let i = 0; diff !== 0 && i < out.length * 40; i++) {
    const k = i % out.length
    if (diff > 0) {
      out[k] += 1
      diff -= 1
    } else if (out[k] > 1) {
      out[k] -= 1
      diff += 1
    }
  }
  return out
}

/** 环比百分比（数值，渲染时再补 +/- 号） */
function pctOf(v: number, base: number): number {
  return +(((v - base) / base) * 100).toFixed(1)
}

/* ——— 数字补间滚动 + 逐位翻牌 ——— */
function Num({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
}) {
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    const t0 = performance.now()
    const DUR = 700
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = from + (value - from) * eased
      fromRef.current = v
      setShown(v)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
      else fromRef.current = value
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return (
    <>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </>
  )
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
type ReelStyle = CSSProperties & { '--d': number }
type DockRowStyle = CSSProperties & { '--r': number }

function Digits({ text, unit }: { text: string; unit: string }) {
  return (
    <div className="ms-digits">
      {text.split('').map((d, i) => (
        <span className="ms-digit" key={i}>
          <span className="ms-digit-reel" style={{ '--d': Number(d) } as ReelStyle}>
            {DIGITS.map((n) => (
              <i key={n}>{n}</i>
            ))}
          </span>
        </span>
      ))}
      <em className="ms-kpi-unit">{unit}</em>
    </div>
  )
}

/* 顶栏日期 */
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const TODAY = new Date()
const TODAY_TEXT = `${TODAY.getFullYear()}年${String(TODAY.getMonth() + 1).padStart(2, '0')}月${String(
  TODAY.getDate(),
).padStart(2, '0')}日 ${WEEKDAYS[TODAY.getDay()]}`

/* ——— 排行 / 分布数据 ——— */
interface RankItem {
  name: string
  value: number
  delta?: number
}
interface DeptStat {
  name: string
  count: number
  join: number
  leave: number
}

const DEPT_STATS: DeptStat[] = [
  { name: '研发中心', count: 486, join: 8.6, leave: 3.2 },
  { name: '产品部', count: 212, join: 6.4, leave: 4.1 },
  { name: '市场部', count: 168, join: 9.2, leave: 5.3 },
  { name: '销售部', count: 154, join: 11.5, leave: 7.8 },
  { name: '职能中心', count: 132, join: 4.3, leave: 2.6 },
  { name: '人力资源部', count: 103, join: 5.1, leave: 3.9 },
  { name: '财务部', count: 96, join: 3.2, leave: 1.8 },
]

interface DistItem {
  name: string
  value: number
  color: string
}

const EDU_DIST: DistItem[] = [
  { name: '本科', value: 728, color: '#4fd8ff' },
  { name: '硕士', value: 476, color: '#4f9dff' },
  { name: '大专', value: 89, color: '#8f7dff' },
  { name: '博士', value: 58, color: '#ffd24a' },
]

const JOB_DIST: DistItem[] = [
  { name: '工程师', value: 520, color: '#4fd8ff' },
  { name: '高级工程师', value: 260, color: '#4f9dff' },
  { name: '技术员', value: 180, color: '#8f7dff' },
  { name: '产品经理', value: 96, color: '#35e0b0' },
  { name: '其他', value: 295, color: '#ffd24a' },
]

interface AgeBucket {
  label: string
  male: number
  female: number
}

/* 男女合计：男 764 / 女 587 = 1351 */
const AGE_DIST: AgeBucket[] = [
  { label: '≤25', male: 54, female: 42 },
  { label: '26-30', male: 212, female: 160 },
  { label: '31-35', male: 242, female: 176 },
  { label: '36-40', male: 138, female: 108 },
  { label: '41-45', male: 70, female: 58 },
  { label: '46-50', male: 33, female: 29 },
  { label: '50+', male: 15, female: 14 },
]

const TENURE_DIST: AgeBucket[] = [
  { label: '≤1年', male: 98, female: 76 },
  { label: '1-2年', male: 132, female: 104 },
  { label: '2-3年', male: 146, female: 118 },
  { label: '3-5年', male: 168, female: 121 },
  { label: '5-8年', male: 124, female: 86 },
  { label: '8年+', male: 96, female: 82 },
]

interface NewHire {
  name: string
  dept: string
  joined: string
  empId: string
  job: string
  edu: string
}

const RECENT_HIRES: NewHire[] = [
  { name: '张伟', dept: '研发中心', joined: '09-17', empId: 'GH26001', job: '工程师', edu: '硕士' },
  { name: '李思远', dept: '产品部', joined: '09-17', empId: 'GH26002', job: '产品经理', edu: '本科' },
  { name: '王梦琪', dept: '市场部', joined: '09-16', empId: 'GH26003', job: '市场专员', edu: '本科' },
  { name: '陈嘉豪', dept: '研发中心', joined: '09-16', empId: 'GH26004', job: '高级工程师', edu: '硕士' },
  { name: '刘雅雯', dept: '人力资源部', joined: '09-15', empId: 'GH26005', job: 'HR专员', edu: '本科' },
  { name: '赵子墨', dept: '销售部', joined: '09-15', empId: 'GH26006', job: '销售经理', edu: '大专' },
  { name: '孙一鸣', dept: '研发中心', joined: '09-14', empId: 'GH26007', job: '工程师', edu: '博士' },
  { name: '周欣怡', dept: '财务部', joined: '09-14', empId: 'GH26008', job: '会计', edu: '本科' },
  { name: '吴俊杰', dept: '职能中心', joined: '09-12', empId: 'GH26009', job: '行政专员', edu: '本科' },
  { name: '郑晓彤', dept: '产品部', joined: '09-11', empId: 'GH26010', job: '产品助理', edu: '硕士' },
  { name: '黄浩然', dept: '研发中心', joined: '09-10', empId: 'GH26011', job: '工程师', edu: '本科' },
  { name: '徐婉宁', dept: '市场部', joined: '09-09', empId: 'GH26012', job: '市场专员', edu: '本科' },
]

interface Kpi {
  label: string
  value: string
  unit: string
  delta: number
}

const AVA_GRADS: [string, string][] = [
  ['#2b6be0', '#57e0ff'],
  ['#1f7fd8', '#8ff0ff'],
  ['#4b6df0', '#9db8ff'],
  ['#1786c8', '#6fd0ff'],
  ['#3b7dff', '#a8ddff'],
  ['#2b8fd6', '#bfefff'],
]

/* ============ 排行榜（列表保留，图不改） ============ */
function RankPanel({ title, items, grow }: { title: string; items: RankItem[]; grow?: number }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <section className="ms-panel" style={{ flex: `${grow ?? 1} 1 0` }}>
      <div className="ms-panel-title">
        <i />
        {title}
      </div>
      <ul className="ms-rank">
        {items.map((it, i) => (
          <li key={it.name}>
            <span className="idx">{i + 1}</span>
            <span className="nm">{it.name}</span>
            <span className="bar">
              <span style={{ width: `${Math.round((it.value / max) * 100)}%` }} />
            </span>
            <span className="val">
              <Num value={it.value} />
            </span>
            {it.delta !== undefined && (
              <span className={'delta ' + (it.delta < 0 ? 'down' : 'up')}>
                <Num value={it.delta} decimals={1} prefix={it.delta >= 0 ? '+' : ''} suffix="%" />
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ============ 部门分布（列表保留，图不改） ============ */
function DeptPanel({ items, grow }: { items: DeptStat[]; grow?: number }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  const avg = (k: 'join' | 'leave') =>
    (items.reduce((s, i) => s + i[k], 0) / items.length).toFixed(1)

  return (
    <section className="ms-panel" style={{ flex: `${grow ?? 2} 1 0` }}>
      <div className="ms-panel-title">
        <i />
        部门分布
        <span className="ms-panel-tip">
          入职 {avg('join')}% · 离职 {avg('leave')}%
        </span>
      </div>
      <div className="ms-dept-head">
        <span>部门</span>
        <span />
        <span>人数</span>
        <span>入职</span>
        <span>离职</span>
      </div>
      <ul className="ms-dept-list">
        {items.map((it) => (
          <li key={it.name}>
            <span className="nm">{it.name}</span>
            <span className="bar">
              <span style={{ width: `${Math.round((it.count / max) * 100)}%` }} />
            </span>
            <span className="val">
              <Num value={it.count} />
            </span>
            <span className="rate up">
              <Num value={it.join} decimals={1} suffix="%" />
            </span>
            <span className="rate down">
              <Num value={it.leave} decimals={1} suffix="%" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ============ 3D 图表面板：图位置换成 ThreeUI 组件 ============ */
function StagePanel({
  title,
  legend,
  footer,
  grow,
  children,
}: {
  title: string
  legend?: ReactNode
  footer?: ReactNode
  grow?: number
  children: ReactNode
}) {
  return (
    <section className="ms-panel" style={{ flex: `${grow ?? 2} 1 0` }}>
      <div className="ms-panel-title">
        <i />
        {title}
        {legend && <span className="ms-age-legend">{legend}</span>}
      </div>
      <div className="bs3d-3dwrap">{children}</div>
      {footer && <div className="bs3d-legend">{footer}</div>}
    </section>
  )
}

const THREE_STYLE: CSSProperties = { height: '100%', width: '100%' }

export default function Bigscreen3D() {
  const [isFull, setIsFull] = useState(false)
  const [tick, setTick] = useState(0)

  /* 定时刷新 */
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), FULL_TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  /* 底部「最近入职」队列：每帧上顶一位 */
  const [dockQueue, setDockQueue] = useState<NewHire[]>(() =>
    RECENT_HIRES.slice(0, DOCK_VISIBLE + 1),
  )

  useEffect(() => {
    if (tick === 0) return
    setDockQueue((prev) => {
      const inQueue = new Set(prev.map((h) => h.empId))
      let idx = (tick * 5) % RECENT_HIRES.length
      let hire = RECENT_HIRES[idx]
      for (let g = 0; g < RECENT_HIRES.length && inQueue.has(hire.empId); g++) {
        idx = (idx + 1) % RECENT_HIRES.length
        hire = RECENT_HIRES[idx]
      }
      return [...prev.slice(1), hire]
    })
  }, [tick])

  /* 由 tick 推导出这一帧的所有数据（各分布之和 = 总人数） */
  const live = useMemo(() => {
    const provCounts = jitterSeq(PROVINCES.map((p) => p.count), tick + 1, 0.07)
    const provinces = PROVINCES.map((p, i) => ({ ...p, count: provCounts[i] }))
    const total = provinces.reduce((s, p) => s + p.count, 0)
    const provCount = provinces.filter((p) => p.count > 0).length

    const byName = new Map(provinces.map((p) => [p.name, p.count]))
    const rankHometown: RankItem[] = [...PROVINCES]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((p) => {
        const v = byName.get(p.name) ?? p.count
        return { name: p.name, value: v, delta: pctOf(v, p.count) }
      })

    const deptCounts = fitToSum(jitterSeq(DEPT_STATS.map((d) => d.count), tick + 11, 0.05), total)
    const deptStats: DeptStat[] = DEPT_STATS.map((d, i) => ({
      ...d,
      count: deptCounts[i],
      join: +(d.join * (1 + (rand01(tick * 17 + i) - 0.5) * 0.34)).toFixed(1),
      leave: +(d.leave * (1 + (rand01(tick * 23 + i) - 0.5) * 0.34)).toFixed(1),
    }))

    const eduDist = EDU_DIST.map((e, i) => ({
      ...e,
      value: fitToSum(jitterSeq(EDU_DIST.map((x) => x.value), tick + 31, 0.05), total)[i],
    }))
    const jobDist = JOB_DIST.map((j, i) => ({
      ...j,
      value: fitToSum(jitterSeq(JOB_DIST.map((x) => x.value), tick + 41, 0.05), total)[i],
    }))

    const maleShare = TENURE_DIST.reduce((s, t) => s + t.male, 0) / BASE_TOTAL
    const maleTarget = Math.round(total * maleShare)
    const femaleTarget = total - maleTarget

    const tenMale = fitToSum(jitterSeq(TENURE_DIST.map((t) => t.male), tick + 61, 0.06), maleTarget)
    const tenFemale = fitToSum(
      jitterSeq(TENURE_DIST.map((t) => t.female), tick + 71, 0.06),
      femaleTarget,
    )
    const tenureDist: AgeBucket[] = TENURE_DIST.map((t, i) => ({
      label: t.label,
      male: tenMale[i],
      female: tenFemale[i],
    }))

    const ageMale = fitToSum(jitterSeq(AGE_DIST.map((a) => a.male), tick + 81, 0.06), maleTarget)
    const ageFemale = fitToSum(jitterSeq(AGE_DIST.map((a) => a.female), tick + 91, 0.06), femaleTarget)
    const ageDist: AgeBucket[] = AGE_DIST.map((a, i) => ({
      label: a.label,
      male: ageMale[i],
      female: ageFemale[i],
    }))

    const hires = Math.max(6, Math.round(RECENT_HIRES.length * (1 + (rand01(tick * 89) - 0.5) * 0.5)))
    const devShare = Math.round((deptStats[0].count / total) * 100)
    const kpis: Kpi[] = [
      { label: '员工总数', value: String(total), unit: '人', delta: pctOf(total, BASE_TOTAL) },
      {
        label: '覆盖省级地区',
        value: String(provCount),
        unit: '个',
        delta: +(0.4 + rand01(tick * 7) * 2.2).toFixed(1),
      },
      { label: '本月入职', value: String(hires), unit: '人', delta: pctOf(hires, RECENT_HIRES.length) },
      {
        label: '研发中心占比',
        value: String(devShare),
        unit: '%',
        delta: pctOf(devShare, Math.round((DEPT_STATS[0].count / BASE_TOTAL) * 100)),
      },
    ]

    return { rankHometown, deptStats, eduDist, jobDist, tenureDist, ageDist, kpis }
  }, [tick])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.()
  }, [])

  useEffect(() => {
    const onFsChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  /* 图例：男女（司龄 / 年龄） */
  const genderLegend = (items: AgeBucket[]) => {
    const men = items.reduce((s, i) => s + i.male, 0)
    const women = items.reduce((s, i) => s + i.female, 0)
    return (
      <>
        <em>
          <i style={{ background: '#4fd8ff' }} />男 <Num value={men} />
        </em>
        <em>
          <i style={{ background: '#ff7fc0' }} />女 <Num value={women} />
        </em>
      </>
    )
  }

  /* 图例：各类占比（学历 / 职务） */
  const distLegend = (items: DistItem[]) => {
    const t = items.reduce((s, i) => s + i.value, 0)
    return items.map((it) => (
      <em key={it.name}>
        <i style={{ background: it.color }} />
        {it.name} <Num value={(it.value / t) * 100} decimals={1} suffix="%" />
      </em>
    ))
  }

  return (
    <div className="ms-screen">
      <div className="ms-halo" />

      {/* 中央「图」：原地图 → ThreeUI 3D 组件 */}
      <div className="bs3d-stage">
        <FlowField mode="dark" hue={200} style={THREE_STYLE} />
        <span className="bs3d-stage-tag">员工籍贯分布 · 3D 数据流场</span>
      </div>

      <div className="ms-vignette" />

      <header className="ms-topbar">
        <span className="ms-tb-date">{TODAY_TEXT}</span>
        <div className="ms-tb-title">
          <span className="ms-tb-deco l">
            <i />
            <i />
            <i />
          </span>
          <h1>员工籍贯分布 · 数据可视化大屏</h1>
          <span className="ms-tb-deco r">
            <i />
            <i />
            <i />
          </span>
        </div>
        <span className="ms-tb-status">
          <i />
          数据实时更新
        </span>
        <div className="ms-line" />
      </header>

      {/* 中央顶部：数据统计 */}
      <section className="ms-center-stats">
        <div className="ms-kpis">
          {live.kpis.map((k) => (
            <div className="ms-kpi" key={k.label}>
              <div className="ms-kpi-top">
                <span className="ms-kpi-label">{k.label}</span>
                <span className={'ms-kpi-badge' + (k.delta < 0 ? ' down' : ' up')}>
                  <Num value={k.delta} decimals={1} prefix={k.delta >= 0 ? '+' : ''} suffix="%" />
                </span>
              </div>
              <Digits text={k.value} unit={k.unit} />
            </div>
          ))}
        </div>
      </section>

      <div className="ms-ctrl">
        <button type="button" title={isFull ? '退出全屏' : '全屏'} onClick={toggleFullscreen}>
          {isFull ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        </button>
      </div>

      <div className="ms-col ms-col-left">
        <RankPanel title="籍贯排行 Top 6" items={live.rankHometown} grow={2} />
        <DeptPanel items={live.deptStats} />
        {/* 司龄分布：原折线图 → PerformanceGauges */}
        <StagePanel title="司龄分布" legend={genderLegend(live.tenureDist)}>
          <FlowField mode="dark" hue={170} style={THREE_STYLE} />
        </StagePanel>
      </div>

      <div className="ms-col ms-col-right">
        {/* 学历分布：原圆环图 → DiagnosticsPanel */}
        <StagePanel title="学历分布" footer={distLegend(live.eduDist)}>
          <ConnectivityGraph mode="dark" hue={195} style={THREE_STYLE} />
        </StagePanel>
        {/* 职务分布：原圆环图 → DiagnosticsPanel */}
        <StagePanel title="职务分布" footer={distLegend(live.jobDist)}>
          <ConnectivityGraph mode="dark" hue={270} style={THREE_STYLE} />
        </StagePanel>
        {/* 年龄分布：原折线图 → PerformanceGauges */}
        <StagePanel title="年龄分布" legend={genderLegend(live.ageDist)}>
          <FlowField mode="dark" hue={210} style={THREE_STYLE} />
        </StagePanel>
      </div>

      {/* 底部宽面板：最近入职人员 */}
      <section className="ms-dock">
        <div className="ms-dock-table">
          <div className="ms-dock-row ms-dock-th">
            <span>姓名</span>
            <span>工号</span>
            <span>所属部门</span>
            <span>职务</span>
            <span>学历</span>
            <span>入职时间</span>
          </div>
          <div className="ms-dock-view">
            {dockQueue.map((h, i) => {
              const r = i - (dockQueue.length - DOCK_VISIBLE)
              const g = AVA_GRADS[Number(h.empId.slice(-2)) % AVA_GRADS.length]
              return (
                <div
                  className={'ms-dock-row ms-dock-item' + (r >= 0 ? ' ms-row-enter' : '')}
                  key={h.empId}
                  style={{ transform: `translateY(${r * 100}%)`, '--r': r } as DockRowStyle}
                >
                  <span className="ms-dock-user">
                    <i
                      className="ms-dock-ava"
                      style={{ background: `linear-gradient(140deg, ${g[0]}, ${g[1]})` }}
                    >
                      {h.name.charAt(0)}
                    </i>
                    {h.name}
                  </span>
                  <span className="ms-dock-code">{h.empId}</span>
                  <span>{h.dept}</span>
                  <span>{h.job}</span>
                  <span className="ms-dock-edu">{h.edu}</span>
                  <span className="ms-dock-date">2026-{h.joined}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
