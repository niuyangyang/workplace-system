/* 制度 / 意见征集的演示数据层。
   ── 单独抽出的原因 ──
   PolicyPortal、OpinionCollect、OpinionSubmit 都是首屏可达的门户页面，只需要这份数据；
   如果继续从 SystemMgmt.tsx 导入，会把该页面里的 EChart(echarts)、RichTextEditor(wangEditor)、
   RequirementMgmt(mermaid) 一起打进首包，首屏体积从 ~2.4MB 膨胀到 ~5.9MB。
   所以数据留在本文件，页面组件按需（懒加载）再引入重依赖。 */

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


export const POLICY_NAMES = [
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
export const DRAFTERS = ['张明', '李静', '王磊', '赵婷', '陈昊', '刘洋']
export const P_STATUS: Policy['status'][] = ['生效中', '评审中', '草稿', '已过期', '已公示']

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

export const OPINION_TOPICS = [
  '员工考勤与休假管理办法', '招聘与录用管理细则', '绩效考核实施办法', '费用报销管理细则',
  '差旅费管理规定', '信息安全与数据合规规范', '合同审批管理办法', '研发项目知识产权归属规定',
  '软件研发流程规范', '采购招投标管理办法', '数据分类分级管理办法', '远程办公管理办法',
  '任职资格与晋升管理办法', '实习生与校招管理办法', '办公用品领用管理办法', '会议室使用管理规定',
  '印章管理与使用办法', '供应商准入与管理办法', '档案与印章数字化规范', '员工关怀与心理健康办法',
  '安全生产管理规定',
]

export const p2 = (n: number) => String(n).padStart(2, '0')
export const fmtDT = (d: Date, h: number, m: number) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(h)}:${p2(m)}`
export const shiftDays = (base: Date, days: number) => {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

// 以"当天"为基准生成三种状态的数据，保证演示时未开始/进行中/已结束都有
export const NOW = new Date()
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

export const SUBMITTERS = [
  '张明', '李静', '王磊', '赵婷', '陈昊', '刘洋', '孙悦', '周航',
  '吴敏', '郑楠', '冯涛', '许倩', '何斌', '罗琳', '高扬', '邓倩',
]
export const SECTION_TITLES = [
  '1.2 适用范围', '1.3 术语定义', '2.1 责任部门', '2.2 打卡要求', '3.1 申请与发起',
  '3.2 年休假', '4.1 监督检查', '4.3 违规处理', '5.1 解释与修订',
]
export const FEEDBACK_TEMPLATES = [
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

export const fmtDate = (d: Date) => fmtDT(d, d.getHours(), d.getMinutes())

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
