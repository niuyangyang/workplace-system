import { Layout } from 'antd'
import Navbar from '../components/Navbar'
import HomeNav from '../components/HomeNav'
import Banner from '../components/Banner'
import HomeOverview from '../components/HomeOverview'
import AppGrid from '../components/AppGrid'
import AppFooter from '../components/Footer'
import './home.css'

const { Content } = Layout

export default function Home() {
  return (
    <Layout className="site-layout">
      <section className="hero" style={{ backgroundImage: 'url(/banner.webp)' }}>
        {/* 顶部导航：logo + 标题之后接 首页 / 待办事项 / 通知公告 */}
        <Navbar nav={<HomeNav />} />
        <Banner />
      </section>
      {/* banner 与「应用中心」之间：待办事项 + 通知公告 两张卡片 */}
      <HomeOverview />
      <Content className="site-content">
        <AppGrid />
      </Content>
      <AppFooter />
    </Layout>
  )
}
