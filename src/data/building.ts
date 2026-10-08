/* 楼宇数据（程序化生成）
   — 本文件是「楼栋 3D / 楼层平面 / 工位详情」三层视图的唯一数据源，渲染层只读。
   — 现在用固定种子的确定性伪随机生成演示数据（刷新不变）；将来接入真实数据时，
     只需替换本文件的生成逻辑（或改为接口返回），三维与平面渲染代码不需要改动。
   — 平面图坐标系：0..100（宽）× 0..PLAN_H（高），与真实尺寸按比例映射。 */

export const PLAN_W = 100
export const PLAN_H = 58

/* 建筑尺寸（米）—— 供三维场景使用 */
export const BUILDING = {
  name: '星辉科技大厦',
  width: 36,
  depth: 22,
  floorHeight: 3.8,
  floorCount: 5,
  buildYear: 2019,
  address: '上海市浦东新区科苑路 88 号',
}

export interface Staff {
  id: string
  name: string
  dept: string
  title: string
  email: string
  joinDate: string
}

export type DeskStatus = '占用' | '空闲' | '预留'
export type DeskType = '标准工位' | '独立工位' | '临时工位'

export interface Desk {
  id: string
  floor: number
  roomId: string
  roomName: string
  type: DeskType
  status: DeskStatus
  /* 平面图坐标（工位方块中心） */
  x: number
  y: number
  equipment: string[]
  staff?: Staff
  since?: string
  note?: string
}

export type RoomKind = 'office' | 'meeting' | 'pantry' | 'other' | 'reception' | 'display'

export interface Room {
  id: string
  name: string
  kind: RoomKind
  /* 平面图矩形 */
  x: number
  y: number
  w: number
  h: number
  capacity: number
  note: string
}

export interface Floor {
  index: number
  label: string
  area: number
  usage: string
  rooms: Room[]
  desks: Desk[]
}

/* ---------- 确定性伪随机（mulberry32） ---------- */
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SURNAMES = '王李张刘陈杨赵黄周吴徐孙马朱胡林郭何高罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤'
const GIVEN = ['海涛', '一鸣', '子墨', '浩然', '雨欣', '思远', '嘉怡', '文博', '若彤', '宇轩', '静怡', '泽楷', '雅琪', '沐辰', '诗涵', '昊然', '锦程', '梦琪', '子睿', '欣怡', '逸凡', '婉清', '则成', '书瑶', '嘉豪', '雪松', '星河']

const DEPTS = [
  '数据科技部',
  '制度管理部',
  '人事中心',
  '组织发展部',
  '文档中心',
  '产品部',
  '市场部',
  '财务部',
  '综合管理部',
  '评审管理',
]

const TITLES = ['工程师', '高级工程师', '产品经理', '专员', '主管', '分析师', '设计师', '部门经理', '技术专家']

const EQUIP = [
  ['双屏显示器', '笔记本电脑', '耳麦'],
  ['单屏显示器', '笔记本电脑'],
  ['双屏显示器', '台式主机', '耳麦'],
  ['单屏显示器', '笔记本电脑', '外接键盘'],
  ['三屏显示器', '台式主机', '耳麦', '人体工学椅'],
]

const ROOM_NOTE: Record<string, string> = {
  办公A区: '开放工位区，靠近中庭采光',
  办公B区: '开放工位区，靠窗一侧',
  办公区: '大堂后侧的行政办公位',
  管理办公区: '管理层独立办公位，双人间的安静区域',
  财务办公区: '财务与综合办公位',
  会议室: '12 人会议桌 + 视频会议终端',
  大会议室: '16~20 人会议桌 + 双屏投屏',
  洽谈室: '4 人小桌，适合一对一沟通',
  贵宾洽谈: 'VIP 接待与商务洽谈',
  茶水间: '热水器、冰箱、休息小圆桌',
  打印区: '共享打印机与耗材柜',
  接待前台: '访客登记与引导服务',
  展示区: '企业文化与产品展示',
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, '0')
}

