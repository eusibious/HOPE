import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function Logout() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    // Execute logout and navigate immediately
    const performLogout = async () => {
      try {
        // Clear authentication state
        logout()
        
        // Clear any residual auth data
        localStorage.removeItem('hopeAuth')
        
        // Force navigate to home page
        setTimeout(() => {
          navigate('/', { replace: true, state: { fromLogout: true } })
        }, 100)
        
      } catch (error) {
        console.error('Logout error:', error)
        // Force redirect even on error
        window.location.href = '/'
      }
    }

    performLogout()
  }, [logout, navigate])

  // Manual navigation handler
  const handleGoHome = () => {
    console.log('Manual navigation clicked')
    try {
      navigate('/')
    } catch (error) {
      console.log('React Router failed, using window.location')
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#059669]/10 mx-auto mb-6">
            <svg className="h-8 w-8 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Logged Out Successfully</h1>
          <p className="text-slate-600 mb-6">You have been securely logged out.</p>
          <p className="text-sm text-slate-500 mb-6">Redirecting to home page...</p>
          
          <button 
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1E4785] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2"
            onClick={handleGoHome}
          >
            Go to Home Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default Logout