import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, bg, iconColor }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
)

// ─── Campaign Row ─────────────────────────────────────────────────────────────
const CampaignRow = ({ campaign }) => {
  const statusColors = {
    active:    'bg-green-100 text-green-700',
    pending:   'bg-amber-100 text-amber-700',
    completed: 'bg-slate-100 text-slate-600',
    rejected:  'bg-red-100 text-red-700',
  }
  const progress = campaign.goal > 0
    ? Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100)
    : 0

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors ">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-slate-800 truncate">{campaign.title}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[campaign.status] || statusColors.pending}`}>
            {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0">{progress}%</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-900">${(campaign.raised || 0).toLocaleString()}</p>
        <p className="text-xs text-slate-400">of ${(campaign.goal || 0).toLocaleString()}</p>
      </div>
      
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const PartnerDashboard = () => {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '')
  const [activities, setActivities] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState('')

  const orgName     = userData?.organizationName || user?.displayName || 'Partner'
  const contactName = userData?.contactName      || '—'
  const email       = userData?.email            || user?.email       || '—'
  const phone       = userData?.phone            || '—'
  const description = userData?.description      || ''
  const isApproved  = userData?.status === 'active'

  useEffect(() => {
    const fetchPartnerActivity = async () => {
      if (!user) return

      try {
        setActivityLoading(true)
        setActivityError('')

        const token = await user.getIdToken()
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001'

        const response = await fetch(`${backendUrl}/api/activity/partner`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch activity log')
        }

        setActivities(data.activities || [])
      } catch (err) {
        console.error('Partner activity fetch failed:', err)
        setActivityError(err.message || 'Failed to load activity log.')
        setActivities([])
      } finally {
        setActivityLoading(false)
      }
    }

    fetchPartnerActivity()
  }, [user])

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user?.uid) return
      try {
        const q = query(collection(db, 'campaigns'), where('partnerUid', '==', user.uid))
        const snapshot = await getDocs(q)
        setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (err) {
        console.error('Error fetching campaigns:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCampaigns()
  }, [user?.uid])

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  const activeCampaigns    = campaigns.filter(c => c.status === 'active').length
  const pendingCampaigns   = campaigns.filter(c => c.status === 'pending').length
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
  const totalRaised        = campaigns.reduce((s, c) => s + (c.raised || 0), 0)
  const totalDonors        = campaigns.reduce((s, c) => s + (c.donorCount || 0), 0)
  const totalBeneficiaries = campaigns.reduce((s, c) => s + (c.beneficiaryCount || 0), 0)

  const totalCampaigns = campaigns.length
  const recentCampaigns    = [...campaigns]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 4)
  const visibleActivities = activities.slice(0, 8)

  const getActivityIcon = (type) => {
    if (type === 'donation') return '💰'
    if (type === 'claim') return '✅'
    if (type === 'registration') return '🧾'
    if (type === 'lifecycle') return '🔒'
    return '📌'
  }

  const getActivityTone = (tone) => {
    const map = {
      green: 'bg-green-50 text-green-700 border-green-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      slate: 'bg-slate-50 text-slate-700 border-slate-200',
    }
    return map[tone] || map.slate
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Success Banner ──────────────────────────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-800 font-medium flex-1">{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-slate-700">{orgName}</span>
          </p>
        </div>
      </div>

      {/* ── Pending Approval Banner ──────────────────────────────────────────── */}
      {!isApproved && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Account Under Review</p>
            <p className="text-sm text-amber-700 mt-0.5">Your partner account is being reviewed. You'll be able to create campaigns once approved.</p>
          </div>
        </div>
      )}

      {/* ── Stats Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Campaigns"
          value={loading ? '—' : totalCampaigns}
          sub="Total campaigns created by your organization"
          bg="bg-blue-50"
          iconColor="text-blue-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Total Raised"
          value={loading ? '—' : `$${totalRaised.toLocaleString()}`}
          sub="USDC across all campaigns"
          bg="bg-green-50"
          iconColor="text-green-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        <StatCard
          label="Total Donors"
          value={loading ? '—' : totalDonors}
          sub="Across all campaigns"
          bg="bg-purple-50"
          iconColor="text-purple-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Beneficiaries"
          value={loading ? '—' : totalBeneficiaries}
          sub="Registered for aid"
          bg="bg-orange-50"
          iconColor="text-orange-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Partner Activity Log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Activity Log</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                On-chain events from all campaigns launched by your organisation.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {activityLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
              </div>
            ) : activityError ? (
              <div className="p-5 text-sm text-red-600">
                {activityError}
              </div>
            ) : visibleActivities.length > 0 ? (
              visibleActivities.map((item) => (
                <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg">
                    {getActivityIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>

                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getActivityTone(item.tone)}`}>
                        {item.badge}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.campaignTitle ? `${item.campaignTitle} · ` : ''}
                      {item.subtitle}
                    </p>

                    <p className="mt-1 font-mono text-[11px] text-slate-400 break-all">
                      Tx: {item.txHash}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {item.amountLabel && (
                      <p className="text-sm font-semibold text-emerald-600">
                        {item.amountLabel}
                      </p>
                    )}
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {item.relativeTime}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-xl">📌</span>
                </div>
                <p className="text-sm font-medium text-slate-700">No on-chain activity yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Campaign events will appear here after transactions are confirmed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">

          {/* Recent Campaigns */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Recent Campaigns</h2>
              <Link to="/partner/campaigns" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>

            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
                </div>
              ) : recentCampaigns.length > 0 ? (
                recentCampaigns.map(c => (
                  <CampaignRow
                    key={c.id}
                    campaign={{
                      ...c,
                      goal: c.goalAmount ? Number(c.goalAmount) / 1e6 : 0,
                      raised: c.raised || 0,
                      status: c.status || 'active',
                    }}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-700">No campaigns yet</p>
                  <p className="text-xs text-slate-400 mt-1">Create your first campaign to start raising funds</p>
                </div>
              )}
            </div>
          </div>

          {/* Organisation Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Organisation</h2>
              <Link to="/partner/profile" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit →</Link>
            </div>
            <div className="p-5 space-y-4">
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">{orgName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{orgName}</p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-xs text-slate-600">{contactName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p className="text-xs text-slate-600">{phone}</p>
                </div>
                {description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{description}</p>
                )}
              </div>

              {/* Status badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-green-500' : 'bg-amber-500'}`} />
                {isApproved ? 'Active Partner' : 'Pending Approval'}
              </div>
            </div>
          </div>

          {/* Blockchain Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Polygon Network</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              All donations are processed on Polygon. Funds are held in smart contracts and fully transparent.
            </p>
            <a
              href="https://polygonscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              View on PolygonScan
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

export default PartnerDashboard