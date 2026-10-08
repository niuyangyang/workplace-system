import { useState, useRef } from 'react'
import {
  Steps,
  Button,
  Form,
  Input,
  Select,
  TreeSelect,
  Upload,
  Progress,
  Card,
  Popconfirm,
  Space,
  App as AntdApp,
  Modal,
  DatePicker,
  Empty,
} from 'antd'
import type { TreeSelectProps, UploadProps } from 'antd'
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import './draftWizard.css'

/* ——— 组织树（来自人员组织，用于「责任部门」下拉树） ——— */
interface OrgTreeNode {
  id: string
  name: string
  children?: OrgTreeNode[]
}
export const ORG_TREE: OrgTreeNode[] = [
  {
    id: 'xinghui',
    name: '星辉科技集团',
    children: [
      { id: 'president', name: '总裁办' },
      { id: 'strategy', name: '战略发展部' },
      {
        id: 'rdc',
        name: '研发中心',
        children: [
          { id: 'rd-backend', name: '后端研发组' },
          { id: 'rd-frontend', name: '前端研发组' },
          { id: 'rd-test', name: '测试组' },
          { id: 'rd-algo', name: '算法组' },
          { id: 'rd-ops', name: '运维组' },
          { id: 'rd-sec', name: '安全组' },
        ],
      },
      {
        id: 'product',
        name: '产品中心',
        children: [
          { id: 'pd-group', name: '产品组' },
          { id: 'ds-group', name: '设计组' },
          { id: 'ur-group', name: '用户研究组' },
        ],
      },
      {
        id: 'market',
        name: '市场中心',
        children: [
          { id: 'brand-group', name: '品牌组' },
          { id: 'sales-1', name: '销售一组' },
          { id: 'sales-2', name: '销售二组' },
          { id: 'sales-3', name: '销售三组' },
          { id: 'channel-group', name: '渠道组' },
        ],
      },
      {
        id: 'operation',
        name: '运营中心',
        children: [
          { id: 'user-ops', name: '用户运营组' },
          { id: 'content-ops', name: '内容运营组' },
          { id: 'activity-ops', name: '活动运营组' },
        ],
      },
      {
        id: 'service',
        name: '客服中心',
        children: [
          { id: 'pre-sales', name: '售前客服组' },
          { id: 'after-sales', name: '售后客服组' },
        ],
      },
      {
        id: 'supply',
        name: '供应链中心',
        children: [
          { id: 'purchase', name: '采购组' },
          { id: 'warehouse', name: '仓储物流组' },
          { id: 'vendor', name: '供应商管理组' },
        ],
      },
      {
        id: 'hr',
        name: '人力资源中心',
        children: [
          { id: 'recruit', name: '招聘组' },
          { id: 'comp', name: '薪酬绩效组' },
          { id: 'training', name: '培训发展组' },
        ],
      },
      {
        id: 'finance',
        name: '财务中心',
        children: [
          { id: 'account', name: '会计组' },
          { id: 'cashier', name: '出纳组' },
          { id: 'audit-fin', name: '审计组' },
        ],
      },
      {
        id: 'admin',
        name: '行政中心',
        children: [
          { id: 'reception', name: '前台组' },
          { id: 'logistics', name: '后勤组' },
          { id: 'security', name: '安保组' },
        ],
      },
      {
        id: 'data',
        name: '数据中心',
        children: [
          { id: 'data-platform', name: '数据平台组' },
          { id: 'data-analysis', name: '数据分析组' },
          { id: 'bi-group', name: '商业智能组' },
        ],
      },
      {
        id: 'legal',
        name: '法务中心',
        children: [
          { id: 'compliance', name: '合规组' },
          { id: 'ip-group', name: '知识产权组' },
        ],
      },
      {
        id: 'quality',
        name: '质量中心',
        children: [
          { id: 'qa-group', name: '质量管理组' },
          { id: 'cert-group', name: '测试认证组' },
        ],
      },
      {
        id: 'subcompany',
        name: '星辉智能科技（子公司）',
        children: [
          { id: 'sub-rd', name: '子公司研发部' },
          { id: 'sub-market', name: '子公司市场部' },
          { id: 'sub-admin', name: '子公司行政部' },
        ],
      },
    ],
  },
]

