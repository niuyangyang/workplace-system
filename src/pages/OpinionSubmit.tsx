import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { App as AntdApp, Card, Empty, Modal, Input, Button } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import Navbar from '../components/Navbar'
import PortalNav from '../components/PortalNav'
import { PORTAL_POLICIES } from './PolicyPortal'
import { buildPolicyVersions } from './PolicyDetail'
import { seedOpinions, opinionStatus, addOpinionFeedback } from './SystemMgmt'
import type { DocNode } from './DraftWizard'
import './opinionSubmit.css'

interface Sec {
  id: string
  title: string
  content: string
  depth: number
}
const flattenSec = (nodes: DocNode[], depth = 0, acc: Sec[] = []): Sec[] => {
  nodes.forEach((n) => {
    acc.push({ id: n.id, title: n.title, content: n.content || '', depth })
    if (n.children) flattenSec(n.children, depth + 1, acc)
  })
  return acc
}

const pad = (n: number) => String(n).padStart(2, '0')
const fmtNow = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 制度前台 · 提交意见：左目录 + 右正文，可针对某个段落提交意见
export default function OpinionSubmit() {
  const { id } = useParams<{ id: string }>()
  const { message } = AntdApp.useApp()

  const collect = seedOpinions.find((o) => o.id === id)
  const status = collect ? opinionStatus(collect) : '未开始'

  const sections = useMemo(() => {
    if (!collect) return [] as Sec[]
    const policy = PORTAL_POLICIES.find((p) => p.name === collect.policyName)
    if (!policy) return [] as Sec[]
    const versions = buildPolicyVersions(policy)
    const cur = versions[versions.length - 1]
    return cur ? flattenSec(cur.tree) : []
  }, [collect])

  const [counts, setCounts] = useState<Record<string, number>>({})
  const [target, setTarget] = useState<Sec | null>(null)
  const [text, setText] = useState('')

  const scrollTo = (sid: string) => {
    document.getElementById('sec-' + sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = () => {
    if (!collect || !target) return
    if (!text.trim()) {
      message.warning('请输入意见内容')
      return
    }
    addOpinionFeedback({
      id: 'F' + Date.now(),
      collectId: collect.id,
      sectionTitle: target.title,
      submitter: '张明',
      department: '研发中心',
      submitTime: fmtNow(),
      content: text.trim(),
    })
    setCounts((c) => ({ ...c, [target.id]: (c[target.id] ?? 0) + 1 }))
    message.success('意见提交成功，感谢您的参与')
    setTarget(null)
    setText('')
  }

  if (!collect) {
    return (
      <div className="os-page">
        <Navbar solid sticky nav={<PortalNav />} />
        <Empty description="未找到该意见征集" style={{ marginTop: 120 }} />
      </div>
    )
  }

  const notOpen = status !== '进行中'

  return (
    <div className="os-page">
      <Navbar solid sticky nav={<PortalNav />} />

      {notOpen ? (
        <main className="os-main">
          <Card className="os-closed">
            {status === '未开始'
              ? '该意见征集尚未开始，敬请期待。'
              : '该意见征集已结束，感谢您的参与。'}
          </Card>
        </main>
      ) : (
        <div className="os-layout">
          <aside className="os-toc">
            <div className="os-toc-title">制度目录</div>
            <ul>
              {sections.map((s) => (
                <li
                  key={s.id}
                  className={`os-toc-item lv${s.depth}`}
                  onClick={() => scrollTo(s.id)}
                >
                  {s.title}
                </li>
              ))}
              {!sections.length && <li className="os-toc-empty">暂无正文</li>}
            </ul>
          </aside>

          <main className="os-body">
            <div className="os-tip">
              在任意段落右侧点击「提意见」，即可针对该段落提交您的建议。
            </div>
            {sections.length ? (
              sections.map((s) => (
                <section key={s.id} id={'sec-' + s.id} className={`os-sec lv${s.depth}`}>
                  <h3 className="os-sec-title">
                    <span className="os-sec-name">{s.title}</span>
                    {counts[s.id] ? (
                      <span className="os-sec-badge">已提 {counts[s.id]} 条</span>
                    ) : null}
                    <Button
                      type="link"
                      size="small"
                      className="os-sec-btn"
                      icon={<MessageOutlined />}
                      onClick={() => {
                        setTarget(s)
                        setText('')
                      }}
                    >
                      提意见
                    </Button>
                  </h3>
                  <p className="os-sec-content">{s.content || '（待补充内容）'}</p>
                </section>
              ))
            ) : (
              <Empty description="暂无正文内容" />
            )}
          </main>
        </div>
      )}

      <Modal
        title={`提交意见${target ? ' · ' + target.title : ''}`}
        open={!!target}
        onCancel={() => setTarget(null)}
        onOk={handleSubmit}
        okText="提交意见"
        cancelText="取消"
        width={580}
      >
        {target?.content && <div className="os-quote">{target.content}</div>}
        <Input.TextArea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入您对该段落的意见建议"
          maxLength={300}
          showCount
        />
      </Modal>
    </div>
  )
}
