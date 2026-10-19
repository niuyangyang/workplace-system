import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Layout,
  Menu,
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Input,
  Select,
  Form,
  Breadcrumb,
  Progress,
  Row,
  Col,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  ThunderboltOutlined,
  ProjectOutlined,
  SolutionOutlined,
  BugOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  StopOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import './agileDev.css'

const { Content } = Layout
const { Title } = Typography

/* ============================ 执行任务：任务定义 ============================ */

type LogLevel = 'info' | 'success' | 'warn' | 'error'

interface TaskStep {
  level: LogLevel
  text: string
}
interface TaskDef {
  id: string
  name: string
  desc: string
  steps: TaskStep[]
}

const TASKS: TaskDef[] = [
  {
    id: 'build',
    name: '代码构建（Maven / Gradle）',
    desc: '拉取分支、安装依赖并执行全量编译，产出可部署制品。',
    steps: [
      { level: 'info', text: '检出代码分支 feature/v2.3 → commit a1b2c3d' },
      { level: 'info', text: '安装依赖（npm ci / mvn dependency:resolve）' },
      { level: 'info', text: '执行编译（tsc -b && vite build）' },
      { level: 'info', text: '编译模块 1/6：core' },
      { level: 'info', text: '编译模块 2/6：shared' },
      { level: 'info', text: '编译模块 3/6：portal' },
      { level: 'warn', text: '检测到 2 处未使用变量（已自动忽略，不阻断）' },
      { level: 'info', text: '编译模块 4/6：admin' },
      { level: 'info', text: '编译模块 5/6：mobile' },
      { level: 'info', text: '编译模块 6/6：e2e' },
      { level: 'success', text: '构建产物已生成（dist/ 12.4 MB）' },
      { level: 'info', text: '上传制品至 Nexus 仓库：app/v2.3.0' },
    ],
  },
  {
    id: 'test',
    name: '自动化测试套件',
    desc: '启动隔离测试环境，执行单元 / 集成 / 接口自动化并生成覆盖率。',
    steps: [
      { level: 'info', text: '启动隔离测试环境（Docker Compose）' },
      { level: 'info', text: '执行单元测试：1,284 用例' },
      { level: 'success', text: '单元测试通过 1,281 / 1,284（3 跳过）' },
      { level: 'info', text: '执行集成测试：服务 order / user / pay' },
      { level: 'info', text: '执行接口自动化：632 接口' },
      { level: 'warn', text: '接口 /api/order/retry 响应 1.2s（阈值 1.0s）' },
      { level: 'success', text: '接口自动化通过 628 / 632' },
      { level: 'info', text: '生成覆盖率报告（行覆盖 84.6%）' },
      { level: 'success', text: '测试阶段完成，无阻断项' },
    ],
  },
  {
    id: 'migrate',
    name: '数据库结构迁移',
    desc: '只读校验后执行 Flyway 迁移脚本，并完成一致性校验。',
    steps: [
      { level: 'info', text: '连接生产数据库（只读校验）' },
      { level: 'info', text: '备份 schema 至 snapshot_20261019' },
      { level: 'info', text: '执行迁移脚本 V2_3_001_add_index' },
      { level: 'info', text: 'ALTER TABLE t_order ADD COLUMN channel VARCHAR(16)' },
      { level: 'info', text: '创建索引 idx_order_channel（影响 2,310,884 行）' },
      { level: 'info', text: '执行迁移脚本 V2_3_002_fix_enum' },
      { level: 'success', text: '数据一致性校验通过' },
      { level: 'info', text: '释放备份锁，迁移完成' },
    ],
  },
  {
    id: 'deploy',
    name: '生产环境部署发布',
    desc: '滚动更新 Deployment，完成健康检查后灰度放量至 100%。',
    steps: [
      { level: 'info', text: '拉取镜像 registry/app:v2.3.0' },
      { level: 'info', text: '滚动更新 Deployment（副本 6）' },
      { level: 'info', text: 'Pod 1/6 就绪' },
      { level: 'info', text: 'Pod 3/6 就绪' },
      { level: 'info', text: 'Pod 6/6 就绪' },
      { level: 'warn', text: '健康检查 /healthz 首次失败（重试中）' },
      { level: 'success', text: '健康检查恢复，探测通过' },
      { level: 'info', text: '切换灰度流量 10% → 100%' },
      { level: 'success', text: '发布完成，线上版本 v2.3.0' },
    ],
  },
  {
    id: 'scan',
    name: '代码安全扫描',
    desc: '执行 SAST 与依赖漏洞扫描，输出风险清单。',
    steps: [
      { level: 'info', text: '启动 SAST 扫描（SonarQube）' },
      { level: 'info', text: '扫描源码 1,204 文件' },
      { level: 'warn', text: '发现 1 处 SQL 拼接风险（已标记待修复）' },
      { level: 'warn', text: '发现 2 处硬编码密钥（待处理）' },
      { level: 'info', text: '启动依赖漏洞扫描（Trivy）' },
      { level: 'info', text: '检查依赖 386 个' },
      { level: 'success', text: '高危漏洞 0，中危 2（非阻断）' },
      { level: 'success', text: '扫描完成，报告已归档' },
    ],
  },
]

