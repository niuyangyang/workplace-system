import { Link, useParams } from 'react-router-dom'
import { Layout, Button, Result } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import Navbar from '../components/Navbar'
import { apps } from '../apps'
import './placeholder.css'

const { Content } = Layout

export default function AppPlaceholder() {
  const { id } = useParams<{ id: string }>()
  const app = apps.find((a) => a.id === id)

  if (!app) {
    return (
      <Layout className="site-layout">
        <Navbar />
        <Content className="site-content ph-content">
          <Result
            status="404"
            title="未找到该应用"
            subTitle="抱歉，访问的应用入口不存在或已被移除。"
            extra={
              <Button type="primary" size="large">
                <Link to="/">
                  <HomeOutlined /> 返回首页
                </Link>
              </Button>
            }
          />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout className="site-layout">
      <Navbar />
      <Content className="site-content ph-content">
        <Result
          icon={
            <span
              className="ph-icon"
              style={{ color: app.color, backgroundColor: `${app.color}1a` }}
            >
              {app.icon}
            </span>
          }
          title={app.name}
          subTitle={app.desc}
          extra={
            <>
              <div className="ph-tip">该模块正在建设中，这里是占位页面。</div>
              <Button type="primary" size="large">
                <Link to="/">
                  <HomeOutlined /> 返回首页
                </Link>
              </Button>
            </>
          }
        />
      </Content>
    </Layout>
  )
}
