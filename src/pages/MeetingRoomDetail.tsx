import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { type ReactNode } from 'react'
import { App as AntdApp, Button, Drawer, Empty, Input, Layout, Select, Tabs, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  CoffeeOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
  BorderOutlined,
  PaperClipOutlined,
  RightOutlined,
  SoundOutlined,
  TeamOutlined,
  UploadOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import AppFooter from '../components/Footer'
import {
  BOOKINGS,
  BUILDING_NAME,
  DAY_END,
  ROOMS,
  STATUS_META,
  DAY_START,
  RSVP_META,
  TIME_SLOTS,
  SLOT_MIN,
  WEEKDAYS,
  WEEKDAY_ORDER,
  getPerson,
  getRsvp,
  minToHM,
  type Booking,
} from '../data/meeting'
import { ORG_TREE, ORG_PEOPLE, type OrgNode } from '../data/org'
import './home.css'
import './meeting.css'
import './meetingDetail.css'

const { Content } = Layout
const ROW_H = 44 // 每 30 分钟格高度(px)
const N = TIME_SLOTS.length

/* ---------- 视图素材 ---------- */
const DEVICE_ICON: Record<string, ReactNode> = {
  投影: <DesktopOutlined />,
  视频会议: <VideoCameraOutlined />,
  白板: <BorderOutlined />,
  音响: <SoundOutlined />,
  茶水: <CoffeeOutlined />,
}
/* 会议室实景封面（AI 生成照片，存于 public/meeting/，与列表页一致） */
const COVERS = [
  'url(/meeting/room-1.webp)', // 报告厅
  'url(/meeting/room-2.webp)', // 大会议室（长桌）
  'url(/meeting/room-3.webp)', // 洽谈间（圆桌）
  'url(/meeting/room-4.webp)', // 培训室
  'url(/meeting/room-5.webp)', // 视频会议室
  'url(/meeting/room-6.webp)', // 小讨论间
]
const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

/* ---- 组织树选人用的辅助（数据来自「人员组织」src/data/org.ts） ---- */
const ORG_STAFF = ORG_PEOPLE.filter((p) => p.status !== '离职')
function findOrgNode(nodes: OrgNode[], id: string): OrgNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const f = findOrgNode(n.children, id)
      if (f) return f
    }
  }
  return null
}
function collectIds(n: OrgNode): string[] {
  const out: string[] = [n.id]
  ;(n.children || []).forEach((c) => out.push(...collectIds(c)))
  return out
}
/* 全部组织节点（含层级深度），供下拉选择 */
interface OrgFlatRow {
  id: string
  name: string
  depth: number
}
function flattenAllOrg(nodes: OrgNode[], depth = 0, acc: OrgFlatRow[] = []): OrgFlatRow[] {
  nodes.forEach((n) => {
    acc.push({ id: n.id, name: n.name, depth })
    if (n.children) flattenAllOrg(n.children, depth + 1, acc)
  })
  return acc
}

