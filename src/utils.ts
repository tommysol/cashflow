// 工具函数

export const fmt = (n: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(n)

export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const monthStr = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export const yearStr = (date = new Date()) => String(date.getFullYear())

export function relativeDate(dateStr: string) {
  const today = todayStr()
  if (dateStr === today) return '今天'
  const d = new Date(dateStr)
  const today2 = new Date(today)
  const diff = Math.round((today2.getTime() - d.getTime()) / 86400000)
  if (diff === 1) return '昨天'
  if (diff === 2) return '前天'
  const week = ['日', '一', '二', '三', '四', '五', '六']
  return `周${week[d.getDay()]}`
}

export function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  const week = ['日', '一', '二', '三', '四', '五', '六']
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}月${day}日 周${week[d.getDay()]}`
}

// 子分类对应的 emoji 简易映射（视觉点缀）
const EMOJI: Record<string, string> = {
  房租: '🏠', 水电网: '💡', 保险: '🛡️', 订阅服务: '📺',
  基金: '📈', 债券: '📊',
  货币基金: '💰', 定存: '🏦',
  酒店: '🏨', spa: '💆', 旅行: '✈️',
  餐饮: '🍜', 交通: '🚇', 购物: '🛍️', 杂项: '📦',
  月度工资: '💼', 年终奖: '🎁',
}
export const subEmoji = (sub?: string, fallback = '📌') =>
  (sub && EMOJI[sub]) || fallback
