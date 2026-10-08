import { useLocation, useNavigate } from 'react-router-dom'
import './homeNav.css'

/* 门户顶部导航：首页 / 待办事项 / 通知公告 / 使用手册
   结构与交互与 sjtu-admin 门户一致 —— <a onClick={() => navigate(to)}>、
   激活项按 label 命中判断、hover 为半透明白底圆角、active 为白色加粗（无下划线）。 */
const ITEMS: { label: string; to: string }[] = [
  { label: '首页', to: '/' },
  { label: '待办事项', to: '/todos' },
  { label: '通知公告', to: '/notices' },
  { label: '使用手册', to: '/manual' },
]

export default function HomeNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeLabel =
    pathname === '/'
      ? '首页'
      : pathname.startsWith('/todos')
        ? '待办事项'
        : pathname.startsWith('/notices')
          ? '通知公告'
          : pathname.startsWith('/manual')
            ? '使用手册'
            : ''

  return (
    <nav className="topnav-menu">
      {ITEMS.map((item) => (
        <a
          key={item.label}
          className={`topnav-link${activeLabel === item.label ? ' active' : ''}`}
          onClick={() => navigate(item.to)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}