/* ============================ 通用：带筛选的表格视图 ============================ */

interface FilterField {
  key: string
  label: string
  type: 'input' | 'select'
  options?: { label: string; value: string }[]
  placeholder?: string
}

interface StatItem {
  label: string
  value: number | string
  suffix?: string
  color?: string
  icon: React.ReactNode
}

function ManageView<T extends Record<string, any>>({
  title,
  columns,
  data,
  filters,
  stats,
}: {
  title: string
  columns: TableColumnsType<T>
  data: T[]
  filters: FilterField[]
  stats?: StatItem[]
}) {
  const [form] = Form.useForm()
  const [applied, setApplied] = useState<Record<string, string>>({})

  const onSearch = () => setApplied(form.getFieldsValue())
  const onReset = () => {
    form.resetFields()
    setApplied({})
  }

  const list = useMemo(
    () =>
      data.filter((row) =>
        filters.every((f) => {
          const v = (applied[f.key] || '').trim()
          if (!v) return true
          const cell = row[f.key]
          if (f.type === 'input') return String(cell ?? '').toLowerCase().includes(v.toLowerCase())
          return cell === v
        }),
      ),
    [data, applied, filters],
  )

  return (
    <div>
      <Title level={4} className="org-page-title">
        {title}
      </Title>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {stats.map((s) => (
            <Col xs={12} sm={12} md={6} key={s.label}>
              <Card className="org-stat-card">
                <div
                  className="org-stat-icon"
                  style={s.color ? { color: s.color, background: s.color + '1a' } : undefined}
                >
                  {s.icon}
                </div>
                <div className="org-stat-body">
                  <div className="org-stat-value">
                    {s.value}
                    {s.suffix && <span className="org-stat-suffix">{s.suffix}</span>}
                  </div>
                  <div className="org-stat-label">{s.label}</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div className="org-search-bar">
        <Form
          form={form}
          layout="horizontal"
          className="org-search-form"
          labelCol={{ flex: '80px' }}
          wrapperCol={{ flex: 'auto' }}
        >
          {filters.map((f) => (
            <Form.Item key={f.key} name={f.key} label={f.label} className="org-filter-item">
              {f.type === 'select' ? (
                <Select allowClear placeholder={f.placeholder || '全部'} options={f.options} />
              ) : (
                <Input allowClear placeholder={f.placeholder} />
              )}
            </Form.Item>
          ))}
          <div className="org-search-btns">
            <Button type="primary" onClick={onSearch}>
              查询
            </Button>
            <Button onClick={onReset}>重置</Button>
          </div>
        </Form>
      </div>

      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />}>
          新增
        </Button>
      </div>

      <Card className="org-card">
        <Table<T>
          columns={columns}
          dataSource={list}
          rowKey="key"
          size="middle"
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  )
}

/* ============================ 执行任务视图 ============================ */

function RunTaskView() {
  const [selected, setSelected] = useState(TASKS[0].id)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'running' | 'success'>('idle')
  const [logs, setLogs] = useState<{ time: string; level: LogLevel; text: string }[]>([])
  const timerRef = useRef<number | null>(null)
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  // 日志更新后自动滚动到底部
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [logs])

  const now = () => new Date().toLocaleTimeString('zh-CN', { hour12: false })

  const run = () => {
    if (running) return
    const task = TASKS.find((t) => t.id === selected)
    if (!task) return
    setRunning(true)
    setStatus('running')
    setProgress(0)
    setLogs([{ time: now(), level: 'info', text: `▶ 开始执行任务：${task.name}` }])

    let i = 0
    const steps = task.steps
    const tick = () => {
      if (i >= steps.length) {
        setProgress(100)
        setStatus('success')
        setLogs((p) => [...p, { time: now(), level: 'success', text: `✔ 任务执行完成：${task.name}` }])
        setRunning(false)
        return
      }
      const s = steps[i]
      setLogs((p) => [...p, { time: now(), level: s.level, text: s.text }])
      setProgress(Math.min(100, Math.round(((i + 1) / steps.length) * 100)))
      i += 1
      timerRef.current = window.setTimeout(tick, 420 + Math.random() * 360)
    }
    timerRef.current = window.setTimeout(tick, 280)
  }

  const reset = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    setRunning(false)
    setStatus('idle')
    setProgress(0)
    setLogs([])
  }

  const current = TASKS.find((t) => t.id === selected)

  return (
    <div>
      <Title level={4} className="org-page-title">
        执行任务
      </Title>

      <Card className="ag-runner">
        <div className="ag-runner-bar">
          <div className="ag-task-pick">
            <span className="ag-task-label">选择任务</span>
            <Select
              value={selected}
              onChange={(v) => setSelected(v)}
              disabled={running}
              style={{ width: 340 }}
              options={TASKS.map((t) => ({ label: t.name, value: t.id }))}
            />
          </div>
          <div className="ag-runner-actions">
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={run}
              disabled={running}
              loading={running}
            >
              {running ? '执行中…' : '执行'}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={reset} disabled={running}>
              重置
            </Button>
          </div>
        </div>

        {current && <div className="ag-task-desc">{current.desc}</div>}

        <div className="ag-progress-wrap">
          <div className="ag-progress-head">
            <span>执行进度</span>
            <span className="ag-progress-pct">{progress}%</span>
          </div>
          <Progress
            percent={progress}
            status={status === 'running' ? 'active' : status === 'success' ? 'success' : 'normal'}
            strokeColor={{ from: '#7c3aed', to: '#3b5bff' }}
          />
        </div>

        <div className="ag-terminal" ref={termRef}>
          {logs.length === 0 ? (
            <div className="ag-log-line ag-log-empty">
              // 选择任务后点击「执行」，实时日志将在此处逐行打印
            </div>
          ) : (
            logs.map((l, idx) => (
              <div className="ag-log-line" key={idx}>
                <span className="ag-log-time">{l.time}</span>
                <span className={`ag-log-level-${l.level}`}>{l.text}</span>
              </div>
            ))
          )}
          {running && <div className="ag-log-line ag-log-cursor">▋</div>}
        </div>
      </Card>
    </div>
  )
}

