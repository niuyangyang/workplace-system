import type { CSSProperties } from 'react'
import './mapScreen.css'
import './personaScreen.css'

const TODAY_TEXT = '2026-09-19'

/* ===== 画像示例数据（静态，便于先看指标形态） ===== */
const PROFILE = {
  name: '张明',
  initial: '张',
  level: 'P7',
  role: '高级数据分析师',
  dept: '数据科技部',
  tags: ['数据建模', 'BI 可视化', 'A/B 实验', 'SQL', 'Python'],
  rows: [
    ['工号', 'SC20190326'],
    ['部门', '数据科技部'],
    ['岗位', '高级数据分析师'],
    ['职级', 'P7 · 资深'],
    ['司龄', '6.5 年'],
    ['入职日期', '2019-03-26'],
    ['学历', '硕士 · 复旦大学'],
    ['直属上级', '王海涛'],
    ['办公地点', '上海 · 张江'],
  ],
}

/* 顶部四项核心指标（值用逐位翻牌展示） */
const KPIS = [
  { label: '综合能力评分', digits: '86.5', unit: '分', delta: 2.4 },
  { label: '岗位匹配度', digits: '92.4', unit: '%', delta: 1.8 },
  { label: '任务完成率', digits: '96.8', unit: '%', delta: 0.6 },
  { label: '协作活跃度', digits: '88', unit: '分', delta: -1.2 },
]

/* 能力标签：雷达六维 */
const ABILITIES = [
  { name: '数据分析', value: 92 },
  { name: '项目管理', value: 86 },
  { name: '沟通协作', value: 88 },
  { name: '业务洞察', value: 84 },
  { name: '技术实现', value: 79 },
  { name: '团队带教', value: 74 },
]

/* 行为偏好：行为指标 + 沟通渠道 */
const BEHAVIOR = [
  ['高效产出时段', '09:30 – 11:30'],
  ['平均响应时长', '12 分钟'],
  ['会议时间占比', '18%'],
  ['文档产出', '24 篇 / 月'],
  ['需求交付准时率', '94.6%'],
  ['近 30 天在线天数', '21 天'],
]
const CHANNELS = [
  { name: '即时消息', pct: 62 },
  { name: '邮件', pct: 26 },
  { name: '线下会议', pct: 12 },
]

/* 关联网络：协作 Top5 */
const COLLAB = [
  { name: '王海涛', dept: '数据科技部', times: 42, color: '#4fd8ff' },
  { name: '李思远', dept: '产品中心', times: 36, color: '#4f9dff' },
  { name: '陈静', dept: '数据科技部', times: 31, color: '#35e0b0' },
  { name: '赵敏', dept: '市场部', times: 24, color: '#ffd24a' },
  { name: '孙浩', dept: '财务部', times: 19, color: '#ff9d6e' },
]

/* 动态时间线（底部横向） */
const TIMELINE = [
  { date: '2026-09', title: '晋升 P7', desc: '高级数据分析师' },
  { date: '2026-06', title: '数据中台 PM', desc: '项目负责人' },
  { date: '2026-03', title: '季度之星', desc: 'Q1 优秀员工' },
  { date: '2025-11', title: '高级数据认证', desc: 'CDA Level Ⅲ' },
  { date: '2025-06', title: 'BI 平台改版', desc: '主导交付' },
  { date: '2024-12', title: '轮岗至数据科技部', desc: '内部转岗' },
]

const CYAN = '#8ceaff'
/* 左右镜像变换（以画布中线 x=220 为轴） */
const MIRROR = 'translate(440,0) scale(-1,1)'

/* ============ 几何工具：把「中心线采样 + 半宽」变成有机曲线轮廓 ============ */
type Sample = readonly [number, number, number] // x, y, 半宽

/** Catmull-Rom 闭曲线 → 三次贝塞尔（平滑穿过所有点） */
function closedSpline(pts: readonly (readonly [number, number])[]): string {
  const n = pts.length
  const f = (v: number) => v.toFixed(1)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + ' Z'
}

/** 肢体：沿中心线两侧按半宽偏移，再平滑收口（肌肉起伏 = 半宽序列） */
function limbPath(pts: readonly Sample[]): string {
  const n = pts.length
  const out: [number, number][] = []
  const inn: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    let tx = b[0] - a[0]
    let ty = b[1] - a[1]
    const L = Math.hypot(tx, ty) || 1
    tx /= L
    ty /= L
    const nx = ty
    const ny = -tx
    out.push([p[0] + nx * p[2], p[1] + ny * p[2]])
    inn.push([p[0] - nx * p[2], p[1] - ny * p[2]])
  }
  return closedSpline([...out, ...inn.reverse()])
}

