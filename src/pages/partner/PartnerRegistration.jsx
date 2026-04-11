import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const COUNTRY_CODES = [
  { code: '+91', label: 'India', flag: '🇮🇳' },
  { code: '+1', label: 'United States', flag: '🇺🇸' },
  { code: '+44', label: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: '+81', label: 'Japan', flag: '🇯🇵' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
  { code: '+49', label: 'Germany', flag: '🇩🇪' },
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

  const localRegex = /^[a-z0-9._%+-]+$/i
  const domainRegex = /^[a-z0-9.-]+$/i

  if (!localRegex.test(local)) return false
  if (!domainRegex.test(domain)) return false

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

const PartnerRegistration = () => {
  const { submitPartnerApplication, isLoading } = useAuth()

  const [formData, setFormData] = useState(initialFormData)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const validateEmailDomain = async (email) => {
    if (!backendUrl) {
      throw new Error('VITE_BACKEND_URL is not set')
    }

    const response = await fetch(`${backendUrl}/api/validate-email-domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        valid: false,
        message: data.message || 'Email domain validation failed.',
      }
    }

    return data
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setFieldErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    setError('')
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required'
    }

    if (!formData.contactName.trim()) {
      errors.contactName = 'Contact name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Enter a valid email with a proper domain, for example name@company.org'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = 'Enter a valid phone number'
    }

    if (!formData.description.trim()) {
      errors.description = 'Organization description is required'
    }

    if (!formData.agree) {
      errors.agree = 'Please agree to the terms and conditions'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const isValid = validateForm()
    if (!isValid) return

    try {
      const normalizedEmail = formData.email.trim().toLowerCase()

      const emailCheck = await validateEmailDomain(normalizedEmail)

      if (!emailCheck.valid) {
        setFieldErrors((prev) => ({
          ...prev,
          email: emailCheck.message || 'Email domain is invalid or cannot receive mail.',
        }))
        return
      }

      const normalizedPhone = formData.phone.replace(/\D/g, '')

      const payload = {
        ...formData,
        email: normalizedEmail,
        organizationName: formData.organizationName.trim(),
        contactName: formData.contactName.trim(),
        phone: `${formData.countryCode}${normalizedPhone}`,
        description: formData.description.trim(),
      }

      const result = await submitPartnerApplication(payload)

      if (result.success) {
        setSuccess(true)
        setFormData(initialFormData)
        setFieldErrors({})
      } else {
        setError(result.error || 'Application submission failed')
      }
    } catch (err) {
      console.error('Partner registration failed:', err)
      setError('Unable to validate email domain right now. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Partner Registration</h1>
          <p className="text-gray-600">
            Join our network of partners to create campaigns and make a difference
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Application Submitted Successfully</p>
                <p className="mt-1 text-sm text-green-700">
                  Your partner application has been submitted for review. We will contact you via email once it has been processed by the admin team.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.organizationName ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.organizationName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.organizationName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.contactName ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {fieldErrors.contactName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.contactName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.email ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="name@organization.org"
              />
              {fieldErrors.email ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Use a real email address you can access. This will be used for onboarding and password reset.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number<span className="text-red-500">*</span>
            </label>

            <div className="flex gap-2">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-36 px-3 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                inputMode="numeric"
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.phone ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
            </div>

            {fieldErrors.phone ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Select the country code and enter the phone number without the country prefix.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Description<span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.description ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="Describe your organization, mission, and what type of campaigns you plan to create..."
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
              className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">
              I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. I understand that my
              partner application will be reviewed and approved before I can create campaigns.
            </label>
          </div>

          {fieldErrors.agree && (
            <p className="text-sm text-red-600">{fieldErrors.agree}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting Application...
              </span>
            ) : 'Submit Partner Application'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Go back to{' '}
            <Link to="/" className="text-blue-600 hover:underline">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PartnerRegistration