/* ============================ 迭代管理 ============================ */

interface SprintRow {
  key: string
  name: string
  goal: string
  owner: string
  status: string
  start: string
  end: string
  progress: number
}

const sprintData: SprintRow[] = [
  { key: '1', name: 'S2026-09 三季度冲刺', goal: '完成支付链路重构', owner: '李航', status: '进行中', start: '2026-09-01', end: '2026-09-28', progress: 72 },
  { key: '2', name: 'S2026-10 双十一备战', goal: '大促链路压测与扩容', owner: '王璐', status: '进行中', start: '2026-10-08', end: '2026-10-31', progress: 35 },
  { key: '3', name: 'S2026-08 安全合规', goal: '等保三级整改', owner: '陈昊', status: '已完成', start: '2026-08-01', end: '2026-08-29', progress: 100 },
  { key: '4', name: 'S2026-11 数据中台', goal: '统一指标平台建设', owner: '赵敏', status: '规划中', start: '2026-11-03', end: '2026-11-28', progress: 0 },
  { key: '5', name: 'S2026-07 移动端改版', goal: 'App 5.0 设计落地', owner: '周凯', status: '已归档', start: '2026-07-01', end: '2026-07-31', progress: 100 },
  { key: '6', name: 'S2026-06 稳定性专项', goal: '容灾演练与限流', owner: '孙琳', status: '已归档', start: '2026-06-02', end: '2026-06-30', progress: 100 },
  { key: '7', name: 'S2026-12 出海试点', goal: '多语言与汇率能力', owner: '吴桐', status: '规划中', start: '2026-12-01', end: '2026-12-26', progress: 0 },
  { key: '8', name: 'S2026-09b 性能优化', goal: '首页加载降至 1.5s', owner: '李航', status: '已完成', start: '2026-09-15', end: '2026-09-30', progress: 100 },
  { key: '9', name: 'S2026-10b 搜索重构', goal: '向量召回上线', owner: '王璐', status: '进行中', start: '2026-10-10', end: '2026-11-07', progress: 22 },
  { key: '10', name: 'S2026-08b 数据治理', goal: '主数据清洗', owner: '赵敏', status: '已完成', start: '2026-08-04', end: '2026-08-22', progress: 100 },
]

