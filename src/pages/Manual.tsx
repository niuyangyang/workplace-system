import { useEffect, useMemo, useState } from 'react'
import { Card, Col, Collapse, Empty, Layout, Row, Tag } from 'antd'
import {
  ArrowRightOutlined,
  CloseCircleFilled,
  SearchOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import HomeNav from '../components/HomeNav'
import AppFooter from '../components/Footer'
import { apps } from '../apps'
import './home.css'
import './manual.css'

const { Content } = Layout

/* 目录（左侧吸顶，滚动高亮） */
const SECTIONS = [
  { id: 'manual-quick', label: '快速上手' },
  { id: 'manual-roles', label: '按角色找答案' },
  { id: 'manual-faq', label: '常见问答' },
  { id: 'manual-func', label: '功能详解' },
  { id: 'manual-tips', label: '操作技巧' },
  { id: 'manual-glossary', label: '名词解释' },
  { id: 'manual-support', label: '环境与支持' },
]

/* ===== 1 快速上手：五步走完主流程 ===== */
const QUICK_STEPS = [
  {
    no: 1,
    title: '进入首页',
    desc: '登录后落在门户首页，顶部导航在 首页 / 待办事项 / 通知公告 / 使用手册 之间切换，banner 区块保持不变。',
    path: '/',
  },
  {
    no: 2,
    title: '找到应用',
    desc: '在「应用中心」按名称找应用，鼠标悬停可看用途，点击卡片在新标签页打开对应系统。',
    path: '/',
  },
  {
    no: 3,
    title: '处理待办',
    desc: '每天先看「待办事项」：按事项类型辨认要做的事，点操作列的「处理」进入来源系统办理。',
    path: '/todos',
  },
  {
    no: 4,
    title: '阅读公告',
    desc: '「通知公告」点标题查看全文，带附件的公告在正文下方可直接下载；置顶公告排在最前。',
    path: '/notices',
  },
  {
    no: 5,
    title: '查询制度',
    desc: '制度类问题到「制度前台」搜索名称或文号，可查看历史版本并做版本对比。',
    path: '/app/policy',
  },
]

/* ===== 2 按角色找答案 ===== */
const ROLES = [
  {
    role: '新员工',
    focus: '入职第一周',
    items: [
      { text: '在企业文档中心读新人指引与常用模板', path: '/app/docs' },
      { text: '在人员组织查看部门架构与同事信息', path: '/app/org' },
      { text: '在制度前台查阅员工手册、考勤与假期规定', path: '/app/policy' },
    ],
  },
  {
    role: '普通员工',
    focus: '日常工作',
    items: [
      { text: '用待办事项处理各系统推送的任务', path: '/todos' },
      { text: '用通知公告跟进放假、制度发布等消息', path: '/notices' },
      { text: '对征求意见的制度提交意见', path: '/app/policy' },
    ],
  },
  {
    role: '部门负责人',
    focus: '带团队',
    items: [
      { text: '在人员组织查看组织架构与人员信息', path: '/app/org' },
      { text: '在制度管理的评审管理处理待评审制度', path: '/app/system' },
      { text: '用数据大屏看团队籍贯与学历、司龄结构', path: '/app/bigscreen' },
    ],
  },
  {
    role: '制度 / 系统管理员',
    focus: '配置与运维',
    items: [
      { text: '走完制度管理的起草、发起评审、发布、版本全流程', path: '/app/system' },
      { text: '在需求管理维护 PRD 文档与功能、数据权限', path: '/app/system' },
      { text: '用人物画像查看员工多维画像与协作网络', path: '/app/persona' },
    ],
  },
]

/* ===== 3 常见问答（按主题分组折叠） ===== */
const FAQ_GROUPS = [
  {
    group: '账号与权限',
    items: [
      {
        q: '忘记密码怎么办？',
        a: '在登录页点「忘记密码」，通过企业邮箱或手机号验证后重置。连续 5 次输错会锁定账号 30 分钟。',
      },
      {
        q: '为什么登录后看不到某个应用？',
        a: '应用中心按角色权限展示。若确认应有权限却看不到，请联系 IT 服务台，附上工号与需要的应用名称。',
      },
      {
        q: '数据权限怎么申请？',
        a: '在「制度管理 → 需求管理 → 数据权限」可查看当前数据范围规则；新增权限走审批中心提交申请，由数据责任人审批。',
      },
      {
        q: '同一个账号能在多台设备登录吗？',
        a: '可以。同一账号最多同时在线 3 台设备，超出时最早登录的设备会被退出。',
      },
    ],
  },
  {
    group: '待办与审批',
    items: [
      {
        q: '待办多久同步一次？',
        a: '各业务系统实时推送，列表每 5 分钟静默刷新一次；急事可直接刷新页面获取最新列表。',
      },
      {
        q: '为什么我没有收到待办？',
        a: '待办由流程节点推送给当前处理人。若流程卡在上一步，或你不是该节点的处理人，就不会出现在你的列表里。',
      },
      {
        q: '点「处理」会跳到哪里？',
        a: '跳转到该事项在来源系统中的处理页面（新标签页打开）。处理结果实时回写，对应待办随之消失。',
      },
      {
        q: '处理完能撤回吗？',
        a: '处理动作一经提交不可撤回。确需更正时，请在来源系统发起反向流程或联系流程管理员。',
      },
    ],
  },
  {
    group: '通知与附件',
    items: [
      {
        q: '附件下载失败怎么办？',
        a: '先确认浏览器未拦截下载（地址栏右侧提示）、网络可访问附件服务；仍失败请把公告标题与附件名反馈 IT 服务台。',
      },
      {
        q: '怎样少收某类通知？',
        a: '通知按来源系统与分类推送，可在各业务系统的消息设置中关闭对应分类。门户的「通知公告」用于完整查阅，不会漏掉正式公告。',
      },
      {
        q: '置顶公告的规则是什么？',
        a: '由发布单位在发布时勾选置顶。置顶公告固定排在列表最前，一般设有自动取消时间，到期后回到按发布时间排序。',
      },
      {
        q: '公告能转发给别人吗？',
        a: '可以。复制浏览器地址栏链接发给同事即可，但对方需要有对应系统的访问权限才能打开。',
      },
    ],
  },
  {
    group: '制度相关',
    items: [
      {
        q: '怎么查最新版本？',
        a: '在「制度前台」搜索制度名称或文号，详情页顶部即显示当前生效版本；历史版本在版本列表中按时间倒序排列。',
      },
      {
        q: '怎么对比两个版本？',
        a: '在制度详情页点「版本对比」，选择要对比的版本，页面并排展示差异：新增内容绿色、删除内容红色高亮。',
      },
      {
        q: '意见提交后去哪里看回复？',
        a: '进入「意见征集」中对应的制度，征集详情页展示你的意见条目与处理状态，状态变为「已采纳 / 已说明」时可查看回复。',
      },
      {
        q: '「意见征集」和「评审」有什么区别？',
        a: '评审是内部专家与管理者的分级流转审批，决定制度能否发布；意见征集是面向全员的公开征求意见，结果作为评审的参考输入。',
      },
    ],
  },
  {
    group: '文档中心',
    items: [
      {
        q: '怎么新建文档？',
        a: '在「企业文档中心 → 开始」选择新建文档或新建表格，指定归属知识库后即可进入在线编辑。',
      },
      {
        q: '能多人协作编辑吗？',
        a: '当前为单人编辑并保留版本记录；实时多人协作在规划中。',
      },
      {
        q: '文件大小与格式有限制吗？',
        a: '单个文件建议不超过 50MB，支持常见办公文档以及图片、PDF 附件。',
      },
      {
        q: '为什么看不到某个知识库？',
        a: '知识库按部门与角色授权。需要访问时联系该知识库管理员或 IT 服务台开通。',
      },
    ],
  },
  {
    group: '数据大屏与画像',
    items: [
      {
        q: '数据多久刷新一次？',
        a: '大屏每 1.5 分钟自动刷新，各项分布之和始终等于总人数；人物画像的指标与大屏同步。',
      },
      {
        q: '数字和别的系统不一致，以哪个为准？',
        a: '以人力主数据（人员组织）为准。大屏按主数据口径聚合，差异通常来自口径不同（如在离职状态的处理方式）。',
      },
      {
        q: '全屏打不开或显示不全怎么办？',
        a: '大屏建议 1920×1080 及以上分辨率、浏览器缩放 100%。笔记本小屏可先按 F11，再点页面内的全屏按钮。',
      },
      {
        q: '能否导出大屏数据？',
        a: '暂不开放导出。需要数据用于汇报时，请向数据责任人申请，按数据权限流程获取。',
      },
    ],
  },
]

/* ===== 4 功能详解（仅已交付应用） ===== */
const FUNC_GROUPS = [
  {
    title: '制度与文档',
    intro: '制度的起草、评审、发布与文档协同',
    items: [
      {
        id: 'system',
        tip: '评审人需在截止时间前完成意见填写，逾期会自动提醒发起人。',
        steps: [
          '左侧菜单依次为：数据看板 / 智能起草 / 制度管理 / 评审管理 / 意见征集 / 需求管理',
          '「数据看板」查看制度总量、评审进度等概览指标',
          '「智能起草」按向导生成制度初稿，可插入 AI 生成的章节后保存',
          '「制度管理 → 发起评审」选择制度与评审人提交；「制度清单」查看全部制度及状态',
          '「评审管理 → 待评审 / 已评审」处理评审任务、填写意见并推进流转',
          '「需求管理」下查看 PRD 文档、功能权限、数据权限三块配置',
        ],
      },
      {
        id: 'policy',
        tip: '版本对比以最早版本为基准，右侧可切换要对比的版本。',
        steps: [
          '顶部搜索框支持按制度名称、文号或关键词检索',
          '左侧「按制度分类」等筛选项可进一步缩小范围',
          '点制度标题进入详情页（新标签页打开），查看正文、附件与历史版本',
          '详情页点「版本对比」打开并排 diff 页，切换对比版本查看差异',
          '「意见征集」列出正在征集意见的制度，进入后可在线阅读并提交意见',
        ],
      },
      {
        id: 'docs',
        tip: 'AI 写作与收藏为筹备中能力，当前以知识库与在线编辑为主。',
        steps: [
          '左侧菜单：开始 / 知识库 / AI写作 / 收藏 / 逛逛',
          '「开始」页提供新建文档、新建表格两个快捷入口，创建时选择归属知识库',
          '「知识库」下分 5 个库（产品规划库、安全规范库、会议纪要库、人事制度库、财务共享库）',
          '打开文档进入在线编辑，右侧大纲随标题层级自动生成，便于长文跳转',
          '「逛逛」浏览全部知识库与文档；「收藏」集中展示常用文档',
        ],
      },
    ],
  },
  {
    title: '人员与组织',
    intro: '组织架构与人员信息维护',
    items: [
      {
        id: 'org',
        tip: '从应用中心卡片进入时默认落在「首页」（带 entry=center 参数），直接访问则默认进入组织管理。',
        steps: [
          '左侧菜单：首页 / 人员管理 / 组织管理',
          '「组织管理」在组织树上新增、调整部门与岗位，节点右侧可查看与编辑详情',
          '「人员管理」按组织筛选人员列表，点开某位员工查看其完整信息',
          '「首页」为组织概览视图，适合进入后台先扫一眼整体情况',
        ],
      },
    ],
  },
  {
    title: '空间与数据',
    intro: '办公空间、可视化分析与员工画像（建议 1920×1080 及以上全屏查看）',
    items: [
      {
        id: 'building',
        tip: '演示数据由程序生成；接入真实平面图或门禁数据时，仅替换 src/data/building.ts。',
        steps: [
          '第一级为楼栋三维：拖拽旋转、滚轮缩放，悬停楼层在左侧列表高亮，点击选中该层',
          '点击楼层后直接淡入该层内部，无需二次确认',
          '左侧「楼层占用」列表展示每层工位数与占用率，点击直达该层',
          '「查找工位」输入姓名 / 工号 / 工位号，一键定位到对应房间并打开详情',
          '第二级为楼层内部三维：悬停房门弹出引线面板，展示该房间的人员名单，点击房门进入',
          '进入房间后每个工位上方显示使用者名牌，点击工位打开详情抽屉（员工 / 设备 / 邻座 / 变更记录）',
        ],
      },
      {
        id: 'bigscreen',
        tip: '地图为离线数据，无需联网加载；数据每 1.5 分钟自动刷新一次。',
        steps: [
          '中央为中国地图，鼠标移到任一省份即可查看该省职务人数，右侧榜单同步高亮',
          '四角面板分别为：核心 KPI、性别分布、学历与职务占比同心圆环、司龄与年龄折线',
          '底部队列滚动展示人员信息；地图角落提供缩放与复位，右上角可一键全屏',
          '各项分布之和恒等于总人数，海南与南海诸岛按规范单独成图',
        ],
      },
      {
        id: 'persona',
        tip: '当前各项数值为示例数据，接入后按人力主数据口径展示。',
        steps: [
          '中央为全息网格人物建模，用于员工画像展示',
          '顶部 4 项核心指标：综合能力评分、岗位匹配度、任务完成率、协作活跃度',
          '左上「基本信息」（工号 / 部门 / 职级 / 司龄等）、左下六维「能力标签」雷达',
          '右上「行为偏好」（高效时段、响应时长、交付准时率等），右下「关联网络」协作 Top5',
          '底部为横向成长时间线，记录关键节点',
        ],
      },
    ],
  },
]

/* ===== 5 操作技巧 ===== */
const TIPS: [string, string][] = [
  ['点击应用卡片', '在新标签页打开对应系统，原页面不丢失'],
  ['Esc 键', '关闭公告详情抽屉'],
  ['点表格列头', '按该列排序（升序 / 降序切换）'],
  ['鼠标移到地图省份', '显示该省职务人数，右侧榜单同步高亮'],
  ['大屏右上角全屏按钮', '进入全屏演示，Esc 退出'],
  ['浏览器缩放保持 100%', '大屏与画像页布局最稳，建议 1920×1080'],
]

/* ===== 6 名词解释 ===== */
const GLOSSARY: [string, string, string][] = [
  ['评审', '制度发布前的分级流转审批，决定制度能否发布', '制度管理 · 评审管理'],
  ['意见征集', '面向全员公开征求意见，结果作为评审的参考输入', '制度前台 · 意见征集'],
  ['征求意见稿', '征集阶段对外展示的草案版本，尚未生效', '制度前台 · 详情页'],
  ['生效版本', '当前正在执行的版本，员工以该版本为准', '制度前台 · 详情页'],
  ['版本对比', '两个版本并排展示差异，新增绿、删除红', '制度前台 · 版本对比'],
  ['知识库', '文档的分类空间，按部门与角色授权', '企业文档中心'],
  ['组织节点', '组织树中的一个部门或岗位单元', '人员组织 · 组织管理'],
  ['职级', '员工在岗级序列中的级别（如 P7、M3）', '人员组织 · 人员管理'],
  ['功能权限', '决定能使用哪些菜单与操作按钮', '制度管理 · 需求管理'],
  ['数据权限', '决定能查看哪个范围的数据（如本部门）', '制度管理 · 需求管理'],
]

/* ===== 7 环境与支持 ===== */
const ENV_ROWS: [string, string][] = [
  ['浏览器', 'Chrome 100+ / Edge 100+（不支持 IE）'],
  ['分辨率', '≥ 1440×1080；数据大屏与人物画像建议 1920×1080 全屏'],
  ['网络', '需可访问公司内网；地图数据已离线内置，不依赖外部服务'],
  ['服务时间', '工作日 9:00–18:00，紧急问题随时响应'],
  ['支持渠道', 'IT 服务台 分机 8600 · it-help@example.com · 服务工单入口'],
]

const CHANGELOG = [
  { version: 'v1.0', date: '2026-09-19', text: '使用手册上线：新增快速上手、常见问答、功能详解、术语表与操作技巧；门户导航新增本页入口。' },
  { version: 'v0.9', date: '2026-09-18', text: '通知公告支持附件在线下载；列表每页调整为 8 条。' },
  { version: 'v0.8', date: '2026-09-17', text: '应用中心改版为四列卡片；新增人物画像（全息人物建模）。' },
]

/* 即将上线：占位应用（不混进正文步骤） */
const UPCOMING = ['考勤打卡', '审批中心', '通讯录', '工作日报', '会议室预订', '公告通知', '任务看板', '薪资绩效', '假期管理']

/* 热门搜索词 */
const HOT_WORDS = ['待办处理', '附件下载', '版本对比', '权限申请', '数据刷新']

type Hit = { section: string; anchor: string; title: string; body: string }

export default function Manual() {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(SECTIONS[0].id)

  /* 搜索索引：手册全部正文内容 */
  const index = useMemo<Hit[]>(() => {
    const list: Hit[] = []
    QUICK_STEPS.forEach((s) =>
      list.push({
        section: '快速上手',
        anchor: 'manual-quick',
        title: `${s.no}. ${s.title}`,
        body: `${s.desc}（入口：${s.path}）`,
      }),
    )
    ROLES.forEach((r) =>
      r.items.forEach((i) =>
        list.push({
          section: '按角色找答案',
          anchor: 'manual-roles',
          title: `${r.role}：${i.text}`,
          body: `常用入口：${i.path}`,
        }),
      ),
    )
    FAQ_GROUPS.forEach((g) =>
      g.items.forEach((it) =>
        list.push({ section: '常见问答', anchor: 'manual-faq', title: it.q, body: it.a }),
      ),
    )
    FUNC_GROUPS.forEach((g) =>
      g.items.forEach((it) => {
        const app = apps.find((a) => a.id === it.id)
        if (!app) return
        list.push({
          section: '功能详解',
          anchor: 'manual-func',
          title: app.name,
          body: `${app.desc}。操作：${it.steps.join('；')}。提示：${it.tip}`,
        })
      }),
    )
    TIPS.forEach((t) =>
      list.push({ section: '操作技巧', anchor: 'manual-tips', title: t[0], body: t[1] }),
    )
    GLOSSARY.forEach((g) =>
      list.push({
        section: '名词解释',
        anchor: 'manual-glossary',
        title: g[0],
        body: `${g[1]}（出现位置：${g[2]}）`,
      }),
    )
    ENV_ROWS.forEach((r) =>
      list.push({ section: '环境与支持', anchor: 'manual-support', title: r[0], body: r[1] }),
    )
    return list
  }, [])

  const hits = useMemo(() => {
    const kw = q.trim().toLowerCase()
    if (!kw) return []
    return index.filter((h) => `${h.title} ${h.body}`.toLowerCase().includes(kw))
  }, [q, index])

  /* 滚动时高亮当前章节（窗口滚动；本页为门户页，非后台内滚容器） */
  useEffect(() => {
    if (q) return
    const onScroll = () => {
      let current = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (!el) continue
        if (el.getBoundingClientRect().top - 140 <= 0) current = s.id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [q])

  /* 点目录：先清除搜索（搜索态下章节被替换），再滚到目标节 */
  const go = (id: string) => {
    if (q) {
      setQ('')
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openApp = (id: string) =>
    window.open(`/app/${id}${id === 'org' ? '?entry=center' : ''}`, '_blank')

  return (
    <Layout className="manual-layout">
      {/* banner：只保留搜索框 + 热门搜索（不放标题与说明，保持背景与导航一致） */}
      <section className="hero" style={{ backgroundImage: 'url(/banner.webp)' }}>
        <Navbar nav={<HomeNav />} />
        <div className="manual-hero">
          <span className="manual-search">
            <SearchOutlined className="manual-search-icon" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索功能、操作或问题，例如「附件下载」「版本对比」"
              aria-label="搜索使用手册"
            />
            {q && (
              <CloseCircleFilled
                className="manual-search-clear"
                onClick={() => setQ('')}
                role="button"
                aria-label="清除搜索"
              />
            )}
          </span>
          <span className="manual-hot">
            <span className="manual-hot-label">热门：</span>
            {HOT_WORDS.map((w) => (
              <a key={w} onClick={() => setQ(w)}>
                {w}
              </a>
            ))}
          </span>
        </div>
      </section>

      <Content>
        <div className="manual">
          <div className="manual-intro">
            <span>共 7 部分 · 覆盖 {apps.length - UPCOMING.length} 个已交付应用 · 最后更新 2026-09-19</span>
            <span className="manual-intro-tip">遇到问题先用顶部搜索，搜不到再按 FAQ → 功能详解 → 支持渠道的顺序找</span>
          </div>

          <div className="manual-wrap">
            {/* 左侧目录：吸顶 + 滚动高亮 */}
            <aside className="manual-toc">
              <div className="manual-toc-title">目录</div>
              {SECTIONS.map((s, i) => (
                <a
                  key={s.id}
                  className={`manual-toc-link${active === s.id && !q ? ' is-active' : ''}`}
                  onClick={() => go(s.id)}
                >
                  <span className="manual-toc-no">{i + 1}</span>
                  {s.label}
                </a>
              ))}
            </aside>

            <div className="manual-main">
              {/* ===== 搜索结果 ===== */}
              {q ? (
                <section className="manual-sec">
                  <div className="manual-h">
                    <h3>搜索结果</h3>
                    <span>
                      关键词「{q.trim()}」共 {hits.length} 条
                    </span>
                    <a className="manual-h-action" onClick={() => setQ('')}>
                      清除搜索，返回完整手册
                    </a>
                  </div>
                  <Card variant="borderless">
                    {hits.length === 0 ? (
                      <Empty description="没有找到相关内容，换个关键词试试（如「附件」「权限」）" />
                    ) : (
                      <ul className="hit-list">
                        {hits.map((h, i) => (
                          <li key={`${h.anchor}-${i}`}>
                            <div className="hit-head">
                              <span className="hit-badge">{h.section}</span>
                              <span className="hit-title">{h.title}</span>
                              <a className="hit-go" onClick={() => go(h.anchor)}>
                                查看该节 <ArrowRightOutlined />
                              </a>
                            </div>
                            <div className="hit-body">{h.body}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </section>
              ) : (
                <>
                  {/* ===== 1 快速上手 ===== */}
                  <section id="manual-quick" className="manual-sec">
                    <div className="manual-h">
                      <h3>
                        <span className="manual-h-no">1</span>快速上手
                      </h3>
                      <span>五步走完一遍主流程，新同事 60 秒建立全局认知</span>
                    </div>
                    <Row gutter={[12, 12]}>
                      {QUICK_STEPS.map((s) => (
                        <Col xs={24} sm={12} xl={8} xxl={8} key={s.no}>
                          <Card variant="borderless" className="quick-card">
                            <div className="quick-head">
                              <span className="quick-no">{s.no}</span>
                              <span className="quick-title">{s.title}</span>
                              <code className="manual-path">{s.path}</code>
                            </div>
                            <p className="quick-desc">{s.desc}</p>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </section>

                  {/* ===== 2 按角色找答案 ===== */}
                  <section id="manual-roles" className="manual-sec">
                    <div className="manual-h">
                      <h3>
                        <span className="manual-h-no">2</span>按角色找答案
                      </h3>
                      <span>不确定从哪开始时，先找到自己的角色</span>
                    </div>
                    <Row gutter={[12, 12]}>
                      {ROLES.map((r) => (
                        <Col xs={24} lg={12} xxl={6} key={r.role}>
                          <Card variant="borderless" className="role-card">
                            <div className="role-head">
                              <span className="role-name">{r.role}</span>
                              <span className="role-focus">{r.focus}</span>
                            </div>
                            <ul className="role-list">
                              {r.items.map((i) => (
                                <li key={i.text}>
                                  <a onClick={() => window.open(i.path, '_blank')}>{i.text}</a>
                                  <code className="manual-path">{i.path}</code>
                                </li>
                              ))}
                            </ul>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </section>

                  {/* ===== 3 常见问答 ===== */}
                  <section id="manual-faq" className="manual-sec">
                    <div className="manual-h">
                      <h3>
                        <span className="manual-h-no">3</span>常见问答
                      </h3>
                      <span>按主题分组，点击展开答案</span>
                    </div>
                    <Row gutter={[12, 12]}>
                      {FAQ_GROUPS.map((g) => (
                        <Col xs={24} lg={12} key={g.group}>
                          <Card variant="borderless" className="faq-card">
                            <div className="faq-group">{g.group}</div>
                            <Collapse
                              ghost
                              expandIconPosition="end"
                              items={g.items.map((it, i) => ({
                                key: `${g.group}-${i}`,
                                label: <span className="faq-q">{it.q}</span>,
                                children: <p className="faq-a">{it.a}</p>,
                              }))}
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </section>

                  {/* ===== 4 功能详解 ===== */}
                  <section id="manual-func" className="manual-sec">
                    <div className="manual-h">
                      <h3>
                        <span className="manual-h-no">4</span>功能详解
                      </h3>
                      <span>仅收录已交付应用，按业务域分组</span>
                    </div>
                    {FUNC_GROUPS.map((g) => (
                      <div className="func-group" key={g.title}>
                        <div className="func-group-head">
                          <h4>{g.title}</h4>
                          <span>{g.intro}</span>
                        </div>
                        <Row gutter={[12, 12]}>
                          {g.items.map((item) => {
                            const app = apps.find((a) => a.id === item.id)
                            if (!app) return null
                            return (
                              <Col xs={24} xl={12} key={item.id}>
                                <Card variant="borderless" className="func-card">
                                  <div className="func-head">
                                    <span className="func-icon">{app.icon}</span>
                                    <div className="func-meta">
                                      <div className="func-name">{app.name}</div>
                                      <div className="func-desc">{app.desc}</div>
                                    </div>
                                    <a className="func-open" onClick={() => openApp(app.id)}>
                                      打开 <ArrowRightOutlined />
                                    </a>
                                  </div>
                                  <ol className="func-steps">
                                    {item.steps.map((s) => (
                                      <li key={s}>{s}</li>
                                    ))}
                                  </ol>
                                  <div className="func-tip">
                                    <b>提示</b>
                                    {item.tip}
                                  </div>
                                  <div className="func-path">
                                    入口：<code className="manual-path">/app/{app.id}</code>
                                  </div>
                                </Card>
                              </Col>
                            )
                          })}
                        </Row>
                      </div>
                    ))}
                    <div className="func-upcoming">
                      <b>即将上线</b>
                      {UPCOMING.join(' · ')}
                      <span>（应用中心已预留入口，点击进入为占位说明页）</span>
                    </div>
                  </section>

                  {/* ===== 5 操作技巧 ===== */}
                  <section id="manual-tips" className="manual-sec">
                    <div className="manual-h">
                      <h3>
                        <span className="manual-h-no">5</span>操作技巧
                      </h3>
                      <span>高频操作与对应结果</span>
                    </div>
                    <Card variant="borderless" styles={{ body: { padding: 0 } }}>
                      <div className="kv-table">
                        <div className="kv-row kv-head">
                          <span>操作</span>
                          <span>结果</span>
                        </div>
                        {TIPS.map((t) => (
                          <div className="kv-row" key={t[0]}>
                            <span className="kv-key">{t[0]}</span>
                            <span className="kv-val">{t[1]}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </section>

                  {/* ===== 6 名词解释 ===== */}
                  <section id="manual-glossary" className="manual-sec">
                    <div className="manual-h">
                      <h3>
                        <span className="manual-h-no">6</span>名词解释
                      </h3>
                      <span>制度与权限相关的常用术语</span>
                    </div>
                    <Card variant="borderless" styles={{ body: { padding: 0 } }}>
                      <div className="kv-table">
                        <div className="kv-row kv-head kv-3">
                          <span>术语</span>
                          <span>含义</span>
                          <span>出现位置</span>
                        </div>
                        {GLOSSARY.map((g) => (
                          <div className="kv-row kv-3" key={g[0]}>
                            <span className="kv-key">{g[0]}</span>
                            <span className="kv-val">{g[1]}</span>
                            <span className="kv-where">{g[2]}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </section>

                  {/* ===== 7 环境与支持 ===== */}
                  <section id="manual-support" className="manual-sec">
                    <div className="manual-h">
                      <h3>
                        <span className="manual-h-no">7</span>环境与支持
                      </h3>
                      <span>使用前提、求助渠道与版本记录</span>
                    </div>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} lg={14}>
                        <Card variant="borderless" styles={{ body: { padding: 0 } }}>
                          <div className="kv-table">
                            {ENV_ROWS.map((r) => (
                              <div className="kv-row kv-2" key={r[0]}>
                                <span className="kv-key">{r[0]}</span>
                                <span className="kv-val">{r[1]}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                        <div className="manual-note">
                          本系统数据涉及员工个人信息与内部制度，请勿截图外传或导出至外部平台；需要对外提供时按数据权限流程申请。
                        </div>
                      </Col>
                      <Col xs={24} lg={10}>
                        <Card variant="borderless" className="log-card">
                          <div className="log-title">更新记录</div>
                          <ul className="log-list">
                            {CHANGELOG.map((c) => (
                              <li key={c.version}>
                                <span className="log-dot" />
                                <div className="log-body">
                                  <div className="log-head">
                                    <Tag color="red">{c.version}</Tag>
                                    <span className="log-date">{c.date}</span>
                                  </div>
                                  <div className="log-text">{c.text}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </Card>
                      </Col>
                    </Row>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </Content>

      <AppFooter />
    </Layout>
  )
}
