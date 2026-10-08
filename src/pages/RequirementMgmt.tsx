import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Table, Tag, Typography } from 'antd'
import { CheckCircleFilled, MinusOutlined, PrinterOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import Mermaid from '../components/Mermaid'
import './requirementMgmt.css'

const { Paragraph, Text, Title } = Typography

/* ========================================================================
 * 一、PRD 文档 —— 制度管理系统 产品需求说明文档（标准 PRD 格式）
 * ===================================================================== */

// 章节目录（两级）
const PRD_TOC: { id: string; title: string; children?: { id: string; title: string }[] }[] = [
  {
    id: 'overview',
    title: '一、概述',
    children: [
      { id: 'bg', title: '1.1 背景与目标' },
      { id: 'glossary', title: '1.2 名词说明' },
      { id: 'roles', title: '1.3 角色及权限' },
      { id: 'readers', title: '1.4 阅读对象' },
    ],
  },
  {
    id: 'product',
    title: '二、产品描述',
    children: [
      { id: 'flow', title: '2.1 整体流程' },
      { id: 'version', title: '2.2 版本规划' },
      { id: 'framework', title: '2.3 产品框架' },
      { id: 'funclist', title: '2.4 功能清单' },
    ],
  },
  {
    id: 'features',
    title: '三、功能需求',
    children: [
      { id: 'draft', title: '3.1 智能起草' },
      { id: 'policies', title: '3.2 制度管理' },
      { id: 'review', title: '3.3 评审管理' },
      { id: 'opinions', title: '3.4 意见征集' },
      { id: 'reqmgmt', title: '3.5 需求管理' },
      { id: 'dashboard', title: '3.6 数据看板与通知公告' },
    ],
  },
  {
    id: 'nonfunc',
    title: '四、非功能需求',
    children: [
      { id: 'security', title: '4.1 安全与合规' },
      { id: 'tracking', title: '4.2 统计需求' },
      { id: 'perf', title: '4.3 性能需求' },
      { id: 'integration', title: '4.4 系统集成' },
    ],
  },
  {
    id: 'appendix',
    title: '五、附录',
    children: [
      { id: 'accept', title: '5.1 验收标准' },
      { id: 'todo', title: '5.2 待确认项清单' },
    ],
  },
]
const PRD_SECTION_IDS = PRD_TOC.flatMap((c) => [c.id, ...(c.children?.map((x) => x.id) ?? [])])

// 轻量表格 / 用户故事 渲染辅助
function PTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="prd-table">
      <thead>
        <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}
function Story({ role, want, so }: { role: string; want: string; so: string }) {
  return (
    <div className="prd-story">
      作为 <b>{role}</b>，我希望 <b>{want}</b>，以便 <b>{so}</b>。
    </div>
  )
}

const PRD_META = {
  title: '制度管理系统 产品需求说明文档（PRD）',
  version: 'V1.0',
  date: '2026-09-15',
  owner: '王磊（产品经理）',
  status: '评审中',
}

/* ————— 核心业务流程：流程图（Mermaid flowchart） ————— */
const FLOW_OVERALL = `flowchart TD
  A["① 起草人 上传 / 新建制度"] --> B["② 智能起草：解析与核验"]
  B --> C{"③ 是否提交评审"}
  C -- 否 --> B
  C -- 是 --> D["④ 制度管理员 编排评审"]
  D --> E["⑤ 评审管理 · 待评审"]
  E --> F["⑥ 评审专家 在线批注"]
  F --> G{"⑦ 评审结论"}
  G -- 驳回 退回修订 --> B
  G -- 通过 --> H["⑧ 制度清单 · 公示"]
  H --> I["⑨ 意见征集 · 未开始"]
  I --> J["⑩ 进行中：员工分段提意见"]
  J --> K["⑪ 已结束"]
  K --> L["⑫ 数据看板：指标与图表"]
  L -. 驱动下一轮修订 .-> A`

const FLOW_DRAFT = `flowchart LR
  A["上传 Word / PDF"] --> B["系统解析标题层级与条款编号"]
  B --> C{"解析成功"}
  C -- 否 --> D["提示失败原因 · 允许重传"]
  D --> A
  C -- 是 --> E["生成可编辑章节树"]
  E --> F["人工校准：调层级 / 合并拆分"]
  F --> G["入库为「待评审」草稿"]`

