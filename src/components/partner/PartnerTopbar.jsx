import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function PartnerTopbar() {
  const location = useLocation()
  const { user, userData } = useAuth()

  // Use Firestore userData fields — not Firebase Auth user object
  const displayName = userData?.organizationName || userData?.contactName || 'Partner'
  const initial = displayName.charAt(0).toUpperCase()

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/partner') return 'Overview'
    if (path === '/partner/campaigns') return 'Campaigns'
    if (path === '/partner/create') return 'Create Campaign'
    if (path === '/partner/beneficiaries') return 'Beneficiaries'
    if (path === '/partner/claims') return 'Claims'
    if (path === '/partner/analytics') return 'Analytics'
    if (path === '/partner/profile') return 'Profile'
    return 'Partner Panel'
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left — Logo + Page Title */}
        <div className="flex items-center gap-4">
          <Link to="/partner" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <span className="text-sm font-bold">H</span>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">HOPE Partner</p>
              <p className="text-xs text-slate-500">Campaign Management</p>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-300">•</span>
            <span className="text-sm font-medium text-slate-700">{getPageTitle()}</span>
          </div>
        </div>

        {/* Right — Notifications + User */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}


          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">Organisation Partner</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initial}</span>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}

export default PartnerTopbar