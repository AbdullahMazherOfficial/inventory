import { Search, Filter } from 'lucide-react'
import { useState } from 'react'

const STATUS_STYLES = {
  completed: 'bg-emerald-accent/10 text-emerald-accent',
  pending: 'bg-amber-50 text-amber-600',
  processing: 'bg-indigo-accent/10 text-indigo-accent',
}

export default function SalesTracker({ sales }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      !search ||
      sale.orderId.toLowerCase().includes(search.toLowerCase()) ||
      sale.customer.toLowerCase().includes(search.toLowerCase()) ||
      sale.design.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = sales.reduce((s, sale) => s + sale.amount, 0)
  const completedCount = sales.filter((s) => s.status === 'completed').length
  const pendingCount = sales.filter((s) => s.status === 'pending').length

  return (
    <div className="space-y-6 p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Total Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-charcoal">
            ${totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Completed Orders</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-accent">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Pending Orders</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600">{pendingCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers, designs..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pr-4 pl-10 text-sm focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-border bg-surface py-2.5 pr-8 pl-10 text-sm focus:border-emerald-accent focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Design
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Volume
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Qty
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold tracking-wider text-muted uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-cream/30"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-charcoal">{sale.orderId}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal">{sale.customer}</td>
                  <td className="px-6 py-4 text-sm text-charcoal">{sale.design}</td>
                  <td className="px-6 py-4 text-sm text-muted">{sale.volume}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-charcoal">
                    {sale.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-charcoal">
                    ${sale.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[sale.status]}`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-muted">{sale.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted">
            No sales match your search criteria.
          </div>
        )}
      </div>
    </div>
  )
}
