import { useMemo, useState } from 'react'
import { Button, Card, Descriptions, Drawer, Layout, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import Navbar from '../components/Navbar'
import HomeNav from '../components/HomeNav'
import Banner from '../components/Banner'
import AppFooter from '../components/Footer'
import { announcements, type Announcement } from '../data/portal'
import './home.css'
import './msgCenter.css'

const { Content } = Layout
const { Title } = Typography

export default function NoticeCenter() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Announcement | null>(null)

  const openDetail = (item: Announcement) => {
    setCurrent(item)
    setOpen(true)
  }

  /* 表格列与 sjtu-admin 的 NoticesPage 一致：标题 / 发布单位 / 时间 / 系统来源 / 操作 */
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (t: string, row: Announcement) => (
        <a className="notice-title-link" onClick={() => openDetail(row)}>
          {t}
        </a>
      ),
    },
    { title: '发布单位', dataIndex: 'unit', key: 'unit', width: 200 },
    {
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      onCell: () => ({ style: { whiteSpace: 'nowrap' as const } }),
    },
    {
      title: '系统来源',
      dataIndex: 'source',
      key: 'source',
      width: 130,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, row: Announcement) => (
        <Button
          type="link"
          size="small"
          style={{ color: '#C8161E', padding: 0 }}
          onClick={() => openDetail(row)}
        >
          查看
        </Button>
      ),
    },
  ]

  /* banner 口径：今日新增 / 来源系统数 */
  const meta = useMemo(() => {
    const today = announcements.filter((a) => a.date.slice(0, 10) === '2026-09-19').length
    const systems = new Set(announcements.map((a) => a.source)).size
    return { today, systems }
  }, [])

  return (
    <Layout className="mc-layout">
      {/* banner：本页相关提示，背景与首页一致 */}
      <section className="hero" style={{ backgroundImage: 'url(/banner.webp)' }}>
        <Navbar nav={<HomeNav />} />
        <Banner
          tag="NOTICE CENTER"
          title={
            <>
              共 <em className="banner-num">{announcements.length}</em> 条通知公告
            </>
          }
          sub={
            <>
              今日新增 <span className="is-warn">{meta.today} 条</span>｜来自 <b>{meta.systems}</b>{' '}
              个业务系统，点击标题或「查看」可阅读全文
            </>
          }
        />
      </section>

      <Content>
        <div className="portal">
          <div className="page-head">
            <Title level={3} style={{ margin: 0 }}>
              通知公告
            </Title>
          </div>
          <Card variant="borderless">
            <Table
              rowKey="title"
              dataSource={announcements}
              columns={columns}
              pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
            />
          </Card>
        </div>
      </Content>

      <AppFooter />

      {/* 详情抽屉（结构与 sjtu-admin 的 NoticesPage 一致） */}
      <Drawer
        title="通知公告详情"
        width={640}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnHidden
      >
        {current && (
          <article className="notice-detail">
            <h1 className="notice-detail-title">{current.title}</h1>
            <Descriptions column={1} size="small" className="notice-detail-meta">
              <Descriptions.Item label="发布时间">{current.date}</Descriptions.Item>
              <Descriptions.Item label="发布单位">{current.unit}</Descriptions.Item>
              <Descriptions.Item label="系统来源">
                <Tag color="blue">{current.source}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <div className="notice-rich">
              {current.content.split('\n\n').map((para, i) => (
                <p key={i}>
                  {para.split('\n').map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              ))}
            </div>

            {/* 附件：点击整行即下载 */}
            {!!current.attachments?.length && (
              <div className="notice-files">
                <div className="notice-files-title">
                  附件（{current.attachments.length}）
                </div>
                <ul className="notice-files-list">
                  {current.attachments.map((file) => (
                    <li key={file.name}>
                      <a className="notice-file" href={file.url} download={file.name}>
                        <FileTextOutlined className="notice-file-icon" />
                        <span className="notice-file-name">{file.name}</span>
                        <span className="notice-file-size">{file.size}</span>
                        <DownloadOutlined className="notice-file-dl" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </Drawer>
    </Layout>
  )
}
