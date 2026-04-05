import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const PartnerRoute = ({ children }) => {
  const { isAuthenticated, hasRole, loading } = useAuth()

  // Wait for auth state and userData to fully load before checking role.
  // Without this, role is null during the Firestore fetch and the route
  // immediately redirects before the partner's role is confirmed.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto"></div>
          <p className="mt-4 text-base text-slate-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !hasRole('2')) {
    return <Navigate to="/partner/login" replace />
  }

  return children
}

export default PartnerRoute