/* ============ 真实人体解剖（7.5 头身：头高 79，总高 557） ============ */

/** 头颅 + 下颌（含颧骨、下巴收口） */
const HEAD = 'M220 25 C239 25 250 39 250 57 C250 68 247 77 242 85 C238 93 232 99 226 102 C222 104 218 104 214 102 C208 99 202 93 198 85 C193 77 190 68 190 57 C190 39 201 25 220 25 Z'
/** 颈（斜方肌起于颈根，上宽下窄由躯干覆盖衔接） */
const NECK = 'M200 80 C199 98 197 110 194 122 L246 122 C243 110 241 98 240 80 Z'
/** 躯干：肩峰 → 腋下 → 腰 → 髋外扩 → 腹股沟（男性比例，腰不过度内收） */
const TORSO = 'M238 110 C246 124 258 136 280 148 C273 174 268 196 268 216 C270 234 258 244 256 256 C256 274 268 282 268 300 C268 314 256 322 242 328 C234 336 206 336 198 328 C184 322 172 314 172 300 C172 282 184 274 184 256 C182 244 170 234 172 216 C172 196 167 174 160 148 C182 136 194 124 202 110 Z'
/** 右臂：三角肌 → 肱二头 → 肘 → 前臂 → 腕 → 掌 → 指 */
const ARM_R: readonly Sample[] = [
  [274, 158, 21],
  [288, 186, 20],
  [306, 220, 16],
  [322, 254, 13.5],
  [338, 292, 15.5],
  [352, 322, 12],
  [362, 344, 8.5],
  [366, 358, 11.5],
  [370, 374, 9.5],
]
/** 右腿：臀 → 大腿 → 膝 → 小腿肚 → 踝 */
const LEG_R: readonly Sample[] = [
  [244, 302, 29],
  [256, 336, 26],
  [268, 378, 22.5],
  [278, 424, 18],
  [284, 452, 16],
  [290, 486, 19],
  [297, 526, 12],
  [302, 560, 9.5],
]
/** 右脚（微外八，正面视角） */
const FOOT = 'M292 550 C285 562 287 576 298 580 C313 584 334 581 340 571 C344 564 338 555 328 552 C317 549 299 546 292 550 Z'
/** 拇指（让手读作「手」而非香肠） */
const THUMB = 'M347 350 C343 344 345 337 351 338 C357 339 360 346 358 353 C356 359 350 356 347 350 Z'

/** 右侧肢体路径集合（左侧用镜像复用） */
const LIMBS = [limbPath(ARM_R), limbPath(LEG_R), FOOT, THUMB]
/** 关节光点（肩 / 肘 / 腕 / 膝 / 踝） */
const NODES: readonly (readonly [number, number])[] = [
  [276, 160], [324, 256], [360, 342], [277, 452], [300, 556],
]
/** 侧向面部细节（眉 / 眼），镜像复用 */
const FACE_SIDE = ['M202 55 C206 52 213 52 216 55', 'M203 61 C207 58.5 213 58.5 217 61']
/** 中线面部细节（鼻 / 唇） */
const FACE_CENTER = [
  'M220 56 C219.6 64 219 70 218.6 75',
  'M214.5 78 C216.5 80.5 219.5 80.5 220 78',
  'M211 86 C215 84.5 225 84.5 229 86',
  'M211 86 C215 90 225 90 229 86',
]
/** 解剖缝线（锁骨 / 胸骨 / 髋前上棘），强化人体识别 */
const SEAMS = [
  'M206 130 C214 126 226 126 234 130',
  'M194 134 C204 128 236 128 246 134',
  'M220 140 L220 214',
  'M220 322 C212 312 206 306 204 298',
]

/* ============ 指标展示小组件 ============ */
/* 逐位翻牌用的 0~9 滚轮 */
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
type ReelStyle = CSSProperties & { '--d': number }

/** 数字逐位翻牌（'.' 渲染为小圆点分隔） */
function DigitBoxes({ text }: { text: string }) {
  return (
    <div className="ms-digits">
      {text.split('').map((ch, i) =>
        ch === '.' ? (
          <span className="pp-digit-dot" key={i}>
            .
          </span>
        ) : (
          <span className="ms-digit" key={i}>
            <span className="ms-digit-reel" style={{ '--d': Number(ch) } as ReelStyle}>
              {DIGITS.map((n) => (
                <i key={n}>{n}</i>
              ))}
            </span>
          </span>
        )
      )}
    </div>
  )
}