const toTreeData = (nodes: OrgTreeNode[]): TreeSelectProps['treeData'] =>
  nodes.map((n) => ({
    title: n.name,
    value: n.name,
    key: n.id,
    children: n.children ? toTreeData(n.children) : undefined,
  }))
const ORG_TREE_DATA = toTreeData(ORG_TREE)

/* ——— 人员名单（来自人员管理，用于「起草人」选择） ——— */
export const DRAFTERS = [
  '沈志远', '周敏', '陈浩', '刘伟', '赵磊', '孙琳', '吴桐', '林楠', '黄蓉', '徐静',
  '郑凯', '马涛', '方圆', '何雪', '钱进', '冯洁', '许文', '邓超', '韩梅', '曹颖',
  '高锐', '罗静', '邵峰', '贺敏', '白露', '苏晴', '葛亮', '尹航', '夏雨', '范冰',
  '谭松', '贾玲', '薛强', '崔健', '顾伟', '丁磊', '康辉', '魏来', '邵兵', '唐宁',
]
const DRAFTER_OPTIONS = DRAFTERS.map((n) => ({ label: n, value: n }))

export interface DocNode {
  id: string
  title: string
  content: string
  children?: DocNode[]
}

const uid = (p: string) => p + Math.random().toString(36).slice(2, 8)

const CATEGORIES = ['人事制度', '财务制度', '合规制度', '研发制度', '行政制度']

