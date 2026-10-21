import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Layout,
  Menu,
  Typography,
  Button,
  Select,
  Breadcrumb,
  Progress,
  Tag,
  Tooltip,
  Input,
  Avatar,
  Table,
  Badge,
  Card,
  Tabs,
  Drawer,
  Modal,
  Empty,
  message,
} from 'antd'
import {
  ThunderboltOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  RightOutlined,
  DownOutlined,
  BranchesOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled,
  SyncOutlined,
  MinusCircleFilled,
  PlayCircleFilled,
  UserOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  MergeOutlined,
  SwapRightOutlined,
  MessageOutlined,
  LikeOutlined,
  DislikeOutlined,
  FileTextOutlined,
  CodeOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  TableOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  ApiOutlined,
  EyeOutlined,
  ProfileOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import Navbar from '../components/Navbar'
import './agileDev.css'

const { Content } = Layout
const { Title, Text } = Typography

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

/* ============================ 流水线（GitLab Pipeline 风格）============================ */

type PipelineStatus = 'success' | 'running' | 'failed' | 'pending' | 'canceled' | 'manual'

interface PipelineJob {
  name: string
  status: PipelineStatus
  duration: string
}

interface PipelineStage {
  name: string
  status: PipelineStatus
  jobs: PipelineJob[]
}

interface Pipeline {
  id: number
  sha: string
  branch: string
  tag?: boolean
  commit: string
  author: string
  status: PipelineStatus
  duration: string
  createdAt: string
  stages: PipelineStage[]
}

const STATUS_ICON: Record<PipelineStatus, React.ReactNode> = {
  success: <CheckCircleFilled style={{ color: '#1aaa55' }} />,
  running: <SyncOutlined spin style={{ color: '#1b7cec' }} />,
  failed: <CloseCircleFilled style={{ color: '#db3b21' }} />,
  pending: <ClockCircleFilled style={{ color: '#db7b21' }} />,
  canceled: <MinusCircleFilled style={{ color: '#8c8c8c' }} />,
  manual: <PlayCircleFilled style={{ color: '#6e49cb' }} />,
}

const STATUS_LABEL: Record<PipelineStatus, string> = {
  success: '通过',
  running: '运行中',
  failed: '失败',
  pending: '等待中',
  canceled: '已取消',
  manual: '手动',
}

const STATUS_TAG_COLOR: Record<PipelineStatus, string> = {
  success: 'success',
  running: 'processing',
  failed: 'error',
  pending: 'warning',
  canceled: 'default',
  manual: 'purple',
}

const PIPELINES: Pipeline[] = [
  {
    id: 2847,
    sha: 'a3f7c2d',
    branch: 'main',
    commit: 'fix: 修复支付回调重复入账问题',
    author: '李航',
    status: 'success',
    duration: '4m 32s',
    createdAt: '10 分钟前',
    stages: [
      { name: 'build', status: 'success', jobs: [{ name: 'compile', status: 'success', duration: '1m 20s' }, { name: 'lint', status: 'success', duration: '28s' }] },
      { name: 'test', status: 'success', jobs: [{ name: 'unit-test', status: 'success', duration: '52s' }, { name: 'integration-test', status: 'success', duration: '1m 05s' }] },
      { name: 'deploy', status: 'success', jobs: [{ name: 'deploy-prod', status: 'success', duration: '47s' }] },
    ],
  },
  {
    id: 2846,
    sha: 'e8b1f4a',
    branch: 'feature/payment-v3',
    commit: 'feat: 新增微信支付分账能力',
    author: '王璐',
    status: 'running',
    duration: '2m 18s',
    createdAt: '23 分钟前',
    stages: [
      { name: 'build', status: 'success', jobs: [{ name: 'compile', status: 'success', duration: '1m 35s' }, { name: 'lint', status: 'success', duration: '31s' }] },
      { name: 'test', status: 'running', jobs: [{ name: 'unit-test', status: 'success', duration: '48s' }, { name: 'integration-test', status: 'running', duration: '24s' }] },
      { name: 'deploy', status: 'pending', jobs: [{ name: 'deploy-staging', status: 'pending', duration: '—' }] },
    ],
  },
  {
    id: 2845,
    sha: 'c2d9e7b',
    branch: 'hotfix/order-timeout',
    tag: true,
    commit: 'hotfix: 订单超时时间从 30s 调至 60s',
    author: '陈昊',
    status: 'failed',
    duration: '3m 41s',
    createdAt: '1 小时前',
    stages: [
      { name: 'build', status: 'success', jobs: [{ name: 'compile', status: 'success', duration: '1m 12s' }] },
      { name: 'test', status: 'failed', jobs: [{ name: 'unit-test', status: 'success', duration: '45s' }, { name: 'e2e-test', status: 'failed', duration: '1m 44s' }] },
      { name: 'deploy', status: 'canceled', jobs: [{ name: 'deploy-prod', status: 'canceled', duration: '—' }] },
    ],
  },
  {
    id: 2844,
    sha: 'f5a3d8c',
    branch: 'main',
    commit: 'chore: 升级 Spring Boot 至 3.4.1',
    author: '赵敏',
    status: 'success',
    duration: '5m 17s',
    createdAt: '2 小时前',
    stages: [
      { name: 'build', status: 'success', jobs: [{ name: 'compile', status: 'success', duration: '1m 48s' }, { name: 'lint', status: 'success', duration: '32s' }] },
      { name: 'test', status: 'success', jobs: [{ name: 'unit-test', status: 'success', duration: '1m 02s' }, { name: 'integration-test', status: 'success', duration: '1m 11s' }] },
      { name: 'security', status: 'success', jobs: [{ name: 'sast-scan', status: 'success', duration: '28s' }, { name: 'dependency-check', status: 'success', duration: '16s' }] },
      { name: 'deploy', status: 'success', jobs: [{ name: 'deploy-prod', status: 'success', duration: '—' }] },
    ],
  },
  {
    id: 2843,
    sha: '9c7e2f1',
    branch: 'feature/user-center',
    commit: 'feat: 用户中心页面重构',
    author: '林悦',
    status: 'pending',
    duration: '—',
    createdAt: '3 小时前',
    stages: [
      { name: 'build', status: 'pending', jobs: [{ name: 'compile', status: 'pending', duration: '—' }] },
      { name: 'test', status: 'pending', jobs: [{ name: 'unit-test', status: 'pending', duration: '—' }] },
      { name: 'deploy', status: 'pending', jobs: [{ name: 'deploy-staging', status: 'pending', duration: '—' }] },
    ],
  },
  {
    id: 2842,
    sha: 'b4d6a8e',
    branch: 'main',
    commit: 'refactor: 统一异常处理与响应格式',
    author: '周凯',
    status: 'canceled',
    duration: '0m 52s',
    createdAt: '5 小时前',
    stages: [
      { name: 'build', status: 'success', jobs: [{ name: 'compile', status: 'success', duration: '52s' }] },
      { name: 'test', status: 'canceled', jobs: [{ name: 'unit-test', status: 'canceled', duration: '—' }] },
    ],
  },
  {
    id: 2841,
    sha: '7f1c3b9',
    branch: 'feature/dashboard-v2',
    commit: 'feat: 数据大屏 2.0 设计稿落地',
    author: '吴桐',
    status: 'manual',
    duration: '3m 28s',
    createdAt: '昨天 18:32',
    stages: [
      { name: 'build', status: 'success', jobs: [{ name: 'compile', status: 'success', duration: '1m 33s' }] },
      { name: 'test', status: 'success', jobs: [{ name: 'unit-test', status: 'success', duration: '42s' }, { name: 'visual-test', status: 'success', duration: '1m 13s' }] },
      { name: 'deploy', status: 'manual', jobs: [{ name: 'deploy-prod', status: 'manual', duration: '—' }] },
    ],
  },
  {
    id: 2840,
    sha: 'd2e8f5a',
    branch: 'hotfix/session-leak',
    tag: true,
    commit: 'hotfix: 修复 Redis session 泄漏',
    author: '孙琳',
    status: 'success',
    duration: '2m 56s',
    createdAt: '昨天 14:17',
    stages: [
      { name: 'build', status: 'success', jobs: [{ name: 'compile', status: 'success', duration: '1m 01s' }] },
      { name: 'test', status: 'success', jobs: [{ name: 'unit-test', status: 'success', duration: '38s' }] },
      { name: 'deploy', status: 'success', jobs: [{ name: 'deploy-prod', status: 'success', duration: '1m 17s' }] },
    ],
  },
]

/** 阶段小圆点 + 连接线（GitLab 经典样式） */
function StageDots({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="ag-stage-dots">
      {stages.map((s, i) => (
        <span key={s.name} className="ag-stage-group">
          {i > 0 && <span className="ag-stage-line" />}
          <Tooltip title={`${s.name}：${STATUS_LABEL[s.status]}`}>
            <span className={`ag-stage-dot ag-stage-dot-${s.status}`} />
          </Tooltip>
        </span>
      ))}
    </div>
  )
}

/** 流水线视图 */
function PipelineView() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [branchFilter, setBranchFilter] = useState<string>('')

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = PIPELINES.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false
    if (branchFilter && !p.branch.toLowerCase().includes(branchFilter.toLowerCase())) return false
    return true
  })

  const stats = {
    total: PIPELINES.length,
    success: PIPELINES.filter((p) => p.status === 'success').length,
    running: PIPELINES.filter((p) => p.status === 'running').length,
    failed: PIPELINES.filter((p) => p.status === 'failed').length,
  }

  return (
    <div>
      <Title level={4} className="org-page-title">
        流水线
      </Title>

      {/* 统计概览 */}
      <div className="ag-pipe-stats">
        <div className="ag-pipe-stat">
          <span className="ag-pipe-stat-val">{stats.total}</span>
          <span className="ag-pipe-stat-lbl">全部</span>
        </div>
        <div className="ag-pipe-stat ag-pipe-stat-success">
          <CheckCircleFilled />
          <span className="ag-pipe-stat-val">{stats.success}</span>
          <span className="ag-pipe-stat-lbl">通过</span>
        </div>
        <div className="ag-pipe-stat ag-pipe-stat-running">
          <SyncOutlined spin />
          <span className="ag-pipe-stat-val">{stats.running}</span>
          <span className="ag-pipe-stat-lbl">运行中</span>
        </div>
        <div className="ag-pipe-stat ag-pipe-stat-failed">
          <CloseCircleFilled />
          <span className="ag-pipe-stat-val">{stats.failed}</span>
          <span className="ag-pipe-stat-lbl">失败</span>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="ag-pipe-filter">
        <FilterOutlined style={{ color: '#5b647a', marginRight: 6 }} />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 130 }}
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v || '')}
          options={Object.entries(STATUS_LABEL).map(([k, v]) => ({ label: v, value: k }))}
        />
        <Input
          allowClear
          placeholder="分支名称"
          style={{ width: 200 }}
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          prefix={<BranchesOutlined style={{ color: '#94a3b8' }} />}
        />
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          共 {filtered.length} 条流水线
        </Text>
      </div>

      {/* 流水线列表 */}
      <div className="ag-pipe-list">
        {filtered.map((p) => {
          const isOpen = expanded.has(p.id)
          return (
            <div key={p.id} className={`ag-pipe-row${isOpen ? ' ag-pipe-row-open' : ''}`}>
              {/* 主行 */}
              <div className="ag-pipe-main" onClick={() => toggleExpand(p.id)}>
                <span className="ag-pipe-toggle">{isOpen ? <DownOutlined /> : <RightOutlined />}</span>
                <span className="ag-pipe-status-icon">{STATUS_ICON[p.status]}</span>
                <span className="ag-pipe-id">#{p.id}</span>
                <Tag color={p.tag ? 'orange' : 'blue'} className="ag-pipe-branch">
                  <BranchesOutlined /> {p.branch}
                </Tag>
                <span className="ag-pipe-commit">
                  {p.commit} <Text type="secondary" className="ag-pipe-sha">({p.sha})</Text>
                </span>
                <span className="ag-pipe-stages-cell">
                  <StageDots stages={p.stages} />
                </span>
                <span className="ag-pipe-meta">
                  <span className="ag-pipe-author"><UserOutlined /> {p.author}</span>
                  <span className="ag-pipe-duration"><ClockCircleOutlined /> {p.duration}</span>
                  <span className="ag-pipe-time">{p.createdAt}</span>
                </span>
              </div>

              {/* 展开详情：阶段 + 作业 */}
              {isOpen && (
                <div className="ag-pipe-detail">
                  <div className="ag-pipe-detail-head">
                    <span>流水线 #{p.id}</span>
                    <Tag color={STATUS_TAG_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Tag>
                    <span className="ag-pipe-detail-branch">{p.branch}</span>
                    <span className="ag-pipe-detail-commit">{p.commit}</span>
                  </div>
                  <div className="ag-pipe-stages">
                    {p.stages.map((stage) => (
                      <div key={stage.name} className="ag-pipe-stage">
                        <div className={`ag-pipe-stage-head ag-pipe-stage-head-${stage.status}`}>
                          <span className="ag-pipe-stage-dot-lg">
                            {STATUS_ICON[stage.status]}
                          </span>
                          <span className="ag-pipe-stage-name">{stage.name}</span>
                        </div>
                        <div className="ag-pipe-jobs">
                          {stage.jobs.map((job) => (
                            <div key={job.name} className={`ag-pipe-job ag-pipe-job-${job.status}`}>
                              <span className="ag-pipe-job-icon">{STATUS_ICON[job.status]}</span>
                              <span className="ag-pipe-job-name">{job.name}</span>
                              <span className="ag-pipe-job-dur">{job.duration}</span>
                              {job.status === 'failed' && (
                                <Button size="small" type="link" className="ag-pipe-job-retry">
                                  重试
                                </Button>
                              )}
                              {job.status === 'manual' && (
                                <Button size="small" type="primary" className="ag-pipe-job-run">
                                  执行
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================ 代码审查（GitLab Merge Request 风格）============================ */

type MRState = 'open' | 'merged' | 'closed'

interface MRLabel {
  name: string
  color: string
}

interface FileChange {
  path: string
  added: number
  removed: number
  type: 'added' | 'modified' | 'deleted' | 'renamed'
  diff: string[]
  split?: SplitRow[]
}

/* 分栏 diff 行（左右对照） */
interface SplitSide {
  ln: number | null
  text: string
}
interface SplitRow {
  kind: 'ctx' | 'add' | 'del' | 'chg'
  left: SplitSide
  right: SplitSide
}

/** 将内联 diff 文本转换为左右对照的分栏行 */
function buildSplit(lines: string[]): SplitRow[] {
  const rows: SplitRow[] = []
  let oldLn = 12
  let newLn = 12
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('-')) {
      const next = lines[i + 1]
      if (next && next.startsWith('+')) {
        rows.push({
          kind: 'chg',
          left: { ln: oldLn++, text: next.slice(0, 0) + line.slice(1) },
          right: { ln: newLn++, text: next.slice(1) },
        })
        i += 2
        continue
      }
      rows.push({ kind: 'del', left: { ln: oldLn++, text: line.slice(1) }, right: { ln: null, text: '' } })
      i += 1
      continue
    }
    if (line.startsWith('+')) {
      rows.push({ kind: 'add', left: { ln: null, text: '' }, right: { ln: newLn++, text: line.slice(1) } })
      i += 1
      continue
    }
    const txt = line.startsWith('  ') ? line.slice(2) : line
    rows.push({ kind: 'ctx', left: { ln: oldLn++, text: txt }, right: { ln: newLn++, text: txt } })
    i += 1
  }
  return rows
}

interface MergeRequest {
  id: number
  title: string
  state: MRState
  sourceBranch: string
  targetBranch: string
  author: string
  authorAvatar: string
  assignees: string[]
  labels: MRLabel[]
  milestone?: string
  createdAt: string
  updatedAt: string
  comments: number
  upvotes: number
  downvotes: number
  pipelineStatus: 'success' | 'running' | 'failed' | 'pending' | 'none'
  additions: number
  deletions: number
  changedFiles: number
  description: string
  files: FileChange[]
}

const MR_STATE_ICON: Record<MRState, React.ReactNode> = {
  open: <MergeOutlined style={{ color: '#1b7cec' }} />,
  merged: <CheckOutlined style={{ color: '#a63ed0' }} />,
  closed: <CloseOutlined style={{ color: '#db3b21' }} />,
}

const MR_STATE_LABEL: Record<MRState, string> = {
  open: '开启',
  merged: '已合并',
  closed: '已关闭',
}

const MR_STATE_TAG: Record<MRState, string> = {
  open: 'processing',
  merged: 'purple',
  closed: 'error',
}

const LABELS: Record<string, MRLabel> = {
  feature: { name: '~feature', color: '#1b7cec' },
  bugfix: { name: '~bugfix', color: '#db3b21' },
  security: { name: '~security', color: '#e24343' },
  performance: { name: '~performance', color: '#f0ad4e' },
  docs: { name: '~docs', color: '#4a7edc' },
  refactor: { name: '~refactor', color: '#6e49cb' },
  backend: { name: '~backend', color: '#1aaa55' },
  frontend: { name: '~frontend', color: '#fc6d26' },
}

const AVATAR_COLORS = ['#7c3aed', '#1b7cec', '#1aaa55', '#db3b21', '#f0ad4e', '#6e49cb', '#fc6d26', '#0891b2']

const MERGE_REQUESTS: MergeRequest[] = [
  {
    id: 142,
    title: 'feat: 新增微信支付分账能力',
    state: 'open',
    sourceBranch: 'feature/payment-v3',
    targetBranch: 'main',
    author: '王璐',
    authorAvatar: '王',
    assignees: ['李航'],
    labels: [LABELS.feature, LABELS.backend],
    milestone: 'S2026-10 双十一备战',
    createdAt: '2 小时前',
    updatedAt: '15 分钟前',
    comments: 12,
    upvotes: 3,
    downvotes: 0,
    pipelineStatus: 'running',
    additions: 847,
    deletions: 123,
    changedFiles: 14,
    description: '实现微信支付分账接口对接，支持多商户分账、分账回退及分账查询。包含单元测试和集成测试。',
    files: [
      { path: 'src/services/payment/wechat-fenbei.ts', added: 284, removed: 0, type: 'added', diff: ['+export class WechatFenbeiService {', '+  async createFenbei(params: FenbeiParams) {', '+    const resp = await this.http.post(...);', '+    return resp.data;', '+  }', '+}'] },
      { path: 'src/services/payment/wechat-fenbei.spec.ts', added: 196, removed: 0, type: 'added', diff: ['+describe("WechatFenbeiService", () => {', '+  it("should create fenbei", async () => {', '+    const result = await service.createFenbei({...});', '+    expect(result.success).toBe(true);', '+  });', '+});'] },
      { path: 'src/controllers/payment.controller.ts', added: 42, removed: 8, type: 'modified', diff: ['-  async pay(ctx) {', '+  async pay(ctx: PayContext) {', '+    if (ctx.fenbei) {', '+      await this.fenbeiService.createFenbei(ctx.fenbei);', '+    }', '+    return this.paymentService.execute(ctx);', '  }'] },
      { path: 'src/routes/payment.routes.ts', added: 15, removed: 3, type: 'modified', diff: ['+  router.post("/fenbei/create", auth, ctrl.createFenbei);', '+  router.post("/fenbei/query", auth, ctrl.queryFenbei);', '+  router.post("/fenbei/refund", auth, ctrl.refundFenbei);'] },
    ],
  },
  {
    id: 141,
    title: 'fix: 修复支付回调重复入账问题',
    state: 'merged',
    sourceBranch: 'hotfix/payment-duplicate',
    targetBranch: 'main',
    author: '李航',
    authorAvatar: '李',
    assignees: ['王璐'],
    labels: [LABELS.bugfix, LABELS.backend],
    createdAt: '昨天 16:42',
    updatedAt: '昨天 19:08',
    comments: 8,
    upvotes: 4,
    downvotes: 0,
    pipelineStatus: 'success',
    additions: 56,
    deletions: 23,
    changedFiles: 4,
    description: '引入幂等键（idempotency key）防止回调重试导致重复入账。已在预发环境验证通过。',
    files: [
      { path: 'src/services/payment/callback-handler.ts', added: 28, removed: 12, type: 'modified', diff: ['-  async handleCallback(raw: string) {', '+  async handleCallback(raw: string, idempotencyKey: string) {', '+    const existing = await this.cache.get(idempotencyKey);', '+    if (existing) return existing;', '+    const result = await this.processCallback(raw);', '+    await this.cache.set(idempotencyKey, result, 3600);', '+    return result;', '  }'] },
      { path: 'src/services/payment/callback-handler.spec.ts', added: 24, removed: 6, type: 'modified', diff: ['+  it("should deduplicate callback", async () => {', '+    const r1 = await handler.handleCallback(raw, "key-1");', '+    const r2 = await handler.handleCallback(raw, "key-1");', '+    expect(r1).toEqual(r2);', '+  });'] },
    ],
  },
  {
    id: 140,
    title: 'feat: 用户中心页面重构',
    state: 'open',
    sourceBranch: 'feature/user-center',
    targetBranch: 'main',
    author: '林悦',
    authorAvatar: '林',
    assignees: [],
    labels: [LABELS.feature, LABELS.frontend],
    milestone: 'S2026-11 数据中台',
    createdAt: '昨天 11:30',
    updatedAt: '昨天 17:55',
    comments: 21,
    upvotes: 5,
    downvotes: 1,
    pipelineStatus: 'failed',
    additions: 2134,
    deletions: 876,
    changedFiles: 38,
    description: '使用 React 18 + Ant Design 6 重构用户中心页面，包含个人资料、安全设置、通知偏好三个模块。',
    files: [
      { path: 'src/pages/UserCenter/index.tsx', added: 142, removed: 0, type: 'added', diff: ['+export default function UserCenter() {', '+  return (', '+    <Layout className="uc-layout">', '+      <ProfileModule />', '+      <SecurityModule />', '+      <NotificationModule />', '+    </Layout>', '+  );', '+}'] },
      { path: 'src/pages/UserCenter/profile.tsx', added: 186, removed: 0, type: 'added', diff: ['+export function ProfileModule() {', '+  const [form] = Form.useForm();', '+  // ...', '+}'] },
      { path: 'src/pages/UserCenter/old-index.tsx', added: 0, removed: 423, type: 'deleted', diff: ['-export default class UserCenter extends Component {', '-  // legacy code removed', '-}'] },
    ],
  },
  {
    id: 139,
    title: 'perf: 首页加载优化（代码分割 + 预加载）',
    state: 'merged',
    sourceBranch: 'feature/home-perf',
    targetBranch: 'main',
    author: '周凯',
    authorAvatar: '周',
    assignees: ['周凯'],
    labels: [LABELS.performance, LABELS.frontend],
    createdAt: '3 天前',
    updatedAt: '2 天前',
    comments: 6,
    upvotes: 7,
    downvotes: 0,
    pipelineStatus: 'success',
    additions: 89,
    deletions: 45,
    changedFiles: 8,
    description: '通过 React.lazy + Suspense 实现路由级代码分割，首屏 JS 从 2.1MB 降至 680KB，LCP 从 3.2s 降至 1.4s。',
    files: [
      { path: 'src/App.tsx', added: 32, removed: 15, type: 'modified', diff: ['-import PolicyCenter from "./pages/PolicyCenter"', '+const PolicyCenter = React.lazy(() => import("./pages/PolicyCenter"))', '+const OrgCenter = React.lazy(() => import("./pages/OrgCenter"))'] },
      { path: 'src/routes/lazy.tsx', added: 24, removed: 0, type: 'added', diff: ['+export function LazyRoute({ component }: { component: string }) {', '+  const Comp = React.lazy(() => import(`./pages/${component}`));', '+  return <Suspense fallback={<Spin />}><Comp /></Suspense>;', '+}'] },
    ],
  },
  {
    id: 138,
    title: 'refactor: 统一异常处理与响应格式',
    state: 'merged',
    sourceBranch: 'refactor/exception-handler',
    targetBranch: 'main',
    author: '赵敏',
    authorAvatar: '赵',
    assignees: ['赵敏', '陈昊'],
    labels: [LABELS.refactor, LABELS.backend],
    createdAt: '4 天前',
    updatedAt: '3 天前',
    comments: 9,
    upvotes: 2,
    downvotes: 0,
    pipelineStatus: 'success',
    additions: 167,
    deletions: 203,
    changedFiles: 11,
    description: '引入全局异常过滤器（@Catch），统一 HTTP 响应格式为 { code, message, data }，移除各 Controller 中的重复 try-catch。',
    files: [
      { path: 'src/filters/all-exception.filter.ts', added: 45, removed: 0, type: 'added', diff: ['+@Catch()', '+export class AllExceptionFilter implements ExceptionFilter {', '+  catch(exception: unknown, host: ArgumentsHost) {', '+    // unified error handling', '+  }', '+}'] },
      { path: 'src/controllers/order.controller.ts', added: 12, removed: 34, type: 'modified', diff: ['-  async create() {', '-    try {', '-      return await this.service.create();', '-    } catch (e) {', '-      throw new HttpException(e.message, 500);', '-    }', '-  }', '+  async create() {', '+    return await this.service.create();', '+  }'] },
    ],
  },
  {
    id: 137,
    title: 'feat: 消息中心已读未读聚合与实时推送',
    state: 'open',
    sourceBranch: 'feature/message-center',
    targetBranch: 'main',
    author: '吴桐',
    authorAvatar: '吴',
    assignees: ['林悦'],
    labels: [LABELS.feature, LABELS.backend, LABELS.frontend],
    milestone: 'S2026-10 双十一备战',
    createdAt: '4 天前',
    updatedAt: '3 天前',
    comments: 3,
    upvotes: 1,
    downvotes: 0,
    pipelineStatus: 'pending',
    additions: 423,
    deletions: 56,
    changedFiles: 9,
    description: '基于 WebSocket 实现消息实时推送，前端消息列表支持已读未读聚合、批量标记已读。',
    files: [
      { path: 'src/services/message/ws-gateway.ts', added: 78, removed: 0, type: 'added', diff: ['+@WebSocketGateway()', '+export class MessageGateway {', '+  @SubscribeMessage("subscribe")', '+  handleSubscribe(client: Socket) {', '+    // ...', '+  }', '+}'] },
    ],
  },
  {
    id: 136,
    title: 'docs: API 文档补充与示例更新',
    state: 'merged',
    sourceBranch: 'docs/api-docs',
    targetBranch: 'main',
    author: '孙琳',
    authorAvatar: '孙',
    assignees: [],
    labels: [LABELS.docs],
    createdAt: '5 天前',
    updatedAt: '4 天前',
    comments: 2,
    upvotes: 0,
    downvotes: 0,
    pipelineStatus: 'success',
    additions: 312,
    deletions: 28,
    changedFiles: 6,
    description: '补充支付、订单、用户三个模块的 API 文档，增加 cURL 和 SDK 调用示例。',
    files: [
      { path: 'docs/api/payment.md', added: 124, removed: 8, type: 'modified', diff: ['+### 分账接口', '+', '+`POST /api/v3/payment/fenbei/create`', '+', '+```bash', '+curl -X POST ...', '+```'] },
    ],
  },
  {
    id: 135,
    title: 'fix: 高并发下库存超卖问题',
    state: 'closed',
    sourceBranch: 'hotfix/stock-oversell',
    targetBranch: 'main',
    author: '陈昊',
    authorAvatar: '陈',
    assignees: ['李航'],
    labels: [LABELS.bugfix, LABELS.backend, LABELS.security],
    createdAt: '5 天前',
    updatedAt: '5 天前',
    comments: 15,
    upvotes: 0,
    downvotes: 3,
    pipelineStatus: 'failed',
    additions: 34,
    deletions: 12,
    changedFiles: 3,
    description: '原方案（Redis DECR + 判断）在极端并发下仍有超卖窗口，关闭后改为分布式锁方案（见 MR #148）。',
    files: [
      { path: 'src/services/stock/service.ts', added: 18, removed: 8, type: 'modified', diff: ['-  async deduct(skuId: string, qty: number) {', '-    const remain = await this.redis.decrby(key, qty);', '-    if (remain < 0) throw new Error("stock不足");', '-  }', '+  async deduct(skuId: string, qty: number) {', '+    const lock = await this.redis.set(`${key}:lock`, "1", "NX", "EX", 5);', '+    if (!lock) throw new Error("系统繁忙");', '+    // ...', '+  }'] },
    ],
  },
]

// 预计算每个文件的左右对照分栏 diff
MERGE_REQUESTS.forEach((mr) => mr.files.forEach((f) => (f.split = buildSplit(f.diff))))

/** 文件变更图标 */
const FILE_TYPE_ICON: Record<FileChange['type'], React.ReactNode> = {
  added: <PlusOutlined style={{ color: '#1aaa55' }} />,
  modified: <CodeOutlined style={{ color: '#1b7cec' }} />,
  deleted: <CloseOutlined style={{ color: '#db3b21' }} />,
  renamed: <ArrowRightOutlined style={{ color: '#f0ad4e' }} />,
}

/** MR 详情：左右分栏人工审查（左=文件导航，右=对照 diff） */
function MRDetail({ mr }: { mr: MergeRequest }) {
  const [activePath, setActivePath] = useState(mr.files[0]?.path ?? '')
  const activeFile = mr.files.find((f) => f.path === activePath) ?? mr.files[0]

  return (
    <div className="ag-mr-detail">
      <div className="ag-mr-detail-head">
        <span className="ag-mr-detail-state">{MR_STATE_ICON[mr.state]}</span>
        <span className="ag-mr-detail-title">!{mr.id} {mr.title}</span>
        <Tag color={MR_STATE_TAG[mr.state]}>{MR_STATE_LABEL[mr.state]}</Tag>
        <span className="ag-mr-changes-summary ag-mr-changes-inline">
          <span className="ag-mr-changes-add">+{mr.additions}</span>
          <span className="ag-mr-changes-del">-{mr.deletions}</span>
          <span className="ag-mr-changes-files">{mr.changedFiles} 文件</span>
        </span>
      </div>

      {/* 元信息条 */}
      <div className="ag-mr-meta-strip">
        <span><b>分支</b><Tag>{mr.sourceBranch}</Tag><SwapRightOutlined style={{ color: '#94a3b8', margin: '0 4px' }} /><Tag>{mr.targetBranch}</Tag></span>
        <span><b>作者</b>{mr.author}</span>
        {mr.assignees.length > 0 && <span><b>审查人</b>{mr.assignees.join('、')}</span>}
        {mr.milestone && <span><b>里程碑</b>{mr.milestone}</span>}
      </div>
      <div className="ag-mr-desc ag-mr-desc-inline">{mr.description}</div>

      {/* 左右分栏：左文件导航 + 右对照 diff */}
      <div className="ag-mr-review">
        <aside className="ag-mr-file-nav">
          <div className="ag-mr-file-nav-title"><FileTextOutlined /> 变更文件</div>
          {mr.files.map((f) => (
            <button
              key={f.path}
              className={`ag-mr-nav-item${f.path === activeFile?.path ? ' ag-mr-nav-active' : ''}${f.type === 'deleted' ? ' ag-mr-nav-del' : ''}${f.type === 'added' ? ' ag-mr-nav-add' : ''}`}
              onClick={() => setActivePath(f.path)}
            >
              <span className="ag-mr-nav-icon">{FILE_TYPE_ICON[f.type]}</span>
              <span className="ag-mr-nav-path">{f.path}</span>
              <span className="ag-mr-nav-stats">
                <span className="ag-mr-file-add">+{f.added}</span>
                <span className="ag-mr-file-del">-{f.removed}</span>
              </span>
            </button>
          ))}
        </aside>

        <div className="ag-mr-diff-pane">
          {activeFile && (
            <>
              <div className="ag-mr-diff-file-head">
                <CodeOutlined /> {activeFile.path}
                <span className="ag-mr-diff-file-type">{FILE_TYPE_LABEL[activeFile.type]}</span>
              </div>
              <div className="ag-mr-split">
                <div className="ag-mr-split-col-head">原文件 (a)</div>
                <div className="ag-mr-split-col-head">新文件 (b)</div>
                {activeFile.split!.map((row, idx) => (
                  <SplitRowView key={idx} row={row} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** 单个分栏 diff 行（左右对照） */
function SplitRowView({ row }: { row: SplitRow }) {
  const lCls = row.kind === 'del' || row.kind === 'chg' ? 'ag-split-del' : row.kind === 'ctx' ? '' : ''
  const rCls = row.kind === 'add' || row.kind === 'chg' ? 'ag-split-add' : row.kind === 'ctx' ? '' : ''
  return (
    <>
      <div className={`ag-split-gutter ag-split-gutter-l ag-split-${row.kind}`}>{row.left.ln ?? ''}</div>
      <div className={`ag-split-code${lCls ? ' ' + lCls : ''}`}>{row.left.text || ' '}</div>
      <div className={`ag-split-gutter ag-split-gutter-r ag-split-${row.kind}`}>{row.right.ln ?? ''}</div>
      <div className={`ag-split-code${rCls ? ' ' + rCls : ''}`}>{row.right.text || ' '}</div>
    </>
  )
}

const FILE_TYPE_LABEL: Record<FileChange['type'], string> = {
  added: '新增',
  modified: '修改',
  deleted: '删除',
  renamed: '重命名',
}

/** 代码审查视图 */
function CodeReviewView() {
  const [tab, setTab] = useState<MRState | 'all'>('open')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [authorFilter, setAuthorFilter] = useState<string>('')

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = MERGE_REQUESTS.filter((mr) => {
    if (tab !== 'all' && mr.state !== tab) return false
    if (search && !mr.title.toLowerCase().includes(search.toLowerCase()) && !mr.sourceBranch.toLowerCase().includes(search.toLowerCase())) return false
    if (authorFilter && mr.author !== authorFilter) return false
    return true
  })

  const counts = {
    open: MERGE_REQUESTS.filter((m) => m.state === 'open').length,
    merged: MERGE_REQUESTS.filter((m) => m.state === 'merged').length,
    closed: MERGE_REQUESTS.filter((m) => m.state === 'closed').length,
    all: MERGE_REQUESTS.length,
  }

  const allAuthors = [...new Set(MERGE_REQUESTS.map((m) => m.author))]

  return (
    <div>
      <Title level={4} className="org-page-title">
        代码审查
      </Title>

      {/* Tab 栏（GitLab MR 状态切换） */}
      <div className="ag-mr-tabs">
        {(['open', 'merged', 'closed', 'all'] as const).map((t) => {
          const active = tab === t
          return (
            <button
              key={t}
              className={`ag-mr-tab${active ? ' ag-mr-tab-active' : ''}${t !== 'all' ? ` ag-mr-tab-${t}` : ''}`}
              onClick={() => setTab(t)}
            >
              {t !== 'all' && <span className="ag-mr-tab-icon">{MR_STATE_ICON[t as MRState]}</span>}
              {t === 'all' && <span className="ag-mr-tab-icon"><FileTextOutlined /></span>}
              {MR_STATE_LABEL[t as MRState] || '全部'}
              <span className="ag-mr-tab-count">{counts[t]}</span>
            </button>
          )
        })}
      </div>

      {/* 筛选栏 */}
      <div className="ag-mr-filter">
        <Input
          allowClear
          placeholder="搜索标题或分支…"
          style={{ width: 260 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<FilterOutlined style={{ color: '#94a3b8' }} />}
        />
        <Select
          allowClear
          placeholder="作者"
          style={{ width: 120 }}
          value={authorFilter || undefined}
          onChange={(v) => setAuthorFilter(v || '')}
          options={allAuthors.map((a) => ({ label: a, value: a }))}
        />
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          共 {filtered.length} 条合并请求
        </Text>
      </div>

      {/* MR 列表 */}
      <div className="ag-mr-list">
        {filtered.map((mr) => {
          const isOpen = expanded.has(mr.id)
          return (
            <div key={mr.id} className={`ag-mr-row${isOpen ? ' ag-mr-row-open' : ''}`}>
              {/* 主行 */}
              <div className="ag-mr-main" onClick={() => toggleExpand(mr.id)}>
                <span className="ag-mr-state-icon">{MR_STATE_ICON[mr.state]}</span>
                <span className="ag-mr-id">!{mr.id}</span>
                <span className="ag-mr-title">{mr.title}</span>
                <span className="ag-mr-labels">
                  {mr.labels.map((l) => (
                    <Tag key={l.name} className="ag-mr-label" style={{ background: l.color + '1a', borderColor: l.color, color: l.color }}>
                      {l.name}
                    </Tag>
                  ))}
                </span>
                <span className="ag-mr-branch-flow">
                  <Tag className="ag-mr-src-branch">{mr.sourceBranch}</Tag>
                  <SwapRightOutlined style={{ color: '#94a3b8', margin: '0 2px' }} />
                  <Tag className="ag-mr-tgt-branch">{mr.targetBranch}</Tag>
                </span>
                <span className="ag-mr-right-meta">
                  {mr.pipelineStatus !== 'none' && (
                    <span className="ag-mr-pipeline">
                      {STATUS_ICON[mr.pipelineStatus as PipelineStatus]}
                    </span>
                  )}
                  {mr.comments > 0 && <span className="ag-mr-comments"><MessageOutlined /> {mr.comments}</span>}
                  {mr.upvotes > 0 && <span className="ag-mr-vote ag-mr-upvote"><LikeOutlined /> {mr.upvotes}</span>}
                  {mr.downvotes > 0 && <span className="ag-mr-vote ag-mr-downvote"><DislikeOutlined /> {mr.downvotes}</span>}
                  <Avatar size={22} className="ag-mr-avatar" style={{ background: AVATAR_COLORS[mr.id % AVATAR_COLORS.length], fontSize: 12 }}>
                    {mr.authorAvatar}
                  </Avatar>
                  <span className="ag-mr-time">{mr.updatedAt}</span>
                </span>
              </div>

              {/* 展开详情：左右分栏人工审查 */}
              {isOpen && <MRDetail mr={mr} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================ 数据库管理（phpMyAdmin / Navicat 风格）============================ */

type ColumnKey = 'PRI' | 'UNI' | 'MUL' | ''

interface DbColumn {
  name: string
  type: string
  nullable: boolean
  key: ColumnKey
  default: string | null
  extra: string
  comment: string
}

interface DbTable {
  name: string
  engine: string
  rowCount: number
  avgRowLen: number
  dataLen: number
  indexLen: number
  createTime: string
  updateTime: string
  comment: string
  columns: DbColumn[]
}

const DB_TABLES: DbTable[] = [
  {
    name: 't_user',
    engine: 'InnoDB',
    rowCount: 128456,
    avgRowLen: 186,
    dataLen: 23897600,
    indexLen: 8243200,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-10-18 09:14:22',
    comment: '用户基础信息表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '主键ID' },
      { name: 'username', type: 'varchar(64)', nullable: false, key: 'UNI', default: null, extra: '', comment: '用户名（登录账号）' },
      { name: 'password_hash', type: 'varchar(128)', nullable: false, key: '', default: null, extra: '', comment: '密码哈希值' },
      { name: 'real_name', type: 'varchar(32)', nullable: true, key: '', default: null, extra: '', comment: '真实姓名' },
      { name: 'email', type: 'varchar(128)', nullable: true, key: 'UNI', default: null, extra: '', comment: '邮箱地址' },
      { name: 'phone', type: 'varchar(20)', nullable: true, key: '', default: null, extra: '', comment: '手机号' },
      { name: 'avatar_url', type: 'varchar(256)', nullable: true, key: '', default: null, extra: '', comment: '头像地址' },
      { name: 'status', type: 'tinyint(1)', nullable: false, key: '', default: '1', extra: '', comment: '状态：0禁用 1启用' },
      { name: 'dept_id', type: 'bigint(20)', nullable: true, key: 'MUL', default: null, extra: '', comment: '所属部门ID' },
      { name: 'last_login_at', type: 'datetime', nullable: true, key: '', default: null, extra: '', comment: '最后登录时间' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
      { name: 'updated_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: 'ON UPDATE CURRENT_TIMESTAMP', comment: '更新时间' },
    ],
  },
  {
    name: 't_role',
    engine: 'InnoDB',
    rowCount: 28,
    avgRowLen: 128,
    dataLen: 4096,
    indexLen: 8192,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-09-05 14:30:00',
    comment: '角色表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '主键ID' },
      { name: 'code', type: 'varchar(32)', nullable: false, key: 'UNI', default: null, extra: '', comment: '角色编码' },
      { name: 'name', type: 'varchar(64)', nullable: false, key: '', default: null, extra: '', comment: '角色名称' },
      { name: 'description', type: 'varchar(256)', nullable: true, key: '', default: null, extra: '', comment: '角色描述' },
      { name: 'sort_order', type: 'int(11)', nullable: false, key: '', default: '0', extra: '', comment: '排序号' },
      { name: 'status', type: 'tinyint(1)', nullable: false, key: '', default: '1', extra: '', comment: '状态' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
    ],
  },
  {
    name: 't_user_role',
    engine: 'InnoDB',
    rowCount: 256892,
    avgRowLen: 48,
    dataLen: 12345600,
    indexLen: 9876480,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-10-18 09:14:22',
    comment: '用户-角色关联表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '主键ID' },
      { name: 'user_id', type: 'bigint(20)', nullable: false, key: 'MUL', default: null, extra: '', comment: '用户ID' },
      { name: 'role_id', type: 'bigint(20)', nullable: false, key: 'MUL', default: null, extra: '', comment: '角色ID' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
    ],
  },
  {
    name: 't_order',
    engine: 'InnoDB',
    rowCount: 3847521,
    avgRowLen: 312,
    dataLen: 1200328704,
    indexLen: 384105728,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-10-19 08:52:17',
    comment: '订单主表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '订单ID' },
      { name: 'order_no', type: 'varchar(32)', nullable: false, key: 'UNI', default: null, extra: '', comment: '订单编号' },
      { name: 'user_id', type: 'bigint(20)', nullable: false, key: 'MUL', default: null, extra: '', comment: '下单用户ID' },
      { name: 'total_amount', type: 'decimal(12,2)', nullable: false, key: '', default: null, extra: '', comment: '订单总金额' },
      { name: 'pay_amount', type: 'decimal(12,2)', nullable: false, key: '', default: null, extra: '', comment: '实付金额' },
      { name: 'channel', type: 'varchar(16)', nullable: true, key: '', default: null, extra: '', comment: '支付渠道' },
      { name: 'status', type: 'tinyint(2)', nullable: false, key: 'MUL', default: '0', extra: '', comment: '订单状态：0待支付 1已支付 2已发货 3已完成 9已取消' },
      { name: 'address_id', type: 'bigint(20)', nullable: true, key: '', default: null, extra: '', comment: '收货地址ID' },
      { name: 'remark', type: 'varchar(512)', nullable: true, key: '', default: null, extra: '', comment: '订单备注' },
      { name: 'paid_at', type: 'datetime', nullable: true, key: '', default: null, extra: '', comment: '支付时间' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
      { name: 'updated_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: 'ON UPDATE CURRENT_TIMESTAMP', comment: '更新时间' },
    ],
  },
  {
    name: 't_order_item',
    engine: 'InnoDB',
    rowCount: 9682140,
    avgRowLen: 168,
    dataLen: 1626659520,
    indexLen: 512000000,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-10-19 08:52:17',
    comment: '订单明细表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '明细ID' },
      { name: 'order_id', type: 'bigint(20)', nullable: false, key: 'MUL', default: null, extra: '', comment: '订单ID' },
      { name: 'sku_id', type: 'bigint(20)', nullable: false, key: 'MUL', default: null, extra: '', comment: '商品SKU ID' },
      { name: 'quantity', type: 'int(11)', nullable: false, key: '', default: null, extra: '', comment: '购买数量' },
      { name: 'unit_price', type: 'decimal(12,2)', nullable: false, key: '', default: null, extra: '', comment: '单价' },
      { name: 'subtotal', type: 'decimal(12,2)', nullable: false, key: '', default: null, extra: '', comment: '小计金额' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
    ],
  },
  {
    name: 't_product',
    engine: 'InnoDB',
    rowCount: 45890,
    avgRowLen: 420,
    dataLen: 19271680,
    indexLen: 8243200,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-10-18 16:41:33',
    comment: '商品表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '商品ID' },
      { name: 'name', type: 'varchar(128)', nullable: false, key: '', default: null, extra: '', comment: '商品名称' },
      { name: 'category_id', type: 'bigint(20)', nullable: true, key: 'MUL', default: null, extra: '', comment: '分类ID' },
      { name: 'brand', type: 'varchar(64)', nullable: true, key: '', default: null, extra: '', comment: '品牌' },
      { name: 'status', type: 'tinyint(1)', nullable: false, key: '', default: '1', extra: '', comment: '状态：0下架 1上架' },
      { name: 'base_price', type: 'decimal(12,2)', nullable: false, key: '', default: null, extra: '', comment: '基础价格' },
      { name: 'description', type: 'text', nullable: true, key: '', default: null, extra: '', comment: '商品描述' },
      { name: 'main_image', type: 'varchar(256)', nullable: true, key: '', default: null, extra: '', comment: '主图URL' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
      { name: 'updated_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: 'ON UPDATE CURRENT_TIMESTAMP', comment: '更新时间' },
    ],
  },
  {
    name: 't_payment',
    engine: 'InnoDB',
    rowCount: 3612450,
    avgRowLen: 224,
    dataLen: 809179200,
    indexLen: 256000000,
    createTime: '2026-03-15 08:00:00',
    updateTime: '2026-10-19 08:52:17',
    comment: '支付流水表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '流水ID' },
      { name: 'payment_no', type: 'varchar(32)', nullable: false, key: 'UNI', default: null, extra: '', comment: '支付流水号' },
      { name: 'order_id', type: 'bigint(20)', nullable: false, key: 'MUL', default: null, extra: '', comment: '关联订单ID' },
      { name: 'channel', type: 'varchar(16)', nullable: false, key: 'MUL', default: null, extra: '', comment: '支付渠道（wechat/alipay/unionpay）' },
      { name: 'amount', type: 'decimal(12,2)', nullable: false, key: '', default: null, extra: '', comment: '支付金额' },
      { name: 'status', type: 'tinyint(2)', nullable: false, key: '', default: '0', extra: '', comment: '状态：0待支付 1成功 2失败 3退款中 4已退款' },
      { name: 'callback_raw', type: 'text', nullable: true, key: '', default: null, extra: '', comment: '回调原始报文' },
      { name: 'paid_at', type: 'datetime', nullable: true, key: '', default: null, extra: '', comment: '支付完成时间' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
    ],
  },
  {
    name: 't_menu',
    engine: 'InnoDB',
    rowCount: 156,
    avgRowLen: 256,
    dataLen: 40960,
    indexLen: 32768,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-08-22 11:05:00',
    comment: '系统菜单表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '菜单ID' },
      { name: 'parent_id', type: 'bigint(20)', nullable: true, key: 'MUL', default: '0', extra: '', comment: '父菜单ID' },
      { name: 'name', type: 'varchar(64)', nullable: false, key: '', default: null, extra: '', comment: '菜单名称' },
      { name: 'path', type: 'varchar(128)', nullable: true, key: '', default: null, extra: '', comment: '路由路径' },
      { name: 'icon', type: 'varchar(32)', nullable: true, key: '', default: null, extra: '', comment: '图标' },
      { name: 'sort_order', type: 'int(11)', nullable: false, key: '', default: '0', extra: '', comment: '排序号' },
      { name: 'visible', type: 'tinyint(1)', nullable: false, key: '', default: '1', extra: '', comment: '是否可见' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
    ],
  },
  {
    name: 't_dict',
    engine: 'InnoDB',
    rowCount: 890,
    avgRowLen: 128,
    dataLen: 114688,
    indexLen: 65536,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-10-10 15:30:00',
    comment: '数据字典表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '主键' },
      { name: 'group_code', type: 'varchar(32)', nullable: false, key: 'MUL', default: null, extra: '', comment: '分组编码' },
      { name: 'item_code', type: 'varchar(32)', nullable: false, key: '', default: null, extra: '', comment: '项编码' },
      { name: 'item_name', type: 'varchar(64)', nullable: false, key: '', default: null, extra: '', comment: '项名称' },
      { name: 'sort_order', type: 'int(11)', nullable: false, key: '', default: '0', extra: '', comment: '排序号' },
      { name: 'status', type: 'tinyint(1)', nullable: false, key: '', default: '1', extra: '', comment: '状态' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '创建时间' },
    ],
  },
  {
    name: 't_operation_log',
    engine: 'InnoDB',
    rowCount: 18472630,
    avgRowLen: 356,
    dataLen: 6576658688,
    indexLen: 2951603200,
    createTime: '2026-03-12 10:23:45',
    updateTime: '2026-10-19 08:52:17',
    comment: '操作日志表',
    columns: [
      { name: 'id', type: 'bigint(20)', nullable: false, key: 'PRI', default: null, extra: 'auto_increment', comment: '日志ID' },
      { name: 'user_id', type: 'bigint(20)', nullable: true, key: 'MUL', default: null, extra: '', comment: '操作人ID' },
      { name: 'module', type: 'varchar(32)', nullable: false, key: 'MUL', default: null, extra: '', comment: '操作模块' },
      { name: 'action', type: 'varchar(32)', nullable: false, key: '', default: null, extra: '', comment: '操作类型' },
      { name: 'target_id', type: 'varchar(64)', nullable: true, key: '', default: null, extra: '', comment: '操作对象ID' },
      { name: 'detail', type: 'text', nullable: true, key: '', default: null, extra: '', comment: '操作详情' },
      { name: 'ip', type: 'varchar(45)', nullable: true, key: '', default: null, extra: '', comment: '请求IP' },
      { name: 'created_at', type: 'datetime', nullable: false, key: '', default: 'CURRENT_TIMESTAMP', extra: '', comment: '操作时间' },
    ],
  },
]

/** 格式化字节数 */
function fmtBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(2) + ' GB'
}

/** 格式化行数 */
function fmtNum(n: number): string {
  return n.toLocaleString('zh-CN')
}

/* ============================ 表详情：字段 / 视图 / 业务 / 动作 ============================ */

type ViewType = 'list' | 'form'
interface DbView {
  id: string
  name: string
  type: ViewType
  fields: string[]
  desc: string
}
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
interface DbAction {
  id: string
  name: string
  method: HttpMethod
  path: string
  desc: string
  status: 'enabled' | 'disabled'
}
interface DbBusiness {
  id: string
  name: string
  viewId: string
  actionId: string
  trigger: string
  status: 'active' | 'paused'
}

const METHOD_COLOR: Record<HttpMethod, string> = { GET: 'blue', POST: 'green', PUT: 'gold', DELETE: 'red' }
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** 根据字段自动构建视图（列表 / 表单） */
function buildViews(t: DbTable): DbView[] {
  const editable = t.columns.filter(
    (c) => c.key !== 'PRI' && !c.extra.includes('auto_increment') && !['created_at', 'updated_at', 'deleted_at'].includes(c.name),
  )
  const keyFields = t.columns
    .filter((c) => ['PRI', 'UNI'].includes(c.key) || ['username', 'name', 'title', 'order_no', 'code', 'payment_no'].includes(c.name))
    .slice(0, 5)
  const listFields = (keyFields.length ? keyFields : t.columns.slice(0, 5)).map((c) => c.name)
  const formFields = (editable.length ? editable : t.columns).slice(0, 8).map((c) => c.name)
  return [
    { id: t.name + ':list', name: '数据列表', type: 'list', fields: listFields, desc: '分页展示表数据' },
    { id: t.name + ':create', name: '新增表单', type: 'form', fields: formFields, desc: '录入新记录的表单页面' },
    { id: t.name + ':edit', name: '编辑表单', type: 'form', fields: formFields, desc: '修改记录的表单页面' },
    { id: t.name + ':detail', name: '详情视图', type: 'list', fields: t.columns.slice(0, 6).map((c) => c.name), desc: '单条记录字段明细' },
  ]
}

/** 根据表名自动构建接口动作 */
function buildActions(t: DbTable): DbAction[] {
  const base = '/api/' + t.name.replace(/^t_/, '')
  return [
    { id: t.name + ':list', name: '分页查询', method: 'GET', path: base + '/page', desc: '分页获取列表数据', status: 'enabled' },
    { id: t.name + ':get', name: '获取详情', method: 'GET', path: base + '/{id}', desc: '按主键获取单条记录', status: 'enabled' },
    { id: t.name + ':create', name: '新增记录', method: 'POST', path: base, desc: '插入一条新记录', status: 'enabled' },
    { id: t.name + ':update', name: '更新记录', method: 'PUT', path: base + '/{id}', desc: '按主键更新记录', status: 'enabled' },
    { id: t.name + ':delete', name: '删除记录', method: 'DELETE', path: base + '/{id}', desc: '按主键删除记录', status: 'enabled' },
    { id: t.name + ':export', name: '导出Excel', method: 'GET', path: base + '/export', desc: '导出全量数据', status: 'disabled' },
  ]
}

/** 预置业务 */
function buildBusiness(t: DbTable): DbBusiness[] {
  const views = buildViews(t)
  const actions = buildActions(t)
  return [
    { id: t.name + ':b1', name: t.comment + '录入', viewId: views[1].id, actionId: actions[2].id, trigger: '手动', status: 'active' },
    { id: t.name + ':b2', name: t.comment + '查询', viewId: views[0].id, actionId: actions[0].id, trigger: '事件', status: 'active' },
    { id: t.name + ':b3', name: t.comment + '同步', viewId: views[3].id, actionId: actions[1].id, trigger: '定时', status: 'paused' },
  ]
}

/** 按字段类型生成演示数据 */
function mockValue(c: DbColumn): string {
  const n = c.name.toLowerCase()
  if (c.key === 'PRI' || n === 'id' || n.endsWith('_id')) return String(1000 + Math.floor(Math.random() * 8999))
  if (n.includes('no') || n.includes('code')) return 'NO' + Math.floor(Math.random() * 9e8 + 1e8)
  if (n.includes('username') || n.includes('real_name') || (n.includes('name') && c.type.includes('varchar'))) return pick(['张伟', '李娜', '王芳', '刘洋', '陈静', '赵磊', '孙悦', '周强'])
  if (n.includes('email')) return 'user' + Math.floor(Math.random() * 900 + 100) + '@example.com'
  if (n.includes('phone')) return '1' + pick(['38', '39', '37', '59', '58', '88']) + String(Math.floor(Math.random() * 1e8)).padStart(8, '0')
  if (c.type.includes('decimal') || c.type.includes('int') || c.type.includes('bigint')) {
    if (n.includes('amount') || n.includes('price') || n.includes('total') || n.includes('subtotal') || n.includes('pay')) return (Math.random() * 1000).toFixed(2)
    if (n.includes('count') || n.includes('len') || n.includes('size')) return String(Math.floor(Math.random() * 500))
    return String(Math.floor(Math.random() * 100000))
  }
  if (c.type === 'datetime' || n.includes('at') || n.includes('time')) {
    const d = new Date(2026, 9, 1 + Math.floor(Math.random() * 18), Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
    const p = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  }
  if (n.includes('status')) return pick(['启用', '禁用', '进行中', '已完成', '已取消', '0', '1'])
  if (n.includes('url') || n.includes('image') || n.includes('avatar') || n.includes('main_image')) return 'https://cdn.example.com/res/' + Math.floor(Math.random() * 999)
  if (c.type === 'text') return '这是一段示例描述文本，用于演示视图渲染效果。'
  if (n.includes('comment') || n.includes('remark') || n.includes('description') || n.includes('detail')) return '示例备注内容'
  if (n.includes('ip')) return '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255)
  if (n.includes('channel')) return pick(['wechat', 'alipay', 'unionpay', 'balance'])
  return '示例值'
}

/** 构造接口响应示例 */
function buildMockResponse(a: DbAction, t: DbTable, rows: Record<string, string>[]): unknown {
  const oneRow = () => {
    const o: Record<string, unknown> = {}
    t.columns.slice(0, 6).forEach((c) => (o[c.name] = mockValue(c)))
    return o
  }
  if (a.method === 'GET' && a.path.endsWith('/page')) {
    return {
      code: 0,
      msg: 'success',
      data: {
        list: rows.slice(0, 3).map((r) => {
          const o: Record<string, unknown> = {}
          t.columns.slice(0, 4).forEach((c) => (o[c.name] = r[c.name]))
          return o
        }),
        total: 128,
        page: 1,
        pageSize: 10,
      },
    }
  }
  if (a.method === 'GET') return { code: 0, msg: 'success', data: oneRow() }
  if (a.method === 'DELETE') return { code: 0, msg: 'success', data: null }
  return { code: 0, msg: 'success', data: { id: 1024 } }
}

/** 字段 Tab */
function FieldTab({ t }: { t: DbTable }) {
  const dataSource = t.columns.map((c, idx) => ({
    key: idx,
    name: c.name,
    type: c.type,
    nullable: c.nullable ? 'YES' : 'NO',
    keyType: c.key,
    default: c.default ?? 'NULL',
    extra: c.extra || '—',
    comment: c.comment || '—',
  }))
  return (
    <div className="ag-db-fields-tab">
      <div className="ag-db-columns-title">
        <InfoCircleOutlined /> 字段结构（{t.columns.length} 列）
      </div>
      <Table
        dataSource={dataSource}
        pagination={false}
        size="small"
        className="ag-db-column-table"
        columns={[
          {
            title: '字段名',
            dataIndex: 'name',
            key: 'name',
            width: 160,
            render: (v: string, r: (typeof dataSource)[0]) => (
              <span className="ag-db-col-name">
                {(r.keyType === 'PRI' || r.keyType === 'UNI') && <KeyOutlined className={`ag-db-key-icon ag-db-key-${r.keyType.toLowerCase()}`} />}
                {v}
              </span>
            ),
          },
          { title: '类型', dataIndex: 'type', key: 'type', width: 140, className: 'ag-db-col-mono' },
          { title: '可空', dataIndex: 'nullable', key: 'nullable', width: 60, render: (v: string) => <span className={v === 'NO' ? 'ag-db-not-null' : ''}>{v}</span> },
          {
            title: '键',
            dataIndex: 'keyType',
            key: 'keyType',
            width: 60,
            render: (v: string) =>
              v ? <Badge color={v === 'PRI' ? '#db3b21' : v === 'UNI' ? '#1b7cec' : '#f0ad4e'} text={v} /> : <span className="ag-db-empty">—</span>,
          },
          { title: '默认值', dataIndex: 'default', key: 'default', width: 160, className: 'ag-db-col-mono', render: (v: string) => (v === 'NULL' ? <span className="ag-db-null">NULL</span> : v) },
          { title: '扩展', dataIndex: 'extra', key: 'extra', width: 200, className: 'ag-db-col-mono', render: (v: string) => (v.includes('auto_increment') ? <Tag color="gold">AUTO_INCREMENT</Tag> : v) },
          { title: '注释', dataIndex: 'comment', key: 'comment', ellipsis: true },
        ]}
      />
    </div>
  )
}

/** 表详情主组件（字段 / 视图 / 业务 / 动作 四个 Tab） */
function TableDetail({ table, onBack }: { table: DbTable; onBack: () => void }) {
  const t = table
  const views = useMemo(() => buildViews(t), [t.name])
  const actions = useMemo(() => buildActions(t), [t.name])
  const [business, setBusiness] = useState<DbBusiness[]>(() => buildBusiness(t))
  const [tab, setTab] = useState('fields')
  const [activeView, setActiveView] = useState(views[0].id)
  const [previewBiz, setPreviewBiz] = useState<DbBusiness | null>(null)
  const [debugAction, setDebugAction] = useState<DbAction | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [nbName, setNbName] = useState('')
  const [nbView, setNbView] = useState(views[0].id)
  const [nbAction, setNbAction] = useState(actions[0].id)

  const mockRows = useMemo(
    () =>
      Array.from({ length: 6 }, () => {
        const row: Record<string, string> = {}
        t.columns.forEach((c) => (row[c.name] = mockValue(c)))
        return row
      }),
    [t.name],
  )

  const viewById = (id: string) => views.find((v) => v.id === id)
  const actionById = (id: string) => actions.find((a) => a.id === id)
  const curView = viewById(activeView) || views[0]

  /** 渲染某个视图的内容（列表 / 表单），供 视图 Tab 与 业务预览抽屉共用 */
  const renderViewContent = (view: DbView) => {
    const cols = t.columns.filter((c) => view.fields.includes(c.name))
    if (view.type === 'list') {
      const dataSource = mockRows.map((r, i) => ({ key: i, ...r }))
      return (
        <div className="ag-view-preview">
          <div className="ag-view-preview-bar">
            <span className="ag-view-preview-name">{view.name}</span>
            <Tag color="blue">列表</Tag>
            <span className="ag-view-preview-meta">共 {mockRows.length} 条（演示数据）</span>
            <Button size="small" type="primary" className="ag-view-preview-add" icon={<PlusOutlined />}>
              新增
            </Button>
          </div>
          <Table
            size="small"
            pagination={false}
            dataSource={dataSource}
            scroll={{ x: 'max-content' }}
            columns={cols.map((c) => ({
              title: c.comment || c.name,
              dataIndex: c.name,
              key: c.name,
              ellipsis: true,
              render: (v: string) =>
                c.key === 'PRI' ? (
                  <span className="ag-db-col-name">
                    <KeyOutlined className="ag-db-key-icon ag-db-key-pri" />
                    {v}
                  </span>
                ) : (
                  v
                ),
            }))}
          />
        </div>
      )
    }
    // 表单
    return (
      <div className="ag-view-preview ag-view-form">
        <div className="ag-view-preview-bar">
          <span className="ag-view-preview-name">{view.name}</span>
          <Tag color="purple">表单</Tag>
          <span className="ag-view-preview-meta">{cols.length} 个字段</span>
        </div>
        <div className="ag-view-form-grid">
          {cols.map((c) => (
            <div key={c.name} className="ag-view-form-item">
              <label>
                {c.comment || c.name}
                <span className="ag-view-form-type">{c.type}</span>
                {c.key === 'PRI' && <span className="ag-view-form-pk">PK</span>}
              </label>
              <Input
                defaultValue={mockValue(c)}
                disabled={c.key === 'PRI' || c.extra.includes('auto_increment')}
                placeholder={c.comment || c.name}
              />
            </div>
          ))}
        </div>
        <div className="ag-view-form-actions">
          <Button type="primary" icon={<CheckOutlined />}>
            提交
          </Button>
          <Button icon={<ReloadOutlined />}>重置</Button>
        </div>
      </div>
    )
  }

  /** 视图 Tab */
  const renderViews = () => (
    <div className="ag-db-views-tab">
      <div className="ag-db-views-nav">
        {views.map((v) => (
          <button
            key={v.id}
            className={`ag-view-chip${v.id === activeView ? ' active' : ''}`}
            onClick={() => setActiveView(v.id)}
          >
            <span className="ag-view-chip-name">{v.name}</span>
            <span className="ag-view-chip-type">{v.type === 'list' ? '列表' : '表单'}</span>
          </button>
        ))}
      </div>
      <div className="ag-db-views-preview">{renderViewContent(curView)}</div>
    </div>
  )

  /** 业务 Tab */
  const renderBiz = () => (
    <div className="ag-db-biz-tab">
      <div className="ag-db-biz-bar">
        <span className="ag-db-biz-count">共 {business.length} 条业务流</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewOpen(true)}>
          新建业务
        </Button>
      </div>
      <Table
        size="small"
        pagination={false}
        dataSource={business.map((b, i) => ({ key: i, ...b }))}
        columns={[
          { title: '业务名称', dataIndex: 'name', key: 'name', render: (v) => <span className="ag-biz-name">{v}</span> },
          {
            title: '关联视图',
            dataIndex: 'viewId',
            key: 'viewId',
            render: (id: string) => <Tag color="geekblue">{viewById(id)?.name || id}</Tag>,
          },
          {
            title: '关联动作',
            dataIndex: 'actionId',
            key: 'actionId',
            render: (id: string) => {
              const a = actionById(id)
              return a ? (
                <span className="ag-biz-action">
                  <Badge color={METHOD_COLOR[a.method]} text={a.method} /> {a.name}
                </span>
              ) : (
                id
              )
            },
          },
          { title: '触发方式', dataIndex: 'trigger', key: 'trigger', width: 100, render: (v) => <Tag>{v}</Tag> },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 90,
            render: (v: string) => <Tag color={v === 'active' ? 'success' : 'default'}>{v === 'active' ? '启用' : '暂停'}</Tag>,
          },
          {
            title: '操作',
            key: 'op',
            width: 90,
            render: (_: unknown, r: unknown) => (
              <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewBiz(r as DbBusiness)}>
                查看
              </Button>
            ),
          },
        ]}
      />
    </div>
  )

  /** 动作 Tab */
  const renderActions = () => (
    <div className="ag-db-action-tab">
      <Table
        size="small"
        pagination={false}
        dataSource={actions.map((a, i) => ({ key: i, ...a }))}
        columns={[
          { title: '动作名', dataIndex: 'name', key: 'name', render: (v) => <span className="ag-action-name">{v}</span> },
          { title: '方法', dataIndex: 'method', key: 'method', width: 90, render: (m: HttpMethod) => <Tag color={METHOD_COLOR[m]}>{m}</Tag> },
          { title: '路径', dataIndex: 'path', key: 'path', className: 'ag-mono', ellipsis: true },
          { title: '描述', dataIndex: 'desc', key: 'desc', ellipsis: true },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 90,
            render: (v: string) => <Tag color={v === 'enabled' ? 'success' : 'default'}>{v === 'enabled' ? '启用' : '停用'}</Tag>,
          },
          {
            title: '操作',
            key: 'op',
            width: 90,
            render: (_: unknown, r: unknown) => (
              <Button size="small" icon={<PlayCircleOutlined />} onClick={() => setDebugAction(r as DbAction)}>
                调试
              </Button>
            ),
          },
        ]}
      />
    </div>
  )

  const handleCreateBiz = () => {
    if (!nbName.trim()) {
      message.warning('请填写业务名称')
      return
    }
    setBusiness((b) => [
      { id: t.name + ':b' + (b.length + 1) + '_' + Date.now(), name: nbName.trim(), viewId: nbView, actionId: nbAction, trigger: '手动', status: 'active' },
      ...b,
    ])
    setNbName('')
    setNewOpen(false)
    message.success('业务已创建')
  }

  return (
    <div className="ag-db-detail">
      <div className="ag-db-detail-header">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" className="ag-db-back">
          返回表列表
        </Button>
        <Title level={4} className="org-page-title ag-db-detail-title">
          <TableOutlined /> {t.name}
        </Title>
        <Tag color="blue" className="ag-db-engine-tag">
          {t.engine}
        </Tag>
        <Text type="secondary" className="ag-db-table-comment">
          {t.comment}
        </Text>
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        className="ag-db-tabs"
        items={[
          { key: 'fields', label: <span><InfoCircleOutlined /> 字段</span>, children: <FieldTab t={t} /> },
          { key: 'views', label: <span><AppstoreOutlined /> 视图</span>, children: renderViews() },
          { key: 'business', label: <span><ProfileOutlined /> 业务</span>, children: renderBiz() },
          { key: 'actions', label: <span><ApiOutlined /> 动作</span>, children: renderActions() },
        ]}
      />

      {/* 业务预览抽屉：展示视图内容 + 数据 */}
      <Drawer
        title={previewBiz ? `${previewBiz.name} · 数据预览` : ''}
        width={680}
        open={!!previewBiz}
        onClose={() => setPreviewBiz(null)}
        destroyOnClose
      >
        {previewBiz &&
          (() => {
            const v = viewById(previewBiz.viewId)
            const a = actionById(previewBiz.actionId)
            return (
              <div className="ag-biz-drawer">
                <div className="ag-biz-drawer-alert">
                  <div className="ag-biz-drawer-alert-row">
                    <span>视图</span>
                    <Tag color="geekblue">{v?.name ?? '-'}</Tag>
                    <span>动作</span>
                    <Tag color={a ? METHOD_COLOR[a.method] : 'default'}>{a ? `${a.method} ${a.name}` : '-'}</Tag>
                  </div>
                  <p>
                    该业务调用接口 <code className="ag-mono">{a?.method} {a?.path}</code> 取得数据，并通过「{v?.name}」渲染展示。
                  </p>
                </div>
                <div className="ag-biz-drawer-view">{v ? renderViewContent(v) : <Empty description="视图不存在" />}</div>
              </div>
            )
          })()}
      </Drawer>

      {/* 动作调试抽屉：展示接口响应 */}
      <Drawer
        title={debugAction ? `${debugAction.method} ${debugAction.name}` : ''}
        width={560}
        open={!!debugAction}
        onClose={() => setDebugAction(null)}
        destroyOnClose
      >
        {debugAction && (
          <div className="ag-action-drawer">
            <div className="ag-action-req">
              <div className="ag-action-req-line">
                <Tag color={METHOD_COLOR[debugAction.method]}>{debugAction.method}</Tag>
                <code className="ag-mono">{debugAction.path}</code>
              </div>
              <Text type="secondary">{debugAction.desc}</Text>
            </div>
            <div className="ag-action-resp-title">响应示例</div>
            <pre className="ag-action-json">{JSON.stringify(buildMockResponse(debugAction, t, mockRows), null, 2)}</pre>
          </div>
        )}
      </Drawer>

      {/* 新建业务弹窗 */}
      <Modal
        title="新建业务"
        open={newOpen}
        onOk={handleCreateBiz}
        onCancel={() => setNewOpen(false)}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <div className="ag-newbiz-form">
          <div className="ag-newbiz-field">
            <label>业务名称</label>
            <Input value={nbName} onChange={(e) => setNbName(e.target.value)} placeholder="如：用户批量导出" />
          </div>
          <div className="ag-newbiz-field">
            <label>选择视图</label>
            <Select
              value={nbView}
              onChange={setNbView}
              style={{ width: '100%' }}
              options={views.map((v) => ({ label: `${v.name}（${v.type === 'list' ? '列表' : '表单'}）`, value: v.id }))}
            />
          </div>
          <div className="ag-newbiz-field">
            <label>选择动作</label>
            <Select
              value={nbAction}
              onChange={setNbAction}
              style={{ width: '100%' }}
              options={actions.map((a) => ({ label: `${a.method} ${a.name}`, value: a.id }))}
            />
          </div>
          <div className="ag-newbiz-tip">选择视图与动作后，将生成一条业务流；点击其「操作」列的查看按钮即可展示对应页面内容与数据。</div>
        </div>
      </Modal>
    </div>
  )
}

/** 数据库管理视图 */
function DatabaseView() {
  const [selected, setSelected] = useState<DbTable | null>(null)
  const [search, setSearch] = useState('')
  const [engineFilter, setEngineFilter] = useState<string>('')

  const filtered = DB_TABLES.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.comment.includes(search)) return false
    if (engineFilter && t.engine !== engineFilter) return false
    return true
  })

  const totalRows = filtered.reduce((s, t) => s + t.rowCount, 0)
  const totalDataLen = filtered.reduce((s, t) => s + t.dataLen, 0)
  const totalIndexLen = filtered.reduce((s, t) => s + t.indexLen, 0)

  if (selected) {
    return <TableDetail table={selected} onBack={() => setSelected(null)} />
  }

  /* 表列表视图 */
  return (
    <div>
      <Title level={4} className="org-page-title">
        数据库管理
      </Title>

      {/* 统计概览 */}
      <div className="ag-db-stats">
        <div className="ag-db-stat">
          <DatabaseOutlined style={{ color: '#7c3aed' }} />
          <span className="ag-db-stat-val">{filtered.length}</span>
          <span className="ag-db-stat-lbl">数据表</span>
        </div>
        <div className="ag-db-stat">
          <TableOutlined style={{ color: '#1b7cec' }} />
          <span className="ag-db-stat-val">{fmtNum(totalRows)}</span>
          <span className="ag-db-stat-lbl">总行数</span>
        </div>
        <div className="ag-db-stat">
          <span className="ag-db-stat-val-sm">{fmtBytes(totalDataLen)}</span>
          <span className="ag-db-stat-lbl">数据量</span>
        </div>
        <div className="ag-db-stat">
          <span className="ag-db-stat-val-sm">{fmtBytes(totalIndexLen)}</span>
          <span className="ag-db-stat-lbl">索引量</span>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="ag-db-filter">
        <FilterOutlined style={{ color: '#5b647a', marginRight: 6 }} />
        <Input
          allowClear
          placeholder="搜索表名或注释…"
          style={{ width: 240 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<DatabaseOutlined style={{ color: '#94a3b8' }} />}
        />
        <Select
          allowClear
          placeholder="引擎"
          style={{ width: 120 }}
          value={engineFilter || undefined}
          onChange={(v) => setEngineFilter(v || '')}
          options={[...new Set(DB_TABLES.map((t) => t.engine))].map((e) => ({ label: e, value: e }))}
        />
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          共 {filtered.length} 张表
        </Text>
      </div>

      {/* 表列表 */}
      <div className="ag-db-list">
        {filtered.map((t) => {
          const priCol = t.columns.find((c) => c.key === 'PRI')
          return (
            <div key={t.name} className="ag-db-row" onClick={() => setSelected(t)}>
              <div className="ag-db-row-main">
                <span className="ag-db-row-icon"><TableOutlined /></span>
                <span className="ag-db-row-name">{t.name}</span>
                <Tag color="blue" className="ag-db-row-engine">{t.engine}</Tag>
                <span className="ag-db-row-comment">{t.comment}</span>
                <span className="ag-db-row-meta">
                  <span className="ag-db-row-count">{fmtNum(t.rowCount)} 行</span>
                  <span className="ag-db-row-size">{fmtBytes(t.dataLen + t.indexLen)}</span>
                  <span className="ag-db-row-cols">{t.columns.length} 列</span>
                  {priCol && <span className="ag-db-row-pk"><KeyOutlined /> {priCol.name}</span>}
                  <span className="ag-db-row-time">{t.updateTime}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============================ 主组件 ============================ */

type MenuKey = 'run' | 'pipeline' | 'review' | 'db'

const MENU_STORAGE_KEY = 'agiledev:menu'

const menuLabelMap: Record<MenuKey, string> = {
  run: '执行任务',
  pipeline: '流水线',
  review: '代码审查',
  db: '数据库管理',
}

export default function AgileDev() {
  const [menu, setMenu] = useState<MenuKey>(() => (localStorage.getItem(MENU_STORAGE_KEY) as MenuKey) || 'run')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    localStorage.setItem(MENU_STORAGE_KEY, menu)
  }, [menu])

  const menuItems = [
    { key: 'run', icon: <ThunderboltOutlined />, label: '执行任务' },
    { key: 'pipeline', icon: <BranchesOutlined />, label: '流水线' },
    { key: 'review', icon: <CodeOutlined />, label: '代码审查' },
    { key: 'db', icon: <DatabaseOutlined />, label: '数据库管理' },
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
            {menu === 'pipeline' && <PipelineView />}
            {menu === 'review' && <CodeReviewView />}
            {menu === 'db' && <DatabaseView />}
          </div>
        </Content>
      </div>
    </Layout>
  )
}
