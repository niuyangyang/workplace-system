import type { ReactNode } from 'react'
import {
  ClockCircleOutlined,
  FileProtectOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  NotificationOutlined,
  ProjectOutlined,
  FolderOpenOutlined,
  LineChartOutlined,
  CoffeeOutlined,
  ApartmentOutlined,
  FileDoneOutlined,
  BookOutlined,
  FundViewOutlined,
  UserOutlined,
  RestOutlined,
} from '@ant-design/icons'

export interface AppEntry {
  id: string
  name: string
  desc: string
  color: string
  icon: ReactNode
}

export const apps: AppEntry[] = [
  { id: 'attendance', name: '考勤打卡', desc: '每日签到、请假与加班记录', color: '#3b5bff', icon: <ClockCircleOutlined /> },
  { id: 'approval', name: '审批中心', desc: '待办审批与流程跟踪', color: '#0ea5e9', icon: <FileProtectOutlined /> },
  { id: 'contacts', name: '通讯录', desc: '同事信息与组织架构', color: '#10b981', icon: <TeamOutlined /> },
  { id: 'report', name: '工作日报', desc: '提交与查看每日工作', color: '#f59e0b', icon: <FileTextOutlined /> },
  { id: 'meeting', name: '会议室预订', desc: '查询并预订空闲会议室', color: '#8b5cf6', icon: <CalendarOutlined /> },
  { id: 'notice', name: '公告通知', desc: '公司公告与系统消息', color: '#ef4444', icon: <NotificationOutlined /> },
  { id: 'task', name: '任务看板', desc: '团队任务分配与进度', color: '#ec4899', icon: <ProjectOutlined /> },
  { id: 'docs', name: '企业文档中心', desc: '共享文档与知识库', color: '#14b8a6', icon: <FolderOpenOutlined /> },
  { id: 'salary', name: '薪资绩效', desc: '工资条与考核结果', color: '#6366f1', icon: <LineChartOutlined /> },
  { id: 'leave', name: '假期管理', desc: '年假余额与调休申请', color: '#f97316', icon: <CoffeeOutlined /> },
  { id: 'org', name: '人员组织', desc: '组织架构与人员管理', color: '#f43f5e', icon: <ApartmentOutlined /> },
  { id: 'system', name: '制度管理', desc: '制度起草、评审与统一管理', color: '#0d9488', icon: <FileDoneOutlined /> },
  { id: 'policy', name: '制度前台', desc: '面向全员的企业制度查询与公开门户', color: '#2563eb', icon: <BookOutlined /> },
  { id: 'bigscreen', name: '数据大屏', desc: '员工籍贯分布可视化大屏（中国地图）', color: '#0891b2', icon: <FundViewOutlined /> },
  { id: 'persona', name: '人物画像', desc: '员工全息人物建模与多维画像分析', color: '#7c5cff', icon: <UserOutlined /> },
  { id: 'meal', name: '员工订餐', desc: '每日菜品、加班夜宵与行政统一采购（H5）', color: '#ff6b2c', icon: <RestOutlined /> },
]
