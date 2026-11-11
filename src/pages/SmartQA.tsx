import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from 'antd'
import {
  ArrowUpOutlined,
  AudioOutlined,
  BulbOutlined,
  CheckOutlined,
  CopyOutlined,
  DislikeOutlined,
  GlobalOutlined,
  LeftOutlined,
  LikeOutlined,
  LinkOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import './smartQa.css'

/* 智能问答：独立的对话式问答系统（无门户框架）。
   左侧：开启新对话 + 按时间分组的历史会话；右侧：聊天内容与输入区。 */

type Role = 'user' | 'assistant'
type Group = '今天' | '昨天' | '7 天内' | '30 天内'

interface Msg {
  role: Role
  text: string
  refs?: number
}
interface Session {
  id: string
  title: string
  group: Group
  messages: Msg[]
}

const NEW_ID = '__new__'
const GROUPS: Group[] = ['今天', '昨天', '7 天内', '30 天内']

const BUILD_ANSWER = `- **显存严重问题**：整机标价 10998 元，却只给了一张 8GB 显存的 RTX 5060 Ti。在 2026 年的中高端价位，这个显存定位更偏向入门级显卡，单卡价格普遍在 3400 到 4000 元上下。同价位自行组装，完全可以上到 RTX 5070 级别，整机配置恐严重不匹配。
- **存储时序偏高**：虽然给到了 32GB 双通道，但 6000 频率的时序为 C40，属于偏低的规格。在这个价位段，市面上主流已经能拿到 C28 或 C30 的时序内存，面对高负载游戏和生产场景会更有帮助。
- **散热和风噪坑人**：散热器是入门级 360 水冷，应付这颗处理器属于够用水准，但面板上标注着「主机默认不带机箱风扇」，如果要加装还要花 200 元买 6 个 ARGB 风扇。这套海景房机箱不带风扇散热表现会很差，实际成本还要再往上加。
- **核显与「无核显」陷阱**：主板配 1TB 固态（铠侠 NV7400）和 750W 金牌电源（宏基蛇）属于够用的水平，但并非一线品牌。在这个价位，主机完全可以配备更好的品质与质保标准。

## 🔥 购买建议

如果按 10998 元的预算选购，完全不需要局限在这种性价比偏低的整机店铺，同价位自行组装或者选择大品牌官方整机都更稳妥：

- **追求性能**：DIY 可以拿下 Ultra 7 270K Plus（国内散片或盒装版价格约 2200 元上下）配 RTX 5070 独立显卡，或搭载性能更全面的 16GB 显存版 RTX 5060 Ti。
- **售后省心**：同价位可以看看一线品牌（如华硕、惠普等）的官方整机，同样搭载 Ultra 7 处理器和 RTX 5060 Ti，整机主要部件保修完善，出问题直接上门服务，比这类第三方店铺拼装省心很多。

如果你决定 DIY 省钱、介意性能短板，后续可能需要自行加装机箱风扇保证风道，再考虑升级显卡。你平时主要玩哪些游戏或运行什么软件？我可以根据你的具体需求，列出更合适的选购替代方案。`

function mockAnswer(q: string): string {
  return `已收到你的问题：**${q}**

这是一个前端演示环境，回答由页面模拟生成。为了让讨论更聚焦，可以先明确以下几点：

- **目标**：你希望最终得到结论、方案，还是一份可以直接使用的清单？
- **约束**：时间、预算、技术栈或使用场景，都会影响回答的方向。
- **标准**：什么样的结果算「好」，便于我按同一口径给出建议。

你可以继续追问细节，或点击左侧「开启新对话」换一个话题。`
}

const INITIAL_SESSIONS: Session[] = [
  {
    id: 's1',
    title: '万元装机配置避坑',
    group: '昨天',
    messages: [
      { role: 'user', text: '帮我看下这套万元装机配置，值不值得买？' },
      { role: 'assistant', text: BUILD_ANSWER, refs: 12 },
    ],
  },
  { id: 's2', title: '配置三电脑点端', group: '7 天内', messages: [{ role: 'assistant', text: '已为你整理三台电脑的点端配置建议，可继续追问细节。' }] },
  { id: 's3', title: 'Redis Stack 支持向量库', group: '7 天内', messages: [{ role: 'assistant', text: 'Redis Stack 通过 RediSearch 模块提供向量检索能力，适合轻量级 RAG 场景。' }] },
  { id: 's4', title: '独立知识库 SpringBoot 教程', group: '7 天内', messages: [{ role: 'assistant', text: '搭建独立知识库可以按「文档解析 → 向量化 → 检索 → 生成」四步实施。' }] },
  { id: 's5', title: 'DeepSeek 自我介绍', group: '7 天内', messages: [{ role: 'assistant', text: '你好，我是智能问答助手，可以帮你检索知识、梳理信息并给出建议。' }] },
  { id: 's6', title: '帮我配主机认真评点', group: '7 天内', messages: [{ role: 'assistant', text: '请把配置清单发给我，我会逐项点评性价比与潜在短板。' }] },
  { id: 's7', title: '产品经理社区推荐', group: '7 天内', messages: [{ role: 'assistant', text: '可以关注人人都是产品经理、PMCAFF 等社区，获取案例与方法论。' }] },
  { id: 's8', title: '郑州更适合做餐饮研发', group: '7 天内', messages: [{ role: 'assistant', text: '郑州的餐饮供应链与人力成本具备一定优势，适合做餐饮 SaaS 研发。' }] },
  { id: 's9', title: '技术产品经验需求分析', group: '7 天内', messages: [{ role: 'assistant', text: '需求分析建议从用户场景、核心痛点与可量化目标三方面切入。' }] },
  { id: 's10', title: '距离 12 月 15 日天数', group: '7 天内', messages: [{ role: 'assistant', text: '请以实际年份为准，我可以帮你计算倒计时并生成提醒。' }] },
  { id: 's11', title: '查看服务实时日志', group: '30 天内', messages: [{ role: 'assistant', text: '可以在运维面板按服务名与时间范围筛选实时日志。' }] },
  { id: 's12', title: '智能提醒的推送', group: '30 天内', messages: [{ role: 'assistant', text: '智能提醒可基于规则与订阅两种方式推送到站内信或企业微信。' }] },
  { id: 's13', title: 'WiFi 连不上网', group: '30 天内', messages: [{ role: 'assistant', text: '建议先重启路由并检查 DHCP 分配，再排查认证与 DNS 设置。' }] },
]

const SUGGESTIONS = [
  '帮我写一份本周工作周报',
  '解释一下这份制度的关键条款',
  '整理本周待办的处理优先级',
  '分析会议室预订的高峰时段',
]

/* -------------------------- 轻量 markdown 渲染 -------------------------- */

function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  )
}

