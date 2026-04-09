import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTimestamp = (value) => {
  if (!value) return '—'
  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }
  if (typeof value === 'string') return value
  return '—'
}

const isValidEthAddress = (addr) =>
  /^0x[a-fA-F0-9]{40}$/.test(addr)

const getReadableWalletError = (error) => {
  if (error?.code === 4001) return 'Wallet connection request was rejected.'
  if (error?.message) return error.message
  return 'Unable to connect wallet. Please try again.'
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-4 border-b border-slate-100 last:border-0">
    <p className="text-sm font-medium text-slate-500 sm:w-48 flex-shrink-0">{label}</p>
    <p className={`text-sm text-slate-900 flex-1 ${mono ? 'font-mono break-all' : ''}`}>
      {value || <span className="text-slate-400 italic">Not provided</span>}
    </p>
  </div>
)

// ─── Section Card ─────────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="px-6 py-2">{children}</div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const PartnerProfile = () => {
  const { user, userData } = useAuth()

  const orgName     = userData?.organizationName || '—'
  const contactName = userData?.contactName      || '—'
  const email       = userData?.email            || user?.email || '—'
  const phone       = userData?.phone            || '—'
  const description = userData?.description      || '—'
  const status      = userData?.status           || 'pending'
  const createdAt   = userData?.createdAt        || null
  const partnerUid  = user?.uid                  || '—'

  // Wallet address state
  const [walletAddress, setWalletAddress]   = useState(userData?.walletAddress || '')
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletError, setWalletError]       = useState('')
  const [walletSaving, setWalletSaving]     = useState(false)
  const [walletSaved, setWalletSaved]       = useState(false)

  useEffect(() => {
    setWalletAddress(userData?.walletAddress || '')
  }, [userData?.walletAddress])

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!window.ethereum?.request) return

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        setWalletConnected(accounts.length > 0)
      } catch (error) {
        console.error('Failed to check wallet connection:', error)
      }
    }

    checkExistingConnection()
  }, [])

  const handleWalletConnect = async () => {
    if (!user?.uid) return

    if (typeof window.ethereum === 'undefined') {
      setWalletError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setWalletError('')
    setWalletSaving(true)
    setWalletSaved(false)

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const connectedAddress = accounts?.[0] || ''

      if (!connectedAddress || !isValidEthAddress(connectedAddress)) {
        throw new Error('No valid wallet address returned from MetaMask.')
      }

      await updateDoc(doc(db, 'users', user.uid), {
        walletAddress: connectedAddress
      })

      setWalletAddress(connectedAddress)
      setWalletConnected(true)
      setWalletSaved(true)
      setTimeout(() => setWalletSaved(false), 3000)
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      setWalletError(getReadableWalletError(err))
    } finally {
      setWalletSaving(false)
    }
  }

  const handleWalletDisconnect = async () => {
    if (!user?.uid) return

    setWalletSaving(true)
    setWalletError('')

    try {
      if (window.ethereum?.request) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          })
        } catch (revokeError) {
          console.log('Permission revocation not supported:', revokeError)
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        walletAddress: ''
      })

      setWalletAddress('')
      setWalletConnected(false)
      setWalletSaved(false)
    } catch (err) {
      console.error('Failed to disconnect wallet:', err)
      setWalletError('Failed to disconnect wallet. Please try again.')
    } finally {
      setWalletSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-white">
            {orgName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{orgName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'active' ? 'bg-green-500' : 'bg-amber-500'
              }`} />
              {status === 'active' ? 'Active Partner' : 'Pending Approval'}
            </span>
            <span className="text-xs text-slate-400">Role: Partner</span>
          </div>
        </div>
      </div>

      {/* ── Success toast ────────────────────────────────────────────────────── */}
      {walletSaved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-green-800">Wallet address saved successfully.</p>
        </div>
      )}

      {/* ── Organisation Details ─────────────────────────────────────────────── */}
      <Section
        title="Organisation details"
        subtitle="Set during registration — contact admin to update"
      >
        <InfoRow label="Organisation name"  value={orgName} />
        <InfoRow label="Contact name"       value={contactName} />
        <InfoRow label="Email address"      value={email} />
        <InfoRow label="Phone number"       value={phone} />
        <InfoRow label="Description"        value={description} />
      </Section>

      {/* ── Wallet Address ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Polygon wallet address</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Required for campaign creation and fund distribution
            </p>
          </div>
          <button
            onClick={walletConnected ? handleWalletDisconnect : handleWalletConnect}
            disabled={walletSaving}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              walletConnected
                ? 'border-red-200 text-red-700 hover:bg-red-50'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            } ${walletSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {walletSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                Processing...
              </>
            ) : walletConnected ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Disconnect
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect
              </>
            )}
          </button>
        </div>

        <div className="px-6 py-5">
          {walletError && (
            <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {walletError}
            </p>
          )}

          <div>
            {walletAddress ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-900 break-all">{walletAddress}</p>
                  <a
                    href={`https://polygonscan.com/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 mt-0.5 inline-flex items-center gap-1"
                  >
                    View on Polygonscan
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800">No wallet address set</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Connect your MetaMask wallet before creating campaigns. This is where campaign funds will be managed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Account Info ─────────────────────────────────────────────────────── */}
      <Section
        title="Account information"
        subtitle="Platform account details"
      >
        <InfoRow label="User ID"        value={partnerUid} mono />
        <InfoRow label="Account created" value={formatTimestamp(createdAt)} />
        <InfoRow label="Account status"  value={
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === 'active' ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            {status === 'active' ? 'Active' : 'Pending'}
          </span>
        } />
      </Section>

      {/* ── Blockchain Info ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">Polygon network</p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          Your wallet address is used to deploy campaign smart contracts and receive distributed funds. Make sure it is a MetaMask wallet connected to the Polygon network.
        </p>
        <a
          href="https://metamask.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Get MetaMask
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

    </div>
  )
}

export default PartnerProfile