const sprintStatusColor: Record<string, string> = {
  规划中: 'blue',
  进行中: 'green',
  已完成: 'default',
  已归档: 'default',
}

function SprintView() {
  const columns: TableColumnsType<SprintRow> = [
    { title: '迭代名称', dataIndex: 'name', key: 'name', width: 180, render: (n) => <span className="ag-name-text">{n}</span> },
    { title: '迭代目标', dataIndex: 'goal', key: 'goal' },
    { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (s: string) => <Tag color={sprintStatusColor[s]}>{s}</Tag>,
    },
    { title: '开始日期', dataIndex: 'start', key: 'start', width: 120 },
    { title: '结束日期', dataIndex: 'end', key: 'end', width: 120 },
    {
      title: '完成进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 160,
      render: (p: number) => <Progress percent={p} size="small" />,
    },
  ]

  const active = sprintData.filter((s) => s.status === '进行中').length
  const planned = sprintData.filter((s) => s.status === '规划中').length
  const done = sprintData.filter((s) => s.status === '已完成' || s.status === '已归档').length
  const avg = Math.round(sprintData.reduce((a, s) => a + s.progress, 0) / sprintData.length)

  return (
    <ManageView
      title="迭代管理"
      columns={columns}
      data={sprintData}
      filters={[
        { key: 'name', label: '迭代名称', type: 'input', placeholder: '输入迭代名称' },
        { key: 'status', label: '状态', type: 'select', placeholder: '全部', options: Object.keys(sprintStatusColor).map((s) => ({ label: s, value: s })) },
        { key: 'owner', label: '负责人', type: 'input', placeholder: '输入负责人' },
      ]}
      stats={[
        { label: '进行中迭代', value: active, suffix: '个', color: '#16a34a', icon: <SyncOutlined /> },
        { label: '规划中迭代', value: planned, suffix: '个', color: '#2563eb', icon: <ProjectOutlined /> },
        { label: '已结项迭代', value: done, suffix: '个', color: '#64748b', icon: <CheckCircleOutlined /> },
        { label: '平均完成度', value: avg, suffix: '%', color: '#7c3aed', icon: <WarningOutlined /> },
      ]}
    />
  )
}

/* ============================ 需求池 ============================ */

interface BacklogRow {
  key: string
  no: string
  title: string
  priority: string
  status: string
  proposer: string
  sprint: string
}

const backlogData: BacklogRow[] = [
  { key: '1', no: 'R-1024', title: '订单详情页支持导出 PDF', priority: '中', status: '已排期', proposer: '林悦', sprint: 'S2026-10' },
  { key: '2', no: 'R-1025', title: '会员等级体系重构', priority: '高', status: '已采纳', proposer: '陈昊', sprint: 'S2026-11' },
  { key: '3', no: 'R-1026', title: '后台批量导入员工', priority: '中', status: '待评审', proposer: '赵敏', sprint: '—' },
  { key: '4', no: 'R-1027', title: '消息中心已读未读聚合', priority: '低', status: '待评审', proposer: '王璐', sprint: '—' },
  { key: '5', no: 'R-1028', title: '支付结果实时推送', priority: '高', status: '已排期', proposer: '李航', sprint: 'S2026-09' },
  { key: '6', no: 'R-1029', title: '工单系统对接企微', priority: '中', status: '已拒绝', proposer: '孙琳', sprint: '—' },
  { key: '7', no: 'R-1030', title: '多租户数据隔离', priority: '高', status: '已采纳', proposer: '吴桐', sprint: 'S2026-12' },
  { key: '8', no: 'R-1031', title: '首页卡片可拖拽排序', priority: '低', status: '待评审', proposer: '周凯', sprint: '—' },
  { key: '9', no: 'R-1032', title: '审批流程加签支持', priority: '中', status: '已排期', proposer: '林悦', sprint: 'S2026-10' },
  { key: '10', no: 'R-1033', title: '数据大屏移动端适配', priority: '中', status: '已采纳', proposer: '赵敏', sprint: 'S2026-11' },
]

