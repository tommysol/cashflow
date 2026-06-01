import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { exportAll } from '../db'
import { store, useStore } from '../store'

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const stats = useStore(s => ({
    cats: s.categories.length,
    txs: s.transactions.length,
    budgets: s.budgets.length,
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

  return (
    <div>
      <div className="px-6 pt-12 pb-6">
        <h2 className="text-white text-[20px] font-bold">设置</h2>
        <p className="text-white/40 text-[12px] mt-1">CashFlow · 个人消费管理</p>
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

      {/* Menu */}
      <div className="mx-6 rounded-[16px] border border-white/[.06] overflow-hidden mb-5"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <Link to="/categories" className="flex justify-between items-center px-5 py-4 border-b border-white/[.05]">
          <span className="text-white/85 text-[14px]">分类管理</span>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M5 3l4 4-4 4" /></svg>
        </Link>
        <Link to="/budget" className="flex justify-between items-center px-5 py-4">
          <span className="text-white/85 text-[14px]">预算设置</span>
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
