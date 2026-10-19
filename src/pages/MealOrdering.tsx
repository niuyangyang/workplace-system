import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import {
  ClockCircleOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  LeftOutlined,
  MinusOutlined,
  PhoneOutlined,
  PlusOutlined,
  ProfileOutlined,
  RightOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  UpOutlined,
  DownOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  DISHES,
  MEAL_CATEGORIES,
  MEAL_NOTICE,
  MEAL_ORDERS,
  type Dish,
} from '../data/meal'
import './mealOrdering.css'

/* 员工订餐：H5 单形态 —— 无门户框架，页面本身就是移动端页面；
   桌面浏览器打开直接以手机宽度居中呈现，真机宽度自动铺满。
   底部三段式 Tab：点餐 / 订单 / 我的 */
type TabId = 'order' | 'orders' | 'mine'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'order', label: '点餐', icon: <ShopOutlined /> },
  { id: 'orders', label: '订单', icon: <UnorderedListOutlined /> },
  { id: 'mine', label: '我的', icon: <UserOutlined /> },
]

export default function MealOrdering() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('order')
  const [cat, setCat] = useState(MEAL_CATEGORIES[0].id)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const [note, setNote] = useState('')
  const [flash, setFlash] = useState('')
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'done'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const flashTimer = useRef<number | undefined>(undefined)

  const list = useMemo(() => DISHES.filter((d) => d.category === cat), [cat])
  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ dish: DISHES.find((d) => d.id === id)!, qty }))
        .filter((it) => it.dish && it.qty > 0),
    [cart],
  )
  const totalQty = cartItems.reduce((s, it) => s + it.qty, 0)
  const totalPrice = cartItems.reduce((s, it) => s + it.qty * it.dish.price, 0)

  const ordersView = useMemo(() => {
    if (orderFilter === 'all') return MEAL_ORDERS
    if (orderFilter === 'active')
      return MEAL_ORDERS.filter((o) => o.statusType === 'wait' || o.statusType === 'transit')
    return MEAL_ORDERS.filter((o) => o.statusType === 'done' || o.statusType === 'cancel')
  }, [orderFilter])

  function toast(text: string) {
    setFlash(text)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(''), 2400)
  }

  function add(dish: Dish, delta: number) {
    if (dish.soldOut) return
    setCart((prev) => {
      const next = { ...prev }
      const q = (next[dish.id] || 0) + delta
      if (q <= 0) delete next[dish.id]
      else next[dish.id] = Math.min(q, dish.left)
      return next
    })
  }

  function submit() {
    if (totalQty === 0) return
    toast(`已提交 ${totalQty} 份，合计 ¥${totalPrice}`)
    setCart({})
    setNote('')
    setSheetOpen(false)
  }

  function switchTab(t: TabId) {
    setTab(t)
    setSheetOpen(false)
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const current = MEAL_CATEGORIES.find((c) => c.id === cat)

  return (
    <div className="meal-stage">
      {/* 手机形态容器（桌面居中展示；真机宽度自动铺满） */}
      <div className="meal-device">
        <div className="meal-statusbar" aria-hidden="true">
          <span className="msb-time">9:41</span>
          <span className="msb-notch" />
          <span className="msb-right">
            <i className="msb-sig" />
            <i className="msb-wifi" />
            <i className="msb-bat" />
          </span>
        </div>

        {/* 点餐页头 */}
        {tab === 'order' && (
          <header className="meal-apphead">
            <button type="button" className="meal-back" onClick={() => navigate('/')}>
              <LeftOutlined /> 应用中心
            </button>
            <h1 className="meal-apphead-title">今天吃什么</h1>
            <p className="meal-apphead-sub">行政部统一采购 · {MEAL_NOTICE.settle}</p>
            <div className="meal-apphead-meta">
              <span className="meal-chip">
                <ClockCircleOutlined /> {MEAL_NOTICE.cutOff} 前下单
              </span>
              <span className="meal-chip">
                <EnvironmentOutlined /> {MEAL_NOTICE.delivery} 送达{MEAL_NOTICE.place}
              </span>
            </div>
          </header>
        )}

        {/* 订单页头 */}
        {tab === 'orders' && (
          <header className="meal-subhead">
            <h2 className="meal-subhead-title">我的订单</h2>
            <p className="meal-subhead-sub">近 30 天的订餐记录与配送状态</p>
          </header>
        )}

        {/* 我的页头 */}
        {tab === 'mine' && (
          <header className="meal-subhead">
            <h2 className="meal-subhead-title">个人中心</h2>
            <p className="meal-subhead-sub">材料学院 · 工号 05000-1234</p>
          </header>
        )}

        {/* ============ 点餐 ============ */}
        {tab === 'order' && (
          <div className="meal-body">
            <nav className="meal-cats" aria-label="菜品分类">
              {MEAL_CATEGORIES.map((c) => {
                const on = c.id === cat
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`meal-cat${on ? ' is-on' : ''}`}
                    aria-current={on ? 'true' : undefined}
                    onClick={() => setCat(c.id)}
                  >
                    <i className="meal-cat-dot" style={on ? undefined : { background: c.dot }} />
                    {c.name}
                  </button>
                )
              })}
            </nav>

            <div className="meal-list" ref={listRef}>
              <div className="meal-list-head">
                {current?.name} · 共 {list.length} 道
              </div>
              {list.map((d) => {
                const qty = cart[d.id] || 0
                const scarce = !d.soldOut && d.left <= 8
                return (
                  <article className={`dish-card${d.soldOut ? ' is-out' : ''}`} key={d.id}>
                    <div className="dish-thumb" style={{ background: d.tint }} aria-hidden="true">
                      <img src={d.img} alt="" />
                      {d.soldOut && <span className="dish-out">售罄</span>}
                      {scarce && <span className="dish-scarce">仅剩 {d.left} 份</span>}
                    </div>
                    <div className="dish-info">
                      <div className="dish-name-row">
                        <span className="dish-name">{d.name}</span>
                        {d.tags?.map((t) => (
                          <span className="dish-tag" key={t}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="dish-spec">{d.spec}</div>
                      <div className="dish-meta">
                        月销 {d.sales} ·{' '}
                        {d.soldOut ? (
                          <span>今日售罄</span>
                        ) : (
                          <span className={scarce ? 'is-low' : ''}>剩 {d.left} 份</span>
                        )}
                      </div>
                      <div className="dish-foot">
                        <span className="dish-price">
                          <i>¥</i>
                          {d.price}
                        </span>
                        {d.soldOut ? (
                          <span className="dish-out-btn">已售罄</span>
                        ) : qty === 0 ? (
                          <button
                            type="button"
                            className="dish-add"
                            aria-label={`添加 ${d.name}`}
                            onClick={() => add(d, 1)}
                          >
                            <PlusOutlined />
                          </button>
                        ) : (
                          <span className="dish-stepper">
                            <button type="button" aria-label={`减少 ${d.name}`} onClick={() => add(d, -1)}>
                              <MinusOutlined />
                            </button>
                            <b>{qty}</b>
                            <button
                              type="button"
                              aria-label={`增加 ${d.name}`}
                              onClick={() => add(d, 1)}
                              disabled={qty >= d.left}
                            >
                              <PlusOutlined />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
              <p className="meal-list-end">{MEAL_NOTICE.rule}</p>
            </div>
          </div>
        )}

        {/* ============ 订单 ============ */}
        {tab === 'orders' && (
          <div className="meal-tabpanel">
            <div className="mo-filter">
              {(
                [
                  ['all', '全部'],
                  ['active', '进行中'],
                  ['done', '已完成'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={`${orderFilter === k ? 'is-on' : ''}`}
                  onClick={() => setOrderFilter(k)}
                >
                  {label}
                </button>
              ))}
            </div>

            {ordersView.map((o) => {
              const isOpen = expanded.has(o.id)
              const shown = isOpen ? o.items : o.items.slice(0, 1)
              const more = o.items.length - 1
              return (
                <div className="mo-card" key={o.id}>
                  <div className="mo-card-head">
                    <span className="mo-card-id">{o.id}</span>
                    <span className={`mo-status mo-status-${o.statusType}`}>{o.status}</span>
                  </div>
                  <div className={`mo-card-items${!isOpen && more > 0 ? ' is-collapsed' : ''}`}>
                    {shown.map((it, i) => (
                      <div className="mo-item" key={i}>
                        <span className="mo-thumb">
                          <img src={it.img} alt="" />
                        </span>
                        <span className="mo-item-name">{it.name}</span>
                        <span className="mo-item-qty">x{it.qty}</span>
                        <span className="mo-item-price">¥{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                  {more > 0 && (
                    <button type="button" className="mo-item-toggle" onClick={() => toggleExpand(o.id)}>
                      {isOpen ? (
                        <>
                          收起 <UpOutlined />
                        </>
                      ) : (
                        <>
                          查看全部 {o.items.length} 件商品 <DownOutlined />
                        </>
                      )}
                    </button>
                  )}
                  <div className="mo-card-foot">
                    <span className="mo-card-date">{o.date}</span>
                    <span className="mo-card-total">
                      合计 <b>¥{o.total}</b>
                    </span>
                  </div>
                  <button type="button" className="mo-detail-btn" onClick={() => setDetailId(o.id)}>
                    查看详情
                  </button>
                </div>
              )
            })}
            {ordersView.length === 0 && <div className="mo-empty">暂无相关订单</div>}
          </div>
        )}

        {/* ============ 我的 ============ */}
        {tab === 'mine' && (
          <div className="meal-tabpanel">
            <div className="mm-card">
              <div className="mm-profile">
                <span className="mm-avatar">张</span>
                <div className="mm-profile-main">
                  <div className="mm-name">张明</div>
                  <div className="mm-sub">材料学院 · 行政部对接人</div>
                </div>
                <span className="mm-badge">本月餐补 ¥114</span>
              </div>
              <div className="mm-stats">
                <div className="mm-stat">
                  <b>12</b>
                  <span>累计订单</span>
                </div>
                <div className="mm-stat">
                  <b>3</b>
                  <span>收藏菜品</span>
                </div>
                <div className="mm-stat">
                  <b>1</b>
                  <span>待评价</span>
                </div>
              </div>
            </div>

            <nav className="mm-menu">
              <div className="mm-menu-item">
                <span className="mm-menu-ico">
                  <EnvironmentOutlined />
                </span>
                <span className="mm-menu-label">我的地址</span>
                <span className="mm-menu-sub">3 号科研楼 502 工位</span>
              </div>
              <div className="mm-menu-item">
                <span className="mm-menu-ico">
                  <HeartOutlined />
                </span>
                <span className="mm-menu-label">口味偏好</span>
                <span className="mm-menu-sub">微辣 · 不要香菜</span>
              </div>
              <div className="mm-menu-item">
                <span className="mm-menu-ico">
                  <WalletOutlined />
                </span>
                <span className="mm-menu-label">餐补余额</span>
                <span className="mm-menu-sub">¥114</span>
                <RightOutlined className="mm-menu-arrow" />
              </div>
              <button type="button" className="mm-menu-item" onClick={() => switchTab('orders')}>
                <span className="mm-menu-ico">
                  <ProfileOutlined />
                </span>
                <span className="mm-menu-label">订餐记录</span>
                <span className="mm-menu-sub">4 笔</span>
                <RightOutlined className="mm-menu-arrow" />
              </button>
              <div className="mm-menu-item">
                <span className="mm-menu-ico">
                  <CustomerServiceOutlined />
                </span>
                <span className="mm-menu-label">帮助与反馈</span>
                <RightOutlined className="mm-menu-arrow" />
              </div>
              <div className="mm-menu-item">
                <span className="mm-menu-ico">
                  <SettingOutlined />
                </span>
                <span className="mm-menu-label">设置</span>
                <RightOutlined className="mm-menu-arrow" />
              </div>
            </nav>

            <button type="button" className="mm-logout">
              退出登录
            </button>
          </div>
        )}

        {/* 机内底部购物车条（仅点餐页） */}
        {tab === 'order' && (
          <div className="meal-cartbar">
            <button
              type="button"
              className="meal-cartbar-inner"
              onClick={() => {
                if (totalQty > 0) setSheetOpen(true)
                else listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <span className="meal-cartbar-icon">
                <ShoppingCartOutlined />
                {totalQty > 0 && <b className="meal-cartbar-badge">{totalQty}</b>}
              </span>
              <span className="meal-cartbar-text">
                {totalQty > 0 ? `已选 ${totalQty} 件 · ¥${totalPrice}` : '还没有选择菜品'}
              </span>
              <span className="meal-cartbar-btn">{totalQty > 0 ? '提交订餐' : '去选菜'}</span>
            </button>
          </div>
        )}

        {/* 底部主 Tab 栏 */}
        <nav className="meal-tabbar" aria-label="底部导航">
          {TABS.map((t) => {
            const on = t.id === tab
            return (
              <button
                key={t.id}
                type="button"
                className={`meal-tab${on ? ' is-on' : ''}`}
                aria-current={on ? 'true' : undefined}
                onClick={() => switchTab(t.id)}
              >
                <span className="meal-tab-ico">{t.icon}</span>
                <span className="meal-tab-label">{t.label}</span>
              </button>
            )
          })}
        </nav>

        {/* 机内底部弹层：购物车（仅点餐页） */}
        {tab === 'order' && sheetOpen && (
          <div className="meal-sheet-mask" onClick={() => setSheetOpen(false)}>
            <div className="meal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="meal-sheet-head">
                <span>我的订餐（{totalQty} 份）</span>
                <button type="button" aria-label="关闭" onClick={() => setSheetOpen(false)}>
                  <CloseOutlined />
                </button>
              </div>
              <div className="meal-sheet-list">
                {cartItems.map((it) => (
                  <div className="cart-item" key={it.dish.id}>
                    <span className="cart-thumb" style={{ background: it.dish.tint }}>
                      <img src={it.dish.img} alt="" />
                    </span>
                    <div className="cart-item-main">
                      <div className="cart-item-name">{it.dish.name}</div>
                      <div className="cart-item-spec">{it.dish.spec}</div>
                    </div>
                    <span className="cart-stepper">
                      <button
                        type="button"
                        aria-label={`减少 ${it.dish.name}`}
                        onClick={() => add(it.dish, -1)}
                      >
                        <MinusOutlined />
                      </button>
                      <b>{it.qty}</b>
                      <button
                        type="button"
                        aria-label={`增加 ${it.dish.name}`}
                        onClick={() => add(it.dish, 1)}
                        disabled={it.qty >= it.dish.left}
                      >
                        <PlusOutlined />
                      </button>
                    </span>
                    <span className="cart-item-price">¥{it.qty * it.dish.price}</span>
                  </div>
                ))}
                {cartItems.length === 0 && <div className="cart-empty">购物车是空的</div>}
              </div>
              <div className="meal-sheet-foot">
                <div className="cart-summary">
                  <span>合计</span>
                  <b>¥{totalPrice}</b>
                </div>
                <textarea
                  className="cart-note"
                  rows={2}
                  placeholder="备注：口味偏好、送达位置（选填）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button type="primary" block className="cart-submit" disabled={totalQty === 0} onClick={submit}>
                  提交订餐（行政部统一采购）
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 机内轻提示 */}
        {flash && <div className="meal-flash">{flash}</div>}

        {/* 机内底部抽屉：订单详情 */}
        {detailId &&
          (() => {
            const o = MEAL_ORDERS.find((x) => x.id === detailId)
            if (!o) return null
            return (
              <div className="mo-detail-mask" onClick={() => setDetailId(null)}>
                <div className="mo-detail" onClick={(e) => e.stopPropagation()}>
                  <div className="mo-detail-head">
                    <span>订单详情</span>
                    <button type="button" aria-label="关闭" onClick={() => setDetailId(null)}>
                      <CloseOutlined />
                    </button>
                  </div>
                  <div className="mo-detail-body">
                    <div className="mo-d-row">
                      <span>订单编号</span>
                      <b>{o.id}</b>
                    </div>
                    <div className="mo-d-row">
                      <span>下单时间</span>
                      <b>{o.date}</b>
                    </div>
                    <div className="mo-d-row">
                      <span>订单状态</span>
                      <b className={`mo-d-status mo-d-status-${o.statusType}`}>{o.status}</b>
                    </div>

                    {o.delivery ? (
                      <div className="mo-d-courier">
                        <span className="mo-courier-avatar">{o.delivery.name.slice(0, 1)}</span>
                        <div className="mo-courier-main">
                          <div className="mo-courier-name">
                            {o.delivery.name}
                            <span className="mo-courier-tag">
                              {o.statusType === 'transit' ? '配送中' : '配送员'}
                            </span>
                          </div>
                          <div className="mo-courier-eta">
                            {o.statusType === 'transit'
                              ? `预计 ${o.delivery.eta} 送达`
                              : `已于 ${o.delivery.eta} 送达`}
                          </div>
                        </div>
                        <a className="mo-courier-call" href={`tel:${o.delivery.phone}`} aria-label="联系配送员">
                          <PhoneOutlined />
                        </a>
                      </div>
                    ) : (
                      <div className="mo-d-cancel">该订单已取消，无配送信息</div>
                    )}

                    <div className="mo-d-addr">
                      <EnvironmentOutlined /> {o.address}
                    </div>

                    <div className="mo-d-section-title">菜品明细</div>
                    {o.items.map((it, i) => (
                      <div className="mo-item" key={i}>
                        <span className="mo-thumb">
                          <img src={it.img} alt="" />
                        </span>
                        <span className="mo-item-name">{it.name}</span>
                        <span className="mo-item-qty">x{it.qty}</span>
                        <span className="mo-item-price">¥{it.price * it.qty}</span>
                      </div>
                    ))}

                    {o.note && <div className="mo-d-note">备注：{o.note}</div>}

                    <div className="mo-d-total">
                      商品合计 <b>¥{o.total}</b>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
      </div>
    </div>
  )
}