/* 每个办公区生成 rows × cols 的工位点阵 */
function genOfficeDesks(
  floorIndex: number,
  roomId: string,
  roomName: string,
  rect: { x: number; y: number; w: number; h: number },
  rows: number,
  cols: number,
  prefix: string,
  rng: () => number,
  staffPool: Staff[],
  poolCursor: { n: number },
): Desk[] {
  const desks: Desk[] = []
  const padX = rect.w / (cols + 1)
  const topPad = 10
  const bottomPad = 3
  const stepY = rows > 1 ? (rect.h - topPad - bottomPad) / (rows - 1) : 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = desks.length + 1
      const id = `${floorIndex}F-${prefix}-${pad(n)}`
      const roll = rng()
      /* 约 78% 占用、14% 空闲、8% 预留 */
      const status: DeskStatus = roll < 0.78 ? '占用' : roll < 0.92 ? '空闲' : '预留'
      const staff = status === '占用' ? staffPool[poolCursor.n++ % staffPool.length] : undefined
      const type: DeskType = prefix === 'A' && c === cols - 1 ? '独立工位' : rng() < 0.12 ? '临时工位' : '标准工位'
      desks.push({
        id,
        floor: floorIndex,
        roomId,
        roomName,
        type,
        status,
        x: +(rect.x + padX * (c + 1)).toFixed(2),
        y: +(rect.y + topPad + stepY * r).toFixed(2),
        equipment: status === '空闲' ? ['单屏显示器'] : pick(EQUIP, rng),
        staff,
        since: staff ? `${2021 + Math.floor(rng() * 5)}-${pad(1 + Math.floor(rng() * 12))}-${pad(1 + Math.floor(rng() * 27))}` : undefined,
        note: status === '预留' ? '已分配给新入职批次，待启用' : undefined,
      })
    }
  }
  return desks
}

/* 每层的房间布局（相对平面图坐标）—— 各层结构不同，更有真实感 */
interface LayoutEntry {
  id: string
  name: string
  kind: RoomKind
  x: number
  y: number
  w: number
  h: number
  cap: number
  rows: number
  cols: number
  prefix: string
}

