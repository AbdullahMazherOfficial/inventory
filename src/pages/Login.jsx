import { useState } from 'react'
import { Gem, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [role, setRole] = useState('factory_admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === 'admin' && (role === 'factory_admin' || role === 'supply_admin')) {
      onLogin(role)
    } else {
      setError('Invalid credentials. Use password: admin with a valid demo role.')
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-charcoal lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-indigo-accent/40 to-emerald-accent/30" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-accent to-emerald-light">
            <Gem className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Ramsha Inventory</h1>
            <p className="text-xs tracking-widest text-white/50 uppercase">Premium Management</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl leading-tight font-light text-white">
            Crafted for
            <span className="mt-1 block font-semibold text-gold-light">Excellence</span>
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-white/60">
            A sophisticated inventory management platform designed for premium Pakistani
            fashion — track volumes, supplies, and sales with precision.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/30">
          Inspired by the elegance of ramsha.pk
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-cream px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-accent to-emerald-light">
                <Gem className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-lg font-semibold text-charcoal">Ramsha Inventory</h1>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-charcoal/5">
            <h2 className="text-2xl font-semibold text-charcoal">Welcome back</h2>
            <p className="mt-1 text-sm text-muted">Sign in to your factory dashboard</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-charcoal uppercase">
                  Role
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-cream py-3 pr-4 pl-10 text-sm text-charcoal transition-colors focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
                  >
                    <option value="factory_admin">Factory Admin</option>
                    <option value="supply_admin">Purchase Incharge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium tracking-wide text-charcoal uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-border bg-cream py-3 pr-12 pl-10 text-sm text-charcoal placeholder:text-muted/50 transition-colors focus:border-emerald-accent focus:ring-2 focus:ring-emerald-accent/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-charcoal"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-accent to-emerald-light py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-accent/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-accent/30 active:scale-[0.98]"
              >
                Sign In
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted">
              Demo credentials: <span className="font-medium text-charcoal">factory_admin</span> or{' '}
              <span className="font-medium text-charcoal">supply_admin</span> /{' '}
              <span className="font-medium text-charcoal">admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