function RichText({ text }: { text: string }) {
  const out: ReactNode[] = []
  let list: ReactNode[] | null = null
  let key = 0
  const flush = () => {
    if (list) {
      out.push(<ul key={key++}>{list}</ul>)
      list = null
    }
  }
  text.split('\n').forEach((raw) => {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flush()
      return
    }
    if (line.startsWith('- ')) {
      if (!list) list = []
      list.push(<li key={key++}>{inline(line.slice(2))}</li>)
      return
    }
    flush()
    if (line.startsWith('### ')) out.push(<h4 key={key++} className="qa-h">{inline(line.slice(4))}</h4>)
    else if (line.startsWith('## ')) out.push(<h3 key={key++} className="qa-h2">{inline(line.slice(3))}</h3>)
    else out.push(<p key={key++}>{inline(line)}</p>)
  })
  flush()
  return <div className="qa-rich">{out}</div>
}

/* ------------------------------- 主组件 ------------------------------- */

export default function SmartQA() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)
  const [activeId, setActiveId] = useState<string>('s1')
  const [draft, setDraft] = useState('')
  const [deepThink, setDeepThink] = useState(true)
  const [smartSearch, setSmartSearch] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({})
  const bodyRef = useRef<HTMLDivElement>(null)

  const isNew = activeId === NEW_ID
  const active = useMemo(() => sessions.find((s) => s.id === activeId), [sessions, activeId])
  const title = isNew ? '新对话' : active?.title ?? '智能问答'

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeId, active?.messages.length])

  const startNew = () => {
    setActiveId(NEW_ID)
    setSidebarOpen(false)
  }

  const selectSession = (id: string) => {
    setActiveId(id)
    setSidebarOpen(false)
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    if (activeId === NEW_ID) {
      const id = `s_${Date.now()}`
      const item: Session = {
        id,
        title: text.slice(0, 20),
        group: '今天',
        messages: [
          { role: 'user', text },
          { role: 'assistant', text: mockAnswer(text), refs: 3 },
        ],
      }
      setSessions((xs) => [item, ...xs])
      setActiveId(id)
    } else {
      setSessions((xs) =>
        xs.map((s) =>
          s.id === activeId
            ? {
                ...s,
                messages: [...s.messages, { role: 'user', text }, { role: 'assistant', text: mockAnswer(text), refs: 3 }],
              }
            : s,
        ),
      )
    }
  }

  const doCopy = async (k: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(k)
    window.setTimeout(() => setCopied(null), 1500)
  }

  const toggleFb = (k: string, v: 'up' | 'down') =>
    setFeedback((f) => {
      const next = { ...f }
      if (next[k] === v) delete next[k]
      else next[k] = v
      return next
    })

  const regenerate = () => {
    if (!active || isNew) return
    const lastQ = [...active.messages].reverse().find((m) => m.role === 'user')?.text ?? active.title
    setSessions((xs) =>
      xs.map((s) =>
        s.id === active.id ? { ...s, messages: [...s.messages, { role: 'assistant', text: mockAnswer(lastQ), refs: 3 }] } : s,
      ),
    )
  }

  const renderMessage = (m: Msg, idx: number) => {
    if (m.role === 'user') {
      return (
        <div className="qa-msg-user" key={idx}>
          <div className="qa-bubble">{m.text}</div>
        </div>
      )
    }
    const k = `${activeId}-${idx}`
    return (
      <div className="qa-msg-ai" key={idx}>
        <RichText text={m.text} />
        <div className="qa-actions">
          {m.refs ? (
            <span className="qa-refs">
              <LinkOutlined /> {m.refs} 个网页
            </span>
          ) : null}
          <button type="button" className="qa-act" title="复制" onClick={() => doCopy(k, m.text)}>
            {copied === k ? <CheckOutlined /> : <CopyOutlined />}
          </button>
          <button
            type="button"
            className={`qa-act${feedback[k] === 'up' ? ' is-on' : ''}`}
            title="有帮助"
            onClick={() => toggleFb(k, 'up')}
          >
            <LikeOutlined />
          </button>
          <button
            type="button"
            className={`qa-act${feedback[k] === 'down' ? ' is-on' : ''}`}
            title="没帮助"
            onClick={() => toggleFb(k, 'down')}
          >
            <DislikeOutlined />
          </button>
          <button type="button" className="qa-act" title="重新生成" onClick={regenerate}>
            <ReloadOutlined />
          </button>
          <button type="button" className="qa-act" title="分享" onClick={() => doCopy(k, m.text)}>
            <ShareAltOutlined />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`qa-shell${sidebarOpen ? ' qa-side-open' : ''}`}>
      {/* 左侧会话导航 */}
      <aside className="qa-sidebar">
        <div className="qa-side-head">
          <button type="button" className="qa-brand" onClick={() => navigate('/')} title="返回应用中心">
            <span className="qa-logo">
              <MessageOutlined />
            </span>
            <span className="qa-brand-name">智能问答</span>
          </button>
          <button type="button" className="qa-ico" title="搜索会话">
            <SearchOutlined />
          </button>
          <button type="button" className="qa-ico qa-collapse" title="收起侧栏" onClick={() => setSidebarOpen(false)}>
            <MenuOutlined />
          </button>
        </div>

        <button type="button" className="qa-new" onClick={startNew}>
          <PlusOutlined /> 开启新对话
        </button>

        <div className="qa-list">
          {GROUPS.map((g) => {
            const items = sessions.filter((s) => s.group === g)
            if (!items.length) return null
            return (
              <div key={g} className="qa-group">
                <div className="qa-group-title">{g}</div>
                {items.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className={`qa-item${s.id === activeId ? ' is-active' : ''}`}
                    onClick={() => selectSession(s.id)}
                    title={s.title}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        <div className="qa-side-foot">
          <button type="button" className="qa-back" onClick={() => navigate('/')}>
            <LeftOutlined /> 返回应用中心
          </button>
          <div className="qa-user">
            <div className="qa-user-trigger">
              <Avatar size={30} src="/avatar.webp" />
              <span className="qa-user-name">张明</span>
            </div>
            <div className="qa-user-menu">
              <div className="qa-user-menu-item">
                <SettingOutlined />
                <span>账号设置</span>
              </div>
              <div className="qa-user-menu-item qa-user-menu-logout">
                <LogoutOutlined />
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button type="button" className="qa-mask" aria-label="关闭侧栏" onClick={() => setSidebarOpen(false)} />}

      {/* 右侧聊天区 */}
      <main className="qa-main">
        <header className="qa-topbar">
          <button type="button" className="qa-ico qa-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="打开会话列表">
            <MenuOutlined />
          </button>
          <div className="qa-title">{title}</div>
          <div className="qa-top-actions">
            <button type="button" className="qa-ico" title="分享对话">
              <ShareAltOutlined />
            </button>
            <button type="button" className="qa-ico" title="更多">
              <MoreOutlined />
            </button>
          </div>
        </header>

        <div className="qa-body" ref={bodyRef}>
          <div className="qa-thread">
            {isNew || !active ? (
              <div className="qa-welcome">
                <span className="qa-welcome-logo">
                  <MessageOutlined />
                </span>
                <h2>今天想了解点什么？</h2>
                <p>输入问题开始对话，可开启深度思考与智能搜索</p>
                <div className="qa-sugs">
                  {SUGGESTIONS.map((s) => (
                    <button type="button" key={s} className="qa-sug" onClick={() => setDraft(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              active.messages.map((m, i) => renderMessage(m, i))
            )}
          </div>
        </div>

        <div className="qa-composer-wrap">
          <div className="qa-composer">
            <textarea
              className="qa-input"
              rows={Math.min(6, Math.max(1, draft.split('\n').length))}
              placeholder="给智能问答发送消息"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <div className="qa-composer-bar">
              <div className="qa-toggles">
                <button
                  type="button"
                  className={`qa-toggle${deepThink ? ' is-on' : ''}`}
                  onClick={() => setDeepThink((v) => !v)}
                >
                  <BulbOutlined /> 深度思考
                </button>
                <button
                  type="button"
                  className={`qa-toggle${smartSearch ? ' is-on' : ''}`}
                  onClick={() => setSmartSearch((v) => !v)}
                >
                  <GlobalOutlined /> 智能搜索
                </button>
              </div>
              <div className="qa-composer-right">
                <button type="button" className="qa-ico" title="添加附件">
                  <PaperClipOutlined />
                </button>
                <button type="button" className="qa-ico" title="语音输入">
                  <AudioOutlined />
                </button>
                <button type="button" className="qa-send" disabled={!draft.trim()} onClick={send} title="发送">
                  <ArrowUpOutlined />
                </button>
              </div>
            </div>
          </div>
          <div className="qa-hint">内容由 AI 生成，请仔细甄别</div>
        </div>
      </main>
    </div>
  )
}
