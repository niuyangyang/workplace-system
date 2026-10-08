import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { PlusOutlined, MinusOutlined, ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import './mapScreen.css'

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

const MAP_NAME = 'china-provinces'
const TOTAL = PROVINCES.reduce((s, p) => s + p.count, 0)
const HOME_ZOOM = 1.25
const ZOOM_STEP = 0.25

/* ——— 定时刷新：以 tick 为种子做确定性扰动 ———
   同一 tick 内所有模块共用同一个「总人数」，各分布按比例缩放到总和一致，
   所以刷新后各面板之间依然自洽（不会出现总数 1352、部门合计却是 1348）。
   刷新频率较低（约 90s ≈ 1~2 分钟一次），避免频繁跳动、更适合大屏常驻展示。 */
const BASE_TOTAL = TOTAL
const FULL_TICK_MS = 90000
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

/** 最大余额法：把 total 按 weights 拆分成非负整数（小数值省份也能精确拆分，不会像 fitToSum 一样被 min=1 托底） */
function splitByWeights(total: number, weights: number[]): number[] {
  const s = weights.reduce((a, b) => a + b, 0) || 1
  const raw = weights.map((w) => (w / s) * total)
  const base = raw.map((v) => Math.floor(v))
  let rem = total - base.reduce((a, b) => a + b, 0)
  const order = raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f)
  const out = [...base]
  for (let k = 0; rem > 0 && k < order.length; k++, rem--) out[order[k].i]++
  return out
}

/** 环比百分比（数值，渲染时再补 +/- 号，方便做补间） */
function pctOf(v: number, base: number): number {
  return +(((v - base) / base) * 100).toFixed(1)
}

/** 纵轴「好刻度」上限（保证 5 档刻度整除） */
const NICE_MAX = [20, 40, 60, 80, 100, 120, 200, 300, 400, 500, 600, 800, 1000]

/* ——— 更「顺滑」的数值呈现：数字补间滚动 + 逐位翻牌 ——— */

/** 用 rAF 把数字缓动到目标值（只有这个叶子组件重渲染，不牵连整棵树） */
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
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
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

/** 积分器式逐位翻牌：每位是一卷 0~9 的滚轮，位数变了就滚到对应数字 */
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


/* 顶栏日期（与参考图一致：YYYY年MM月DD日 星期X） */
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const TODAY = new Date()
const TODAY_TEXT = `${TODAY.getFullYear()}年${String(TODAY.getMonth() + 1).padStart(2, '0')}月${String(
  TODAY.getDate(),
).padStart(2, '0')}日 ${WEEKDAYS[TODAY.getDay()]}`

/* ——— 排行 / 分布数据（演示数据） ——— */
interface RankItem {
  name: string
  value: number
  delta?: number // 环比 %
}

/* 左列中：各部门人数 + 入职 / 离职率（%）（基础值，运行时会被扰动） */
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

/* ——— 环形图分布（学历 / 职务，与总人数 1351 对齐）——— */
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

/* ——— 年龄分布（柱状图：横轴年龄、纵轴人数，合计 1351）——— */
interface AgeBucket {
  label: string
  male: number
  female: number
}

/* 男女合计：男 764 / 女 587 = 1351（与司龄模块口径一致） */
const AGE_DIST: AgeBucket[] = [
  { label: '≤25', male: 54, female: 42 },
  { label: '26-30', male: 212, female: 160 },
  { label: '31-35', male: 242, female: 176 },
  { label: '36-40', male: 138, female: 108 },
  { label: '41-45', male: 70, female: 58 },
  { label: '46-50', male: 33, female: 29 },
  { label: '50+', male: 15, female: 14 },
]

/* ——— 司龄分布（柱状图：横轴司龄、纵轴人数，每档再分男女，合计 1351）——— */
interface TenureBucket {
  label: string
  male: number
  female: number
}

const TENURE_DIST: TenureBucket[] = [
  { label: '≤1年', male: 98, female: 76 },
  { label: '1-2年', male: 132, female: 104 },
  { label: '2-3年', male: 146, female: 118 },
  { label: '3-5年', male: 168, female: 121 },
  { label: '5-8年', male: 124, female: 86 },
  { label: '8年+', male: 96, female: 82 },
]

