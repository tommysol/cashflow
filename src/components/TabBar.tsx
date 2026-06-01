import { Link, useLocation } from 'react-router-dom'

export default function TabBar() {
  const { pathname } = useLocation()
  const isActive = (p: string) => pathname === p

  const tabs = [
    { path: '/', label: '首页', icon: <IconHome /> },
    { path: '/list', label: '流水', icon: <IconList /> },
    { path: '/budget', label: '预算', icon: <IconBudget /> },
    { path: '/settings', label: '设置', icon: <IconUser /> },
  ]

  return (
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

      <Link
        to="/add"
        className="flex items-center justify-center"
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          marginTop: -20,
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
        }}
      >
        <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
      </Link>

      {tabs.slice(2).map(t => (
        <Link to={t.path} key={t.path} className="flex flex-col items-center gap-1 flex-1">
          <span style={{ color: isActive(t.path) ? '#818CF8' : 'rgba(255,255,255,0.4)' }}>{t.icon}</span>
          <span style={{ color: isActive(t.path) ? '#818CF8' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: isActive(t.path) ? 500 : 400 }}>{t.label}</span>
        </Link>
      ))}
    </div>
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
