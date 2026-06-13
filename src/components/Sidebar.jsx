import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  LogOut,
  Gem,
} from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import { ROLE_LABELS } from '../utils/inventoryHelpers'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: 'Stock Management', icon: Package },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { id: 'reports', label: 'Reports', icon: FileText },
]

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  const { role } = useInventory()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-charcoal text-white shadow-2xl">
      <div className="border-b border-white/10 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-accent to-emerald-light shadow-lg">
            <Gem className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white">
              Ramsha Inventory
            </h1>
            <p className="text-[11px] font-light tracking-widest text-white/50 uppercase">
              Management System
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
          Signed in as
        </p>
        <p className="mt-1 text-sm font-medium text-white">{ROLE_LABELS[role]}</p>
        <span className="mt-2 inline-flex items-center rounded-full bg-emerald-accent/30 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-light uppercase">
          {role}
        </span>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-accent to-emerald-light text-white shadow-lg shadow-emerald-accent/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}
                strokeWidth={1.5}
              />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/50 transition-all duration-200 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
