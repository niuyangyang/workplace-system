import { Link, useLocation } from 'react-router-dom'
import './portalNav.css'

// 制度前台顶部导航：首页（制度列表/详情/版本比对）/ 意见收集
export default function PortalNav() {
  const { pathname } = useLocation()

  const items = [
    {
      to: '/app/policy',
      label: '首页',
      active:
        pathname === '/app/policy' ||
        pathname.startsWith('/app/policy/detail') ||
        pathname.startsWith('/app/policy/diff'),
    },
    {
      to: '/app/policy/opinions',
      label: '意见收集',
      active: pathname.startsWith('/app/policy/opinions'),
    },
  ]

  return (
    <nav className="portal-nav">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className={`portal-nav-item${it.active ? ' active' : ''}`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  )
}
