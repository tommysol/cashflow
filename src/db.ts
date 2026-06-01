import { openDB, type IDBPDatabase } from 'idb'
import type { AppSettings, Budget, Category, Transaction } from './types'

const DB_NAME = 'cashflow'
const DB_VERSION = 2  // v2 增加 settings store

export const STORES = {
  categories: 'categories',
  budgets: 'budgets',
  transactions: 'transactions',
  settings: 'settings',
} as const

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
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
        if (oldVersion < 2 && !db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: 'id' })
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

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  periodMode: 'natural',
  payday: 5,
  adjustWeekend: true,
}

// 哪些默认分类初始化时是 goal 类型
const GOAL_CATEGORY_IDS = new Set(['exp-invest', 'exp-saving'])
export const isDefaultGoalCategory = (catId: string) => GOAL_CATEGORY_IDS.has(catId)

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
  const list = (await db.getAll(STORES.budgets)) as Budget[]
  // 读取时一律按当前分类强制覆盖 kind（避免历史数据脏值）
  const cats = (await db.getAll(STORES.categories)) as Category[]
  const catMap = new Map(cats.map(c => [c.id, c]))
  return list.map(b => {
    const cat = catMap.get(b.categoryId)
    const isGoal = cat && (cat.name.includes('投资') || cat.name.includes('存款') || cat.name.includes('储蓄'))
    return { ...b, kind: isGoal ? 'goal' : 'budget' }
  })
}

export async function saveBudget(b: Budget) {
  const db = await getDB()
  // 写入时同样强制按分类决定 kind
  const cat = (await db.get(STORES.categories, b.categoryId)) as Category | undefined
  const isGoal = cat && (cat.name.includes('投资') || cat.name.includes('存款') || cat.name.includes('储蓄'))
  await db.put(STORES.budgets, { ...b, kind: isGoal ? 'goal' : 'budget' })
}

export async function deleteBudget(id: string) {
  const db = await getDB()
  await db.delete(STORES.budgets, id)
}

// ============ Settings ============
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB()
  const s = (await db.get(STORES.settings, 'app')) as AppSettings | undefined
  return s || DEFAULT_SETTINGS
}

export async function saveSettings(s: AppSettings) {
  const db = await getDB()
  await db.put(STORES.settings, s)
}

// ============ Transactions ============
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB()
  return (await db.getAll(STORES.transactions)) as Transaction[]
}

export async function saveTransaction(t: Transaction) {
  const db = await getDB()
  await db.put(STORES.transactions, t)
}

export async function deleteTransaction(id: string) {
  const db = await getDB()
  await db.delete(STORES.transactions, id)
}

// ============ 初始化 ============
export async function ensureSeed() {
  const cats = await getCategories()
  if (cats.length === 0) {
    const db = await getDB()
    const tx = db.transaction(STORES.categories, 'readwrite')
    for (const c of DEFAULT_CATEGORIES) await tx.store.put(c)
    await tx.done
  }
  // 确保 settings 存在
  const db = await getDB()
  const exists = await db.get(STORES.settings, 'app')
  if (!exists) await db.put(STORES.settings, DEFAULT_SETTINGS)
}

// ============ 备份/恢复 ============
export async function exportAll() {
  const [categories, budgets, transactions, settings] = await Promise.all([
    getCategories(),
    getBudgets(),
    getAllTransactions(),
    getSettings(),
  ])
  return { version: 2, exportedAt: Date.now(), categories, budgets, transactions, settings }
}

export async function importAll(data: {
  categories: Category[]; budgets: Budget[]; transactions: Transaction[]; settings?: AppSettings
}) {
  const db = await getDB()
  const tx = db.transaction([STORES.categories, STORES.budgets, STORES.transactions, STORES.settings], 'readwrite')
  await Promise.all([
    tx.objectStore(STORES.categories).clear(),
    tx.objectStore(STORES.budgets).clear(),
    tx.objectStore(STORES.transactions).clear(),
    tx.objectStore(STORES.settings).clear(),
  ])
  for (const c of data.categories) await tx.objectStore(STORES.categories).put(c)
  // 旧备份的 budget kind 一律按分类名重新计算（避免脏数据）
  const catMap = new Map(data.categories.map(c => [c.id, c]))
  for (const b of data.budgets) {
    const cat = catMap.get(b.categoryId)
    const isGoal = cat && (cat.name.includes('投资') || cat.name.includes('存款') || cat.name.includes('储蓄'))
    const fixed: Budget = { ...b, kind: isGoal ? 'goal' : 'budget' }
    await tx.objectStore(STORES.budgets).put(fixed)
  }
  for (const t of data.transactions) await tx.objectStore(STORES.transactions).put(t)
  await tx.objectStore(STORES.settings).put(data.settings || DEFAULT_SETTINGS)
  await tx.done
}
