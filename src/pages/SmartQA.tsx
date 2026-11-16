import { withBase } from '../base'
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

const BUILD_ANSWER = `## 结论

本期建议只做前 3 个：**退款原因标签** → **客服工单合并** → **订单改地址**。社区晒单和积分商城投入产出比偏低，放进下季度观察池。

## 排序依据（RICE）

- **退款原因标签**：Reach 覆盖退款用户的 62%，Impact 3、Confidence 80%、Effort 2 人周 → RICE ≈ 74。它把「用户说不清为什么退」变成结构化数据，后续退款链路的所有优化都要靠它做归因。
- **客服工单合并**：只影响客服侧 8 人，但 Impact 3、Confidence 90%、Effort 1.5 人周 → RICE ≈ 14。内部效率类需求看「每周省多少工时」，不能按覆盖用户数算。
- **订单改地址**：Reach 覆盖成交用户 18%，Impact 3、Confidence 70%、Effort 3 人周 → RICE ≈ 13。
- **社区晒单**：Reach 看起来高，但 Impact 2、Confidence 只有 40%（没有验证数据）、Effort 8 人周 → RICE ≈ 6，建议先用 2 周做轻量版验证意愿。
- **积分商城**：要新建账户、结算、风控三套体系，Effort 20 人周以上，且不在当前核心链路上 → 本期直接砍掉。

## 评审前要补齐的三件事

- 和客服团队对齐「工单量」的基线口径，否则标签上线后无法证明收益。
- 订单改地址先确认三方物流接口是否支持改址，避免产品做完技术接不住。
- 每个需求补一条北极星指标 + 一条护栏指标，评审时一起过。

需要我把结论整理成评审用的 RICE 表格，或者按需求逐个写出验收指标吗？`

function mockAnswer(q: string): string {
  return `已收到：**${q}**

这是演示环境，回答由页面模拟生成。要给出可用的结论，我需要先确认三件事：

- **目标用户**：服务的是新用户、老用户，还是内部角色（客服、运营、审核）？
- **业务目标**：要提升转化、留存，还是降低支持成本？有没有可对比的基线数据？
- **约束条件**：研发排期、依赖的上下游、合规要求分别是什么？

补齐这三点后，我可以按「问题定义 → 方案对比 → 验收指标」的结构输出建议。

也可以点击左侧「开启新对话」换一个话题，或直接贴一份 PRD 让我逐条挑问题。`
}