/* ——— 地图中央：最近入职员工（演示数据）——— */
interface NewHire {
  name: string
  dept: string
  joined: string // 入职日期 MM-DD
  empId: string // 工号
  job: string // 职务
  edu: string // 学历
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

/* ——— 顶部指标（参考图格式：标签 + 环比徽标 + 逐位数字方块） ——— */
interface Kpi {
  label: string
  value: string
  unit: string
  delta: number
}

/** 头像渐变（同色系，避免花哨） */
const AVA_GRADS: [string, string][] = [
  ['#2b6be0', '#57e0ff'],
  ['#1f7fd8', '#8ff0ff'],
  ['#4b6df0', '#9db8ff'],
  ['#1786c8', '#6fd0ff'],
  ['#3b7dff', '#a8ddff'],
  ['#2b8fd6', '#bfefff'],
]

/* 颜色分档（与底部图例一致）：低→高 = 深蓝 → 亮青 → 暖黄 */
function colorOf(t: number): { fill: string; border: string } {
  if (t >= 0.62) return { fill: '#ffc156', border: '#ffd98a' }
  if (t >= 0.36) return { fill: '#46d6ff', border: '#9ff0ff' }
  if (t >= 0.20) return { fill: '#289ee0', border: '#6fd2ff' }
  if (t >= 0.10) return { fill: '#2372c4', border: '#5aa8f0' }
  return { fill: '#1b4c92', border: '#3f8ce0' }
}

type Status = 'loading' | 'ready' | 'nodata'

/* ——— 南海诸岛（九段线 + 岛礁）从主图里拆出来，单独画一个小图 ———
   合规：南海诸岛必须保留；但它们把整体包围盒一路拉到北纬 3.8°，
   会让主图被压得很小（aspect ≈ 0.93）。拆出后主图 aspect ≈ 1.31，能撑满中央区域。 */
const NANHAI_MAX_LAT = 18
const NANHAI_MAP = 'china-nanhai'

function splitNanhai(geo: any): { main: any; nanhai: any | null } {
  const mainFeatures: any[] = []
  const islandPolys: number[][][][] = []
  for (const f of geo.features) {
    const coords = f?.geometry?.coordinates
    if (f?.geometry?.type !== 'MultiPolygon' || !Array.isArray(coords)) {
      mainFeatures.push(f)
      continue
    }
    const keep: number[][][][] = []
    for (const poly of coords) {
      let minLat = Infinity
      for (const ring of poly) for (const pt of ring) if (pt[1] < minLat) minLat = pt[1]
      if (minLat < NANHAI_MAX_LAT) islandPolys.push(poly)
      else keep.push(poly)
    }
    if (keep.length) {
      mainFeatures.push({ ...f, geometry: { type: 'MultiPolygon', coordinates: keep } })
    }
  }
  const nanhai = islandPolys.length
    ? {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: '南海诸岛' },
            geometry: { type: 'MultiPolygon', coordinates: islandPolys },
          },
        ],
      }
    : null
  return { main: { ...geo, features: mainFeatures }, nanhai }
}

/* ============ 地图悬停科技风：省份几何中心 + 悬停状态 ============ */
/* 用「最大环包围盒中心」近似省份中心（主图已拆掉南海诸岛，海南中心即海南岛），
   再经 chart.convertToPixel 换算成屏幕锚点，供引线 / 光点 / 小面板定位 */
function featureCenters(geo: any): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>()
  for (const f of geo.features) {
    const name: string | undefined = f?.properties?.name
    const coords = f?.geometry?.coordinates
    if (!name || !Array.isArray(coords)) continue
    const polys: number[][][][] =
      f.geometry.type === 'MultiPolygon' ? coords : f.geometry.type === 'Polygon' ? [coords] : []
    let best: [number, number] | null = null
    let bestArea = -1
    for (const poly of polys) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const ring of poly) {
        for (const pt of ring) {
          if (pt[0] < minX) minX = pt[0]
          if (pt[0] > maxX) maxX = pt[0]
          if (pt[1] < minY) minY = pt[1]
          if (pt[1] > maxY) maxY = pt[1]
        }
      }
      const area = (maxX - minX) * (maxY - minY)
      if (area > bestArea) {
        bestArea = area
        best = [(minX + maxX) / 2, (minY + maxY) / 2]
      }
    }
    if (best) out.set(name, best)
  }
  return out
}

