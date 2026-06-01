import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useRef } from 'react'

export default function TabBar() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const isActive = (p: string) => pathname === p

  // 用户手势保持器：在点击 + 的同一事件中 focus 一个真 input，
  // 然后路由切换后 AddTx 把 focus 转移到自己的 input，键盘保持弹起
  const keepFocusRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { path: '/', label: '首页', icon: <IconHome /> },
    { path: '/list', label: '流水', icon: <IconList /> },
    { path: '/budget', label: '预算', icon: <IconBudget /> },
    { path: '/settings', label: '设置', icon: <IconUser /> },
  ]

  const handleAdd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    // 在用户手势内立即 focus 真实 input（iOS 才肯弹键盘）
    const el = keepFocusRef.current
    if (el) {
      el.focus()
      // 在用户手势事件里同步导航到 /add
      // AddTx 渲染时会把 focus 转移到自己的金额输入框
    }
    nav('/add')
  }

  return (
    <>
      {/* 用户手势保持 input：常驻 DOM、固定且对用户不可感知（只占 1px）
          关键：不能 display:none，也不能 opacity:0，否则 iOS 不肯接受 focus 事件 */}
      <input
        ref={keepFocusRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 1,
          height: 1,
          padding: 0,
          border: 0,
          background: 'transparent',
          color: 'transparent',
          caretColor: 'transparent',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      <div
        className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] flex justify-around items-center px-5 pt-3 pb-7 z-50"
        style={{
          background: 'linear-gradient(180deg, transparent, #0F0F1A 30%)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        }}
      >
        {tabs.slice(0, 2).map(t => (
          <Link to={t.path} key={t.path} className="flex flex-col items-center gap-1 flex-1">
            <span style={{ color: isActive(t.path) ? '#818CF8' : 'rgba(255,255,255,0.4)' }}>{t.icon}</span>
            <span style={{ color: isActive(t.path) ? '#818CF8' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: isActive(t.path) ? 500 : 400 }}>{t.label}</span>
          </Link>
        ))}

        {/* + 按钮：用 button + onMouseDown 在用户手势中 focus 占位 input */}
        <button
          onMouseDown={handleAdd}
          onTouchStart={handleAdd}
          className="flex items-center justify-center"
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            marginTop: -20,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            border: 'none',
            padding: 0,
          }}
        >
          <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
        </button>

        {tabs.slice(2).map(t => (
          <Link to={t.path} key={t.path} className="flex flex-col items-center gap-1 flex-1">
            <span style={{ color: isActive(t.path) ? '#818CF8' : 'rgba(255,255,255,0.4)' }}>{t.icon}</span>
            <span style={{ color: isActive(t.path) ? '#818CF8' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: isActive(t.path) ? 500 : 400 }}>{t.label}</span>
          </Link>
        ))}
      </div>
    </>
  )
}

function IconHome() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="16" height="16" rx="3" /><path d="M3 9h16" /></svg>
  )
}
function IconList() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h16M3 11h16M3 16h10" /></svg>
  )
}
function IconBudget() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M11 8v6M8 11h6" /></svg>
  )
}
function IconUser() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="7" r="4" /><path d="M3 19c0-4 4-7 8-7s8 3 8 7" /></svg>
  )
}
