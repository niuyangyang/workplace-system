import { useMemo } from 'react'
import { Button, Card, Layout, Table, Tag, Typography } from 'antd'
import Navbar from '../components/Navbar'
import HomeNav from '../components/HomeNav'
import Banner from '../components/Banner'
import AppFooter from '../components/Footer'
import { todos } from '../data/portal'
import './home.css'
import './msgCenter.css'

const { Content } = Layout
const { Title } = Typography

/* 演示用「今天」，仅用于 banner 的逾期 / 今日到期统计 */
const TODAY = '2026-09-19'

/* 表格列与 sjtu-admin 的 TodosPage 一致：事项名称 / 时间 / 事项类型 / 来源系统 / 操作 */
const columns = [
  {
    title: '事项名称',
    dataIndex: 'title',
    key: 'title',
    render: (t: string) => <span style={{ color: '#1f2430' }}>{t}</span>,
  },
  { title: '时间', dataIndex: 'time', key: 'time', width: 170 },
  {
    title: '事项类型',
    dataIndex: 'type',
    key: 'type',
    width: 110,
    render: (t: string) => <Tag color="red">{t}</Tag>,
  },
  { title: '来源系统', dataIndex: 'system', key: 'system', width: 140 },
  {
    title: '操作',
    key: 'action',
    width: 100,
    render: () => (
      <Button type="link" size="small" style={{ color: '#C8161E', padding: 0 }}>
        处理
      </Button>
    ),
  },
]

export default function TodoCenter() {
  /* 供 banner 展示的汇总口径 */
  const stats = useMemo(() => {
    const pending = todos.filter((t) => t.time.slice(0, 10) >= TODAY).length
    const over = todos.filter((t) => t.time.slice(0, 10) < TODAY).length
    const today = todos.filter((t) => t.time.slice(0, 10) === TODAY).length
    return { total: todos.length, pending, over, today }
  }, [])

  return (
    <Layout className="mc-layout">
      {/* banner：本页相关提示，背景与首页一致 */}
      <section className="hero" style={{ backgroundImage: 'url(/banner.webp)' }}>
        <Navbar nav={<HomeNav />} />
        <Banner
          tag="TODO CENTER"
          title={
            <>
              你有 <em className="banner-num">{stats.pending}</em> 项待办待处理
            </>
          }
          sub={
            <>
              其中 <span className="is-danger">{stats.over} 项已逾期</span>、
              <span className="is-warn">{stats.today} 项今日到期</span>｜共 <b>{stats.total}</b>{' '}
              项待办，处理结果会实时回写来源系统
            </>
          }
        />
      </section>

      <Content>
        <div className="portal">
          <div className="page-head">
            <Title level={3} style={{ margin: 0 }}>
              待办事项
            </Title>
          </div>
          <Card variant="borderless">
            <Table
              rowKey="id"
              dataSource={todos}
              columns={columns}
              pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
            />
          </Card>
        </div>
      </Content>

      <AppFooter />
    </Layout>
  )
}