/** 能力雷达（纯 SVG 六边形，随容器等比缩放） */
function Radar({ items }: { items: { name: string; value: number }[] }) {
  const CX = 100
  const CY = 100
  const R = 62
  const n = items.length
  const at = (i: number, r: number): [number, number] => {
    const a = ((-90 + (360 / n) * i) * Math.PI) / 180
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
  }
  const ring = (f: number) =>
    items.map((_, i) => at(i, R * f).map((v) => v.toFixed(1)).join(',')).join(' ')
  const area = items
    .map((it, i) => at(i, (it.value / 100) * R).map((v) => v.toFixed(1)).join(','))
    .join(' ')

  return (
    <svg className="pp-radar" viewBox="0 0 200 200" role="img" aria-label="能力雷达">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} className="pp-radar-ring" points={ring(f)} />
      ))}
      {items.map((it, i) => {
        const [x, y] = at(i, R)
        return <line key={it.name} className="pp-radar-axis" x1={CX} y1={CY} x2={x} y2={y} />
      })}
      <polygon className="pp-radar-area" points={area} />
      {items.map((it, i) => {
        const [x, y] = at(i, (it.value / 100) * R)
        return <circle key={it.name} className="pp-radar-node" cx={x} cy={y} r="2.6" />
      })}
      {items.map((it, i) => {
        const [x, y] = at(i, R + 13)
        return (
          <text key={it.name} className="pp-radar-label" x={x} y={y} textAnchor="middle" dy="3.2">
            {it.name}
          </text>
        )
      })}
    </svg>
  )
}

/* 全息网格拓扑「真实人体建模」：
   - 解剖轮廓（头颅/斜方肌/腰臀/四肢肌肉起伏）用样条生成，读作真人
   - 体表铺菱形发光网格，头部用更细网格并透出五官
   - 双描边自发光线框、地面透视光轨、脚下光斑、两侧 HUD */
