import { useState } from 'react'
import { store, useStore } from '../store'
import { fmt, monthStr } from '../utils'
import { uid } from '../db'
import type { Budget } from '../types'

export default function BudgetPage() {
  const { categories, budgets, transactions } = useStore(s => s)
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
    const amount = Number(draftAmount)
    if (!amount || amount <= 0) {
      // 删除该预算
      const exist = budgets.find(b => b.categoryId === catId)
      if (exist) await store.removeBudget(exist.id)
    } else {
      const exist = budgets.find(b => b.categoryId === catId)
      const item: Budget = {
        id: exist?.id || uid(),
        categoryId: catId,
        amount,
        period: draftPeriod,
      }
      await store.upsertBudget(item)
    }
    setEditing(null)
  }

  const ym = monthStr()

  return (
    <div>
      <div className="px-6 pt-12 pb-4">
        <h2 className="text-white text-[20px] font-bold">预算</h2>
        <p className="text-white/40 text-[12px] mt-1">为每个支出分类设置月/年预算上限</p>
      </div>

      <div className="px-6 flex flex-col gap-3 mb-6">
        {expenseCats.map(c => {
          const b = budgets.find(x => x.categoryId === c.id)
          const spent = transactions
            .filter(t => t.categoryId === c.id)
            .filter(t => !b || (b.period === 'monthly' ? t.date.startsWith(ym) : t.date.startsWith(ym.slice(0, 4))))
            .reduce((s, t) => s + t.amount, 0)
          const pct = b ? Math.min(100, (spent / b.amount) * 100) : 0
          const isEditing = editing === c.id

          return (
            <div key={c.id} className="rounded-[14px] p-4 border border-white/[.06]"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-white/90 text-[14px] font-medium">{c.name}</span>
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
                      placeholder="预算金额（清空则取消）"
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
              ) : b ? (
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-white/50 text-[12px]">
                      已用 ¥{fmt(spent)} / {b.period === 'monthly' ? '月' : '年'}预算 ¥{fmt(b.amount)}
                    </span>
                    <span className="text-[13px] font-medium"
                      style={{ color: pct >= 95 ? '#F87171' : pct >= 75 ? '#FBBF24' : '#818CF8' }}
                    >{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct >= 95 ? 'linear-gradient(90deg, #EF4444, #F87171)'
                          : pct >= 75 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                          : 'linear-gradient(90deg, #6366F1, #818CF8)',
                      }}
                    />
                  </div>
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
