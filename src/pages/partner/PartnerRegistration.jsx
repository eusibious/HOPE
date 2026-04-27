import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// ── color tokens ─────────────────────────────────────────────────────────────
const C = {
  bgPrimary:    '#0A0F1E',
  bgSecondary:  '#111827',
  bgSurface:    '#1E2D42',
  textPrimary:  '#E8EDF5',
  textMuted:    '#6B8CAE',
  accent:       '#4FC3A1',
  accentDim:    'rgba(79,195,161,0.12)',
  accentBorder: 'rgba(79,195,161,0.35)',
  error:        '#F87171',
  errorDim:     'rgba(248,113,113,0.10)',
  errorBorder:  'rgba(248,113,113,0.30)',
  successDim:   'rgba(79,195,161,0.10)',
  successBorder:'rgba(79,195,161,0.30)',
}

// ── disposable / fake domain blocklist ───────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.info',
  'tempmail.com','tempmail.net','temp-mail.org','temp-mail.io',
  'throwam.com','throwam.net','trashmail.com','trashmail.me',
  'trashmail.net','trashmail.org','trashmail.at','trashmail.io',
  'yopmail.com','yopmail.fr','sharklasers.com','guerrillamailblock.com',
  'grr.la','spam4.me','dispostable.com','fakeinbox.com',
  'mailnull.com','spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'mailnesia.com','maildrop.cc','discard.email','discardmail.com','discardmail.de',
  'fakemailgenerator.com','filzmail.com','gishpuppy.com',
  'ieatspam.eu','ieatspam.info','inboxclean.com','inboxclean.org',
  'jetable.com','jetable.net','jetable.org','jetable.pp.ua',
  'kasmail.com','killmail.com','killmail.net','maboard.com',
  'mail-temporaire.fr','mailbidon.com','mailbucket.org','mailcat.biz',
  'mailcatch.com','mailexpire.com','mailforspam.com','mailfreeonline.com',
  'mailme.ir','mailme.lv','mailme24.com','mailmetrash.com','mailmoat.com',
  'mailnew.com','mailpick.biz','mailrock.biz','mailscrap.com',
  'mailshell.com','mailsiphon.com','mailtemp.info','mailtome.de',
  'mailtothis.com','mailtrash.net','mailzilla.com','mailzilla.org',
  'mbx.cc','meltmail.com','mintemail.com','mytempemail.com',
  'nevermail.de','no-spam.ws','nobulk.com','noclickemail.com',
  'nomail.pw','nomail2me.com','nomorespamemails.com','nonspam.eu',
  'nospam.ze.tc','nospamfor.us','nospamthanks.info','notmailinator.com',
  'nowmymail.com','objectmail.com','obobbo.com','oneoffmail.com',
  'onewaymail.com','owlpic.com','pancakemail.com','pookmail.com',
  'proxymail.eu','quickinbox.com','rejectmail.com','safe-mail.net',
  'sendspamhere.com','shiftmail.com','shortmail.net','skeefmail.com',
  'snakemail.com','sneakemail.com','sofimail.com','spam.la',
  'spamavert.com','spambob.com','spambob.net','spambob.org',
  'spambotsonly.com','spamcon.org','spamcowboy.com','spamcowboy.net',
  'spamcowboy.org','spamday.com','spamex.com','spamgoes.in',
  'spamherelots.com','spamhereplease.com','spamhole.com','spamify.com',
  'spaminator.de','spaml.com','spaml.de','spammotel.com',
  'spamoff.de','spamthisplease.com','spamtrail.com',
  'super-auswahl.de','supergreatmail.com','supermailer.jp',
  'tafmail.com','teewars.org','teleworm.com','teleworm.us',
  'tempalias.com','tempe-mail.com','tempemail.biz','tempemail.com',
  'tempemail.net','tempinbox.co.uk','tempinbox.com',
  'temporaryemail.net','temporaryemail.us','temporaryforwarding.com',
  'temporaryinbox.com','tempsky.com','tempthe.net',
  'thisisnotmyrealemail.com','tilien.com','tittbit.in',
  'tmailinator.com','toiea.com','trash-amil.com','trash-mail.at',
  'trash-mail.com','trash-mail.de','trash-mail.ga','trash-mail.io',
  'trashdevil.com','trashdevil.de','trashemail.de','trashmail2.com',
  'trashmailer.com','trashme.de','ultra.fyi',
  'venompen.com','vomoto.com','wh4f.org','whyspam.me',
  'willselfdestruct.com','wegwerfmail.de','wegwerfmail.net','wegwerfmail.org',
  'xagloo.com','xemaps.com','xents.com','xmaily.com','xoxy.net',
  'z1p.biz','zehnminuten.de','zehnminutenmail.de','zippymail.info',
  'zoemail.net','zoemail.org','zomg.info',
])