const FLOW_REVIEW = `flowchart TD
  A["起草人 提交制度"] --> B["制度管理员 编排评审"]
  B --> C["派发待评审任务"]
  C --> D["评审专家 在线批注 / 讨论"]
  D --> E{"发起人给出结论"}
  E -- 驳回 --> F["退回修订"] --> A
  E -- 通过 --> G["发布并公示"]`

const FLOW_OPINION = `flowchart LR
  A["后台新增征集：标题 / 制度 / 起止时间"] --> B{"按当前时间推导状态"}
  B -- 未到开始时间 --> C["未开始：点击给提示"]
  B -- 处于起止时间内 --> D["进行中：进入提交页"]
  B -- 超过结束时间 --> E["已结束：点击给提示"]
  D --> F["针对正文段落提交意见"]
  F --> G["意见回流后台意见列表"]`

/* ————— 核心业务流程：时序图（Mermaid sequenceDiagram，标注时间节点） ————— */
const SEQ_LIFECYCLE = `sequenceDiagram
  autonumber
  participant D as 起草人
  participant A as 制度管理员
  participant R as 评审专家
  participant E as 员工
  participant S as 系统

  Note over D,S: 时间节点 T0 · 起草期
  D->>S: 上传 / 新建制度文档
  S-->>D: 返回解析出的章节树草稿
  D->>A: 提交评审

  Note over D,S: 时间节点 T1 · 评审期
  A->>R: 派发评审任务
  R->>S: 针对章节 / 条款批注
  R->>A: 给出评审结论
  alt 驳回
    A-->>D: 退回修订
  else 通过
    A->>S: 发布并公示
  end

  Note over D,S: 时间节点 T2 · 征集期
  A->>S: 发起意见征集（设定起止时间）
  S-->>E: 进行中可提交意见
  E->>S: 针对段落提交意见
  S-->>A: 意见实时回流

  Note over D,S: 时间节点 T3 · 复盘期
  S-->>A: 更新指标卡与图表`

const SEQ_OPINION = `sequenceDiagram
  autonumber
  participant A as 制度管理员
  participant S as 系统
  participant E as 员工

  Note over A,E: T0 未开始（当前时间早于开始时间）
  A->>S: 配置并发布征集
  S-->>E: 前台展示在「未开始」分组
  E->>E: 点击提示「征集尚未开始」

  Note over A,E: T1 进行中（处于起止时间内）
  S-->>E: 前台展示在「进行中」分组
  E->>S: 进入提交页 针对段落提意见
  S-->>A: 意见实时汇入意见列表

  Note over A,E: T2 已结束（当前时间晚于结束时间）
  S-->>E: 前台展示在「已结束」分组
  E->>E: 点击提示「征集已结束」`

