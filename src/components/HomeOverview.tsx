import { Card, Col, List, Row, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import { announcements, todos } from '../data/portal'
import './homeOverview.css'

/* 待办事项 / 通知公告两张卡片
   结构与样式与 sjtu-admin 门户一致（antd Row/Col + Card title/extra + List.Item.Meta + actions 标签）；
   数据与两个列表页同源（src/data/portal.tsx），此处各取前 5 条。 */

export default function HomeOverview() {
  const navigate = useNavigate()

  return (
    <div className="home-overview">
      <Row gutter={[16, 16]} className="portal-cols">
        {/* 待办事项 */}
        <Col xs={24} lg={12}>
          <Card
            title="待办事项"
            variant="borderless"
            extra={
              <a onClick={() => navigate('/todos')} style={{ color: '#C8161E' }}>
                更多
              </a>
            }
          >
            <List
              dataSource={todos.slice(0, 5)}
              renderItem={(item) => (
                <List.Item actions={[<Tag color="red">{item.type}</Tag>]}>
                  <List.Item.Meta
                    title={item.title}
                    description={`${item.system} · ${item.time}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 通知公告 */}
        <Col xs={24} lg={12}>
          <Card
            title="通知公告"
            variant="borderless"
            extra={
              <a onClick={() => navigate('/notices')} style={{ color: '#C8161E' }}>
                更多
              </a>
            }
          >
            <List
              dataSource={announcements.slice(0, 5)}
              renderItem={(item) => (
                <List.Item actions={[<Tag color="blue">{item.source}</Tag>]}>
                  <List.Item.Meta
                    title={<a style={{ color: '#1f2430' }}>{item.title}</a>}
                    description={`${item.unit} · ${item.date}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
