import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { bootstrap } from './store'
import TabBar from './components/TabBar'
import Home from './pages/Home'
import AddTx from './pages/AddTx'
import TxList from './pages/TxList'
import BudgetPage from './pages/Budget'
import Settings from './pages/Settings'
import CategoryManager from './pages/CategoryManager'

export default function App() {
  useEffect(() => { bootstrap() }, [])
  const { pathname } = useLocation()
  // 记账页和分类管理页不显示底部 tab（更聚焦）
  const hideTab = pathname === '/add' || pathname === '/categories'

  return (
    <div className="min-h-screen w-full bg-gradient-bg" style={{ background: 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 100%)' }}>
      <div className="max-w-[480px] mx-auto min-h-screen relative" style={{ paddingBottom: hideTab ? 0 : 100 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddTx />} />
          <Route path="/list" element={<TxList />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/categories" element={<CategoryManager />} />
        </Routes>
      </div>
      {!hideTab && <TabBar />}
    </div>
  )
}
