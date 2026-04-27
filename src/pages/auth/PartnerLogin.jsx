import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

// ── color tokens (matching HOPE brand) ──────────────────────────────────────
const C = {
  bgPrimary:   '#0A0F1E',
  bgSecondary: '#111827',
  bgSurface:   '#1E2D42',
  textPrimary: '#E8EDF5',
  textMuted:   '#6B8CAE',
  accent:      '#4FC3A1',
  accentDim:   'rgba(79,195,161,0.12)',
  accentBorder:'rgba(79,195,161,0.35)',
  error:       '#F87171',
  errorDim:    'rgba(248,113,113,0.10)',
  errorBorder: 'rgba(248,113,113,0.30)',
}

// ── tiny reusable input ──────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: C.textMuted, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ color: C.error, fontSize: '0.75rem' }}>{error}</span>
      )}
    </div>
  )
}

function PartnerLogin() {
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [error, setError]                     = useState('')

  const { login, isLoading, isAuthenticated, hasRole, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (hasRole('2')) navigate('/partner')
    }
  }, [isAuthenticated, hasRole, loading, navigate])

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
    if (!result.success) setError(result.error || 'Partner login failed')
  }

  // ── loading screen ─────────────────────────────────────────────────────────
  if (loading || (isLoading && !isAuthenticated)) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px',
            border: `3px solid ${C.bgSurface}`, borderTopColor: C.accent,
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Loading…</p>
        </div>
      </div>
    )
  }

  // ── shared input style ─────────────────────────────────────────────────────
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
              backgroundColor: C.accentDim,
              border: `1px solid ${C.accentBorder}`,
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 style={{ color: C.textPrimary, fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              Partner Login
            </h1>
            <p style={{ color: C.textMuted, fontSize: '0.9rem' }}>
              Access your HOPE partner dashboard
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

              <Field label="Email" error={validationErrors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@organisation.org"
                  style={{
                    ...inputStyle,
                    borderColor: validationErrors.email ? C.errorBorder : C.bgSurface,
                  }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = validationErrors.email ? C.errorBorder : C.bgSurface}
                />
              </Field>

              <Field label="Password" error={validationErrors.password}>
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
                    onFocus={e => e.target.style.borderColor = C.accent}
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
                  backgroundColor: isLoading ? C.bgSurface : C.accent,
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In as Partner
                  </>
                )}
              </button>
            </form>
          </div>

          {/* footer links */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: C.textMuted, fontSize: '0.82rem' }}>
              No partner account?{' '}
              <Link to="/partner-register" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                Register as Partner
              </Link>
            </p>
            <p style={{ color: C.textMuted, fontSize: '0.82rem' }}>
              Need admin access?{' '}
              <Link to="/admin/login" style={{ color: '#F87171', textDecoration: 'none', fontWeight: 600 }}>
                Admin Login
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

      {/* responsive: show left panel on lg+ */}
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

export default PartnerLogin