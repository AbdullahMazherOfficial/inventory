import { Bell, Search, Calendar } from 'lucide-react'

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard Overview', subtitle: 'Real-time inventory insights at a glance' },
  stock: { title: 'Stock Management', subtitle: 'Manage volumes, designs, colors & fabric types' },
  purchases: { title: 'Purchases & Supplies', subtitle: 'Track raw materials and supply chain costs' },
  sales: { title: 'Sales Tracker', subtitle: 'Monitor orders and revenue performance' },
}

export default function Header({ activePage }) {
  const { title, subtitle } = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 px-8 py-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-charcoal">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-cream px-4 py-2 text-sm text-muted md:flex">
            <Calendar className="h-4 w-4 text-emerald-accent" strokeWidth={1.5} />
            {today}
          </div>

          <div className="relative hidden lg:block">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Quick search..."
              className="w-56 rounded-xl border border-border bg-cream py-2 pr-4 pl-10 text-sm text-charcoal placeholder:text-muted/60 transition-colors focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
            />
          </div>

          <button
            type="button"
            className="relative rounded-xl border border-border bg-cream p-2.5 text-muted transition-colors hover:border-emerald-accent/30 hover:text-emerald-accent"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-white">
              3
            </span>
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-cream px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-accent to-charcoal text-xs font-semibold text-white">
              FA
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-charcoal">Factory Admin</p>
              <p className="text-[11px] text-muted">Ramsha Factory</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