const ROOM_LAYOUTS: Record<number, LayoutEntry[]> = {
  /* 1F 大堂：接待前台 + 展示区 + 大会议室，只有少量办公位 */
  1: [
    { id: 'R', name: '接待前台', kind: 'reception', x: 4, y: 4, w: 40, h: 26, cap: 4, rows: 0, cols: 0, prefix: 'R' },
    { id: 'D', name: '展示区', kind: 'display', x: 48, y: 4, w: 20, h: 26, cap: 0, rows: 0, cols: 0, prefix: 'D' },
    { id: 'M', name: '大会议室', kind: 'meeting', x: 72, y: 4, w: 24, h: 26, cap: 20, rows: 0, cols: 0, prefix: 'M' },
    { id: 'V', name: '贵宾洽谈', kind: 'meeting', x: 4, y: 34, w: 26, h: 20, cap: 4, rows: 0, cols: 0, prefix: 'V' },
    { id: 'A', name: '办公区', kind: 'office', x: 34, y: 34, w: 28, h: 20, cap: 8, rows: 2, cols: 4, prefix: 'A' },
    { id: 'P', name: '茶水间', kind: 'pantry', x: 66, y: 34, w: 30, h: 20, cap: 4, rows: 0, cols: 0, prefix: 'P' },
  ],
  /* 2F 研发层：大开间办公 + 一排支持用房 */
  2: [
    { id: 'A', name: '办公A区', kind: 'office', x: 4, y: 4, w: 44, h: 30, cap: 20, rows: 4, cols: 5, prefix: 'A' },
    { id: 'B', name: '办公B区', kind: 'office', x: 52, y: 4, w: 30, h: 30, cap: 9, rows: 3, cols: 3, prefix: 'B' },
    { id: 'M', name: '会议室', kind: 'meeting', x: 4, y: 38, w: 24, h: 16, cap: 10, rows: 0, cols: 0, prefix: 'M' },
    { id: 'P', name: '茶水间', kind: 'pantry', x: 32, y: 38, w: 18, h: 16, cap: 4, rows: 0, cols: 0, prefix: 'P' },
    { id: 'S', name: '打印区', kind: 'other', x: 54, y: 38, w: 14, h: 16, cap: 2, rows: 0, cols: 0, prefix: 'S' },
    { id: 'T', name: '洽谈室', kind: 'meeting', x: 72, y: 38, w: 24, h: 16, cap: 4, rows: 0, cols: 0, prefix: 'T' },
  ],
  /* 3F 研发层：双办公区 + 支持用房一排 */
  3: [
    { id: 'A', name: '办公A区', kind: 'office', x: 4, y: 4, w: 44, h: 30, cap: 12, rows: 3, cols: 4, prefix: 'A' },
    { id: 'B', name: '办公B区', kind: 'office', x: 52, y: 4, w: 30, h: 30, cap: 12, rows: 3, cols: 4, prefix: 'B' },
    { id: 'M', name: '会议室', kind: 'meeting', x: 4, y: 38, w: 26, h: 16, cap: 12, rows: 0, cols: 0, prefix: 'M' },
    { id: 'T', name: '洽谈室', kind: 'meeting', x: 34, y: 38, w: 20, h: 16, cap: 4, rows: 0, cols: 0, prefix: 'T' },
    { id: 'P', name: '茶水间', kind: 'pantry', x: 58, y: 38, w: 20, h: 16, cap: 6, rows: 0, cols: 0, prefix: 'P' },
    { id: 'S', name: '打印区', kind: 'other', x: 82, y: 38, w: 14, h: 16, cap: 2, rows: 0, cols: 0, prefix: 'S' },
  ],
  /* 4F 研发层（镜像布局）：支持用房在上、两个办公区在下 */
  4: [
    { id: 'M', name: '会议室', kind: 'meeting', x: 4, y: 4, w: 26, h: 20, cap: 12, rows: 0, cols: 0, prefix: 'M' },
    { id: 'T', name: '洽谈室', kind: 'meeting', x: 34, y: 4, w: 18, h: 20, cap: 4, rows: 0, cols: 0, prefix: 'T' },
    { id: 'P', name: '茶水间', kind: 'pantry', x: 56, y: 4, w: 18, h: 20, cap: 6, rows: 0, cols: 0, prefix: 'P' },
    { id: 'S', name: '打印区', kind: 'other', x: 78, y: 4, w: 18, h: 20, cap: 2, rows: 0, cols: 0, prefix: 'S' },
    { id: 'A', name: '办公A区', kind: 'office', x: 4, y: 28, w: 44, h: 26, cap: 12, rows: 3, cols: 4, prefix: 'A' },
    { id: 'B', name: '办公B区', kind: 'office', x: 52, y: 28, w: 44, h: 26, cap: 15, rows: 3, cols: 5, prefix: 'B' },
  ],
  /* 5F 管理层：两个独立办公区 + 大会议室 */
  5: [
    { id: 'A', name: '管理办公区', kind: 'office', x: 4, y: 4, w: 44, h: 26, cap: 8, rows: 2, cols: 4, prefix: 'A' },
    { id: 'B', name: '财务办公区', kind: 'office', x: 52, y: 4, w: 44, h: 26, cap: 12, rows: 3, cols: 4, prefix: 'B' },
    { id: 'M', name: '大会议室', kind: 'meeting', x: 4, y: 34, w: 30, h: 20, cap: 16, rows: 0, cols: 0, prefix: 'M' },
    { id: 'T', name: '洽谈室', kind: 'meeting', x: 38, y: 34, w: 18, h: 20, cap: 4, rows: 0, cols: 0, prefix: 'T' },
    { id: 'P', name: '茶水间', kind: 'pantry', x: 60, y: 34, w: 16, h: 20, cap: 4, rows: 0, cols: 0, prefix: 'P' },
    { id: 'S', name: '打印区', kind: 'other', x: 80, y: 34, w: 16, h: 20, cap: 2, rows: 0, cols: 0, prefix: 'S' },
  ],
}

