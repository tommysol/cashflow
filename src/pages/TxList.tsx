import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import {
  fmt, formatDateLabel, getCurrentPeriod, getPeriodByAnchor, inRange,
  recentAnchors, subEmoji, todayStr,
} from '../utils'
import type { Transaction } from '../types'

export default function TxList() {
  const { categories, transactions, settings } = useStore(s => s)

  const cur = getCurrentPeriod(settings)
  const [anchor, setAnchor] = useState(cur.anchor)
  const [filterCat, setFilterCat] = useState<string>('all')

  const range = useMemo(() => getPeriodByAnchor(anchor, settings), [anchor, settings])
  const anchors = useMemo(() => recentAnchors(settings, 18), [settings, transactions.length])

  const filtered = transactions
    .filter(t => inRange(t.date, range))
    .filter(t => filterCat === 'all' || t.categoryId === filterCat)
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))

  const grouped = useMemo(() => {
    const map: Record<string, Transaction[]> = {}
    for (const t of filtered) {
      ;(map[t.date] ||= []).push(t)
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = income - expense

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4">
        <h2 className="text-white text-[20px] font-bold">流水</h2>
        <select
          value={anchor}
          onChange={e => setAnchor(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-white/[.08] text-white/85 text-[13px]"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {anchors.map(a => {
            const r = getPeriodByAnchor(a, settings)
            return <option key={a} value={a} style={{ background: '#1A1A2E' }}>{r.label}</option>
          })}
        </select>
      </div>

      {/* 周期范围副标 */}
      <div className="px-6 mb-3">
        <p className="text-white/40 text-[11px]">
          {settings.periodMode === 'salary' ? '薪资月：' : '自然月：'}
          {range.start} ~ {range.end}
        </p>
      </div>

      {/* Summary */}
      <div className="mx-6 mb-4 py-4 px-5 rounded-[14px] flex justify-between border"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))', borderColor: 'rgba(99,102,241,0.15)' }}
      >
        <div className="text-center flex-1">
          <p className="text-white/40 text-[11px] mb-1">收入</p>
          <p className="text-income text-[15px] font-semibold">+{fmt(income)}</p>
        </div>
        <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="text-center flex-1">
          <p className="text-white/40 text-[11px] mb-1">支出</p>
          <p className="text-expense text-[15px] font-semibold">-{fmt(expense)}</p>
        </div>
        <div className="w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="text-center flex-1">
          <p className="text-white/40 text-[11px] mb-1">净额</p>
          <p className="text-brand-light text-[15px] font-semibold">{net >= 0 ? '+' : ''}{fmt(net)}</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="px-6 mb-4 flex gap-2 overflow-x-auto">
        <FilterChip active={filterCat === 'all'} onClick={() => setFilterCat('all')}>全部</FilterChip>
        {categories.map(c => (
          <FilterChip key={c.id} active={filterCat === c.id} onClick={() => setFilterCat(c.id)}>{c.name}</FilterChip>
        ))}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <p className="text-white/30 text-[13px] text-center py-12">本周期暂无记录</p>
      ) : (
        grouped.map(([date, txs]) => {
          const dayExp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
          const dayInc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
          const dayNet = dayInc - dayExp
          return (
            <div key={date} className="px-6 mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-white/40 text-[12px] font-medium">
                  {formatDateLabel(date)}{date === todayStr() ? ' · 今天' : ''}
                </span>
                <span className="text-white/30 text-[11px]">
                  {dayNet >= 0 ? '+' : ''}{fmt(dayNet)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {txs.map(t => <TxRow key={t.id} t={t} categories={categories} />)}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-2xl text-[12px] whitespace-nowrap border transition-all"
      style={
        active
          ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 500, borderColor: 'transparent' }
          : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
      }
    >{children}</button>
  )
}

function TxRow({ t, categories }: { t: Transaction, categories: any[] }) {
  const cat = categories.find(c => c.id === t.categoryId)
  return (
    <Link
      to={`/edit/${t.id}`}
      className="flex justify-between items-center px-4 py-3 rounded-[12px] border border-white/[.05] active:scale-[0.98] transition-transform"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center text-[15px]"
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${cat?.color || '#6366F1'}40, ${cat?.color || '#6366F1'}88)`,
          }}
        >
          {subEmoji(t.subcategory, t.type === 'income' ? '💰' : '📌')}
        </div>
        <div>
          <p className="text-white/90 text-[14px] font-medium">{t.note || t.subcategory || cat?.name}</p>
          <p className="text-white/35 text-[11px] mt-0.5">{cat?.name}{t.subcategory ? ` · ${t.subcategory}` : ''}</p>
        </div>
      </div>
      <span className={`text-[15px] font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
      </span>
    </Link>
  )
}
