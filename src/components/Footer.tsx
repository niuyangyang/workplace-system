import { Layout, Row, Col, Typography, Space, Divider } from 'antd'
import './footer.css'

const { Footer } = Layout
const { Title, Text, Link } = Typography

export default function AppFooter() {
  return (
    <Footer className="site-footer">
      <div className="footer-inner">
        <Row gutter={[40, 24]}>
          <Col xs={24} md={10}>
            <Title level={5} className="footer-brand">星辉科技集团</Title>
            <Space orientation="vertical" size={6} className="footer-contact">
              <Text>地址：上海市浦东新区张江高科技园区海科路 666 号</Text>
              <Text>邮编：201203</Text>
              <Text>电话：021-8888-6666</Text>
              <Text>邮箱：support@xinghui-tech.com</Text>
              <Text>工作时间：周一至周五 9:00 - 18:00</Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Title level={5} className="footer-title">快速链接</Title>
            <Space orientation="vertical" size={8}>
              <Link href="#" onClick={(e) => e.preventDefault()}>帮助中心</Link>
              <Link href="#" onClick={(e) => e.preventDefault()}>隐私政策</Link>
              <Link href="#" onClick={(e) => e.preventDefault()}>服务条款</Link>
              <Link href="#" onClick={(e) => e.preventDefault()}>联系我们</Link>
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Title level={5} className="footer-title">关注我们</Title>
            <Space orientation="vertical" size={8} className="footer-follow">
              <Text>微信公众号：星辉职场</Text>
              <Text>企业微信：星辉科技 HR</Text>
              <Text>客服热线：400-123-4567</Text>
            </Space>
          </Col>
        </Row>
        <Divider className="footer-divider" />
        <div className="footer-bottom">
          <Text type="secondary" className="footer-record">
            沪 ICP 备 2026000000 号 - 1　|　沪公网安备 31011502000000 号
          </Text>
          <Text type="secondary" className="footer-copyright">
            © 2026 星辉科技集团　版权所有　职场综合应用系统　技术支持：信息管理中心
          </Text>
        </div>
      </div>
    </Footer>
  )
}
