import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function AdminRoute({ children }) {
  const { isAuthenticated, hasRole, loading } = useAuth()
  const location = useLocation()

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

  if (!isAuthenticated || !hasRole('1')) {
    // Redirect to login with the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default AdminRoute