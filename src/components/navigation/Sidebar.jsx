import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Create Campaign', href: '/create-campaign' },
  { label: 'Donate', href: '/donate' },
  { label: 'Claim Aid', href: '/claim-aid' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-16 h-[calc(100vh-4rem)] px-4 py-6">
        <nav aria-label="Primary" className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A]'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
                <span className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? 'bg-[#1E3A8A]' : 'bg-slate-200'
                }`} />
              </Link>
            )
          })}
        </nav>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Network Status
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">0% uptime</p>
          <p className="mt-1 text-xs text-slate-500">Real-time relief monitoring</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
