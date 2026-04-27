import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

// ── color tokens ─────────────────────────────────────────────────────────────
const C = {
  bgPrimary:    '#0A0F1E',
  bgSecondary:  '#111827',
  bgSurface:    '#1E2D42',
  textPrimary:  '#E8EDF5',
  textMuted:    '#6B8CAE',
  accent:       '#4FC3A1',   // used for HOPE branding only
  accentDim:    'rgba(79,195,161,0.10)',
  // admin accent: warm red — visually distinct from partner green
  adminAccent:  '#F26C6C',
  adminDim:     'rgba(242,108,108,0.12)',
  adminBorder:  'rgba(242,108,108,0.35)',
  error:        '#F87171',
  errorDim:     'rgba(248,113,113,0.10)',
  errorBorder:  'rgba(248,113,113,0.30)',
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: C.textMuted, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ color: C.error, fontSize: '0.75rem' }}>{error}</span>}
    </div>
  )
}

function AdminLogin() {
  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [showPassword, setShowPassword]         = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [error, setError]                       = useState('')

  const { login, isLoading, isAuthenticated, hasRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && hasRole('1')) navigate('/admin')
  }, [isAuthenticated, hasRole, navigate])

  useEffect(() => {
    if (error) setError('')
  }, [email, password])

  const validateForm = () => {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    const result = await login({ email, password })
    if (!result.success) setError(result.error || 'Admin login failed')
  }

  // ── loading screen ────────────────────────────────────────────────────────
  if (isLoading && !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px',
            border: `3px solid ${C.bgSurface}`, borderTopColor: C.adminAccent,
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Loading…</p>
        </div>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: C.bgPrimary,
    border: `1px solid ${C.bgSurface}`,
    borderRadius: '8px',
    color: C.textPrimary,
    padding: '11px 14px',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: C.bgPrimary,
      display: 'flex',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* header */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              width: 52, height: 52,
              backgroundColor: C.adminDim,
              border: `1px solid ${C.adminBorder}`,
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={C.adminAccent} strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            {/* restricted badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: C.adminDim, border: `1px solid ${C.adminBorder}`, borderRadius: '999px', padding: '3px 10px', marginBottom: '12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.adminAccent }} />
              <span style={{ color: C.adminAccent, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Restricted Access</span>
            </div>

            <h1 style={{ color: C.textPrimary, fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              Admin Login
            </h1>
            <p style={{ color: C.textMuted, fontSize: '0.9rem' }}>
              Access the HOPE administrative dashboard
            </p>
          </div>

          {/* error banner */}
          {error && (
            <div style={{
              backgroundColor: C.errorDim,
              border: `1px solid ${C.errorBorder}`,
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <svg style={{ flexShrink: 0, marginTop: 2 }} width="16" height="16" fill={C.error} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p style={{ color: C.error, fontSize: '0.8rem', fontWeight: 600 }}>Login Failed</p>
                <p style={{ color: C.error, fontSize: '0.75rem', opacity: 0.8, marginTop: 2 }}>{error}</p>
              </div>
            </div>
          )}

          {/* form card */}
          <div style={{
            backgroundColor: C.bgSecondary,
            border: `1px solid ${C.bgSurface}`,
            borderRadius: '14px',
            padding: '28px',
            marginBottom: '24px',
          }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <Field label="Admin Email" error={validationErrors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@hope-platform.org"
                  style={{
                    ...inputStyle,
                    borderColor: validationErrors.email ? C.errorBorder : C.bgSurface,
                  }}
                  onFocus={e => e.target.style.borderColor = C.adminAccent}
                  onBlur={e => e.target.style.borderColor = validationErrors.email ? C.errorBorder : C.bgSurface}
                />
              </Field>

              <Field label="Admin Password" error={validationErrors.password}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      ...inputStyle,
                      paddingRight: '44px',
                      borderColor: validationErrors.password ? C.errorBorder : C.bgSurface,
                    }}
                    onFocus={e => e.target.style.borderColor = C.adminAccent}
                    onBlur={e => e.target.style.borderColor = validationErrors.password ? C.errorBorder : C.bgSurface}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: C.textMuted }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L2.05 2.05m7.828 7.828L16.95 16.95" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </Field>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? C.bgSurface : C.adminAccent,
                  color: isLoading ? C.textMuted : '#0A0F1E',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'opacity 0.2s',
                  marginTop: '4px',
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.textMuted}`, borderTopColor: C.textPrimary, animation: 'spin 0.8s linear infinite' }} />
                    Signing In…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Admin Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* footer links */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: C.textMuted, fontSize: '0.82rem' }}>
              Looking for partner access?{' '}
              <Link to="/partner/login" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                Partner Login
              </Link>
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Homepage
            </button>
          </div>
        </div>
      </div>

      {/* responsive styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #3a5068; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #111827 inset;
          -webkit-text-fill-color: #E8EDF5;
        }
      `}</style>
    </div>
  )
}

export default AdminLogin