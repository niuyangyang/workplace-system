import { Card, Col, Row } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { apps } from '../apps'
import './appGrid.css'

/* 应用中心：结构、样式与交互移植自 sjtu-admin 门户的「应用中心」
   （antd Row/Col + Card hoverable + .subsystem-* 一套类名），
   仅把子系统数据换成本项目的应用清单。
   交互与源项目一致：点击卡片 = 新标签页打开对应系统。 */

// 首页应用中心只展示以下应用（其余入口在使用手册 / 路由中仍可用）
const HOME_APP_IDS = [
  'meeting', // 会议室预订
  'meal', // 员工订餐
  'docs', // 企业文档中心
  'org', // 人员组织
  'system', // 制度管理
  'policy', // 制度前台
  'bigscreen', // 数据大屏
  'persona', // 人物画像
]

export default function AppGrid() {
  const homeApps = apps.filter((a) => HOME_APP_IDS.includes(a.id))
  return (
    <section className="app-grid">
      <div className="portal-section-head">
        <h2>应用中心</h2>
        <span>集中办理制度、人员、文档、评审等各类事务</span>
      </div>
      <Row gutter={[16, 16]}>
        {homeApps.map((app) => (
          <Col xs={24} sm={12} md={8} lg={6} key={app.id}>
            <Card
              hoverable
              variant="borderless"
              className="subsystem-card"
              onClick={() =>
                window.open(`/app/${app.id}${app.id === 'org' ? '?entry=center' : ''}`, '_blank')
              }
            >
              <div className="subsystem-card-inner">
                <div className="subsystem-icon">{app.icon}</div>
                <div className="subsystem-meta">
                  <div className="subsystem-name">{app.name}</div>
                  <div className="subsystem-desc">{app.desc}</div>
                </div>
                <ArrowRightOutlined className="subsystem-arrow" />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  )
}
