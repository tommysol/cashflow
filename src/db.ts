import { openDB, type IDBPDatabase } from 'idb'
import type { Budget, Category, Transaction } from './types'

const DB_NAME = 'cashflow'
const DB_VERSION = 1

export const STORES = {
  categories: 'categories',
  budgets: 'budgets',
  transactions: 'transactions',
} as const

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.categories)) {
          db.createObjectStore(STORES.categories, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.budgets)) {
          db.createObjectStore(STORES.budgets, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.transactions)) {
          const s = db.createObjectStore(STORES.transactions, { keyPath: 'id' })
          s.createIndex('date', 'date')
          s.createIndex('categoryId', 'categoryId')
        }
      },
    })
  }
  return dbPromise
}

// uid
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// ============ 默认数据 ============
export const DEFAULT_CATEGORIES: Category[] = [
  // 收入
  { id: 'inc-salary', type: 'income', name: '月度工资', color: '#34D399', subcategories: [], order: 1 },
  { id: 'inc-bonus', type: 'income', name: '年终奖', color: '#10B981', subcategories: [], order: 2 },
  // 支出
  { id: 'exp-fixed', type: 'expense', name: '固定刚性支出', color: '#EF4444', subcategories: ['房租', '水电网', '保险', '订阅服务'], order: 1 },
  { id: 'exp-invest', type: 'expense', name: '投资', color: '#A78BFA', subcategories: ['基金', '债券'], order: 2 },
  { id: 'exp-saving', type: 'expense', name: '现金存款', color: '#34D399', subcategories: ['货币基金', '定存'], order: 3 },
  { id: 'exp-fun', type: 'expense', name: '快乐消费', color: '#FBBF24', subcategories: ['酒店', 'spa', '旅行'], order: 4 },
  { id: 'exp-life', type: 'expense', name: '日常生活', color: '#60A5FA', subcategories: ['餐饮', '交通', '购物', '杂项'], order: 5 },
]

// ============ Categories ============
export async function getCategories(): Promise<Category[]> {
  const db = await getDB()
  const all = (await db.getAll(STORES.categories)) as Category[]
  return all.sort((a, b) => (a.type === b.type ? a.order - b.order : a.type === 'expense' ? 1 : -1))
}

export async function saveCategory(c: Category) {
  const db = await getDB()
  await db.put(STORES.categories, c)
}

export async function deleteCategory(id: string) {
  const db = await getDB()
  await db.delete(STORES.categories, id)
}

// ============ Budgets ============
export async function getBudgets(): Promise<Budget[]> {
  const db = await getDB()
  return (await db.getAll(STORES.budgets)) as Budget[]
}

export async function saveBudget(b: Budget) {
  const db = await getDB()
  await db.put(STORES.budgets, b)
}

export async function deleteBudget(id: string) {
  const db = await getDB()
  await db.delete(STORES.budgets, id)
}

// ============ Transactions ============
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB()
  return (await db.getAll(STORES.transactions)) as Transaction[]
}

export async function getTransactionsByMonth(yyyymm: string): Promise<Transaction[]> {
  const db = await getDB()
  const all = (await db.getAll(STORES.transactions)) as Transaction[]
  return all.filter(t => t.date.startsWith(yyyymm))
}

export async function saveTransaction(t: Transaction) {
  const db = await getDB()
  await db.put(STORES.transactions, t)
}

export async function deleteTransaction(id: string) {
  const db = await getDB()
  await db.delete(STORES.transactions, id)
}

// ============ 初始化（首次启动写默认分类） ============
export async function ensureSeed() {
  const cats = await getCategories()
  if (cats.length === 0) {
    const db = await getDB()
    const tx = db.transaction(STORES.categories, 'readwrite')
    for (const c of DEFAULT_CATEGORIES) await tx.store.put(c)
    await tx.done
  }
}

// ============ 备份/恢复 ============
export async function exportAll() {
  const [categories, budgets, transactions] = await Promise.all([
    getCategories(),
    getBudgets(),
    getAllTransactions(),
  ])
  return { version: 1, exportedAt: Date.now(), categories, budgets, transactions }
}

export async function importAll(data: { categories: Category[]; budgets: Budget[]; transactions: Transaction[] }) {
  const db = await getDB()
  const tx = db.transaction([STORES.categories, STORES.budgets, STORES.transactions], 'readwrite')
  await Promise.all([
    tx.objectStore(STORES.categories).clear(),
    tx.objectStore(STORES.budgets).clear(),
    tx.objectStore(STORES.transactions).clear(),
  ])
  for (const c of data.categories) await tx.objectStore(STORES.categories).put(c)
  for (const b of data.budgets) await tx.objectStore(STORES.budgets).put(b)
  for (const t of data.transactions) await tx.objectStore(STORES.transactions).put(t)
  await tx.done
}