export function PrdDocs() {
  const [active, setActive] = useState<string>('overview')
  const rootRef = useRef<HTMLDivElement | null>(null)

  // 滚动时高亮当前章节
  useEffect(() => {
    const root = document.querySelector('.sys-content') as HTMLElement | null
    if (!root) return
    const onScroll = () => {
      const rootTop = root.getBoundingClientRect().top
      let current = PRD_SECTION_IDS[0]
      for (const id of PRD_SECTION_IDS) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - rootTop - 110 <= 0) current = id
      }
      setActive(current)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => root.removeEventListener('scroll', onScroll)
  }, [])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const renderToc = (items: typeof PRD_TOC) =>
    items.map((c) => (
      <div className="prd-toc-ch" key={c.id}>
        <a
          className={'prd-toc-link' + (active === c.id ? ' is-active' : '')}
          onClick={() => go(c.id)}
        >
          {c.title}
        </a>
        {c.children && (
          <div className="prd-toc-sub">
            {c.children.map((s) => (
              <a
                key={s.id}
                className={'prd-toc-link prd-toc-sublink' + (active === s.id ? ' is-active' : '')}
                onClick={() => go(s.id)}
              >
                {s.title}
              </a>
            ))}
          </div>
        )}
      </div>
    ))

  return (
    <div className="prd-doc-page" ref={rootRef}>
      {/* 左侧目录 */}
      <aside className="prd-doc-toc">
        <div className="prd-toc-title">目录</div>
        {renderToc(PRD_TOC)}
        <Button icon={<PrinterOutlined />} className="prd-print-btn" onClick={() => window.print()}>
          打印 / 导出 PDF
        </Button>
      </aside>

      {/* 右侧正文 */}
      <div className="prd-doc-content">
        <div className="prd-doc-head">
          <Title level={2} style={{ marginBottom: 8 }}>{PRD_META.title}</Title>
          <div className="prd-doc-meta">
            <span>版本：<Tag color="blue">{PRD_META.version}</Tag></span>
            <span>日期：{PRD_META.date}</span>
            <span>负责人：{PRD_META.owner}</span>
            <span>状态：<Tag color="green">{PRD_META.status}</Tag></span>
          </div>
        </div>

        {/* ===== 一、概述 ===== */}
        <section id="overview" className="prd-sec">
          <Title level={3}>一、概述</Title>

          <section id="bg" className="prd-sec">
            <Title level={4}>1.1 背景与目标</Title>
            <Paragraph>
              <Text strong>背景：</Text>企业制度（含规章制度、管理办法、操作细则）长期以 Word / PDF
              文档散落在各部门，存在版本混乱、查找困难、修订无留痕、员工意见无回收渠道等问题。随着制度数量增长（当前已纳管
              600+ 项），亟需一套集中化的制度管理系统，覆盖「起草 → 评审 → 发布 → 公示 → 意见征集 → 统计」全生命周期。
            </Paragraph>
            <Paragraph>
              <Text strong>产品目标：</Text>
            </Paragraph>
            <ul className="prd-ul">
              <li><b>业务目标：</b>制度起草到发布周期缩短 40%；评审意见线上闭环率 100%；员工意见回收率提升。</li>
              <li><b>用户目标：</b>起草人可快速生成结构化草稿；评审专家可在线批注；员工可针对正文段落便捷提意见。</li>
            </ul>
            <Paragraph>
              <Text strong>目标用户：</Text>制度起草人、部门负责人、评审专家、制度管理员、系统管理员、普通员工（意见提报方）。
            </Paragraph>
          </section>

          <section id="glossary" className="prd-sec">
            <Title level={4}>1.2 名词说明</Title>
            <PTable
              head={['名词', '说明']}
              rows={[
                ['制度', '企业发布的正式规范性文件，含文号、版本、责任部门、状态等属性。'],
                ['起草草稿', '智能解析后尚未进入评审的临时文档，归属起草人个人。'],
                ['评审', '由发起人对制度组织专家评审，最终给出通过/驳回结论。'],
                ['公示', '制度发布后对外公开的阶段，员工可查看并进入意见征集。'],
                ['意见征集', '针对某制度发起的、带起止时间的征集活动，员工可提交段落级意见。'],
                ['数据权限', '按「当前部门 + 角色」过滤可见数据的隔离机制。'],
              ]}
            />
          </section>

          <section id="roles" className="prd-sec">
            <Title level={4}>1.3 角色及权限</Title>
            <Paragraph>系统共 6 类角色，权限矩阵详见「需求管理 / 功能权限」。下表为职责摘要：</Paragraph>
            <PTable
              head={['角色', '核心职责', '数据范围']}
              rows={[
                ['系统管理员', '系统配置、全局数据与权限管理', '全部'],
                ['制度管理员', '制度起草审核、评审编排、征集发起', '全部 / 本部门'],
                ['评审专家', '参与评审、对章节/条款批注', '所参与的评审'],
                ['起草人', '新建起草、解析核验、提交评审', '本人 + 本部门'],
                ['部门负责人', '本部门制度审核、提交评审', '本部门'],
                ['普通员工', '查看已公示制度、提交意见', '已公示 + 本部门'],
              ]}
            />
          </section>

          <section id="readers" className="prd-sec">
            <Title level={4}>1.4 文档阅读对象</Title>
            <Paragraph>产品/项目经理（评审与排期）、研发（功能实现）、测试（验收）、业务方（需求确认）、运维（非功能与集成）。</Paragraph>
          </section>
        </section>

        {/* ===== 二、产品描述 ===== */}
        <section id="product" className="prd-sec">
          <Title level={3}>二、产品描述</Title>

          <section id="flow" className="prd-sec">
            <Title level={4}>2.1 整体流程</Title>
            <Paragraph>
              制度全生命周期主流程如下图所示（起草 → 评审 → 发布公示 → 意见征集 → 统计看板 → 驱动修订），
              其中①~⑫为业务节点编号，方块为处理步骤，菱形为判断分支。
            </Paragraph>
            <p className="mmd-cap">图 2-1 制度全生命周期业务流程图</p>
            <Mermaid chart={FLOW_OVERALL} />

            <Paragraph>
              下图以时序图展示各角色在不同<Text strong>时间节点</Text>（T0 起草期 / T1 评审期 / T2 征集期 / T3 复盘期）
              分别做什么，纵向为时间推进，横向为参与角色。
            </Paragraph>
            <p className="mmd-cap">图 2-2 制度生命周期时序图（按时间节点）</p>
            <Mermaid chart={SEQ_LIFECYCLE} />
          </section>

          <section id="version" className="prd-sec">
            <Title level={4}>2.2 版本规划</Title>
            <PTable
              head={['版本', '范围', '目标']}
              rows={[
                ['V1.0', '智能起草、制度管理、评审管理、意见征集', '制度全生命周期线上化'],
                ['V1.1', '数据看板、通知公告', '管理决策可视化'],
                ['V1.2', '需求管理（PRD/功能权限/数据权限）', '产品与权限资产沉淀'],
                ['V2.0', '移动端提报、流程自定义', '提效与扩展 [待确认]'],
              ]}
            />
          </section>

          <section id="framework" className="prd-sec">
            <Title level={4}>2.3 产品框架</Title>
            <Paragraph>后台一级菜单：数据看板 / 智能起草 / 制度管理 / 评审管理 / 意见征集 / 需求管理（最末）。前台门户：制度列表首页、意见收集。</Paragraph>
          </section>

          <section id="funclist" className="prd-sec">
            <Title level={4}>2.4 功能清单</Title>
            <PTable
              head={['模块', '功能', '优先级', '状态']}
              rows={[
                ['智能起草', 'Word/PDF 解析、章节树编辑、重新解析', 'P0', '已发布'],
                ['制度管理', '发起评审、制度清单、公示', 'P0', '已发布'],
                ['评审管理', '待评审/已评审、在线批注、结论', 'P0', '已发布'],
                ['意见征集', '后台发起、前台分段提意见、意见回流', 'P0', '已发布'],
                ['需求管理', 'PRD 文档、功能权限、数据权限', 'P1', '草稿'],
                ['数据看板', '6 指标卡、5 图表、通知公告', 'P1', '已发布'],
              ]}
            />
          </section>
        </section>

        {/* ===== 三、功能需求 ===== */}
        <section id="features" className="prd-sec">
          <Title level={3}>三、功能需求</Title>

          <section id="draft" className="prd-sec">
            <Title level={4}>3.1 智能起草</Title>
            <Paragraph><Text strong>描述：</Text>起草人上传 Word/PDF，系统解析出标题层级与条款编号，生成可编辑章节树，支持人工校准后入库为「待评审」草稿。</Paragraph>
            <Story role="起草人" want="上传制度文档后自动生成结构化草稿树" so="减少手工排版、快速进入评审" />
            <Paragraph><Text strong>前置条件：</Text>已登录且具备「新建起草」权限。<Text strong>后置条件：</Text>草稿进入「我的草稿」，可提交评审。</Paragraph>
            <Paragraph><Text strong>界面与交互：</Text>上传控件（含解析进度）、章节树（拖拽调层级/合并拆分）、术语补充、一键入库。</Paragraph>
            <Paragraph><Text strong>业务流程：</Text></Paragraph>
            <p className="mmd-cap">图 3-1 智能起草流程图</p>
            <Mermaid chart={FLOW_DRAFT} />
            <Paragraph><Text strong>数据字典：</Text></Paragraph>
            <PTable
              head={['字段', '类型', '必填', '说明']}
              rows={[
                ['docNo', '字符串', '是', '制度文号，唯一'],
                ['name', '字符串', '是', '制度名称'],
                ['status', '枚举', '是', '待解析/待核验/待入库'],
                ['tree', 'JSON', '是', '解析出的章节节点树'],
              ]}
            />
            <Paragraph><Text strong>异常/分支：</Text>解析失败给出原因并允许重传；重复文号拦截；网络中断保留本地草稿。</Paragraph>
          </section>

          <section id="policies" className="prd-sec">
            <Title level={4}>3.2 制度管理</Title>
            <Paragraph><Text strong>描述：</Text>含「发起评审」与「制度清单」。清单展示全部制度（默认仅展示已公示）、支持详情查看与公示操作。</Paragraph>
            <Story role="制度管理员" want="将草稿提交评审并公示生效制度" so="让制度进入正式库并对外公开" />
            <Paragraph><Text strong>数据字典：</Text></Paragraph>
            <PTable
              head={['字段', '类型', '必填', '说明']}
              rows={[
                ['id', '字符串', '是', '制度唯一 ID'],
                ['category', '枚举', '是', '制度分类'],
                ['owner', '字符串', '是', '责任部门'],
                ['status', '枚举', '是', '生效中/评审中/草稿/已过期/已公示'],
              ]}
            />
            <Paragraph><Text strong>异常：</Text>公示需先通过评审；无权限操作给予提示。</Paragraph>
          </section>

          <section id="review" className="prd-sec">
            <Title level={4}>3.3 评审管理</Title>
            <Paragraph><Text strong>描述：</Text>「待评审」「已评审」分页列表。评审专家可针对章节/条款批注，发起人给出通过/驳回结论，驳回退回修订。</Paragraph>
            <Story role="评审专家" want="在任意章节添加批注并协同讨论" so="沉淀评审意见、保障制度质量" />
            <Paragraph><Text strong>业务流程：</Text></Paragraph>
            <p className="mmd-cap">图 3-2 评审管理流程图</p>
            <Mermaid chart={FLOW_REVIEW} />
            <Paragraph><Text strong>异常：</Text>超时限未评审提醒；同时编辑批注以最后保存为准。</Paragraph>
          </section>

          <section id="opinions" className="prd-sec">
            <Title level={4}>3.4 意见征集</Title>
            <Paragraph><Text strong>描述：</Text>后台配置征集（标题/关联制度/起止时间/描述），状态由时间动态推导（未开始/进行中/已结束）。前台按状态分组，进行中可进入提交页针对段落提意见，意见实时回流后台。</Paragraph>
            <Story role="普通员工" want="对进行中征集的某段落提交意见" so="把一线问题反馈给制度修订方" />
            <Paragraph><Text strong>交互：</Text>未开始/已结束点击给提示；进行中进提交页（左目录右正文，段落「提意见」→ 弹窗录入 → 显示「已提 N 条」）。</Paragraph>
            <Paragraph><Text strong>业务流程：</Text>状态由「当前时间」与征集的起止时间动态推导，流转如下。</Paragraph>
            <p className="mmd-cap">图 3-3 意见征集状态流转图</p>
            <Mermaid chart={FLOW_OPINION} />
            <Paragraph>
              下表以时序图展示不同<Text strong>时间节点</Text>下前台展示与可执行操作的变化：
            </Paragraph>
            <p className="mmd-cap">图 3-4 意见征集时序图（未开始 / 进行中 / 已结束）</p>
            <Mermaid chart={SEQ_OPINION} />
            <Paragraph><Text strong>异常：</Text>征集结束后禁止提交；重复提交去重。</Paragraph>
          </section>

          <section id="reqmgmt" className="prd-sec">
            <Title level={4}>3.5 需求管理</Title>
            <Paragraph><Text strong>描述：</Text>产品经理沉淀产品资产，含三类：</Paragraph>
            <ul className="prd-ul">
              <li><b>PRD 文档：</b>本文件，按标准 PRD 格式撰写各模块需求（文档视图）。</li>
              <li><b>功能权限：</b>菜单 × 操作 × 角色 权限矩阵，可操作打 √（见 1.3 / 4.1）。</li>
              <li><b>数据权限：</b>罗列需做数据权限控制的菜单、侧边树、下拉等组件及可见范围。</li>
            </ul>
          </section>

          <section id="dashboard" className="prd-sec">
            <Title level={4}>3.6 数据看板与通知公告</Title>
            <Paragraph><Text strong>描述：</Text>看板含 6 指标卡（制度总数/生效中/已公示/评审中/待评审/进行中征集）+ 5 图表（状态饼/分类柱/部门横条/意见趋势面积/征集分布）。通知公告支持富文本 + 附件 + 按部门定向发布。</Paragraph>
            <Story role="制度管理员" want="一眼掌握制度全局与意见趋势" so="辅助管理决策" />
            <Paragraph><Text strong>异常：</Text>数据为空时图表占位；公告接收部门为空则不允许发布。</Paragraph>
          </section>
        </section>

        {/* ===== 四、非功能需求 ===== */}
        <section id="nonfunc" className="prd-sec">
          <Title level={3}>四、非功能需求</Title>

          <section id="security" className="prd-sec">
            <Title level={4}>4.1 安全与合规</Title>
            <ul className="prd-ul">
              <li>功能权限：基于角色的后端校验，前端仅做展示控制（见「功能权限」矩阵）。</li>
              <li>数据权限：统一以「当前部门 + 角色」过滤，越权数据不可见（见「数据权限」）。</li>
              <li>审计：关键操作（公示/评审结论/征集发起）留痕，可追溯。</li>
              <li>合规：敏感制度按密级控制可见范围 [待确认]。</li>
            </ul>
          </section>

          <section id="tracking" className="prd-sec">
            <Title level={4}>4.2 统计需求（埋点）</Title>
            <PTable
              head={['事件', '触发时机', '关键属性']}
              rows={[
                ['prd_view', '打开 PRD 文档页', 'module'],
                ['draft_upload', '上传制度文档', 'fileType, size'],
                ['review_submit', '提交评审结论', 'result'],
                ['opinion_submit', '提交段落意见', 'collectId, section'],
                ['ann_publish', '发布公告', 'deptCount'],
              ]}
            />
          </section>

          <section id="perf" className="prd-sec">
            <Title level={4}>4.3 性能需求</Title>
            <ul className="prd-ul">
              <li>页面首屏 ≤ 1.5s；列表接口 ≤ 500ms（数据量 600+ 项）。</li>
              <li>附件上传单文件 ≤ 50MB，支持断点续传 [待确认]。</li>
              <li>解析 100 页文档 ≤ 30s [待确认]。</li>
            </ul>
          </section>

          <section id="integration" className="prd-sec">
            <Title level={4}>4.4 系统集成</Title>
            <ul className="prd-ul">
              <li>组织架构：对接 HR 系统获取部门/人员，用于数据权限与下拉。</li>
              <li>消息：征集/公告通过企业 IM 推送（对接方式 [待确认]）。</li>
              <li>存储：附件存对象存储，文档库按部门过滤。</li>
            </ul>
          </section>
        </section>

        {/* ===== 五、附录 ===== */}
        <section id="appendix" className="prd-sec">
          <Title level={3}>五、附录</Title>

          <section id="accept" className="prd-sec">
            <Title level={4}>5.1 验收标准</Title>
            <ul className="prd-ul">
              <li>智能起草：上传 Word 可生成章节树，入库为待评审草稿。</li>
              <li>评审管理：批注可协同，结论可驳回退回。</li>
              <li>意见征集：进行中可分段提意见并回流；未开始/已结束有提示。</li>
              <li>数据权限：越权部门数据在清单/树/下拉中不可见。</li>
              <li>看板：6 指标卡与 5 图表随数据实时更新。</li>
            </ul>
          </section>

          <section id="todo" className="prd-sec">
            <Title level={4}>5.2 待确认项清单</Title>
            <Paragraph><Text type="secondary">以下为假设或待确认项，评审时逐条确认（均附建议值）：</Text></Paragraph>
            <PTable
              head={['级别', '事项', '建议值']}
              rows={[
                ['必须', '制度密级与可见范围口径', '按部门 + 角色，密级字段后续扩展'],
                ['必须', '数据权限过滤的统一实现层', '网关/拦截器统一注入 deptId+role'],
                ['建议', '附件断点续传与大小上限', '≤50MB，支持续传'],
                ['建议', '消息推送对接方式', '企业 IM Webhook'],
                ['可后续', 'V2.0 移动端与流程自定义范围', '先 PC 闭环再扩展'],
              ]}
            />
          </section>
        </section>
      </div>
    </div>
  )
}

