// 类型定义

export type TxType = 'income' | 'expense'

export interface Category {
  id: string
  type: TxType
  name: string
  color: string         // 用于显示的色块色值
  subcategories: string[]
  order: number
}

export type BudgetKind = 'budget' | 'goal'

export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: 'monthly' | 'yearly'
  kind: BudgetKind     // budget=支出预算（不能超）/ goal=储蓄/投资目标（鼓励超）
}

export interface Transaction {
  id: string
  type: TxType
  amount: number
  categoryId: string
  subcategory?: string
  note?: string
  date: string         // YYYY-MM-DD
  createdAt: number
}

// 统计口径设置
export type PeriodMode = 'natural' | 'salary'

export interface AppSettings {
  id: 'app'
  periodMode: PeriodMode  // 自然月 / 薪资月
  payday: number          // 1-28，每月发薪日（薪资月模式下生效）
  adjustWeekend: boolean  // 发薪日落周末/节假日时往前找最近工作日
}

export interface BackupData {
  version: number
  exportedAt: number
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  settings?: AppSettings
}
