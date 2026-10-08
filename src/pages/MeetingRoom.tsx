import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import { Button, Empty, Input, Layout, Tag } from 'antd'
import {
  ClockCircleOutlined,
  CoffeeOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
  BorderOutlined,
  SearchOutlined,
  SoundOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import AppFooter from '../components/Footer'
import { ROOMS, STATUS_META, BUILDING_NAME, type Room } from '../data/meeting'
import './home.css'
import './meeting.css'

const { Content } = Layout

/* ---------- 视图层展示素材（确定性占位，非业务数据） ---------- */
const DEVICE_ICON: Record<string, ReactNode> = {
  投影: <DesktopOutlined />,
  视频会议: <VideoCameraOutlined />,
  白板: <BorderOutlined />,
  音响: <SoundOutlined />,
  茶水: <CoffeeOutlined />,
}

/* 会议室实景封面（AI 生成照片，存于 public/meeting/，按房间类型轮换） */
const COVERS = [
  'url(/meeting/room-1.webp)', // 报告厅
  'url(/meeting/room-2.webp)', // 大会议室（长桌）
  'url(/meeting/room-3.webp)', // 洽谈间（圆桌）
  'url(/meeting/room-4.webp)', // 培训室
  'url(/meeting/room-5.webp)', // 视频会议室
  'url(/meeting/room-6.webp)', // 小讨论间
]

const DEVICES = ['投影', '视频会议', '白板', '音响', '茶水']

const STATUS_OPTIONS = [
  { v: 'all', label: '全部' },
  { v: 'idle', label: '空闲中' },
  { v: 'soon', label: '即将释放' },
  { v: 'busy', label: '使用中' },
  { v: 'maint', label: '维护中' },
]
const CAP_OPTIONS = [
  { v: 'all', label: '全部' },
  { v: 's', label: '≤6 人' },
  { v: 'm', label: '7-12 人' },
  { v: 'l', label: '13-20 人' },
  { v: 'xl', label: '>20 人' },
]

function capBucket(c: number) {
  return c <= 6 ? 's' : c <= 12 ? 'm' : c <= 20 ? 'l' : 'xl'
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: { v: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          className={`filter-pill${value === o.v ? ' is-active' : ''}`}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </>
  )
}

/* ===================== 列表页 ===================== */
export default function MeetingRoom() {
  const navigate = useNavigate()

  const [status, setStatus] = useState<string>('all')
  const [cap, setCap] = useState<string>('all')
  const [device, setDevice] = useState<string>('all')
  const [q, setQ] = useState('')

  // 推荐：优先空闲、其次即将释放，取容量较大者
  const recommend = useMemo<Room | undefined>(() => {
    const idle = ROOMS.filter((r) => r.status === 'idle')
    const pool = idle.length ? idle : ROOMS.filter((r) => r.status === 'soon')
    return pool.slice().sort((a, b) => b.capacity - a.capacity)[0]
  }, [])

  const deviceOptions = [
    { v: 'all', label: '全部' },
    ...DEVICES.map((d) => ({ v: d, label: d })),
  ]

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return ROOMS.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (cap !== 'all' && capBucket(r.capacity) !== cap) return false
      if (device !== 'all' && !r.devices.includes(device)) return false
      if (kw && !(r.name.toLowerCase().includes(kw) || r.code.toLowerCase().includes(kw)))
        return false
      return true
    })
  }, [status, cap, device, q])

  function goDetail(id: string) {
    navigate(`/app/meeting/${id}`)
  }

  return (
    <Layout className="site-layout">
      <Navbar solid title="会议室预订" />

      <Content className="site-content">
        <div className="portal meeting-page">
          {/* 筛选栏 */}
          <div className="meeting-filters">
            <div className="filter-row">
              <Input
                className="meeting-search"
                prefix={<SearchOutlined />}
                placeholder="搜索房名 / 房间号"
                allowClear
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <span className="filter-label">状态</span>
                <Pills options={STATUS_OPTIONS} value={status} onChange={setStatus} />
              </div>
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <span className="filter-label">容量</span>
                <Pills options={CAP_OPTIONS} value={cap} onChange={setCap} />
              </div>
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <span className="filter-label">设备</span>
                <Pills options={deviceOptions} value={device} onChange={setDevice} />
              </div>
            </div>
            <div className="meeting-count">
              共 {filtered.length} 间会议室 · {BUILDING_NAME}
            </div>
          </div>

          {/* 为你推荐 条 */}
          <div className="rec-strip">
            {recommend && (
              <span className="rec-tip">
                为你推荐：<b>{recommend.name}</b>（{recommend.next}）
                <a
                  className="rec-go"
                  onClick={(e) => {
                    e.preventDefault()
                    goDetail(recommend.id)
                  }}
                >
                  去预订 →
                </a>
              </span>
            )}
          </div>

          {/* 卡片画廊 */}
          {filtered.length === 0 ? (
            <Empty className="meeting-empty" description="没有符合条件的会议室" />
          ) : (
            <div className="meeting-grid">
              {filtered.map((r) => {
                const coverIdx = Math.max(ROOMS.findIndex((x) => x.id === r.id), 0)
                return (
                  <article
                    className="room-card"
                    key={r.id}
                    onClick={() => goDetail(r.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      className="room-cover"
                      style={{ backgroundImage: COVERS[coverIdx % COVERS.length] }}
                    >
                      <span
                        className="room-status"
                        style={{ background: STATUS_META[r.status].color }}
                      >
                        {STATUS_META[r.status].label}
                      </span>
                      <span className="room-cap">
                        <TeamOutlined /> {r.capacity} 人
                      </span>
                    </div>
                    <div className="room-body">
                      <h3 className="room-name">{r.name}</h3>
                      <div className="room-loc">
                        <EnvironmentOutlined /> {BUILDING_NAME} · {r.code}
                      </div>
                      <div className="room-devices">
                        {r.devices.map((d) => (
                          <Tag key={d} className="room-device-tag">
                            {DEVICE_ICON[d]}
                            {d}
                          </Tag>
                        ))}
                      </div>
                      <div className="room-foot">
                        <span className="room-next">
                          <ClockCircleOutlined /> {r.next}
                        </span>
                        <Button
                          className="book-btn"
                          disabled={r.status === 'maint'}
                          onClick={(e) => {
                            e.stopPropagation()
                            goDetail(r.id)
                          }}
                        >
                          预订
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </Content>

      <AppFooter />
    </Layout>
  )
}