const priorityColor: Record<string, string> = { 高: 'red', 中: 'gold', 低: 'default' }
const backlogStatusColor: Record<string, string> = {
  待评审: 'blue',
  已采纳: 'cyan',
  已排期: 'green',
  已拒绝: 'default',
}

function BacklogView() {
  const columns: TableColumnsType<BacklogRow> = [
    { title: '需求编号', dataIndex: 'no', key: 'no', width: 110 },
    { title: '需求标题', dataIndex: 'title', key: 'title', render: (t) => <span className="ag-name-text">{t}</span> },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      align: 'center',
      render: (p: string) => <Tag color={priorityColor[p]}>{p}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (s: string) => <Tag color={backlogStatusColor[s]}>{s}</Tag>,
    },
    { title: '提出人', dataIndex: 'proposer', key: 'proposer', width: 100 },
    { title: '归属迭代', dataIndex: 'sprint', key: 'sprint', width: 120 },
  ]

  const total = backlogData.length
  const high = backlogData.filter((r) => r.priority === '高').length
  const scheduled = backlogData.filter((r) => r.status === '已排期').length
  const pending = backlogData.filter((r) => r.status === '待评审').length

  return (
    <ManageView
      title="需求池"
      columns={columns}
      data={backlogData}
      filters={[
        { key: 'title', label: '需求标题', type: 'input', placeholder: '输入标题关键字' },
        { key: 'priority', label: '优先级', type: 'select', placeholder: '全部', options: Object.keys(priorityColor).map((p) => ({ label: p, value: p })) },
        { key: 'status', label: '状态', type: 'select', placeholder: '全部', options: Object.keys(backlogStatusColor).map((s) => ({ label: s, value: s })) },
      ]}
      stats={[
        { label: '需求总数', value: total, suffix: '条', color: '#2563eb', icon: <SolutionOutlined /> },
        { label: '高优先级', value: high, suffix: '条', color: '#dc2626', icon: <WarningOutlined /> },
        { label: '已排期', value: scheduled, suffix: '条', color: '#16a34a', icon: <CheckCircleOutlined /> },
        { label: '待评审', value: pending, suffix: '条', color: '#7c3aed', icon: <SyncOutlined /> },
      ]}
    />
  )
}

/* ============================ 缺陷管理 ============================ */

interface BugRow {
  key: string
  no: string
  title: string
  severity: string
  status: string
  assignee: string
  created: string
}

const bugData: BugRow[] = [
  { key: '1', no: 'B-3301', title: '支付回调偶发重复入账', severity: '致命', status: '处理中', assignee: '李航', created: '2026-10-12' },
  { key: '2', no: 'B-3302', title: '导出 Excel 中文乱码', severity: '一般', status: '已修复', assignee: '周凯', created: '2026-10-11' },
  { key: '3', no: 'B-3303', title: '首页轮播在 Safari 错位', severity: '轻微', status: '新建', assignee: '吴桐', created: '2026-10-13' },
  { key: '4', no: 'B-3304', title: '高并发下库存超卖', severity: '严重', status: '处理中', assignee: '陈昊', created: '2026-10-10' },
  { key: '5', no: 'B-3305', title: '消息红点不消失', severity: '一般', status: '已关闭', assignee: '林悦', created: '2026-10-08' },
  { key: '6', no: 'B-3306', title: '深色模式对比度不足', severity: '轻微', status: '已修复', assignee: '赵敏', created: '2026-10-09' },
  { key: '7', no: 'B-3307', title: '接口鉴权绕过风险', severity: '致命', status: '已关闭', assignee: '王璐', created: '2026-10-07' },
  { key: '8', no: 'B-3308', title: '大文件上传超时', severity: '严重', status: '新建', assignee: '孙琳', created: '2026-10-14' },
  { key: '9', no: 'B-3309', title: '分页在百页后卡顿', severity: '一般', status: '处理中', assignee: '周凯', created: '2026-10-12' },
  { key: '10', no: 'B-3310', title: '移动端弹层遮罩穿透', severity: '轻微', status: '已修复', assignee: '吴桐', created: '2026-10-11' },
]

