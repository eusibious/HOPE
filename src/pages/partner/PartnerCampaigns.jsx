import { useEffect, useState, useMemo } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { ethers } from "ethers"
import HOPECampaignABI from "../../abi/HOPECampaign.json"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  pending: { label: "Pending", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Campaigns" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
  { value: "pending", label: "Pending" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatUSDC = (baseUnits) =>
  Number(ethers.formatUnits((baseUnits ?? "0").toString(), 6))

const formatDate = (value) => {
  if (!value) return "—"

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Firestore metadata currently stores deadline as a date string
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const getRpcProvider = () => {
  const rpcUrl = import.meta.env.VITE_RPC_URL
  if (!rpcUrl) throw new Error("VITE_RPC_URL is not set")
  return new ethers.JsonRpcProvider(rpcUrl)
}

const getLiveCampaignData = async (campaignAddress, provider) => {
  try {
    const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider)
    const details = await contract.getCampaignDetails()

    return {
      raisedAmount: details._raisedAmount.toString(),
      goalAmount: details._goalAmount.toString(),
      beneficiaryCount: Number(details._beneficiaryCount),
      claimedCount: Number(details._claimedCount),
      isActive: details._isActive,
      chainDocumentCID: details._documentCID,
    }
  } catch (error) {
    console.error(`Failed to fetch on-chain data for ${campaignAddress}:`, error)
    return {
      raisedAmount: "0",
      goalAmount: "0",
      beneficiaryCount: 0,
      claimedCount: 0,
      isActive: false,
      chainDocumentCID: "",
    }
  }
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status = "pending" }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ raisedAmount, goalAmount }) => {
  const raised = formatUSDC(raisedAmount)
  const goal = formatUSDC(goalAmount)
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{raised.toLocaleString()} USDC raised</span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── CampaignCard ─────────────────────────────────────────────────────────────
const CampaignCard = ({ campaign, onClick }) => {
  const goal = formatUSDC(campaign.goalAmount)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-teal-300 transition-all duration-200 group"
    >
      {campaign.imageUrl ? (
        <div className="h-40 overflow-hidden bg-gray-100">
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center text-teal-300">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
            {campaign.title}
          </p>
          <StatusBadge status={campaign.status} />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          {campaign.location && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {campaign.location}
            </span>
          )}
          {campaign.deadline && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Ends {formatDate(campaign.deadline)}
            </span>
          )}
        </div>

        <ProgressBar raisedAmount={campaign.raisedAmount} goalAmount={campaign.goalAmount} />

        <p className="text-xs text-gray-400">
          Goal: <span className="font-medium text-gray-600">{goal.toLocaleString()} USDC</span>
        </p>
      </div>
    </button>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
const EmptyState = ({ filtered }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    </div>
    <p className="text-gray-700 font-medium">
      {filtered ? "No campaigns match this filter" : "No campaigns yet"}
    </p>
    <p className="text-sm text-gray-400 mt-1">
      {filtered ? "Try a different filter or search term." : "Your launched campaigns will appear here."}
    </p>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const PartnerCampaigns = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user?.uid) {
        setCampaigns([])
        setLoading(false)
        return
      }

      try {
        const q = query(collection(db, "campaigns"), where("partnerUid", "==", user.uid))
        const snapshot = await getDocs(q)
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))

        const provider = getRpcProvider()

        const enriched = await Promise.all(
          docs.map(async (campaign) => {
            const live = campaign.campaignAddress
              ? await getLiveCampaignData(campaign.campaignAddress, provider)
              : null

            const derivedStatus = live
              ? live.isActive
                ? "active"
                : "completed"
              : campaign.status || "pending"

            return {
              ...campaign,
              raisedAmount: live?.raisedAmount || "0",
              goalAmount: live?.goalAmount || campaign.goalAmount || "0",
              beneficiaryCount: live?.beneficiaryCount || 0,
              claimedCount: live?.claimedCount || 0,
              documentCID: live?.chainDocumentCID || campaign.documentCID || "",
              status: campaign.status || derivedStatus,
            }
          })
        )

        const sorted = enriched.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        )

        setCampaigns(sorted)
      } catch (err) {
        console.error("Failed to fetch partner campaigns:", err)
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [user?.uid])

  const filtered = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchStatus = filter === "all" || campaign.status === filter
      const q = search.trim().toLowerCase()

      const matchSearch =
        !q ||
        campaign.title?.toLowerCase().includes(q) ||
        campaign.location?.toLowerCase().includes(q)

      return matchStatus && matchSearch
    })
  }, [campaigns, filter, search])

  const counts = useMemo(() => {
    return campaigns.reduce((acc, campaign) => {
      const status = campaign.status || "pending"
      acc[status] = (acc[status] ?? 0) + 1
      return acc
    }, {})
  }, [campaigns])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} launched
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === opt.value
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700"
              }`}
            >
              {opt.label}
              {opt.value !== "all" && counts[opt.value] ? (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    filter === opt.value ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {counts[opt.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-1.5 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <EmptyState filtered={filter !== "all" || !!search} />
          ) : (
            filtered.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => navigate(`/partner/campaigns/${campaign.campaignAddress}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default PartnerCampaigns