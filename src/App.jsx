import { useState } from 'react'
import { InventoryProvider } from './context/InventoryContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import DashboardOverview from './pages/DashboardOverview'
import StockManagement from './pages/StockManagement'
import PurchasesSupplies from './pages/PurchasesSupplies'
import Reports from './pages/Reports'
import ProcessDyeing from './pages/ProcessDyeing'
import Production from './pages/Production'

function AuthenticatedApp({ onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardOverview />
      case 'stock':
        return <StockManagement />
      case 'purchases':
        return <PurchasesSupplies />
      case 'reports':
        return <Reports />
      case 'process-dyeing':
        return <ProcessDyeing />
      case 'production':
        return <Production />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={onLogout} />
      <div className="ml-64 min-h-screen">
        <Header activePage={activePage} />
        <main className="min-h-[calc(100vh-80px)]">{renderPage()}</main>
      </div>
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginRole, setLoginRole] = useState('factory_admin')

  const handleLogin = (role) => {
    setLoginRole(role)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <InventoryProvider initialRole={loginRole}>
      <AuthenticatedApp onLogout={handleLogout} />
    </InventoryProvider>
  )
}