// ——— 真实制度示例：《员工考勤与休假管理办法》 ———
export const buildAttendanceTree = (): DocNode[] => {
  const N = (t: string, c: string): DocNode => ({ id: 'a' + Math.random().toString(36).slice(2, 8), title: t, content: c })
  return [
    {
      id: 'a0',
      title: '一、总则',
      content:
        '第一条 为规范公司员工出勤、加班与休假管理，维护正常工作秩序，保障公司与员工双方合法权益，依据《中华人民共和国劳动法》《中华人民共和国劳动合同法》及公司相关规定，制定本办法。',
      children: [
        N('1.1 目的', '明确考勤与休假的管理目标、适用对象与基本要求，统一劳动纪律口径，确保管理有据可依、公平透明。'),
        N('1.2 适用范围', '本办法适用于与公司签订劳动合同的全体正式员工；试用期员工、劳务派遣人员参照执行。'),
        N('1.3 术语定义', '考勤指对员工上下班、出勤情况进行的记录与核查；休假指员工依法享有的各类带薪假期；全勤指当月无迟到、早退、旷工及事假记录。'),
        N('1.4 管理原则', '坚持合法合规、公平公正、实事求是、奖惩分明，兼顾公司经营需要与员工正当权益。'),
      ],
    },
    {
      id: 'a1',
      title: '二、考勤管理',
      content: '第二章 考勤管理。公司实行考勤登记与核查制度，以电子化考勤系统记录为准，员工应自觉遵守工作时间规定。',
      children: [
        N('2.1 工作时间', '公司实行标准工时制，每日工作 8 小时、每周工作 40 小时；各部门具体上下班时间由负责人确定并向人力资源部备案。'),
        N('2.2 打卡要求', '员工须按规定通过考勤系统打卡，每日上下班各一次；因故漏打卡须在 3 个工作日内提交补卡申请，经直属上级审批后生效。'),
        N('2.3 迟到与早退', '迟到或早退 15 分钟以内视为轻微违纪，按月累计；当月累计达到规定次数的，扣减当月全勤奖并予提醒。'),
        N('2.4 旷工', '未经批准擅自缺勤，或请假未获批准而缺勤的，视为旷工；连续旷工 3 日或年度累计旷工 5 日的，公司可依法解除劳动合同。'),
        N('2.5 加班管理', '加班须提前在系统提交申请并经审批；加班优先安排调休，确须支付加班费的，按国家规定标准执行，并记录备案。'),
      ],
    },
    {
      id: 'a2',
      title: '三、休假管理',
      content: '第三章 休假管理。员工依法享有法定节假日、年休假、病假、事假及婚育等各类假期，休假应履行申请与审批手续。',
      children: [
        N('3.1 法定节假日', '员工依法享受国家规定的全体公民放假的节日，具体放假安排以国务院办公厅年度通知为准。'),
        N('3.2 年休假', '员工连续工作满 1 年享受带薪年休假：满 1 年不满 10 年的 5 天，满 10 年不满 20 年的 10 天，满 20 年的 15 天；年休假原则上当年使用，可按规定跨年结转。'),
        N('3.3 病假', '员工因病休假须提供医疗机构出具的证明；病假工资按当地最低工资标准的 80% 计发（或依地方规定执行），并纳入考勤记录。'),
        N('3.4 事假', '员工因私事请假须提前申请，事假为无薪假；年度事假天数作为绩效考核的参考依据之一。'),
        N('3.5 婚假、产假与陪产假', '员工依法享受婚假、产假、陪产假、丧假等，具体天数按国家及用人单位所在地规定执行。'),
        N('3.6 请假流程', '员工通过系统提交请假申请，注明事由、起止时间并上传必要佐证材料，按审批权限逐级审批后方可生效。'),
      ],
    },
    {
      id: 'a3',
      title: '四、监督、考核与问责',
      content: '第四章 监督、考核与问责。公司建立考勤数据核查、结果应用与违规处理相衔接的机制，保障制度刚性执行。',
      children: [
        N('4.1 监督检查', '人力资源部负责考勤数据的汇总、核查与公示；员工可在规定时限内对异常记录提出异议并申请复核。'),
        N('4.2 考核应用', '考勤与休假执行情况纳入员工绩效考核与评优评先；对全勤员工给予全勤奖励，树立正向导向。'),
        N('4.3 违规处理', '对代打卡、虚报请假等弄虚作假行为，视情节给予通报批评、考核扣分直至依规追责，涉嫌违纪的移交有关机构处理。'),
      ],
    },
    {
      id: 'a4',
      title: '五、附则',
      content: '第五章 附则。本章对本办法的解释、修订与施行作出规定。',
      children: [
        N('5.1 解释与修订', '本办法由人力资源部负责解释；遇国家法律法规或公司政策调整时，应及时组织修订并报原审批机构批准。'),
        N('5.2 施行日期', '本办法自发布之日起施行；此前有关规定与本办法不一致的，以本办法为准。'),
        N('5.3 附件效力', '本办法所附《请假审批权限表》《加班与调休实施细则》为本办法不可分割的组成部分，具有同等效力。'),
      ],
    },
  ]
}

