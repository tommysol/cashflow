import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store, useStore } from '../store'
import { fmt, monthStr, todayStr } from '../utils'
import { uid } from '../db'
import type { TxType } from '../types'

export default function AddTx() {
  const nav = useNavigate()
  const { categories, budgets, transactions } = useStore(s => s)
  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())

  const typeCats = categories.filter(c => c.type === type)
  const currentCat = typeCats.find(c => c.id === categoryId)

  // 当前分类预算剩余
  const budgetHint = useMemo(() => {
    if (!categoryId) return null
    const b = budgets.find(x => x.categoryId === categoryId)
    if (!b) return null
    const ym = monthStr()
    const spent = transactions
      .filter(t => t.categoryId === categoryId)
      .filter(t => b.period === 'monthly' ? t.date.startsWith(ym) : t.date.startsWith(ym.slice(0, 4)))
      .reduce((s, t) => s + t.amount, 0)
    const remaining = b.amount - spent
    const pct = (spent / b.amount) * 100
    return { remaining, total: b.amount, pct, period: b.period }
  }, [categoryId, budgets, transactions])

  const canSave = !!amount && Number(amount) > 0 && !!categoryId

  async function handleSave() {
    if (!canSave) return
    await store.upsertTransaction({
      id: uid(),
      type,
      amount: Number(amount),
      categoryId,
      subcategory: subcategory || undefined,
      note: note || undefined,
      date,
      createdAt: Date.now(),
    })
    nav(-1)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-12 pb-5">
        <button onClick={() => nav(-1)} className="text-white/60">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-white text-[17px] font-semibold">记一笔</h2>
        <div style={{ width: 24 }} />
      </div>

      {/* Type Toggle */}
      <div className="mx-6 mb-6 flex p-1 rounded-[12px] border border-white/[.08]" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {(['expense', 'income'] as TxType[]).map(t => (
          <button
            key={t}
            onClick={() => { setType(t); setCategoryId(''); setSubcategory('') }}
            className="flex-1 py-2.5 rounded-[9px] text-[14px] font-medium transition-all"
            style={
              type === t
                ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 600, boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }
                : { color: 'rgba(255,255,255,0.4)' }
            }
          >
            {t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="text-center mb-7 px-6">
        <p className="text-white/40 text-[12px] mb-2 tracking-wide">金额</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-white/50 text-[24px] font-light">¥</span>
          <input
            value={amount}
            onChange={e => {
              const v = e.target.value.replace(/[^\d.]/g, '')
              if ((v.match(/\./g) || []).length > 1) return
              setAmount(v)
            }}
            inputMode="decimal"
            placeholder="0"
            className="text-white text-[48px] font-bold tracking-tight bg-transparent text-center"
            style={{ width: Math.max(60, (amount.length + 1) * 28), minWidth: 60 }}
          />
        </div>
        <div className="w-32 h-px mx-auto mt-3"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.4), transparent)' }} />
      </div>

      {/* Category */}
      <div className="px-6 mb-5">
        <p className="text-white/50 text-[12px] mb-3 tracking-wide">分类</p>
        <div className="flex flex-wrap gap-2">
          {typeCats.length === 0 && (
            <p className="text-white/30 text-[13px]">还没有{type === 'expense' ? '支出' : '收入'}分类，去设置中添加</p>
          )}
          {typeCats.map(c => {
            const active = categoryId === c.id
            return (
              <button
                key={c.id}
                onClick={() => { setCategoryId(c.id); setSubcategory('') }}
                className="px-4 py-2 rounded-full text-[13px] border transition-all"
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        borderColor: 'rgba(129,140,248,0.3)',
                        color: '#fff', fontWeight: 500,
                        boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                      }
                    : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }
                }
              >{c.name}</button>
            )
          })}
        </div>
      </div>

      {/* Subcategory */}
      {currentCat && currentCat.subcategories.length > 0 && (
        <div className="px-6 mb-5">
          <p className="text-white/50 text-[12px] mb-3 tracking-wide">子分类</p>
          <div className="flex flex-wrap gap-2">
            {currentCat.subcategories.map(s => {
              const active = subcategory === s
              return (
                <button
                  key={s}
                  onClick={() => setSubcategory(active ? '' : s)}
                  className="px-3.5 py-2 rounded-2xl text-[13px] border transition-all"
                  style={
                    active
                      ? { background: 'rgba(167,139,250,0.15)', borderColor: 'rgba(167,139,250,0.3)', color: '#C4B5FD', fontWeight: 500 }
                      : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }
                  }
                >{s}</button>
              )
            })}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="px-6 mb-5">
        <p className="text-white/50 text-[12px] mb-2.5 tracking-wide">备注（可选）</p>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="..."
          className="w-full px-4 py-3 rounded-[12px] border border-white/[.08] text-[13px] text-white placeholder-white/30"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>

      {/* Date */}
      <div className="px-6 mb-5">
        <p className="text-white/50 text-[12px] mb-2.5 tracking-wide">日期</p>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-3 rounded-[12px] border border-white/[.08] text-[13px] text-white/85"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>

      {/* Budget Hint */}
      {budgetHint && type === 'expense' && (
        <div className="mx-6 mb-6 px-4 py-3 rounded-[12px] flex items-center gap-2.5"
          style={
            budgetHint.pct >= 95
              ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }
              : budgetHint.pct >= 75
                ? { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }
                : { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }
          }
        >
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: budgetHint.pct >= 95 ? '#EF4444' : budgetHint.pct >= 75 ? '#FBBF24' : '#818CF8' }} />
          <span className="text-[12px]"
            style={{ color: budgetHint.pct >= 95 ? 'rgba(239,68,68,0.9)' : budgetHint.pct >= 75 ? 'rgba(251,191,36,0.9)' : 'rgba(129,140,248,0.9)' }}
          >
            {currentCat?.name}本{budgetHint.period === 'monthly' ? '月' : '年'}预算剩余 ¥{fmt(budgetHint.remaining)} / ¥{fmt(budgetHint.total)}
          </span>
        </div>
      )}

      {/* Save */}
      <div className="px-6 pb-10">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-4 rounded-[14px] text-[16px] font-semibold tracking-wide transition-all"
          style={
            canSave
              ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
          }
        >保存</button>
      </div>
    </div>
  )
}
