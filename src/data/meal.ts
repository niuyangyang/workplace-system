/* 员工订餐数据（原型用确定性静态数据，展示用） */

export interface MealCategory {
  id: string
  name: string
  /** 分类圆点色（低饱和，仅做分类标识） */
  dot: string
}

export interface Dish {
  id: string
  name: string
  spec: string
  category: string
  price: number
  /** 月销 */
  sales: number
  /** 今日剩余份数 */
  left: number
  soldOut?: boolean
  /** 菜品示意图（CSS 渐变色块，避免外链图片） */
  tint: string
  tags?: string[]
}

export const MEAL_CATEGORIES: MealCategory[] = [
  { id: 'lunch', name: '午餐套餐', dot: '#e8543f' },
  { id: 'dinner', name: '晚餐套餐', dot: '#1f8a5d' },
  { id: 'night', name: '加班夜宵', dot: '#a5661f' },
  { id: 'drink', name: '饮品小食', dot: '#2a7fd4' },
]

const G = {
  beef: 'linear-gradient(135deg,#f6c39a 0%,#d98a52 100%)',
  chicken: 'linear-gradient(135deg,#f7d9a8 0%,#dfa14f 100%)',
  noodle: 'linear-gradient(135deg,#f2e0bd 0%,#cfa96a 100%)',
  veg: 'linear-gradient(135deg,#c9e6c3 0%,#7cb87a 100%)',
  egg: 'linear-gradient(135deg,#fbf0cd 0%,#e9cf7a 100%)',
  fish: 'linear-gradient(135deg,#cfe6ec 0%,#7ba9b8 100%)',
  soup: 'linear-gradient(135deg,#f6d6c8 0%,#d3947c 100%)',
  coffee: 'linear-gradient(135deg,#d8c7b4 0%,#8f7358 100%)',
  juice: 'linear-gradient(135deg,#ffe0a8 0%,#f2a53c 100%)',
  spicy: 'linear-gradient(135deg,#f6bfae 0%,#cf5b3f 100%)',
}

export const DISHES: Dish[] = [
  /* 午餐套餐 */
  { id: 'd1', name: '红烧牛肉饭', spec: '主食 + 时蔬 + 例汤', category: 'lunch', price: 22, sales: 128, left: 15, tint: G.beef, tags: ['招牌'] },
  { id: 'd2', name: '宫保鸡丁饭', spec: '主食 + 时蔬 + 例汤', category: 'lunch', price: 18, sales: 96, left: 22, tint: G.chicken },
  { id: 'd3', name: '香菇滑鸡饭', spec: '主食 + 时蔬', category: 'lunch', price: 18, sales: 74, left: 18, tint: G.chicken },
  { id: 'd4', name: '番茄鸡蛋面', spec: '汤面 + 小菜', category: 'lunch', price: 14, sales: 61, left: 30, tint: G.noodle },
  { id: 'd5', name: '清蒸鲈鱼饭', spec: '主食 + 时蔬 + 例汤', category: 'lunch', price: 26, sales: 42, left: 0, soldOut: true, tint: G.fish },
  /* 晚餐套餐 */
  { id: 'd6', name: '黑椒牛柳饭', spec: '主食 + 时蔬 + 例汤', category: 'dinner', price: 24, sales: 88, left: 12, tint: G.beef, tags: ['招牌'] },
  { id: 'd7', name: '香菇鸡腿饭', spec: '主食 + 时蔬', category: 'dinner', price: 19, sales: 55, left: 20, tint: G.chicken },
  { id: 'd8', name: '酸汤肥牛面', spec: '汤面 + 小菜', category: 'dinner', price: 21, sales: 47, left: 16, tint: G.spicy },
  { id: 'd9', name: '轻食沙拉碗', spec: '鸡胸 + 溏心蛋 + 杂粮', category: 'dinner', price: 20, sales: 39, left: 14, tint: G.veg, tags: ['低卡'] },
  /* 加班夜宵 */
  { id: 'd10', name: '小龙虾拌面', spec: '微辣 · 含小菜', category: 'night', price: 28, sales: 152, left: 8, tint: G.spicy, tags: ['抢手'] },
  { id: 'd11', name: '烤串拼盘', spec: '羊肉 6 串 + 蔬菜', category: 'night', price: 32, sales: 90, left: 5, tint: G.spicy },
  { id: 'd12', name: '关东煮套餐', spec: '六宫格 + 汤', category: 'night', price: 16, sales: 68, left: 25, tint: G.soup },
  { id: 'd13', name: '酸辣粉', spec: '微辣 · 加卤蛋', category: 'night', price: 15, sales: 57, left: 3, tint: G.noodle },
  /* 饮品小食 */
  { id: 'd14', name: '冰美式', spec: '中杯 · 少冰可选', category: 'drink', price: 9, sales: 210, left: 60, tint: G.coffee },
  { id: 'd15', name: '鲜榨橙汁', spec: '无添加糖', category: 'drink', price: 12, sales: 88, left: 35, tint: G.juice },
  { id: 'd16', name: '卤蛋（2 只）', spec: '加餐小食', category: 'drink', price: 4, sales: 176, left: 80, tint: G.egg },
  { id: 'd17', name: '蒜蓉西兰花', spec: '清爽小菜', category: 'drink', price: 8, sales: 44, left: 26, tint: G.veg },
]

/** 配送与采购说明（展示用常量） */
export const MEAL_NOTICE = {
  cutOff: '14:30',
  delivery: '17:30',
  place: '各楼层茶水间',
  rule: '午餐 / 晚餐截止当日 14:30 前下单，17:30 送达工位；加班夜宵 22:00 前下单免配送费。',
  settle: '餐费由行政部统一采购，月底随餐补结算。',
}