export const buildParsedTree = (name: string): DocNode[] => {
  const N = (t: string, c: string): DocNode => ({ id: uid('n'), title: t, content: c })
  const subject = name || '本制度'
  return [
    {
      id: uid('n'),
      title: '一、总则',
      content: `第一条 为规范公司${subject}相关工作，明确管理职责、工作流程与标准要求，保障业务依法合规、高效有序运行，依据国家有关法律、法规及公司章程，结合本公司实际，制定本制度。`,
      children: [
        N(
          '1.1 目的',
          `明确${subject}的管理目标与适用范围，确立统一管理口径，确保各项工作有章可循、有据可查，提升管理规范化水平。`,
        ),
        N(
          '1.2 适用范围',
          '本制度适用于公司全体在职员工、各职能部门、分支机构，以及与本业务相关的外部协作单位。驻外人员、借调人员及劳务派遣人员参照执行。',
        ),
        N(
          '1.3 术语与定义',
          `本制度所称"${subject}"，是指由公司统一组织开展的专项管理活动；所称"责任部门"，是指由公司指定、对本制度落地负主要管理责任的业务单元；所称"相关方"，是指参与或受本制度约束的内部及外部主体。`,
        ),
        N(
          '1.4 基本原则',
          '坚持依法依规、权责对等、流程透明、闭环管理的原则，确保制度的严肃性、可操作性与全过程可追溯，兼顾效率与风险可控。',
        ),
      ],
    },
    {
      id: uid('n'),
      title: '二、管理职责',
      content:
        '第二章 管理职责。公司建立分层分级的管理责任体系，明确责任部门、协同部门与管理岗位的职责边界，确保事事有人管、人人有专责，避免出现管理空白或职责交叉。',
      children: [
        N(
          '2.1 责任部门',
          '责任部门负责本制度的编制、宣贯、解释与日常监督，组织制定配套实施细则，并定期（每年不少于一次）开展执行评估，形成书面评估报告报分管领导审阅。',
        ),
        N(
          '2.2 协同部门',
          '人力资源部、财务部、信息技术部等相关部门应在各自职责范围内予以配合，建立信息共享与联席会商机制，确保口径统一、衔接顺畅、协同高效。',
        ),
        N(
          '2.3 管理岗位',
          '各部门应指定专（兼）职管理员，负责本部门范围内的具体落实、台账维护、进度跟踪与问题上报；管理员变更须做好工作交接，并报责任部门备案。',
        ),
      ],
    },
    {
      id: uid('n'),
      title: '三、管理流程',
      content:
        '第三章 管理流程。本制度所涉事项均须通过公司统一平台线上办理，实现申请、审核、执行、归档的全流程闭环管理，严禁体外循环与线下操作。',
      children: [
        N(
          '3.1 申请与发起',
          '当事人应如实填写事项信息、依据与佐证材料后提交申请，严禁弄虚作假、隐瞒重要事实。申请材料不齐全的，受理部门应一次性告知补正内容。',
        ),
        N(
          '3.2 审核与审批',
          '按照"部门初审—专业复核—分级审批"的权限逐级办理。各环节应在规定时限内完成并留痕；重大事项须经集体研究决策，任何人不得越权审批或化整为零规避审批。',
        ),
        N(
          '3.3 执行与交付',
          '审批通过后由责任主体组织实施，明确时间节点、交付标准与验收方式，确保执行过程可控、结果可验，并按要求形成过程记录。',
        ),
        N(
          '3.4 变更与终止',
          '遇政策调整、业务变化或客观情况重大变更时，应及时提出变更申请，经原审批路径批准后方可生效；终止执行的应做好档案封存与告知，避免遗留风险。',
        ),
      ],
    },
    {
      id: uid('n'),
      title: '四、监督、考核与问责',
      content:
        '第四章 监督、考核与问责。公司建立监督检查、绩效考核与违规问责相衔接的约束机制，保障制度刚性执行，形成"执行—监督—改进"的良性循环。',
      children: [
        N(
          '4.1 监督检查',
          '责任部门应建立常态化检查机制，采取定期检查、随机抽查与专项审计相结合的方式开展监督，形成书面检查记录并归档备查，对发现的问题建立整改台账。',
        ),
        N(
          '4.2 考核评价',
          '将本制度执行情况纳入部门及个人绩效考核，对执行到位、成效显著者予以表彰激励；对落实不力者下达整改通知并跟踪闭环，必要时进行约谈。',
        ),
        N(
          '4.3 违规问责',
          '对违反本制度的行为，视情节轻重给予提醒谈话、通报批评、考核扣分直至依规追责；涉嫌违纪违法的，移交纪检监察或司法机关处理，不姑息、不包庇。',
        ),
      ],
    },
    {
      id: uid('n'),
      title: '五、附则',
      content: '第五章 附则。本章对本制度的解释、修订与施行作出规定，确保制度持续适应公司发展与管理需要。',
      children: [
        N(
          '5.1 解释与修订',
          '本制度由责任部门负责解释。遇国家法律法规或公司政策调整时，应及时组织修订并报原审批机构批准，修订记录应完整留存。',
        ),
        N('5.2 施行日期', '本制度自发布之日起施行。此前有关规定与本制度不一致的，以本制度为准。'),
        N(
          '5.3 附件效力',
          '本制度所附表单、模板与流程图为本制度不可分割的组成部分，与本制度具有同等效力，各相关方应严格遵照执行。',
        ),
      ],
    },
  ]
}