/* ========================================================================
 * 二、功能权限 —— 菜单 × 操作 × 角色 权限矩阵
 * ===================================================================== */
const ROLES: string[] = ['系统管理员', '制度管理员', '评审专家', '起草人', '部门负责人', '普通员工']
const ALL: string[] = [...ROLES]

interface FuncRow {
  menu: string
  op: string
  roles: string[]
}

// 菜单结构：一级菜单 → 操作项；并标注拥有该操作的角色（打 √）
const FUNC_ROWS: FuncRow[] = [
  { menu: '数据看板', op: '查看看板', roles: ALL },
  { menu: '智能起草', op: '新建起草', roles: ['系统管理员', '制度管理员', '起草人'] },
  { menu: '智能起草', op: '解析 / 核验', roles: ['系统管理员', '制度管理员', '起草人'] },
  { menu: '智能起草', op: '删除草稿', roles: ['系统管理员', '制度管理员'] },
  { menu: '制度管理 / 发起评审', op: '提交评审', roles: ['系统管理员', '制度管理员', '部门负责人'] },
  { menu: '制度管理 / 制度清单', op: '查看', roles: ALL },
  { menu: '制度管理 / 制度清单', op: '公示', roles: ['系统管理员', '制度管理员'] },
  { menu: '制度管理 / 制度清单', op: '详情', roles: ALL },
  { menu: '评审管理 / 待评审', op: '参与评审', roles: ['系统管理员', '制度管理员', '评审专家'] },
  { menu: '评审管理 / 已评审', op: '查看批注', roles: ['系统管理员', '制度管理员', '评审专家', '部门负责人'] },
  { menu: '意见征集', op: '新增征集', roles: ['系统管理员', '制度管理员'] },
  { menu: '意见征集', op: '查看 / 详情', roles: ALL },
  { menu: '需求管理 / PRD 文档', op: '查看', roles: ALL },
  { menu: '需求管理 / PRD 文档', op: '新增 / 编辑 / 删除', roles: ['系统管理员', '制度管理员', '起草人'] },
  { menu: '需求管理 / 功能权限', op: '查看', roles: ALL },
  { menu: '需求管理 / 数据权限', op: '查看', roles: ALL },
]