const INITIAL_SESSIONS: Session[] = [
  {
    id: 's1',
    title: '退款流程需求优先级评审',
    group: '今天',
    messages: [
      { role: 'user', text: '这 5 个需求帮我排优先级，本期只能做 3 个：退款原因标签、客服工单合并、订单改地址、社区晒单、积分商城。' },
      { role: 'assistant', text: BUILD_ANSWER, refs: 12 },
    ],
  },
  {
    id: 's2',
    title: '新用户 7 日留存下降归因',
    group: '今天',
    messages: [
      { role: 'user', text: '7 日留存这周掉了 3 个点，可能是哪些原因？' },
      {
        role: 'assistant',
        text: `先别急着改产品，按这个顺序排查更省时间：

- **口径**：确认统计口径有没有变（新用户定义、去重方式、时区），历史上 30% 的「留存下跌」是口径问题。
- **分渠道**：按投放渠道拆分，先看是不是某个渠道放量导致低质用户占比变高。
- **分版本**：对比发版时间点，看是否与新版本的首启引导改动重合。
- **分行为**：看新用户首日是否完成关键行为（首次下单/首次建项目），这一步能定位到具体漏斗。
- **定性验证**：找 5 到 8 个本周注册的用户做访谈，问他们首次使用的卡点，不要问「你喜不喜欢」。

把这几张拆分表拉出来，基本能锁定是「量」的问题还是「产品」的问题。`,
        refs: 8,
      },
    ],
  },
  {
    id: 's3',
    title: '签到功能 PRD 大纲',
    group: '昨天',
    messages: [
      { role: 'user', text: '帮我列一份签到功能的 PRD 大纲。' },
      {
        role: 'assistant',
        text: `## 一、背景与目标

- 业务问题：写出当前新用户次日回访低的具体数据，而不是「为了提升活跃」。
- 目标：次日回访率从 X% 提升到 Y%，护栏指标是「签到页跳出率不高于 Z%」。

## 二、用户与场景

- 谁在什么时间、什么动机下会来签到：连续激励型、补偿型、任务驱动型。

## 三、功能范围

- 签到周期（7 天 / 自然月）、补签规则、奖励类型与发放时机、断签处理。
- 反作弊：设备与账号维度限制、异常频率拦截。

## 四、异常与边界

- 跨时区、断网重试、奖励发放失败补偿、活动下线后的历史数据处理。

## 五、数据与验收

- 埋点：签到页曝光、签到成功、奖励领取、次日回访。
- 上线后 2 周看板：签到率、人均签到天数、7 日留存变化。`,
        refs: 9,
      },
    ],
  },
  {
    id: 's4',
    title: 'B 端权限体系怎么设计',
    group: '昨天',
    messages: [
      {
        role: 'assistant',
        text: `B 端权限建议拆成三层，别混在一起做：

- **功能权限**：能不能看到某个菜单/按钮，用 RBAC（角色 + 权限点）就够。
- **数据权限**：能看到哪些范围的数据，按组织架构（本人/本部门/本部门及下级/全部）配置，是 B 端最容易返工的地方。
- **字段权限**：同一张表里哪些字段可见、可编辑，通常只在敏感场景（薪酬、成本）才做。

落地建议：权限点用「资源:动作」命名（order:read、order:export），角色只做权限点的集合，不要给角色写死业务逻辑。数据权限单独做一套规则表，跟着组织架构变动自动继承，否则每次组织调整都要手工改一遍。`,
        refs: 6,
      },
    ],
  },
  {
    id: 's5',
    title: 'A/B 实验样本量与分流',
    group: '7 天内',
    messages: [
      { role: 'user', text: '想验证新引导页对注册转化的影响，实验怎么设计？' },
      {
        role: 'assistant',
        text: `按这四步设计，结论才站得住：

- **假设**：新引导页把注册转化率从 12% 提升到 14%（相对提升 16.7%）。
- **样本量**：双侧检验、α=0.05、power=0.8，每组分流约 3.2 万 UV；如果日活不够，就要么延长周期，要么放弃这个粒度的提升。
- **分流**：按用户 ID 哈希分流，同一用户全周期固定分组；新老用户分开看，避免混淆。
- **判定**：主指标看注册转化，护栏指标看 7 日留存和首日关键行为，防止为了转化拉来一批沉默用户。

提醒一点：不要在实验中途看显著性就停，容易假阳性；预先定好观察周期和判定规则。`,
        refs: 7,
      },
    ],
  },
  {
    id: 's6',
    title: '竞品拆解：飞书 vs 钉钉',
    group: '7 天内',
    messages: [
      {
        role: 'assistant',
        text: `按四个维度拆，最后落到「哪些能抄、哪些不能抄」：

- **策略**：飞书主打「文档 + 协作」切入知识型团队，钉钉从「考勤 + 审批」切入管理刚需。切入点不同，后续能力扩张路径也不同。
- **功能**：飞书强在文档协同与多维表格，钉钉强在组织管理与生态应用数量。对比时列「同一任务在两边的最短完成路径」，比列功能清单有用。
- **体验**：飞书的信息密度低、留白多，适合知识工作者；钉钉的入口更聚合，适合一线执行角色。
- **增长**：钉钉靠免费 + 组织关系链扩散，飞书靠标杆客户与文档分享的天然传播。

可借鉴：把高频任务做成「一个入口直达」。不可照抄：对方的组织关系链优势，我们没有。`,
        refs: 11,
      },
    ],
  },
  {
    id: 's7',
    title: '用户访谈提纲（Mom Test）',
    group: '7 天内',
    messages: [
      {
        role: 'assistant',
        text: `访谈的核心是问「过去做了什么」，不要问「你以后会不会用」。可以按这组问题走：

- 最近一次遇到这个问题是什么时候？当时具体在做什么？
- 那次你是怎么解决的？用了什么工具或找谁帮忙？
- 这个过程花了你多少时间/多少钱？
- 有没有哪次因为没解决，直接放弃了这件事？
- 你为这件事付过费吗？付给谁、多少？
- 如果明天这个工具消失，你会怎么办？

收尾别问「你觉得这个功能怎么样」，改问「你身边还有谁也有这个问题，能帮我引荐吗」。`,
        refs: 5,
      },
    ],
  },
  {
    id: 's8',
    title: '埋点方案：下单转化漏斗',
    group: '7 天内',
    messages: [
      {
        role: 'assistant',
        text: `漏斗埋点建议按「页面 + 动作 + 结果」三层命名，避免后期对不上数据：

- **曝光**：cart_view（进购物车）、checkout_view（进结算页）、pay_view（进支付页）。
- **动作**：sku_select、address_submit、coupon_apply、pay_click。
- **结果**：order_create（成功）、order_fail（失败，带 fail_reason）。

每个事件统一带 user_id、session_id、page_from、device、ab_group、version 六个公共字段。验收时按「同一 session 能否串起完整链路」自测一遍，比看文档靠谱。`,
        refs: 10,
      },
    ],
  },
  {
    id: 's9',
    title: 'Q4 版本路线图排期',
    group: '7 天内',
    messages: [
      {
        role: 'assistant',
        text: `排路线图先定「本季度只证明一件事」，再谈功能清单：

- **主线**：选一个能验证核心假设的方向（例如「自助开通能否降低 30% 的售前沟通成本」）。
- **支线**：只放支撑主线的必要能力，其余需求进「不做清单」并写明原因。
- **节奏**：每 2 周一个可验收的切片，避免最后两周才发现技术风险。
- **缓冲**：预留 20% 产能给线上问题与依赖方延期，不预留的排期基本都会崩。

评审时带上「如果只能做一半，砍哪一半」，团队对优先级的判断会清楚很多。`,
        refs: 4,
      },
    ],
  },
  {
    id: 's10',
    title: '需求评审常见卡点',
    group: '7 天内',
    messages: [
      {
        role: 'assistant',
        text: `评审被打回，通常不是方案不够好，而是这几件事没说清：

- **问题没被证明**：只有「用户反馈想要」，没有数据或访谈佐证。
- **范围太模糊**：没有明确「本期不做什么」，研发无法估工作量。
- **异常态缺失**：只写了主流程，没写空态、超时、失败重试、权限不足。
- **依赖没对齐**：三方接口、其他团队排期都没确认，估出来的工期是假的。
- **验收不可量化**：写「体验更好」，而不是「提交成功率高 5 个点」。

把这五项做成评审清单，会前逐条自查，通过率会明显提升。`,
        refs: 6,
      },
    ],
  },
  {
    id: 's11',
    title: 'DAU/MAU 指标口径定义',
    group: '30 天内',
    messages: [
      {
        role: 'assistant',
        text: `口径要先定死，否则每次汇报都要重新吵一遍：

- **DAU**：当日有「有效行为」的去重用户数。有效行为要显式定义（登录不算，需有核心动作），否则会被推送拉动虚高。
- **MAU**：自然月内去重，与 DAU 用同一套有效行为定义。
- **粘性**：DAU/MAU 建议看 30 日滚动均值，单日波动没有解释力。
- **剔除规则**：内部账号、测试账号、爬虫流量统一在白名单里排除。

落地时把口径写进指标字典，包含：定义、SQL、负责人、更新频率，避免同一指标多个版本。`,
        refs: 3,
      },
    ],
  },
  {
    id: 's12',
    title: '上线复盘：支付故障 40 分钟',
    group: '30 天内',
    messages: [
      {
        role: 'assistant',
        text: `复盘的目标是改系统，不是找人背锅。建议按这个结构写：

- **事实**：故障起止时间、影响订单数、失败率峰值、用户投诉量。
- **时间线**：从首次告警到恢复的每一步，标注发现延迟与决策延迟。
- **根因**：直接原因（如证书过期）+ 系统性原因（无到期监控、无灰度、回滚流程需人工审批）。
- **改进项**：每项必须有负责人和截止日期，区分「本周必须做」和「下个迭代做」。
- **验证方式**：改进项上线后如何证明有效（演练、监控看板、混沌测试）。

只写「加强测试意识」这种改进项的复盘，等于没做。`,
        refs: 7,
      },
    ],
  },
  {
    id: 's13',
    title: '定价方案：按席位 vs 按用量',
    group: '30 天内',
    messages: [
      {
        role: 'assistant',
        text: `两种模式没有绝对优劣，看你的价值交付方式：

- **按席位**：适合价值随人数增长的产品（协作、管理类）。收入可预测、销售好讲，但会抑制客户把产品推广给更多人。
- **按用量**：适合价值随调用量增长的产品（API、算力、消息）。增长弹性大，但客户预算不可控，容易在月底被砍量。
- **混合**：底价含基础席位 + 超出部分按用量，是当前 B 端最常见的折中。

验证方法：先算「客户价值 / 我们收费」的比值，再看同行的定价锚点。定价不是一次定终身，建议留 2 档可调空间做小范围测试。`,
        refs: 5,
      },
    ],
  },
]

const SUGGESTIONS = [
  '帮我评审这份 PRD，列出风险点',
  '用 RICE 给这 5 个需求排优先级',
  '设计新用户留存的指标体系',
  '写 10 条用户访谈问题（Mom Test）',
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
              <Avatar size={30} src={withBase('/avatar.webp')} />
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
