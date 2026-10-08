/* ===================== 会议室预订 · 共享数据（mock） ===================== */
import { ORG_PEOPLE, orgGroupName, orgLeafName } from './org'

export type Status = 'idle' | 'soon' | 'busy' | 'maint'

// 全系统仅一栋楼（星辉科技大厦），会议室不再区分楼宇/楼层
export const BUILDING_NAME = '星辉科技大厦'

export interface Room {
  id: string
  name: string
  code: string // 房间号，如 301
  capacity: number
  devices: string[]
  status: Status
  next: string // 下次可用 / 当前状态说明
}

export interface Booking {
  id: string
  roomId: string
  date: string // 星期标签：'周一' | '周二' | ... | '周五'
  start: string // 'HH:mm'
  end: string // 'HH:mm'
  title: string
  organizer: string
  attendees: string[]
}

// 周课表视图的星期维度（周一至周五）
export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'] as const
export const WEEKDAY_ORDER: Record<string, number> = {
  周一: 0,
  周二: 1,
  周三: 2,
  周四: 3,
  周五: 4,
}

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  idle: { label: '空闲中', color: '#16a34a' },
  soon: { label: '即将释放', color: '#f59e0b' },
  busy: { label: '使用中', color: '#ef4444' },
  maint: { label: '维护中', color: '#9aa3b2' },
}

export const ROOMS: Room[] = [
  { id: 'm1', name: '中枢报告厅', code: '101', capacity: 60, devices: ['投影', '视频会议', '音响'], status: 'idle', next: '空闲中 · 可立即预订' },
  { id: 'm2', name: '海棠会议室', code: '102', capacity: 12, devices: ['投影', '白板', '茶水'], status: 'soon', next: '14:30 后可用' },
  { id: 'm3', name: '梧桐洽谈间', code: '103', capacity: 6, devices: ['白板', '茶水'], status: 'idle', next: '空闲中 · 可立即预订' },
  { id: 'm4', name: '星河培训室', code: '104', capacity: 24, devices: ['投影', '视频会议', '音响', '白板'], status: 'busy', next: '使用中 · 17:00 后可用' },
  { id: 'm5', name: '云栖会议室', code: '201', capacity: 10, devices: ['投影', '视频会议'], status: 'idle', next: '空闲中 · 可立即预订' },
  { id: 'm6', name: '知微讨论间', code: '202', capacity: 4, devices: ['白板', '茶水'], status: 'maint', next: '维护中 · 预计明日恢复' },
  { id: 'm7', name: '明德大会议室', code: '203', capacity: 18, devices: ['投影', '视频会议', '音响'], status: 'soon', next: '15:00 后可用' },
  { id: 'm8', name: '听涛路演厅', code: '204', capacity: 40, devices: ['投影', '视频会议', '音响', '白板'], status: 'idle', next: '空闲中 · 可立即预订' },
  { id: 'm9', name: '砺剑会议室', code: '301', capacity: 12, devices: ['投影', '白板'], status: 'busy', next: '使用中 · 16:30 后可用' },
  { id: 'm10', name: '启明小组间', code: '302', capacity: 8, devices: ['白板', '茶水'], status: 'idle', next: '空闲中 · 可立即预订' },
  { id: 'm11', name: '济世报告厅', code: '303', capacity: 80, devices: ['投影', '视频会议', '音响'], status: 'soon', next: '13:30 后可用' },
  { id: 'm12', name: '清岚洽谈间', code: '304', capacity: 6, devices: ['白板', '茶水'], status: 'idle', next: '空闲中 · 可立即预订' },
  { id: 'm13', name: '逐月培训室', code: '401', capacity: 20, devices: ['投影', '视频会议', '音响'], status: 'busy', next: '使用中 · 18:00 后可用' },
  { id: 'm14', name: '栖梧会议室', code: '402', capacity: 14, devices: ['投影', '视频会议', '白板'], status: 'idle', next: '空闲中 · 可立即预订' },
  { id: 'm15', name: '破壁讨论间', code: '403', capacity: 5, devices: ['白板', '茶水'], status: 'soon', next: '14:00 后可用' },
  { id: 'm16', name: '远志小组间', code: '404', capacity: 8, devices: ['投影', '白板', '茶水'], status: 'idle', next: '空闲中 · 可立即预订' },
]

/* ---- 时间轴（30 分钟一格，09:00 - 18:00） ---- */
export const DAY_START = 9 * 60
export const DAY_END = 18 * 60
export const SLOT_MIN = 30 // 每个时间格的分钟数

