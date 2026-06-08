import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import DashboardOverview from './pages/DashboardOverview'
import StockManagement from './pages/StockManagement'
import PurchasesSupplies from './pages/PurchasesSupplies'
import SalesTracker from './pages/SalesTracker'
import { INITIAL_VOLUMES, INITIAL_SUPPLIES, INITIAL_SALES } from './data/initialData'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [volumes, setVolumes] = useState(INITIAL_VOLUMES)
  const [supplies, setSupplies] = useState(INITIAL_SUPPLIES)
  const [sales] = useState(INITIAL_SALES)

  const handleLogin = () => {
    setIsAuthenticated(true)
    setActivePage('dashboard')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setActivePage('dashboard')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardOverview volumes={volumes} supplies={supplies} sales={sales} />
        )
      case 'stock':
        return <StockManagement volumes={volumes} setVolumes={setVolumes} />
      case 'purchases':
        return (
          <PurchasesSupplies
            supplies={supplies}
            setSupplies={setSupplies}
            volumes={volumes}
          />
        )
      case 'sales':
        return <SalesTracker sales={sales} />
      default:
        return (
          <DashboardOverview volumes={volumes} supplies={supplies} sales={sales} />
        )
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
      />
      <div className="ml-64 min-h-screen">
        <Header activePage={activePage} />
        <main className="min-h-[calc(100vh-80px)]">{renderPage()}</main>
      </div>
    </div>
  )
}