const isDisposableDomain = (email) => {
  const domain = (email || '').trim().toLowerCase().split('@')[1] || ''
  return DISPOSABLE_DOMAINS.has(domain)
}

const COUNTRY_CODES = [
  { code: '+91',  label: 'India',         flag: '🇮🇳' },
  { code: '+1',   label: 'United States', flag: '🇺🇸' },
  { code: '+44',  label: 'United Kingdom',flag: '🇬🇧' },
  { code: '+61',  label: 'Australia',     flag: '🇦🇺' },
  { code: '+81',  label: 'Japan',         flag: '🇯🇵' },
  { code: '+971', label: 'UAE',           flag: '🇦🇪' },
  { code: '+49',  label: 'Germany',       flag: '🇩🇪' },
  { code: '+33',  label: 'France',        flag: '🇫🇷' },
  { code: '+39',  label: 'Italy',         flag: '🇮🇹' },
  { code: '+34',  label: 'Spain',         flag: '🇪🇸' },
  { code: '+7',   label: 'Russia',        flag: '🇷🇺' },
  { code: '+86',  label: 'China',         flag: '🇨🇳' },
  { code: '+82',  label: 'South Korea',   flag: '🇰🇷' },
  { code: '+65',  label: 'Singapore',     flag: '🇸🇬' },
  { code: '+966', label: 'Saudi Arabia',  flag: '🇸🇦' },
  { code: '+92',  label: 'Pakistan',      flag: '🇵🇰' },
  { code: '+880', label: 'Bangladesh',    flag: '🇧🇩' },
  { code: '+94',  label: 'Sri Lanka',     flag: '🇱🇰' },
  { code: '+977', label: 'Nepal',         flag: '🇳🇵' },
  { code: '+234', label: 'Nigeria',       flag: '🇳🇬' },
]

