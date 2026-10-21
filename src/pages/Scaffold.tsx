import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Layout,
  Menu,
  Badge,
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tabs,
  Tag,
  Button,
  Input,
  Form,
  Select,
  Switch,
  Avatar,
  Breadcrumb,
  Timeline,
  Descriptions,
  Drawer,
  Modal,
  Popconfirm,
  Progress,
  Space,
  App as AntdApp,
} from 'antd'
import type { TableColumnsType, MenuProps } from 'antd'
import {
  DashboardOutlined,
  BellOutlined,
  SettingOutlined,
  SmileOutlined,
  CloudOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
  SearchOutlined,
  LogoutOutlined,
  DeleteOutlined,
  UserOutlined,
  ReadOutlined,
  SafetyOutlined,
  AppstoreOutlined,
  ToolOutlined,
  FileSearchOutlined,
  ApartmentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  RightOutlined,
  IdcardOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { OrgTreeView } from './OrgCenter'
import { ORG_TREE } from '../data/org'
import type { OrgNode } from '../data/org'
import './orgCenter.css'
import './scaffold.css'
import { Link } from 'react-router-dom'
import './agileDev.css'

const { Content, Header } = Layout
const { Title, Text } = Typography

/* ================================ 数据类型 ================================ */

interface Teacher {
  id: string
  no: string // 工号
  name: string
  dept: string
  title: string // 职称
  duties: string[] // 职务（多选，决定角色）
  phone: string
  email: string
  status: '在职' | '停用'
}

interface Student {
  id: string
  no: string // 学号
  name: string
  dept: string
  major: string
  className: string
  phone: string
  status: '在读' | '停用'
}

interface SysUser {
  id: string
  username: string
  name: string
  type: '教师' | '学生' | '超级管理员'
  dept: string
  roles: string[]
  status: '启用' | '禁用'
  locked: boolean
  createdAt: string
  lastLoginAt: string
  phone?: string
  email?: string
  avatar?: string
}

interface Role {
  id: string
  code: string
  name: string
  desc: string
  status: '启用' | '禁用'
}

interface MenuNode {
  id: string
  name: string
  path: string
  roles: string[]
  children?: MenuNode[]
}

const ROLE_OPTIONS = ['超级管理员', '教师', '学生', '访客']

// 教师职务选项（多选）
const DUTY_OPTIONS = ['院长', '副院长', '系主任', '教研室主任', '学科带头人', '教务秘书', '辅导员', '班主任', '普通教师']

// 职务 -> 附加角色映射（基础角色「教师」始终保留）
const DUTY_ROLE_MAP: Record<string, string[]> = {
  院长: ['院系管理员'],
  副院长: ['院系管理员'],
  系主任: ['院系管理员'],
  教研室主任: ['教务管理员'],
  教务秘书: ['教务管理员'],
  辅导员: ['辅导员'],
  班主任: ['辅导员'],
}

// 根据职务（可多个）计算角色：去重合并，至少为「教师」
function rolesFromDuties(duties: string[] = []): string[] {
  const set = new Set<string>(['教师'])
  duties.forEach((d) => (DUTY_ROLE_MAP[d] || []).forEach((r) => set.add(r)))
  return Array.from(set)
}

// 系统设置子树对应的菜单 key（仅超级管理员可见）
const SYSTEM_KEYS = new Set<MenuKey>(['user', 'role', 'menuMgmt', 'config', 'secret', 'token', 'apiLog', 'taskTool', 'logs'])

/* ================================ 种子数据 ================================ */

const TEACHER_SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '郑']
const TEACHER_GIVEN = ['明远', '文静', '海涛', '雨欣', '国栋', '晨曦', '嘉禾', '思远', '雨桐', '子豪', '志强', '建国', '丽华', '晓东', '春梅', '宏伟', '雪梅', '天宇', '佳琪', '浩然']

function makeTeachers(): Teacher[] {
  const depts = ['材料学院', '计算机学院', '外国语学院', '机械学院', '信息中心']
  const titles = ['教授', '副教授', '讲师', '助教']
  const dutyPool: string[][] = [
    ['院长', '学科带头人'],
    ['副院长'],
    ['系主任'],
    ['教研室主任'],
    ['教务秘书'],
    ['辅导员', '班主任'],
    ['学科带头人'],
    ['普通教师'],
    ['普通教师'],
  ]
  return Array.from({ length: 32 }, (_, i) => ({
    id: `t${i + 1}`,
    no: `T${2001 + i}`,
    name: `${TEACHER_SURNAMES[i % TEACHER_SURNAMES.length]}${TEACHER_GIVEN[(i * 7) % TEACHER_GIVEN.length]}`,
    dept: depts[i % depts.length],
    title: titles[i % titles.length],
    duties: dutyPool[i % dutyPool.length],
    phone: `138${String(10000000 + i * 137)}`,
    email: `t${2001 + i}@univ.edu.cn`,
    status: i % 9 === 8 ? '停用' : '在职',
  }))
}

const STUDENT_CLASSES = ['材料2401', '材料2402', '软工2401', '软工2402', '英语2301', '智科2301', '机械2301', '法学2401']
const STUDENT_MAJORS = ['材料科学与工程', '软件工程', '英语', '机械设计制造', '人工智能', '法学']

function makeStudents(): Student[] {
  const depts = ['材料学院', '计算机学院', '外国语学院', '机械学院', '法学院']
  return Array.from({ length: 48 }, (_, i) => ({
    id: `s${i + 1}`,
    no: String(2024010101 + i * 7),
    name: `${TEACHER_SURNAMES[(i * 3) % TEACHER_SURNAMES.length]}${TEACHER_GIVEN[(i * 11 + 3) % TEACHER_GIVEN.length]}`,
    dept: depts[i % depts.length],
    major: STUDENT_MAJORS[i % STUDENT_MAJORS.length],
    className: STUDENT_CLASSES[i % STUDENT_CLASSES.length],
    phone: `159${String(10000000 + i * 251)}`,
    status: i % 11 === 10 ? '停用' : '在读',
  }))
}

const seedTeachers: Teacher[] = makeTeachers()
const seedStudents: Student[] = makeStudents()

