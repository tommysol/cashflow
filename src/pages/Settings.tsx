import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { exportAll } from '../db'
import { store, useStore } from '../store'
import { adjustedPayday, dateStrOf, formatDateLabel } from '../utils'
import type { PeriodMode } from '../types'

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { settings, stats } = useStore(s => ({
    settings: s.settings,
    stats: { cats: s.categories.length, txs: s.transactions.length, budgets: s.budgets.length },
  }))

  const handleExport = async () => {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10)
    a.download = `cashflow-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('导入将覆盖当前所有数据，确认继续？')) {
      e.target.value = ''
      return
    }
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.categories || !data.transactions) throw new Error('文件格式错误')
      await store.restore(data)
      alert('导入成功')
    } catch (err: any) {
      alert('导入失败：' + err.message)
    } finally {
      e.target.value = ''
    }
  }

  // 预览发薪日：本月调整后的实际发薪日
  const today = new Date()
  const previewPayday = adjustedPayday(today.getFullYear(), today.getMonth(), settings.payday, settings.adjustWeekend)

  const setMode = (mode: PeriodMode) => {
    store.updateSettings({ ...settings, periodMode: mode })
  }
  const setPayday = (n: number) => {
    if (n < 1 || n > 28) return
    store.updateSettings({ ...settings, payday: n })
  }
  const setAdjust = (v: boolean) => {
    store.updateSettings({ ...settings, adjustWeekend: v })
  }

  return (
    <div>
      <div className="px-6 pt-12 pb-6">
        <h2 className="text-white text-[20px] font-bold">设置</h2>
        <p className="text-white/40 text-[12px] mt-1">CashFlow · 个人消费管理</p>
      </div>

      {/* 数据安全提示 */}
      <div className="mx-6 mb-5 p-3.5 rounded-[12px] flex items-start gap-2.5"
        style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
        <span className="text-[13px] mt-0.5">💡</span>
        <p className="text-white/70 text-[12px] leading-relaxed">
          数据保存在浏览器本地。Safari 长期不打开 PWA 可能清理数据，<b>建议每周点下方"导出备份"</b>到 iCloud Drive。
          已自动启用本地双重备份兜底（IndexedDB + localStorage），但仍建议定期手动导出。
        </p>
      </div>

      {/* Stats */}
      <div className="mx-6 mb-5 p-5 rounded-[16px] border border-white/[.06] flex justify-around"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="text-center">
          <p className="text-brand-light text-[20px] font-bold">{stats.txs}</p>
          <p className="text-white/40 text-[11px] mt-1">交易记录</p>
        </div>
        <div className="text-center">
          <p className="text-brand-light text-[20px] font-bold">{stats.cats}</p>
          <p className="text-white/40 text-[11px] mt-1">分类</p>
        </div>
        <div className="text-center">
          <p className="text-brand-light text-[20px] font-bold">{stats.budgets}</p>
          <p className="text-white/40 text-[11px] mt-1">预算</p>
        </div>
      </div>

      {/* 统计口径 */}
      <div className="px-6 mb-2">
        <p className="text-white/50 text-[12px] tracking-wide">统计口径</p>
      </div>
      <div className="mx-6 mb-5 rounded-[16px] border border-white/[.06] overflow-hidden p-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}>

        <div className="flex p-1 rounded-lg border border-white/[.08] mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {([
            { key: 'natural', label: '自然月' },
            { key: 'salary', label: '薪资月' },
          ] as const).map(o => (
            <button key={o.key} onClick={() => setMode(o.key)}
              className="flex-1 py-2 rounded-md text-[13px]"
              style={
                settings.periodMode === o.key
                  ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 500 }
                  : { color: 'rgba(255,255,255,0.5)' }
              }
            >{o.label}</button>
          ))}
        </div>

        {settings.periodMode === 'salary' && (
          <div className="flex flex-col gap-3 pt-2 border-t border-white/[.05]">
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-[13px]">发薪日</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPayday(settings.payday - 1)}
                  className="w-7 h-7 rounded-md text-white/60"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >−</button>
                <span className="text-white text-[14px] w-10 text-center">{settings.payday}号</span>
                <button
                  onClick={() => setPayday(settings.payday + 1)}
                  className="w-7 h-7 rounded-md text-white/60"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >+</button>
              </div>
            </div>

            <label className="flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-white/70 text-[13px]">遇周末/节假日提前</p>
                <p className="text-white/30 text-[11px] mt-0.5">公司提前发薪日，按实际发薪日切换周期</p>
              </div>
              <div
                onClick={() => setAdjust(!settings.adjustWeekend)}
                className="w-11 h-6 rounded-full relative transition-all"
                style={{ background: settings.adjustWeekend ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                  style={{ left: settings.adjustWeekend ? 22 : 2 }} />
              </div>
            </label>

            <div className="px-3 py-2 rounded-lg border border-brand-from/20 text-[11px] text-brand-light"
              style={{ background: 'rgba(99,102,241,0.05)' }}>
              本月发薪日：<b>{formatDateLabel(dateStrOf(previewPayday))}</b>
              {dateStrOf(previewPayday) !== dateStrOf(new Date(today.getFullYear(), today.getMonth(), settings.payday)) && (
                <span className="text-white/40 ml-1">（已避让）</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="mx-6 rounded-[16px] border border-white/[.06] overflow-hidden mb-5"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <Link to="/categories" className="flex justify-between items-center px-5 py-4 border-b border-white/[.05]">
          <span className="text-white/85 text-[14px]">分类管理</span>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M5 3l4 4-4 4" /></svg>
        </Link>
        <Link to="/budget" className="flex justify-between items-center px-5 py-4">
          <span className="text-white/85 text-[14px]">预算与目标</span>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M5 3l4 4-4 4" /></svg>
        </Link>
      </div>

      <div className="mx-6 rounded-[16px] border border-white/[.06] overflow-hidden mb-5"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <button onClick={handleExport} className="w-full flex justify-between items-center px-5 py-4 border-b border-white/[.05]">
          <span className="text-white/85 text-[14px]">导出备份（JSON）</span>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M3 7l4 4 4-4M7 1v10" /></svg>
        </button>
        <button onClick={() => fileRef.current?.click()} className="w-full flex justify-between items-center px-5 py-4">
          <span className="text-white/85 text-[14px]">从备份恢复</span>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M3 7l4-4 4 4M7 11V1" /></svg>
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
      </div>

      <p className="text-white/30 text-[11px] text-center px-6">
        所有数据存储于本机浏览器（IndexedDB），不会上传到任何服务器
      </p>
    </div>
  )
}
