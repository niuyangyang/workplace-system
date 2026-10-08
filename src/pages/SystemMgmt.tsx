import { useState, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import type { EChartsOption } from 'echarts'
import type { UploadFile } from 'antd'
import {
  Layout,
  Menu,
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Input,
  Empty,
  App as AntdApp,
  Row,
  Col,
  Statistic,
  Form,
  Select,
  Breadcrumb,
  Popconfirm,
  Space,
  Modal,
  DatePicker,
  Tooltip,
  Descriptions,
  Divider,
  Upload,
} from 'antd'
import {
  DashboardOutlined,
  ThunderboltOutlined,
  FileDoneOutlined,
  AuditOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CommentOutlined,
  UploadOutlined,
  PaperClipOutlined,
  ProjectOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import EChart from '../components/EChart'
import RichTextEditor from '../components/RichTextEditor'
import DraftWizard, { DraftResult, DraftInit, DocNode, buildParsedTree, buildAttendanceTree } from './DraftWizard'
import ReviewFlow, { ReviewRecord, AnnotationItem } from './ReviewFlow'
import PolicyDetail, { buildPolicyVersions } from './PolicyDetail'
import './systemMgmt.css'
import { PrdDocs, FuncPermission, DataPermission } from './RequirementMgmt'

const { Content } = Layout
const { Title } = Typography

type MenuKey = 'console' | 'draft' | 'pending' | 'policies' | 'rqueue' | 'rdone' | 'opinions' | 'prd' | 'funcPerm' | 'dataPerm'

const menuItems = [
  { key: 'console', icon: <DashboardOutlined />, label: '数据看板' },
  { key: 'draft', icon: <ThunderboltOutlined />, label: '智能起草' },
  {
    key: 'manage',
    icon: <FileDoneOutlined />,
    label: '制度管理',
    children: [
      { key: 'pending', label: '发起评审' },
      { key: 'policies', label: '制度清单' },
    ],
  },
  {
    key: 'review',
    icon: <AuditOutlined />,
    label: '评审管理',
    children: [
      { key: 'rqueue', label: '待评审' },
      { key: 'rdone', label: '已评审' },
    ],
  },
  { key: 'opinions', icon: <CommentOutlined />, label: '意见征集' },
  {
    key: 'req',
    icon: <ProjectOutlined />,
    label: '需求管理',
    children: [
      { key: 'prd', label: 'PRD 文档' },
      { key: 'funcPerm', label: '功能权限' },
      { key: 'dataPerm', label: '数据权限' },
    ],
  },
]

// ——— 制度管理（正式库） ———
export interface Policy {
  id: string
  docNo: string // 制度文号
  name: string
  category: string
  owner: string // 责任部门
  drafter: string // 起草人
  status: '生效中' | '评审中' | '草稿' | '已过期' | '已公示'
}

// ——— 智能起草（草稿库） ———
type DraftStatus = '待解析' | '待核验' | '待入库'
interface Draft {
  id: string
  docNo: string
  name: string
  category: string
  owner: string
  drafter: string
  draftTime: string
  status: DraftStatus
  effectiveDate: string
  tree: DocNode[]
}

// ——— 待评审制度（智能起草入库后先到此，统一安排评审） ———
type PendingStatus = '待评审'
interface Pending {
  id: string
  docNo: string
  name: string
  category: string
  owner: string
  drafter: string
  status: PendingStatus
}

const POLICY_NAMES = [
  '员工考勤与休假管理办法', '招聘与录用管理细则', '绩效考核实施办法', '员工培训与发展规定', '离职与交接管理办法',
  '费用报销管理细则', '预算编制与执行办法', '差旅费管理规定', '固定资产管理办法', '发票与税务管理规范',
  '信息安全与数据合规规范', '反腐败与廉洁从业规定', '合同审批管理办法', '知识产权保护措施', '隐私保护政策',
  '研发项目知识产权归属规定', '软件研发流程规范', '代码评审管理办法', '技术文档管理规范', '研发绩效考核细则',
  '办公用品领用管理办法', '会议室使用管理规定', '印章管理与使用办法', '固定资产盘点制度', '访客与门禁管理规定',
  '信息安全事件应急预案', '网络安全等级保护办法', '供应商准入与管理办法', '采购招投标管理办法', '内部审计工作规定',
  '数据分类分级管理办法', '员工行为规范手册', '商业秘密保护规定', '对外宣传与品牌管理办法', '安全生产管理规定',
  '舆情管理与危机应对预案', '礼品与招待管理办法', '档案与印章数字化规范', '员工关怀与心理健康办法', '远程办公管理办法',
  '任职资格与晋升管理办法', '实习生与校招管理办法', '财经纪律与报销红线规定', '机房与基础设施运维办法', '合同履约与信用管理办法',
]
export const CATEGORIES = ['人事制度', '财务制度', '合规制度', '研发制度', '行政制度']
export const OWNERS = ['人力资源部', '财务部', '信息技术部', '研发中心', '行政部']
const DRAFTERS = ['张明', '李静', '王磊', '赵婷', '陈昊', '刘洋']
export const P_STATUS: Policy['status'][] = ['生效中', '评审中', '草稿', '已过期', '已公示']
const D_STATUS: DraftStatus[] = ['待解析', '待核验', '待入库']

export const seedPolicies: Policy[] = POLICY_NAMES.map((name, i) => ({
  id: 'Z' + String(i + 1).padStart(3, '0'),
  docNo: `沪材〔2026〕${String(i + 1).padStart(3, '0')}号`,
  name,
  category: CATEGORIES[i % 5],
  owner: OWNERS[i % 5],
  drafter: DRAFTERS[i % 6],
  status: P_STATUS[i % 4],
}))

// ——— 意见征集（制度修订意见征集） ———
export type OpinionStatus = '未开始' | '进行中' | '已结束'
export interface OpinionCollect {
  id: string
  title: string // 征集标题
  policyName: string // 关联制度
  version: string // 制度版本
  category: string
  owner: string // 发起部门（取关联制度的责任部门）
  startTime: string // 征集开始时间 'YYYY-MM-DD HH:mm'
  endTime: string // 征集结束时间
  description: string // 描述信息
}

// 状态由征集起止时间动态推导
export const opinionStatus = (
  o: Pick<OpinionCollect, 'startTime' | 'endTime'>,
  now: Date = new Date(),
): OpinionStatus => {
  const s = new Date(o.startTime.replace(' ', 'T')).getTime()
  const e = new Date(o.endTime.replace(' ', 'T')).getTime()
  const t = now.getTime()
  if (Number.isNaN(s) || Number.isNaN(e)) return '未开始'
  if (t < s) return '未开始'
  if (t > e) return '已结束'
  return '进行中'
}

export const OPINION_STATUS_OPTIONS = (['未开始', '进行中', '已结束'] as const).map((s) => ({
  value: s,
  label: s,
}))

const OPINION_TOPICS = [
  '员工考勤与休假管理办法', '招聘与录用管理细则', '绩效考核实施办法', '费用报销管理细则',
  '差旅费管理规定', '信息安全与数据合规规范', '合同审批管理办法', '研发项目知识产权归属规定',
  '软件研发流程规范', '采购招投标管理办法', '数据分类分级管理办法', '远程办公管理办法',
  '任职资格与晋升管理办法', '实习生与校招管理办法', '办公用品领用管理办法', '会议室使用管理规定',
  '印章管理与使用办法', '供应商准入与管理办法', '档案与印章数字化规范', '员工关怀与心理健康办法',
  '安全生产管理规定',
]

const p2 = (n: number) => String(n).padStart(2, '0')
const fmtDT = (d: Date, h: number, m: number) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(h)}:${p2(m)}`
const shiftDays = (base: Date, days: number) => {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

// 以"当天"为基准生成三种状态的数据，保证演示时未开始/进行中/已结束都有
const NOW = new Date()
export const seedOpinions: OpinionCollect[] = OPINION_TOPICS.map((name, i) => {
  const kind = i % 3 // 0 进行中 / 1 已结束 / 2 未开始
  const start =
    kind === 0
      ? shiftDays(NOW, -(10 + (i % 5)))
      : kind === 1
        ? shiftDays(NOW, -(70 + (i % 10)))
        : shiftDays(NOW, 12 + (i % 10))
  const end =
    kind === 0
      ? shiftDays(NOW, 15 + (i % 7))
      : kind === 1
        ? shiftDays(NOW, -(30 + (i % 6)))
        : shiftDays(NOW, 45 + (i % 10))
  return {
    id: 'O' + String(i + 1).padStart(3, '0'),
    title: `《${name}》修订意见征集`,
    policyName: name,
    version: `V${1 + (i % 3)}.0`,
    category: CATEGORIES[i % 5],
    owner: OWNERS[i % 5],
    startTime: fmtDT(start, 9, 0),
    endTime: fmtDT(end, 18, 0),
    description: `就《${name}》的修订内容面向${OWNERS[i % 5]}及相关岗位征集意见，重点收集执行口径、操作流程与配套表单方面的建议。`,
  }
})

// ——— 前台提交的意见（征集到的意见明细） ———
export interface OpinionFeedback {
  id: string
  collectId: string // 关联的征集
  sectionTitle?: string // 对应章节/条款（针对正文某段落提交）
  submitter: string // 提交人
  department: string // 所属部门
  submitTime: string // 提交时间
  content: string // 意见内容
}

const SUBMITTERS = [
  '张明', '李静', '王磊', '赵婷', '陈昊', '刘洋', '孙悦', '周航',
  '吴敏', '郑楠', '冯涛', '许倩', '何斌', '罗琳', '高扬', '邓倩',
]
const SECTION_TITLES = [
  '1.2 适用范围', '1.3 术语定义', '2.1 责任部门', '2.2 打卡要求', '3.1 申请与发起',
  '3.2 年休假', '4.1 监督检查', '4.3 违规处理', '5.1 解释与修订',
]
const FEEDBACK_TEMPLATES = [
  '建议进一步明确适用范围的边界情形，避免执行时出现争议。',
  '希望补充配套的操作流程与表单模板，便于各部门落地执行。',
  '关于审批时限，建议明确各级审批的最长办理时间。',
  '建议增加线上办理入口，减少线下纸质流转环节。',
  '条款中的量化标准建议结合业务实际适当调整，增强可操作性。',
  '建议明确责任部门与协同部门在争议情形下的处理机制。',
  '希望增加过渡期安排，给予各部门充分的准备时间。',
  '建议对违规情形细化处理档次，做到过罚相当。',
  '建议在附则中说明与既有制度的衔接关系，避免重复规定。',
  '建议补充数据留存与保密要求，防范信息泄露风险。',
  '建议增加名词解释，统一各部门对关键概念的理解口径。',
  '希望明确特殊情形下的例外处理流程与审批权限。',
  '建议配套提供操作指引或培训，降低一线执行难度。',
  '建议增加定期评估机制，根据执行情况动态修订条款。',
  '建议明确跨部门协作事项的牵头单位与配合职责。',
  '建议在系统中设置自动提醒，避免遗漏关键办理节点。',
]

const fmtDate = (d: Date) => fmtDT(d, d.getHours(), d.getMinutes())

// 未开始的征集不收意见；进行中/已结束均保证 >10 条，便于查看分页效果
export const seedOpinionFeedbacks: OpinionFeedback[] = seedOpinions.flatMap((o, i) => {
  const st = opinionStatus(o)
  if (st === '未开始') return []
  const count = st === '进行中' ? 14 + (i % 8) : 26 + (i % 12)
  // 提交时间均匀落在征集区间内（进行中：开始~当前；已结束：开始~结束）
  const startD = new Date(o.startTime.replace(' ', 'T'))
  const endD = new Date(o.endTime.replace(' ', 'T'))
  const cutoff =
    st === '进行中' ? new Date(Math.min(Date.now(), endD.getTime())) : endD
  const span = Math.max(cutoff.getTime() - startD.getTime(), 0)
  return Array.from({ length: count }, (_, j) => ({
    id: `${o.id}-F${String(j + 1).padStart(2, '0')}`,
    collectId: o.id,
    sectionTitle: SECTION_TITLES[(i + j) % SECTION_TITLES.length],
    submitter: SUBMITTERS[(i * 3 + j) % SUBMITTERS.length],
    department: OWNERS[(i + j) % OWNERS.length],
    submitTime: fmtDate(new Date(startD.getTime() + (span * (j + 1)) / (count + 1))),
    content: FEEDBACK_TEMPLATES[(i * 2 + j) % FEEDBACK_TEMPLATES.length],
  }))
})

// 前台提交的意见会实时进入此数组，后台"意见列表"据此展示
export const opinionFeedbacks: OpinionFeedback[] = [...seedOpinionFeedbacks]

export const addOpinionFeedback = (item: OpinionFeedback) => {
  opinionFeedbacks.unshift(item)
}

// ——— 通知公告 ———
export interface Announcement {
  id: string
  title: string
  departments: string[] // 接收部门
  content: string // 富文本 HTML
  attachments: { name: string; size: string }[]
  publisher: string
  publishTime: string
}

export const ANN_DEPARTMENTS = [...OWNERS, '全体员工']
export const ANN_DEPARTMENT_OPTIONS = ANN_DEPARTMENTS.map((d) => ({ value: d, label: d }))

const ANN_TITLES = [
  '关于开展 2026 年度制度修订意见征集的通知',
  '关于《员工考勤与休假管理办法》修订发布的公告',
  '2026 年国庆节放假安排及值班要求',
  '关于启用新版费用报销流程的通知',
  '关于开展年度信息安全自查工作的通知',
  '关于调整差旅费标准的通知',
  '关于组织制度培训（第三期）的通知',
  '关于开展固定资产盘点工作的通知',
  '关于规范合同审批流程的公告',
  '关于 2026 年度绩效考核工作安排的通知',
  '关于办公用品领用方式调整的通知',
  '关于强化数据分类分级管理的通知',
  '关于开展安全生产专项检查的通知',
  '关于印章使用流程线上化的公告',
  '关于实习生管理与校招安排的通知',
  '关于远程办公申请流程调整的通知',
]

const ANN_BODY = (title: string, i: number) =>
  `<p>各部门、各位同事：</p><p>为${
    [
      '进一步规范公司制度管理，提升制度执行效率',
      '落实年度制度建设计划，完善内部管理机制',
      '配合公司业务发展需要，优化相关管理流程',
    ][i % 3]
  }，现将有关事项通知如下：</p><p><strong>一、适用范围</strong><br/>本通知适用于公司全体部门及相关岗位人员。</p><p><strong>二、主要内容</strong><br/>1. 请各部门于通知发布后 5 个工作日内完成内部宣贯与责任分工；<br/>2. 涉及流程调整的事项，请按新流程执行，旧流程同时废止；<br/>3. 执行过程中如有疑问，请及时与制度归口部门联系。</p><p><strong>三、其他要求</strong><br/>各部门负责人应做好本部门落实情况的跟踪与反馈，确保各项要求执行到位。</p><p style="text-align: right;"><strong>${title.includes('公告') ? '特此公告。' : '特此通知。'}</strong></p>`

export const seedAnnouncements: Announcement[] = ANN_TITLES.map((title, i) => ({
  id: 'N' + String(i + 1).padStart(3, '0'),
  title,
  departments: [OWNERS[i % OWNERS.length], OWNERS[(i + 2) % OWNERS.length]],
  content: ANN_BODY(title, i),
  attachments:
    i % 3 === 0
      ? [{ name: '制度修订说明.pdf', size: '1.2 MB' }]
      : i % 3 === 1
        ? [
            { name: '流程操作指引.docx', size: '368 KB' },
            { name: '表单模板.xlsx', size: '96 KB' },
          ]
        : [],
  publisher: DRAFTERS[i % DRAFTERS.length],
  publishTime: fmtDT(shiftDays(NOW, -(i * 3 + 1)), 9 + (i % 8), (i * 7) % 60),
}))

const seedDrafts: Draft[] = POLICY_NAMES.slice(0, 28).map((name, i) => {
  const isAttendance = i === 0
  return {
    id: 'C' + String(i + 1).padStart(3, '0'),
    docNo: `草〔2026〕${String(i + 1).padStart(3, '0')}号`,
    name,
    category: CATEGORIES[i % 5],
    owner: OWNERS[i % 5],
    drafter: DRAFTERS[i % 6],
    draftTime: isAttendance ? '2025-12-18' : '2026-' + String((i % 9) + 1).padStart(2, '0') + '-' + String(((i * 3) % 27) + 1).padStart(2, '0'),
    status: D_STATUS[i % 3],
    effectiveDate: isAttendance ? '2026-01-01' : '2026-03-01',
    tree: isAttendance ? buildAttendanceTree() : buildParsedTree(name),
  }
})

const draftStatusColor: Record<DraftStatus, string> = {
  待解析: 'orange',
  待核验: 'blue',
  待入库: 'purple',
}
export const policyStatusColor: Record<Policy['status'], string> = {
  生效中: 'green',
  评审中: 'blue',
  草稿: 'default',
  已过期: 'red',
  已公示: 'geekblue',
}
export const draftCategoryColor: Record<string, string> = {
  人事制度: 'blue',
  财务制度: 'green',
  合规制度: 'gold',
  研发制度: 'purple',
  行政制度: 'cyan',
}

// ——— 待评审制度种子数据 ———
const seedPending: Pending[] = (() => {
  const list: Pending[] = []
  const count = 16
  for (let i = 0; i < count; i++) {
    const name = POLICY_NAMES[(i + 2) % POLICY_NAMES.length]
    list.push({
      id: 'P' + String(101 + i),
      docNo: `草〔2026〕${String(101 + i)}号`,
      name,
      category: CATEGORIES[i % 5],
      owner: OWNERS[i % 5],
      drafter: DRAFTERS[i % 6],
      status: '待评审' as const,
    })
  }
  return list
})()

// ——— 当前登录用户（演示用，评审流转以该用户为视角） ———
const CURRENT_USER = '沈志远'

// ——— 评审管理：待评审 / 已评审 / 评审通过 / 评审驳回 ———
const seedReviews: ReviewRecord[] = (() => {
  const base: ReviewRecord[] = [
    {
      id: 'RV-2001',
      theme: '2026 年度信息安全制度评审',
      category: '人事制度',
      info: { name: '员工考勤与休假管理办法', docNo: '沪材〔2026〕001号', owner: '人力资源部', drafter: '沈志远', draftTime: '2025-12-18' },
      tree: buildAttendanceTree(),
      participants: ['沈志远', '周敏', '陈浩'],
      status: '待评审',
      annotations: [
        { id: 'AN-SEED-1', quote: '公司实行考勤登记与核查制度', comment: '建议明确考勤数据的核查频次与责任部门，避免流于形式。', author: '周敏', time: '2026-03-02 10:21' },
        { id: 'AN-SEED-2', quote: '每日工作 8 小时、每周工作 40 小时', comment: '建议补充弹性工时与远程办公的衔接条款，提升管理柔性。', author: '陈浩', time: '2026-03-02 14:05' },
        { id: 'AN-SEED-3', quote: '满 1 年不满 10 年的 5 天', comment: '年休假天数建议与司龄挂钩，细化逐年递增规则。', author: '沈志远', time: '2026-03-03 09:12' },
      ],
    },
    {
      id: 'RV-2002',
      theme: '差旅费管理细则专项评审',
      category: '财务制度',
      info: { name: '差旅费管理规定', docNo: '沪材〔2026〕007号', owner: '财务部', drafter: '李静', draftTime: '2026-02-11' },
      tree: buildParsedTree('差旅费管理规定'),
      participants: ['沈志远', '李静'],
      status: '待评审',
    },
    {
      id: 'RV-2003',
      theme: '研发绩效管理办法评审',
      category: '研发制度',
      info: { name: '研发绩效考核细则', docNo: '沪材〔2026〕015号', owner: '研发中心', drafter: '王磊', draftTime: '2026-01-20' },
      tree: buildParsedTree('研发绩效考核细则'),
      participants: ['沈志远', '王磊'],
      status: '已评审',
      result: '通过',
      opinion: '同意发布，建议补充量化考核指标与员工申诉流程。',
      annotation: '第三章考核维度需进一步细化，明确各等级的判定标准。',
    },
  ]
  const extraCount = 24
  for (let i = 0; i < extraCount; i++) {
    const idx = i + 3
    const name = POLICY_NAMES[(i + 5) % POLICY_NAMES.length]
    const status: '待评审' | '已评审' = i % 2 === 0 ? '待评审' : '已评审'
    base.push({
      id: 'RV-' + (2004 + i),
      theme: `${name}专项评审`,
      info: {
        name,
        docNo: `沪材〔2026〕${String(idx + 1).padStart(3, '0')}号`,
        owner: OWNERS[idx % 5],
        drafter: DRAFTERS[idx % 6],
        draftTime: `2026-0${((i % 8) + 1)}-1${(i % 9)}`,
      },
      tree: buildParsedTree(name),
      participants: ['沈志远', DRAFTERS[idx % 6]],
      status,
      result: status === '已评审' ? (i % 2 === 0 ? '通过' : '驳回') : undefined,
      opinion: status === '已评审' ? '经评审同意发布，建议结合业务实际进一步细化执行口径。' : undefined,
      annotation: status === '已评审' ? '部分条款措辞建议精简，责任部门与时间节点需再明确。' : undefined,
      rejectReason:
        status === '已评审' && i % 2 !== 0
          ? '部分条款与现行管理实际不符，建议修订后重新提交评审。'
          : undefined,
    })
  }
  return base
})()

// ——— 通用筛选条（多个分页列表复用） ———
interface FilterField {
  name: string
  label: string
  type: 'input' | 'select'
  options?: { label: string; value: string }[]
}
const FilterBar = ({
  fields,
  onSearch,
}: {
  fields: FilterField[]
  onSearch: (values: Record<string, string>) => void
}) => {
  const [form] = Form.useForm()
  const submit = () => {
    const v = form.getFieldsValue(true) as Record<string, unknown>
    const norm: Record<string, string> = {}
    fields.forEach((f) => {
      const val = v[f.name]
      norm[f.name] = val ? String(val) : ''
    })
    onSearch(norm)
  }
  const reset = () => {
    form.resetFields()
    onSearch({})
  }
  return (
    <div className="sys-search-bar">
      <Form form={form} layout="horizontal" className="sys-search-form" labelCol={{ flex: '90px' }} wrapperCol={{ flex: 'auto' }}>
        {fields.map((f) => (
          <Form.Item key={f.name} name={f.name} label={f.label} className="sys-filter-item">
            {f.type === 'input' ? (
              <Input allowClear placeholder={`输入${f.label}`} />
            ) : (
              <Select allowClear placeholder="全部" options={f.options} />
            )}
          </Form.Item>
        ))}
        <div className="sys-search-btns">
          <Button type="primary" onClick={submit}>
            查询
          </Button>
          <Button onClick={reset}>重置</Button>
        </div>
      </Form>
    </div>
  )
}

const categoryOptions = CATEGORIES.map((c) => ({ label: c, value: c }))
const ownerOptions = OWNERS.map((o) => ({ label: o, value: o }))
const policyStatusOptions = [...P_STATUS, '已公示'].map((s) => ({ label: s, value: s }))
const opinionStatusColor: Record<OpinionStatus, string> = {
  未开始: 'default',
  进行中: 'blue',
  已结束: 'green',
}

export default function SystemMgmt() {
  const { message } = AntdApp.useApp()
  const [menu, setMenu] = useState<MenuKey>('console')
  const [collapsed, setCollapsed] = useState(false)
  const [view, setView] = useState<'list' | 'wizard' | 'review' | 'rparticipate' | 'policyDetail' | 'opinionDetail'>('list')
  const [wizardInit, setWizardInit] = useState<DraftInit | null>(null)
  const [reviewInit, setReviewInit] = useState<ReviewRecord | null>(null)
  const [rparticipateTarget, setRparticipateTarget] = useState<ReviewRecord | null>(null)
  const [policyDetailTarget, setPolicyDetailTarget] = useState<Policy | null>(null)
  const policyDetailVersions = useMemo(
    () => (policyDetailTarget ? buildPolicyVersions(policyDetailTarget) : []),
    [policyDetailTarget],
  )
  const [reviews, setReviews] = useState<ReviewRecord[]>(seedReviews)

  const [policies, setPolicies] = useState<Policy[]>(seedPolicies)
  const [drafts, setDrafts] = useState<Draft[]>(seedDrafts)

  // ——— 意见征集 ———
  const [opinions, setOpinions] = useState<OpinionCollect[]>(seedOpinions)
  const [opinionApplied, setOpinionApplied] = useState<Record<string, string>>({})
  const [opinionModalOpen, setOpinionModalOpen] = useState(false)
  const [opinionForm] = Form.useForm()
  const opinionPolicyName = Form.useWatch('policyName', opinionForm) as string | undefined

  // 状态由征集起止时间动态推导
  const opinionRows = useMemo(
    () => opinions.map((o) => ({ ...o, status: opinionStatus(o) })),
    [opinions],
  )
  const filteredOpinions = useMemo(() => {
    const f = opinionApplied
    return opinionRows.filter((o) => {
      if (f.title && !o.title.includes(f.title)) return false
      if (f.policyName && o.policyName !== f.policyName) return false
      if (f.status && o.status !== f.status) return false
      return true
    })
  }, [opinionRows, opinionApplied])
  const opinionPolicyOptions = useMemo(
    () => policies.map((p) => ({ value: p.name, label: `${p.name}（${p.docNo}）` })),
    [policies],
  )
  const opinionVersionOptions = useMemo(() => {
    const p = policies.find((x) => x.name === opinionPolicyName)
    if (!p) return [] as { value: string; label: string }[]
    return buildPolicyVersions(p).map((v) => ({
      value: v.version,
      label: `${v.version} · ${v.publishDate}`,
    }))
  }, [policies, opinionPolicyName])

  const openOpinionModal = () => {
    opinionForm.resetFields()
    setOpinionModalOpen(true)
  }
  const submitOpinion = async () => {
    try {
      const vals = await opinionForm.validateFields()
      const p = policies.find((x) => x.name === vals.policyName)
      const item: OpinionCollect = {
        id: 'O' + String(Date.now()).slice(-6),
        title: vals.title,
        policyName: vals.policyName,
        version: vals.version,
        category: p?.category ?? '',
        owner: p?.owner ?? '',
        startTime: (vals.startTime as Dayjs).format('YYYY-MM-DD HH:mm'),
        endTime: (vals.endTime as Dayjs).format('YYYY-MM-DD HH:mm'),
        description: vals.description ?? '',
      }
      setOpinions((prev) => [item, ...prev])
      setOpinionModalOpen(false)
      opinionForm.resetFields()
      message.success('已新增意见征集')
    } catch {
      /* 校验未通过 */
    }
  }

  // 征集详情：基本信息 + 前台提交的意见
  const [opinionDetailTarget, setOpinionDetailTarget] = useState<
    (OpinionCollect & { status: OpinionStatus }) | null
  >(null)
  // 读取可变数组 opinionFeedbacks：前台新提交的意见会出现在这里
  const opinionDetailFeedbacks = opinionDetailTarget
    ? opinionFeedbacks.filter((f) => f.collectId === opinionDetailTarget.id)
    : []
  const openOpinionDetail = (o: OpinionCollect & { status: OpinionStatus }) => {
    setOpinionDetailTarget(o)
    setView('opinionDetail')
  }

  // ——— 通知公告 ———
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements)
  const [annModalOpen, setAnnModalOpen] = useState(false)
  const [annForm] = Form.useForm()
  const [annContent, setAnnContent] = useState('')
  const [annFiles, setAnnFiles] = useState<UploadFile[]>([])
  const [annEditorKey, setAnnEditorKey] = useState(0)
  const [annView, setAnnView] = useState<Announcement | null>(null)

  const openAnnModal = () => {
    annForm.resetFields()
    setAnnContent('')
    setAnnFiles([])
    setAnnEditorKey((k) => k + 1) // 重建编辑器，清空内容
    setAnnModalOpen(true)
  }

  const submitAnn = async () => {
    try {
      const vals = await annForm.validateFields()
      const plain = annContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      if (!plain) {
        message.warning('请输入公告内容')
        return
      }
      const item: Announcement = {
        id: 'N' + String(Date.now()).slice(-6),
        title: vals.title,
        departments: (vals.departments as string[]) ?? [],
        content: annContent,
        attachments: annFiles.map((f) => ({
          name: f.name,
          size: f.size ? `${Math.max(1, Math.round(f.size / 1024))} KB` : '—',
        })),
        publisher: '张明',
        publishTime: fmtDate(new Date()),
      }
      setAnnouncements((prev) => [item, ...prev])
      setAnnModalOpen(false)
      message.success('公告已发布')
    } catch {
      /* 校验未通过 */
    }
  }
  const [pending, setPending] = useState<Pending[]>(seedPending)

  const [pendingApplied, setPendingApplied] = useState<Record<string, string>>({})
  const [policyApplied, setPolicyApplied] = useState<Record<string, string>>({})
  const [rqueueApplied, setRqueueApplied] = useState<Record<string, string>>({})
  const [rdoneApplied, setRdoneApplied] = useState<Record<string, string>>({})

  const [filterForm] = Form.useForm()
  const [applied, setApplied] = useState<{ name: string; category: string; status: string }>({ name: '', category: '', status: '' })

  const draftCategoryOptions = useMemo(
    () => Array.from(new Set(drafts.map((d) => d.category))).map((c) => ({ label: c, value: c })),
    [drafts],
  )
  const draftStatusOptions = D_STATUS.map((s) => ({ label: s, value: s }))

  const filteredDrafts = useMemo(() => {
    const kw = applied.name.trim().toLowerCase()
    return drafts.filter(
      (d) =>
        (!kw || d.name.toLowerCase().includes(kw)) &&
        (!applied.category || d.category === applied.category) &&
        (!applied.status || d.status === applied.status),
    )
  }, [drafts, applied])

  const filteredPending = useMemo(
    () =>
      pending.filter(
        (p) =>
          (!pendingApplied.name || p.name.includes(pendingApplied.name)) &&
          (!pendingApplied.category || p.category === pendingApplied.category) &&
          (!pendingApplied.owner || p.owner === pendingApplied.owner),
      ),
    [pending, pendingApplied],
  )

  const filteredPolicies = useMemo(
    () =>
      policies.filter(
        (p) =>
          (!policyApplied.name || p.name.includes(policyApplied.name)) &&
          (!policyApplied.category || p.category === policyApplied.category) &&
          (!policyApplied.status || p.status === policyApplied.status) &&
          (!policyApplied.owner || p.owner === policyApplied.owner),
      ),
    [policies, policyApplied],
  )

  const onFilter = () => {
    const v = filterForm.getFieldsValue()
    setApplied({ name: v.name || '', category: v.category || '', status: v.status || '' })
  }
  const onFilterReset = () => {
    filterForm.resetFields()
    setApplied({ name: '', category: '', status: '' })
  }

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
    message.success('已删除该草稿')
  }

  const openDraft = (d: Draft) => {
    setWizardInit({
      info: {
        docNo: d.docNo,
        name: d.name,
        category: d.category,
        owner: d.owner,
        drafter: d.drafter,
        effectiveDate: d.effectiveDate,
      },
      tree: d.tree,
      step: d.status === '待解析' ? 2 : d.status === '待核验' ? 3 : 4,
      file: { name: `${d.name}.docx`, type: 'word' },
      parsed: d.status !== '待解析',
    })
    setView('wizard')
  }

  const handleFinish = (r: DraftResult) => {
    const np: Pending = {
      id: 'P' + String(Date.now()).slice(-5),
      docNo: r.docNo,
      name: r.name,
      category: r.category,
      owner: r.owner,
      drafter: r.drafter,
      status: '待评审',
    }
    setPending((prev) => [np, ...prev])
    message.success('制度已提交至「发起评审」，请安排评审')
    setView('list')
    setMenu('pending')
  }

  const openReviewInitiate = (p: Pending) => {
    setReviewInit({
      id: 'RV-' + String(Date.now()).slice(-6),
      theme: '',
      info: { name: p.name, docNo: p.docNo, owner: p.owner, drafter: p.drafter, draftTime: new Date().toISOString().slice(0, 10) },
      tree: [],
      participants: [],
      status: '待评审',
    })
    setView('review')
  }
  const launchReview = (theme: string, participants: string[]) => {
    if (!reviewInit) return
    const rec: ReviewRecord = {
      ...reviewInit,
      theme,
      participants: Array.from(new Set([...participants, CURRENT_USER])),
      status: '待评审',
    }
    setReviews((prev) => [rec, ...prev])
    message.success('评审已发起，参与人员已收到待评审任务')
    setReviewInit(null)
    setView('list')
    setMenu('rqueue')
  }

  const openParticipate = (r: ReviewRecord) => {
    setRparticipateTarget(r)
    setView('rparticipate')
  }
  const openPolicyDetail = (p: Policy) => {
    setPolicyDetailTarget(p)
    setView('policyDetail')
  }
  const publishPolicy = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: '已公示' } : p)),
    )
    message.success('制度已公示')
  }
  const submitReview = (annotations: AnnotationItem[]) => {
    if (!rparticipateTarget) return
    setReviews((prev) =>
      prev.map((r) =>
        r.id === rparticipateTarget.id ? { ...r, status: '已评审', annotations } : r,
      ),
    )
    message.success('评审已提交，可在「已评审」中查看')
    setRparticipateTarget(null)
    setView('list')
    setMenu('rdone')
  }

  const addAnnotation = (id: string, item: AnnotationItem) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, annotations: [...(r.annotations || []), item] } : r)))
    setRparticipateTarget((prev) => (prev && prev.id === id ? { ...prev, annotations: [...(prev.annotations || []), item] } : prev))
  }

  const myQueue = useMemo(
    () => reviews.filter((r) => r.participants.includes(CURRENT_USER) && r.status === '待评审'),
    [reviews],
  )
  const myDone = useMemo(
    () => reviews.filter((r) => r.participants.includes(CURRENT_USER) && r.status === '已评审'),
    [reviews],
  )

  const reviewMatch = (r: ReviewRecord, a: Record<string, string>) =>
    (!a.theme || (r.theme || '').includes(a.theme)) &&
    (!a.name || r.info.name.includes(a.name)) &&
    (!a.category || (r.category || '') === a.category) &&
    (!a.owner || r.info.owner === a.owner)

  const filteredQueue = useMemo(() => myQueue.filter((r) => reviewMatch(r, rqueueApplied)), [myQueue, rqueueApplied])
  const filteredDone = useMemo(() => myDone.filter((r) => reviewMatch(r, rdoneApplied)), [myDone, rdoneApplied])

  // ——— 数据看板：指标卡 ———
  const kpis = [
    { title: '制度总数', value: policies.length, suffix: '项' },
    { title: '生效中', value: policies.filter((p) => p.status === '生效中').length, suffix: '项' },
    { title: '已公示', value: policies.filter((p) => p.status === '已公示').length, suffix: '项' },
    { title: '评审中', value: policies.filter((p) => p.status === '评审中').length, suffix: '项' },
    { title: '待评审', value: reviews.filter((r) => r.status === '待评审').length, suffix: '项' },
    {
      title: '意见征集进行中',
      value: opinions.filter((o) => opinionStatus(o) === '进行中').length,
      suffix: '场',
    },
  ]

  // ——— 数据看板：图表 ———
  const statusOption = useMemo<EChartsOption>(() => {
    const keys: Policy['status'][] = ['生效中', '已公示', '评审中', '草稿', '已过期']
    return {
      tooltip: { trigger: 'item', formatter: '{b}：{c} 项（{d}%）' },
      legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#64748b' } },
      color: ['#22a06b', '#3b5bff', '#13c2c2', '#bfbfbf', '#f5222d'],
      series: [
        {
          type: 'pie',
          radius: ['46%', '68%'],
          center: ['50%', '44%'],
          itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
          label: { formatter: '{b}\n{c} 项', color: '#475569', fontSize: 12, lineHeight: 16 },
          labelLine: { length: 8, length2: 8 },
          data: keys.map((k) => ({
            name: k,
            value: policies.filter((p) => p.status === k).length,
          })),
        },
      ],
    }
  }, [policies])

  const categoryOption = useMemo<EChartsOption>(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 20, top: 24, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: [...CATEGORIES],
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#64748b' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f2f7' } },
        axisLabel: { color: '#94a3b8' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 28,
          data: CATEGORIES.map((c) => policies.filter((p) => p.category === c).length),
          itemStyle: { borderRadius: [6, 6, 0, 0], color: '#3b5bff' },
          label: { show: true, position: 'top', color: '#64748b', fontSize: 12 },
        },
      ],
    }
  }, [policies])

  const ownerOption = useMemo<EChartsOption>(() => {
    const rows = OWNERS.map((o) => ({
      name: o,
      value: policies.filter((p) => p.owner === o).length,
    })).sort((a, b) => a.value - b.value)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 32, top: 12, bottom: 4, containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f2f7' } },
        axisLabel: { color: '#94a3b8' },
      },
      yAxis: {
        type: 'category',
        data: rows.map((r) => r.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#64748b' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 16,
          data: rows.map((r) => r.value),
          itemStyle: { borderRadius: [0, 6, 6, 0], color: '#13c2c2' },
          label: { show: true, position: 'right', color: '#64748b', fontSize: 12 },
        },
      ],
    }
  }, [policies])

  const trendOption = useMemo<EChartsOption>(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const counts = months.map(
      (m) => opinionFeedbacks.filter((f) => f.submitTime.slice(0, 7) === m).length,
    )
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 20, top: 24, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months.map((m) => `${Number(m.slice(5))}月`),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#64748b' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f0f2f7' } },
        axisLabel: { color: '#94a3b8' },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbolSize: 7,
          data: counts,
          lineStyle: { width: 3, color: '#3b5bff' },
          itemStyle: { color: '#3b5bff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 91, 255, 0.35)' },
                { offset: 1, color: 'rgba(59, 91, 255, 0)' },
              ],
            },
          },
        },
      ],
    }
  }, [opinions])

  const opinionOption = useMemo<EChartsOption>(() => {
    const keys: OpinionStatus[] = ['进行中', '未开始', '已结束']
    return {
      tooltip: { trigger: 'item', formatter: '{b}：{c} 场（{d}%）' },
      legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#64748b' } },
      color: ['#3b5bff', '#bfbfbf', '#22a06b'],
      series: [
        {
          type: 'pie',
          radius: ['46%', '68%'],
          center: ['50%', '44%'],
          itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
          label: { formatter: '{b}\n{c} 场', color: '#475569', fontSize: 12, lineHeight: 16 },
          labelLine: { length: 8, length2: 8 },
          data: keys.map((k) => ({
            name: k,
            value: opinions.filter((o) => opinionStatus(o) === k).length,
          })),
        },
      ],
    }
  }, [opinions])

  const breadcrumb = (
    <>
      <Button
        type="text"
        className="sider-collapse-btn"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed((c) => !c)}
        aria-label="收起/展开菜单"
      />
      <Breadcrumb
        items={[
          ...(menu === 'console' ? [{ title: '数据看板' }] : []),
          ...(menu === 'draft'
            ? [
                { title: '智能起草', onClick: view === 'wizard' ? () => setView('list') : undefined },
                ...(view === 'wizard' ? [{ title: wizardInit ? '起草详情' : '新建起草' }] : []),
              ]
            : []),
          ...(menu === 'pending' && view === 'list' ? [{ title: '制度管理' }, { title: '发起评审' }] : []),
          ...(menu === 'policies' && view === 'list' ? [{ title: '制度管理' }, { title: '制度清单' }] : []),
          ...(menu === 'policies' && view === 'policyDetail' ? [{ title: '制度管理' }, { title: '制度清单' }, { title: '制度详情' }] : []),
          ...(menu === 'rqueue' && view === 'list' ? [{ title: '评审管理' }, { title: '待评审' }] : []),
          ...(menu === 'prd' ? [{ title: '需求管理' }, { title: 'PRD 文档' }] : []),
          ...(menu === 'funcPerm' ? [{ title: '需求管理' }, { title: '功能权限' }] : []),
          ...(menu === 'dataPerm' ? [{ title: '需求管理' }, { title: '数据权限' }] : []),
          ...(menu === 'rdone' && view === 'list' ? [{ title: '评审管理' }, { title: '已评审' }] : []),
          ...(menu === 'opinions' && view === 'list' ? [{ title: '意见征集' }] : []),
          ...(menu === 'opinions' && view === 'opinionDetail'
            ? [{ title: '意见征集', onClick: () => setView('list') }, { title: '征集详情' }]
            : []),
          ...(view === 'review' ? [{ title: '制度管理' }, { title: '发起评审' }] : []),
          ...(view === 'rparticipate' ? [{ title: '评审管理' }, { title: '待评审' }, { title: '参与评审' }] : []),
        ]}
      />
    </>
  )

  return (
    <Layout className="sys-layout">
      <Navbar solid title="制度管理" breadcrumb={breadcrumb} siderRight={collapsed ? 80 : 260} collapsed={collapsed} />
      <div className="sys-body">
        <aside className={`sys-sider${collapsed ? ' collapsed' : ''}`}>
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[menu]}
            defaultOpenKeys={[]}
            items={menuItems}
            onClick={({ key }) => {
              setMenu(key as MenuKey)
              setView('list')
            }}
          />
        </aside>
        <Content className="sys-content">
          <div className="sys-container">
            {view === 'review' && reviewInit && (
              <ReviewFlow
                mode="initiate"
                data={reviewInit}
                onBack={() => { setView('list'); setMenu('pending') }}
                onLaunch={launchReview}
              />
            )}
            {view === 'rparticipate' && rparticipateTarget && (
              <ReviewFlow
                mode="participate"
                data={rparticipateTarget}
                currentUser={CURRENT_USER}
                onBack={() => { setView('list'); setMenu('rqueue') }}
                onSubmit={submitReview}
                onAddAnnotation={(item) => rparticipateTarget && addAnnotation(rparticipateTarget.id, item)}
              />
            )}
            {menu === 'console' && view === 'list' && (
              <>
                <Title level={3} className="sys-page-title">
                  数据看板
                </Title>

                {/* 指标卡 */}
                <Row gutter={[16, 16]} className="sys-stat-row">
                  {kpis.map((s) => (
                    <Col xs={24} sm={12} md={8} xl={4} key={s.title}>
                      <Card className="sys-stat-card">
                        <Statistic title={s.title} value={s.value} suffix={s.suffix} />
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* 图表：状态分布 + 分类分布 */}
                <Row gutter={[16, 16]} className="sys-dash-row">
                  <Col xs={24} lg={10}>
                    <Card className="sys-card sys-dash-card" title="制度状态分布">
                      <EChart option={statusOption} height={300} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={14}>
                    <Card className="sys-card sys-dash-card" title="各分类制度数量">
                      <EChart option={categoryOption} height={300} />
                    </Card>
                  </Col>
                </Row>

                {/* 图表：部门分布 + 意见提交趋势 */}
                <Row gutter={[16, 16]} className="sys-dash-row">
                  <Col xs={24} lg={12}>
                    <Card className="sys-card sys-dash-card" title="各责任部门制度数量">
                      <EChart option={ownerOption} height={300} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card className="sys-card sys-dash-card" title="近 6 个月意见提交趋势">
                      <EChart option={trendOption} height={300} />
                    </Card>
                  </Col>
                </Row>

                {/* 意见征集分布 + 待评审清单 */}
                <Row gutter={[16, 16]} className="sys-dash-row">
                  <Col xs={24} lg={10}>
                    <Card className="sys-card sys-dash-card" title="意见征集状态分布">
                      <EChart option={opinionOption} height={280} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={14}>
                    <Card
                      className="sys-card sys-dash-card"
                      title="待评审制度"
                      extra={<span className="sys-dash-extra">共 {reviews.filter((r) => r.status === '待评审').length} 项</span>}
                    >
                      <Table<ReviewRecord>
                        rowKey="id"
                        size="small"
                        dataSource={reviews.filter((r) => r.status === '待评审').slice(0, 5)}
                        pagination={false}
                        columns={[
                          { title: '评审主题', dataIndex: 'theme' },
                          { title: '制度名称', dataIndex: ['info', 'name'], width: 210 },
                          { title: '责任部门', dataIndex: ['info', 'owner'], width: 130 },
                          {
                            title: '状态',
                            dataIndex: 'status',
                            width: 100,
                            render: () => <Tag color="orange">待评审</Tag>,
                          },
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 通知公告 */}
                <Row gutter={[16, 16]} className="sys-dash-row">
                  <Col span={24}>
                    <Card
                      className="sys-card sys-dash-card"
                      title="通知公告"
                      extra={
                        <Space size={12}>
                          <span className="sys-dash-extra">共 {announcements.length} 条</span>
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={openAnnModal}
                          >
                            新增公告
                          </Button>
                        </Space>
                      }
                    >
                      <Table<Announcement>
                        rowKey="id"
                        dataSource={announcements}
                        pagination={{
                          pageSize: 5,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (t) => `共 ${t} 条`,
                        }}
                        columns={[
                          { title: '公告标题', dataIndex: 'title' },
                          {
                            title: '接收部门',
                            dataIndex: 'departments',
                            width: 280,
                            render: (v: string[]) => (
                              <>
                                {v.map((d) => (
                                  <Tag key={d} color="blue">
                                    {d}
                                  </Tag>
                                ))}
                              </>
                            ),
                          },
                          {
                            title: '附件',
                            dataIndex: 'attachments',
                            width: 90,
                            render: (v: Announcement['attachments']) =>
                              v.length ? `${v.length} 个` : '—',
                          },
                          { title: '发布人', dataIndex: 'publisher', width: 110 },
                          { title: '发布时间', dataIndex: 'publishTime', width: 170 },
                          {
                            title: '操作',
                            key: 'action',
                            width: 90,
                            render: (_: unknown, r: Announcement) => (
                              <Button type="link" size="small" onClick={() => setAnnView(r)}>
                                查看
                              </Button>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 新增公告弹窗 */}
                <Modal
                  title="新增通知公告"
                  open={annModalOpen}
                  onCancel={() => setAnnModalOpen(false)}
                  onOk={submitAnn}
                  okText="发布"
                  cancelText="取消"
                  width={780}
                >
                  <Form form={annForm} layout="vertical" className="ann-form">
                    <Form.Item
                      name="title"
                      label="公告标题"
                      rules={[{ required: true, message: '请输入公告标题' }]}
                    >
                      <Input placeholder="请输入公告标题" maxLength={60} allowClear />
                    </Form.Item>
                    <Form.Item
                      name="departments"
                      label="接收部门"
                      rules={[{ required: true, message: '请选择接收部门' }]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="请选择接收部门"
                        options={ANN_DEPARTMENT_OPTIONS}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                      />
                    </Form.Item>

                    <div className="ann-field">
                      <div className="ann-field-label">
                        公告内容 <span className="ann-req">*</span>
                      </div>
                      <RichTextEditor
                        key={annEditorKey}
                        value={annContent}
                        onChange={setAnnContent}
                        placeholder="请输入公告内容…"
                        height={220}
                      />
                    </div>

                    <div className="ann-field">
                      <div className="ann-field-label">附件</div>
                      <Upload
                        multiple
                        fileList={annFiles}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => setAnnFiles(fileList)}
                        onRemove={(f) => setAnnFiles((prev) => prev.filter((x) => x.uid !== f.uid))}
                      >
                        <Button icon={<UploadOutlined />}>选择附件</Button>
                      </Upload>
                      <div className="ann-field-tip">
                        支持添加多个附件，单个不超过 20 MB
                      </div>
                    </div>
                  </Form>
                </Modal>

                {/* 查看公告弹窗 */}
                <Modal
                  title={annView?.title}
                  open={!!annView}
                  onCancel={() => setAnnView(null)}
                  footer={<Button onClick={() => setAnnView(null)}>关闭</Button>}
                  width={720}
                >
                  {annView && (
                    <div className="ann-view">
                      <div className="ann-view-meta">
                        <span>发布人：{annView.publisher}</span>
                        <span>发布时间：{annView.publishTime}</span>
                        <span>接收部门：{annView.departments.join('、')}</span>
                      </div>
                      <div
                        className="ann-view-content"
                        dangerouslySetInnerHTML={{ __html: annView.content }}
                      />
                      {annView.attachments.length > 0 && (
                        <div className="ann-view-attachments">
                          <div className="ann-view-attachments-title">附件</div>
                          {annView.attachments.map((a) => (
                            <div key={a.name} className="ann-view-attachment">
                              <PaperClipOutlined />
                              <span className="ann-view-attachment-name">{a.name}</span>
                              <span className="ann-view-attachment-size">{a.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Modal>
              </>
            )}

            {menu === 'draft' && view !== 'review' && view !== 'rparticipate' &&
              (                view === 'wizard' ? (
                <DraftWizard onBack={() => setView('list')} onFinish={handleFinish} initial={wizardInit ?? undefined} />
              ) : (
                <>
                <div className="sys-search-bar">
                  <Form
                    form={filterForm}
                    layout="horizontal"
                    className="sys-search-form"
                    labelCol={{ flex: '90px' }}
                    wrapperCol={{ flex: 'auto' }}
                  >
                    <Form.Item name="name" label="制度名称" className="sys-filter-item">
                      <Input allowClear placeholder="输入制度名称" />
                    </Form.Item>
                    <Form.Item name="category" label="分类" className="sys-filter-item">
                      <Select allowClear placeholder="全部" options={draftCategoryOptions} />
                    </Form.Item>
                    <Form.Item name="status" label="状态" className="sys-filter-item">
                      <Select allowClear placeholder="全部" options={draftStatusOptions} />
                    </Form.Item>
                    <div className="sys-search-btns">
                      <Button type="primary" onClick={onFilter}>
                        查询
                      </Button>
                      <Button onClick={onFilterReset}>重置</Button>
                    </div>
                  </Form>
                </div>

                <div className="sys-action-row">
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => { setWizardInit(null); setView('wizard') }}>
                    智能起草
                  </Button>
                </div>

                <Card className="sys-card">
                  <Table<Draft>
                    rowKey="id"
                    dataSource={filteredDrafts}
                    pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 项` }}
                    columns={[
                      { title: '制度名称', dataIndex: 'name' },
                      { title: '制度文号', dataIndex: 'docNo', width: 160 },
                      { title: '分类', dataIndex: 'category', width: 120, render: (v: string) => <Tag color={draftCategoryColor[v] ?? 'default'}>{v}</Tag> },
                      { title: '责任部门', dataIndex: 'owner', width: 130 },
                      { title: '起草人', dataIndex: 'drafter', width: 110 },
                      { title: '起草时间', dataIndex: 'draftTime', width: 120 },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 100,
                        render: (v: DraftStatus) => <Tag color={draftStatusColor[v]}>{v}</Tag>,
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 160,
                        render: (_, r: Draft) => {
                          const labelOf: Record<DraftStatus, string> = {
                            待解析: '解析',
                            待核验: '核验',
                            待入库: '预览',
                          }
                          return (
                            <Space size={4} wrap={false}>
                              <Button type="link" size="small" onClick={() => openDraft(r)}>
                                {labelOf[r.status]}
                              </Button>
                              <Popconfirm title="确认删除该草稿？" onConfirm={() => handleDeleteDraft(r.id)} okText="删除" cancelText="取消">
                                <Button type="link" size="small" danger>
                                  删除
                                </Button>
                              </Popconfirm>
                            </Space>
                          )
                        },
                      },
                    ]}
                  />
                </Card>
                </>
              ))}

            {menu === 'pending' && view === 'list' && (
              <>
                <FilterBar
                  fields={[
                    { name: 'name', label: '制度名称', type: 'input' },
                    { name: 'category', label: '分类', type: 'select', options: categoryOptions },
                    { name: 'owner', label: '责任部门', type: 'select', options: ownerOptions },
                  ]}
                  onSearch={setPendingApplied}
                />
                <Card className="sys-card">
                  <Table<Pending>
                    rowKey="id"
                    dataSource={filteredPending}
                    pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 项` }}
                    columns={[
                      { title: '制度名称', dataIndex: 'name' },
                      { title: '制度文号', dataIndex: 'docNo', width: 160 },
                      { title: '分类', dataIndex: 'category', width: 120, render: (v: string) => <Tag color={draftCategoryColor[v] ?? 'default'}>{v}</Tag> },
                      { title: '责任部门', dataIndex: 'owner', width: 130 },
                      { title: '起草人', dataIndex: 'drafter', width: 110 },
                      { title: '状态', dataIndex: 'status', width: 100, render: () => <Tag color="orange">待评审</Tag> },
                      {
                        title: '操作',
                        key: 'action',
                        width: 100,
                        render: (_, r: Pending) => (
                          <Button type="link" size="small" onClick={() => openReviewInitiate(r)}>
                            评审
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Card>
              </>
            )}

            {menu === 'policies' && view === 'list' && (
              <>
                <FilterBar
                  fields={[
                    { name: 'name', label: '制度名称', type: 'input' },
                    { name: 'category', label: '分类', type: 'select', options: categoryOptions },
                    { name: 'status', label: '状态', type: 'select', options: policyStatusOptions },
                    { name: 'owner', label: '责任部门', type: 'select', options: ownerOptions },
                  ]}
                  onSearch={setPolicyApplied}
                />
                <Card className="sys-card">
                  <Table<Policy>
                    rowKey="id"
                    dataSource={filteredPolicies}
                    pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 项` }}
                    columns={[
                      {
                        title: '制度名称',
                        dataIndex: 'name',
                        render: (v: string, r: Policy) => (
                          <a
                            className="sys-name-link"
                            onClick={(e) => {
                              e.stopPropagation()
                              openPolicyDetail(r)
                            }}
                          >
                            {v}
                          </a>
                        ),
                      },
                      { title: '制度文号', dataIndex: 'docNo', width: 160 },
                      { title: '分类', dataIndex: 'category', width: 120, render: (v: string) => <Tag color={draftCategoryColor[v] ?? 'default'}>{v}</Tag> },
                      { title: '责任部门', dataIndex: 'owner', width: 130 },
                      { title: '起草人', dataIndex: 'drafter', width: 110 },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 100,
                        render: (v: Policy['status']) => <Tag color={policyStatusColor[v]}>{v}</Tag>,
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 170,
                        render: (_, r: Policy) => (
                          <Space size={4}>
                            {r.status === '生效中' && (
                              <Popconfirm
                                title="确认公示该制度？"
                                description="公示后状态将变更为「已公示」"
                                okText="确认公示"
                                cancelText="取消"
                                onConfirm={() => {
                                  publishPolicy(r.id)
                                }}
                              >
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  公示
                                </Button>
                              </Popconfirm>
                            )}
                            <Button
                              type="link"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                openPolicyDetail(r)
                              }}
                            >
                              详情
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </>
            )}

            {menu === 'rqueue' && view === 'list' && (
              <>
                <FilterBar
                  fields={[
                    { name: 'theme', label: '评审主题', type: 'input' },
                    { name: 'name', label: '制度名称', type: 'input' },
                    { name: 'category', label: '分类', type: 'select', options: categoryOptions },
                    { name: 'owner', label: '责任部门', type: 'select', options: ownerOptions },
                  ]}
                  onSearch={setRqueueApplied}
                />
                <Card className="sys-card">
                  <Table<ReviewRecord>
                    rowKey="id"
                    dataSource={filteredQueue}
                    pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 项` }}
                    columns={[
                      { title: '评审主题', dataIndex: 'theme' },
                      { title: '制度名称', dataIndex: ['info', 'name'] },
                      { title: '制度文号', dataIndex: ['info', 'docNo'], width: 170 },
                      { title: '责任部门', dataIndex: ['info', 'owner'], width: 130 },
                      { title: '起草人', dataIndex: ['info', 'drafter'], width: 110 },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 100,
                        render: (v: ReviewRecord['status']) => <Tag color="orange">{v}</Tag>,
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 110,
                        render: (_, r: ReviewRecord) => (
                          <Button type="link" size="small" onClick={() => openParticipate(r)}>
                            参与评审
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Card>
              </>
            )}

            {menu === 'policies' && view === 'policyDetail' && policyDetailTarget && (
              <PolicyDetail
                versions={policyDetailVersions}
                onBack={() => { setView('list'); setMenu('policies') }}
              />
            )}

            {menu === 'rdone' && view === 'list' && (
              <>
                <FilterBar
                  fields={[
                    { name: 'theme', label: '评审主题', type: 'input' },
                    { name: 'name', label: '制度名称', type: 'input' },
                    { name: 'category', label: '分类', type: 'select', options: categoryOptions },
                    { name: 'owner', label: '责任部门', type: 'select', options: ownerOptions },
                  ]}
                  onSearch={setRdoneApplied}
                />
                <Card className="sys-card">
                  <Table<ReviewRecord>
                    rowKey="id"
                    dataSource={filteredDone}
                    pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 项` }}
                    columns={[
                      { title: '评审主题', dataIndex: 'theme' },
                      { title: '制度名称', dataIndex: ['info', 'name'] },
                      { title: '制度文号', dataIndex: ['info', 'docNo'], width: 170 },
                      { title: '责任部门', dataIndex: ['info', 'owner'], width: 130 },
                      { title: '起草人', dataIndex: ['info', 'drafter'], width: 110 },
                      {
                        title: '批注',
                        dataIndex: 'annotations',
                        width: 90,
                        render: (_: unknown, r: ReviewRecord) => `${r.annotations?.length ?? 0} 条`,
                      },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 100,
                        render: (v: ReviewRecord['status']) => <Tag color="green">{v}</Tag>,
                      },
                    ]}
                  />
                </Card>
              </>
            )}

            {menu === 'opinions' && view === 'list' && (
              <>
                <FilterBar
                  fields={[
                    { name: 'title', label: '征集标题', type: 'input' },
                    { name: 'policyName', label: '关联制度', type: 'select', options: opinionPolicyOptions },
                    { name: 'status', label: '状态', type: 'select', options: OPINION_STATUS_OPTIONS },
                  ]}
                  onSearch={setOpinionApplied}
                />
                <div className="sys-action-row">
                  <Button type="primary" icon={<PlusOutlined />} onClick={openOpinionModal}>
                    新增征集
                  </Button>
                </div>
                <Card className="sys-card">
                  <Table<OpinionCollect & { status: OpinionStatus }>
                    rowKey="id"
                    dataSource={filteredOpinions}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (t) => `共 ${t} 项`,
                    }}
                    columns={[
                      {
                        title: '征集标题',
                        dataIndex: 'title',
                        width: 300,
                        ellipsis: { showTitle: false },
                        render: (v: string, r: OpinionCollect & { status: OpinionStatus }) => (
                          <Tooltip title={v} placement="topLeft">
                            <a
                              className="sys-name-link sys-opinion-title-link"
                              onClick={(e) => {
                                e.stopPropagation()
                                openOpinionDetail(r)
                              }}
                            >
                              {v}
                            </a>
                          </Tooltip>
                        ),
                      },
                      { title: '关联制度', dataIndex: 'policyName', width: 210 },
                      { title: '制度版本', dataIndex: 'version', width: 100 },
                      {
                        title: '征集时间',
                        key: 'time',
                        width: 300,
                        render: (_: unknown, r: OpinionCollect) => `${r.startTime} ~ ${r.endTime}`,
                      },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        width: 100,
                        render: (v: OpinionStatus) => <Tag color={opinionStatusColor[v]}>{v}</Tag>,
                      },
                      {
                        title: '描述信息',
                        dataIndex: 'description',
                        ellipsis: { showTitle: false },
                        render: (v: string) => (
                          <Tooltip title={v} placement="topLeft">
                            {v}
                          </Tooltip>
                        ),
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 90,
                        render: (_: unknown, r: OpinionCollect & { status: OpinionStatus }) => (
                          <Button type="link" size="small" onClick={() => openOpinionDetail(r)}>
                            查看
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Card>

                <Modal
                  title="新增意见征集"
                  open={opinionModalOpen}
                  onCancel={() => setOpinionModalOpen(false)}
                  onOk={submitOpinion}
                  okText="确定"
                  cancelText="取消"
                  width={560}
                >
                  <Form form={opinionForm} layout="vertical" className="sys-opinion-form">
                    <Form.Item
                      name="title"
                      label="征集标题"
                      rules={[{ required: true, message: '请输入征集标题' }]}
                    >
                      <Input placeholder="请输入征集标题" maxLength={60} allowClear />
                    </Form.Item>
                    <Form.Item
                      name="policyName"
                      label="关联制度"
                      rules={[{ required: true, message: '请选择关联制度' }]}
                    >
                      <Select
                        placeholder="请选择制度"
                        options={opinionPolicyOptions}
                        showSearch
                        optionFilterProp="label"
                        onChange={() => opinionForm.setFieldValue('version', undefined)}
                      />
                    </Form.Item>
                    <Form.Item
                      name="version"
                      label="制度版本"
                      rules={[{ required: true, message: '请选择制度版本' }]}
                    >
                      <Select
                        placeholder={opinionPolicyName ? '请选择制度版本' : '请先选择关联制度'}
                        options={opinionVersionOptions}
                        disabled={!opinionPolicyName}
                      />
                    </Form.Item>
                    <Form.Item
                      name="startTime"
                      label="征集开始时间"
                      rules={[{ required: true, message: '请选择征集开始时间' }]}
                    >
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        style={{ width: '100%' }}
                        placeholder="请选择开始时间"
                      />
                    </Form.Item>
                    <Form.Item
                      name="endTime"
                      label="征集结束时间"
                      dependencies={['startTime']}
                      rules={[
                        { required: true, message: '请选择征集结束时间' },
                        ({ getFieldValue }) => ({
                          validator(_rule, value) {
                            const s = getFieldValue('startTime') as Dayjs | undefined
                            if (!value || !s || !value.isBefore(s)) return Promise.resolve()
                            return Promise.reject(new Error('结束时间需晚于开始时间'))
                          },
                        }),
                      ]}
                    >
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        style={{ width: '100%' }}
                        placeholder="请选择结束时间"
                      />
                    </Form.Item>
                    <Form.Item name="description" label="描述信息">
                      <Input.TextArea rows={3} maxLength={200} showCount placeholder="请输入描述信息" />
                    </Form.Item>
                  </Form>
                </Modal>
              </>
            )}

            {menu === 'opinions' && view === 'opinionDetail' && opinionDetailTarget && (
              <Card className="sys-card sys-opinion-info">
                <div className="sys-opinion-subtitle">制度基本信息</div>
                {/* 标题 / 状态 / 关联制度 同一行（6 列栅格：3+1+2），描述信息单独一行 */}
                <Descriptions
                  column={{ xs: 1, sm: 2, lg: 6 }}
                  size="middle"
                  items={[
                    { key: 'title', label: '征集标题', span: 3, children: opinionDetailTarget.title },
                    {
                      key: 'status',
                      label: '当前状态',
                      span: 1,
                      children: (
                        <Tag color={opinionStatusColor[opinionDetailTarget.status]}>
                          {opinionDetailTarget.status}
                        </Tag>
                      ),
                    },
                    { key: 'policy', label: '关联制度', span: 2, children: opinionDetailTarget.policyName },
                    {
                      key: 'desc',
                      label: '描述信息',
                      span: 6,
                      children: opinionDetailTarget.description || '—',
                    },
                  ]}
                />

                <Divider className="sys-opinion-divider" />

                <div className="sys-opinion-subtitle">意见列表</div>
                <Table<OpinionFeedback>
                  rowKey="id"
                  dataSource={opinionDetailFeedbacks}
                  locale={{ emptyText: <Empty description="暂无提交的意见" /> }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (t) => `共 ${t} 条`,
                  }}
                  columns={[
                    {
                      title: '序号',
                      key: 'idx',
                      width: 70,
                      render: (_: unknown, __: OpinionFeedback, i: number) => i + 1,
                    },
                    { title: '提交人', dataIndex: 'submitter', width: 110 },
                    { title: '所属部门', dataIndex: 'department', width: 150 },
                    { title: '提交时间', dataIndex: 'submitTime', width: 180 },
                    {
                      title: '对应章节',
                      dataIndex: 'sectionTitle',
                      width: 150,
                      render: (v?: string) => v || '—',
                    },
                    { title: '意见内容', dataIndex: 'content' },
                  ]}
                />
              </Card>
            )}

            {menu === 'prd' && (
              <>
                <Title level={3} className="sys-page-title">PRD 文档</Title>
                <PrdDocs />
              </>
            )}
            {menu === 'funcPerm' && (
              <>
                <Title level={3} className="sys-page-title">功能权限</Title>
                <FuncPermission />
              </>
            )}
            {menu === 'dataPerm' && (
              <>
                <Title level={3} className="sys-page-title">数据权限</Title>
                <DataPermission />
              </>
            )}
          </div>
        </Content>
      </div>
    </Layout>
  )
}