function PersonaFigure() {
  const ORBIT = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180
    return [220 + 186 * Math.cos(a), 316 + 186 * Math.sin(a)] as [number, number]
  })
  const HUD_L = [16, 26, 10, 22, 28, 12, 24, 18, 26, 10, 20, 24, 14, 22]
  const HUD_R = [22, 12, 26, 16, 22, 10, 28, 14, 20, 24, 12, 18, 24, 10]
  const RAYS = Array.from({ length: 13 }, (_, i) => 220 + (i - 6) * 108)

  return (
    <svg className="ps-svg" viewBox="0 0 440 660" preserveAspectRatio="xMidYMid meet" role="img" aria-label="人物全身全息网格建模">
      <defs>
        <linearGradient id="psBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(22,74,150,.52)" />
          <stop offset="55%" stopColor="rgba(14,54,120,.44)" />
          <stop offset="100%" stopColor="rgba(8,36,84,.36)" />
        </linearGradient>
        <radialGradient id="psHeadGrad" cx="46%" cy="34%" r="76%">
          <stop offset="0%" stopColor="rgba(212,250,255,.70)" />
          <stop offset="55%" stopColor="rgba(120,208,252,.32)" />
          <stop offset="100%" stopColor="rgba(50,140,230,.10)" />
        </radialGradient>
        {/* 菱形网格拓扑：两方向斜线交叉 */}
        <pattern id="psMeshA" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(33)">
          <line x1="0" y1="0" x2="0" y2="11" stroke="rgba(122,224,255,.92)" strokeWidth="1.1" />
        </pattern>
        <pattern id="psMeshB" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-33)">
          <line x1="0" y1="0" x2="0" y2="11" stroke="rgba(104,212,255,.8)" strokeWidth="1.1" />
        </pattern>
        {/* 头部细网格（更密，呈面部拓扑感） */}
        <pattern id="psMeshFineA" width="6.5" height="6.5" patternUnits="userSpaceOnUse" patternTransform="rotate(37)">
          <line x1="0" y1="0" x2="0" y2="6.5" stroke="rgba(150,232,255,.85)" strokeWidth="0.8" />
        </pattern>
        <pattern id="psMeshFineB" width="6.5" height="6.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-37)">
          <line x1="0" y1="0" x2="0" y2="6.5" stroke="rgba(130,220,255,.7)" strokeWidth="0.8" />
        </pattern>
        {/* 横向全息细纹 */}
        <pattern id="psScanTex" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(160,232,255,.4)" strokeWidth="0.8" />
        </pattern>
        <linearGradient id="psBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(130,235,255,0)" />
          <stop offset="50%" stopColor="rgba(190,248,255,.95)" />
          <stop offset="100%" stopColor="rgba(130,235,255,0)" />
        </linearGradient>
        <linearGradient id="psCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(90,210,255,.18)" />
          <stop offset="100%" stopColor="rgba(90,210,255,0)" />
        </linearGradient>
        <radialGradient id="psHaze" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(70,175,255,.30)" />
          <stop offset="60%" stopColor="rgba(50,130,240,.12)" />
          <stop offset="100%" stopColor="rgba(30,80,180,0)" />
        </radialGradient>
        <radialGradient id="psGround" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(150,235,255,.42)" />
          <stop offset="100%" stopColor="rgba(90,190,255,0)" />
        </radialGradient>
        <filter id="psGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="psGlowBig" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* 人体轮廓集合（填充 / 描边 / 裁剪复用） */}
        <g id="psBody">
          <path d={HEAD} />
          <path d={NECK} />
          <path d={TORSO} />
          {LIMBS.map((d, i) => (
            <path key={'r' + i} d={d} />
          ))}
          {LIMBS.map((d, i) => (
            <path key={'l' + i} d={d} transform={MIRROR} />
          ))}
        </g>
        <clipPath id="psClip">
          <use href="#psBody" />
        </clipPath>
        <clipPath id="psHeadClip">
          <path d={HEAD} />
        </clipPath>
        <clipPath id="psFloorClip">
          <rect x="0" y="450" width="440" height="210" />
        </clipPath>
      </defs>

      {/* 人物背后的中央辉光 */}
      <ellipse className="ps-haze" cx="220" cy="300" rx="200" ry="272" fill="url(#psHaze)" />

      {/* 地面透视光轨（消失点在腰部以下） */}
      <g className="ps-floor" clipPath="url(#psFloorClip)">
        {RAYS.map((x, i) => (
          <line key={'r' + i} x1="220" y1="480" x2={x} y2="660" />
        ))}
        {[560, 590, 614, 638, 654].map((y, i) => (
          <line key={'h' + i} x1="16" y1={y} x2="424" y2={y} className="ps-floor-h" opacity={0.62 - i * 0.1} />
        ))}
      </g>

      {/* 包裹力场环 */}
      <g className="ps-rings">
        <circle className="ps-ring ps-ring-1" cx="220" cy="320" r="212" />
        <circle className="ps-ring ps-ring-2" cx="220" cy="320" r="182" />
        <circle className="ps-ring ps-ring-3" cx="220" cy="320" r="154" />
      </g>

      {/* 投影光锥 */}
      <path className="ps-cone" d="M104 580 L336 580 L256 120 L184 120 Z" fill="url(#psCone)" />

      {/* 脚下光斑 + 投影基座 */}
      <ellipse className="ps-ground-glow" cx="220" cy="574" rx="132" ry="28" fill="url(#psGround)" />
      <ellipse className="ps-base" cx="220" cy="582" rx="140" ry="20" />
      <ellipse className="ps-base-ring" cx="220" cy="582" rx="102" ry="14" />
      <line className="ps-base-line" x1="58" y1="582" x2="382" y2="582" />

      {/* 人体本体：深色底 → 菱形网格拓扑 */}
      <use href="#psBody" fill="url(#psBodyGrad)" />
      <use href="#psBody" fill="url(#psMeshA)" />
      <use href="#psBody" fill="url(#psMeshB)" />

      {/* 头部：亮面 + 细网格 + 五官 */}
      <g clipPath="url(#psHeadClip)">
        <use href="#psBody" fill="url(#psHeadGrad)" />
        <use href="#psBody" fill="url(#psMeshFineA)" />
        <use href="#psBody" fill="url(#psMeshFineB)" />
        <g className="ps-face">
          {FACE_CENTER.map((d, i) => (
            <path key={'fc' + i} d={d} />
          ))}
          <g>
            {FACE_SIDE.map((d, i) => (
              <path key={'fs' + i} d={d} />
            ))}
            <ellipse cx="209" cy="61" rx="3" ry="3" className="ps-face-iris" />
            <circle cx="209" cy="61" r="1.3" className="ps-face-pupil" />
            <ellipse cx="250" cy="64" rx="4.5" ry="8.5" className="ps-face-ear" />
          </g>
          <g transform={MIRROR}>
            {FACE_SIDE.map((d, i) => (
              <path key={'ms' + i} d={d} />
            ))}
            <ellipse cx="209" cy="61" rx="3" ry="3" className="ps-face-iris" />
            <circle cx="209" cy="61" r="1.3" className="ps-face-pupil" />
            <ellipse cx="250" cy="64" rx="4.5" ry="8.5" className="ps-face-ear" />
          </g>
        </g>
      </g>

      <use href="#psBody" fill="url(#psScanTex)" opacity=".3" />

      {/* 轮廓双描边：宽辉光晕 → 亮线 */}
      <use href="#psBody" fill="none" stroke="rgba(110,220,255,.34)" strokeWidth="5" filter="url(#psGlowBig)" />
      <use href="#psBody" fill="none" stroke={CYAN} strokeWidth="1.8" className="ps-body-stroke" filter="url(#psGlow)" />

      {/* 解剖缝线（锁骨 / 胸骨 / 髋前上棘） */}
      <g className="ps-detail" clipPath="url(#psClip)">
        {SEAMS.map((d, i) => (
          <path key={'s' + i} d={d} />
        ))}
      </g>

      {/* 关节光点（网格节点感，不做机械环） */}
      <g className="ps-joints">
        {NODES.map(([x, y], i) => (
          <circle key={'n' + i} className="ps-joint-glow" cx={x} cy={y} r="2.8" />
        ))}
        {NODES.map(([x, y], i) => (
          <circle key={'m' + i} className="ps-joint-glow" cx={x} cy={y} r="2.8" transform={MIRROR} />
        ))}
      </g>

      {/* 自上而下扫描光束 */}
      <rect className="ps-scan" x="52" y="16" width="336" height="5" fill="url(#psBeam)" clipPath="url(#psClip)" />

      {/* ===== HUD：左右表盘 + 数据条 + 边框刻线 ===== */}
      <g transform="translate(52,80)">
        <circle r="17" className="ps-hud-dial-ring" />
        <circle r="10" className="ps-hud-dial-core" />
        <line x1="-17" y1="0" x2="17" y2="0" className="ps-hud-dial-cross" />
        <line x1="0" y1="-17" x2="0" y2="17" className="ps-hud-dial-cross" />
        <circle r="17" className="ps-hud-dial-tick" />
      </g>
      <g>
        {HUD_L.map((w, i) => (
          <rect key={'l' + i} className="ps-hud-line" x="32" y={120 + i * 11} width={w} height="2.4" rx="1.2" opacity={0.75 - (i % 4) * 0.13} />
        ))}
        <line x1="20" y1="108" x2="20" y2="292" className="ps-hud-frame" strokeDasharray="3 7" />
      </g>
      <g transform="translate(388,80)">
        <circle r="17" className="ps-hud-dial-ring" />
        <circle r="10" className="ps-hud-dial-core" />
        <line x1="-17" y1="0" x2="17" y2="0" className="ps-hud-dial-cross" />
        <line x1="0" y1="-17" x2="0" y2="17" className="ps-hud-dial-cross" />
        <circle r="17" className="ps-hud-dial-tick" />
      </g>
      <g>
        {HUD_R.map((w, i) => (
          <rect key={'r' + i} className="ps-hud-line" x="378" y={120 + i * 11} width={w} height="2.4" rx="1.2" opacity={0.75 - (i % 4) * 0.13} />
        ))}
        <line x1="420" y1="108" x2="420" y2="292" className="ps-hud-frame" strokeDasharray="3 7" />
      </g>
      <g className="ps-hud-frame">
        <path d="M16 42 L16 20 L38 20" fill="none" />
        <path d="M424 42 L424 20 L402 20" fill="none" />
        <path d="M16 616 L16 638 L38 638" fill="none" />
        <path d="M424 616 L424 638 L402 638" fill="none" />
      </g>

      {/* 环绕数据节点 */}
      <g className="ps-orbit">
        {ORBIT.map(([x, y], i) => (
          <g key={'o' + i}>
            <line x1="220" y1="316" x2={x} y2={y} className="ps-orbit-link" />
            <circle cx={x} cy={y} r="4" className="ps-orbit-dot" />
          </g>
        ))}
      </g>
    </svg>
  )
}

