import { Link } from 'react-router-dom'
import { useStore } from '../store'
import {
  categoryKind, fmt, formatDateLabel, getCurrentPeriod, getCurrentYearRange, inRange,
  kindLabel, kindSpentLabel, progressVisual, subEmoji,
} from '../utils'
import type { Transaction } from '../types'

export default function Home() {
  const { categories, budgets, transactions, settings, loaded } = useStore(s => s)
  if (!loaded) return <div className="p-8 text-white/40 text-center">加载中…</div>

  const period = getCurrentPeriod(settings)
  const yearR = getCurrentYearRange(settings)
  const monthTxs = transactions.filter(t => inRange(t.date, period))

  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenseAll = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // 投资/存款分类：直接由分类名决定
  const goalCatIds = new Set(categories.filter(c => categoryKind(c) === 'goal').map(c => c.id))
  const invest = monthTxs.filter(t => goalCatIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
  const realExpense = expenseAll - invest
  const net = income - expenseAll

  // 预算/目标列表
  const items = budgets
    .map(b => {
      const cat = categories.find(c => c.id === b.categoryId)
      if (!cat) return null
      const kind = categoryKind(cat)
      const range = b.period === 'monthly' ? period : yearR
      const spent = transactions
        .filter(t => t.categoryId === b.categoryId)
        .filter(t => inRange(t.date, range))
        .reduce((s, t) => s + t.amount, 0)
      return { ...b, cat, kind, spent, vis: progressVisual(spent, b.amount, kind) }
    })
    .filter(Boolean)
    .slice(0, 4) as any[]

  const recentTxs = [...transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <p className="text-white/50 text-[13px]">{period.label}{settings.periodMode === 'salary' ? ' · 薪资月' : ''}</p>
        <h1 className="text-white text-[26px] font-bold tracking-tight mt-1">CashFlow</h1>
      </div>

      {/* Balance Card */}
      <div className="mx-6 mb-5 p-6 rounded-[20px] relative overflow-hidden border border-white/[.08]"
        style={{ background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)' }} />
        <p className="text-white/50 text-[12px] uppercase tracking-widest mb-2">本期净余额</p>
        <p className="text-white text-[36px] font-bold tracking-tight mb-5">¥ {fmt(net)}</p>
        <div className="flex gap-6">
          <div>
            <p className="text-white/40 text-[11px] mb-1">收入</p>
            <p className="text-income text-[16px] font-semibold">+{fmt(income)}</p>
          </div>
          <div>
            <p className="text-white/40 text-[11px] mb-1">支出</p>
            <p className="text-expense text-[16px] font-semibold">-{fmt(realExpense)}</p>
          </div>
          <div>
            <p className="text-white/40 text-[11px] mb-1">投资/存款</p>
            <p className="text-invest text-[16px] font-semibold">-{fmt(invest)}</p>
          </div>
        </div>
      </div>

      {/* Budget / Goal */}
      <div className="px-6 mb-5">
        <div className="flex justify-between items-center mb-3">
          <p className="text-white/90 text-[15px] font-semibold">预算 & 目标</p>
          <Link to="/budget" className="text-white/40 text-[12px]">查看全部 →</Link>
        </div>

        {items.length === 0 ? (
          <Link to="/budget"
            className="block px-4 py-5 rounded-[14px] border border-dashed border-brand-from/30 text-center text-brand-light text-[13px]"
            style={{ background: 'rgba(99,102,241,0.05)' }}
          >还没有预算/目标 · 点击设置</Link>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(b => (
              <div key={b.id} className="rounded-[14px] px-4 py-3 border border-white/[.06]"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-white/85 text-[13px] font-medium flex items-center gap-1.5">
                    {b.cat.name}
                    <span className="text-[9px] px-1 py-px rounded"
                      style={
                        b.kind === 'goal'
                          ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
                          : { background: 'rgba(99,102,241,0.15)', color: '#818CF8' }
                      }
                    >{b.kind === 'goal' ? '目标' : '预算'}</span>
                    {b.vis.status === 'success' && <span className="text-[10px] text-income">✓ 达成</span>}
                  </span>
                  <span className="text-white/50 text-[12px]">
                    {kindSpentLabel(b.kind)} ¥{fmt(b.spent)} / ¥{fmt(b.amount)}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${b.vis.pctClamped}%`, background: b.vis.gradient }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent */}
      <div className="px-6">
        <p className="text-white/90 text-[15px] font-semibold mb-3">最近记录</p>
        {recentTxs.length === 0 ? (
          <p className="text-white/30 text-[13px] text-center py-8">还没有记录 · 点击下方 + 开始</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentTxs.map(t => <TxRow key={t.id} t={t} categories={categories} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function TxRow({ t, categories }: { t: Transaction, categories: any[] }) {
  const cat = categories.find(c => c.id === t.categoryId)
  return (
    <div className="flex justify-between items-center px-4 py-3 rounded-[12px] border border-white/[.05]"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center text-[14px]"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${cat?.color || '#6366F1'}40, ${cat?.color || '#6366F1'}88)`,
          }}
        >
          {subEmoji(t.subcategory, t.type === 'income' ? '💰' : '📌')}
        </div>
        <div>
          <p className="text-white/90 text-[13px] font-medium">{t.note || t.subcategory || cat?.name}</p>
          <p className="text-white/40 text-[11px] mt-0.5">{cat?.name}{t.subcategory ? ` · ${t.subcategory}` : ''} · {formatDateLabel(t.date)}</p>
        </div>
      </div>
      <span className={`text-[14px] font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
      </span>
    </div>
  )
}
