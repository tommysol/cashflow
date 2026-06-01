import { useEffect, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  ensureSeed,
  getBudgets, getCategories, getAllTransactions, getSettings,
  saveBudget, saveCategory, saveTransaction, saveSettings,
  deleteBudget, deleteCategory, deleteTransaction,
  importAll,
} from './db'
import { writeMirror, readMirror, mirrorHasUserData } from './backup'
import type { AppSettings, Budget, Category, Transaction } from './types'

// 极简全局 store
type State = {
  loaded: boolean
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  settings: AppSettings
  /** 是否触发了从 localStorage 的自动恢复（用于设置页提示用户） */
  autoRestored: boolean
}

let state: State = {
  loaded: false,
  categories: [],
  budgets: [],
  transactions: [],
  settings: DEFAULT_SETTINGS,
  autoRestored: false,
}
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch }
  notify()
}

async function refreshAll(opts: { skipMirror?: boolean } = {}) {
  const [categories, budgets, transactions, settings] = await Promise.all([
    getCategories(), getBudgets(), getAllTransactions(), getSettings(),
  ])
  set({ categories, budgets, transactions, settings, loaded: true })
  // 同步写入 localStorage 镜像
  if (!opts.skipMirror) {
    writeMirror({ categories, budgets, transactions, settings })
  }
}

export async function bootstrap() {
  await ensureSeed()
  await refreshAll({ skipMirror: true })  // 首次加载先不覆盖 mirror

  // ===== 兜底：IDB 空但 LS 有数据，自动恢复 =====
  const idbEmpty = state.transactions.length === 0 && state.budgets.length === 0
  if (idbEmpty) {
    const mirror = readMirror()
    if (mirrorHasUserData(mirror)) {
      try {
        await importAll({
          categories: mirror!.categories,
          budgets: mirror!.budgets,
          transactions: mirror!.transactions,
          settings: mirror!.settings,
        })
        await refreshAll({ skipMirror: true })
        set({ autoRestored: true })
        // 异步告知用户
        setTimeout(() => {
          alert(`检测到上次的数据，已自动从本地备份恢复 ${mirror!.transactions.length} 条记录、${mirror!.budgets.length} 个预算/目标。`)
        }, 300)
      } catch (err) {
        console.error('auto restore failed', err)
      }
    }
  }
  // 启动后写一次 mirror（保证 LS 跟 IDB 同步）
  writeMirror({
    categories: state.categories,
    budgets: state.budgets,
    transactions: state.transactions,
    settings: state.settings,
  })
}

export const store = {
  getState: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  // ---- actions ----
  async upsertCategory(c: Category) { await saveCategory(c); await refreshAll() },
  async removeCategory(id: string) { await deleteCategory(id); await refreshAll() },
  async upsertBudget(b: Budget) { await saveBudget(b); await refreshAll() },
  async removeBudget(id: string) { await deleteBudget(id); await refreshAll() },
  async upsertTransaction(t: Transaction) { await saveTransaction(t); await refreshAll() },
  async removeTransaction(id: string) { await deleteTransaction(id); await refreshAll() },
  async updateSettings(s: AppSettings) { await saveSettings(s); await refreshAll() },
  async restore(data: any) { await importAll(data); await refreshAll() },
}

export function useStore<T>(selector: (s: State) => T): T {
  const [v, setV] = useState(() => selector(state))
  useEffect(() => {
    const fn = () => setV(selector(state))
    const unsub = store.subscribe(fn)
    return () => { unsub() }
  }, [selector])
  return v
}