function build() {
  const rng = makeRng(20260919)

  /* 先造一批员工，按部门轮转分配 */
  const staffPool: Staff[] = Array.from({ length: 160 }, (_, i) => {
    const surname = SURNAMES[Math.floor(rng() * SURNAMES.length)]
    const given = pick(GIVEN, rng)
    const name = surname + given
    const dept = DEPTS[i % DEPTS.length]
    return {
      id: `E${1000 + i}`,
      name,
      dept,
      title: TITLES[Math.floor(rng() * TITLES.length)],
      email: `user${1000 + i}@xinghui.com`,
      joinDate: `${2018 + Math.floor(rng() * 8)}-${pad(1 + Math.floor(rng() * 12))}-${pad(1 + Math.floor(rng() * 27))}`,
    }
  })

  const poolCursor = { n: 0 }
  const floors: Floor[] = []

  for (let f = 1; f <= BUILDING.floorCount; f++) {
    const layout = ROOM_LAYOUTS[f] ?? []
    const rooms: Room[] = layout.map((r) => ({
      id: `${f}F-${r.id}`,
      name: r.name,
      kind: r.kind,
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      capacity: r.cap,
      note: ROOM_NOTE[r.name] ?? '',
    }))

    const desks: Desk[] = []
    layout.filter((r) => r.kind === 'office').forEach((r) => {
      desks.push(
        ...genOfficeDesks(f, `${f}F-${r.id}`, r.name, r, r.rows, r.cols, r.prefix, rng, staffPool, poolCursor),
      )
    })

    floors.push({
      index: f,
      label: `${f}F`,
      area: 780 + Math.round(rng() * 120),
      usage:
        f === 1
          ? '前台 · 接待 · 会议'
          : f === BUILDING.floorCount
            ? '管理层 · 综合办公'
            : '研发 · 产品 · 支持',
      rooms,
      desks,
    })
  }

  return { ...BUILDING, floors }
}

export const building = build()

/* ---------- 派生索引与统计 ---------- */

export const ALL_DESKS: Desk[] = building.floors.flatMap((f) => f.desks)

export const DESK_BY_ID: Record<string, Desk> = Object.fromEntries(ALL_DESKS.map((d) => [d.id, d]))

export const STAFF_BY_ID: Record<string, Staff> = Object.fromEntries(
  ALL_DESKS.filter((d) => d.staff).map((d) => [d.staff!.id, d.staff!]),
)

export const DESK_BY_STAFF: Record<string, Desk> = Object.fromEntries(
  ALL_DESKS.filter((d) => d.staff).map((d) => [d.staff!.id, d]),
)

export interface FloorStat {
  index: number
  label: string
  total: number
  occupied: number
  free: number
  reserved: number
  rate: number
  area: number
  usage: string
}

export const FLOOR_STATS: FloorStat[] = building.floors.map((f) => {
  const occupied = f.desks.filter((d) => d.status === '占用').length
  const free = f.desks.filter((d) => d.status === '空闲').length
  const reserved = f.desks.filter((d) => d.status === '预留').length
  return {
    index: f.index,
    label: f.label,
    total: f.desks.length,
    occupied,
    free,
    reserved,
    rate: f.desks.length ? occupied / f.desks.length : 0,
    area: f.area,
    usage: f.usage,
  }
})

export const TOTAL_DESK = ALL_DESKS.length
export const TOTAL_OCCUPIED = ALL_DESKS.filter((d) => d.status === '占用').length
export const TOTAL_AREA = building.floors.reduce((s, f) => s + f.area, 0)
export const DEPT_DIST = DEPTS.map((dept) => {
  const count = ALL_DESKS.filter((d) => d.staff?.dept === dept).length
  return { dept, count }
})
  .filter((d) => d.count > 0)
  .sort((a, b) => b.count - a.count)

/* 同一房间内的邻近工位（按平面距离取最近的两个） */
export function neighborsOf(desk: Desk, count = 2): Desk[] {
  const room = building.floors[desk.floor - 1].desks.filter((d) => d.roomId === desk.roomId && d.id !== desk.id)
  return room
    .map((d) => ({ d, dist: (d.x - desk.x) ** 2 + (d.y - desk.y) ** 2 }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count)
    .map((x) => x.d)
}

/* 工位变更记录（演示数据，确定性生成） */
export function deskHistory(desk: Desk): { date: string; text: string }[] {
  const rng = makeRng(desk.id.split('').reduce((s, ch) => s + ch.charCodeAt(0), 7))
  const rows: { date: string; text: string }[] = []
  if (desk.since) rows.push({ date: desk.since, text: `分配至 ${desk.roomName}，工位状态置为占用` })
  if (desk.equipment.length > 2) {
    rows.push({
      date: `2026-0${1 + Math.floor(rng() * 8)}-${pad(1 + Math.floor(rng() * 27))}`,
      text: `设备变更：登记 ${desk.equipment[0]}`,
    })
  }
  if (desk.status === '预留') rows.push({ date: '2026-09-12', text: '标记为预留，等待新入职批次启用' })
  if (desk.status === '空闲') rows.push({ date: '2026-08-28', text: '上一使用者退工位，完成清洁与设备回收入库' })
  rows.push({ date: '2026-07-01', text: '半年度工位盘点：位置与设备核对一致' })
  return rows
}