export function FuncPermission() {
  // 计算每个 menu 在列表中的首次出现位置与跨度，用于合并单元格
  const spanMap = useMemo(() => {
    const m: Record<string, { first: number; span: number }> = {}
    FUNC_ROWS.forEach((r, i) => {
      if (!m[r.menu]) m[r.menu] = { first: i, span: 0 }
      m[r.menu].span += 1
    })
    return m
  }, [])

  const columns: ColumnsType<FuncRow> = [
    {
      title: '菜单',
      dataIndex: 'menu',
      width: 220,
      fixed: 'left',
      className: 'func-col-menu',
      render: (_: unknown, row: FuncRow, index: number) => {
        const info = spanMap[row.menu]
        return {
          children: <span className="func-menu-name">{row.menu}</span>,
          props: { rowSpan: index === info.first ? info.span : 0 },
        }
      },
    },
    { title: '操作项', dataIndex: 'op', width: 180, fixed: 'left', className: 'func-col-op' },
    ...ROLES.map((role) => ({
      title: role,
      width: 110,
      align: 'center' as const,
      render: (_: unknown, row: FuncRow) =>
        row.roles.includes(role) ? (
          <CheckCircleFilled className="func-check" />
        ) : (
          <MinusOutlined className="func-none" />
        ),
    })),
  ]

  return (
    <Card className="sys-card func-perm-card">
      <div className="func-perm-tip">
        <CheckCircleFilled className="func-check" /> 表示「该角色可进行此操作」；
        <MinusOutlined className="func-none" /> 表示「无此权限」。
      </div>
      <Table<FuncRow>
        rowKey={(r) => r.menu + r.op}
        dataSource={FUNC_ROWS}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
        bordered
      />
    </Card>
  )
}

