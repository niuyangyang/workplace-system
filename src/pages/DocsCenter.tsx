import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Layout,
  Menu,
  Row,
  Col,
  Card,
  Tabs,
  Table,
  Tag,
  Typography,
  Space,
  App as AntdApp,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Tree,
  Dropdown,
  Empty,
  Popconfirm,
  Tooltip,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  PlayCircleOutlined,
  ThunderboltOutlined,
  StarOutlined,
  CompassOutlined,
  FileAddOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  EditOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  TableOutlined,
  RobotOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  FolderOutlined,
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  CommentOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { createEditor, createToolbar } from '@wangeditor/editor'
import Navbar from '../components/Navbar'
import './docsCenter.css'
import '@wangeditor/editor/dist/css/style.css'

const { Sider, Content } = Layout
const { Title } = Typography

type MenuKey = 'start' | 'ai' | 'fav' | 'kb' | 'explore'

const tabDefs = [
  { key: 'edited', label: '编辑过', icon: <EditOutlined /> },
  { key: 'viewed', label: '浏览过', icon: <EyeOutlined /> },
  { key: 'liked', label: '我点赞的', icon: <LikeOutlined /> },
  { key: 'commented', label: '我评论过', icon: <MessageOutlined /> },
] as const

interface DocItem {
  key: string
  name: string
  kb: string
  time: string
  owner?: string
  size?: string
  type?: '文档' | '表格' | '幻灯片' | '思维导图'
  status?: '已发布' | '评审中' | '草稿' | '归档'
}

// 文档名不带扩展名：知识库即"目录"概念，在线文档无需 .docx/.pdf 后缀
const docData: Record<string, DocItem[]> = {
  edited: [
    { key: '1', name: '2026年Q3产品规划方案', kb: '产品规划库', time: '2026-09-09 14:32' },
    { key: '2', name: '材料学院实验室安全手册', kb: '安全规范库', time: '2026-09-08 10:15' },
    { key: '3', name: '周会纪要-0908', kb: '会议纪要库', time: '2026-09-08 18:40' },
    { key: '4', name: '新员工入职指南', kb: '人事制度库', time: '2026-09-05 09:20' },
    { key: '5', name: '项目预算表2026', kb: '财务共享库', time: '2026-09-03 16:05' },
  ],
  viewed: [
    { key: '1', name: '公司年度战略规划', kb: '战略发展库', time: '2026-09-09 11:00' },
    { key: '2', name: '品牌视觉规范V2', kb: '品牌设计库', time: '2026-09-07 15:22' },
    { key: '3', name: '客户拜访记录表', kb: '销售管理库', time: '2026-09-06 13:48' },
    { key: '4', name: '技术分享：React性能优化', kb: '技术研发库', time: '2026-09-04 20:10' },
  ],
  liked: [
    { key: '1', name: '远程办公管理办法', kb: '人事制度库', time: '2026-09-08 21:30' },
    { key: '2', name: '食堂菜单每周更新', kb: '行政服务库', time: '2026-09-07 12:05' },
  ],
  commented: [
    { key: '1', name: '产品需求评审纪要', kb: '产品规划库', time: '2026-09-09 09:50' },
    { key: '2', name: '团建活动方案征集', kb: '行政服务库', time: '2026-09-06 17:33' },
  ],
}

// 各知识库的文档数据集：用于「知识库 → 进入某库」后的文档表格，内容填充饱满，便于演示 / 截图
const kbDocuments: Record<string, DocItem[]> = {
  产品规划库: [
    { key: 'p1', name: '2026年Q3产品规划方案', kb: '产品规划库', owner: '张明', size: '2.4 MB', type: '文档', status: '已发布', time: '2026-09-09 14:32' },
    { key: 'p2', name: '产品路线图 2026', kb: '产品规划库', owner: '张明', size: '1.1 MB', type: '思维导图', status: '已发布', time: '2026-09-07 11:08' },
    { key: 'p3', name: '竞品分析报告 · Q2', kb: '产品规划库', owner: '李婷', size: '3.6 MB', type: '文档', status: '已发布', time: '2026-08-28 17:20' },
    { key: 'p4', name: '用户调研纪要 · 0420', kb: '产品规划库', owner: '王哲', size: '0.9 MB', type: '文档', status: '已发布', time: '2026-08-22 15:45' },
    { key: 'p5', name: '需求评审纪要 · 0901', kb: '产品规划库', owner: '李婷', size: '0.6 MB', type: '文档', status: '已发布', time: '2026-09-01 19:12' },
    { key: 'p6', name: '产品需求文档（PRD）· 智能审批', kb: '产品规划库', owner: '王哲', size: '1.8 MB', type: '文档', status: '评审中', time: '2026-09-10 10:03' },
    { key: 'p7', name: '版本发布说明 v3.2', kb: '产品规划库', owner: '陈宇', size: '0.4 MB', type: '文档', status: '已发布', time: '2026-08-15 09:30' },
    { key: 'p8', name: '增长策略白皮书', kb: '产品规划库', owner: '张明', size: '5.2 MB', type: '幻灯片', status: '已发布', time: '2026-07-30 16:00' },
    { key: 'p9', name: '商业化路径规划', kb: '产品规划库', owner: '李婷', size: '1.3 MB', type: '文档', status: '草稿', time: '2026-09-11 20:41' },
    { key: 'p10', name: '客户成功案例集', kb: '产品规划库', owner: '陈宇', size: '8.7 MB', type: '幻灯片', status: '已发布', time: '2026-08-05 14:18' },
    { key: 'p11', name: '功能优先级矩阵', kb: '产品规划库', owner: '王哲', size: '0.3 MB', type: '表格', status: '已发布', time: '2026-09-03 11:55' },
    { key: 'p12', name: 'NPS 调研报告 2026', kb: '产品规划库', owner: '李婷', size: '2.0 MB', type: '文档', status: '已发布', time: '2026-06-25 13:27' },
    { key: 'p13', name: '产品周报（WK37）', kb: '产品规划库', owner: '张明', size: '0.5 MB', type: '文档', status: '已发布', time: '2026-09-12 18:02' },
    { key: 'p14', name: 'Roadmap 复盘 · 2026H1', kb: '产品规划库', owner: '张明', size: '1.6 MB', type: '文档', status: '归档', time: '2026-07-04 09:10' },
  ],
  安全规范库: [
    { key: 's1', name: '材料学院实验室安全手册', kb: '安全规范库', owner: '安全办', size: '4.1 MB', type: '文档', status: '已发布', time: '2026-09-08 10:15' },
    { key: 's2', name: '危化品管理实施细则', kb: '安全规范库', owner: '刘建国', size: '1.2 MB', type: '文档', status: '已发布', time: '2026-08-19 14:40' },
    { key: 's3', name: '消防安全应急预案', kb: '安全规范库', owner: '安全办', size: '0.8 MB', type: '文档', status: '已发布', time: '2026-07-12 09:00' },
    { key: 's4', name: '特种设备操作规程', kb: '安全规范库', owner: '刘建国', size: '2.3 MB', type: '文档', status: '评审中', time: '2026-09-05 16:22' },
    { key: 's5', name: '实验废弃物处置规范', kb: '安全规范库', owner: '周敏', size: '1.0 MB', type: '文档', status: '已发布', time: '2026-06-30 11:30' },
    { key: 's6', name: '生物安全二级实验室守则', kb: '安全规范库', owner: '周敏', size: '0.7 MB', type: '文档', status: '已发布', time: '2026-08-02 15:05' },
    { key: 's7', name: '电气安全检查清单', kb: '安全规范库', owner: '刘建国', size: '0.2 MB', type: '表格', status: '已发布', time: '2026-09-01 08:50' },
    { key: 's8', name: '新员工安全准入培训', kb: '安全规范库', owner: '安全办', size: '6.4 MB', type: '幻灯片', status: '已发布', time: '2026-09-06 13:18' },
    { key: 's9', name: '应急处置流程卡', kb: '安全规范库', owner: '安全办', size: '0.5 MB', type: '文档', status: '已发布', time: '2026-08-11 17:40' },
    { key: 's10', name: '安全巡查记录表', kb: '安全规范库', owner: '周敏', size: '0.3 MB', type: '表格', status: '已发布', time: '2026-09-10 09:25' },
    { key: 's11', name: '个人防护用品（PPE）指南', kb: '安全规范库', owner: '刘建国', size: '1.9 MB', type: '文档', status: '已发布', time: '2026-07-22 10:40' },
    { key: 's12', name: '辐射安全管理制度', kb: '安全规范库', owner: '周敏', size: '1.1 MB', type: '文档', status: '草稿', time: '2026-09-11 19:33' },
  ],
  会议纪要库: [
    { key: 'm1', name: '周会纪要 · 0908', kb: '会议纪要库', owner: '秘书处', size: '0.4 MB', type: '文档', status: '已发布', time: '2026-09-08 18:40' },
    { key: 'm2', name: '月度经营分析会 · 0901', kb: '会议纪要库', owner: '秘书处', size: '0.9 MB', type: '文档', status: '已发布', time: '2026-09-01 20:10' },
    { key: 'm3', name: '产品评审会 · 0831', kb: '会议纪要库', owner: '李婷', size: '0.6 MB', type: '文档', status: '已发布', time: '2026-08-31 19:55' },
    { key: 'm4', name: '季度战略复盘 · Q2', kb: '会议纪要库', owner: '秘书处', size: '1.2 MB', type: '文档', status: '已发布', time: '2026-07-05 16:30' },
    { key: 'm5', name: '董事会纪要 · 2026H1', kb: '会议纪要库', owner: '秘书处', size: '1.5 MB', type: '文档', status: '已发布', time: '2026-07-10 11:00' },
    { key: 'm6', name: '跨部门协同会 · 0820', kb: '会议纪要库', owner: '陈宇', size: '0.5 MB', type: '文档', status: '已发布', time: '2026-08-20 17:12' },
    { key: 'm7', name: '技术架构评审 · 0815', kb: '会议纪要库', owner: '王哲', size: '0.7 MB', type: '文档', status: '已发布', time: '2026-08-15 18:25' },
    { key: 'm8', name: '客户沟通纪要 · 阿里', kb: '会议纪要库', owner: '陈宇', size: '0.4 MB', type: '文档', status: '已发布', time: '2026-08-26 15:48' },
    { key: 'm9', name: '项目启动会 · 智慧楼宇', kb: '会议纪要库', owner: '秘书处', size: '0.8 MB', type: '文档', status: '已发布', time: '2026-09-02 14:00' },
    { key: 'm10', name: '安全委员会 · 0905', kb: '会议纪要库', owner: '安全办', size: '0.5 MB', type: '文档', status: '已发布', time: '2026-09-05 19:30' },
    { key: 'm11', name: '财务预算沟通会', kb: '会议纪要库', owner: '秘书处', size: '0.6 MB', type: '文档', status: '评审中', time: '2026-09-09 17:05' },
    { key: 'm12', name: '年度规划务虚会', kb: '会议纪要库', owner: '秘书处', size: '1.0 MB', type: '文档', status: '已发布', time: '2026-06-28 20:15' },
    { key: 'm13', name: '用户访谈纪要 · 设计中心', kb: '会议纪要库', owner: '王哲', size: '0.4 MB', type: '文档', status: '已发布', time: '2026-09-04 16:38' },
    { key: 'm14', name: '复盘会 · 3D 大屏项目', kb: '会议纪要库', owner: '陈宇', size: '0.7 MB', type: '文档', status: '归档', time: '2026-08-30 18:00' },
  ],
  人事制度库: [
    { key: 'h1', name: '新员工入职指南', kb: '人事制度库', owner: 'HR · 林楠', size: '3.2 MB', type: '文档', status: '已发布', time: '2026-09-05 09:20' },
    { key: 'h2', name: '远程办公管理办法', kb: '人事制度库', owner: 'HR · 林楠', size: '0.6 MB', type: '文档', status: '已发布', time: '2026-09-08 21:30' },
    { key: 'h3', name: '绩效考核实施细则', kb: '人事制度库', owner: 'HR · 赵磊', size: '1.4 MB', type: '文档', status: '已发布', time: '2026-08-18 14:55' },
    { key: 'h4', name: '薪酬福利手册 2026', kb: '人事制度库', owner: 'HR · 赵磊', size: '2.6 MB', type: '文档', status: '已发布', time: '2026-07-15 10:10' },
    { key: 'h5', name: '晋升通道与任职资格', kb: '人事制度库', owner: 'HR · 林楠', size: '1.1 MB', type: '文档', status: '评审中', time: '2026-09-10 15:40' },
    { key: 'h6', name: '招聘管理流程', kb: '人事制度库', owner: 'HR · 赵磊', size: '0.9 MB', type: '文档', status: '已发布', time: '2026-06-20 11:25' },
    { key: 'h7', name: '员工培训体系', kb: '人事制度库', owner: 'HR · 林楠', size: '1.7 MB', type: '幻灯片', status: '已发布', time: '2026-08-08 13:50' },
    { key: 'h8', name: '离职交接规范', kb: '人事制度库', owner: 'HR · 赵磊', size: '0.5 MB', type: '文档', status: '已发布', time: '2026-07-28 16:45' },
    { key: 'h9', name: '考勤与休假制度', kb: '人事制度库', owner: 'HR · 赵磊', size: '0.8 MB', type: '文档', status: '已发布', time: '2026-09-01 09:00' },
    { key: 'h10', name: '员工花名册', kb: '人事制度库', owner: 'HR · 林楠', size: '0.3 MB', type: '表格', status: '已发布', time: '2026-09-12 08:30' },
    { key: 'h11', name: '组织发展（OD）规划', kb: '人事制度库', owner: 'HR · 林楠', size: '1.5 MB', type: '文档', status: '草稿', time: '2026-09-11 17:18' },
    { key: 'h12', name: '人才盘点报告 · 2026', kb: '人事制度库', owner: 'HR · 赵磊', size: '2.1 MB', type: '文档', status: '已发布', time: '2026-06-15 14:00' },
  ],
  财务共享库: [
    { key: 'f1', name: '项目预算表 2026', kb: '财务共享库', owner: '财务部 · 孙怡', size: '0.4 MB', type: '表格', status: '已发布', time: '2026-09-03 16:05' },
    { key: 'f2', name: '差旅费报销指南', kb: '财务共享库', owner: '财务部 · 孙怡', size: '0.7 MB', type: '文档', status: '已发布', time: '2026-08-21 10:20' },
    { key: 'f3', name: '费用报销流程 SOP', kb: '财务共享库', owner: '财务部 · 吴桐', size: '0.9 MB', type: '文档', status: '已发布', time: '2026-07-18 14:30' },
    { key: 'f4', name: '财务报表 · 2026H1', kb: '财务共享库', owner: '财务部 · 吴桐', size: '1.3 MB', type: '文档', status: '已发布', time: '2026-07-08 17:00' },
    { key: 'f5', name: '成本核算分析', kb: '财务共享库', owner: '财务部 · 孙怡', size: '1.0 MB', type: '文档', status: '评审中', time: '2026-09-09 11:42' },
    { key: 'f6', name: '现金流预测模型', kb: '财务共享库', owner: '财务部 · 吴桐', size: '0.5 MB', type: '表格', status: '已发布', time: '2026-08-12 15:15' },
    { key: 'f7', name: '税务合规指引', kb: '财务共享库', owner: '财务部 · 孙怡', size: '1.8 MB', type: '文档', status: '已发布', time: '2026-06-26 09:50' },
    { key: 'f8', name: '固定资产台账', kb: '财务共享库', owner: '财务部 · 吴桐', size: '0.6 MB', type: '表格', status: '已发布', time: '2026-09-07 13:20' },
    { key: 'f9', name: '供应商付款排期', kb: '财务共享库', owner: '财务部 · 孙怡', size: '0.3 MB', type: '表格', status: '已发布', time: '2026-09-10 10:48' },
    { key: 'f10', name: '年度审计资料清单', kb: '财务共享库', owner: '财务部 · 吴桐', size: '0.4 MB', type: '文档', status: '草稿', time: '2026-09-11 16:05' },
    { key: 'f11', name: '预算执行分析报告', kb: '财务共享库', owner: '财务部 · 孙怡', size: '1.1 MB', type: '文档', status: '已发布', time: '2026-08-30 18:30' },
    { key: 'f12', name: '共享中心服务目录', kb: '财务共享库', owner: '财务部 · 吴桐', size: '0.8 MB', type: '文档', status: '已发布', time: '2026-07-01 11:10' },
  ],
}