// ——— 树操作辅助 ———
const insertNode = (list: DocNode[], parentId: string | null, node: DocNode): DocNode[] => {
  if (parentId === null) return [...list, node]
  return list.map((n) => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), node] }
    if (n.children) return { ...n, children: insertNode(n.children, parentId, node) }
    return n
  })
}
const removeNode = (list: DocNode[], id: string): DocNode[] =>
  list
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, id) } : n))
const updateNode = (list: DocNode[], id: string, patch: Partial<DocNode>): DocNode[] =>
  list.map((n) => {
    if (n.id === id) return { ...n, ...patch }
    if (n.children) return { ...n, children: updateNode(n.children, id, patch) }
    return n
  })

export interface DraftResult {
  docNo: string
  name: string
  category: string
  owner: string
  drafter: string
  effectiveDate: string
}

export interface DraftInit {
  info: DraftResult
  tree: DocNode[]
  step: number
  file?: { name: string; type: 'word' | 'pdf' }
  parsed?: boolean
}

interface Props {
  onBack: () => void
  onFinish: (r: DraftResult) => void
  initial?: DraftInit
}

export default function DraftWizard({ onBack, onFinish, initial }: Props) {
  const { message } = AntdApp.useApp()
  const [step, setStep] = useState(initial?.step ?? 1)
  const [form] = Form.useForm()
  const [info, setInfo] = useState<DraftResult | null>(initial?.info ?? null)

  // 步骤2：上传与解析
  const [file, setFile] = useState<{ name: string; type: 'word' | 'pdf' } | null>(initial?.file ?? null)
  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsed, setParsed] = useState(initial?.parsed ?? false)

  // 步骤3/4：文档树
  const [tree, setTree] = useState<DocNode[]>(initial?.tree ?? [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [treeModal, setTreeModal] = useState<{ mode: 'add' | 'rename'; parentId: string | null; nodeId?: string; value: string } | null>(null)

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const beforeUpload: UploadProps['beforeUpload'] = (f) => {
    const isWord = f.name.toLowerCase().endsWith('.doc') || f.name.toLowerCase().endsWith('.docx')
    const isPdf = f.name.toLowerCase().endsWith('.pdf')
    if (!isWord && !isPdf) {
      message.error('仅支持 Word（.doc/.docx）或 PDF 文件')
      return Upload.LIST_IGNORE
    }
    setFile({ name: f.name, type: isWord ? 'word' : 'pdf' })
    setParsed(false)
    setProgress(0)
    setTree([])
    return false
  }

  const startParse = () => {
    if (!file) return
    setParsing(true)
    setProgress(0)
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setParsing(false)
          setParsed(true)
          setTree((prev) => (prev.length ? prev : buildParsedTree(info?.name || '本制度')))
          return 100
        }
        return p + 7
      })
    }, 120)
  }

  const nextFrom1 = async () => {
    try {
      const v = await form.validateFields()
      const eff = v.effectiveDate ? (v.effectiveDate as { format: (s: string) => string }).format('YYYY-MM-DD') : ''
      setInfo({
        docNo: v.docNo,
        name: v.name,
        category: v.category,
        owner: v.owner,
        drafter: v.drafter,
        effectiveDate: eff,
      })
      setStep(2)
    } catch {
      /* 校验失败，停留在步骤1 */
    }
  }

  // ——— 树编辑 ———
  const openAdd = (parentId: string | null) => setTreeModal({ mode: 'add', parentId, value: '' })
  const openRename = (nodeId: string, title: string) =>
    setTreeModal({ mode: 'rename', parentId: null, nodeId, value: title })
  const confirmTreeModal = () => {
    if (!treeModal) return
    const value = treeModal.value.trim() || '新章节'
    if (treeModal.mode === 'add') {
      const node: DocNode = { id: uid('n'), title: value, content: '' }
      setTree((t) => insertNode(t, treeModal.parentId, node))
    } else if (treeModal.mode === 'rename' && treeModal.nodeId) {
      setTree((t) => updateNode(t, treeModal.nodeId!, { title: value }))
    }
    setTreeModal(null)
  }

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ——— 渲染：核验树 ———
  const renderTree = (nodes: DocNode[], depth = 0): React.ReactNode =>
    nodes.map((n) => (
      <div key={n.id}>
        <div className={`dw-tree-node lv${depth}${depth ? ' child' : ''}`} onClick={() => scrollTo(n.id)}>
          <span className="dw-tree-title">{n.title}</span>
          <span className="dw-tree-acts" onClick={(e) => e.stopPropagation()}>
            <Button size="small" type="text" icon={<EditOutlined />} title="重命名" onClick={() => openRename(n.id, n.title)} />
            <Popconfirm title="删除该章节及其子章节？" onConfirm={() => setTree((t) => removeNode(t, n.id))} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} title="删除" />
            </Popconfirm>
          </span>
        </div>
        {n.children && n.children.length > 0 && renderTree(n.children, depth + 1)}
      </div>
    ))

  // ——— 渲染：核验内容（默认只读，点「编辑」可改；末尾可新增） ———
  const renderContent = (nodes: DocNode[], depth = 0): React.ReactNode =>
    nodes.map((n) => {
      const editing = editingId === n.id
      return (
        <div key={n.id} ref={(el) => { sectionRefs.current[n.id] = el }} className={`dw-sec lv${depth}`}>
          <div className="dw-sec-bar">
            {editing ? (
              <Input
                className="dw-sec-title"
                value={n.title}
                onChange={(e) => setTree((t) => updateNode(t, n.id, { title: e.target.value }))}
                placeholder="章节标题"
              />
            ) : (
              <h3 className={`dw-sec-title-ro lv${depth}`}>{n.title}</h3>
            )}
            <Space size={4} className="dw-sec-actions">
              {editing ? (
                <Button size="small" type="primary" onClick={() => setEditingId(null)}>
                  完成
                </Button>
              ) : (
                <Button size="small" icon={<EditOutlined />} onClick={() => setEditingId(n.id)}>
                  编辑
                </Button>
              )}
              <Popconfirm title="删除该章节？" onConfirm={() => setTree((t) => removeNode(t, n.id))} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          </div>
          {editing ? (
            <Input.TextArea
              className="dw-sec-content"
              value={n.content}
              onChange={(e) => setTree((t) => updateNode(t, n.id, { content: e.target.value }))}
              autoSize={{ minRows: 3, maxRows: 12 }}
              placeholder="章节内容"
            />
          ) : (
            <p className="dw-sec-content-ro">{n.content || '（待补充内容）'}</p>
          )}
          {n.children && n.children.length > 0 && renderContent(n.children, depth + 1)}
        </div>
      )
    })

  // ——— 渲染：预览（只读全文） ———
  const renderPreview = (nodes: DocNode[], depth = 0): React.ReactNode =>
    nodes.map((n) => (
      <div key={n.id} className={`dw-psec lv${depth}`}>
        <h3 className="dw-psec-title">{n.title}</h3>
        <p className="dw-psec-content">{n.content || '（待补充内容）'}</p>
        {n.children && renderPreview(n.children, depth + 1)}
      </div>
    ))

  const stepItems = [
    { title: '基础属性' },
    { title: '上传解析' },
    { title: '核验制度' },
    { title: '预览入库' },
  ]

  const finish = () => {
    if (!info) return
    onFinish(info)
  }

  return (
    <div className="dw-wrap">
      <div className="dw-topbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回
        </Button>
        <Steps className="dw-steps" current={step - 1} size="small" items={stepItems} />
      </div>

      <div className="dw-body">
        {/* 步骤1：基础属性 */}
        {step === 1 && (
          <Card className="dw-card" title="填写制度基础属性">
            <Form form={form} layout="vertical" className="dw-form" initialValues={{ category: '人事制度' }}>
              <Form.Item name="name" label="制度名称" rules={[{ required: true, message: '请输入制度名称' }]}>
                <Input placeholder="如：远程办公管理办法" />
              </Form.Item>
              <Form.Item name="docNo" label="制度文号" rules={[{ required: true, message: '请输入制度文号' }]}>
                <Input placeholder="如：沪材〔2026〕012号" />
              </Form.Item>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
              </Form.Item>
              <Form.Item name="owner" label="责任部门" rules={[{ required: true, message: '请选择责任部门' }]}>
                <TreeSelect
                  treeData={ORG_TREE_DATA}
                  treeDefaultExpandAll={false}
                  treeDefaultExpandedKeys={['xinghui']}
                  placeholder="选择责任部门（组织）"
                  allowClear
                  showSearch
                  treeNodeFilterProp="title"
                  popupMatchSelectWidth={false}
                  popupStyle={{ minWidth: 280 }}
                />
              </Form.Item>
              <Form.Item name="drafter" label="起草人" rules={[{ required: true, message: '请选择起草人' }]}>
                <Select showSearch optionFilterProp="label" placeholder="选择起草人" options={DRAFTER_OPTIONS} />
              </Form.Item>
              <Form.Item name="effectiveDate" label="生效日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择生效日期（可选）" />
              </Form.Item>
              <Form.Item name="scope" label="适用范围">
                <Input.TextArea rows={2} placeholder="如：公司全体员工（可选）" />
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* 步骤2：上传与解析 */}
        {step === 2 && (
          <Card className="dw-card" title="上传制度文档">
            <Upload.Dragger
              className="dw-dragger"
              accept=".doc,.docx,.pdf"
              showUploadList={false}
              beforeUpload={beforeUpload}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">仅支持 Word / PDF 格式</p>
            </Upload.Dragger>

            <div className="dw-upload-tips">
              <div className="dw-upload-tips-title">上传要求</div>
              <ol className="dw-upload-tips-list">
                <li>文档须按「章、节、条」层级结构组织：章下设节、节下设条，便于系统自动解析目录。</li>
                <li>仅支持 PDF 或 Word（.doc / .docx）格式，不支持图片、压缩包、Excel 等其他格式。</li>
                <li>单个文件大小不超过 20MB，超出将导致上传或解析失败。</li>
                <li>文档内容须为正式版，文字清晰可识别；扫描件需为高质量，避免倾斜、缺页、水印遮挡。</li>
                <li>建议正文使用标准字体，尽量避免文本框、公式、复杂表格等对象，以提升解析准确率。</li>
              </ol>
            </div>

            {file && (
              <div className="dw-file-list">
                <div className="dw-file-list-title">已上传文件</div>
                <div className="dw-file-card">
                  <span className="dw-file-icon">
                    {file.type === 'pdf' ? <FilePdfOutlined style={{ color: '#e11d48' }} /> : <FileWordOutlined style={{ color: '#2563eb' }} />}
                  </span>
                  <span className="dw-file-name">{file.name}</span>
                  <Popconfirm title="移除该文件？" onConfirm={() => { setFile(null); setParsed(false); setProgress(0); setTree([]) }} okText="移除" cancelText="取消">
                    <Button size="small" type="link" danger>
                      移除
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )}

            {file && (
              <div className="dw-parse-box">
                <Button type="primary" icon={<UploadOutlined />} loading={parsing} onClick={startParse} disabled={parsing || parsed}>
                  {parsed ? '已解析' : '开始解析'}
                </Button>
                {progress > 0 && (
                  <div className="dw-progress-wrap">
                    <Progress percent={progress} status={parsed ? 'success' : 'active'} />
                    <span className="dw-progress-text">
                      {parsing ? '正在解析文档…' : parsed ? '解析完成，可进入下一步核验' : `解析进度 ${progress}%`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* 步骤3：核验制度 */}
        {step === 3 && (
          <div className="dw-verify">
            <div className="dw-tree-pane">
              <div className="dw-tree-head">
                <span>目录结构</span>
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => openAdd(null)}>
                  新增章节
                </Button>
              </div>
              <div className="dw-tree-body">{tree.length ? renderTree(tree) : <Empty description="暂无章节" />}</div>
            </div>
            <div className="dw-content-pane">
              <div className="dw-content-head">完整内容（点击左侧目录可滚动定位；默认展示内容，点「编辑」可修改）</div>
              <div className="dw-content-scroll">{tree.length ? renderContent(tree) : <Empty description="暂无内容" />}</div>
            </div>
          </div>
        )}

        {/* 步骤4：预览 */}
        {step === 4 && (
          <Card className="dw-card" title="制度预览">
            {!tree.length ? (
              <Empty description="暂无内容" />
            ) : (
              <div className="dw-preview">
                <h1 className="dw-preview-title">{info?.name || '制度名称'}</h1>
                <div className="dw-preview-head">
                  <div className="dw-meta-item">
                    <span className="dw-meta-label">文号</span>
                    <span className="dw-meta-value">{info?.docNo || '—'}</span>
                  </div>
                  <div className="dw-meta-item">
                    <span className="dw-meta-label">生效时间</span>
                    <span className="dw-meta-value">{info?.effectiveDate || '—'}</span>
                  </div>
                  <div className="dw-meta-item">
                    <span className="dw-meta-label">责任部门</span>
                    <span className="dw-meta-value">{info?.owner || '—'}</span>
                  </div>
                  <div className="dw-meta-item">
                    <span className="dw-meta-label">起草人</span>
                    <span className="dw-meta-value">{info?.drafter || '—'}</span>
                  </div>
                </div>
                <div className="dw-preview-rule" />
                {renderPreview(tree)}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* 底部导航 */}
      <div className="dw-footer">
        <Space>
          {step === 1 && (
            <Button onClick={onBack}>返回列表</Button>
          )}
          {step > 1 && (
            <Button onClick={() => { setStep((s) => s - 1); setEditingId(null) }}>上一步</Button>
          )}
          {step < 4 && (
            <Button type="primary" disabled={step === 2 && !parsed} onClick={() => (step === 1 ? nextFrom1() : setStep((s) => s + 1))}>
              下一步
            </Button>
          )}
          {step === 4 && (
            <Button type="primary" icon={<CheckOutlined />} onClick={finish}>
              确认入库
            </Button>
          )}
        </Space>
      </div>

      <Modal
        title={treeModal?.mode === 'add' ? (treeModal.parentId ? '新增子章节' : '新增章节') : '重命名章节'}
        open={!!treeModal}
        onOk={confirmTreeModal}
        onCancel={() => setTreeModal(null)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          autoFocus
          value={treeModal?.value}
          onChange={(e) => setTreeModal((m) => (m ? { ...m, value: e.target.value } : m))}
          placeholder="请输入章节标题"
          onPressEnter={confirmTreeModal}
        />
      </Modal>
    </div>
  )
}
