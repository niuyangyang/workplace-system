import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, Badge, Avatar, Space, Typography } from 'antd'
import { BellOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons'
import './navbar.css'

const { Header } = Layout
const { Text } = Typography

export default function Navbar({ solid = false, breadcrumb, title = '职场综合应用系统', siderRight = 220, collapsed = false, nav, sticky = false }: { solid?: boolean; breadcrumb?: React.ReactNode; title?: string; siderRight?: number; collapsed?: boolean; nav?: React.ReactNode; sticky?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <Header className={`site-header${solid ? ' site-header--solid' : ''}${sticky ? ' site-header--sticky' : ''}`}>
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
              {title}
            </Text>
          )}
        </Link>
          {nav}
        </div>

        {breadcrumb && (
          <div
            className="header-breadcrumb"
            style={{ left: `calc(${siderRight}px + var(--content-gap, 16px))` }}
          >
            {breadcrumb}
          </div>
        )}

        <Space size={18} align="center">
          <Badge count={3} size="small" offset={[-2, 2]}>
            <BellOutlined className="notif-icon" />
          </Badge>
          <span
            className={`user-wrap${open ? ' is-open' : ''}`}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <Space size={10} align="center" className="user-trigger">
              <Avatar size={36} src="/avatar.webp" className="user-avatar" />
              <Text strong className="user-name">
                张明
              </Text>
            </Space>
            <div className="user-drawer" onClick={() => setOpen(false)}>
              <button className="drawer-item" type="button">
                <SettingOutlined />
                <span>账号设置</span>
              </button>
              <button className="drawer-item logout" type="button">
                <LogoutOutlined />
                <span>退出登录</span>
              </button>
            </div>
          </span>
        </Space>
      </div>
    </Header>
  )
}
