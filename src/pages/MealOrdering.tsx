import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import {
  ClockCircleOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { DISHES, MEAL_CATEGORIES, MEAL_NOTICE, type Dish } from '../data/meal'
import './mealOrdering.css'

/* 员工订餐：H5 单形态 —— 无门户框架，页面本身就是移动端页面；
   桌面浏览器打开直接以手机宽度居中呈现，真机宽度自动铺满 */
export default function MealOrdering() {
  const navigate = useNavigate()
  const [cat, setCat] = useState(MEAL_CATEGORIES[0].id)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const [note, setNote] = useState('')
  const [flash, setFlash] = useState('')
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

            {/* 左侧分类栏 + 右侧菜品列表 */}
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

            {/* 机内底部购物车条 */}
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

            {/* 机内底部弹层：购物车 */}
            {sheetOpen && (
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
      </div>
    </div>
  )
}