export default function PersonaScreen() {
  return (
    <div className="ms-screen">
      <div className="ms-halo" />

      {/* 中央：真实人体全息网格建模（2D，非 3D） */}
      <div className="ps-figure">
        <div className="ps-stage">
          <PersonaFigure />
        </div>
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
          <h1>人物画像</h1>
          <span className="ms-tb-deco r">
            <i />
            <i />
            <i />
          </span>
        </div>
        <span className="ms-tb-status">
          <i />
          实时建档
        </span>
        <div className="ms-line" />
      </header>

      {/* 顶部中央：四项核心指标（逐位翻牌） */}
      <section className="ms-center-stats">
        <div className="ms-kpis">
          {KPIS.map((k) => (
            <div className="ms-kpi" key={k.label}>
              <div className="ms-kpi-top">
                <span className="ms-kpi-label">{k.label}</span>
                <span className={'ms-kpi-badge' + (k.delta < 0 ? ' down' : ' up')}>
                  {k.delta > 0 ? '+' : ''}
                  {k.delta.toFixed(1)}%
                </span>
              </div>
              <div className="ms-kpi-top">
                <DigitBoxes text={k.digits} />
                <em className="ms-kpi-unit">{k.unit}</em>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 左侧：基本信息 + 能力标签 */}
      <div className="ms-col ms-col-left">
        <section className="ms-panel" style={{ flex: '1 1 0' }}>
          <div className="ms-panel-title">
            <i />
            基本信息
            <span className="ms-panel-tip">档案 · 实时</span>
          </div>
          <div className="pp-profile">
            <span className="pp-avatar">{PROFILE.initial}</span>
            <div className="pp-profile-main">
              <div className="pp-name">
                {PROFILE.name}
                <em>{PROFILE.level}</em>
              </div>
              <div className="pp-sub">
                {PROFILE.role} · {PROFILE.dept}
              </div>
            </div>
          </div>
          <ul className="pp-kv">
            {PROFILE.rows.map(([k, v]) => (
              <li key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </li>
            ))}
          </ul>
          <div className="pp-tags">
            {PROFILE.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>

        <section className="ms-panel" style={{ flex: '1 1 0' }}>
          <div className="ms-panel-title">
            <i />
            能力标签
            <span className="ms-panel-tip">六维 · 百分制</span>
          </div>
          <div className="pp-radar-body">
            <Radar items={ABILITIES} />
          </div>
        </section>
      </div>

      {/* 右侧：行为偏好 + 关联网络 */}
      <div className="ms-col ms-col-right">
        <section className="ms-panel" style={{ flex: '1 1 0' }}>
          <div className="ms-panel-title">
            <i />
            行为偏好
            <span className="ms-panel-tip">近 30 天</span>
          </div>
          <ul className="pp-rows">
            {BEHAVIOR.map(([k, v]) => (
              <li key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </li>
            ))}
          </ul>
          <div className="pp-sub-title">沟通渠道偏好</div>
          <ul className="pp-chans">
            {CHANNELS.map((c) => (
              <li key={c.name}>
                <span className="nm">{c.name}</span>
                <span className="bar">
                  <span style={{ width: `${c.pct}%` }} />
                </span>
                <span className="val">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ms-panel" style={{ flex: '1 1 0' }}>
          <div className="ms-panel-title">
            <i />
            关联网络
            <span className="ms-panel-tip">协作 Top5</span>
          </div>
          <ul className="pp-net">
            {COLLAB.map((c, i) => (
              <li key={c.name}>
                <span className="idx">{i + 1}</span>
                <span className="ava" style={{ backgroundColor: c.color }}>
                  {c.name.slice(0, 1)}
                </span>
                <span className="who">
                  <b>{c.name}</b>
                  <em>{c.dept}</em>
                </span>
                <span className="bar">
                  <span style={{ width: `${(c.times / COLLAB[0].times) * 100}%` }} />
                </span>
                <span className="val">{c.times} 次</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 底部：动态时间线（横向） */}
      <section className="ms-dock">
        <div className="ms-panel-title" style={{ marginBottom: 10 }}>
          <i />
          动态时间线
          <span className="ms-panel-tip">关键成长轨迹</span>
        </div>
        <ol className="pp-timeline">
          {TIMELINE.map((t, i) => (
            <li key={t.date} className={i === 0 ? 'is-latest' : undefined}>
              <span className="date">{t.date}</span>
              <span className="node">
                <i />
              </span>
              <span className="title">{t.title}</span>
              <span className="desc">{t.desc}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