const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6 || digits.length > 12) return false
  if (/^(\d)\1+$/.test(digits)) return false
  return true
}

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const value = email.trim().toLowerCase()
  if (value.length > 254) return false
  if (value.includes(' ')) return false
  if (!value.includes('@')) return false
  const parts = value.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (!local || !domain) return false
  if (local.length > 64) return false
  if (local.includes('..') || domain.includes('..')) return false
  if (local.startsWith('.') || local.endsWith('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (!domain.includes('.')) return false
  const domainParts = domain.split('.')
  if (domainParts.some((part) => !part)) return false
  const tld = domainParts[domainParts.length - 1]
  if (!/^[a-z]{2,}$/i.test(tld)) return false
  if (!/^[a-z0-9._%+-]+$/i.test(local)) return false
  if (!/^[a-z0-9.-]+$/i.test(domain)) return false
  return true
}

const initialFormData = {
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
  countryCode: '+91',
  description: '',
  agree: false,
}

// ── shared input style ────────────────────────────────────────────────────────
const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: C.bgPrimary,
  color: C.textPrimary,
  borderRadius: '8px',
  padding: '11px 14px',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, success, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: C.textMuted, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
        {required && <span style={{ color: C.error, marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error
        ? <span style={{ color: C.error, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" fill={C.error} viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            {error}
          </span>
        : success
          ? <span style={{ color: C.accent, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" fill={C.accent} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </span>
          : hint
            ? <span style={{ color: C.textMuted, fontSize: '0.75rem', lineHeight: 1.5 }}>{hint}</span>
            : null
      }
    </div>
  )
}

const PartnerRegistration = () => {
  const { submitPartnerApplication, isLoading } = useAuth()

  const [formData, setFormData]         = useState(initialFormData)
  const [error, setError]               = useState('')
  const [fieldErrors, setFieldErrors]   = useState({})
  const [fieldSuccess, setFieldSuccess] = useState({})  // per-field green feedback
  const [success, setSuccess]           = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const validateEmailDomain = async (email) => {
    if (!backendUrl) throw new Error('VITE_BACKEND_URL is not set')
    const response = await fetch(`${backendUrl}/api/validate-email-domain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: 'Unexpected server response.' }
    if (!response.ok) return { valid: false, message: data.message || 'Email domain validation failed.' }
    return data
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const nextValue = type === 'checkbox' ? checked : name === 'phone' ? value.replace(/\D/g, '') : value
    setFormData((prev) => ({ ...prev, [name]: nextValue }))
    // clear errors/success when user edits a field
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setFieldSuccess((prev) => ({ ...prev, [name]: '' }))
    setError('')
  }

  // ── on-blur email check ───────────────────────────────────────────────────
  const handleEmailBlur = () => {
    const email = formData.email.trim()

    // empty — let required validation handle it
    if (!email) return

    // format check first
    if (!isValidEmail(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Enter a valid email address, e.g. name@company.org' }))
      setFieldSuccess((prev) => ({ ...prev, email: '' }))
      return
    }

    // disposable domain check
    if (isDisposableDomain(email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: 'Disposable or temporary email addresses are not accepted. Please use your organisation email.',
      }))
      setFieldSuccess((prev) => ({ ...prev, email: '' }))
      return
    }

    // passed all client-side checks — show positive feedback
    setFieldErrors((prev) => ({ ...prev, email: '' }))
    setFieldSuccess((prev) => ({ ...prev, email: 'Email looks good' }))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.organizationName.trim()) errors.organizationName = 'Organization name is required'
    if (!formData.contactName.trim())      errors.contactName      = 'Contact name is required'

    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Enter a valid email address, e.g. name@company.org'
    } else if (isDisposableDomain(formData.email)) {
      // guard: catches disposable even if blur was skipped
      errors.email = 'Disposable or temporary email addresses are not accepted.'
    }

    if (!formData.phone.trim())             errors.phone       = 'Phone number is required'
    else if (!isValidPhone(formData.phone)) errors.phone       = 'Enter a valid phone number'
    if (!formData.description.trim())       errors.description = 'Organization description is required'
    if (!formData.agree)                    errors.agree       = 'Please agree to the terms and conditions'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!validateForm()) return
    try {
      const normalizedEmail = formData.email.trim().toLowerCase()
      const emailCheck = await validateEmailDomain(normalizedEmail)
      if (!emailCheck.valid) {
        setFieldErrors((prev) => ({ ...prev, email: emailCheck.message || 'Email domain is invalid or cannot receive mail.' }))
        return
      }
      const payload = {
        ...formData,
        email: normalizedEmail,
        organizationName: formData.organizationName.trim(),
        contactName: formData.contactName.trim(),
        phone: `${formData.countryCode}${formData.phone.replace(/\D/g, '')}`,
        description: formData.description.trim(),
      }
      const result = await submitPartnerApplication(payload)
      if (result.success) {
        setSuccess(true)
        setFormData(initialFormData)
        setFieldErrors({})
        setFieldSuccess({})
      } else {
        setError(result.error || 'Application submission failed')
      }
    } catch (err) {
      console.error('Partner registration failed:', err)
      setError('Unable to validate email domain right now. Please try again.')
    }
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  const border = (fieldName) => ({
    border: `1px solid ${fieldErrors[fieldName] ? C.errorBorder : fieldSuccess[fieldName] ? C.accentBorder : C.bgSurface}`,
  })
  const focusAccent = (e) => { e.target.style.borderColor = C.accent }
  const blurReset = (fieldName) => (e) => {
    e.target.style.borderColor = fieldErrors[fieldName]
      ? C.errorBorder
      : fieldSuccess[fieldName]
        ? C.accentBorder
        : C.bgSurface
  }

  // submit is blocked if any field has an error OR email has a known disposable domain
  const hasBlockingError = Object.values(fieldErrors).some(Boolean)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>

        {/* ── header ── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ width: 52, height: 52, backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 style={{ color: C.textPrimary, fontSize: '1.7rem', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Partner Registration
          </h1>
          <p style={{ color: C.textMuted, fontSize: '0.9rem' }}>
            Join the HOPE network — create campaigns, register beneficiaries, and distribute aid on-chain.
          </p>
        </div>

        {/* ── success banner ── */}
        {success && (
          <div style={{ backgroundColor: C.successDim, border: `1px solid ${C.successBorder}`, borderRadius: '10px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <svg width="18" height="18" fill={C.accent} viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: 1 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p style={{ color: C.accent, fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>Application Submitted</p>
              <p style={{ color: C.textMuted, fontSize: '0.82rem', lineHeight: 1.6 }}>
                Your application is under review. We'll contact you via email once the admin team processes it.
              </p>
            </div>
          </div>
        )}

        {/* ── error banner ── */}
        {error && (
          <div style={{ backgroundColor: C.errorDim, border: `1px solid ${C.errorBorder}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <svg width="16" height="16" fill={C.error} viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: 2 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p style={{ color: C.error, fontSize: '0.82rem' }}>{error}</p>
          </div>
        )}

        {/* ── form card ── */}
        <div style={{ backgroundColor: C.bgSecondary, border: `1px solid ${C.bgSurface}`, borderRadius: '14px', padding: '28px', marginBottom: '24px' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Organization Name */}
            <Field label="Organization Name" required error={fieldErrors.organizationName}>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="e.g. Relief India Trust"
                style={{ ...inputBase, ...border('organizationName') }}
                onFocus={focusAccent}
                onBlur={blurReset('organizationName')}
              />
            </Field>

            {/* Contact Name + Email — 2 col on md+ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <Field label="Contact Name" required error={fieldErrors.contactName}>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Full name"
                  style={{ ...inputBase, ...border('contactName') }}
                  onFocus={focusAccent}
                  onBlur={blurReset('contactName')}
                />
              </Field>

              <Field
                label="Email Address"
                required
                error={fieldErrors.email}
                success={fieldSuccess.email}
                hint={!fieldErrors.email && !fieldSuccess.email ? 'Used for onboarding and password reset.' : undefined}
              >
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@organisation.org"
                  autoComplete="email"
                  style={{ ...inputBase, ...border('email') }}
                  onFocus={focusAccent}
                  onBlur={(e) => {
                    blurReset('email')(e)
                    handleEmailBlur()
                  }}
                />
              </Field>
            </div>

            {/* Phone */}
            <Field
              label="Phone Number"
              required
              error={fieldErrors.phone}
              hint="Enter the number without the country prefix."
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  style={{ ...inputBase, width: '140px', flex: '0 0 140px', border: `1px solid ${C.bgSurface}`, cursor: 'pointer' }}
                  onFocus={focusAccent}
                  onBlur={(e) => { e.target.style.borderColor = C.bgSurface }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} style={{ backgroundColor: C.bgSecondary }}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  style={{ ...inputBase, flex: 1, ...border('phone') }}
                  onFocus={focusAccent}
                  onBlur={blurReset('phone')}
                />
              </div>
            </Field>

            {/* Description */}
            <Field label="Organization Description" required error={fieldErrors.description}>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your organization, mission, and the types of campaigns you plan to create..."
                style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6, ...border('description') }}
                onFocus={focusAccent}
                onBlur={blurReset('description')}
              />
            </Field>

            {/* Terms checkbox */}
            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    name="agree"
                    checked={formData.agree}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: C.accent, cursor: 'pointer' }}
                  />
                </div>
                <span style={{ color: C.textMuted, fontSize: '0.85rem', lineHeight: 1.6 }}>
                  I agree to the{' '}
                  <Link to="/terms" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>.
                  {' '}I understand my application will be reviewed and approved before I can create campaigns.
                </span>
              </label>
              {fieldErrors.agree && (
                <p style={{ color: C.error, fontSize: '0.75rem', marginTop: '6px', marginLeft: '30px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" fill={C.error} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.agree}
                </p>
              )}
            </div>

            {/* Submit — disabled when loading OR any field error is active */}
            <button
              type="submit"
              disabled={isLoading || hasBlockingError}
              style={{
                backgroundColor: isLoading || hasBlockingError ? C.bgSurface : C.accent,
                color: isLoading || hasBlockingError ? C.textMuted : C.bgPrimary,
                border: 'none',
                borderRadius: '8px',
                padding: '13px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isLoading || hasBlockingError ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                transition: 'background-color 0.2s, color 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.textMuted}`, borderTopColor: C.textPrimary, animation: 'spin 0.8s linear infinite' }} />
                  Submitting Application…
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Partner Application
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── footer links ── */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ color: C.textMuted, fontSize: '0.82rem' }}>
            Already have an account?{' '}
            <Link to="/partner/login" target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
              Sign in here
            </Link>
          </p>
          <p style={{ color: C.textMuted, fontSize: '0.82rem' }}>
            <Link to="/" style={{ color: C.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #3a5068; }
        input:-webkit-autofill, textarea:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #111827 inset;
          -webkit-text-fill-color: #E8EDF5;
        }
        select option { background-color: #111827; color: #E8EDF5; }
      `}</style>
    </div>
  )
}

export default PartnerRegistration