/** 悬停小面板的锚点（省份中心，坐标相对 .ms-chart 容器）
   面板朝外(指向屏幕边缘)的摆位在渲染时按容器尺寸实时算出 */
interface HoverInfo {
  name: string
  x: number
  y: number
}

/* ============ 排行面板 ============ */
function RankPanel({
  title,
  items,
  activeName,
  onEnter,
  onLeave,
  scroll,
  grow,
}: {
  title: string
  items: RankItem[]
  activeName?: string | null
  onEnter?: (name: string) => void
  onLeave?: () => void
  scroll?: boolean
  grow?: number
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  const interactive = !!onEnter
  return (
    <section
      className={'ms-panel' + (interactive ? ' is-interactive' : '') + (scroll ? ' is-scroll' : '')}
      /* flex-basis 0 + grow 按比例 → 面板严格按比例分栏（左列 1:1、右列 7:7），
         与内容多少无关；内容超出时由滚动/裁剪兜底，永不溢出 */
      style={{ flex: `${grow ?? items.length} 1 0` }}
    >
      <div className="ms-panel-title">
        <i />
        {title}
        {interactive && <span className="ms-panel-tip">悬停联动地图</span>}
      </div>
      <ul className="ms-rank">
        {items.map((it, i) => (
          <li
            key={it.name}
            className={activeName === it.name ? 'is-active' : undefined}
            onMouseEnter={onEnter ? () => onEnter(it.name) : undefined}
            onMouseLeave={onLeave}
          >
            <span className="idx">{i + 1}</span>
            <span className="nm">{it.name}</span>
            <span className="bar"><span style={{ width: `${Math.round((it.value / max) * 100)}%` }} /></span>
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

/* ============ 部门分布：部门名 + 人数 + 入职 / 离职率 ============ */
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

/* ============ 男女分布折线图（司龄 / 年龄共用） ============ */
interface GenderBucket {
  label: string
  male: number
  female: number
}

function buildLineOption(items: GenderBucket[], ymax: number): echarts.EChartsOption {
  return {
    backgroundColor: 'transparent',
    animationDuration: 700,
    animationDurationUpdate: 700,
    animationEasingUpdate: 'cubicOut',
    grid: { left: 30, right: 10, top: 12, bottom: 20 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,32,62,0.96)',
      borderColor: 'rgba(87,224,255,0.6)',
      borderWidth: 1,
      padding: [7, 10],
      textStyle: { color: '#dff2ff', fontSize: 12 },
      extraCssText: 'box-shadow:0 0 14px rgba(87,224,255,.4);border-radius:7px;',
    },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.label),
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(63,150,235,.35)' } },
      axisTick: { show: false },
      axisLabel: { color: '#5f86b5', fontSize: 9.5 },
    },
    yAxis: {
      type: 'value',
      max: ymax,
      splitNumber: 4,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#5f86b5', fontSize: 9.5 },
      splitLine: { lineStyle: { color: 'rgba(63,150,235,.16)' } },
    },
    series: [
      {
        name: '男',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        data: items.map((i) => i.male),
        lineStyle: { width: 2, color: '#4fd8ff' },
        itemStyle: { color: '#4fd8ff', borderColor: '#0a1e3c', borderWidth: 1 },
      },
      {
        name: '女',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
        data: items.map((i) => i.female),
        lineStyle: { width: 2, color: '#ff7fc0' },
        itemStyle: { color: '#ff7fc0', borderColor: '#0a1e3c', borderWidth: 1 },
      },
    ],
  } as echarts.EChartsOption
}

function GenderLinePanel({
  title,
  items,
  grow,
}: {
  title: string
  items: GenderBucket[]
  grow?: number
}) {
  const el = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const men = items.reduce((s, i) => s + i.male, 0)
  const women = items.reduce((s, i) => s + i.female, 0)

  /* 初始化（只做一次） */
  useEffect(() => {
    if (!el.current) return
    const chart = echarts.init(el.current)
    chartRef.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el.current)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  /* 数据变化时 merge 更新 → ECharts 自动做过渡动画 */
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const max = Math.max(...items.flatMap((i) => [i.male, i.female]), 1)
    const ymax = NICE_MAX.find((v) => v >= max) ?? Math.ceil(max / 1000) * 1000
    chart.setOption(buildLineOption(items, ymax))
  }, [items])

  return (
    <section className="ms-panel" style={{ flex: `${grow ?? 2} 1 0` }}>
      <div className="ms-panel-title">
        <i />
        {title}
        <span className="ms-age-legend">
          <em>
            <i style={{ background: '#4fd8ff' }} />男 <Num value={men} />
          </em>
          <em>
            <i style={{ background: '#ff7fc0' }} />女 <Num value={women} />
          </em>
        </span>
      </div>
      <div className="ms-line-chart" ref={el} />
    </section>
  )
}

/* ============ 环形分布模块（学历 / 职务） ============ */
/* 同心圆环弧：每类一圈，圆弧长度 = 占比，底下一圈灰色轨道，圆角端帽，从 12 点顺时针 */
function ArcRings({ items }: { items: DistItem[] }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  const n = items.length
  const R_OUT = 45 // viewBox 100×100 下的外圈半径
  const R_IN = 22 // 最内圈半径（中间留出空腔放文字）
  const step = n > 1 ? (R_OUT - R_IN) / (n - 1) : 0
  const w = Math.max(2.4, step * 0.68) // 环宽，环间留缝

  return (
    <svg className="ms-arc" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      {items.map((it, i) => {
        const r = R_OUT - i * step
        const circ = 2 * Math.PI * r
        const len = Math.max(0.01, (it.value / total) * circ)
        return (
          <g key={it.name}>
            {/* 轨道 */}
            <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(96,140,196,.26)" strokeWidth={w} />
            {/* 数值弧 */}
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth={w}
              strokeLinecap="round"
              strokeDasharray={`${len} ${circ - len}`}
              transform="rotate(-90 50 50)"
            />
          </g>
        )
      })}
    </svg>
  )
}

function DonutPanel({ title, items, grow }: { title: string; items: DistItem[]; grow?: number }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  const top = items.reduce((a, b) => (b.value > a.value ? b : a), items[0])

  return (
    <section className="ms-panel" style={{ flex: `${grow ?? 2} 1 0` }}>
      <div className="ms-panel-title">
        <i />
        {title}
      </div>
      <div className="ms-donut-body">
        <div className="ms-donut-chart">
          <ArcRings items={items} />
          <div className="ms-donut-center">
            <b>
              <Num value={(top.value / total) * 100} decimals={1} suffix="%" />
            </b>
            <em>{top.name}</em>
          </div>
        </div>
        <ul className="ms-donut-legend">
          {items.map((it) => (
            <li key={it.name}>
              <span className="dot" style={{ background: it.color }} />
              <span className="nm">{it.name}</span>
              <span className="pct">
                <Num value={(it.value / total) * 100} decimals={1} suffix="%" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function MapScreen() {
  const chartEl = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const insetEl = useRef<HTMLDivElement>(null)

  const [status, setStatus] = useState<Status>('loading')
  const [activeProvince, setActiveProvince] = useState<string | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [isFull, setIsFull] = useState(false)
  const [tick, setTick] = useState(0)

  /* 各省几何中心（经纬度），地图加载后填充；悬停时换算成屏幕锚点 */
  const centersRef = useRef<Map<string, [number, number]>>(new Map())
  const hoverRef = useRef<HoverInfo | null>(null)
  hoverRef.current = hover

  /* 由省份名算出中心锚点（屏幕坐标，相对 .ms-chart 容器）。
     面板「朝地图外指向屏幕边缘」的摆位延迟到渲染时按容器尺寸计算。 */
  const showHover = useCallback((name: string) => {
    const chart = chartRef.current
    const el = chartEl.current
    const c = centersRef.current.get(name)
    if (!chart || !el || !c) return
    const pt = chart.convertToPixel({ seriesIndex: 0 }, c) as number[] | null
    if (!pt || !isFinite(pt[0]) || !isFinite(pt[1])) return
    setHover({ name, x: pt[0], y: pt[1] })
  }, [])

  /* ——— 定时刷新：每 FULL_TICK_MS 让数据变一次（用于演示「实时」效果） ——— */
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), FULL_TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  /* ——— 底部「最近入职」队列：每帧从下面顶进来一位，最上面一位顶出画面 ———
     队列比可见行数多 1：多出来的那行停在可视区上方（被 overflow 裁掉），
     淘汰时直接移除它就「看不见地」退场，不会有突然消失的突兀感。 */
  const [dockQueue, setDockQueue] = useState<NewHire[]>(() =>
    RECENT_HIRES.slice(0, DOCK_VISIBLE + 1),
  )

  /* ——— 由 tick 推导出这一帧的所有数据（各分布之和 = 总人数，保持自洽） ——— */
  const live = useMemo(() => {
    // 1) 省份人数 → 总人数的唯一来源
    const provCounts = jitterSeq(PROVINCES.map((p) => p.count), tick + 1, 0.07)
    const provinces = PROVINCES.map((p, i) => ({ ...p, count: provCounts[i] }))
    const max = Math.max(...provinces.map((p) => p.count))
    const total = provinces.reduce((s, p) => s + p.count, 0)
    const provCount = provinces.filter((p) => p.count > 0).length

    // 2) 籍贯 Top 6（顺序按基础值固定，避免行来回跳位）
    const byName = new Map(provinces.map((p) => [p.name, p.count]))
    const rankHometown: RankItem[] = [...PROVINCES]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((p) => {
        const v = byName.get(p.name) ?? p.count
        return { name: p.name, value: v, delta: pctOf(v, p.count) }
      })

    // 3) 部门（人数缩放到总人数；入职/离职率小幅波动）
    const deptCounts = fitToSum(jitterSeq(DEPT_STATS.map((d) => d.count), tick + 11, 0.05), total)
    const deptStats: DeptStat[] = DEPT_STATS.map((d, i) => ({
      ...d,
      count: deptCounts[i],
      join: +(d.join * (1 + (rand01(tick * 17 + i) - 0.5) * 0.34)).toFixed(1),
      leave: +(d.leave * (1 + (rand01(tick * 23 + i) - 0.5) * 0.34)).toFixed(1),
    }))

    // 4) 学历 / 职务 / 年龄 / 司龄：各自扰动后缩放到总人数
    const eduDist = EDU_DIST.map((e, i) => ({
      ...e,
      value: fitToSum(jitterSeq(EDU_DIST.map((x) => x.value), tick + 31, 0.05), total)[i],
    }))
    const jobDist = JOB_DIST.map((j, i) => ({
      ...j,
      value: fitToSum(jitterSeq(JOB_DIST.map((x) => x.value), tick + 41, 0.05), total)[i],
    }))
    // 4.1) 男女总人数（司龄 / 年龄两个模块共用，保证口径一致）
    const maleShare = TENURE_DIST.reduce((s, t) => s + t.male, 0) / BASE_TOTAL
    const maleTarget = Math.round(total * maleShare)
    const femaleTarget = total - maleTarget

    const tenMale = fitToSum(jitterSeq(TENURE_DIST.map((t) => t.male), tick + 61, 0.06), maleTarget)
    const tenFemale = fitToSum(
      jitterSeq(TENURE_DIST.map((t) => t.female), tick + 71, 0.06),
      femaleTarget,
    )
    const tenureDist: TenureBucket[] = TENURE_DIST.map((t, i) => ({
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

    // 4.2) 分省职务分布（地图悬停小面板用）：按全国职务占比拆到各省，
    //      每省用确定性扰动（种子含 adcode），并用最大余额法保证合计 = 该省人数
    const jobByProv = new Map<string, { total: number; jobs: DistItem[] }>()
    for (const p of provinces) {
      const weights = JOB_DIST.map(
        (j, ji) => j.value * (1 + (rand01(p.adcode * 7.91 + tick * 13.7 + ji * 3.7) - 0.5) * 0.6),
      )
      const parts = splitByWeights(p.count, weights)
      jobByProv.set(p.name, {
        total: p.count,
        jobs: JOB_DIST.map((j, ji) => ({ name: j.name, value: parts[ji], color: j.color })),
      })
    }

    // 5) 顶部指标
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

    const seriesData = provinces.map((p) => {
      const c = colorOf(p.count / max)
      return {
        name: p.name,
        value: p.count,
        itemStyle: { areaColor: c.fill, borderColor: c.border, borderWidth: 0.7 },
      }
    })

    // 底部表格的「下一位」在 dockQueue 的 effect 里按 tick 计算（需去重）

    return {
      provinces,
      total,
      max,
      rankHometown,
      deptStats,
      eduDist,
      jobDist,
      ageDist,
      tenureDist,
      jobByProv,
      kpis,
      seriesData,
    }
  }, [tick])

  /* 供 init 时读取最新一帧（避免把 live 放进 init effect 依赖里反复重建图表） */
  const liveRef = useRef(live)
  liveRef.current = live

  /* ——— 队列随 tick 上移：去掉最上面一位（在可视区外），把新的一位顶到最下面 ——— */
  useEffect(() => {
    if (tick === 0) return
    setDockQueue((prev) => {
      // 队列里已存在的人要跳过，否则会出现重复 key（同一人两次）
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

  /* ——— 组装 option（纯函数，无状态依赖） ——— */
  /* 悬停信息不再用 ECharts tooltip，由自定义「引线 + 小面板」取代 */
  const buildOption = useCallback((seriesData: unknown[]): echarts.EChartsOption => {
    return {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      series: [
        {
          type: 'map',
          map: MAP_NAME,
          roam: true,
          zoom: HOME_ZOOM,
          scaleLimit: { min: 0.6, max: 8 },
          selectedMode: false,
          label: { show: false },
          itemStyle: { areaColor: '#16467f', borderColor: '#4a9bff', borderWidth: 0.7 },
          emphasis: {
            label: { show: true, color: '#eaf6ff', fontSize: 12 },
            itemStyle: { areaColor: '#b9f5ff', borderColor: '#ffffff', borderWidth: 1.6 },
          },
          data: seriesData as any,
        },
      ],
    } as echarts.EChartsOption
  }, [])

  /* ——— 南海诸岛小图 option ——— */
  const buildInsetOption = useCallback(
    (): echarts.EChartsOption =>
      ({
        backgroundColor: 'transparent',
        animation: false,
        series: [
          {
            type: 'map',
            map: NANHAI_MAP,
            roam: false,
            silent: true,
            label: { show: false },
            itemStyle: { areaColor: '#63b8f0', borderColor: '#cdefff', borderWidth: 0.4 },
          },
        ],
      }) as echarts.EChartsOption,
    [],
  )

  /* ——— 交互控件 ——— */
  const zoomBy = useCallback((d: number) => {
    const chart = chartRef.current
    if (!chart) return
    const opt = chart.getOption() as any
    const cur = opt?.series?.[0]?.zoom ?? HOME_ZOOM
    chart.setOption({ series: [{ zoom: Math.max(0.6, Math.min(8, cur + d)) }] } as any)
  }, [])

  const resetView = useCallback(() => {
    chartRef.current?.setOption(buildOption(liveRef.current.seriesData), true)
  }, [buildOption])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.()
  }, [])

  useEffect(() => {
    const onFsChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  /* ——— 加载本地省界 GeoJSON（运行时零请求地图服务） ——— */
  useEffect(() => {
    let disposed = false
    ;(async () => {
      try {
        const res = await fetch('/china-provinces.json', { cache: 'no-store' })
        // 注意：dev server 对未知路径会回退到 index.html，因此必须校验内容是否为合法 GeoJSON
        const txt = await res.text()
        let geo: any = null
        try {
          geo = JSON.parse(txt)
        } catch {
          geo = null
        }
        if (!res.ok || !geo || !Array.isArray(geo.features) || !geo.features.length) {
          if (!disposed) setStatus('nodata')
          return
        }
        if (disposed) return

        // 拆出南海诸岛 → 主图 + 小图
        const { main, nanhai } = splitNanhai(geo)
        centersRef.current = featureCenters(main)

        echarts.registerMap(MAP_NAME, main)
        if (nanhai) echarts.registerMap(NANHAI_MAP, nanhai)
        setStatus('ready')
      } catch {
        if (!disposed) setStatus('nodata')
      }
    })()
    return () => {
      disposed = true
    }
  }, [])

  /* ——— 初始化图表 ——— */
  useEffect(() => {
    if (status !== 'ready' || !chartEl.current) return
    const chart = echarts.init(chartEl.current)
    chartRef.current = chart
    ;(window as any).__msChart = chart // 调试用：agent-browser 里可 convertToPixel 量坐标
    chart.setOption(buildOption(liveRef.current.seriesData), true)

    /* 悬停：激活榜行高亮 + 从区域中心引出科技风小面板 */
    let clearTimer = 0
    chart.on('mouseover', (p: any) => {
      window.clearTimeout(clearTimer)
      if (p && p.name) {
        setActiveProvince(p.name)
        showHover(p.name)
      }
    })
    const clearHover = () => {
      setActiveProvince(null)
      setHover(null)
    }
    /* 延迟一拍再清：跨省移动 / 强调标签顶到光标时紧跟的 mouseout 不至于让面板闪烁 */
    chart.on('mouseout', () => {
      window.clearTimeout(clearTimer)
      clearTimer = window.setTimeout(clearHover, 90)
    })
    chart.on('globalout', () => {
      window.clearTimeout(clearTimer)
      clearHover()
    })
    /* 拖拽 / 滚轮缩放后锚点会漂移，重算一次 */
    chart.on('georoam', () => {
      const h = hoverRef.current
      if (h) showHover(h.name)
    })

    /* 南海诸岛小图（合规保留，独立渲染，不参与交互） */
    let inset: echarts.ECharts | null = null
    if (insetEl.current) {
      inset = echarts.init(insetEl.current)
      inset.setOption(buildInsetOption())
    }

    const ro = new ResizeObserver(() => {
      chart.resize()
      inset?.resize()
      const h = hoverRef.current
      if (h) showHover(h.name)
    })
    ro.observe(chartEl.current)

    return () => {
      ro.disconnect()
      chart.dispose()
      inset?.dispose()
      chartRef.current = null
    }
  }, [status, buildOption, buildInsetOption, showHover])

  /* ——— 地图随时间刷新：merge 更新 data，不重置 roam / zoom ——— */
  useEffect(() => {
    if (status !== 'ready') return
    const chart = chartRef.current
    if (!chart) return
    chart.setOption({ series: [{ data: live.seriesData }] } as any)
  }, [status, live])

  return (
    <div className="ms-screen">
      <div className="ms-halo" />
      <div className="ms-chart" ref={chartEl} />
      <div className="ms-vignette" />

      {/* 南海诸岛（合规保留，独立小图） */}
      <div className="ms-inset">
        <div className="ms-inset-chart" ref={insetEl} />
        <span className="ms-inset-cap">南海诸岛</span>
      </div>

      {/* 地图悬停科技风：区域中心呼吸光点 + 生长引线 + 职务人数小面板 */}
      {status === 'ready' &&
        hover &&
        live.jobByProv.get(hover.name) &&
        (() => {
          const info = live.jobByProv.get(hover.name)!
          const w = chartEl.current?.clientWidth ?? window.innerWidth
          const h = chartEl.current?.clientHeight ?? window.innerHeight
          const cx = w / 2
          const cy = h / 2
          // 从地图中心指向省份中心的「向外」单位向量
          const vx = hover.x - cx
          const vy = hover.y - cy
          const mag = Math.hypot(vx, vy) || 1
          const ux = vx / mag
          const uy = vy / mag
          const side = ux >= 0 ? 1 : -1 // 面板放右侧(1)还是左侧(-1)，即箭头朝哪边「向外」
          const TIP_W = 218
          const EDGE = 12
          const PANEL_H = 184
          const L1 = 66
          // 面板不越过左右侧栏面板列（列宽 330，窄屏 350），贴地图中央列的内边缘
          const GUTTER = window.innerWidth <= 1280 ? 350 : 330
          const tipLeft = side > 0 ? w - GUTTER - EDGE - TIP_W : GUTTER + EDGE
          const connX = side > 0 ? tipLeft : tipLeft + TIP_W // 箭头接入面板的近边
          // 横线高度：沿径向竖直分量抬升（保底 18px 让斜段可见），必要时夹回屏内
          let lift = uy * L1
          if (Math.abs(lift) < 18) lift = 18
          const lineY = Math.max(PANEL_H / 2 + 6, Math.min(h - PANEL_H / 2 - 6, hover.y + lift))
          // 斜线终点取锚点与面板近边的水平中点 → 横段永不反折
          const elbowX = hover.x + (connX - hover.x) * 0.5
          const tipTop = lineY - PANEL_H / 2
          const lead = `M ${hover.x} ${hover.y} L ${elbowX} ${lineY} L ${connX} ${lineY}`
          const list = [...info.jobs].sort((a, b) => b.value - a.value)
          const maxJ = Math.max(...list.map((j) => j.value), 1)
          return (
            <div className="ms-hover-layer" key={hover.name}>
              <svg className="ms-hv-svg">
                <defs>
                  <marker
                    id="msHvArrow"
                    markerWidth="9"
                    markerHeight="9"
                    refX="6.6"
                    refY="4.5"
                    orient="auto"
                  >
                    <path d="M0,0 L9,4.5 L0,9 Z" fill="#57e0ff" />
                  </marker>
                </defs>
                <path
                  className="ms-hv-line"
                  d={lead}
                  pathLength={1}
                  markerEnd="url(#msHvArrow)"
                />
              </svg>
              <i className="ms-hv-dot" style={{ left: hover.x, top: hover.y }} />
              <i className="ms-hv-ring" style={{ left: hover.x, top: hover.y }} />
              <div className="ms-hv-tip" style={{ left: tipLeft, top: tipTop, width: TIP_W }}>
                <div className="ms-hv-head">
                  <b>{hover.name}</b>
                  <span>
                    籍贯员工 <b><Num value={info.total} /></b> 人
                  </span>
                </div>
                <ul className="ms-hv-list">
                  {list.map((j) => (
                    <li key={j.name}>
                      <i style={{ background: j.color }} />
                      <span className="nm">{j.name}</span>
                      <span className="bar">
                        <span
                          style={{ width: `${Math.round((j.value / maxJ) * 100)}%`, background: j.color }}
                        />
                      </span>
                      <span className="val">
                        <Num value={j.value} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })()}

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

      {/* 中央顶部：数据统计（标签 + 环比 + 逐位数字方块） */}
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
        <button type="button" title="放大" onClick={() => zoomBy(ZOOM_STEP)}><PlusOutlined /></button>
        <button type="button" title="缩小" onClick={() => zoomBy(-ZOOM_STEP)}><MinusOutlined /></button>
        <button type="button" title="复位视野" onClick={resetView}><ReloadOutlined /></button>
        <button type="button" title={isFull ? '退出全屏' : '全屏'} onClick={toggleFullscreen}>
          {isFull ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        </button>
      </div>

      <div className="ms-col ms-col-left">
        <RankPanel title="籍贯排行 Top 6" items={live.rankHometown} activeName={activeProvince} grow={2} />
        <DeptPanel items={live.deptStats} />
        <GenderLinePanel title="司龄分布" items={live.tenureDist} />
      </div>
      <div className="ms-col ms-col-right">
        <DonutPanel title="学历分布" items={live.eduDist} />
        <DonutPanel title="职务分布" items={live.jobDist} />
        <GenderLinePanel title="年龄分布" items={live.ageDist} />
      </div>

      {/* 底部宽面板：最近入职人员（队列式上顶，最新从下方进入） */}
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
              // r = 渲染槽位：最上面一位是 -1（停在可视区外，被裁掉）
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

      {status === 'loading' && <div className="ms-overlay">正在加载地图数据 …</div>}

      {status === 'nodata' && (
        <div className="ms-overlay ms-guide">
          <div className="ms-guide-card">
            <h3>缺少省界数据文件</h3>
            <p>
              本大屏使用 ECharts 渲染，<b>运行时不需要任何地图 Key、也不联网</b>，
              只需项目内存在一个静态数据文件：
            </p>
            <ol>
              <li>确认 <b>public/china-provinces.json</b> 存在（34 个省级行政区，约 0.9 MB）；</li>
              <li>若文件丢失，可在项目根目录执行 <b>npm run gen:geo -- --tk=你的天地图tk</b> 重新生成；</li>
              <li>生成后刷新本页即可（无需重启）。</li>
            </ol>
            <p className="ms-guide-tip">
              边界数据取自腾讯位置服务行政区划（合规白名单），已固化为本地静态文件；
              重新生成时也可改用天地图（国家地理信息公共服务平台），两者均符合地图合规要求。
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