const tabItems = tabDefs.map((t) => ({
  key: t.key,
  label: (
    <span>
      {t.icon} {t.label}
    </span>
  ),
  children: (
    <DocTable rows={docData[t.key]} />
  ),
}))

function DocTable({ rows }: { rows: DocItem[] }) {
  const columns: TableColumnsType<DocItem> = [
    {
      title: '文档名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <FileTextOutlined style={{ color: '#3b5bff' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: '所属知识库',
      dataIndex: 'kb',
      key: 'kb',
      render: (kb: string) => <Tag color="blue">{kb}</Tag>,
    },
    { title: '时间', dataIndex: 'time', key: 'time' },
  ]
  return <Table<DocItem> columns={columns} dataSource={rows} pagination={false} size="middle" />
}

interface KB {
  id: string
  name: string
  desc: string
}

const seedKBs: KB[] = [
  { id: 'kb1', name: '产品规划库', desc: '产品规划、需求与评审相关文档' },
  { id: 'kb2', name: '安全规范库', desc: '实验室与办公安全管理制度' },
  { id: 'kb3', name: '会议纪要库', desc: '各类会议纪要与决议记录' },
  { id: 'kb4', name: '人事制度库', desc: '人事、薪酬与行政制度文档' },
  { id: 'kb5', name: '财务共享库', desc: '预算、报销与财务共享资料' },
]

const otherViews: Record<'ai' | 'fav', { icon: React.ReactNode; title: string; desc: string }> = {
  ai: {
    icon: <ThunderboltOutlined />,
    title: 'AI 写作',
    desc: '基于 AI 的智能写作、润色与续写能力，正在筹备中。',
  },
  fav: {
    icon: <StarOutlined />,
    title: '收藏',
    desc: '你收藏的文档与知识库将在这里集中展示。',
  },
}

