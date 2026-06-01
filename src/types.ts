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

export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: 'monthly' | 'yearly'
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

export interface BackupData {
  version: number
  exportedAt: number
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
}
