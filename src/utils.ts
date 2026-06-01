// 工具函数
import type { AppSettings, BudgetKind } from './types'

export const fmt = (n: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(n)

export const pad = (n: number) => String(n).padStart(2, '0')

export const dateStrOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayStr = () => dateStrOf(new Date())

export const monthStr = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`

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

// ============================================================
// 节假日 / 工作日 / 统计周期
// ============================================================

// 中国法定节假日（仅放假日，调休补班的工作日视为正常工作日）
// 仅维护近年关键日期，落到此表的日子视作非工作日
const HOLIDAYS = new Set<string>([
  // 2026
  '2026-01-01', '2026-01-02', '2026-01-03',                                  // 元旦
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', // 春节（示意）
  '2026-04-04', '2026-04-05', '2026-04-06',                                  // 清明
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',      // 劳动节
  '2026-06-19', '2026-06-20', '2026-06-21',                                  // 端午
  '2026-09-25', '2026-09-26', '2026-09-27',                                  // 中秋
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', // 国庆
  // 2027 元旦
  '2027-01-01', '2027-01-02', '2027-01-03',
])

// 调休补班日（这些原本是周末，但被调为工作日）
const WORK_OVERRIDES = new Set<string>([
  // 2026 示意（实际以国务院公告为准）
  '2026-02-14',  // 春节调休
  '2026-04-26',  // 劳动节调休
  '2026-09-28',  // 国庆调休
])

export function isWorkday(d: Date): boolean {
  const s = dateStrOf(d)
  if (WORK_OVERRIDES.has(s)) return true
  if (HOLIDAYS.has(s)) return false
  const day = d.getDay()
  return day !== 0 && day !== 6
}

// 给定年月+目标日，返回该日期；若需要避让周末/节假日则向前找最近工作日
export function adjustedPayday(year: number, month0: number, day: number, adjust: boolean): Date {
  // month0: 0-11
  const lastDay = new Date(year, month0 + 1, 0).getDate()
  const cap = Math.min(day, lastDay)
  let d = new Date(year, month0, cap)
  if (!adjust) return d
  while (!isWorkday(d)) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  }
  return d
}

// 周期范围：返回 [startDateStr, endDateStr]，包含两端
export interface PeriodRange {
  start: string   // YYYY-MM-DD
  end: string     // YYYY-MM-DD
  label: string   // 显示文案
  // anchor 用作"周期标识"，自然月=YYYY-MM，薪资月也用 YYYY-MM 表示开始月份
  anchor: string
}

// 自然月
export function naturalMonthRange(yyyymm: string): PeriodRange {
  const [y, m] = yyyymm.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  return {
    start: dateStrOf(start),
    end: dateStrOf(end),
    label: `${y}年${m}月`,
    anchor: yyyymm,
  }
}

// 薪资月：从 anchor 月份的发薪日，到下个月发薪日前一天
export function salaryMonthRange(anchorYYYYMM: string, settings: AppSettings): PeriodRange {
  const [y, m] = anchorYYYYMM.split('-').map(Number)
  const start = adjustedPayday(y, m - 1, settings.payday, settings.adjustWeekend)
  const next = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  const nextPayday = adjustedPayday(next.getFullYear(), next.getMonth(), settings.payday, settings.adjustWeekend)
  const end = new Date(nextPayday.getFullYear(), nextPayday.getMonth(), nextPayday.getDate() - 1)
  const sM = start.getMonth() + 1, sD = start.getDate()
  const eM = end.getMonth() + 1, eD = end.getDate()
  return {
    start: dateStrOf(start),
    end: dateStrOf(end),
    label: `${start.getFullYear()}/${sM}/${sD} - ${eM}/${eD}`,
    anchor: anchorYYYYMM,
  }
}

// 取得当前周期（包含今天）
export function getCurrentPeriod(settings: AppSettings): PeriodRange {
  const today = new Date()
  if (settings.periodMode === 'natural') {
    return naturalMonthRange(monthStr(today))
  }
  // 薪资月：今天 >= 本月发薪日 → anchor=本月；否则 anchor=上月
  const thisMonthPayday = adjustedPayday(today.getFullYear(), today.getMonth(), settings.payday, settings.adjustWeekend)
  if (today >= thisMonthPayday) {
    return salaryMonthRange(monthStr(today), settings)
  }
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return salaryMonthRange(monthStr(prev), settings)
}

// 给定 anchor 取范围（用于切换月份）
export function getPeriodByAnchor(anchor: string, settings: AppSettings): PeriodRange {
  return settings.periodMode === 'natural'
    ? naturalMonthRange(anchor)
    : salaryMonthRange(anchor, settings)
}

// 取最近 N 个 anchor（用于月份选择器）
export function recentAnchors(settings: AppSettings, count = 12): string[] {
  const cur = getCurrentPeriod(settings)
  const result: string[] = []
  let [y, m] = cur.anchor.split('-').map(Number)
  for (let i = 0; i < count; i++) {
    result.push(`${y}-${pad(m)}`)
    m -= 1
    if (m === 0) { m = 12; y -= 1 }
  }
  return result
}

// 判断日期是否落在范围内
export function inRange(dateStr: string, range: PeriodRange) {
  return dateStr >= range.start && dateStr <= range.end
}

// 年度范围（用于 yearly 周期的预算）
export function yearRange(yyyy: string): PeriodRange {
  return {
    start: `${yyyy}-01-01`,
    end: `${yyyy}-12-31`,
    label: `${yyyy}年`,
    anchor: yyyy,
  }
}

// 取当前周期对应的"年范围"
export function getCurrentYearRange(settings: AppSettings): PeriodRange {
  const cur = getCurrentPeriod(settings)
  return yearRange(cur.anchor.slice(0, 4))
}

// ============================================================
// 预算 / 目标 进度可视化辅助
// ============================================================

export interface ProgressVisual {
  pct: number            // 百分比（0-150 都可能）
  pctClamped: number     // 0-100，用于条形宽度
  color: string          // 主色
  gradient: string       // 进度条渐变
  status: 'normal' | 'warn' | 'danger' | 'success'
}

// budget：花得越少越好；goal：存得越多越好
export function progressVisual(spent: number, target: number, kind: BudgetKind): ProgressVisual {
  const pct = target > 0 ? (spent / target) * 100 : 0
  const pctClamped = Math.min(100, Math.max(0, pct))

  if (kind === 'budget') {
    if (pct >= 95) return { pct, pctClamped, color: '#F87171', gradient: 'linear-gradient(90deg, #EF4444, #F87171)', status: 'danger' }
    if (pct >= 75) return { pct, pctClamped, color: '#FBBF24', gradient: 'linear-gradient(90deg, #F59E0B, #FBBF24)', status: 'warn' }
    return { pct, pctClamped, color: '#818CF8', gradient: 'linear-gradient(90deg, #6366F1, #818CF8)', status: 'normal' }
  }
  // goal
  if (pct >= 100) return { pct, pctClamped: 100, color: '#34D399', gradient: 'linear-gradient(90deg, #10B981, #34D399)', status: 'success' }
  if (pct >= 50) return { pct, pctClamped, color: '#818CF8', gradient: 'linear-gradient(90deg, #6366F1, #818CF8)', status: 'normal' }
  return { pct, pctClamped, color: '#9CA3AF', gradient: 'linear-gradient(90deg, #6B7280, #9CA3AF)', status: 'normal' }
}

// 文案
export const kindLabel = (kind: BudgetKind, period: 'monthly' | 'yearly') => {
  const periodLabel = period === 'monthly' ? '月' : '年'
  return kind === 'budget' ? `${periodLabel}预算` : `${periodLabel}度目标`
}

export const kindSpentLabel = (kind: BudgetKind) => kind === 'budget' ? '已用' : '已存'