export function minToHM(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function toMin(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

// 每格起点时间字符串，最后一格终点为 18:00
export const TIME_SLOTS: string[] = (() => {
  const arr: string[] = []
  for (let m = DAY_START; m < DAY_END; m += SLOT_MIN) arr.push(minToHM(m))
  return arr
})()

/* ---- 确定性生成每个会议室的预约记录（含参会人员） ---- */
const TITLE_POOL = [
  '周会', '项目评审', '需求对齐', '技术分享', '客户洽谈', '跨部门协调',
  '简历面试', '产品规划', '季度复盘', '一对一辅导', '设计评审', '数据复盘',
]

const AVATAR_GRADS = [
  'linear-gradient(135deg,#3b5bff,#6f8bff)',
  'linear-gradient(135deg,#0FB5A0,#34d3c2)',
  'linear-gradient(135deg,#6366f1,#8b8cf8)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#7c5cff,#a78bfa)',
  'linear-gradient(135deg,#0891b2,#22d3ee)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ef4444,#fb7185)',
]

/* ---- 人员数据以「人员组织」为唯一事实源（src/data/org.ts） ---- */
const STAFF = ORG_PEOPLE.filter((p) => p.status !== '离职')
const NAME_POOL = STAFF.map((p) => p.name)

export interface PersonProfile {
  name: string
  dept: string
  title: string
  avatar: string
  initial: string
}
export function getPerson(name: string): PersonProfile {
  const h = hashStr(name)
  const found = ORG_PEOPLE.find((p) => p.name === name)
  return {
    name,
    dept: found ? orgGroupName(found.orgId) || orgLeafName(found.orgId) : '—',
    title: found ? found.position : '—',
    avatar: AVATAR_GRADS[h % AVATAR_GRADS.length],
    initial: name.slice(0, 1),
  }
}

/* ---- RSVP 回执（确定性派生：同一人稳定返回同一状态） ---- */
export type Rsvp = 'accept' | 'pending' | 'decline'
export const RSVP_META: Record<Rsvp, { label: string; color: string; bg: string }> = {
  accept: { label: '接受', color: '#16a34a', bg: '#e7f6ec' },
  pending: { label: '待定', color: '#c98a00', bg: '#fef3e2' },
  decline: { label: '拒绝', color: '#ef4444', bg: '#fdeaea' },
}
export function getRsvp(name: string): Rsvp {
  const m = hashStr(name) % 10
  return m < 7 ? 'accept' : m < 9 ? 'pending' : 'decline'
}

function hashStr(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle(arr: string[], rng: () => number) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function genBookings(room: Room): Booking[] {
  const rng = mulberry32(hashStr(room.id))
  const count = 4 + Math.floor(rng() * 4) // 4-7 条，铺满一周
  const out: Booking[] = []
  let bid = 0
  // 每个 (房间, 星期) 最多 2 条，避免单日重叠堆叠
  const used = new Set<string>()
  let guard = 0
  while (out.length < count && guard < count * 6) {
    guard++
    const date = WEEKDAYS[Math.floor(rng() * WEEKDAYS.length)]
    const maxStart = (DAY_END - DAY_START) / SLOT_MIN - 4 // 留至少 2h 余量
    const startMin = DAY_START + Math.floor(rng() * maxStart) * SLOT_MIN
    const durSlots = 2 + Math.floor(rng() * 4) // 1h - 2h30m
    const endMin = Math.min(DAY_END, startMin + durSlots * SLOT_MIN)
    const key = `${date}-${startMin}`
    if (used.has(`${date}-any`)) continue
    // 同星期内再放一条时避免与前一条时间重叠
    const overlap = out.some(
      (b) =>
        b.date === date &&
        toMin(b.start) < endMin &&
        toMin(b.end) > startMin,
    )
    if (overlap) continue
    if (used.has(key)) continue
    used.add(key)
    if (out.filter((b) => b.date === date).length >= 2) {
      used.add(`${date}-any`)
      continue
    }
    const title = TITLE_POOL[Math.floor(rng() * TITLE_POOL.length)]
    const organizer = NAME_POOL[Math.floor(rng() * NAME_POOL.length)]
    const n = 2 + Math.floor(rng() * Math.min(Math.max(room.capacity - 2, 1), 10))
    const attendees = shuffle(NAME_POOL, rng).slice(0, n)
    out.push({
      id: `${room.id}-b${bid++}`,
      roomId: room.id,
      date,
      start: minToHM(startMin),
      end: minToHM(endMin),
      title,
      organizer,
      attendees,
    })
  }
  out.sort(
    (a, b) =>
      (WEEKDAY_ORDER[a.date] ?? 0) - (WEEKDAY_ORDER[b.date] ?? 0) ||
      a.start.localeCompare(b.start),
  )
  return out
}

export const BOOKINGS: Record<string, Booking[]> = Object.fromEntries(
  ROOMS.map((r) => [r.id, genBookings(r)]),
)
