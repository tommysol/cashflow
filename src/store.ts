import { useEffect, useState } from 'react'
import {
  ensureSeed,
  getBudgets, getCategories, getAllTransactions,
  saveBudget, saveCategory, saveTransaction,
  deleteBudget, deleteCategory, deleteTransaction,
  importAll,
} from './db'
import type { Budget, Category, Transaction } from './types'

// 极简全局 store（基于 useSyncExternalStore 思想）
type State = {
  loaded: boolean
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
}

let state: State = { loaded: false, categories: [], budgets: [], transactions: [] }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch }
  notify()
}

async function refreshAll() {
  const [categories, budgets, transactions] = await Promise.all([
    getCategories(), getBudgets(), getAllTransactions(),
  ])
  set({ categories, budgets, transactions, loaded: true })
}

export async function bootstrap() {
  await ensureSeed()
  await refreshAll()
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
