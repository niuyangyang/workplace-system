import type { ReactNode } from 'react'
import { Typography } from 'antd'
import './banner.css'

const { Title, Text } = Typography

/* 首页 banner（欢迎语）。
   其余页面可传入 tag / title / sub 覆盖为与本页相关的提示内容，
   背景图与整体版式保持不变 —— 这样切换导航时 banner 区块视觉上不跳。 */
export default function Banner({
  tag,
  title,
  sub,
}: {
  tag?: string
  title?: ReactNode
  sub?: ReactNode
}) {
  const now = new Date()
  const hour = now.getHours()
  const greet =
    hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="banner-content">
      <Text className="banner-tag">{tag ?? 'WORKPLACE HUB'}</Text>
      <Title level={2} className="banner-title">
        {title ?? `${greet}，张明 👋`}
      </Title>
      <Text className="banner-sub">
        {sub ?? `今天是 ${dateStr}。一站式职场服务，从这里开启高效的一天。`}
      </Text>
    </div>
  )
}
