import { Link, useLocation } from 'react-router-dom'

const adminNavItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Partner Requests', href: '/admin/partners' },
  { label: 'Campaign Monitor', href: '/admin/campaigns' },
  { label: 'Logout', href: '/logout' },
]

function AdminSidebar() {
  const location = useLocation()

  return (
    <aside className="fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 hidden lg:block z-30">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <span className="text-sm font-bold">H</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Admin Panel</p>
              <p className="text-xs text-slate-500">Management Console</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Admin Navigation" className="flex-1 px-4 py-6 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/admin' && location.pathname.startsWith('/admin') && location.pathname === '/admin')
            const isLogout = item.label === 'Logout'
            
            return (
              <Link
                key={item.label}
                to={item.href}
                className={
                  `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isLogout
                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <span>{item.label}</span>
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  isLogout 
                    ? 'bg-red-400'
                    : isActive ? 'bg-blue-600' : 'bg-slate-300'
                }`} />
              </Link>
            )
          })}
        </nav>

        
      </div>
    </aside>
  )
}

export default AdminSidebar