const severityColor: Record<string, string> = { 致命: 'red', 严重: 'volcano', 一般: 'gold', 轻微: 'default' }
const bugStatusColor: Record<string, string> = {
  新建: 'blue',
  处理中: 'gold',
  已修复: 'cyan',
  已关闭: 'default',
}

function BugView() {
  const columns: TableColumnsType<BugRow> = [
    { title: '缺陷编号', dataIndex: 'no', key: 'no', width: 110 },
    { title: '缺陷标题', dataIndex: 'title', key: 'title', render: (t) => <span className="ag-name-text">{t}</span> },
    {
      title: '严重度',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      align: 'center',
      render: (s: string) => <Tag color={severityColor[s]}>{s}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (s: string) => <Tag color={bugStatusColor[s]}>{s}</Tag>,
    },
    { title: '指派给', dataIndex: 'assignee', key: 'assignee', width: 100 },
    { title: '创建日期', dataIndex: 'created', key: 'created', width: 120 },
  ]

  const open = bugData.filter((b) => b.status === '新建' || b.status === '处理中').length
  const fixed = bugData.filter((b) => b.status === '已修复').length
  const closed = bugData.filter((b) => b.status === '已关闭').length
  const critical = bugData.filter((b) => b.severity === '致命' || b.severity === '严重').length

  return (
    <ManageView
      title="缺陷管理"
      columns={columns}
      data={bugData}
      filters={[
        { key: 'title', label: '缺陷标题', type: 'input', placeholder: '输入标题关键字' },
        { key: 'severity', label: '严重度', type: 'select', placeholder: '全部', options: Object.keys(severityColor).map((s) => ({ label: s, value: s })) },
        { key: 'status', label: '状态', type: 'select', placeholder: '全部', options: Object.keys(bugStatusColor).map((s) => ({ label: s, value: s })) },
      ]}
      stats={[
        { label: '待处理', value: open, suffix: '个', color: '#dc2626', icon: <StopOutlined /> },
        { label: '已修复', value: fixed, suffix: '个', color: '#0891b2', icon: <SyncOutlined /> },
        { label: '已关闭', value: closed, suffix: '个', color: '#64748b', icon: <CheckCircleOutlined /> },
        { label: '严重及以上', value: critical, suffix: '个', color: '#7c3aed', icon: <WarningOutlined /> },
      ]}
    />
  )
}

/* ============================ 主组件 ============================ */

type MenuKey = 'run' | 'sprint' | 'backlog' | 'bug'

const MENU_STORAGE_KEY = 'agiledev:menu'

const menuLabelMap: Record<MenuKey, string> = {
  run: '执行任务',
  sprint: '迭代管理',
  backlog: '需求池',
  bug: '缺陷管理',
}

export default function AgileDev() {
  const [menu, setMenu] = useState<MenuKey>(() => (localStorage.getItem(MENU_STORAGE_KEY) as MenuKey) || 'run')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    localStorage.setItem(MENU_STORAGE_KEY, menu)
  }, [menu])

  const menuItems = [
    { key: 'run', icon: <ThunderboltOutlined />, label: '执行任务' },
    { key: 'sprint', icon: <ProjectOutlined />, label: '迭代管理' },
    { key: 'backlog', icon: <SolutionOutlined />, label: '需求池' },
    { key: 'bug', icon: <BugOutlined />, label: '缺陷管理' },
  ]

  const breadcrumb = (
    <>
      <Button
        type="text"
        className="sider-collapse-btn"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed((c) => !c)}
        aria-label="收起/展开菜单"
      />
      <Breadcrumb items={[{ title: '敏捷开发' }, { title: menuLabelMap[menu] }]} />
    </>
  )

  return (
    <Layout className="org-layout">
      <Navbar solid title="敏捷开发" breadcrumb={breadcrumb} siderRight={collapsed ? 80 : 220} collapsed={collapsed} />
      <div className="org-body">
        <aside className={`org-sider${collapsed ? ' collapsed' : ''}`}>
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[menu]}
            items={menuItems}
            onClick={({ key }) => setMenu(key as MenuKey)}
          />
        </aside>
        <Content className="org-content">
          <div className="org-container">
            {menu === 'run' && <RunTaskView />}
            {menu === 'sprint' && <SprintView />}
            {menu === 'backlog' && <BacklogView />}
            {menu === 'bug' && <BugView />}
          </div>
        </Content>
      </div>
    </Layout>
  )
}
