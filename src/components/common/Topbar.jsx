import { Link, useLocation } from 'react-router-dom'

function Topbar({ user = { name: 'Admin User', role: 'System Administrator' } }) {
  const location = useLocation()

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/admin') return 'Dashboard Overview'
    if (path === '/admin/partners') return 'Partner Requests'
    if (path === '/admin/campaigns') return 'Campaign Monitor'
    if (path.startsWith('/admin/campaigns/')) return 'Campaign Details'
    return 'Admin Panel'
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Page Title Section */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <span className="text-sm font-bold">H</span>
            </div>
            <span className="text-lg font-semibold text-slate-900">HOPE Admin</span>
          </div>
          
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-slate-900">{getPageTitle()}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage campaigns, partners, and platform operations</p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-slate-100">
              <span className="text-sm font-semibold text-white">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar