import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as AntdApp, Card, Tag, Empty, Tabs } from 'antd'
import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import PortalNav from '../components/PortalNav'
import {
  seedOpinions,
  opinionStatus,
  type OpinionCollect as OpinionItem,
  type OpinionStatus,
} from './SystemMgmt'
import './opinionCollect.css'

const STATUSES: OpinionStatus[] = ['未开始', '进行中', '已结束']
const STATUS_COLOR: Record<OpinionStatus, string> = {
  未开始: 'default',
  进行中: 'blue',
  已结束: 'green',
}
const STATUS_ICON: Record<OpinionStatus, ReactNode> = {
  未开始: <ClockCircleOutlined />,
  进行中: <SyncOutlined spin />,
  已结束: <CheckCircleOutlined />,
}

// 制度前台 · 意见收集：banner + 按 未开始 / 进行中 / 已结束 分组的征集列表（状态由起止时间推导）
export default function OpinionCollect() {
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const [active, setActive] = useState<OpinionStatus>('进行中')

  // 未开始 / 已结束给出提示；进行中进入提交意见页
  const handleClick = (o: OpinionItem & { status: OpinionStatus }) => {
    if (o.status === '未开始') {
      message.info(`《${o.policyName}》意见征集尚未开始，敬请期待`)
      return
    }
    if (o.status === '已结束') {
      message.info(`《${o.policyName}》意见征集已结束，感谢您的参与`)
      return
    }
    navigate(`/app/policy/opinions/${o.id}`)
  }

  const rows = useMemo(
    () => seedOpinions.map((o) => ({ ...o, status: opinionStatus(o) })),
    [],
  )

  const groups = useMemo(() => {
    const m: Record<OpinionStatus, (OpinionItem & { status: OpinionStatus })[]> = {
      未开始: [],
      进行中: [],
      已结束: [],
    }
    rows.forEach((o) => m[o.status].push(o))
    return m
  }, [rows])

  const renderList = (list: (OpinionItem & { status: OpinionStatus })[]) => {
    if (!list.length) {
      return <Empty description="暂无征集活动" style={{ marginTop: 48 }} />
    }
    return (
      <div className="oc-list">
        {list.map((o) => (
          <Card key={o.id} className="oc-item" hoverable onClick={() => handleClick(o)}>
            <div className="oc-item-head">
              <span className="oc-item-title">{o.title}</span>
              <Tag color={STATUS_COLOR[o.status]} icon={STATUS_ICON[o.status]}>
                {o.status}
              </Tag>
            </div>
            <div className="oc-item-meta">
              <span className="oc-meta-cell">
                <label>关联制度</label>
                <b>{o.policyName}</b>
              </span>
              <span className="oc-meta-cell">
                <label>制度版本</label>
                <b>{o.version}</b>
              </span>
              <span className="oc-meta-cell">
                <label>分类</label>
                <b>{o.category}</b>
              </span>
              <span className="oc-meta-cell">
                <label>发起部门</label>
                <b>{o.owner}</b>
              </span>
              <span className="oc-meta-cell">
                <label>征集时间</label>
                <b>
                  {o.startTime} ~ {o.endTime}
                </b>
              </span>
            </div>
            {o.description && <div className="oc-item-desc">{o.description}</div>}
            <div
              className={`oc-item-action${
                o.status === '进行中' ? ' is-open' : ' is-closed'
              }`}
            >
              <span>
                {o.status === '进行中'
                  ? '去提意见'
                  : o.status === '未开始'
                    ? '未开始，敬请期待'
                    : '已结束，感谢参与'}
              </span>
              <RightOutlined />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="oc-page">
      <Navbar solid sticky nav={<PortalNav />} />

      {/* 顶部 banner */}
      <section className="oc-banner">
        <div className="oc-banner-inner">
          <h1 className="oc-banner-title">意见征集</h1>
          <p className="oc-banner-desc">
            您可以对相关制度提交自己的合理建议与意见反馈。我们会在制度修订时认真研究、充分吸纳，
            感谢您的参与和支持。
          </p>
        </div>
      </section>

      <main className="oc-main">
        <Tabs
          activeKey={active}
          onChange={(k) => setActive(k as OpinionStatus)}
          items={STATUSES.map((s) => ({
            key: s,
            label: `${s}（${groups[s].length}）`,
            children: renderList(groups[s]),
          }))}
        />
      </main>
    </div>
  )
}