/* ========================================================================
 * 三、数据权限 —— 菜单 / 侧边树 / 下拉 等数据组件的控制罗列
 * ===================================================================== */
type PermLevel = '全部可见' | '部门可见' | '个人可见' | '自定义'
const LEVEL_COLOR: Record<PermLevel, string> = {
  全部可见: 'green',
  部门可见: 'blue',
  个人可见: 'gold',
  自定义: 'purple',
}

interface DataRow {
  obj: string // 数据对象 / 组件
  location: string // 所在位置（菜单 / 组件）
  dim: string // 数据维度
  level: PermLevel // 权限级别
  control: string // 控制说明
  scope: string // 可见范围口径
}

const DATA_ROWS: DataRow[] = [
  { obj: '制度清单数据', location: '制度管理 / 制度清单', dim: '部门', level: '部门可见', control: '仅展示「责任部门 = 当前部门」的制度', scope: '按责任部门过滤' },
  { obj: '部门组织树', location: '全局侧边树', dim: '组织层级', level: '部门可见', control: '按角色展示不同层级节点，越权部门不可见', scope: '本部门及下属' },
  { obj: '责任部门下拉', location: '起草 / 征集表单', dim: '部门', level: '自定义', control: '仅可选当前角色有权管理的部门', scope: '角色限定可选集合' },
  { obj: '起草人下拉', location: '各类表单', dim: '人员', level: '部门可见', control: '仅列出本部门人员', scope: '本部门' },
  { obj: '评审任务', location: '评审管理 / 待评审 · 已评审', dim: '人员', level: '个人可见', control: '仅展示本人参与或发起的评审', scope: '参与人 / 发起人' },
  { obj: '意见征集', location: '意见征集', dim: '部门', level: '部门可见', control: '按发起部门过滤可见范围', scope: '发起部门' },
  { obj: '通知公告', location: '数据看板 / 前端门户', dim: '部门', level: '自定义', control: '仅向「接收部门」范围内人员展示', scope: '接收部门集合' },
  { obj: '数据看板统计', location: '数据看板', dim: '部门 / 全局', level: '自定义', control: '管理员看全局口径，其余角色看本部门口径', scope: '角色决定' },
  { obj: '我的草稿', location: '智能起草', dim: '人员', level: '个人可见', control: '仅本人创建的草稿可见', scope: '创建人' },
  { obj: '附件 / 文档库', location: '文档中心', dim: '部门', level: '部门可见', control: '按上传部门过滤可下载 / 可见文件', scope: '上传部门' },
  { obj: '制度分类树', location: '制度清单筛选侧树', dim: '分类', level: '全部可见', control: '分类维度全员可见，再叠加部门过滤', scope: '全部（叠加部门）' },
  { obj: '责任人 / 评审专家下拉', location: '评审发起表单', dim: '人员', level: '自定义', control: '仅可选具备评审角色的人员', scope: '角色限定' },
]

