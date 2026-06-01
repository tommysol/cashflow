import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { store, useStore } from '../store'
import { uid } from '../db'
import type { Category, TxType } from '../types'

const PALETTE = ['#EF4444', '#F87171', '#FBBF24', '#F59E0B', '#34D399', '#10B981', '#60A5FA', '#3B82F6', '#A78BFA', '#8B5CF6', '#EC4899', '#F472B6']

export default function CategoryManager() {
  const nav = useNavigate()
  const { categories } = useStore(s => s)
  const [activeType, setActiveType] = useState<TxType>('expense')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newSubMap, setNewSubMap] = useState<Record<string, string>>({})

  const cats = categories.filter(c => c.type === activeType).sort((a, b) => a.order - b.order)

  // 新增一级分类
  const addCategory = async () => {
    const name = prompt('新分类名称')?.trim()
    if (!name) return
    const maxOrder = Math.max(0, ...cats.map(c => c.order))
    await store.upsertCategory({
      id: uid(),
      type: activeType,
      name,
      color: PALETTE[cats.length % PALETTE.length],
      subcategories: [],
      order: maxOrder + 1,
    })
  }

  // 删除分类
  const deleteCat = async (c: Category) => {
    if (!confirm(`确定删除分类「${c.name}」？关联记录的分类将变为未分类，需手动处理。`)) return
    await store.removeCategory(c.id)
  }

  // 保存分类编辑
  const saveCatEdit = async (c: Category) => {
    await store.upsertCategory({ ...c, name: editName.trim() || c.name, color: editColor || c.color })
    setEditingCat(null)
  }

  // 添加子分类
  const addSub = async (c: Category) => {
    const v = (newSubMap[c.id] || '').trim()
    if (!v) return
    if (c.subcategories.includes(v)) return
    await store.upsertCategory({ ...c, subcategories: [...c.subcategories, v] })
    setNewSubMap({ ...newSubMap, [c.id]: '' })
  }

  const removeSub = async (c: Category, s: string) => {
    await store.upsertCategory({ ...c, subcategories: c.subcategories.filter(x => x !== s) })
  }

  // 排序
  const move = async (c: Category, dir: -1 | 1) => {
    const sorted = cats.slice()
    const idx = sorted.findIndex(x => x.id === c.id)
    const swap = sorted[idx + dir]
    if (!swap) return
    await store.upsertCategory({ ...c, order: swap.order })
    await store.upsertCategory({ ...swap, order: c.order })
  }

  return (
    <div>
      <div className="flex justify-between items-center px-6 pt-12 pb-5">
        <button onClick={() => nav(-1)} className="text-white/60">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-white text-[17px] font-semibold">分类管理</h2>
        <div style={{ width: 24 }} />
      </div>

      {/* Type toggle */}
      <div className="mx-6 mb-6 flex p-1 rounded-[12px] border border-white/[.08]" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {(['expense', 'income'] as TxType[]).map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className="flex-1 py-2.5 rounded-[9px] text-[14px]"
            style={
              activeType === t
                ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontWeight: 600, boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }
                : { color: 'rgba(255,255,255,0.4)', fontWeight: 500 }
            }
          >{t === 'expense' ? '支出分类' : '收入分类'}</button>
        ))}
      </div>

      <div className="px-6 flex flex-col gap-3 mb-6">
        {cats.map(c => {
          const isExpanded = expanded === c.id
          const isEditing = editingCat === c.id
          return (
            <div key={c.id} className="rounded-[16px] border border-white/[.06] overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => !isEditing && setExpanded(isExpanded ? null : c.id)}>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="text-white text-[14px] font-medium bg-white/5 px-2 py-1 rounded"
                    />
                  ) : (
                    <span className="text-white/90 text-[14px] font-medium">{c.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5" onClick={e => e.stopPropagation()}>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveCatEdit(c)} className="text-brand-light text-[12px]">保存</button>
                      <button onClick={() => setEditingCat(null)} className="text-white/40 text-[12px]">取消</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => move(c, -1)} className="text-white/30 px-1">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l4-4 4 4" /></svg>
                      </button>
                      <button onClick={() => move(c, 1)} className="text-white/30 px-1">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l4 4 4-4" /></svg>
                      </button>
                      <button onClick={() => { setEditingCat(c.id); setEditName(c.name); setEditColor(c.color) }} className="text-white/40 text-[12px]">编辑</button>
                      <button onClick={() => deleteCat(c)} className="text-red-400/80 text-[12px]">删除</button>
                    </>
                  )}
                </div>
              </div>

              {/* 颜色选择（编辑时） */}
              {isEditing && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {PALETTE.map(p => (
                    <button key={p} onClick={() => setEditColor(p)}
                      className="w-6 h-6 rounded-full border-2"
                      style={{ background: p, borderColor: editColor === p ? '#fff' : 'transparent' }} />
                  ))}
                </div>
              )}

              {/* Sub categories */}
              <div className="px-4 pb-3.5 flex flex-wrap gap-1.5">
                {c.subcategories.map(s => (
                  <span key={s}
                    className="px-3 py-1 rounded-xl text-[12px] border flex items-center gap-1.5"
                    style={{
                      background: `${c.color}1a`,
                      borderColor: `${c.color}33`,
                      color: lightShade(c.color),
                    }}
                  >
                    {s}
                    <button onClick={() => removeSub(c, s)} className="text-white/40">×</button>
                  </span>
                ))}
                {isExpanded ? (
                  <div className="flex items-center gap-1.5 mt-1 w-full">
                    <input
                      value={newSubMap[c.id] || ''}
                      onChange={e => setNewSubMap({ ...newSubMap, [c.id]: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') addSub(c) }}
                      placeholder="新子分类名"
                      className="flex-1 px-3 py-1.5 rounded-lg text-[12px] text-white placeholder-white/30 border border-white/[.08]"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                    <button onClick={() => addSub(c)}
                      className="px-3 py-1.5 rounded-lg text-[12px] text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>添加</button>
                  </div>
                ) : (
                  <button onClick={() => setExpanded(c.id)}
                    className="px-3 py-1 rounded-xl text-[12px] border border-dashed text-white/40"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)' }}>+ 子分类</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 新增分类 */}
      <div className="px-6 pb-10">
        <button onClick={addCategory}
          className="w-full py-3.5 rounded-[14px] border border-dashed text-brand-light text-[14px] font-medium"
          style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>+ 新增分类</button>
      </div>
    </div>
  )
}

// 根据色值生成更浅的版本（仅用于文字色）
function lightShade(hex: string) {
  return hex // 直接用原色，背景已加透明度，对比足够
}