function buildSeedUsers(): SysUser[] {
  const users: SysUser[] = [
    { id: 'u0', username: 'admin', name: '系统管理员', type: '超级管理员', dept: '信息中心', roles: ['超级管理员'], status: '启用', locked: false, createdAt: '2026-01-01 09:00', lastLoginAt: '2026-10-19 08:30', phone: '13900000000', email: 'admin@univ.edu.cn' },
  ]
  seedTeachers.forEach((t, i) => {
    users.push({
      id: `u_t${i + 1}`,
      username: t.no,
      name: t.name,
      type: '教师',
      dept: t.dept,
      roles: rolesFromDuties(t.duties),
      phone: t.phone,
      email: t.email,
      status: t.status === '在职' ? '启用' : '禁用',
      locked: false,
      createdAt: `2026-02-${String(10 + i).padStart(2, '0')} 10:30`,
      lastLoginAt: `2026-10-1${i % 9} ${String(9 + i).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
    })
  })
  seedStudents.forEach((s, i) => {
    users.push({
      id: `u_s${i + 1}`,
      username: s.no,
      name: s.name,
      type: '学生',
      dept: s.dept,
      roles: ['学生'],
      phone: s.phone,
      email: `${s.no}@stu.univ.edu.cn`,
      status: s.status === '在读' ? '启用' : '禁用',
      locked: false,
      createdAt: `2026-03-${String(5 + i).padStart(2, '0')} 14:20`,
      lastLoginAt: `2026-10-1${i % 9} ${String(10 + i).padStart(2, '0')}:${String((i * 23) % 60).padStart(2, '0')}`,
    })
  })
  return users
}

const seedRoles: Role[] = [
  { id: 'r1', code: 'admin', name: '超级管理员', desc: '系统最高权限，可管理所有模块与配置', status: '启用' },
  { id: 'r2', code: 'teacher', name: '教师', desc: '可管理本人课程、查看所授班级学生信息', status: '启用' },
  { id: 'r3', code: 'student', name: '学生', desc: '可查看个人信息、选课与校园服务', status: '启用' },
  { id: 'r4', code: 'visitor', name: '访客', desc: '仅可浏览公开信息', status: '禁用' },
  { id: 'r5', code: 'academic', name: '教务管理员', desc: '维护课程排课、考试安排等教务数据', status: '启用' },
  { id: 'r6', code: 'counselor', name: '辅导员', desc: '管理所带班级学生日常事务与请假审批', status: '启用' },
  { id: 'r7', code: 'college-admin', name: '院系管理员', desc: '管理本院系组织架构与人员信息', status: '启用' },
  { id: 'r8', code: 'ops', name: '系统运维', desc: '负责服务部署、监控告警与任务调度', status: '启用' },
  { id: 'r9', code: 'auditor', name: '审计员', desc: '只读查看操作日志与配置变更记录', status: '禁用' },
  { id: 'r10', code: 'finance', name: '财务专员', desc: '管理学费缴纳、退费与财务报表', status: '启用' },
  { id: 'r11', code: 'library', name: '图书馆管理员', desc: '管理图书借阅、归还与逾期提醒', status: '启用' },
  { id: 'r12', code: 'dormitory', name: '宿管员', desc: '管理宿舍入住、调宿与门禁权限', status: '启用' },
]

const seedMenuTree: MenuNode[] = [
  {
    id: 'm1',
    name: '工作台',
    path: '/dashboard',
    roles: ['超级管理员', '教师', '学生'],
    children: [
      { id: 'm1-1', name: '控制面板', path: '/dashboard/overview', roles: ['超级管理员', '教师', '学生'] },
      { id: 'm1-2', name: '待办事项', path: '/dashboard/todos', roles: ['超级管理员', '教师', '学生'] },
    ],
  },
  {
    id: 'm2',
    name: '人员管理',
    path: '/personnel',
    roles: ['超级管理员'],
    children: [
      { id: 'm2-1', name: '教师管理', path: '/personnel/teachers', roles: ['超级管理员'] },
      { id: 'm2-2', name: '学生管理', path: '/personnel/students', roles: ['超级管理员'] },
    ],
  },
  {
    id: 'm3',
    name: '系统设置',
    path: '/settings',
    roles: ['超级管理员'],
    children: [
      { id: 'm3-1', name: '用户管理', path: '/settings/users', roles: ['超级管理员'] },
      { id: 'm3-2', name: '角色管理', path: '/settings/roles', roles: ['超级管理员'] },
      { id: 'm3-3', name: '菜单管理', path: '/settings/menus', roles: ['超级管理员'] },
      { id: 'm3-4', name: '系统配置', path: '/settings/config', roles: ['超级管理员'] },
    ],
  },
]

interface ConfigRow {
  key: string
  configKey: string
  configValue: string
  enabled: boolean
  remark: string
}

const seedConfigs: ConfigRow[] = [
  { key: 'c1', configKey: 'oauth.clientId', configValue: 'sca-vue-client-2026', enabled: true, remark: '统一认证平台客户端 ID' },
  { key: 'c2', configKey: 'oauth.clientSecret', configValue: 'sk-a3f8d2e94b7c5102', enabled: true, remark: '统一认证平台客户端密钥' },
  { key: 'c3', configKey: 'gateway.baseUrl', configValue: 'https://api.univ.edu.cn', enabled: true, remark: '网关服务地址' },
  { key: 'c4', configKey: 'oss.bucket', configValue: 'univ-file-prod', enabled: true, remark: '对象存储桶名' },
  { key: 'c5', configKey: 'oss.endpoint', configValue: 'https://oss-cn-beijing.aliyuncs.com', enabled: true, remark: '对象存储 Endpoint' },
  { key: 'c6', configKey: 'sms.signName', configValue: '星辉大学', enabled: true, remark: '短信签名' },
  { key: 'c7', configKey: 'mail.smtpHost', configValue: 'smtp.univ.edu.cn', enabled: false, remark: '邮件服务（暂未启用）' },
  { key: 'c8', configKey: 'dev.mockEnabled', configValue: 'true', enabled: false, remark: '开发环境 Mock 开关' },
  { key: 'c9', configKey: 'es.host', configValue: 'http://es.univ.edu.cn:9200', enabled: true, remark: 'Elasticsearch 集群地址' },
  { key: 'c10', configKey: 'redis.host', configValue: '127.0.0.1:6379', enabled: true, remark: 'Redis 缓存地址' },
  { key: 'c11', configKey: 'redis.password', configValue: 'rd#2026@univ', enabled: true, remark: 'Redis 访问密码' },
  { key: 'c12', configKey: 'mq.address', configValue: 'amqp://rabbit.univ.edu.cn:5672', enabled: true, remark: '消息队列地址' },
  { key: 'c13', configKey: 'excel.maxRows', configValue: '50000', enabled: true, remark: 'Excel 导入最大行数' },
  { key: 'c14', configKey: 'excel.templatePath', configValue: '/templates/imports', enabled: true, remark: '导入模板存放路径' },
  { key: 'c15', configKey: 'task.initOrg', configValue: 'enabled', enabled: true, remark: '任务开关：初始化组织机构数据' },
  { key: 'c16', configKey: 'task.migrateTeacher', configValue: 'enabled', enabled: true, remark: '任务开关：迁移教职工数据' },
  { key: 'c17', configKey: 'task.migrateStudent', configValue: 'enabled', enabled: true, remark: '任务开关：迁移学生数据' },
  { key: 'c18', configKey: 'task.resetPwd', configValue: 'disabled', enabled: false, remark: '任务开关：重置用户初始密码' },
  { key: 'c19', configKey: 'log.level', configValue: 'INFO', enabled: true, remark: '系统日志级别' },
  { key: 'c20', configKey: 'upload.maxSize', configValue: '20MB', enabled: true, remark: '单文件上传大小上限' },
  { key: 'c21', configKey: 'token.expire', configValue: '7200', enabled: true, remark: '访问令牌有效期（秒）' },
  { key: 'c22', configKey: 'token.refreshExpire', configValue: '604800', enabled: true, remark: '刷新令牌有效期（秒）' },
]

/* ================================ 视图：控制面板 ================================ */

function DashboardView({ onNavigate, isSuper }: { onNavigate: (m: MenuKey) => void; isSuper: boolean }) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 6 ? '凌晨好' : hour < 9 ? '早上好' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
  const dateStr = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(now)

  const quickEntries: { key: MenuKey; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'teacher', label: '教师管理', icon: <IdcardOutlined />, color: '#3b5bff' },
    { key: 'student', label: '学生管理', icon: <ReadOutlined />, color: '#0ea5e9' },
    { key: 'user', label: '用户管理', icon: <UserOutlined />, color: '#7c3aed' },
    { key: 'org', label: '组织管理', icon: <ApartmentOutlined />, color: '#10b981' },
    { key: 'role', label: '角色管理', icon: <SafetyOutlined />, color: '#f59e0b' },
    { key: 'menuMgmt', label: '菜单管理', icon: <AppstoreOutlined />, color: '#ef4444' },
    { key: 'config', label: '系统配置', icon: <ToolOutlined />, color: '#14b8a6' },
    { key: 'logs', label: '操作日志', icon: <FileSearchOutlined />, color: '#6366f1' },
  ]

  const todos: { label: string; count: number; target: MenuKey }[] = [
    { label: '待审核用户新增申请', count: 3, target: 'user' },
    { label: '待处理角色权限变更', count: 2, target: 'role' },
    { label: '待确认菜单授权调整', count: 1, target: 'menuMgmt' },
    { label: '待更新系统配置项', count: 1, target: 'config' },
  ]
  const todoTotal = todos.reduce((acc, t) => acc + t.count, 0)
  // 非超级管理员看不到系统设置相关待办
  const visibleTodos = todos.filter((t) => isSuper || !SYSTEM_KEYS.has(t.target))

  const dynamics: { color: string; text: string; time: string }[] = [
    { color: 'green', text: '张明 新增了配置项 oauth.clientId', time: '10 分钟前' },
    { color: 'blue', text: '李娜 更新了「教师」角色的描述', time: '32 分钟前' },
    { color: 'blue', text: '王强 为「教师管理」菜单授权了教师角色', time: '1 小时前' },
    { color: 'orange', text: '赵磊 锁定了用户账号 T2005，需后台手动解锁', time: '2 小时前' },
    { color: 'green', text: '系统 完成了今日数据备份', time: '3 小时前' },
  ]

  return (
    <div>
      {/* 欢迎语 */}
      <Card className="org-card scaf-welcome-card">
        <div className="scaf-welcome">
          <Avatar size={64} className="scaf-welcome-avatar" icon={<SmileOutlined />} />
          <div className="scaf-welcome-text">
            <div className="scaf-welcome-title">
              {greeting}，张明，祝你开心每一天！
            </div>
            <div className="scaf-welcome-sub">
              今天是 {dateStr} · 职场综合应用系统 v2.6.0 · 今日待办 {todoTotal} 项
            </div>
          </div>
          <div className="scaf-welcome-weather">
            <CloudOutlined className="scaf-welcome-cloud" />
            <div>
              <div className="scaf-welcome-temp">22℃</div>
              <div className="scaf-welcome-city">上海 · 多云</div>
            </div>
          </div>
        </div>
      </Card>

      {/* 快捷入口 */}
      <Card className="org-card" title="快捷入口" style={{ marginTop: 16 }}>
        <div className="scaf-quick-grid">
          {quickEntries.filter((q) => isSuper || !SYSTEM_KEYS.has(q.key)).map((q) => (
            <div key={q.key} className="scaf-quick-item" onClick={() => onNavigate(q.key)}>
              <div className="scaf-quick-icon" style={{ color: q.color, background: `${q.color}14` }}>
                {q.icon}
              </div>
              <span className="scaf-quick-label">{q.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 待办事项 + 系统动态 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card className="org-card" title={`待办事项（${visibleTodos.length}）`}>
            <div className="scaf-todo-list">
              {visibleTodos.length === 0 && <div className="scaf-menu-empty">暂无待办事项</div>}
              {visibleTodos.map((t) => (
                <div key={t.label} className="scaf-todo-row">
                  <span className="scaf-todo-label">{t.label}</span>
                  <Tag color="blue">{t.count}</Tag>
                  <Button type="link" size="small" onClick={() => onNavigate(t.target)}>去处理</Button>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="org-card" title="系统动态">
            <Timeline
              items={dynamics.map((d) => ({
                color: d.color,
                children: (
                  <div className="scaf-dynamic-item">
                    <span>{d.text}</span>
                    <span className="scaf-dynamic-time">{d.time}</span>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

/* ============================ 视图：系统配置（行内编辑） ============================ */

function ConfigView() {
  const { message } = AntdApp.useApp()
  const [rows, setRows] = useState<ConfigRow[]>(() => seedConfigs.map((r) => ({ ...r })))
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ configKey: string; configValue: string; remark: string }>({ configKey: '', configValue: '', remark: '' })
  const startEdit = (row: ConfigRow) => {
    setEditingKey(row.key)
    setDraft({ configKey: row.configKey, configValue: row.configValue, remark: row.remark })
  }

  const startAdd = () => {
    if (editingKey) return
    const key = `new_${Date.now()}`
    setRows((rs) => [{ key, configKey: '', configValue: '', enabled: true, remark: '' }, ...rs])
    setEditingKey(key)
    setDraft({ configKey: '', configValue: '', remark: '' })
  }

  const cancelEdit = () => {
    setRows((rs) => rs.filter((r) => r.key !== editingKey || r.configKey !== ''))
    setEditingKey(null)
  }

  const saveEdit = () => {
    if (!draft.configKey.trim()) {
      message.warning('参数键不能为空')
      return
    }
    if (!draft.configValue.trim()) {
      message.warning('参数值不能为空')
      return
    }
    setRows((rs) => rs.map((r) => (r.key === editingKey ? { ...r, ...draft, configKey: draft.configKey.trim() } : r)))
    setEditingKey(null)
    message.success('配置已保存')
  }

  const removeRow = (key: string) => {
    setRows((rs) => rs.filter((r) => r.key !== key))
    message.success('配置已删除')
  }

  const toggleEnabled = (key: string, checked: boolean) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, enabled: checked } : r)))
  }

  const columns: TableColumnsType<ConfigRow> = [
    {
      title: '参数键 (key)',
      dataIndex: 'configKey',
      key: 'configKey',
      width: 280,
      render: (_: unknown, row: ConfigRow) =>
        row.key === editingKey ? (
          <Input
            value={draft.configKey}
            onChange={(e) => setDraft((d) => ({ ...d, configKey: e.target.value }))}
            placeholder="如：oauth.clientId"
          />
        ) : (
          <span className="scaf-mono scaf-config-key">{row.configKey}</span>
        ),
    },
    {
      title: '参数值 (value)',
      dataIndex: 'configValue',
      key: 'configValue',
      render: (_: unknown, row: ConfigRow) =>
        row.key === editingKey ? (
          <Input
            value={draft.configValue}
            onChange={(e) => setDraft((d) => ({ ...d, configValue: e.target.value }))}
            placeholder="请输入参数值"
          />
        ) : (
          <span className="scaf-mono">{row.configValue}</span>
        ),
    },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      align: 'center',
      render: (_: unknown, row: ConfigRow) => (
        <Switch size="small" checked={row.enabled} onChange={(v) => toggleEnabled(row.key, v)} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (_: unknown, row: ConfigRow) =>
        row.key === editingKey ? (
          <Input
            value={draft.remark}
            onChange={(e) => setDraft((d) => ({ ...d, remark: e.target.value }))}
            placeholder="备注说明（可选）"
          />
        ) : (
          <span className="scaf-remark">{row.remark || '-'}</span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'center',
      render: (_: unknown, row: ConfigRow) => {
        if (row.key === editingKey) {
          return (
            <Space size={4} className="org-actions">
              <Button type="link" size="small" onClick={saveEdit}>保存</Button>
              <Button type="link" size="small" onClick={cancelEdit}>取消</Button>
            </Space>
          )
        }
        // 其它行处于编辑态时不可操作，直接不展示
        if (editingKey) return null
        return (
          <Space size={4} className="org-actions">
            <Button type="link" size="small" onClick={() => startEdit(row)}>编辑</Button>
            <Popconfirm title="确定删除该配置项？" onConfirm={() => removeRow(row.key)}>
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">系统配置</Title>
      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />} onClick={startAdd} disabled={!!editingKey}>
          新增配置
        </Button>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<ConfigRow>
          columns={columns}
          dataSource={rows}
          rowKey="key"
          size="middle"
          pagination={false}
          rowClassName={(r) => (r.key === editingKey ? 'scaf-editing-row' : '')}
        />
      </Card>
    </div>
  )
}

/* ============================ 视图：教师 / 学生管理 ============================ */

// 手机号脱敏：138****1001
function maskPhone(p?: string): string {
  if (!p) return '-'
  return p.length >= 11 ? `${p.slice(0, 3)}****${p.slice(-4)}` : p
}

// 邮箱脱敏：z***@univ.edu.cn
function maskEmail(e?: string): string {
  if (!e) return '-'
  const at = e.indexOf('@')
  if (at <= 0) return e
  return `${e[0]}***${e.slice(at)}`
}

interface PersonFormValues {
  no: string
  name: string
  dept: string
  phone?: string
  email?: string
  title?: string
  duties: string[]
  major?: string
  className?: string
  status: '在职' | '停用' | '在读'
}

function usePersonSync(
  setUsers: React.Dispatch<React.SetStateAction<SysUser[]>>,
) {
  const { message } = AntdApp.useApp()

  const addUser = (u: Omit<SysUser, 'id' | 'createdAt' | 'locked' | 'lastLoginAt'>) => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const createdAt = `2026-10-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    setUsers((us) => [...us, { ...u, id: `u_${Date.now()}`, locked: false, createdAt, lastLoginAt: '从未登录' }])
  }

  const syncUser = (username: string, patch: Partial<SysUser>) => {
    setUsers((us) => us.map((u) => (u.username === username ? { ...u, ...patch } : u)))
  }

  const removeUser = (username: string) => {
    setUsers((us) => us.filter((u) => u.username !== username))
  }

  return { message, addUser, syncUser, removeUser }
}

const DEPT_OPTIONS = ['材料学院', '计算机学院', '外国语学院', '机械学院', '信息中心']

function TeacherView({
  teachers,
  setTeachers,
  users,
  setUsers,
}: {
  teachers: Teacher[]
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>
  users: SysUser[]
  setUsers: React.Dispatch<React.SetStateAction<SysUser[]>>
}) {
  const { message, addUser, syncUser, removeUser } = usePersonSync(setUsers)
  const [searchForm] = Form.useForm<{ name?: string; no?: string; dept?: string }>()
  const [applied, setApplied] = useState<{ name: string; no: string; dept: string }>({ name: '', no: '', dept: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [form] = Form.useForm<PersonFormValues>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [detail, setDetail] = useState<Teacher | null>(null)

  const list = useMemo(() => {
    const name = applied.name.trim().toLowerCase()
    const no = applied.no.trim().toLowerCase()
    return teachers
      .filter((t) => !name || t.name.toLowerCase().includes(name))
      .filter((t) => !no || t.no.toLowerCase().includes(no))
      .filter((t) => !applied.dept || t.dept === applied.dept)
  }, [teachers, applied])

  const onSearch = () => {
    const v = searchForm.getFieldsValue()
    setApplied({ name: v.name || '', no: v.no || '', dept: v.dept || '' })
  }
  const onReset = () => {
    searchForm.resetFields()
    setApplied({ name: '', no: '', dept: '' })
  }

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: '在职' })
    setModalOpen(true)
  }

  const openEdit = (t: Teacher) => {
    setEditing(t)
    form.setFieldsValue({ ...t })
    setModalOpen(true)
  }

  const onOk = async () => {
    const v = await form.validateFields()
    if (editing) {
      const oldNo = editing.no
      setTeachers((ts) => ts.map((t) => (t.id === editing.id ? { ...editing, ...v } as Teacher : t)))
      syncUser(oldNo, {
        username: v.no,
        name: v.name,
        dept: v.dept,
        roles: rolesFromDuties(v.duties),
        status: v.status === '在职' ? '启用' : '禁用',
      })
      message.success('教师信息已更新，关联用户与角色已同步')
    } else {
      if (teachers.some((t) => t.no === v.no)) {
        message.error(`工号 ${v.no} 已存在`)
        return
      }
      if (users.some((u) => u.username === v.no)) {
        message.error(`用户账号 ${v.no} 已存在`)
        return
      }
      const t: Teacher = { id: `t_${Date.now()}`, ...v } as Teacher
      setTeachers((ts) => [...ts, t])
      addUser({ username: v.no, name: v.name, type: '教师', dept: v.dept, roles: rolesFromDuties(v.duties), status: v.status === '在职' ? '启用' : '禁用', phone: v.phone, email: v.email })
      message.success('教师新增成功，已同步创建用户账号')
    }
    setModalOpen(false)
  }

  const onDelete = (t: Teacher) => {
    setTeachers((ts) => ts.filter((x) => x.id !== t.id))
    removeUser(t.no)
    message.success('教师已删除，关联用户已同步移除')
  }

  const onBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要删除的教师')
      return
    }
    const keys = new Set(selectedRowKeys.map(String))
    const targets = teachers.filter((t) => keys.has(t.id))
    setTeachers((ts) => ts.filter((x) => !keys.has(x.id)))
    targets.forEach((t) => removeUser(t.no))
    setSelectedRowKeys([])
    message.success(`已批量删除 ${targets.length} 名教师，关联用户已同步移除`)
  }

  const columns: TableColumnsType<Teacher> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 130,
      render: (n: string, r: Teacher) => (
        <Button type="link" className="org-name-link" onClick={() => setDetail(r)}>{n}</Button>
      ),
    },
    { title: '工号', dataIndex: 'no', key: 'no', width: 110, render: (n: string) => <span className="scaf-mono">{n}</span> },
    { title: '院系', dataIndex: 'dept', key: 'dept', width: 130 },
    { title: '职称', dataIndex: 'title', key: 'title', width: 90, render: (t: string) => <Tag color="blue">{t}</Tag> },
    {
      title: '职务',
      dataIndex: 'duties',
      key: 'duties',
      width: 170,
      render: (duties: string[]) =>
        duties && duties.length > 0
          ? duties.map((d) => <Tag key={d} color="purple">{d}</Tag>)
          : <span className="scaf-remark">-</span>,
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130, render: (p: string) => <span className="scaf-mono">{maskPhone(p)}</span> },
    { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true, render: (e: string) => <span className="scaf-mono">{maskEmail(e)}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center', render: (s: string) => (s === '在职' ? <Tag color="green">在职</Tag> : <Tag>停用</Tag>) },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'center',
      render: (_: unknown, r: Teacher) => (
        <Space size={4} className="org-actions">
          <Button type="link" size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title={`删除后其用户账号（${r.no}）将一并移除，确定？`} onConfirm={() => onDelete(r)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">教师管理</Title>
      <div className="org-search-bar">
        <Form form={searchForm} layout="horizontal" className="org-search-form" labelCol={{ flex: '90px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item name="name" label="姓名" className="org-filter-item">
            <Input allowClear placeholder="输入姓名" />
          </Form.Item>
          <Form.Item name="no" label="工号" className="org-filter-item">
            <Input allowClear placeholder="输入工号" />
          </Form.Item>
          <Form.Item name="dept" label="院系" className="org-filter-item">
            <Select allowClear placeholder="全部" options={DEPT_OPTIONS.map((d) => ({ label: d, value: d }))} />
          </Form.Item>
          <div className="org-search-btns">
            <Button type="primary" onClick={onSearch}>查询</Button>
            <Button onClick={onReset}>重置</Button>
          </div>
        </Form>
      </div>
      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增</Button>
        <Popconfirm
          title={`确定批量删除选中的 ${selectedRowKeys.length} 名教师？`}
          description="其关联的用户账号将一并移除"
          okText="批量删除"
          cancelText="取消"
          onConfirm={onBatchDelete}
          disabled={selectedRowKeys.length === 0}
        >
          <Button type="primary" danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>
            批量删除
          </Button>
        </Popconfirm>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<Teacher>
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="middle"
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 名教师` }}
        />
      </Card>

      <Modal
        title={editing ? '编辑教师' : '新增教师（自动创建用户账号）'}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="no" label="工号（同时作为登录账号）" rules={[{ required: true, message: '请输入工号' }]}>
                <Input placeholder="如：T2006" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dept" label="所属院系" rules={[{ required: true, message: '请选择院系' }]}>
                <Select placeholder="请选择院系" options={DEPT_OPTIONS.map((d) => ({ label: d, value: d }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="title" label="职称" rules={[{ required: true, message: '请选择职称' }]}>
                <Select placeholder="请选择职称" options={['教授', '副教授', '讲师', '助教'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="duties"
            label="职务（可多选，决定用户角色）"
            rules={[{ required: true, message: '请至少选择一个职务' }]}
          >
            <Select mode="multiple" placeholder="如：院长、学科带头人" options={DUTY_OPTIONS.map((d) => ({ label: d, value: d }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={[{ label: '在职', value: '在职' }, { label: '停用', value: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`教师详情 - ${detail?.name ?? ''}`}
        open={!!detail}
        onClose={() => setDetail(null)}
        width={420}
        destroyOnHidden
      >
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="姓名">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="工号"><span className="scaf-mono">{detail.no}</span></Descriptions.Item>
              <Descriptions.Item label="院系">{detail.dept}</Descriptions.Item>
              <Descriptions.Item label="职称"><Tag color="blue">{detail.title}</Tag></Descriptions.Item>
              <Descriptions.Item label="职务">
                {(detail.duties ?? []).map((d) => <Tag key={d} color="purple">{d}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="手机号"><span className="scaf-mono">{detail.phone || '-'}</span></Descriptions.Item>
              <Descriptions.Item label="邮箱">{detail.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="在职状态">{detail.status === '在职' ? <Tag color="green">在职</Tag> : <Tag>停用</Tag>}</Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5} style={{ margin: '20px 0 10px' }}>关联用户账号</Typography.Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="登录账号"><span className="scaf-mono">{detail.no}</span></Descriptions.Item>
              <Descriptions.Item label="角色">
                {(users.find((u) => u.username === detail.no)?.roles ?? []).map((r) => <Tag key={r} color="gold">{r}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="账号状态">{users.find((u) => u.username === detail.no)?.status ?? '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

function StudentView({
  students,
  setStudents,
  users,
  setUsers,
}: {
  students: Student[]
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>
  users: SysUser[]
  setUsers: React.Dispatch<React.SetStateAction<SysUser[]>>
}) {
  const { message, addUser, syncUser, removeUser } = usePersonSync(setUsers)
  const [searchForm] = Form.useForm<{ name?: string; no?: string; className?: string }>()
  const [applied, setApplied] = useState<{ name: string; no: string; className: string }>({ name: '', no: '', className: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form] = Form.useForm<PersonFormValues>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [detail, setDetail] = useState<Student | null>(null)

  const list = useMemo(() => {
    const name = applied.name.trim().toLowerCase()
    const no = applied.no.trim().toLowerCase()
    const cls = applied.className.trim().toLowerCase()
    return students
      .filter((s) => !name || s.name.toLowerCase().includes(name))
      .filter((s) => !no || s.no.toLowerCase().includes(no))
      .filter((s) => !cls || s.className.toLowerCase().includes(cls))
  }, [students, applied])

  const onSearch = () => {
    const v = searchForm.getFieldsValue()
    setApplied({ name: v.name || '', no: v.no || '', className: v.className || '' })
  }
  const onReset = () => {
    searchForm.resetFields()
    setApplied({ name: '', no: '', className: '' })
  }

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: '在读' })
    setModalOpen(true)
  }

  const openEdit = (s: Student) => {
    setEditing(s)
    form.setFieldsValue({ ...s })
    setModalOpen(true)
  }

  const onOk = async () => {
    const v = await form.validateFields()
    if (editing) {
      const oldNo = editing.no
      setStudents((ss) => ss.map((s) => (s.id === editing.id ? { ...editing, ...v } as Student : s)))
      syncUser(oldNo, { username: v.no, name: v.name, dept: v.dept, status: v.status === '在读' ? '启用' : '禁用' })
      message.success('学生信息已更新，关联用户已同步')
    } else {
      if (students.some((s) => s.no === v.no)) {
        message.error(`学号 ${v.no} 已存在`)
        return
      }
      if (users.some((u) => u.username === v.no)) {
        message.error(`用户账号 ${v.no} 已存在`)
        return
      }
      const s: Student = { id: `s_${Date.now()}`, ...v } as Student
      setStudents((ss) => [...ss, s])
      addUser({ username: v.no, name: v.name, type: '学生', dept: v.dept, roles: ['学生'], status: v.status === '在读' ? '启用' : '禁用', phone: v.phone, email: `${v.no}@stu.univ.edu.cn` })
      message.success('学生新增成功，已同步创建用户账号')
    }
    setModalOpen(false)
  }

  const onDelete = (s: Student) => {
    setStudents((ss) => ss.filter((x) => x.id !== s.id))
    removeUser(s.no)
    message.success('学生已删除，关联用户已同步移除')
  }

  const onBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要删除的学生')
      return
    }
    const keys = new Set(selectedRowKeys.map(String))
    const targets = students.filter((st) => keys.has(st.id))
    setStudents((ss) => ss.filter((x) => !keys.has(x.id)))
    targets.forEach((st) => removeUser(st.no))
    setSelectedRowKeys([])
    message.success(`已批量删除 ${targets.length} 名学生，关联用户已同步移除`)
  }

  const columns: TableColumnsType<Student> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 130,
      render: (n: string, r: Student) => (
        <Button type="link" className="org-name-link" onClick={() => setDetail(r)}>{n}</Button>
      ),
    },
    { title: '学号', dataIndex: 'no', key: 'no', width: 130, render: (n: string) => <span className="scaf-mono">{n}</span> },
    { title: '院系', dataIndex: 'dept', key: 'dept', width: 130 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 150 },
    { title: '班级', dataIndex: 'className', key: 'className', width: 110, render: (c: string) => <Tag color="geekblue">{c}</Tag> },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130, render: (p: string) => <span className="scaf-mono">{maskPhone(p)}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center', render: (s: string) => (s === '在读' ? <Tag color="green">在读</Tag> : <Tag>停用</Tag>) },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'center',
      render: (_: unknown, r: Student) => (
        <Space size={4} className="org-actions">
          <Button type="link" size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title={`删除后其用户账号（${r.no}）将一并移除，确定？`} onConfirm={() => onDelete(r)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">学生管理</Title>
      <div className="org-search-bar">
        <Form form={searchForm} layout="horizontal" className="org-search-form" labelCol={{ flex: '90px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item name="name" label="姓名" className="org-filter-item">
            <Input allowClear placeholder="输入姓名" />
          </Form.Item>
          <Form.Item name="no" label="学号" className="org-filter-item">
            <Input allowClear placeholder="输入学号" />
          </Form.Item>
          <Form.Item name="className" label="班级" className="org-filter-item">
            <Input allowClear placeholder="输入班级" />
          </Form.Item>
          <div className="org-search-btns">
            <Button type="primary" onClick={onSearch}>查询</Button>
            <Button onClick={onReset}>重置</Button>
          </div>
        </Form>
      </div>
      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增</Button>
        <Popconfirm
          title={`确定批量删除选中的 ${selectedRowKeys.length} 名学生？`}
          description="其关联的用户账号将一并移除"
          okText="批量删除"
          cancelText="取消"
          onConfirm={onBatchDelete}
          disabled={selectedRowKeys.length === 0}
        >
          <Button type="primary" danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>
            批量删除
          </Button>
        </Popconfirm>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<Student>
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="middle"
          rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 名学生` }}
        />
      </Card>

      <Modal
        title={editing ? '编辑学生' : '新增学生（自动创建用户账号）'}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="no" label="学号（同时作为登录账号）" rules={[{ required: true, message: '请输入学号' }]}>
                <Input placeholder="如：2024010130" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dept" label="所属院系" rules={[{ required: true, message: '请选择院系' }]}>
                <Select placeholder="请选择院系" options={DEPT_OPTIONS.map((d) => ({ label: d, value: d }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="major" label="专业" rules={[{ required: true, message: '请输入专业' }]}>
                <Input placeholder="如：材料科学与工程" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="className" label="班级" rules={[{ required: true, message: '请输入班级' }]}>
                <Input placeholder="如：材料2401" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={[{ label: '在读', value: '在读' }, { label: '停用', value: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`学生详情 - ${detail?.name ?? ''}`}
        open={!!detail}
        onClose={() => setDetail(null)}
        width={420}
        destroyOnHidden
      >
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="姓名">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="学号"><span className="scaf-mono">{detail.no}</span></Descriptions.Item>
              <Descriptions.Item label="院系">{detail.dept}</Descriptions.Item>
              <Descriptions.Item label="专业">{detail.major}</Descriptions.Item>
              <Descriptions.Item label="班级"><Tag color="geekblue">{detail.className}</Tag></Descriptions.Item>
              <Descriptions.Item label="手机号"><span className="scaf-mono">{detail.phone || '-'}</span></Descriptions.Item>
              <Descriptions.Item label="在读状态">{detail.status === '在读' ? <Tag color="green">在读</Tag> : <Tag>停用</Tag>}</Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5} style={{ margin: '20px 0 10px' }}>关联用户账号</Typography.Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="登录账号"><span className="scaf-mono">{detail.no}</span></Descriptions.Item>
              <Descriptions.Item label="角色">
                {(users.find((u) => u.username === detail.no)?.roles ?? []).map((r) => <Tag key={r} color="gold">{r}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="账号状态">{users.find((u) => u.username === detail.no)?.status ?? '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

/* ================================ 视图：用户管理 ================================ */

function UserView({
  users,
  setUsers,
}: {
  users: SysUser[]
  setUsers: React.Dispatch<React.SetStateAction<SysUser[]>>
}) {
  const { message } = AntdApp.useApp()
  const [searchForm] = Form.useForm<{ account?: string; name?: string; role?: string; status?: string }>()
  const [applied, setApplied] = useState<{ account: string; name: string; role: string; status: string }>({ account: '', name: '', role: '', status: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SysUser | null>(null)
  const [form] = Form.useForm<{ roles: string[]; status: '启用' | '禁用' }>()

  const list = useMemo(() => {
    const account = applied.account.trim().toLowerCase()
    const name = applied.name.trim().toLowerCase()
    return users
      .filter((u) => !account || u.username.toLowerCase().includes(account))
      .filter((u) => !name || u.name.toLowerCase().includes(name))
      .filter((u) => !applied.role || u.roles.includes(applied.role))
      .filter((u) => !applied.status || u.status === applied.status)
  }, [users, applied])

  const onSearch = () => {
    const v = searchForm.getFieldsValue()
    setApplied({ account: v.account || '', name: v.name || '', role: v.role || '', status: v.status || '' })
  }
  const onReset = () => {
    searchForm.resetFields()
    setApplied({ account: '', name: '', role: '', status: '' })
  }

  const openEdit = (u: SysUser) => {
    setEditing(u)
    form.setFieldsValue({ roles: u.roles, status: u.status })
    setModalOpen(true)
  }

  const onOk = async () => {
    const v = await form.validateFields()
    setUsers((us) => us.map((u) => (u.id === editing!.id ? { ...u, roles: v.roles, status: v.status } : u)))
    message.success('用户信息已更新')
    setModalOpen(false)
  }

  const toggleStatus = (u: SysUser) => {
    setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, status: x.status === '启用' ? '禁用' : '启用' } : x)))
    message.success(u.status === '启用' ? '用户已禁用' : '用户已启用')
  }

  // 锁定后用户无法自行登录，只能由管理员在后台手动解锁
  const toggleLock = (u: SysUser) => {
    setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, locked: !x.locked } : x)))
    message.success(u.locked ? '用户已解锁' : '用户已锁定，需在后台手动解锁')
  }

  const AVATAR_COLORS = ['#3b5bff', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#14b8a6', '#ec4899']

  const columns: TableColumnsType<SysUser> = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 64,
      align: 'center',
      render: (_: unknown, u: SysUser) =>
        u.avatar ? (
          <Avatar size={30} src={u.avatar} />
        ) : (
          <Avatar
            size={30}
            style={{ background: AVATAR_COLORS[u.name.charCodeAt(0) % AVATAR_COLORS.length], fontSize: 13 }}
          >
            {u.name.slice(0, 1)}
          </Avatar>
        ),
    },
    { title: '登录账号', dataIndex: 'username', key: 'username', width: 140, render: (n: string) => <span className="scaf-mono">{n}</span> },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, render: (n: string) => <span className="org-name-text">{n}</span> },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120, render: (p?: string) => <span className="scaf-mono">{maskPhone(p)}</span> },
    { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true, render: (e?: string) => <span className="scaf-mono">{maskEmail(e)}</span> },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 160,
      render: (roles: string[]) => roles.map((r) => <Tag key={r} color="gold">{r}</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (_: unknown, u: SysUser) => (
        <span>{u.status}{u.locked ? '（已锁定）' : ''}</span>
      ),
    },
    { title: '最近登录时间', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 160, render: (t: string) => <span className="scaf-mono">{t}</span> },
    { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (t: string) => <span className="scaf-mono">{t}</span> },
    {
      title: '操作',
      key: 'action',
      width: 170,
      align: 'center',
      render: (_: unknown, u: SysUser) => (
        <Space size={4} className="org-actions">
          {u.status === '启用' ? (
            <Button type="link" size="small" onClick={() => toggleStatus(u)}>禁用</Button>
          ) : (
            <Button type="link" size="small" onClick={() => toggleStatus(u)}>启用</Button>
          )}
          {u.locked ? (
            <Button type="link" size="small" onClick={() => toggleLock(u)}>解锁</Button>
          ) : (
            <Button type="link" size="small" onClick={() => toggleLock(u)}>锁定</Button>
          )}
          <Button type="link" size="small" onClick={() => openEdit(u)}>编辑</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">用户管理</Title>
      <div className="org-search-bar">
        <Form form={searchForm} layout="horizontal" className="org-search-form" labelCol={{ flex: '90px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item name="account" label="账号" className="org-filter-item">
            <Input allowClear placeholder="输入登录账号" />
          </Form.Item>
          <Form.Item name="name" label="姓名" className="org-filter-item">
            <Input allowClear placeholder="输入姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" className="org-filter-item">
            <Select allowClear placeholder="全部" options={ROLE_OPTIONS.map((r) => ({ label: r, value: r }))} />
          </Form.Item>
          <Form.Item name="status" label="状态" className="org-filter-item">
            <Select allowClear placeholder="全部" options={[{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }]} />
          </Form.Item>
          <div className="org-search-btns">
            <Button type="primary" onClick={onSearch}>查询</Button>
            <Button onClick={onReset}>重置</Button>
          </div>
        </Form>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<SysUser>
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 个用户（教师 + 学生自动同步）` }}
        />
      </Card>

      <Modal
        title={`编辑用户 - ${editing?.name ?? ''}`}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={460}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="roles" label="角色" rules={[{ required: true, message: '至少选择一个角色' }]}>
            <Select mode="multiple" placeholder="选择角色" options={ROLE_OPTIONS.map((r) => ({ label: r, value: r }))} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={[{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

/* ================================ 视图：角色管理 ================================ */

function RoleView({
  roles,
  setRoles,
  users,
}: {
  roles: Role[]
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>
  users: SysUser[]
}) {
  const { message } = AntdApp.useApp()
  const [searchForm] = Form.useForm<{ name?: string }>()
  const [applied, setApplied] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [form] = Form.useForm<{ name: string; desc: string }>()

  const userCountOf = (roleName: string) => users.filter((u) => u.roles.includes(roleName)).length

  const list = useMemo(() => {
    const kw = applied.trim().toLowerCase()
    if (!kw) return roles
    return roles.filter((r) => r.name.toLowerCase().includes(kw))
  }, [roles, applied])

  const onSearch = () => setApplied(searchForm.getFieldsValue().name || '')
  const onReset = () => {
    searchForm.resetFields()
    setApplied('')
  }

  const openEdit = (r: Role) => {
    setEditing(r)
    form.setFieldsValue({ name: r.name, desc: r.desc })
    setModalOpen(true)
  }

  const onOk = async () => {
    const v = await form.validateFields()
    setRoles((rs) => rs.map((r) => (r.id === editing!.id ? { ...r, ...v } : r)))
    message.success('角色已更新')
    setModalOpen(false)
  }

  const onDelete = (r: Role) => {
    if (userCountOf(r.name) > 0) {
      message.warning(`角色「${r.name}」下仍有 ${userCountOf(r.name)} 个用户，无法删除`)
      return
    }
    setRoles((rs) => rs.filter((x) => x.id !== r.id))
    message.success('角色已删除')
  }

  const columns: TableColumnsType<Role> = [
    { title: '角色名称', dataIndex: 'name', key: 'name', width: 160, render: (n: string) => <span className="org-name-text">{n}</span> },
    { title: '描述', dataIndex: 'desc', key: 'desc', ellipsis: true, render: (d: string) => <span className="scaf-remark">{d}</span> },
    {
      title: '操作',
      key: 'action',
      width: 130,
      align: 'center',
      render: (_: unknown, r: Role) => (
        <Space size={4} className="org-actions">
          <Button type="link" size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除该角色？" onConfirm={() => onDelete(r)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">角色管理</Title>
      <div className="org-search-bar">
        <Form form={searchForm} layout="horizontal" className="org-search-form" labelCol={{ flex: '90px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item name="name" label="角色名称" className="org-filter-item">
            <Input allowClear placeholder="输入角色名称" />
          </Form.Item>
          <div className="org-search-btns">
            <Button type="primary" onClick={onSearch}>查询</Button>
            <Button onClick={onReset}>重置</Button>
          </div>
        </Form>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<Role>
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title={`编辑角色 - ${editing?.name ?? ''}`}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="如：辅导员" />
          </Form.Item>
          <Form.Item label="权限字符" help="由后端生成并注册到数据库，不允许修改">
            <Input value={editing?.code} disabled />
          </Form.Item>
          <Form.Item name="desc" label="描述">
            <Input.TextArea rows={3} placeholder="角色职责说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

/* ============================ 视图：菜单管理（树形表格） ============================ */

function mapMenuTree(tree: MenuNode[], id: string, fn: (n: MenuNode) => MenuNode): MenuNode[] {
  return tree.map((n) => (n.id === id ? fn(n) : { ...n, children: n.children ? mapMenuTree(n.children, id, fn) : undefined }))
}

function removeMenuNode(tree: MenuNode[], id: string): MenuNode[] {
  return tree
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: n.children ? removeMenuNode(n.children, id) : undefined }))
}

function collectMenuKeys(tree: MenuNode[]): string[] {
  const keys: string[] = []
  const walk = (ns: MenuNode[]) => ns.forEach((n) => { keys.push(n.id); if (n.children) walk(n.children) })
  walk(tree)
  return keys
}

function MenuView() {
  const { message } = AntdApp.useApp()
  const [tree, setTree] = useState<MenuNode[]>(() => JSON.parse(JSON.stringify(seedMenuTree)) as MenuNode[])
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() => collectMenuKeys(seedMenuTree))

  // 新增 / 编辑弹窗
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [target, setTarget] = useState<MenuNode | null>(null)
  const [form] = Form.useForm<{ name: string; path: string }>()

  // 授权弹窗（独立操作）
  const [authOpen, setAuthOpen] = useState(false)
  const [authTarget, setAuthTarget] = useState<MenuNode | null>(null)
  const [authRoles, setAuthRoles] = useState<string[]>([])

  const openAdd = () => {
    setModalMode('add')
    setTarget(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (n: MenuNode) => {
    setModalMode('edit')
    setTarget(n)
    form.setFieldsValue({ name: n.name, path: n.path })
    setModalOpen(true)
  }

  const onModalOk = async () => {
    const v = await form.validateFields()
    if (modalMode === 'edit') {
      if (!target) return
      setTree((t) => mapMenuTree(t, target.id, (n) => ({ ...n, ...v })))
      message.success('菜单已保存')
    } else {
      const node: MenuNode = { id: `m_${Date.now()}`, ...v, roles: [] }
      setTree((t) => [...t, node])
      message.success('菜单新增成功')
    }
    setModalOpen(false)
  }

  const openAuth = (n: MenuNode) => {
    setAuthTarget(n)
    setAuthRoles([...n.roles])
    setAuthOpen(true)
  }

  const onAuthOk = () => {
    if (!authTarget) return
    setTree((t) => mapMenuTree(t, authTarget.id, (n) => ({ ...n, roles: authRoles })))
    message.success(`已更新「${authTarget.name}」的授权角色`)
    setAuthOpen(false)
  }

  const onDelete = (n: MenuNode) => {
    if (n.children && n.children.length > 0) {
      message.warning('该菜单存在子级，请先删除子级')
      return
    }
    setTree((t) => removeMenuNode(t, n.id))
    message.success('菜单已删除')
  }

  const columns: TableColumnsType<MenuNode> = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (n: string) => <span className="org-name-text">{n}</span>,
    },
    {
      title: '路由地址',
      dataIndex: 'path',
      key: 'path',
      render: (p: string) => (p ? <span className="scaf-mono">{p}</span> : <span className="scaf-remark">-</span>),
    },
    {
      title: '授权角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 260,
      render: (roles: string[]) =>
        roles && roles.length > 0 ? roles.map((r) => <Tag key={r} color="gold">{r}</Tag>) : <span className="scaf-remark">未授权</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      align: 'center',
      render: (_: unknown, n: MenuNode) => (
        <Space size={0} className="org-actions">
          <Button type="link" size="small" onClick={() => openEdit(n)}>编辑</Button>
          <Button type="link" size="small" onClick={() => openAuth(n)}>授权</Button>
          {!(n.children && n.children.length) && (
            <Popconfirm title="确定删除该菜单？" onConfirm={() => onDelete(n)}>
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">菜单管理</Title>

      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增</Button>
      </div>

      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<MenuNode>
          columns={columns}
          dataSource={tree}
          rowKey="id"
          size="middle"
          pagination={false}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys(keys as string[]),
            expandIcon: ({ expanded, onExpand, record }) => {
              const row = record as MenuNode
              if (!row.children?.length) return <span className="org-tree-indent" />
              return (
                <span className="org-expand-icon" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <DownOutlined /> : <RightOutlined />}
                </span>
              )
            },
          }}
        />
      </Card>

      {/* 新增 / 编辑菜单弹窗 */}
      <Modal
        title={modalMode === 'edit' ? `编辑菜单${target ? ` - ${target.name}` : ''}` : '新增菜单'}
        open={modalOpen}
        onOk={onModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="菜单名称" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="如：教师管理" />
          </Form.Item>
          <Form.Item name="path" label="路由地址" rules={[{ required: true, message: '请输入路由地址' }]}>
            <Input placeholder="如：/personnel/teachers" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 授权弹窗（独立操作） */}
      <Modal
        title={`授权${authTarget ? ` - ${authTarget.name}` : ''}`}
        open={authOpen}
        onOk={onAuthOk}
        onCancel={() => setAuthOpen(false)}
        destroyOnHidden
        width={440}
      >
        <div style={{ marginTop: 12 }}>
          <div className="scaf-remark" style={{ marginBottom: 8 }}>勾选允许访问「{authTarget?.name}」菜单的角色：</div>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="选择角色"
            value={authRoles}
            onChange={setAuthRoles}
            options={ROLE_OPTIONS.map((r) => ({ label: r, value: r }))}
          />
        </div>
      </Modal>
    </div>
  )
}

/* ============================ 视图：任务工具（源自敏捷开发·执行任务） ============================ */

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
    id: 'init-org',
    name: '初始化组织机构数据',
    desc: '按机构代码标准表写入组织架构树，并校验层级完整性。',
    steps: [
      { level: 'info', text: '读取机构代码标准表（v2026.10）' },
      { level: 'info', text: '清理组织架构表 t_org 历史数据（逻辑删除）' },
      { level: 'info', text: '写入一级节点：集团本部、材料学院、计算机学院 等 14 个' },
      { level: 'info', text: '写入二级节点：教务办、学工办、实验中心 等 86 个' },
      { level: 'warn', text: '节点「外国语学院/国际交流中心」缺少负责人，已标记待补录' },
      { level: 'info', text: '校验父子层级完整性（期望深度 3 层）' },
      { level: 'success', text: '组织机构初始化完成，共 100 个节点' },
    ],
  },
  {
    id: 'migrate-teacher',
    name: '迁移教职工数据',
    desc: '解析教职工花名册 Excel，去重校验后写入教师表并同步创建用户账号。',
    steps: [
      { level: 'info', text: '读取源文件：教职工花名册_2026.xlsx（Sheet1，3,206 行）' },
      { level: 'info', text: '解析表头映射：工号 / 姓名 / 院系 / 职称 / 手机号 / 邮箱' },
      { level: 'warn', text: '工号唯一性校验：发现 2 条重复记录（T2017），自动跳过并记录日志' },
      { level: 'info', text: '批量写入 t_teacher：1,204 条 / 批次（1/3）' },
      { level: 'info', text: '批量写入 t_teacher：1,204 条 / 批次（2/3）' },
      { level: 'info', text: '批量写入 t_teacher：796 条 / 批次（3/3）' },
      { level: 'info', text: '同步创建用户账号：t_teacher → t_user（初始角色：教师）' },
      { level: 'success', text: '教职工数据迁移完成：3,204 / 3,206（跳过 2 条）' },
    ],
  },
  {
    id: 'migrate-student',
    name: '迁移学生数据',
    desc: '按院系拆分学生花名册，批量写入学生表并以学号创建登录账号。',
    steps: [
      { level: 'info', text: '读取源文件：学生花名册_2026级.xlsx（6 个 Sheet）' },
      { level: 'info', text: '按院系拆分数据集：材料 / 计算机 / 外国语 / 机械' },
      { level: 'info', text: '校验学号唯一性与班级编码（格式：专业代码 + 年级 + 序号）' },
      { level: 'info', text: '批量写入 t_student：2,000 条 / 批次（共 7 批）' },
      { level: 'warn', text: '12 条记录班级编码为空，已归入「未分班」待处理池' },
      { level: 'info', text: '同步创建用户账号：学号即登录账号（初始角色：学生）' },
      { level: 'info', text: '生成初始密码并记录发放清单' },
      { level: 'success', text: '学生数据迁移完成：12,864 人' },
    ],
  },
  {
    id: 'init-rbac',
    name: '初始化角色与菜单权限',
    desc: '写入角色定义、注册菜单树并完成角色-菜单授权绑定。',
    steps: [
      { level: 'info', text: '清空角色表 t_role 与角色-菜单关联表 t_role_menu' },
      { level: 'info', text: '写入角色：超级管理员 / 教师 / 学生 / 访客' },
      { level: 'info', text: '注册菜单树：控制面板 / 组织管理 / 人员管理 / 系统设置（11 个节点）' },
      { level: 'info', text: '绑定授权：超级管理员 → 全部菜单' },
      { level: 'info', text: '绑定授权：教师 / 学生 → 工作台相关菜单' },
      { level: 'info', text: '校验权限标识唯一性（perm key 冲突 0）' },
      { level: 'success', text: '角色与菜单权限初始化完成' },
    ],
  },
  {
    id: 'reset-pwd',
    name: '重置用户初始密码',
    desc: '为从未登录过的用户批量生成初始密码并加密写库，导出发放清单。',
    steps: [
      { level: 'info', text: '统计从未登录的用户：1,038 个（教师 37 / 学生 1,001）' },
      { level: 'info', text: '生成初始密码（规则：工号/学号后 6 位 @Sca）' },
      { level: 'info', text: '批量更新 t_user.password（BCrypt 加密，500 条 / 批次）' },
      { level: 'info', text: '导出密码发放清单至安全目录（仅超级管理员可下载）' },
      { level: 'success', text: '初始密码重置完成：1,038 个账号' },
    ],
  },
]

function TaskToolView() {
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
      const st = steps[i]
      setLogs((p) => [...p, { time: now(), level: st.level, text: st.text }])
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
      <Title level={4} className="org-page-title">任务工具</Title>

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

/* ============================ 视图：密钥管理 ============================ */

interface AppSecret {
  id: string
  appName: string
  appId: string
  appSecret: string
  status: '启用' | '禁用'
  createdAt: string
  lastUsedAt: string
}

function genAppSecret(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let str = ''
  for (let i = 0; i < 32; i++) str += chars[Math.floor(Math.random() * chars.length)]
  return `sk-${str}`
}

// 密钥列表只展示脱敏形式，原始密钥仅在生成时一次性展示
function maskSecret(secret: string): string {
  return `${secret.slice(0, 3)}****（已隐藏）`
}

const SECRET_APPS: [string, string][] = [
  ['教务系统', 'app-jwxt-001'],
  ['一卡通平台', 'app-card-001'],
  ['图书馆系统', 'app-lib-001'],
  ['财务系统', 'app-fin-001'],
  ['OA 办公系统', 'app-oa-001'],
  ['门禁管理系统', 'app-door-001'],
  ['数据大屏', 'app-screen-001'],
  ['移动端 App', 'app-mobile-001'],
  ['微信小程序', 'app-mini-001'],
  ['校友会系统', 'app-alumni-001'],
  ['就业信息系统', 'app-career-001'],
  ['邮件网关', 'app-mail-001'],
]

function makeSecrets(): AppSecret[] {
  return SECRET_APPS.map(([appName, appId], i) => ({
    id: `sec_${i + 1}`,
    appName,
    appId,
    appSecret: genAppSecret(),
    status: i % 8 === 7 ? '禁用' : '启用',
    createdAt: `2026-0${(i % 6) + 4}-${String((i % 27) + 1).padStart(2, '0')} 10:30`,
    lastUsedAt: i % 8 === 7 ? '从未调用' : `2026-10-1${i % 9} ${String(8 + (i % 12)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
  }))
}

function SecretView() {
  const { message } = AntdApp.useApp()
  const [secrets, setSecrets] = useState<AppSecret[]>(() => makeSecrets())
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<{ appName: string; appId: string }>()
  // 一次性展示的原始密钥，关闭后不再可见
  const [revealed, setRevealed] = useState<AppSecret | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')

  const list = useMemo(() => {
    const kw = search.trim().toLowerCase()
    if (!kw) return secrets
    return secrets.filter((x) => x.appName.toLowerCase().includes(kw) || x.appId.toLowerCase().includes(kw))
  }, [secrets, search])

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      message.success('密钥已复制到剪贴板')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = secret
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      message.success('密钥已复制到剪贴板')
    }
  }

  const onCreate = async () => {
    const v = await form.validateFields()
    if (secrets.some((x) => x.appId.toLowerCase() === v.appId.trim().toLowerCase())) {
      message.error(`appId「${v.appId}」已存在`)
      return
    }
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const item: AppSecret = {
      id: `sec_${Date.now()}`,
      appName: v.appName.trim(),
      appId: v.appId.trim(),
      appSecret: genAppSecret(),
      status: '启用',
      createdAt: `2026-10-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      lastUsedAt: '从未调用',
    }
    setSecrets((xs) => [item, ...xs])
    setModalOpen(false)
    form.resetFields()
    setCopied(false)
    setRevealed(item)
  }

  const toggleStatus = (x: AppSecret) => {
    setSecrets((xs) => xs.map((it) => (it.id === x.id ? { ...it, status: it.status === '启用' ? '禁用' : '启用' } : it)))
    message.success(x.status === '启用' ? '已禁用该应用的调用凭证' : '已启用该应用的调用凭证')
  }

  const onDelete = (x: AppSecret) => {
    setSecrets((xs) => xs.filter((it) => it.id !== x.id))
    message.success(`已删除应用「${x.appName}」的密钥，请通知对方停止调用`)
  }

  const columns: TableColumnsType<AppSecret> = [
    { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 150, render: (n: string) => <span className="org-name-text">{n}</span> },
    { title: 'appId', dataIndex: 'appId', key: 'appId', width: 160, render: (v: string) => <span className="scaf-mono">{v}</span> },
    {
      title: '密钥 (appSecret)',
      dataIndex: 'appSecret',
      key: 'appSecret',
      width: 200,
      render: (v: string) => <span className="scaf-mono scaf-remark">{maskSecret(v)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (_: unknown, x: AppSecret) => <Switch size="small" checked={x.status === '启用'} onChange={() => toggleStatus(x)} />,
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (t: string) => <span className="scaf-mono">{t}</span> },
    { title: '最近调用', dataIndex: 'lastUsedAt', key: 'lastUsedAt', width: 150, render: (t: string) => <span className="scaf-mono">{t}</span> },
    {
      title: '操作',
      key: 'action',
      width: 90,
      align: 'center',
      render: (_: unknown, x: AppSecret) => (
        <Popconfirm title="确定删除该密钥？" description="删除后对方将无法再调用接口" onConfirm={() => onDelete(x)}>
          <Button type="link" size="small" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">密钥管理</Title>
      <div className="org-search-bar">
        <Form layout="horizontal" className="org-search-form" labelCol={{ flex: '80px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item label="关键字" className="org-filter-item">
            <Input allowClear placeholder="应用名称 / appId" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Form.Item>
          <div className="org-search-btns">
            <Button onClick={() => setSearch('')}>重置</Button>
          </div>
        </Form>
      </div>
      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增密钥</Button>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<AppSecret>
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 个应用密钥` }}
        />
      </Card>

      {/* 新增密钥 */}
      <Modal
        title="新增密钥"
        open={modalOpen}
        onOk={onCreate}
        onCancel={() => setModalOpen(false)}
        okText="生成密钥"
        destroyOnHidden
        width={460}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="appName" label="应用名称" rules={[{ required: true, message: '请输入应用名称' }]}>
            <Input placeholder="如：教务系统" />
          </Form.Item>
          <Form.Item name="appId" label="appId" rules={[{ required: true, message: '请输入 appId' }]}>
            <Input placeholder="如：app-jwxt-001" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 一次性密钥展示：关闭后无法再次查看 */}
      <Modal
        title="密钥生成成功"
        open={!!revealed}
        onCancel={() => setRevealed(null)}
        footer={[
          <Button key="copy" type="primary" onClick={() => revealed && copySecret(revealed.appSecret)}>
            {copied ? '已复制' : '复制密钥'}
          </Button>,
          <Button key="close" onClick={() => setRevealed(null)}>我已保存，关闭</Button>,
        ]}
        width={520}
        destroyOnHidden
      >
        {revealed && (
          <div className="scaf-secret-reveal">
            <div className="scaf-secret-warn">
              <BellOutlined style={{ color: '#f59e0b' }} />
              请立即复制并妥善保存。关闭本窗口后将永远无法再次查看该密钥，只能重新生成。
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="应用名称">{revealed.appName}</Descriptions.Item>
              <Descriptions.Item label="appId"><span className="scaf-mono">{revealed.appId}</span></Descriptions.Item>
              <Descriptions.Item label="appSecret">
                <span className="scaf-mono scaf-secret-text">{revealed.appSecret}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ============================ 视图：对接日志 ============================ */

interface ApiCallLog {
  id: string
  direction: 'in' | 'out'
  system: string // 入站：来源应用；出站：目标系统
  appId?: string // 入站时的调用方 appId
  apiName: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  fullUrl: string
  statusCode: number
  duration: number
  time: string
  ip: string
  requestParams: Record<string, unknown>
  responseResult: Record<string, unknown>
  errorMsg?: string
}

function makeApiLogs(): ApiCallLog[] {
  let seq = 0
  const pad = (n: number) => String(n).padStart(2, '0')
  const mkTime = (i: number) => `2026-10-20 ${pad(8 + (i % 12))}:${pad((i * 17) % 60)}:${pad((i * 29) % 60)}`

  const inbound: Array<[string, string, ApiCallLog['method'], string, Record<string, unknown>, Record<string, unknown>]> = [
    ['教务系统', 'app-jwxt-001', 'POST', '/api/open/teacher/sync', { batchNo: 'TB20261020-01', total: 120, teachers: [{ no: 'T2001', name: '张明远' }] }, { code: 0, message: 'ok', data: { success: 120, failed: 0 } }],
    ['一卡通平台', 'app-card-001', 'GET', '/api/open/student/balance', { studentNo: '2024010101' }, { code: 0, data: { name: '赵晨曦', balance: 128.5 } }],
    ['图书馆系统', 'app-lib-001', 'GET', '/api/open/student/info', { studentNo: '2024010102', fields: 'name,dept,className' }, { code: 0, data: { name: '钱思远', dept: '材料学院', className: '材料2401' } }],
    ['财务系统', 'app-fin-001', 'POST', '/api/open/tuition/status', { studentNos: ['2024010101', '2024010102'], semester: '2026-2027-1' }, { code: 0, data: [{ studentNo: '2024010101', paid: true }] }],
    ['移动端 App', 'app-mobile-001', 'POST', '/api/open/auth/token', { appId: 'app-mobile-001', sign: 'a3f8d2e9' }, { code: 0, data: { token: 'eyJhbGciOi...', expiresIn: 7200 } }],
    ['OA 办公系统', 'app-oa-001', 'POST', '/api/open/notice/push', { title: '关于开展安全检查的通知', target: 'all-teachers' }, { code: 0, message: 'ok', data: { pushId: 'N20261020-88', received: 204 } }],
    ['门禁管理系统', 'app-door-001', 'GET', '/api/open/person/photo', { personNo: 'T2003', size: 'medium' }, { code: 404, message: 'photo not found' }],
    ['教务系统', 'app-jwxt-001', 'PUT', '/api/open/student/class', { studentNo: '2024010115', from: '软工2401', to: '软工2402' }, { code: 0, message: 'ok' }],
    ['微信小程序', 'app-mini-001', 'GET', '/api/open/course/timetable', { studentNo: '2024020115', week: 8 }, { code: 0, data: { courses: 12, items: [{ day: 1, name: '材料力学' }] } }],
    ['一卡通平台', 'app-card-001', 'POST', '/api/open/card/report-loss', { cardNo: 'C10086', operator: 'auto' }, { code: 0, data: { result: 'success', lostAt: '2026-10-20 09:12' } }],
    ['就业信息系统', 'app-career-001', 'GET', '/api/open/student/resume', { studentNo: '2023030508' }, { code: 500, message: 'internal error' }],
    ['数据大屏', 'app-screen-001', 'GET', '/api/open/stats/overview', { date: '2026-10-19' }, { code: 0, data: { teachers: 3204, students: 12864, online: 128 } }],
  ]

  const outbound: Array<[string, ApiCallLog['method'], string, Record<string, unknown>, Record<string, unknown>]> = [
    ['短信平台', 'POST', '/sms/v2/send', { mobile: '138****1001', signName: '星辉大学', template: 'SMS_10086', params: { code: '582913' } }, { code: 'OK', bizId: '8821001', message: '发送成功' }],
    ['支付网关', 'POST', '/v1/pay/orders', { outTradeNo: 'TF20261020-55', amount: 4500.0, subject: '学费缴纳', studentNo: '2024010101' }, { returnCode: 'SUCCESS', tradeNo: 'PAY20261020123456' }],
    ['人脸识别服务', 'POST', '/v1/face/verify', { personNo: 'T2005', imageHash: 'sha256:9f2a...' }, { code: 0, score: 0.97, passed: true }],
    ['邮件网关', 'POST', '/mail/v2/send', { to: 't2001@univ.edu.cn', subject: '系统备份完成通知', template: 'SYS_NOTIFY' }, { code: 0, messageId: 'M20261020-01' }],
    ['对象存储 OSS', 'PUT', '/bucket/backup/daily_1019.tar.gz', { acl: 'private', storageClass: 'IA' }, { etag: 'd41d8cd98f00b204e9800998ecf8427e', url: 'https://oss.../daily_1019.tar.gz' }],
    ['天气服务', 'GET', '/v3/weather/now', { city: '310000', key: '***' }, { code: '200', now: { temp: '22', text: '多云' } }],
    ['学信数据同步', 'POST', '/open/graduate/push', { gradates: [{ no: '2020030501', status: '毕业' }] }, { code: 0, accepted: 286 }],
    ['支付网关', 'GET', '/v1/pay/orders/TF20261019-31', {}, { returnCode: 'SUCCESS', tradeState: 'REFUND' }],
    ['短信平台', 'POST', '/sms/v2/send', { mobile: '159****2002', signName: '星辉大学', template: 'SMS_10010', params: { className: '材料2401' } }, { code: 'LIMIT', message: '触发频控' }],
    ['人脸识别服务', 'POST', '/v1/face/verify', { personNo: 'S0001', imageHash: 'sha256:aa31...' }, { code: 0, score: 0.42, passed: false }],
    ['地图服务', 'GET', '/v3/geocode/addr', { address: '星辉大学材料楼' }, { code: '0', location: '121.39,31.11' }],
    ['对象存储 OSS', 'DELETE', '/bucket/tmp/upload_9831.xlsx', {}, { code: 204 }],
  ]

  const logs: ApiCallLog[] = []
  // 出站各目标系统域名（入站统一走我们的网关域名）
  const OUT_DOMAIN: Record<string, string> = {
    短信平台: 'https://sms-gw.thirdparty.cn',
    支付网关: 'https://pay-gw.unionpay.com',
    人脸识别服务: 'https://face-api.vendor.com',
    邮件网关: 'https://mail-gw.univ.edu.cn',
    '对象存储 OSS': 'https://oss-cn-beijing.aliyuncs.com',
    天气服务: 'https://api.weather.cn',
    学信数据同步: 'https://open.chsi.com.cn',
    地图服务: 'https://restapi.amap.com',
  }

  const push = (direction: 'in' | 'out') => {
    const isOk = (result: Record<string, unknown>) =>
      !result.message?.toString().match(/error|not found|频控/) && !result.code?.toString().match(/500|LIMIT|404/)

    if (direction === 'in') {
      inbound.forEach(([apiName, appRef, method, path, params, result], i) => {
        const res = result as Record<string, unknown>
        const ok = isOk(res)
        seq += 1
        logs.push({
          id: `api_${seq}`,
          direction,
          system: apiName,
          appId: appRef,
          apiName,
          method,
          path,
          fullUrl: `https://api.univ.edu.cn${path}`,
          statusCode: ok ? 200 : Number(res.code) || 500,
          duration: 45 + ((i * 137 + seq * 53) % 1860),
          time: mkTime(seq),
          ip: `10.12.${3 + (i % 5)}.${(i * 31) % 200}`,
          requestParams: params,
          responseResult: res,
          errorMsg: ok ? undefined : String(res.message || res.code || '调用失败'),
        })
      })
    } else {
      outbound.forEach(([system, method, path, params, result], i) => {
        const res = result as Record<string, unknown>
        const ok = isOk(res)
        seq += 1
        logs.push({
          id: `api_${seq}`,
          direction,
          system,
          apiName: system,
          method,
          path,
          fullUrl: `${OUT_DOMAIN[system] ?? 'https://unknown.example.com'}${path}`,
          statusCode: ok ? 200 : 500,
          duration: 45 + ((i * 137 + seq * 53) % 1860),
          time: mkTime(seq),
          ip: `47.98.${20 + (i % 9)}.${(i * 17) % 240}`,
          requestParams: params,
          responseResult: res,
          errorMsg: ok ? undefined : String(res.message || res.code || '调用失败'),
        })
      })
    }
  }
  push('in')
  push('out')
  return logs
}

function ApiLogView() {
  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in')
  const [kw, setKw] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const allLogs = useMemo(() => makeApiLogs(), [])
  const [detail, setDetail] = useState<ApiCallLog | null>(null)

  const list = useMemo(() => {
    const k = kw.trim().toLowerCase()
    return allLogs
      .filter((l) => l.direction === activeTab)
      .filter((l) => !k || l.apiName.toLowerCase().includes(k) || l.path.toLowerCase().includes(k) || l.system.toLowerCase().includes(k))
      .filter((l) => !statusFilter || (statusFilter === '成功' ? l.statusCode < 400 : l.statusCode >= 400))
      .sort((a, b) => b.time.localeCompare(a.time))
  }, [allLogs, activeTab, kw, statusFilter])

  const columns: TableColumnsType<ApiCallLog> = [
    { title: '调用时间', dataIndex: 'time', key: 'time', width: 160, render: (t: string) => <span className="scaf-mono">{t}</span> },
    { title: activeTab === 'in' ? '来源应用' : '目标系统', dataIndex: 'system', key: 'system', width: 140, render: (x: string) => <span className="org-name-text">{x}</span> },
    { title: '接口名称', dataIndex: 'apiName', key: 'apiName', ellipsis: true },
    {
      title: '请求方式',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (m: string) => <Tag color={m === 'GET' ? 'cyan' : m === 'POST' ? 'blue' : 'geekblue'}>{m}</Tag>,
    },
    { title: '请求地址', dataIndex: 'fullUrl', key: 'fullUrl', width: 280, ellipsis: true, render: (_: unknown, l: ApiCallLog) => <span className="scaf-mono" title={l.fullUrl}>{l.fullUrl}</span> },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 80,
      align: 'center',
      render: (c: number) => <span className="scaf-mono">{c}</span>,
    },
    { title: '耗时', dataIndex: 'duration', key: 'duration', width: 90, align: 'right', render: (d: number) => <span className="scaf-mono">{d} ms</span> },
    {
      title: '结果',
      key: 'result',
      width: 80,
      align: 'center',
      render: (_: unknown, l: ApiCallLog) => (l.statusCode < 400 ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_: unknown, l: ApiCallLog) => (
        <Button type="link" size="small" onClick={() => setDetail(l)}>详情</Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">对接日志</Title>
      <Tabs
        activeKey={activeTab}
        onChange={(k: string) => setActiveTab(k as 'in' | 'out')}
        items={[
          { key: 'in', label: `入站调用（${allLogs.filter((l) => l.direction === 'in').length}）` },
          { key: 'out', label: `出站调用（${allLogs.filter((l) => l.direction === 'out').length}）` },
        ]}
      />
      <div className="org-search-bar">
        <Form layout="horizontal" className="org-search-form" labelCol={{ flex: '80px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item label="关键字" className="org-filter-item">
            <Input allowClear placeholder="接口名称 / 请求路径 / 系统" value={kw} onChange={(e) => setKw(e.target.value)} />
          </Form.Item>
          <Form.Item label="调用状态" className="org-filter-item">
            <Select allowClear placeholder="全部" style={{ minWidth: 120 }} value={statusFilter} onChange={setStatusFilter}
              options={[{ label: '成功', value: '成功' }, { label: '失败', value: '失败' }]} />
          </Form.Item>
          <div className="org-search-btns">
            <Button onClick={() => { setKw(''); setStatusFilter(undefined) }}>重置</Button>
          </div>
        </Form>
      </div>

      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<ApiCallLog>
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Drawer
        title="调用详情"
        open={!!detail}
        onClose={() => setDetail(null)}
        width={600}
        destroyOnHidden
      >
        {detail && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="调用方向">{detail.direction === 'in' ? '入站调用（对方 → 我们）' : '出站调用（我们 → 对方）'}</Descriptions.Item>
              <Descriptions.Item label={detail.direction === 'in' ? '来源应用' : '目标系统'}>{detail.system}</Descriptions.Item>
              {detail.appId && (
                <Descriptions.Item label="调用方 appId"><span className="scaf-mono">{detail.appId}</span></Descriptions.Item>
              )}
              <Descriptions.Item label="接口名称">{detail.apiName}</Descriptions.Item>
              <Descriptions.Item label="请求方式">
                <Tag color={detail.method === 'GET' ? 'cyan' : detail.method === 'POST' ? 'blue' : 'geekblue'}>{detail.method}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="完整地址"><span className="scaf-mono" style={{ wordBreak: 'break-all' }}>{detail.fullUrl}</span></Descriptions.Item>
              <Descriptions.Item label="调用时间"><span className="scaf-mono">{detail.time}</span></Descriptions.Item>
              <Descriptions.Item label={detail.direction === 'in' ? '来源 IP' : '目标 IP'}><span className="scaf-mono">{detail.ip}</span></Descriptions.Item>
              <Descriptions.Item label="HTTP 状态码"><span className="scaf-mono">{detail.statusCode}</span></Descriptions.Item>
              <Descriptions.Item label="耗时"><span className="scaf-mono">{detail.duration} ms</span></Descriptions.Item>
              <Descriptions.Item label="调用结果">
                {detail.statusCode < 400 ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>}
              </Descriptions.Item>
              {detail.errorMsg && (
                <Descriptions.Item label="错误信息"><span style={{ color: '#ef4444' }}>{detail.errorMsg}</span></Descriptions.Item>
              )}
            </Descriptions>
            <Typography.Title level={5} style={{ margin: '20px 0 10px' }}>请求参数</Typography.Title>
            <pre className="scaf-json">{JSON.stringify(detail.requestParams, null, 2)}</pre>
            <Typography.Title level={5} style={{ margin: '20px 0 10px' }}>响应结果</Typography.Title>
            <pre className="scaf-json">{JSON.stringify(detail.responseResult, null, 2)}</pre>
          </>
        )}
      </Drawer>
    </div>
  )
}

/* ============================ 视图：令牌管理 ============================ */

interface AppToken {
  id: string
  token: string // 32 位简化 UUID
  description: string
  status: '启用' | '禁用'
  createdAt: string
  expireAt: string | null // null 表示永不过期
  lastUsedAt: string
}

// 32 位简化 UUID（无连字符十六进制）
function genToken(): string {
  let str = ''
  for (let i = 0; i < 32; i++) str += Math.floor(Math.random() * 16).toString(16)
  return str
}

// 列表只展示脱敏形式：前 8 位 + **** + 后 8 位
function maskToken(token: string): string {
  return `${token.slice(0, 8)}********${token.slice(-8)}`
}

const TOKEN_SEEDS: Array<[string, string | null, '启用' | '禁用']> = [
  ['教务系统数据同步令牌', '2026-12-31 23:59', '启用'],
  ['一卡通平台对接令牌', '2026-11-30 23:59', '启用'],
  ['移动端 App 推送令牌', '2027-06-30 23:59', '启用'],
  ['数据大屏只读令牌', null, '启用'],
  ['图书馆系统查询令牌', '2026-09-30 23:59', '启用'],
  ['门禁系统临时令牌', '2026-10-10 23:59', '启用'],
  ['OA 待办推送令牌', '2027-03-31 23:59', '禁用'],
  ['财务对账令牌', '2026-12-31 23:59', '启用'],
  ['监控探针上报令牌', null, '启用'],
  ['微信小程序登录令牌', '2026-10-15 23:59', '启用'],
]

function makeTokens(): AppToken[] {
  return TOKEN_SEEDS.map(([description, expireAt, status], i) => ({
    id: `tk_${i + 1}`,
    token: genToken(),
    description,
    status,
    createdAt: `2026-0${(i % 6) + 5}-${String((i % 27) + 1).padStart(2, '0')} 11:20`,
    expireAt,
    lastUsedAt: i % 4 === 3 ? '从未使用' : `2026-10-1${i % 9} ${String(9 + (i % 11)).padStart(2, '0')}:${String((i * 19) % 60).padStart(2, '0')}`,
  }))
}

function TokenView() {
  const { message } = AntdApp.useApp()
  const [tokens, setTokens] = useState<AppToken[]>(() => makeTokens())
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm<{ description: string; expireDays: number | null }>()
  // 一次性展示的原始令牌，关闭后不再可见
  const [revealed, setRevealed] = useState<AppToken | null>(null)
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')

  const isExpired = (x: AppToken) => x.expireAt !== null && x.expireAt < '2026-10-20 10:00'
  const statusOf = (x: AppToken) => (x.status === '禁用' ? '已禁用' : isExpired(x) ? '已过期' : '生效中')

  const list = useMemo(() => {
    const kw = search.trim().toLowerCase()
    if (!kw) return tokens
    return tokens.filter((x) => x.description.toLowerCase().includes(kw) || x.token.toLowerCase().includes(kw))
  }, [tokens, search])

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      message.success('令牌已复制到剪贴板')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = token
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      message.success('令牌已复制到剪贴板')
    }
  }

  const onCreate = async () => {
    const v = await form.validateFields()
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const createdAt = `2026-10-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    let expireAt: string | null = null
    if (v.expireDays !== null) {
      const d = new Date(now.getTime() + (v.expireDays as number) * 86400000)
      expireAt = `2026-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    }
    const item: AppToken = {
      id: `tk_${Date.now()}`,
      token: genToken(),
      description: v.description.trim(),
      status: '启用',
      createdAt,
      expireAt,
      lastUsedAt: '从未使用',
    }
    setTokens((xs) => [item, ...xs])
    setModalOpen(false)
    form.resetFields()
    setCopied(false)
    setRevealed(item)
  }

  const toggleStatus = (x: AppToken) => {
    setTokens((xs) => xs.map((it) => (it.id === x.id ? { ...it, status: it.status === '启用' ? '禁用' : '启用' } : it)))
    message.success(x.status === '启用' ? '已禁用该令牌' : '已启用该令牌')
  }

  const onDelete = (x: AppToken) => {
    setTokens((xs) => xs.filter((it) => it.id !== x.id))
    message.success(`已删除令牌「${x.description}」，持有方将立即失效`)
  }

  const statusTag = (x: AppToken) => {
    const st = statusOf(x)
    if (st === '生效中') return <Tag color="green">生效中</Tag>
    if (st === '已过期') return <Tag color="red">已过期</Tag>
    return <Tag>已禁用</Tag>
  }

  const columns: TableColumnsType<AppToken> = [
    { title: '令牌', dataIndex: 'token', key: 'token', width: 230, render: (t: string) => <span className="scaf-mono scaf-remark">{maskToken(t)}</span> },
    { title: '描述信息', dataIndex: 'description', key: 'description', ellipsis: true, render: (d: string) => <span className="org-name-text">{d}</span> },
    { title: '状态', key: 'status', width: 90, align: 'center', render: (_: unknown, x: AppToken) => statusTag(x) },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (t: string) => <span className="scaf-mono">{t}</span> },
    {
      title: '过期时间',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 150,
      render: (t: string | null) => (t ? <span className="scaf-mono">{t}</span> : <Tag color="blue">永不过期</Tag>),
    },
    { title: '最近使用', dataIndex: 'lastUsedAt', key: 'lastUsedAt', width: 150, render: (t: string) => <span className="scaf-mono">{t}</span> },
    {
      title: '启用',
      key: 'switch',
      width: 70,
      align: 'center',
      render: (_: unknown, x: AppToken) => <Switch size="small" checked={x.status === '启用'} onChange={() => toggleStatus(x)} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_: unknown, x: AppToken) => (
        <Space size={4} className="org-actions">
          <Button type="link" size="small" onClick={() => copyToken(x.token)}>复制</Button>
          <Popconfirm title="确定删除该令牌？" description="删除后持有方将立即失效" onConfirm={() => onDelete(x)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">令牌管理</Title>
      <div className="org-search-bar">
        <Form layout="horizontal" className="org-search-form" labelCol={{ flex: '80px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item label="关键字" className="org-filter-item">
            <Input allowClear placeholder="描述信息 / 令牌" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Form.Item>
          <div className="org-search-btns">
            <Button onClick={() => setSearch('')}>重置</Button>
          </div>
        </Form>
      </div>
      <div className="org-action-row">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增令牌</Button>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<AppToken>
          columns={columns}
          dataSource={list}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 个令牌` }}
        />
      </Card>

      {/* 新增令牌 */}
      <Modal
        title="新增令牌"
        open={modalOpen}
        onOk={onCreate}
        onCancel={() => setModalOpen(false)}
        okText="生成令牌"
        destroyOnHidden
        width={460}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="description" label="描述信息" rules={[{ required: true, message: '请输入描述信息' }]}>
            <Input.TextArea rows={2} placeholder="如：教务系统数据同步令牌" maxLength={60} showCount />
          </Form.Item>
          <Form.Item name="expireDays" label="有效期" rules={[{ required: true, message: '请选择有效期' }]} initialValue={90}>
            <Select
              options={[
                { label: '30 天', value: 30 },
                { label: '90 天', value: 90 },
                { label: '365 天', value: 365 },
                { label: '永不过期', value: null },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 一次性令牌展示：关闭后无法再次查看 */}
      <Modal
        title="令牌生成成功"
        open={!!revealed}
        onCancel={() => setRevealed(null)}
        footer={[
          <Button key="copy" type="primary" onClick={() => revealed && copyToken(revealed.token)}>
            {copied ? '已复制' : '复制令牌'}
          </Button>,
          <Button key="close" onClick={() => setRevealed(null)}>我已保存，关闭</Button>,
        ]}
        width={520}
        destroyOnHidden
      >
        {revealed && (
          <div className="scaf-secret-reveal">
            <div className="scaf-secret-warn">
              <BellOutlined style={{ color: '#f59e0b' }} />
              请立即复制并妥善保存。关闭本窗口后将永远无法再次查看该令牌，只能重新生成。
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="描述信息">{revealed.description}</Descriptions.Item>
              <Descriptions.Item label="令牌">
                <span className="scaf-mono scaf-secret-text">{revealed.token}</span>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间"><span className="scaf-mono">{revealed.createdAt}</span></Descriptions.Item>
              <Descriptions.Item label="过期时间">
                {revealed.expireAt ? <span className="scaf-mono">{revealed.expireAt}</span> : <Tag color="blue">永不过期</Tag>}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ----------------------------- 视图：操作日志 ----------------------------- */

interface LogRow {
  key: string
  time: string
  user: string
  module: string
  action: string
  detail: string
  ip: string
  status: '成功' | '失败'
}

const LOG_MODULES = ['用户管理', '角色权限', '系统配置', '组织管理', '登录认证', '操作日志']

function buildLogs(): LogRow[] {
  const users = ['张明', '李娜', '王强', '赵磊', '陈浩', '系统']
  const actions: Record<string, string[]> = {
    用户管理: ['新增用户', '编辑用户', '禁用账号', '重置密码'],
    角色权限: ['新增角色', '分配权限', '删除角色', '修改角色'],
    系统配置: ['新增配置项', '修改配置值', '停用配置项', '删除配置项'],
    组织管理: ['新增子组织', '编辑组织', '删除组织', '移动组织'],
    登录认证: ['登录系统', '退出登录', '登录失败', '刷新令牌'],
    操作日志: ['导出日志', '清空日志', '查看明细'],
  }
  const rows: LogRow[] = []
  let id = 0
  for (let i = 0; i < 46; i++) {
    const mod = LOG_MODULES[i % LOG_MODULES.length]
    const acts = actions[mod]
    const action = acts[i % acts.length]
    const status: LogRow['status'] = Math.random() > 0.88 ? '失败' : '成功'
    const h = String(8 + (i % 12)).padStart(2, '0')
    const m = String((i * 7) % 60).padStart(2, '0')
    const s = String((i * 13) % 60).padStart(2, '0')
    rows.push({
      key: `log_${id++}`,
      time: `2026-10-19 ${h}:${m}:${s}`,
      user: users[i % users.length],
      module: mod,
      action,
      detail: `${users[i % users.length]} 在「${mod}」执行了「${action}」`,
      ip: `10.12.${3 + (i % 5)}.${(i * 7) % 200}`,
      status,
    })
  }
  return rows
}

function LogsView() {
  const allLogs = useMemo(() => buildLogs(), [])
  const [filterForm] = Form.useForm()
  const [applied, setApplied] = useState<{ user: string; module: string; status: string }>({
    user: '',
    module: '',
    status: '',
  })

  const list = useMemo(() => {
    const kw = applied.user.trim().toLowerCase()
    return allLogs
      .filter((r) => !kw || r.user.toLowerCase().includes(kw) || r.detail.toLowerCase().includes(kw))
      .filter((r) => !applied.module || r.module === applied.module)
      .filter((r) => !applied.status || r.status === applied.status)
  }, [allLogs, applied])

  const onSearch = () => {
    const v = filterForm.getFieldsValue()
    setApplied({ user: v.user || '', module: v.module || '', status: v.status || '' })
  }
  const onReset = () => {
    filterForm.resetFields()
    setApplied({ user: '', module: '', status: '' })
  }

  const columns: TableColumnsType<LogRow> = [
    { title: '操作时间', dataIndex: 'time', key: 'time', width: 180, render: (t: string) => <span className="scaf-mono">{t}</span> },
    { title: '操作人', dataIndex: 'user', key: 'user', width: 100 },
    { title: '模块', dataIndex: 'module', key: 'module', width: 120, render: (m: string) => <Tag color="blue">{m}</Tag> },
    { title: '操作类型', dataIndex: 'action', key: 'action', width: 140 },
    { title: '描述', dataIndex: 'detail', key: 'detail', ellipsis: true },
    { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 150, render: (ip: string) => <span className="scaf-mono">{ip}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (s: LogRow['status']) => <Tag color={s === '成功' ? 'green' : 'red'}>{s}</Tag>,
    },
  ]

  return (
    <div>
      <Title level={4} className="org-page-title">操作日志</Title>
      <div className="org-search-bar">
        <Form form={filterForm} layout="horizontal" className="org-search-form" labelCol={{ flex: '90px' }} wrapperCol={{ flex: 'auto' }}>
          <Form.Item name="user" label="操作人" className="org-filter-item">
            <Input allowClear placeholder="输入操作人" />
          </Form.Item>
          <Form.Item name="module" label="所属模块" className="org-filter-item">
            <Select
              allowClear
              placeholder="全部"
              options={LOG_MODULES.map((m) => ({ label: m, value: m }))}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" className="org-filter-item">
            <Select
              allowClear
              placeholder="全部"
              options={[
                { label: '成功', value: '成功' },
                { label: '失败', value: '失败' },
              ]}
            />
          </Form.Item>
          <div className="org-search-btns">
            <Button type="primary" onClick={onSearch}>查询</Button>
            <Button onClick={onReset}>重置</Button>
          </div>
        </Form>
      </div>
      <Card className="org-table-card" styles={{ body: { padding: 0 } }}>
        <Table<LogRow>
          columns={columns}
          dataSource={list}
          rowKey="key"
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  )
}

/* ----------------------------- 视图：组织管理（复用人员组织） ----------------------------- */

function OrgView() {
  const [orgTree, setOrgTree] = useState<OrgNode[]>(() => JSON.parse(JSON.stringify(ORG_TREE)) as OrgNode[])
  return <OrgTreeView orgTree={orgTree} setOrgTree={setOrgTree} />
}

/* ----------------------------- 主组件 ----------------------------- */

type MenuKey = 'dashboard' | 'teacher' | 'student' | 'user' | 'config' | 'role' | 'menuMgmt' | 'taskTool' | 'secret' | 'token' | 'apiLog' | 'logs' | 'org'

const MENU_STORAGE_KEY = 'scaffold:menu'

// 菜单项：人员管理 + 系统设置（仅超级管理员可见）
const buildMenuItems = (isSuper: boolean): MenuProps['items'] => [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '控制面板' },
  { key: 'org', icon: <ApartmentOutlined />, label: '组织管理' },
  {
    key: 'personnel',
    icon: <IdcardOutlined />,
    label: '人员管理',
    children: [
      { key: 'teacher', label: '教师管理' },
      { key: 'student', label: '学生管理' },
    ],
  },
  ...(isSuper
    ? [
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: '系统设置',
          children: [
            { key: 'user', label: '用户管理' },
            { key: 'role', label: '角色管理' },
            { key: 'menuMgmt', label: '菜单管理' },
            { key: 'config', label: '系统配置' },
      { key: 'secret', label: '密钥管理' },
      { key: 'token', label: '令牌管理' },
      { key: 'apiLog', label: '对接日志' },
            { key: 'taskTool', label: '任务工具' },
            { key: 'logs', label: '操作日志' },
          ],
        },
      ]
    : []),
]

const menuLabelMap: Record<MenuKey, string[]> = {
  dashboard: ['控制面板'],
  teacher: ['人员管理', '教师管理'],
  student: ['人员管理', '学生管理'],
  user: ['系统设置', '用户管理'],
  config: ['系统设置', '系统配置'],
  secret: ['系统设置', '密钥管理'],
  token: ['系统设置', '令牌管理'],
  apiLog: ['系统设置', '对接日志'],
  role: ['系统设置', '角色管理'],
  menuMgmt: ['系统设置', '菜单管理'],
  taskTool: ['系统设置', '任务工具'],
  logs: ['系统设置', '操作日志'],
  org: ['组织管理'],
}

export default function Scaffold() {
  const [menu, setMenu] = useState<MenuKey>(() => {
    const saved = localStorage.getItem(MENU_STORAGE_KEY)
    return (saved as MenuKey) || 'dashboard'
  })
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(['personnel'])

  // 教师 / 学生 / 用户 全局状态：新增教师或学生时自动同步创建用户
  const { message } = AntdApp.useApp()
  const [userPickerOpen, setUserPickerOpen] = useState(false)
  const [pickSearch, setPickSearch] = useState('')
  // 角色视角固定为超级管理员（如需恢复角色切换，参考 .workbuddy/memory/2026-10-19.md 第十轮）
  const [currentRole] = useState<string>('超级管理员')
  const [impersonated, setImpersonated] = useState<SysUser | null>(null)
  // 代理到某用户后，身份跟随该用户类型；未代理时跟随所选角色
  const isSuper = impersonated ? impersonated.type === '超级管理员' : currentRole === '超级管理员'
  const [teachers, setTeachers] = useState<Teacher[]>(() => seedTeachers.map((t) => ({ ...t })))
  const [students, setStudents] = useState<Student[]>(() => seedStudents.map((s) => ({ ...s })))
  const [users, setUsers] = useState<SysUser[]>(() => buildSeedUsers())
  const [roles, setRoles] = useState<Role[]>(() => seedRoles.map((r) => ({ ...r })))

  // 切换页面时持久化，刷新后停留在原页面
  useEffect(() => {
    localStorage.setItem(MENU_STORAGE_KEY, menu)
  }, [menu])

  // 超级管理员代理到某个用户进行操作（排查问题），身份跟随该用户
  const startImpersonate = (username: string) => {
    const u = users.find((x) => x.username === username)
    if (!u) return
    setImpersonated(u)
    if (u.type !== '超级管理员' && SYSTEM_KEYS.has(menu)) {
      setMenu('dashboard')
    }
  }

  const exitImpersonate = () => {
    setImpersonated(null)
    if (currentRole !== '超级管理员' && SYSTEM_KEYS.has(menu)) {
      setMenu('dashboard')
    }
  }

  const pickList = useMemo(() => {
    const kw = pickSearch.trim().toLowerCase()
    if (!kw) return users
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(kw) ||
        u.name.toLowerCase().includes(kw) ||
        u.roles.some((r) => r.toLowerCase().includes(kw)),
    )
  }, [users, pickSearch])

  const crumbs = menuLabelMap[menu]

  return (
    <Layout className="org-layout">
      <Header className="site-header site-header--solid">
        <div className="header-inner">
          <div className="header-left">
            <Link to="/" className="brand">
              <span className="brand-logo" aria-hidden>
                <svg viewBox="0 0 32 32" width="30" height="30" fill="none">
                  <rect x="2" y="2" width="28" height="28" rx="8" fill="#3b5bff" />
                  <rect x="8" y="8" width="7" height="7" rx="2" fill="#fff" />
                  <rect x="17" y="8" width="7" height="7" rx="2" fill="#fff" opacity="0.7" />
                  <rect x="8" y="17" width="7" height="7" rx="2" fill="#fff" opacity="0.7" />
                  <rect x="17" y="17" width="7" height="7" rx="2" fill="#fff" />
                </svg>
              </span>
              {!collapsed && (
                <Text strong className="brand-name">
                  脚手架
                </Text>
              )}
            </Link>
          </div>

          <div
            className="header-breadcrumb"
            style={{ left: `calc(${collapsed ? 80 : 220}px + var(--content-gap, 16px))` }}
          >
            <Button
              type="text"
              className="sider-collapse-btn"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
              aria-label="收起/展开菜单"
            />
            <Breadcrumb items={[{ title: '脚手架' }, ...crumbs.map((c) => ({ title: c }))]} />
          </div>

          <Space size={14} align="center">
            <button
              type="button"
              className={`scaf-header-btn${impersonated ? ' is-impersonating' : ''}`}
              onClick={() => {
                if (!isSuper) {
                  message.warning('仅超级管理员可切换用户')
                  return
                }
                setUserPickerOpen(true)
              }}
            >
              <UserSwitchOutlined />
              <span>切换用户</span>
              {impersonated && <Tag color="orange" className="scaf-header-imp-tag">代理中 · {impersonated.name}</Tag>}
            </button>
            {impersonated && (
              <Popconfirm
                title="确定退出代理？"
                description={`将结束对「${impersonated.name}」的代理，返回超级管理员视角`}
                okText="退出代理"
                cancelText="取消"
                onConfirm={exitImpersonate}
              >
                <button type="button" className="scaf-header-btn scaf-header-btn-danger">
                  <LogoutOutlined />
                  <span>退出代理</span>
                </button>
              </Popconfirm>
            )}
            <Badge count={3} size="small" offset={[-2, 2]}>
              <BellOutlined className="scaf-header-bell" />
            </Badge>
            <div className="scaf-user-entry">
              <div className="scaf-user-trigger">
                <Avatar size={30} src="/avatar.webp" />
                <span className="scaf-user-name">张明</span>
              </div>
              <div className="scaf-user-menu">
                <div className="scaf-user-menu-item">
                  <SettingOutlined />
                  <span>账号设置</span>
                </div>
                <div className="scaf-user-menu-item scaf-user-menu-logout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </div>
              </div>
            </div>
          </Space>
        </div>
      </Header>
      <div className="org-body">
        <aside className={`org-sider${collapsed ? ' collapsed' : ''}`}>
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={[menu]}
            openKeys={openKeys}
            onOpenChange={(keys) => {
              // 手风琴模式：同时只展开一个一级菜单
              const latest = (keys as string[]).find((k) => !openKeys.includes(k))
              setOpenKeys(latest ? [latest] : [])
            }}
            items={buildMenuItems(isSuper)}
            onClick={({ key }) => {
              if (key !== 'personnel' && key !== 'settings') setMenu(key as MenuKey)
            }}
          />
        </aside>
        <Content className="org-content">
          <div className="org-container">
            {menu === 'dashboard' && <DashboardView onNavigate={setMenu} isSuper={isSuper} />}
            {menu === 'teacher' && (
              <TeacherView teachers={teachers} setTeachers={setTeachers} users={users} setUsers={setUsers} />
            )}
            {menu === 'student' && (
              <StudentView students={students} setStudents={setStudents} users={users} setUsers={setUsers} />
            )}
            {menu === 'user' && <UserView users={users} setUsers={setUsers} />}
            {menu === 'config' && <ConfigView />}
            {menu === 'secret' && <SecretView />}
            {menu === 'token' && <TokenView />}
            {menu === 'apiLog' && <ApiLogView />}
            {menu === 'role' && <RoleView roles={roles} setRoles={setRoles} users={users} />}
            {menu === 'menuMgmt' && <MenuView />}
            {menu === 'taskTool' && <TaskToolView />}
            {menu === 'logs' && <LogsView />}
            {menu === 'org' && <OrgView />}
          </div>
        </Content>
      </div>

      {/* 切换用户（代理登录）弹窗 */}
      <Modal
        title="切换用户（代理登录）"
        open={userPickerOpen}
        onCancel={() => setUserPickerOpen(false)}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <Input
          className="scaf-picker-search"
          allowClear
          prefix={<SearchOutlined style={{ color: '#b8c0d0' }} />}
          placeholder="搜索账号 / 姓名 / 角色"
          value={pickSearch}
          onChange={(e) => setPickSearch(e.target.value)}
        />
        <Table<SysUser>
          columns={[
            { title: '登录账号', dataIndex: 'username', key: 'username', width: 140, render: (n: string) => <span className="scaf-mono">{n}</span> },
            { title: '姓名', dataIndex: 'name', key: 'name' },
            { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t: string) => <Tag color={t === '超级管理员' ? 'purple' : t === '教师' ? 'blue' : 'cyan'}>{t}</Tag> },
            { title: '角色', dataIndex: 'roles', key: 'roles', width: 150, render: (roles: string[]) => roles.map((r) => <Tag key={r} color="gold">{r}</Tag>) },
            {
              title: '操作',
              key: 'action',
              width: 90,
              align: 'center',
              render: (_: unknown, u: SysUser) =>
                impersonated?.id === u.id ? (
                  <Tag color="orange">当前</Tag>
                ) : (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      startImpersonate(u.username)
                      setUserPickerOpen(false)
                    }}
                  >
                    代理
                  </Button>
                ),
            },
          ]}
          dataSource={pickList}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 个用户` }}
        />
      </Modal>
    </Layout>
  )
}