export function DataPermission() {
  const columns: ColumnsType<DataRow> = [
    { title: '数据对象 / 组件', dataIndex: 'obj', width: 190, fixed: 'left', render: (v: string) => <span className="dp-obj">{v}</span> },
    { title: '所在位置', dataIndex: 'location', width: 200 },
    { title: '数据维度', dataIndex: 'dim', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '权限级别',
      dataIndex: 'level',
      width: 110,
      render: (v: PermLevel) => <Tag color={LEVEL_COLOR[v]}>{v}</Tag>,
    },
    { title: '控制说明', dataIndex: 'control', ellipsis: { showTitle: false }, render: (v: string) => <Typography.Text type="secondary" title={v}>{v}</Typography.Text> },
    { title: '可见范围口径', dataIndex: 'scope', width: 170, render: (v: string) => <span className="dp-scope">{v}</span> },
  ]

  return (
    <Card className="sys-card">
      <div className="dp-tip">
        下列菜单与数据组件均需做数据权限控制，统一以「<b>当前部门 + 角色</b>」为过滤条件保障数据隔离。
      </div>
      <Table<DataRow>
        rowKey="obj"
        dataSource={DATA_ROWS}
        columns={columns}
        pagination={false}
        scroll={{ x: 'max-content' }}
        bordered
      />
    </Card>
  )
}