function StartView({
  onNewDoc,
  onNewKb,
  onAiWrite,
}: {
  onNewDoc: (t: 'doc' | 'sheet') => void
  onNewKb: () => void
  onAiWrite: () => void
}) {
  const panels = [
    { key: 'doc', icon: <FileAddOutlined />, title: '新建文档', desc: '从空白或模板开始撰写', onClick: () => onNewDoc('doc') },
    { key: 'sheet', icon: <TableOutlined />, title: '新建表格', desc: '创建结构化数据表格', onClick: () => onNewDoc('sheet') },
    { key: 'kb', icon: <DatabaseOutlined />, title: '新建知识库', desc: '创建团队共享知识空间', onClick: onNewKb },
    { key: 'ai', icon: <RobotOutlined />, title: 'AI 帮你写', desc: '智能生成初稿与润色', onClick: onAiWrite },
  ]

  return (
    <>
      <Title level={4} className="docs-page-title">
        开始使用
      </Title>

      {/* 4 个操作面板：图标在标题左侧，统一品牌蓝强调色 */}
      <Row gutter={[16, 16]} className="docs-action-row">
        {panels.map((p) => (
          <Col xs={24} sm={12} md={6} key={p.key}>
            <Card hoverable className="docs-action-card" onClick={p.onClick}>
              <span className="docs-action-icon">{p.icon}</span>
              <span className="docs-action-text">
                <span className="docs-action-title">{p.title}</span>
                <span className="docs-action-desc">{p.desc}</span>
              </span>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 我的文档：标题已移除，仅保留 tab 切换 */}
      <Card className="docs-list-card">
        <Tabs defaultActiveKey="edited" items={tabItems} />
      </Card>
    </>
  )
}

function KbList({ kbs, onOpen }: { kbs: KB[]; onOpen: (id: string) => void }) {
  return (
    <div>
      <Title level={4} className="docs-page-title">
        知识库
      </Title>
      <Row gutter={[20, 20]}>
        {kbs.map((kb) => (
          <Col xs={24} md={8} key={kb.id}>
            <Card hoverable className="kb-card" onClick={() => onOpen(kb.id)}>
              <div className="kb-card-name">{kb.name}</div>
              <div className="kb-card-desc">{kb.desc}</div>
              <div className="kb-card-meta">点击进入 ›</div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

function KbDetail({
  kb,
  onBack,
  onNewDoc,
}: {
  kb: KB
  onBack: () => void
  onNewDoc: () => void
}) {
  const kbDocs = kbDocuments[kb.name] ?? []

  const typeColor: Record<string, string> = {
    文档: 'blue',
    表格: 'green',
    幻灯片: 'orange',
    思维导图: 'purple',
  }
  const statusColor: Record<string, string> = {
    已发布: 'success',
    评审中: 'processing',
    草稿: 'default',
    归档: 'cyan',
  }

  const kbColumns: TableColumnsType<DocItem> = [
    {
      title: '文档名称',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (name: string, r) => (
        <Space>
          <FileTextOutlined style={{ color: '#3b5bff' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
          {r.type === '表格' && <TableOutlined style={{ color: '#14b8a6' }} />}
          {r.type === '幻灯片' && <PlayCircleOutlined style={{ color: '#fa8c16' }} />}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (t: DocItem['type']) => <Tag color={typeColor[t || '文档']}>{t || '文档'}</Tag>,
    },
    { title: '更新人', dataIndex: 'owner', key: 'owner', width: 120 },
    { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: DocItem['status']) => <Tag color={statusColor[s || '已发布']}>{s || '已发布'}</Tag>,
    },
    { title: '更新时间', dataIndex: 'time', key: 'time', width: 160 },
  ]

  return (
    <div>
      <button type="button" className="kb-back" onClick={onBack}>
        <ArrowLeftOutlined /> 返回列表
      </button>
      <div className="kb-detail-head">
        <Title level={4} style={{ margin: 0 }}>
          {kb.name}
        </Title>
        <button type="button" className="kb-new-btn" onClick={onNewDoc}>
          <FileAddOutlined /> 新建文档
        </button>
      </div>
      <div className="kb-detail-desc">{kb.desc}</div>
      <Card className="docs-list-card" style={{ marginTop: 16 }} title={`文档（${kbDocs.length}）`}>
        <Table<DocItem>
          columns={kbColumns}
          dataSource={kbDocs}
          pagination={kbDocs.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
          size="middle"
        />
      </Card>
    </div>
  )
}

function OtherView({ menuKey }: { menuKey: 'ai' | 'fav' }) {
  const cfg = otherViews[menuKey]
  return (
    <div className="docs-empty">
      <div className="docs-empty-icon">{cfg.icon}</div>
      <div className="docs-empty-title">{cfg.title}</div>
      <div className="docs-empty-desc">{cfg.desc}</div>
    </div>
  )
}

// ——— 知识库目录树（文件夹/文档/表格）———
type NodeType = 'folder' | 'doc' | 'sheet'

interface KbNode {
  key: string
  name: string
  type: NodeType
  children?: KbNode[]
  content?: string // 文档正文
  data?: string[][] // 表格数据（含表头）
}

const seedKbTrees: Record<string, KbNode[]> = {
  kb1: [
    {
      key: 'kb1-f1',
      name: '产品规划',
      type: 'folder',
      children: [
        {
          key: 'kb1-d1',
          name: '2026年Q3产品规划方案',
          type: 'doc',
          content:
            '<h2>一、季度目标</h2><p>本季度聚焦核心产品体验优化与增长：NPS 提升 5 个点至 43，次周留存提升至 42%，大客户签约 8 家，新增付费企业 120 家。</p><h2>二、关键里程碑</h2><ul><li>9月：完成改版方案评审与视觉验收</li><li>10月：灰度上线新首页与统一工作台</li><li>11月：全量发布 v3.2 并组织客户宣讲</li><li>12月：季度复盘与 Q4 规划</li></ul><h2>三、资源与分工</h2><p>产品侧 3 人、研发侧 8 人、设计 2 人；预算 40 万（含灰度运维与性能专项）。</p><h2>四、风险与应对</h2><p>灰度期间监控核心链路 P95 耗时，超阈值自动回滚；预留 2 周缓冲应对数据迁移。建立每日站会与周度回顾机制保证交付节奏。</p>',
        },
        {
          key: 'kb1-s1',
          name: '需求池',
          type: 'sheet',
          data: [
            ['需求名称', '优先级', '负责人', '状态', '预计版本', '备注'],
            ['登录改版（手机号+验证码）', '高', '张明', '进行中', 'v3.2', '与安全侧联调风控'],
            ['全文搜索优化', '中', '李婷', '待启动', 'v3.3', '引入 ES 分词'],
            ['知识库权限细化', '高', '王哲', '评审中', 'v3.2', '支持按部门授权'],
            ['消息中心聚合', '中', '陈宇', '进行中', 'v3.3', '统一站内信与提醒'],
            ['审批流程可视化', '低', '李婷', '规划中', 'v4.0', '依赖流程引擎升级'],
            ['移动端适配', '高', '王哲', '进行中', 'v3.2', '首期覆盖审批与待办'],
            ['数据大屏导出', '低', '陈宇', '规划中', 'v4.0', 'PDF/PNG 两种格式'],
            ['国际化（en-US）', '低', '张明', '规划中', 'v4.0', '先覆盖导航与设置'],
          ],
        },
        {
          key: 'kb1-d3',
          name: '产品路线图 2026',
          type: 'doc',
          content:
            '<h2>H1：体验夯实</h2><ul><li>完成信息架构与视觉语言统一</li><li>上线统一待办与消息中心</li><li>门户首页改版与性能专项</li></ul><h2>H2：效率提升</h2><ul><li>智能审批（规则引擎 + AI 辅助填单）</li><li>知识库全文检索与权限细化</li><li>移动端覆盖审批与待办</li></ul><h2>H3：生态开放</h2><ul><li>开放 API 与 Webhook</li><li>第三方系统接入市场</li><li>低代码表单搭建能力</li></ul><h2>长期主题</h2><p>以「制度 + 文档 + 数据」一体化场景构建护城河，逐步从工具型产品演进为平台型产品。</p>',
        },
        {
          key: 'kb1-d4',
          name: '竞品分析报告 · Q2',
          type: 'doc',
          content:
            '<h2>一、市场格局</h2><p>头部 3 家占据 55% 份额，均在向「平台 + 生态」演进；腰部厂商以行业定制化切细分市场。</p><h2>二、核心对比</h2><ul><li>A 产品：流程引擎强，知识库弱，价格偏高</li><li>B 产品：协作体验好，权限粒度粗，移动端弱</li><li>C 产品：价格激进，服务响应慢，定制能力有限</li></ul><h2>三、机会点</h2><p>差异化打「制度 + 文档 + 数据」一体化场景，补齐移动端短板，强化按部门授权的细粒度权限。</p><h2>四、威胁与应对</h2><p>头部厂商加速生态捆绑，我方应深耕中大型客户私有化部署与本地化服务优势。</p>',
        },
      ],
    },
    {
      key: 'kb1-f2',
      name: '需求评审',
      type: 'folder',
      children: [
        {
          key: 'kb1-d2',
          name: '产品需求评审纪要',
          type: 'doc',
          content:
            '<h2>会议信息</h2><p>时间：2026-09-01 14:00-15:30；地点：3 号会议室；参会：产品、研发、设计、测试共 9 人。</p><h2>评审结论</h2><ul><li>取消二级导航，改用全局搜索 + 收藏</li><li>首页看板优先排期，进入 v3.2</li><li>消息聚合方案需补充性能评估</li></ul><h2>行动项</h2><ul><li>张明：更新 PRD 至评审通过版（周三前）</li><li>王哲：输出技术方案初稿（周五前）</li><li>测试：补充回归用例清单（下周一起）</li></ul>',
        },
        {
          key: 'kb1-d5',
          name: '产品需求文档（PRD）· 智能审批',
          type: 'doc',
          content:
            '<h2>1. 背景与目标</h2><p>当前审批平均耗时 2.3 天，目标降至 0.5 天内；规则自动审批覆盖率达到 60%。</p><h2>2. 功能范围</h2><ul><li>单据智能预填（OCR + 历史相似单据）</li><li>规则引擎自动审批（金额小于 5000 且类目白名单）</li><li>异常单据进入人工复核队列</li></ul><h2>3. 非功能要求</h2><p>规则命中率不小于 65%；误判率小于 0.5%；全链路审计日志保留 3 年。</p><h2>4. 验收标准</h2><ul><li>预填准确率灰度期达 80%</li><li>自动审批平均处理时长小于 5 分钟</li></ul>',
        },
        {
          key: 'kb1-s2',
          name: '功能优先级矩阵',
          type: 'sheet',
          data: [
            ['功能', '价值分', '成本分', 'RICE 得分', '排期建议'],
            ['智能预填', '9', '5', '162', 'v3.2 首批'],
            ['自动审批规则', '8', '6', '128', 'v3.2 首批'],
            ['复核工作台', '7', '4', '96', 'v3.2 次批'],
            ['审批报表', '6', '3', '60', 'v3.3'],
            ['移动端审批', '8', '5', '110', 'v3.3'],
            ['开放 API', '7', '7', '52', 'v4.0'],
          ],
        },
      ],
    },
    {
      key: 'kb1-f3',
      name: '用户研究',
      type: 'folder',
      children: [
        {
          key: 'kb1-d6',
          name: '用户调研纪要 · 0420',
          type: 'doc',
          content:
            '<h2>样本与方式</h2><p>12 名一线行政 + 5 名部门接口人，深度访谈 60 分钟/人，辅以 3 天影子观察。</p><h2>高频痛点</h2><ul><li>找文档靠问人（11/12 提及）</li><li>审批状态不透明（9/12）</li><li>移动端无法处理待办（8/12）</li></ul><h2>结论</h2><p>信息架构重组与移动待办优先级提升；建议引入全文检索与审批进度可视化。</p>',
        },
        {
          key: 'kb1-d7',
          name: 'NPS 调研报告 2026',
          type: 'doc',
          content:
            '<h2>总体结果</h2><p>本期 NPS 38（上期 33），连续两个季度提升。</p><h2>分群画像</h2><ul><li>推荐者：管理层与重度文档用户，看重一体化与权限</li><li>贬损者：搜索不准（41%）、加载慢（27%）</li></ul><h2>改进项</h2><p>已同步需求池：全文检索优化、首屏性能专项、移动端待办提醒。</p>',
        },
        {
          key: 'kb1-d8',
          name: '客户访谈记录 · 设计中心',
          type: 'doc',
          content:
            '<h2>访谈对象</h2><p>设计中心负责人 王老师；时长 45 分钟。</p><h2>关键反馈</h2><ul><li>资料分散在网盘和群里，入职新人要两周才能找齐</li><li>希望知识库能直接预览 PSD 缩略图</li><li>模板类内容希望支持一键复制到项目空间</li></ul><h2>机会</h2><p>素材型知识库场景值得单独设计，可作为差异化亮点。</p>',
        },
      ],
    },
    {
      key: 'kb1-f4',
      name: '版本发布',
      type: 'folder',
      children: [
        {
          key: 'kb1-d9',
          name: '版本发布说明 v3.2',
          type: 'doc',
          content:
            '<h2>发布时间</h2><p>2026-08-15 20:00 灰度，08-18 全量。</p><h2>新功能</h2><ul><li>统一待办中心</li><li>知识库按部门授权</li><li>移动端审批与待办</li></ul><h2>优化</h2><ul><li>首屏加载降低 38%</li><li>列表虚拟滚动</li></ul><h2>修复</h2><ul><li>修复附件预览偶发空白</li><li>修复导出乱码问题</li></ul>',
        },
        {
          key: 'kb1-s3',
          name: '发布检查清单',
          type: 'sheet',
          data: [
            ['检查项', '负责人', '状态', '完成时间'],
            ['回归测试通过', '测试组', '已完成', '08-14 16:00'],
            ['数据库变更备份', '运维', '已完成', '08-14 18:00'],
            ['灰度方案确认', '张明', '已完成', '08-14 19:00'],
            ['回滚预案演练', '运维', '已完成', '08-14 19:30'],
            ['公告与帮助中心更新', '李婷', '已完成', '08-15 10:00'],
          ],
        },
      ],
    },
  ],
  kb2: [
    {
      key: 'kb2-f1',
      name: '实验室安全',
      type: 'folder',
      children: [
        {
          key: 'kb2-d1',
          name: '材料学院实验室安全手册',
          type: 'doc',
          content:
            '<h2>第一章 总则</h2><p>本手册适用于材料学院所有实验室人员与学生，进入实验室即视为已知悉并遵守。</p><h2>第二章 个人防护</h2><ul><li>进入实验室须穿戴防护服与护目镜</li><li>涉及粉尘作业须佩戴 N95 及以上口罩</li><li>长发须束起，禁止穿戴宽松饰品</li></ul><h2>第三章 危化品管理</h2><ul><li>危化品须双人双锁管理</li><li>领用登记精确到克，台账每周核对</li></ul><h2>第四章 应急处置</h2><p>发生泄漏立即撤离并上报值班电话 5119，由专业人员进行处置。</p>',
        },
        {
          key: 'kb2-d2',
          name: '危化品管理实施细则',
          type: 'doc',
          content:
            '<h2>1. 分类存放</h2><p>氧化剂与还原剂分柜，酸碱分区，易燃品存于防爆柜。</p><h2>2. 台账管理</h2><p>出入库双人签字，月度盘点，账物相符率要求 100%。</p><h2>3. 废弃物</h2><p>分类暂存不超过 30 天，委托有资质单位转运并留存联单。</p><h2>4. 培训要求</h2><p>新进人员须完成 8 学时培训并考核合格后方可独立操作。</p>',
        },
        {
          key: 'kb2-d3',
          name: '特种设备操作规程',
          type: 'doc',
          content:
            '<h2>适用范围</h2><p>高压反应釜、管式炉、离心机等需持证操作的设备。</p><h2>通用要求</h2><ul><li>持证上岗，一机一档</li><li>开机前检查接地与联锁装置</li><li>运行中不得离人</li></ul><h2>高压反应釜附加</h2><p>升压速率不大于 0.1 MPa/min，超压自动泄放；停机后待压力归零方可开盖。</p>',
        },
        {
          key: 'kb2-d4',
          name: '实验废弃物处置规范',
          type: 'doc',
          content:
            '<h2>分类</h2><p>有机废液 / 无机废液 / 固废 / 锐器，严禁混装。</p><h2>要求</h2><ul><li>标签完整（成分、日期、责任人）</li><li>相容性核对后方可混装</li><li>暂存点每周巡查并记录</li><li>转运联单保存 3 年</li></ul>',
        },
      ],
    },
    {
      key: 'kb2-f2',
      name: '办公安全',
      type: 'folder',
      children: [
        {
          key: 'kb2-s1',
          name: '消防检查表',
          type: 'sheet',
          data: [
            ['区域', '检查项', '结果', '检查人', '检查日期', '整改期限'],
            ['A栋 1-3层', '灭火器压力', '合格', '王五', '2026-09-01', '—'],
            ['A栋 4-6层', '疏散通道', '合格', '赵六', '2026-09-01', '—'],
            ['B栋 1-2层', '应急照明', '不合格', '王五', '2026-09-02', '2026-09-09'],
            ['B栋 3-5层', '烟感报警', '合格', '钱七', '2026-09-02', '—'],
            ['C栋 地下车库', '消防栓水压', '合格', '赵六', '2026-09-03', '—'],
            ['C栋 机房', '气体灭火', '合格', '钱七', '2026-09-03', '—'],
          ],
        },
        {
          key: 'kb2-d5',
          name: '消防安全应急预案',
          type: 'doc',
          content:
            '<h2>一、组织架构</h2><p>总指挥：安全办负责人；下设疏散组、灭火组、救护组、通讯组，各设组长与替补。</p><h2>二、处置流程</h2><ul><li>确认火情 → 报警（5119）</li><li>初期扑救 → 组织疏散 → 清点人数</li></ul><h2>三、疏散要求</h2><p>就近楼梯撤离，禁用电梯；每层疏散引导员 2 名，负责引导与劝阻。</p>',
        },
        {
          key: 'kb2-s4',
          name: '电气安全检查清单',
          type: 'sheet',
          data: [
            ['楼层', '检查项', '标准', '结果', '备注'],
            ['A栋', '配电箱温度', '≤ 60℃', '正常', '—'],
            ['A栋', '线缆绝缘', '≥ 0.5MΩ', '正常', '—'],
            ['B栋', '接地电阻', '≤ 4Ω', '正常', '—'],
            ['B栋', '漏保动作', '≤ 0.1s', '正常', '季度测试'],
            ['C栋', 'UPS 切换', '≤ 10ms', '正常', '—'],
          ],
        },
      ],
    },
    {
      key: 'kb2-f3',
      name: '培训与准入',
      type: 'folder',
      children: [
        {
          key: 'kb2-d6',
          name: '新员工安全准入培训',
          type: 'doc',
          content:
            '<h2>课程安排（共 8 学时）</h2><ul><li>第1-2学时：安全意识与制度</li><li>第3-4学时：个人防护实操</li><li>第5-6学时：危化品认知</li><li>第7-8学时：应急演练</li></ul><h2>考核</h2><p>笔试 80 分合格，实操全项通过；未通过者补训后重考，方可发放门禁权限。</p>',
        },
        {
          key: 'kb2-s2',
          name: '安全巡查记录表',
          type: 'sheet',
          data: [
            ['日期', '区域', '巡查人', '发现问题', '状态'],
            ['09-01', '实验室 302', '刘建国', '通风柜风速偏低', '已整改'],
            ['09-02', '实验室 305', '周敏', '无', '—'],
            ['09-03', '库房', '刘建国', '灭火器过期 1 具', '已整改'],
            ['09-04', '走廊', '周敏', '杂物占用通道', '整改中'],
            ['09-05', '实验室 401', '刘建国', '无', '—'],
            ['09-06', '实验室 406', '周敏', '标识脱落', '已整改'],
            ['09-07', '库房', '刘建国', '无', '—'],
          ],
        },
      ],
    },
  ],
  kb3: [
    {
      key: 'kb3-f1',
      name: '例会纪要',
      type: 'folder',
      children: [
        {
          key: 'kb3-d1',
          name: '周会纪要-0908',
          type: 'doc',
          content:
            '<h2>一、进度同步</h2><ul><li>门户改版：视觉验收完成，待切流</li><li>大屏项目：地图联调通过</li><li>审批引擎：规则配置开发中（60%）</li></ul><h2>二、风险点</h2><p>联调环境不稳定，运维已介入扩容；灰度回滚预案待补充演练。</p><h2>三、决议</h2><ul><li>门户周四凌晨切流 10% 灰度</li><li>大屏下周二组织验收会</li></ul>',
        },
        {
          key: 'kb3-d2',
          name: '月度经营分析会 · 0901',
          type: 'doc',
          content:
            '<h2>一、经营数据</h2><p>签约 8 单，回款率 92%，人效环比提升 6%。</p><h2>二、问题</h2><p>交付周期偏长（中位数 21 天），客户满意度受牵连。</p><h2>三、决议</h2><ul><li>交付流程裁撤 2 个串行环节</li><li>财务部提供项目级毛利周报</li><li>下月目标：交付周期不大于 15 天</li></ul>',
        },
        {
          key: 'kb3-d3',
          name: '产品评审会 · 0831',
          type: 'doc',
          content:
            '<h2>评审对象</h2><p>智能审批 PRD v1.2</p><h2>结论</h2><p>原则通过，附条件：</p><ul><li>补充规则误判的兜底方案</li><li>审计日志保留期明确为 3 年</li><li>移动端审批排入 v3.3</li></ul><h2>下次评审</h2><p>09-15 复审技术方案。</p>',
        },
        {
          key: 'kb3-d4',
          name: '技术架构评审 · 0815',
          type: 'doc',
          content:
            '<h2>议题</h2><p>知识库全文检索方案（ES vs Meilisearch）</p><h2>结论</h2><ul><li>选型 ES，运维有经验且生态成熟</li><li>分词采用 IK，同义词典由产品维护</li><li>索引延迟要求小于 5 秒</li></ul><h2>行动项</h2><p>王哲出容量估算，运维确认集群资源。</p>',
        },
      ],
    },
    {
      key: 'kb3-f2',
      name: '专项会议',
      type: 'folder',
      children: [
        {
          key: 'kb3-d5',
          name: '项目启动会 · 智慧楼宇',
          type: 'doc',
          content:
            '<h2>目标</h2><p>楼宇 3D 可视化 + 工位管理，10 月底交付一期。</p><h2>范围</h2><p>3 栋楼、房间状态、工位分配、员工检索。</p><h2>分工</h2><ul><li>前端：Three.js 场景与交互（陈宇）</li><li>数据：楼宇/工位数据清洗（王哲）</li><li>后端：接口与权限（研发组）</li></ul><h2>里程碑</h2><p>09-15 数据就绪，09-30 场景联调，10-25 验收。</p>',
        },
        {
          key: 'kb3-d6',
          name: '客户沟通纪要 · 阿里',
          type: 'doc',
          content:
            '<h2>时间对方</h2><p>2026-08-26；对方采购与行政 6 人。</p><h2>诉求</h2><ul><li>会议 rooms 与工位联动</li><li>数据大屏自定义主题色</li><li>SSO 对接（OAuth2）</li></ul><h2>共识</h2><p>9 月出 POC，10 月商务谈判；技术方案由我方 5 个工作日内回复。</p>',
        },
        {
          key: 'kb3-d7',
          name: '安全委员会 · 0905',
          type: 'doc',
          content:
            '<h2>一、上月安全回顾</h2><p>火情 0 起、危化品泄漏 0 起、工伤 1 起（轻）。</p><h2>二、议题</h2><ul><li>B 栋应急照明整改跟踪（9-09 截止）</li><li>国庆前全楼消防演练安排</li><li>实验室准入系统上线排期</li></ul><h2>决议</h2><p>演练定于 09-25 上午 10:00，全员参加。</p>',
        },
      ],
    },
    {
      key: 'kb3-f3',
      name: '决议跟踪',
      type: 'folder',
      children: [
        {
          key: 'kb3-s1',
          name: '决议执行跟踪表',
          type: 'sheet',
          data: [
            ['决议编号', '事项', '责任人', '截止日期', '状态', '进展说明'],
            ['R-2026-031', '门户灰度切流 10%', '张明', '09-12', '进行中', '预案已评审'],
            ['R-2026-032', '大屏验收会', '陈宇', '09-17', '待启动', '会议邀请已发'],
            ['R-2026-033', '交付流程裁剪', '李婷', '09-20', '进行中', '新流程图初稿完成'],
            ['R-2026-034', '项目毛利周报', '孙怡', '09-15', '进行中', '模板确认中'],
            ['R-2026-035', 'B栋应急照明整改', '刘建国', '09-09', '已完成', '验收合格'],
            ['R-2026-036', '消防演练', '安全办', '09-25', '待启动', '脚本编制中'],
            ['R-2026-037', 'POC 环境搭建', '王哲', '09-18', '进行中', '资源申请已批'],
          ],
        },
      ],
    },
  ],
  kb4: [
    {
      key: 'kb4-f1',
      name: '人事制度',
      type: 'folder',
      children: [
        {
          key: 'kb4-d1',
          name: '新员工入职指南',
          type: 'doc',
          content:
            '<h2>欢迎加入</h2><p>本指南帮助你顺利度过入职前 30 天。</p><h2>第一天</h2><p>领取工牌、配置电脑、加入团队群、签署保密协议。</p><h2>第一周</h2><p>完成安全准入培训、阅读制度手册、与导师对齐 30 天目标。</p><h2>第一个月</h2><p>通过试用期中期沟通，完成首个独立任务；常用入口：门户 → 待办 / 手册，问题咨询 HR 服务台（内线 8100）。</p>',
        },
        {
          key: 'kb4-d2',
          name: '考勤与休假制度',
          type: 'doc',
          content:
            '<h2>一、工作时间</h2><p>9:00-18:00，午休 1 小时；弹性上下班正负 30 分钟。</p><h2>二、休假类型</h2><p>年假（入职满 1 年 5 天起）、病假、事假、婚产假按国家规定执行。</p><h2>三、审批流程</h2><p>事假 1 天内组长审批，3 天内部门经理，以上需 HRBP 会签。</p><h2>四、异常处理</h2><p>漏打卡当月可补 2 次，超出按事假计；连续旷工 3 天按严重违纪处理。</p>',
        },
        {
          key: 'kb4-d3',
          name: '远程办公管理办法',
          type: 'doc',
          content:
            '<h2>适用对象</h2><p>满试用期且近半年绩效 B 及以上员工。</p><h2>频次</h2><p>每周不大于 2 天，需提前 1 天在系统申请。</p><h2>要求</h2><ul><li>核心协作时段（10:00-12:00 / 14:00-17:00）在线</li><li>日会必须视频参加</li><li>涉密文档禁止在个人设备处理</li></ul>',
        },
        {
          key: 'kb4-d4',
          name: '离职交接规范',
          type: 'doc',
          content:
            '<h2>流程</h2><p>提出申请 → 直属沟通 → 交接清单 → 权限回收 → 离职面谈 → 证明开具。</p><h2>交接清单</h2><p>须包含在办事项、账号权限、文档归档、客户对接人。</p><h2>时限</h2><p>普通岗位 30 天，管理岗位 45 天；系统权限在最后工作日 18:00 统一回收。</p>',
        },
      ],
    },
    {
      key: 'kb4-f2',
      name: '薪酬绩效',
      type: 'folder',
      children: [
        {
          key: 'kb4-s1',
          name: '绩效考核表',
          type: 'sheet',
          data: [
            ['姓名', '季度', '评分', '等级', '校准结果', '备注'],
            ['张明', 'Q2', '92', 'A', '通过', '超额完成 OKR'],
            ['李婷', 'Q2', '85', 'B+', '通过', '—'],
            ['王哲', 'Q2', '88', 'A-', '通过', '技术攻关加分'],
            ['陈宇', 'Q2', '79', 'B', '通过', '—'],
            ['孙怡', 'Q2', '90', 'A', '通过', '流程优化贡献'],
            ['周敏', 'Q2', '74', 'B-', '复评', '需补充佐证'],
          ],
        },
        {
          key: 'kb4-d5',
          name: '薪酬福利手册 2026',
          type: 'doc',
          content:
            '<h2>一、薪酬结构</h2><p>基本工资 + 绩效奖金 + 项目奖金；每年 4 月与 10 月两次调薪窗口。</p><h2>二、福利</h2><ul><li>补充医疗、年度体检</li><li>交通补贴、节日福利</li><li>司龄假（每满 2 年加 1 天）</li></ul><h2>三、发放</h2><p>每月 10 日发上月薪资，遇节假日提前至最近工作日。</p>',
        },
        {
          key: 'kb4-d6',
          name: '晋升通道与任职资格',
          type: 'doc',
          content:
            '<h2>双通道</h2><p>管理线（M1-M6）与专业线（P1-P8），同级待遇拉通。</p><h2>晋升窗口</h2><p>每年 2 次（3 月 / 9 月）。</p><h2>基本条件</h2><p>现级任职满 1 年、近两次绩效不小于 B+、无在途处分。</p><h2>答辩</h2><p>述职 PPT + 业绩佐证包，评审会 5 人制，结果公示 3 个工作日。</p>',
        },
      ],
    },
    {
      key: 'kb4-f3',
      name: '人才发展',
      type: 'folder',
      children: [
        {
          key: 'kb4-d7',
          name: '员工培训体系',
          type: 'doc',
          content:
            '<h2>新人营</h2><p>入职 2 周脱产，覆盖文化 / 制度 / 工具。</p><h2>专业营</h2><p>按职能分方向，每季度 1 期，讲师内聘为主。</p><h2>领导力</h2><p>面向 M2 及以上，年度 2 期外部工作坊。</p><h2>学分制</h2><p>每人每年不小于 24 学分，与晋升资格挂钩。</p>',
        },
        {
          key: 'kb4-d8',
          name: '人才盘点报告 · 2026',
          type: 'doc',
          content:
            '<h2>盘点范围</h2><p>全员 58 人。</p><h2>九宫格分布</h2><p>明星 9 人、中坚 32 人、待发展 17 人。</p><h2>关键发现</h2><ul><li>前端与数据方向存在断层风险</li><li>3 名高潜员工缺晋升准备度评估</li></ul><h2>行动</h2><p>Q4 启动导师制与继任者计划，重点关注高潜保留。</p>',
        },
        {
          key: 'kb4-s3',
          name: '员工花名册',
          type: 'sheet',
          data: [
            ['工号', '姓名', '部门', '岗位', '入职日期', '状态'],
            ['E001', '张明', '产品部', '产品经理', '2023-03-01', '在职'],
            ['E014', '李婷', '产品部', '产品运营', '2024-06-17', '在职'],
            ['E022', '王哲', '研发部', '前端工程师', '2023-11-06', '在职'],
            ['E030', '陈宇', '研发部', '前端工程师', '2025-02-10', '在职'],
            ['E041', '孙怡', '财务部', '财务主管', '2022-09-01', '在职'],
            ['E047', '周敏', '安全办', '安全专员', '2024-03-18', '在职'],
          ],
        },
      ],
    },
  ],
  kb5: [
    {
      key: 'kb5-f1',
      name: '财务共享',
      type: 'folder',
      children: [
        {
          key: 'kb5-s1',
          name: '项目预算表2026',
          type: 'sheet',
          data: [
            ['项目', '预算(万)', '已用(万)', '结余(万)', '执行率', '负责人'],
            ['智慧楼宇一期', '120', '80', '40', '67%', '陈宇'],
            ['门户改版', '60', '45', '15', '75%', '张明'],
            ['数据大屏', '45', '38', '7', '84%', '王哲'],
            ['移动端专项', '90', '30', '60', '33%', '李婷'],
            ['智能审批', '75', '22', '53', '29%', '王哲'],
            ['基础设施扩容', '50', '41', '9', '82%', '运维组'],
          ],
        },
        {
          key: 'kb5-d1',
          name: '报销流程说明',
          type: 'doc',
          content:
            '<h2>基本规则</h2><p>报销需在月底前提单，附发票与审批截图。</p><h2>流程</h2><p>提单 → 组长审批 → 财务复核 → 出纳付款（每周二 / 五）。</p><h2>注意事项</h2><ul><li>单张发票超 5000 元需部门经理加签</li><li>差旅需事前申请单关联</li><li>电子发票需验真截图</li></ul>',
        },
        {
          key: 'kb5-d2',
          name: '差旅费报销指南',
          type: 'doc',
          content:
            '<h2>住宿标准</h2><p>一线城市 600 元/晚，其他 450 元/晚，超标自负。</p><h2>交通</h2><p>高铁二等座 / 经济舱，市内实报实销（上限 100 元/天）。</p><h2>补贴</h2><p>餐补 100 元/天，跨市当天往返 50 元/天。</p><h2>单据要求</h2><p>行程单、发票、审批单三件齐全，缺失退回。</p>',
        },
      ],
    },
    {
      key: 'kb5-f2',
      name: '报表与分析',
      type: 'folder',
      children: [
        {
          key: 'kb5-d3',
          name: '财务报表 · 2026H1',
          type: 'doc',
          content:
            '<h2>一、收入</h2><p>上半年营收 3,860 万，同比提升 18%；软件授权占比 62%。</p><h2>二、成本</h2><p>毛利率 68%（提升 2pct），研发投入 1,120 万。</p><h2>三、现金流</h2><p>经营性现金流 +420 万，应收周转天数 68 天（目标 60 天）。</p><h2>四、展望</h2><p>下半年重点提升回款效率与高毛利产品占比。</p>',
        },
        {
          key: 'kb5-d4',
          name: '成本核算分析',
          type: 'doc',
          content:
            '<h2>现状</h2><p>交付类项目成本超支集中在人力外购（占超支 71%）。</p><h2>建议</h2><ul><li>外购单价分层管控</li><li>项目启动时锁定资源池</li><li>毛利低于 35% 的项目需 VP 特批</li></ul><h2>跟踪</h2><p>建立项目级毛利周报，偏差超 5% 触发预警。</p>',
        },
        {
          key: 'kb5-s2',
          name: '现金流预测模型',
          type: 'sheet',
          data: [
            ['月份', '经营流入(万)', '经营流出(万)', '净现金流(万)', '期末余额(万)'],
            ['2026-07', '620', '545', '75', '1,580'],
            ['2026-08', '580', '520', '60', '1,640'],
            ['2026-09', '710', '560', '150', '1,790'],
            ['2026-10', '640', '590', '50', '1,840'],
            ['2026-11', '660', '600', '60', '1,900'],
            ['2026-12', '820', '650', '170', '2,070'],
          ],
        },
      ],
    },
    {
      key: 'kb5-f3',
      name: '台账与清单',
      type: 'folder',
      children: [
        {
          key: 'kb5-s3',
          name: '固定资产台账',
          type: 'sheet',
          data: [
            ['资产编号', '名称', '购置日期', '原值(元)', '使用部门', '状态'],
            ['FA-0121', '图形工作站', '2024-05-12', '28,500', '研发部', '在用'],
            ['FA-0134', '3D 扫描仪', '2024-11-08', '52,000', '产品部', '在用'],
            ['FA-0157', '会议一体机 86寸', '2025-03-22', '23,800', '行政部', '在用'],
            ['FA-0163', '服务器 R750', '2025-06-30', '96,000', '运维组', '在用'],
            ['FA-0178', '笔记本 x20', '2026-01-15', '184,000', '研发部', '在用'],
            ['FA-0098', '投影仪（旧）', '2021-04-19', '8,600', '行政部', '已报废'],
          ],
        },
        {
          key: 'kb5-s4',
          name: '供应商付款排期',
          type: 'sheet',
          data: [
            ['供应商', '事项', '金额(元)', '约定付款日', '状态'],
            ['云启科技', '云资源季度账单', '86,400', '09-15', '待付'],
            ['数联信息', '地图数据授权', '42,000', '09-20', '审批中'],
            ['创意设计社', '品牌视觉服务', '58,000', '09-28', '待验收'],
            ['安迅物业', '季度物业费', '120,000', '10-05', '未启动'],
            ['宏图办公', '办公家具尾款', '36,800', '10-12', '未启动'],
          ],
        },
        {
          key: 'kb5-d5',
          name: '年度审计资料清单',
          type: 'doc',
          content:
            '<h2>审计窗口</h2><p>2027-01-11 至 01-22。</p><h2>需准备</h2><ul><li>全年凭证与账簿（电子版）</li><li>银行对账单（12 个账户期）</li><li>合同台账与重大合同原件</li><li>固定资产盘点表</li><li>关联交易明细</li></ul><h2>责任人</h2><p>孙怡统筹，各部门 01-08 前提交。</p>',
        },
      ],
    },
  ],
}

function findNode(nodes: KbNode[], key: string): KbNode | null {
  for (const n of nodes) {
    if (n.key === key) return n
    if (n.children) {
      const f = findNode(n.children, key)
      if (f) return f
    }
  }
  return null
}

function updateNode(nodes: KbNode[], key: string, updater: (n: KbNode) => KbNode): KbNode[] {
  return nodes.map((n) => {
    if (n.key === key) return updater(n)
    if (n.children) return { ...n, children: updateNode(n.children, key, updater) }
    return n
  })
}

function insertChild(nodes: KbNode[], parentKey: string | null, child: KbNode): KbNode[] {
  if (parentKey === null) return [...nodes, child]
  return nodes.map((n) => {
    if (n.key === parentKey) return { ...n, children: [...(n.children || []), child] }
    if (n.children) return { ...n, children: insertChild(n.children, parentKey, child) }
    return n
  })
}

function removeNode(nodes: KbNode[], key: string): KbNode[] {
  return nodes
    .filter((n) => n.key !== key)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, key) } : n))
}

const toTreeData = (nodes: KbNode[]): any[] =>
  nodes.map((n) => ({
    key: n.key,
    title: n.name,
    isLeaf: !n.children || n.children.length === 0,
    selectable: true,
    node: n,
    children: n.children ? toTreeData(n.children) : undefined,
  }))

// ——— 在线表格编辑器（Excel 风格，可编辑）———
function SheetEditor({ data, onChange }: { data: string[][]; onChange: (d: string[][]) => void }) {
  const cols = data[0]?.length || 1
  const letters = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i))
  const setCell = (r: number, c: number, v: string) => {
    const next = data.map((row) => row.slice())
    next[r][c] = v
    onChange(next)
  }
  const addRow = () => onChange([...data, Array(cols).fill('')])
  const addCol = () => onChange(data.map((row) => [...row, '']))
  return (
    <div className="sheet">
      <div className="sheet-toolbar">
        <Button size="small" onClick={addRow}>
          + 行
        </Button>
        <Button size="small" onClick={addCol}>
          + 列
        </Button>
      </div>
      <div className="sheet-scroll">
        <table className="sheet-table">
          <thead>
            <tr>
              <th className="sheet-corner" />
              {letters.map((l) => (
                <th key={l}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, r) => (
              <tr key={r}>
                <td className="sheet-rownum">{r + 1}</td>
                {row.map((cell, c) => (
                  <td key={c}>
                    <input className="sheet-cell" value={cell} onChange={(e) => setCell(r, c, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface OutlineItem {
  id: string
  level: number
  text: string
}

// 将纯文本（种子数据）转为可渲染的 HTML 段落
function plaintextToHtml(text: string): string {
  if (!text) return '<p><br/></p>'
  if (text.includes('<') && text.includes('>')) return text // 已是 HTML
  return '<p>' + text.split('\n').join('</p><p>') + '</p>'
}

// ——— 文档富文本编辑器（wangEditor v5 + 大纲 + 滚动高亮）———
function DocEditor({
  value,
  onChange,
  onOutline,
  onActiveOutline,
}: {
  value: string
  onChange: (html: string) => void
  onOutline?: (items: OutlineItem[]) => void
  onActiveOutline?: (id: string | null) => void
}) {
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const toolbarContainerRef = useRef<HTMLDivElement>(null)

  const emitOutline = useRef<() => void>(() => {})

  useEffect(() => {
    if (!editorContainerRef.current || !toolbarContainerRef.current) return

    const getHeadings = () => {
      const root = editorContainerRef.current
      if (!root) return [] as HTMLElement[]
      return Array.from(root.querySelectorAll('h1, h2, h3')) as HTMLElement[]
    }

    const computeOutline = (): OutlineItem[] =>
      getHeadings().map((el, i) => ({
        id: String(i),
        level: Number((el.tagName || 'H1').substring(1)),
        text: el.textContent || '未命名标题',
      }))

    const computeActive = (): string | null => {
      const root = editorContainerRef.current
      const headings = getHeadings()
      if (!root || headings.length === 0) return null
      const rootTop = root.getBoundingClientRect().top
      let active: string | null = null
      headings.forEach((h, i) => {
        if (h.getBoundingClientRect().top - rootTop <= 96) active = String(i)
      })
      return active
    }

    emitOutline.current = () => {
      onOutline?.(computeOutline())
      onActiveOutline?.(computeActive())
    }

    const editor = createEditor({
      selector: editorContainerRef.current,
      html: plaintextToHtml(value),
      config: {
        placeholder: '开始输入文档内容，使用工具栏设置标题可生成右侧大纲…',
        onChange(ed) {
          onChange(ed.getHtml())
          emitOutline.current()
        },
      },
      mode: 'default',
    })
    const toolbar = createToolbar({
      editor,
      selector: toolbarContainerRef.current,
      config: {},
      mode: 'default',
    })

    const rootEl = editorContainerRef.current
    const onScroll = () => onActiveOutline?.(computeActive())
    rootEl.addEventListener('scroll', onScroll)

    emitOutline.current()

    return () => {
      rootEl.removeEventListener('scroll', onScroll)
      toolbar.destroy()
      editor.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="kb-doc-editor-wrap">
      <div ref={toolbarContainerRef} className="kb-doc-wang-toolbar" />
      <div ref={editorContainerRef} className="kb-doc-wang-editor" />
    </div>
  )
}

// ——— 知识库工作区：左树 + 右内容 ———
function KbWorkspace({
  kbList,
  trees,
  onTreesChange,
}: {
  kbList: KB[]
  trees: Record<string, KbNode[]>
  onTreesChange: (t: Record<string, KbNode[]>) => void
}) {
  const [wsKbId, setWsKbId] = useState(kbList[0]?.id || '')
  const tree = trees[wsKbId] || []
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [addTarget, setAddTarget] = useState<{ parentKey: string | null; type: NodeType } | null>(null)
  const [addName, setAddName] = useState('')
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const { modal } = AntdApp.useApp()

  const openRename = (key: string, name: string) => {
    setRenameTarget(key)
    setRenameName(name)
  }
  const confirmRename = () => {
    if (!renameTarget) return
    const name = renameName.trim() || '未命名'
    onTreesChange({ ...trees, [wsKbId]: updateNode(tree, renameTarget, (n) => ({ ...n, name })) })
    setRenameTarget(null)
  }
  const handleDelete = (node: KbNode) => {
    modal.confirm({
      title: `删除「${node.name}」？`,
      content: '将同时移除该节点下的所有子内容，且不可恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        onTreesChange({ ...trees, [wsKbId]: removeNode(tree, node.key) })
        if (selectedKey === node.key) {
          setSelectedKey(null)
        }
      },
    })
  }

  const treeData = useMemo(() => toTreeData(tree), [tree])

  const onSelect = (_keys: React.Key[], info: any) => {
    const n = info.node.node as KbNode
    if (n.type !== 'folder') setSelectedKey(n.key)
  }

  const openAdd = (parentKey: string | null, type: NodeType) => {
    setAddTarget({ parentKey, type })
    setAddName('')
  }
  const confirmAdd = () => {
    if (!addTarget) return
    const name =
      addName.trim() ||
      (addTarget.type === 'folder' ? '新建文件夹' : addTarget.type === 'doc' ? '未命名文档' : '未命名表格')
    const node: KbNode = {
      key: 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      type: addTarget.type,
    }
    if (addTarget.type === 'folder') node.children = []
    else if (addTarget.type === 'doc') node.content = ''
    else node.data = [['', '', ''], ['', '', ''], ['', '', '']]

    onTreesChange({ ...trees, [wsKbId]: insertChild(tree, addTarget.parentKey, node) })
    if (addTarget.parentKey) {
      setExpandedKeys((prev) => (prev.includes(addTarget.parentKey as string) ? prev : [...prev, addTarget.parentKey as string]))
    }
    setAddTarget(null)
  }

  const selected = selectedKey ? findNode(tree, selectedKey) : null
  const updateSelected = (updater: (n: KbNode) => KbNode) => {
    if (!selectedKey) return
    onTreesChange({ ...trees, [wsKbId]: updateNode(tree, selectedKey, updater) })
  }

  const titleRender = (tnode: any) => {
    const n = tnode.node as KbNode
    const ico =
      n.type === 'folder' ? <FolderOutlined /> : n.type === 'doc' ? <FileTextOutlined /> : <TableOutlined />
    return (
      <span className="kb-tree-node">
        <span className="kb-tree-ico">{ico}</span>
        <span className="kb-tree-name">{n.name}</span>
        <Dropdown
          menu={{
            items: [
              { key: 'folder', label: '新建目录' },
              { key: 'doc', label: '新建文档' },
              { key: 'sheet', label: '新建表格' },
              { type: 'divider' },
              { key: 'rename', label: '重命名' },
              { key: 'delete', label: '删除' },
            ],
            onClick: ({ key }) => {
              if (key === 'rename') openRename(n.key, n.name)
              else if (key === 'delete') handleDelete(n)
              else openAdd(n.key, key as NodeType)
            },
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            size="small"
            type="text"
            className="kb-tree-add"
            icon={<PlusOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </span>
    )
  }

  return (
    <div className="kb-ws">
      <div className="kb-ws-tree">
        <div className="kb-ws-tree-head">
          <Select
            value={wsKbId}
            onChange={(v) => {
              setWsKbId(v)
              setSelectedKey(null)
            }}
            options={kbList.map((k) => ({ label: k.name, value: k.id }))}
            className="kb-ws-select"
          />
          <Dropdown
            menu={{
              items: [
                { key: 'folder', label: '目录' },
                { key: 'doc', label: '文档' },
                { key: 'sheet', label: '表格' },
              ],
              onClick: ({ key }) => openAdd(null, key as NodeType),
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button size="small" icon={<PlusOutlined />}>
              新增
            </Button>
          </Dropdown>
        </div>
        <div className="kb-ws-tree-body">
          {tree.length === 0 ? (
            <div className="kb-ws-tree-empty">该知识库暂无内容，点击右上角「新增」新建</div>
          ) : (
            <Tree
              treeData={treeData}
              titleRender={titleRender}
              expandedKeys={expandedKeys}
              onExpand={(k) => setExpandedKeys(k as string[])}
              selectedKeys={selectedKey ? [selectedKey] : []}
              onSelect={onSelect}
              expandAction="click"
              blockNode
            />
          )}
        </div>
      </div>

      <div className="kb-ws-content">
        {!selected && (
          <div className="kb-ws-empty">
            <FileTextOutlined style={{ fontSize: 40, color: '#cbd5e1' }} />
            <div>从左侧目录选择文档或表格，开始查看与在线编辑</div>
          </div>
        )}

        {selected?.type === 'folder' && (
          <div>
            <div className="kb-ws-doc-head">
              <FolderOutlined /> {selected.name}
              <Tag color="default" style={{ marginLeft: 8 }}>
                文件夹
              </Tag>
            </div>
            <div className="kb-ws-folder-meta">包含 {selected.children?.length || 0} 个子项</div>
          </div>
        )}

        {selected?.type === 'doc' && (
          <div className="kb-doc-layout">
            <div className="kb-doc-main">
              <div className="kb-ws-doc-head">
                <FileTextOutlined /> {selected.name}
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  文档
                </Tag>
              </div>
              <DocEditor
                key={selected.key}
                value={selected.content || ''}
                onChange={(html) => updateSelected((n) => ({ ...n, content: html }))}
              />
            </div>
          </div>
        )}

        {selected?.type === 'sheet' && (
          <div>
            <div className="kb-ws-doc-head">
              <TableOutlined /> {selected.name}
              <Tag color="green" style={{ marginLeft: 8 }}>
                表格
              </Tag>
            </div>
            <SheetEditor data={selected.data || [['']]} onChange={(d) => updateSelected((n) => ({ ...n, data: d }))} />
          </div>
        )}
      </div>

      <Modal
        title={addTarget ? `新建${addTarget.type === 'folder' ? '文件夹' : addTarget.type === 'doc' ? '文档' : '表格'}` : ''}
        open={!!addTarget}
        onOk={confirmAdd}
        onCancel={() => setAddTarget(null)}
        okText="创建"
      >
        <Input
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          placeholder="请输入名称"
          onPressEnter={confirmAdd}
          autoFocus
        />
      </Modal>

      <Modal
        title="重命名"
        open={!!renameTarget}
        onOk={confirmRename}
        onCancel={() => setRenameTarget(null)}
        okText="保存"
      >
        <Input
          value={renameName}
          onChange={(e) => setRenameName(e.target.value)}
          placeholder="请输入名称"
          onPressEnter={confirmRename}
          autoFocus
        />
      </Modal>
    </div>
  )
}

// ——— AI 写作（模拟大模型：生成带大纲+正文的草稿，支持增删改与持续调整）———
interface AiSection {
  id: string
  title: string
  content: string
  children?: AiSection[]
}
interface AiMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  time: string
}
interface AiConversation {
  id: string
  title: string
  prompt: string
  sections: AiSection[]
  messages: AiMessage[]
  createdAt: string
}

const aiNow = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const aiUid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const aiShort = (s: string, n = 12) => {
  const t = s.trim()
  return t.length > n ? t.slice(0, n) + '…' : t || '无'
}

// ——— 大纲树结构辅助函数 ———
function updateSection(list: AiSection[], id: string, patch: Partial<AiSection>): AiSection[] {
  return list.map((s) => {
    if (s.id === id) return { ...s, ...patch }
    if (s.children) return { ...s, children: updateSection(s.children, id, patch) }
    return s
  })
}
function removeSection(list: AiSection[], id: string): AiSection[] {
  return list
    .filter((s) => s.id !== id)
    .map((s) => (s.children ? { ...s, children: removeSection(s.children, id) } : s))
}
function insertSectionChild(list: AiSection[], parentId: string | null, child: AiSection): AiSection[] {
  if (parentId === null) return [...list, child]
  return list.map((s) => {
    if (s.id === parentId) return { ...s, children: [...(s.children || []), child] }
    if (s.children) return { ...s, children: insertSectionChild(s.children, parentId, child) }
    return s
  })
}
function countSections(list: AiSection[]): number {
  return list.reduce((n, s) => n + 1 + (s.children ? countSections(s.children) : 0), 0)
}

// 模拟「根据用户需求生成草稿大纲」（多层级：章 → 节）
function mockGenerate(prompt: string): { title: string; sections: AiSection[]; reply: string } {
  const topic = prompt.trim() || '未命名主题'
  const title = topic.length > 18 ? topic.slice(0, 18) + '…' : topic
  const chapters: { ch: string; summary: string; secs: { title: string; content: string }[] }[] = [
    {
      ch: '一、项目背景与目标',
      summary: `在启动「${topic}」之前，先厘清背景：为什么做、为谁而做、要解决什么核心问题，确保后续内容始终不跑偏。`,
      secs: [
        { title: '1.1 现状与痛点', content: `围绕「${topic}」，当前主要问题是信息分散、责任不清、推进依赖人工经验，导致协作成本高、结果难以复制。明确现状是优化的前提。` },
        { title: '1.2 目标与价值', content: `本次「${topic}」希望达成的核心目标：在可衡量的周期内显著提升关键指标，沉淀可复用的方法论，为后续规模化奠定基础。` },
      ],
    },
    {
      ch: '二、核心方案设计',
      summary: `针对目标，给出「${topic}」的总体方案框架，从思路、模块到关键实现逐层拆解，保证方案既完整又落地。`,
      secs: [
        { title: '2.1 总体思路', content: `以"目标拆解—能力补齐—闭环验证"为主线，先搭骨架再填血肉，确保每一部分都对准最终成效。` },
        { title: '2.2 关键模块', content: `核心模块包括：需求与场景定义、流程与角色梳理、工具与数据支撑、度量与反馈。各模块之间以数据流串联。` },
        { title: '2.3 实现要点', content: `落地时需重点把控：接口与数据标准统一、异常与边界处理、性能与稳定性预留余量，避免后期返工。` },
      ],
    },
    {
      ch: '三、实施路径',
      summary: `把「${topic}」拆成可执行、可检查的步骤，明确节奏、分工与里程碑，让推进有抓手、有节奏。`,
      secs: [
        { title: '3.1 阶段划分', content: `建议分三阶段：准备期（资源/边界明确）→ 试点期（小范围验证）→ 推广期（标准化复制），每阶段设置进入与退出标准。` },
        { title: '3.2 责任分工', content: `明确牵头方、配合方与决策方的职责边界与交付物，关键节点设单一责任人（DRI），减少推诿。` },
        { title: '3.3 里程碑', content: `设定可量化的里程碑，例如第 2 周完成方案评审、第 4 周完成试点、第 8 周完成复盘，便于过程纠偏。` },
      ],
    },
    {
      ch: '四、风险与保障',
      summary: `预判「${topic}」推进中的不确定因素，提前准备应对预案与资源保障，把"踩坑"变成"可控"。`,
      secs: [
        { title: '4.1 风险识别', content: `主要风险包括：需求变更频繁、关键资源不到位、跨团队协同阻塞、数据质量不达标，需建立风险台账。` },
        { title: '4.2 应对措施', content: `对应预案：变更走评审冻结窗口、资源设备份方案、协同设升级机制、数据设准入校验，做到风险有兜底。` },
        { title: '4.3 资源保障', content: `保障层面需落实：预算与人力排期、工具与权限开通、管理层背书与定期对齐，确保方案不被"卡脖子"。` },
      ],
    },
    {
      ch: '五、成效与展望',
      summary: `回顾「${topic}」的整体思路，点明预期成果，并设计复盘与下一步规划，让方案形成闭环、可持续。`,
      secs: [
        { title: '5.1 预期成效', content: `预期在效率、质量或成本某一项上取得可见改善，并以指标看板持续观测，避免"做完即结束"。` },
        { title: '5.2 复盘机制', content: `建立"阶段性复盘 + 结项复盘"双机制，沉淀成功做法与失败教训，转化为组织资产。` },
        { title: '5.3 后续规划', content: `在验证成功后，规划第二期的扩展方向（更多场景/更深自动化），保持方案的演进性。` },
      ],
    },
  ]
  const sections: AiSection[] = chapters.map((c) => ({
    id: aiUid('s'),
    title: c.ch,
    content: c.summary,
    children: c.secs.map((s) => ({ id: aiUid('s'), title: s.title, content: s.content })),
  }))
  const secCount = sections.reduce((n, c) => n + (c.children?.length || 0), 0)
  return {
    title,
    sections,
    reply: `已根据你的需求「${topic}」生成包含 ${sections.length} 章、${secCount} 节的多层级草稿大纲，可在右侧查看、编辑或让我继续调整。`,
  }
}

// 模拟「根据调整指令改写/增删章节」
function mockAdjust(conv: AiConversation, instruction: string): { sections: AiSection[]; reply: string } {
  const ins = instruction.trim() || '优化一下'
  const sections = conv.sections.slice()
  if (/新增|补充|加一|增加|添加|加个/.test(ins)) {
    const sec: AiSection = {
      id: aiUid('s'),
      title: `补充：${aiShort(ins)}`,
      content: `针对「${ins}」，补充如下要点：\n· 要点一\n· 要点二\n· 要点三（此处为 AI 模拟生成的补充内容，可手动改写）`,
    }
    sections.push(sec)
    return { sections, reply: `已新增章节《${sec.title}》，并附上可参考的内容要点。` }
  }
  if (/删|去掉|移除|删除/.test(ins) && sections.length > 1) {
    const removed = sections.pop()!
    return { sections, reply: `已移除最后一节《${removed.title}》。` }
  }
  if (/精简|缩短|简洁|压缩/.test(ins)) {
    const next = sections.map((s) => ({ ...s, content: s.content.replace(/\n/g, '').slice(0, 48) + '（已精简）' }))
    return { sections: next, reply: '已对全文进行精简压缩，保留核心表述。' }
  }
  const sec: AiSection = {
    id: aiUid('s'),
    title: `优化建议：${aiShort(ins)}`,
    content: `根据「${ins}」，建议从以下角度优化本次草稿：\n1）强化开头的目标陈述，让读者快速抓住重点；\n2）补充具体数据或案例支撑，增强说服力；\n3）结尾给出明确的下一步行动项。`,
  }
  sections.push(sec)
  return { sections, reply: `已根据「${ins}」补充一节优化建议，可保留或删除。` }
}

const seedConversations: AiConversation[] = [
  (() => {
    const g = mockGenerate('帮我写一份新员工入职培训方案')
    return {
      id: 'conv_seed1',
      title: g.title,
      prompt: '帮我写一份新员工入职培训方案',
      sections: g.sections,
      messages: [
        { id: aiUid('m'), role: 'user', text: '帮我写一份新员工入职培训方案', time: aiNow() },
        { id: aiUid('m'), role: 'ai', text: g.reply, time: aiNow() },
      ],
      createdAt: aiNow(),
    }
  })(),
  (() => {
    const g = mockGenerate('我想做一份产品季度复盘')
    return {
      id: 'conv_seed2',
      title: g.title,
      prompt: '我想做一份产品季度复盘',
      sections: g.sections,
      messages: [
        { id: aiUid('m'), role: 'user', text: '我想做一份产品季度复盘', time: aiNow() },
        { id: aiUid('m'), role: 'ai', text: g.reply, time: aiNow() },
      ],
      createdAt: aiNow(),
    }
  })(),
]

function AiWriting() {
  const { message } = AntdApp.useApp()
  const [convs, setConvs] = useState<AiConversation[]>(seedConversations)
  const [activeId, setActiveId] = useState<string | null>(seedConversations[0]?.id || null)
  const [draftPrompt, setDraftPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedSec, setSelectedSec] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addTarget, setAddTarget] = useState<string | null>(null)
  const [addTitle, setAddTitle] = useState('')
  const [addContent, setAddContent] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const active = convs.find((c) => c.id === activeId) || null

  // 切换会话时默认选中该会话第一章，并滚动回顶部
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const c = convs.find((x) => x.id === activeId)
    setSelectedSec(c?.sections[0]?.id ?? null)
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [activeId])

  // 点击大纲条目：右侧内容滚动到对应章节
  const scrollToSection = (id: string) => {
    setSelectedSec(id)
    const root = contentRef.current
    if (!root) return
    const el = root.querySelector<HTMLElement>(`[data-sec-id="${id}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 滚动右侧内容时，反向高亮当前所在章节
  const onContentScroll = () => {
    const root = contentRef.current
    if (!root) return
    const rootTop = root.getBoundingClientRect().top
    const secs = Array.from(root.querySelectorAll<HTMLElement>('[data-sec-id]'))
    let current: string | null = null
    for (const sec of secs) {
      if (sec.getBoundingClientRect().top - rootTop <= 96) current = sec.getAttribute('data-sec-id')
      else break
    }
    if (current) setSelectedSec(current)
  }

  const updateConv = (id: string, updater: (c: AiConversation) => AiConversation) =>
    setConvs((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))

  const changeSec = (secId: string, patch: Partial<AiSection>) => {
    if (!active) return
    updateConv(active.id, (c) => ({ ...c, sections: updateSection(c.sections, secId, patch) }))
  }

  const handleNewConv = () => {
    const conv: AiConversation = {
      id: aiUid('conv'),
      title: '未命名会话',
      prompt: '',
      sections: [],
      messages: [],
      createdAt: aiNow(),
    }
    setConvs((prev) => [conv, ...prev])
    setActiveId(conv.id)
    setSelectedSec(null)
    setDraftPrompt('')
  }

  const handleGenerate = () => {
    if (!active) return
    const prompt = draftPrompt.trim()
    if (!prompt) {
      message.warning('请先描述你想写的内容')
      return
    }
    setGenerating(true)
    setTimeout(() => {
      const g = mockGenerate(prompt)
      updateConv(active.id, (c) => ({
        ...c,
        title: g.title,
        prompt,
        sections: g.sections,
        messages: [
          ...c.messages,
          { id: aiUid('m'), role: 'user', text: prompt, time: aiNow() },
          { id: aiUid('m'), role: 'ai', text: g.reply, time: aiNow() },
        ],
      }))
      setSelectedSec(g.sections[0]?.id ?? null)
      setDraftPrompt('')
      setGenerating(false)
      message.success('草稿已生成，可在右侧继续调整')
    }, 700)
  }

  const handleChatSend = () => {
    if (!active) return
    const ins = chatInput.trim()
    if (!ins) {
      message.warning('请输入调整指令')
      return
    }
    setGenerating(true)
    setTimeout(() => {
      const { sections, reply } = mockAdjust(active, ins)
      updateConv(active.id, (c) => ({
        ...c,
        sections,
        messages: [
          ...c.messages,
          { id: aiUid('m'), role: 'user', text: ins, time: aiNow() },
          { id: aiUid('m'), role: 'ai', text: reply, time: aiNow() },
        ],
      }))
      setChatInput('')
      setGenerating(false)
      message.success('AI 已按指令调整')
    }, 600)
  }

  const confirmAdd = () => {
    if (!active) return
    const sec: AiSection = { id: aiUid('s'), title: addTitle.trim() || '新章节', content: addContent }
    updateConv(active.id, (c) => ({ ...c, sections: insertSectionChild(c.sections, addTarget, sec) }))
    setSelectedSec(sec.id)
    setAddOpen(false)
    setAddTarget(null)
    setAddTitle('')
    setAddContent('')
  }

  const handleDeleteSec = (secId: string) => {
    if (!active) return
    updateConv(active.id, (c) => ({ ...c, sections: removeSection(c.sections, secId) }))
    if (selectedSec === secId) setSelectedSec(null)
  }

  // 递归渲染大纲树
  const renderOutlineNode = (s: AiSection, depth: number, idx: string) => (
    <div className="ai-outline-node" key={s.id}>
      <div
        className={`ai-outline-item${s.id === selectedSec ? ' active' : ''}${depth > 0 ? ' child' : ''}`}
        style={{ paddingLeft: 10 + depth * 18 }}
        onClick={() => scrollToSection(s.id)}
      >
        <span className="ai-outline-idx">{idx}</span>
        <span className="ai-outline-name">{s.title}</span>
        <span className="ai-outline-acts" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="新增子章节">
            <Button
              size="small"
              type="text"
              className="ai-outline-add"
              icon={<PlusOutlined />}
              onClick={() => {
                setAddTarget(s.id)
                setAddOpen(true)
              }}
            />
          </Tooltip>
          <Popconfirm
            title="删除该章节及其子章节？"
            onConfirm={() => handleDeleteSec(s.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" className="ai-outline-del" icon={<DeleteOutlined />} />
          </Popconfirm>
        </span>
      </div>
      {s.children &&
        s.children.length > 0 &&
        s.children.map((c, ci) => renderOutlineNode(c, depth + 1, `${idx}.${ci + 1}`))}
    </div>
  )

  // 递归渲染整篇文档（所有章节与正文全部展示，支持逐节编辑）
  const renderDocSection = (s: AiSection, depth: number, idx: string) => (
    <div
      className={`ai-doc-sec${selectedSec === s.id ? ' active' : ''}${depth > 0 ? ' child' : ''}`}
      data-sec-id={s.id}
      key={s.id}
    >
      <div className="ai-doc-sec-head">
        <span className="ai-doc-sec-idx">{idx}</span>
        <Input
          className={`ai-doc-sec-title lv${depth}`}
          value={s.title}
          onChange={(e) => changeSec(s.id, { title: e.target.value })}
          placeholder="标题"
        />
      </div>
      <Input.TextArea
        className="ai-doc-sec-content"
        value={s.content}
        onChange={(e) => changeSec(s.id, { content: e.target.value })}
        autoSize={{ minRows: depth === 0 ? 3 : 2, maxRows: 18 }}
        placeholder="在此撰写 / 编辑内容"
      />
      {s.children && s.children.length > 0 && (
        <div className="ai-doc-sec-children">
          {s.children.map((c, ci) => renderDocSection(c, depth + 1, `${idx}.${ci + 1}`))}
        </div>
      )}
    </div>
  )

  return (
    <div className="ai-wrap">
      {/* 左侧会话列表 */}
      <div className="ai-conv-list">
        <div className="ai-conv-head">
          <span className="ai-conv-title">我的写作会话</span>
          <Tooltip title="新建一个空白写作会话">
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleNewConv}>
              新建会话
            </Button>
          </Tooltip>
        </div>
        <div className="ai-conv-items">
          {convs.length === 0 ? (
            <Empty description="还没有会话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            convs.map((c) => (
              <div
                key={c.id}
                className={`ai-conv-item${c.id === activeId ? ' active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="ai-conv-item-title">{c.title}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧主区 */}
      <div className="ai-main">
        {!active ? (
          <div className="ai-empty">
            <RobotOutlined style={{ fontSize: 40, color: '#cbd5e1' }} />
            <div>还没有会话，点击左侧「新建会话」开始让 AI 帮你写草稿</div>
          </div>
        ) : active.sections.length === 0 ? (
          <div className="ai-blank">
            <div className="ai-blank-head">
              <div className="ai-blank-title">{active.title}</div>
            </div>
            <div className="ai-blank-tip">
              描述你想写的内容，交给 AI 生成大纲与草稿；也可以直接在这里记录想法，后续再整理成大纲。
            </div>
            <Input.TextArea
              className="ai-blank-input"
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              placeholder="例如：帮我写一份产品上线推广方案，包含背景、目标、执行步骤、风险与总结……"
              autoSize={{ minRows: 12, maxRows: 22 }}
              autoFocus
            />
            <div className="ai-blank-actions">
              <Button type="primary" icon={<SendOutlined />} loading={generating} onClick={handleGenerate}>
                生成草稿
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="ai-main-head">
              <div>
                <div className="ai-main-title">{active.title}</div>
                {active.prompt && <div className="ai-main-prompt">需求：{active.prompt}</div>}
              </div>
            </div>

            <div className="ai-doc">
              {/* 大纲（树结构） */}
              <div className="ai-outline">
                <div className="ai-outline-head">
                  <span>大纲（{active.sections.length} 章 · {countSections(active.sections)} 节）</span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setAddTarget(null)
                      setAddOpen(true)
                    }}
                  >
                    新增章节
                  </Button>
                </div>
                <div className="ai-outline-list">
                  {active.sections.length === 0 && <div className="ai-outline-empty">暂无章节，点击「新增章节」</div>}
                  {active.sections.map((s, i) => renderOutlineNode(s, 0, String(i + 1)))}
                </div>
              </div>

              {/* 整篇文档内容（全部展示，滚动联动） */}
              <div className="ai-section" ref={contentRef} onScroll={onContentScroll}>
                {active.sections.map((s, i) => renderDocSection(s, 0, String(i + 1)))}
              </div>
            </div>

            {/* 右下角悬浮：与 AI 对话（始终固定在视口右下角） */}
            {!chatOpen && (
              <button className="ai-fab" onClick={() => setChatOpen(true)} title="与 AI 对话，继续调整内容" aria-label="与 AI 对话">
                <CommentOutlined />
              </button>
            )}
            {chatOpen && (
              <div className="ai-chat-panel">
                <div className="ai-chat-panel-head">
                  <span>与 AI 对话 · {active.title}</span>
                  <Button type="text" icon={<CloseOutlined />} onClick={() => setChatOpen(false)} />
                </div>
                <div className="ai-chat-history">
                  {active.messages.length === 0 ? (
                    <div className="ai-chat-empty">还没有对话，描述你的需求，让 AI 帮你调整内容。</div>
                  ) : (
                    active.messages.map((m) => (
                      <div key={m.id} className={`ai-chat-row ${m.role}`}>
                        <div className="ai-chat-bubble">
                          <div className="ai-chat-role">{m.role === 'user' ? '我' : 'AI'}</div>
                          <div className="ai-chat-text">{m.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="ai-chat-input-row">
                  <Input.TextArea
                    className="ai-chat-input"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="让 AI 调整内容，例如：再加一节风险应对 / 把全文精简一下 / 删掉最后一节"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault()
                        handleChatSend()
                      }
                    }}
                  />
                  <Button type="primary" icon={<SendOutlined />} loading={generating} onClick={handleChatSend}>
                    发送
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 新增章节弹窗 */}
      <Modal
        title="新增章节"
        open={addOpen}
        onOk={confirmAdd}
        onCancel={() => {
          setAddOpen(false)
          setAddTarget(null)
          setAddTitle('')
          setAddContent('')
        }}
        okText="添加"
      >
        <div className="ai-field">
          <label>章节标题</label>
          <Input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="如：六、参考资料" />
        </div>
        <div className="ai-field">
          <label>章节内容（可选）</label>
          <Input.TextArea
            rows={4}
            value={addContent}
            onChange={(e) => setAddContent(e.target.value)}
            placeholder="也可在右侧直接编辑"
          />
        </div>
      </Modal>
    </div>
  )
}

export default function DocsCenter() {
  const { message } = AntdApp.useApp()
  const [menu, setMenu] = useState<MenuKey>('start')
  const [kbList, setKbList] = useState<KB[]>(seedKBs)
  const [kbTrees, setKbTrees] = useState<Record<string, KbNode[]>>(seedKbTrees)
  const [activeKbId, setActiveKbId] = useState<string | null>(null)
  const [newDocOpen, setNewDocOpen] = useState(false)
  const [newKbOpen, setNewKbOpen] = useState(false)
  const [docType, setDocType] = useState<'doc' | 'sheet'>('doc')
  const [docForm] = Form.useForm()
  const [kbForm] = Form.useForm()

  // —— 全局搜索 ——
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const allDocs = useMemo(
    () => [...Object.values(docData).flat(), ...Object.values(kbDocuments).flat()],
    [],
  )

  // 表格类示例数据，用于搜索结果中展示「表格」类型
  const seedTables: { key: string; name: string; kb: string }[] = [
    { key: 't1', name: '项目预算表2026', kb: '财务共享库' },
    { key: 't2', name: '员工花名册', kb: '人事制度库' },
    { key: 't3', name: '会议室排期表', kb: '行政服务库' },
  ]

  const handleOpenKb = (kb: KB) => {
    setMenu('explore')
    setActiveKbId(kb.id)
    setSearchOpen(false)
  }

  const handleOpenKbByName = (name: string) => {
    const kb = kbList.find((k) => k.name === name)
    if (kb) handleOpenKb(kb)
    else setSearchOpen(false)
  }

  type SearchResult = {
    key: string
    type: '知识库' | '文档' | '表格'
    title: string
    sub: string
    onOpen: () => void
  }

  const kw = searchQuery.trim().toLowerCase()
  const searchResults: SearchResult[] = [
    ...kbList.map((k) => ({
      key: 'kb-' + k.id,
      type: '知识库' as const,
      title: k.name,
      sub: k.desc,
      onOpen: () => handleOpenKb(k),
    })),
    ...allDocs.map((d) => ({
      key: 'doc-' + d.key + d.kb,
      type: '文档' as const,
      title: d.name,
      sub: `${d.kb} · ${d.time}`,
      onOpen: () => handleOpenKbByName(d.kb),
    })),
    ...seedTables.map((t) => ({
      key: 'tb-' + t.key,
      type: '表格' as const,
      title: t.name,
      sub: t.kb,
      onOpen: () => handleOpenKbByName(t.kb),
    })),
  ].filter((r) => !kw || r.title.toLowerCase().includes(kw) || r.sub.toLowerCase().includes(kw))

  // 左侧菜单：开始 / 知识库（面板总览）/ AI写作 / 收藏 / 逛逛
  const menuItems = [
    { key: 'start', icon: <PlayCircleOutlined />, label: '开始' },
    { key: 'kb', icon: <DatabaseOutlined />, label: '知识库' },
    { key: 'ai', icon: <ThunderboltOutlined />, label: 'AI写作' },
    { key: 'fav', icon: <StarOutlined />, label: '收藏' },
    { key: 'explore', icon: <CompassOutlined />, label: '逛逛' },
  ]

  const openNewDoc = (t: 'doc' | 'sheet') => {
    setDocType(t)
    setNewDocOpen(true)
  }

  const handleNewDocOk = async () => {
    try {
      const v = await docForm.validateFields()
      const kb = kbList.find((k) => k.id === v.kb)
      if (!kb) return
      setMenu('explore')
      setActiveKbId(kb.id)
      setNewDocOpen(false)
      docForm.resetFields()
      message.success(`已创建${docType === 'sheet' ? '表格' : '文档'}并进入《${kb.name}》`)
    } catch {
      /* 校验未通过，保持弹窗打开 */
    }
  }

  const handleNewKbOk = async () => {
    try {
      const v = await kbForm.validateFields()
      const newKb: KB = { id: 'kb_' + Date.now(), name: v.name, desc: v.desc || '暂无简介' }
      setKbList((prev) => [...prev, newKb])
      setMenu('explore')
      setActiveKbId(newKb.id)
      setNewKbOpen(false)
      kbForm.resetFields()
      message.success(`已创建并进入《${newKb.name}》知识库`)
    } catch {
      /* 校验未通过，保持弹窗打开 */
    }
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('kb:')) {
      setMenu('explore')
      setActiveKbId(key.slice(3))
    } else if (key === 'explore-all') {
      setMenu('explore')
      setActiveKbId(null)
    } else {
      setMenu(key as MenuKey)
      setActiveKbId(null)
    }
  }

  const activeKb = kbList.find((k) => k.id === activeKbId) || null
  const selectedKeys = menu === 'kb'
    ? ['kb']
    : activeKbId
    ? ['kb:' + activeKbId]
    : menu === 'explore'
    ? ['explore-all']
    : [menu]

  return (
    <Layout className="docs-layout">
      <Navbar solid title="企业文档中心" />
      <Layout className="docs-body">
        <Sider width={260} className="docs-sider" theme="light">
          <div
            className="docs-search-trigger"
            onClick={() => setSearchOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSearchOpen(true)
            }}
          >
            <SearchOutlined className="docs-search-trigger-icon" />
            <span className="docs-search-trigger-text">搜索内容，或输入 &gt; 唤醒更多</span>
          </div>
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            defaultOpenKeys={[]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        <Content className="docs-content">
          <div className="docs-container">
            {menu === 'start' && (
              <StartView
                onNewDoc={openNewDoc}
                onNewKb={() => setNewKbOpen(true)}
                onAiWrite={() => setMenu('ai')}
              />
            )}
            {menu === 'ai' && <AiWriting />}
            {menu === 'fav' && <OtherView menuKey="fav" />}
            {menu === 'kb' && (
              <KbWorkspace kbList={kbList} trees={kbTrees} onTreesChange={setKbTrees} />
            )}
            {menu === 'explore' &&
              (activeKb ? (
                <KbDetail kb={activeKb} onBack={() => setActiveKbId(null)} onNewDoc={() => openNewDoc('doc')} />
              ) : (
                <KbList kbs={kbList} onOpen={(id) => setActiveKbId(id)} />
              ))}
          </div>
        </Content>
      </Layout>

      {/* 新建文档 / 新建表格 弹窗 */}
      <Modal
        title={docType === 'sheet' ? '新建表格' : '新建文档'}
        open={newDocOpen}
        onOk={handleNewDocOk}
        onCancel={() => {
          setNewDocOpen(false)
          docForm.resetFields()
        }}
        okText="进入知识库"
      >
        <Form form={docForm} layout="vertical">
          <Form.Item name="title" label="文档名称" rules={[{ required: true, message: '请输入文档名称' }]}>
            <Input placeholder="如：Q3 运营复盘" />
          </Form.Item>
          <Form.Item name="kb" label="所属知识库" rules={[{ required: true, message: '请选择知识库' }]}>
            <Select
              showSearch
              placeholder="搜索并选择知识库"
              optionFilterProp="label"
              options={kbList.map((k) => ({ label: k.name, value: k.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建知识库 弹窗 */}
      <Modal
        title="新建知识库"
        open={newKbOpen}
        onOk={handleNewKbOk}
        onCancel={() => {
          setNewKbOpen(false)
          kbForm.resetFields()
        }}
        okText="保存并进入"
      >
        <Form form={kbForm} layout="vertical">
          <Form.Item name="name" label="知识库名称" rules={[{ required: true, message: '请输入知识库名称' }]}>
            <Input placeholder="如：市场调研库" />
          </Form.Item>
          <Form.Item name="desc" label="简介">
            <Input.TextArea rows={3} placeholder="一句话描述这个知识库的用途" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 全局搜索弹窗 */}
      <Modal
        open={searchOpen}
        onCancel={() => setSearchOpen(false)}
        footer={null}
        closable={false}
        width={640}
        className="global-search-modal"
        styles={{ body: { padding: 0 } }}
        afterOpenChange={(o) => {
          if (o) setTimeout(() => searchInputRef.current?.focus(), 60)
        }}
      >
        <div className="gs-header">
          <Input
            ref={searchInputRef as never}
            size="large"
            variant="borderless"
            className="gs-input"
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="搜索内容，或输入 > 唤醒更多"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suffix={
              searchQuery ? (
                <CloseCircleOutlined
                  onClick={() => setSearchQuery('')}
                  style={{ cursor: 'pointer', color: '#94a3b8' }}
                />
              ) : (
                <span className="gs-hint">↑↓ 切换 · Enter 打开</span>
              )
            }
          />
        </div>
        <div className="gs-body">
          <div className="gs-section">
            <div className="gs-section-title">历史搜索</div>
            {searchResults.length > 0 ? (
              searchResults.map((r) => (
                <div key={r.key} className="gs-item" onClick={r.onOpen}>
                  <span className="gs-item-icon" style={{ color: '#3b5bff' }}>
                    <FileTextOutlined />
                  </span>
                  <span className="gs-item-label">{r.title}</span>
                  <span className="gs-item-type">{r.type}</span>
                  <span className="gs-item-desc">{r.sub}</span>
                </div>
              ))
            ) : (
              <div className="gs-empty">未找到与 “{searchQuery}” 相关的内容</div>
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
