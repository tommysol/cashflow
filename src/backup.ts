// localStorage 冗余备份
// 主存储仍然是 IndexedDB（更大容量、结构化）
// localStorage 作为镜像兜底：每次主写入后同步写入 LS，启动时若发现 IDB 空而 LS 有数据则自动恢复
//
// 触发自动恢复的条件（保守策略，避免误恢复）：
//   - IDB 中 transactions/budgets 都为空
//   - LS 中至少有 1 条交易记录或 1 个预算（说明用户确实用过）

import type { AppSettings, Budget, Category, Transaction } from './types'

const KEY = 'cashflow:mirror:v1'
const KEY_LAST = 'cashflow:lastBackup'  // 冗余的"最后已知数据"，多个 key 互为兜底

interface MirrorPayload {
  version: 1
  savedAt: number
  categories: Category[]
  budgets: Budget[]
  transactions: Transaction[]
  settings?: AppSettings
}

export function writeMirror(data: Omit<MirrorPayload, 'version' | 'savedAt'>) {
  try {
    const payload: MirrorPayload = { version: 1, savedAt: Date.now(), ...data }
    const json = JSON.stringify(payload)
    localStorage.setItem(KEY, json)
    localStorage.setItem(KEY_LAST, json)
  } catch {
    // localStorage 满或不可用时静默失败，不影响主流程
  }
}

export function readMirror(): MirrorPayload | null {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(KEY_LAST)
    if (!raw) return null
    const data = JSON.parse(raw) as MirrorPayload
    if (!data || !Array.isArray(data.categories)) return null
    return data
  } catch {
    return null
  }
}

// 是否有"用户产生的数据"（用于判断是否需要恢复）
export function mirrorHasUserData(m: MirrorPayload | null): boolean {
  if (!m) return false
  return (m.transactions?.length || 0) > 0 || (m.budgets?.length || 0) > 0
}
