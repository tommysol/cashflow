import { useState } from 'react'
import { store, useStore } from '../store'
import {
  categoryKind, fmt, getCurrentPeriod, getCurrentYearRange,
  inRange, kindLabel, kindSpentLabel, progressVisual,
} from '../utils'
import { uid } from '../db'
import type { Budget } from '../types'

export default function BudgetPage() {
  const { categories, budgets, transactions, settings } = useStore(s => s)
  const expenseCats = categories.filter(c => c.type === 'expense')

  const [editing, setEditing] = useState<string | null>(null)
  const [draftAmount, setDraftAmount] = useState('')
  const [draftPeriod, setDraftPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const handleEdit = (catId: string) => {
    const b = budgets.find(x => x.categoryId === catId)
    setDraftAmount(b ? String(b.amount) : '')
    setDraftPeriod(b?.period || 'monthly')
    setEditing(catId)
  }

  const handleSave = async (catId: string) => {
    const cat = categories.find(c => c.id === catId)
    const kind = categoryKind(cat)
    const amount = Number(draftAmount)
    if (!amount || amount <= 0) {
      const exist = budgets.find(b => b.categoryId === catId)
      if (exist) await store.removeBudget(exist.id)
    } else {
      const exist = budgets.find(b => b.categoryId === catId)
      const item: Budget = {
        id: exist?.id || uid(),
        categoryId: catId,
        amount,
        period: draftPeriod,
        kind,  // 由分类决定，用户不可改
      }
      await store.upsertBudget(item)
    }
    setEditing(null)
  }

  const monthRange = getCurrentPeriod(settings)
  const yearRangeR = getCurrentYearRange(settings)

  return (
    <div>
      <div className="px-6 pt-12 pb-4">
        <h2 className="text-white text-[20px] font-bold">预算与目标</h2>
        <p className="text-white/40 text-[12px] mt-1">
          投资/现金存款类设「目标」（鼓励超），其他设「预算」（不能超）
        </p>
      </div>

      <div className="px-6 flex flex-col gap-3 mb-6">
        {expenseCats.map(c => {
          const kind = categoryKind(c)  // ← 由分类决定
          const b = budgets.find(x => x.categoryId === c.id)
          const range = !b ? null : (b.period === 'monthly' ? monthRange : yearRangeR)
          const spent = !b ? 0 : transactions
            .filter(t => t.categoryId === c.id)
            .filter(t => inRange(t.date, range!))
            .reduce((s, t) => s + t.amount, 0)
          const vis = b ? progressVisual(spent, b.amount, kind) : null
          const isEditing = editing === c.id

          return (
            <div key={c.id} className="rounded-[14px] p-4 border border-white/[.06]"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-white/90 text-[14px] font-medium">{c.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded"
                    style={
                      kind === 'goal'
                        ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                        : { background: 'rgba(99,102,241,0.15)', color: '#818CF8' }
                    }
                  >
                    {kind === 'goal' ? '目标' : '预算'}
                  </span>
                </div>
                {!isEditing && (
                  <button onClick={() => handleEdit(c.id)} className="text-brand-light text-[12px]">
                    {b ? '编辑' : '设置'}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div className="flex p-1 rounded-lg border border-white/[.08]" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {(['monthly', 'yearly'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setDraftPeriod(p)}
                        className="flex-1 py-1.5 rounded-md text-[12px]"
                        style={
                          draftPeriod === p
                            ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 500 }
                            : { color: 'rgba(255,255,255,0.5)' }
                        }
                      >{p === 'monthly' ? '月度' : '年度'}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[.08]"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <span className="text-white/40 text-[14px]">¥</span>
                    <input
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      value={draftAmount}
                      onChange={e => setDraftAmount(e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder={kind === 'budget' ? '预算上限（清空则取消）' : '目标金额（清空则取消）'}
                      className="flex-1 text-white text-[14px] placeholder-white/30"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-lg text-[13px]"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>取消</button>
                    <button onClick={() => handleSave(c.id)} className="flex-1 py-2 rounded-lg text-[13px] text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>保存</button>
                  </div>
                </div>
              ) : b && vis ? (
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white/50 text-[12px]">
                      {kindSpentLabel(kind)} ¥{fmt(spent)} / {kindLabel(kind, b.period)} ¥{fmt(b.amount)}
                    </span>
                    <span className="text-[13px] font-medium" style={{ color: vis.color }}>
                      {vis.pct.toFixed(0)}%{vis.status === 'success' ? ' ✓' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${vis.pctClamped}%`, background: vis.gradient }} />
                  </div>
                  {kind === 'goal' && range && (
                    <p className="text-white/30 text-[11px] mt-2">{range.label}</p>
                  )}
                </div>
              ) : (
                <p className="text-white/30 text-[12px]">未设置</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