export default function MeetingRoomDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()

  const room = ROOMS.find((r) => r.id === id)
  const coverIdx = ROOMS.findIndex((r) => r.id === id)

  const [bookings, setBookings] = useState<Booking[]>(() => BOOKINGS[id ?? ''] ?? [])
  const [tab, setTab] = useState('book')
  const [selDay, setSelDay] = useState<number | null>(null)
  const [selStart, setSelStart] = useState<number | null>(null)
  const [selEnd, setSelEnd] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', note: '' })
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [files, setFiles] = useState<string[]>([])
  const [drawer, setDrawer] = useState<Booking | null>(null)
  // 组织选人：当前选中的组织节点
  const [pickNode, setPickNode] = useState<string>(ORG_TREE[0].id)

  // 每周每天每格的占用预约
  const weekInfo = useMemo(() => {
    return WEEKDAYS.map((d) => {
      const dbs = bookings.filter((b) => b.date === d)
      return TIME_SLOTS.map((_, i) => {
        const cs = toMin(TIME_SLOTS[i])
        const ce = i < N - 1 ? toMin(TIME_SLOTS[i + 1]) : DAY_END
        return dbs.find((b) => toMin(b.start) < ce && toMin(b.end) > cs) ?? null
      })
    })
  }, [bookings])

  const rangeLabel = useMemo(() => {
    if (selDay === null || selStart === null) return ''
    const end = selEnd ?? selStart
    const s = TIME_SLOTS[selStart]
    const e = end + 1 < N ? TIME_SLOTS[end + 1] : minToHM(DAY_END)
    return `${WEEKDAYS[selDay]} ${s} – ${e}（${toMin(e) - toMin(s)} 分钟）`
  }, [selDay, selStart, selEnd])

  const allRecords = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          (WEEKDAY_ORDER[a.date] ?? 0) - (WEEKDAY_ORDER[b.date] ?? 0) ||
          a.start.localeCompare(b.start),
      ),
    [bookings],
  )

  // 已选参会人的 RSVP 汇总（原型：确定性派生）
  const rsvpCount = useMemo(() => {
    let accept = 0
    let pending = 0
    let decline = 0
    ORG_STAFF.forEach((p) => {
      if (!invited.has(p.key)) return
      const s = getRsvp(p.name)
      if (s === 'accept') accept++
      else if (s === 'pending') pending++
      else decline++
    })
    return { accept, pending, decline }
  }, [invited])

  if (!room) {
    return (
      <Layout className="site-layout">
        <Navbar solid title="会议室预订" />
        <Content className="site-content">
          <div className="portal meeting-page">
            <div className="detail-back" onClick={() => navigate('/app/meeting')}>
              <ArrowLeftOutlined /> 返回会议室列表
            </div>
            <Empty description="未找到该会议室" />
          </div>
        </Content>
        <AppFooter />
      </Layout>
    )
  }

  const roomId = room.id
  const roomName = room.name

  function pick(day: number, i: number) {
    if (weekInfo[day][i]) return // 已约时段不可选
    if (selDay === null || selDay !== day || selEnd !== null) {
      setSelDay(day)
      setSelStart(i)
      setSelEnd(null)
    } else if (selStart === null) {
      setSelStart(i)
    } else if (i === selStart) {
      setSelStart(null)
      setSelDay(null)
    } else if (i > selStart) {
      setSelEnd(i)
    } else {
      setSelStart(i)
    }
  }

  function confirmBooking() {
    if (selDay === null || selStart === null || selEnd === null) return
    const end = selEnd
    const startHM = TIME_SLOTS[selStart]
    const endHM = end + 1 < N ? TIME_SLOTS[end + 1] : minToHM(DAY_END)
    const day = WEEKDAYS[selDay]
    const people = ORG_STAFF.filter((p) => invited.has(p.key)).map((p) => p.name)
    const newB: Booking = {
      id: `${roomId}-u${Date.now()}`,
      roomId: roomId,
      date: day,
      start: startHM,
      end: endHM,
      title: form.title.trim() || '我的预订',
      organizer: '我',
      attendees: people.length ? people : ['我'],
    }
    setBookings((prev) => [...prev, newB])
    message.success(`已提交「${roomName}」${day} ${startHM}-${endHM} 的预订`)
    setForm({ title: '', note: '' })
    setInvited(new Set())
    setFiles([])
    setSelDay(null)
    setSelStart(null)
    setSelEnd(null)
  }

  function clearSel() {
    setSelDay(null)
    setSelStart(null)
    setSelEnd(null)
  }

  function toggleInvite(pid: string) {
    setInvited((prev) => {
      const n = new Set(prev)
      n.has(pid) ? n.delete(pid) : n.add(pid)
      return n
    })
  }
  function toggleOrg(node: OrgNode, on: boolean) {
    const ids = collectIds(node)
    setInvited((prev) => {
      const n = new Set(prev)
      ORG_STAFF.forEach((p) => {
        if (!ids.includes(p.orgId)) return
        on ? n.add(p.key) : n.delete(p.key)
      })
      return n
    })
  }
  function addFiles(list: FileList | null) {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list).map((f) => f.name)])
  }

  /* ---------- 周课表视图 ---------- */
  const orgOptions = flattenAllOrg(ORG_TREE).map((o) => ({
    value: o.id,
    label: '\u00A0'.repeat(o.depth * 3) + o.name,
  }))
  const curOrg = findOrgNode(ORG_TREE, pickNode)
  const curIds = curOrg ? collectIds(curOrg) : []
  const curStaff = ORG_STAFF.filter((p) => curIds.includes(p.orgId))
  const allPicked = curStaff.length > 0 && curStaff.every((p) => invited.has(p.key))
  const selComplete = selDay !== null && selStart !== null && selEnd !== null
  const overCapacity = invited.size > room.capacity

  /* ---------- 周课表 + 预约面板（Master-Detail，零弹窗） ---------- */
  const weekGrid = (
    <div className="bk-layout">
      <div className="bk-main">
        <div className="wk">
          <div className="wk-head">
            <div className="wk-corner">时间</div>
            {WEEKDAYS.map((d) => (
              <div className="wk-day" key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="wk-body">
            <div className="wk-gutter">
              {TIME_SLOTS.map((t, i) => (
                <div className="wk-glabel" key={i} style={{ height: ROW_H }}>
                  {i % 4 === 0 ? <span>{t}</span> : null}
                </div>
              ))}
            </div>
            {WEEKDAYS.map((d, di) => {
              const dbs = bookings.filter((b) => b.date === d)
              return (
                <div className="wk-col" key={d} style={{ height: N * ROW_H }}>
                  {TIME_SLOTS.map((t, i) => {
                    const booked = weekInfo[di][i]
                    const selected =
                      selDay === di &&
                      selStart !== null &&
                      i >= selStart &&
                      i <= (selEnd ?? selStart)
                    const cls = [
                      'wk-cell',
                      booked ? 'is-booked' : 'is-free',
                      selected ? 'is-sel' : '',
                    ].join(' ')
                    return (
                      <div
                        key={i}
                        className={cls}
                        style={{ height: ROW_H }}
                        data-t={t}
                        title={booked ? `${booked.title} ${booked.start}-${booked.end}` : `${d} ${t} 空闲 · 点击选择`}
                        onClick={() => pick(di, i)}
                      />
                    )
                  })}
                  {dbs.map((b) => {
                    const top = ((toMin(b.start) - DAY_START) / SLOT_MIN) * ROW_H
                    const height = ((toMin(b.end) - toMin(b.start)) / SLOT_MIN) * ROW_H
                    return (
                      <div
                        key={b.id}
                        className="wk-ev"
                        style={{ top, height }}
                        title={`${b.title} ${b.start}-${b.end} · 点击查看详情`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDrawer(b)
                        }}
                      >
                        <span className="wk-ev-title">{b.title}</span>
                        <span className="wk-ev-time">
                          {b.start}-{b.end}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        <div className="wk-legend">
          <span className="lg lg-free" /> 空闲可约
          <span className="lg lg-booked" /> 已约
          <span className="lg lg-sel" /> 已选区间
        </div>
      </div>

      <aside className="bk-panel">
        <div className="bkp-sec">
          <div className="bkp-label">预约时段</div>
          {selDay !== null && selStart !== null ? (
            <div className="bkp-range">
              <div className="bkp-range-time">{rangeLabel}</div>
              <button type="button" className="bkp-clear" onClick={clearSel}>
                重选
              </button>
            </div>
          ) : (
            <div className="bkp-empty">在左侧点击空闲格子选起点，再点结束格完成区间</div>
          )}
        </div>

        <div className="bkp-sec">
          <div className="bkp-label">会议主题</div>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="如：项目周会"
          />
        </div>

        <div className="bkp-sec">
          <div className="bkp-label">
            参会人员
            <span className="book-hint">
              已选 {invited.size} / 可容 {room.capacity} 人
            </span>
          </div>
          <Select
            className="bkp-org"
            value={pickNode}
            onChange={(v) => setPickNode(v)}
            options={orgOptions}
            size="small"
          />
          <div className="bkp-people-head">
            <span>{curOrg?.name ?? '组织'} · {curStaff.length} 人</span>
            <button
              type="button"
              className="bkp-pickall"
              onClick={() => curOrg && toggleOrg(curOrg, !allPicked)}
            >
              {allPicked ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="bp-people-list bkp-people">
            {curStaff.map((p) => {
              const pr = getPerson(p.name)
              return (
                <label className="bp-person" key={p.key}>
                  <input
                    type="checkbox"
                    checked={invited.has(p.key)}
                    onChange={() => toggleInvite(p.key)}
                  />
                  <span className="bp-av" style={{ background: pr.avatar }}>
                    {p.name.slice(0, 1)}
                  </span>
                  <span className="bp-pname">{p.name}</span>
                  <span className="bp-ptitle">{p.position}</span>
                </label>
              )
            })}
            {curStaff.length === 0 && <span className="bp-empty">该组织暂无员工</span>}
          </div>
          <div className="bp-chosen">
            <div className="bp-chips">
              {ORG_STAFF.filter((p) => invited.has(p.key)).map((p) => (
                <span className="bp-chip" key={p.key}>
                  {p.name}
                  <i onClick={() => toggleInvite(p.key)}>✕</i>
                </span>
              ))}
              {invited.size === 0 && <span className="bp-empty">尚未选择参会人</span>}
            </div>
            {invited.size > 0 && (
              <div className="bp-rsvp">
                <span className="bp-rsvp-t">RSVP 回执</span>
                <span className="bp-r ok">接受 {rsvpCount.accept}</span>
                <span className="bp-r w">待定 {rsvpCount.pending}</span>
                <span className="bp-r d">拒绝 {rsvpCount.decline}</span>
              </div>
            )}
          </div>
          {overCapacity && (
            <div className="bkp-warn">已选人数超出会议室容量，请调整后再提交</div>
          )}
        </div>

        <div className="bkp-sec">
          <div className="bkp-label">
            附件 / 议程
            <span className="book-hint">选填</span>
          </div>
          <label className="book-drop">
            <input
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
            />
            <UploadOutlined /> 点击添加附件
          </label>
          {files.length > 0 && (
            <div className="book-files">
              {files.map((f, i) => (
                <span className="book-file" key={f + i}>
                  <PaperClipOutlined /> {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bkp-sec">
          <div className="bkp-label">备注</div>
          <Input.TextArea
            rows={2}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="设备需求、会议说明等（选填）"
          />
        </div>

        <Button
          type="primary"
          block
          className="bkp-submit"
          disabled={!selComplete || overCapacity}
          onClick={confirmBooking}
        >
          {selComplete ? '提交预约' : '先在左侧选择时段'}
        </Button>
        <button type="button" className="bkp-records-link" onClick={() => setTab('records')}>
          查看全部预约记录（{allRecords.length}）
        </button>
      </aside>
    </div>
  )

  /* ---------- 预约记录视图 ---------- */
  const recordsView = (
    <section className="rec-section">
      <h3 className="sec-title">全部预约记录（{allRecords.length}）</h3>
      {allRecords.length === 0 ? (
        <Empty description="暂无预约记录" />
      ) : (
        <div className="rec-list">
          {allRecords.map((b) => (
            <div
              className="rec-item"
              key={b.id}
              role="button"
              tabIndex={0}
              onClick={() => setDrawer(b)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDrawer(b)
                }
              }}
            >
              <div className="rec-when">
                <span className="rec-date">{b.date}</span>
                <span className="rec-time">
                  {b.start} – {b.end}
                </span>
              </div>
              <div className="rec-main">
                <div className="rec-title-row">
                  <span className="rec-title">{b.title}</span>
                  <span className="rec-org">发起人 {b.organizer}</span>
                </div>
                <div className="rec-people">
                  <TeamOutlined /> 参会 {b.attendees.length} 人：
                  {b.attendees.slice(0, 8).map((n) => (
                    <Tag key={n} className="rec-tag">
                      {n}
                    </Tag>
                  ))}
                  {b.attendees.length > 8 && (
                    <span className="rec-more">+{b.attendees.length - 8}</span>
                  )}
                </div>
              </div>
              <RightOutlined className="rec-go-arrow" />
            </div>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <Layout className="site-layout">
      <Navbar solid title="会议室预订" />

      <Content className="site-content">
        <div className="portal meeting-page">
          <div className="detail-back" onClick={() => navigate('/app/meeting')}>
            <ArrowLeftOutlined /> 返回会议室列表
          </div>

          {/* 房间头部 */}
          <div className="detail-head">
            <div
              className="detail-cover"
              style={{ backgroundImage: COVERS[coverIdx % COVERS.length] }}
            >
              <span
                className="room-status"
                style={{ background: STATUS_META[room.status].color }}
              >
                {STATUS_META[room.status].label}
              </span>
            </div>
            <div className="detail-meta">
              <h2 className="detail-title">{room.name}</h2>
              <div className="detail-sub">
                <EnvironmentOutlined /> {BUILDING_NAME} · {room.code} · 可容{' '}
                {room.capacity} 人
              </div>
              <div className="room-devices">
                {room.devices.map((d) => (
                  <Tag key={d} className="room-device-tag">
                    {DEVICE_ICON[d]}
                    {d}
                  </Tag>
                ))}
              </div>
            </div>
          </div>

          {/* Tab 切换 */}
          <Tabs
            className="detail-tabs"
            activeKey={tab}
            onChange={setTab}
            items={[
              { key: 'book', label: '预约' },
              { key: 'records', label: '预约记录' },
            ]}
          />

          {tab === 'book' ? weekGrid : recordsView}
        </div>
      </Content>

      <AppFooter />


      {/* 已约块详情抽屉 */}
      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer ? drawer.title : ''}
        width={420}
        destroyOnHidden
        styles={{ body: { padding: 20 } }}
      >
        {drawer && room && (
          <div className="bk-drawer">
            <div className="bk-d-room">
              <div
                className="bk-d-cover"
                style={{ backgroundImage: COVERS[coverIdx % COVERS.length] }}
              >
                <span
                  className="room-status"
                  style={{ background: STATUS_META[room.status].color }}
                >
                  {STATUS_META[room.status].label}
                </span>
              </div>
              <div className="bk-d-room-meta">
                <div className="bk-d-room-name">{room.name}</div>
                <div className="bk-d-room-sub">
                  <EnvironmentOutlined /> {BUILDING_NAME} · {room.code} · 可容{' '}
                  {room.capacity} 人
                </div>
                <div className="room-devices">
                  {room.devices.map((d) => (
                    <Tag key={d} className="room-device-tag">
                      {DEVICE_ICON[d]}
                      {d}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

            <div className="bk-d-block">
              <div className="bk-d-block-title">本次预约</div>
              <div className="bk-d-row">
                <span>日期</span>
                <b>{drawer.date}</b>
              </div>
              <div className="bk-d-row">
                <span>时间段</span>
                <b>
                  {drawer.start} – {drawer.end}
                </b>
              </div>
              <div className="bk-d-row">
                <span>会议主题</span>
                <b>{drawer.title}</b>
              </div>
              <div className="bk-d-row">
                <span>发起人</span>
                <b>{drawer.organizer}</b>
              </div>
              <div className="bk-d-row">
                <span>参会人数</span>
                <b>{drawer.attendees.length} 人</b>
              </div>
            </div>

            <div className="bk-d-block">
              <div className="bk-d-block-title">
                <TeamOutlined /> 参会人员（{drawer.attendees.length}）
              </div>
              <div className="bk-people-list">
                {drawer.attendees.map((n) => {
                  const p = getPerson(n)
                  const rv = RSVP_META[getRsvp(n)]
                  return (
                    <div className="bk-person" key={n}>
                      <div className="bk-avatar" style={{ background: p.avatar }}>
                        {p.initial}
                      </div>
                      <div className="bk-person-main">
                        <div className="bk-person-name">{p.name}</div>
                        <div className="bk-person-sub">
                          {p.dept} · {p.title}
                        </div>
                      </div>
                      <span
                        className="bk-rsvp"
                        style={{ color: rv.color, background: rv.bg }}
                      >
                        {rv.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </Layout>
  )
}
