import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { ethers } from "ethers"
import { db } from "../../lib/firebase"
import { useAuth } from "../../contexts/AuthContext"
import HOPECampaignABI from "../../abi/HOPECampaign.json"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatUSDC = (baseUnits) =>
  Number(ethers.formatUnits((baseUnits ?? "0").toString(), 6)).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })

const formatDate = (value) => {
  if (!value) return "—"

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const asString = value.toString()
  if (/^\d+$/.test(asString)) {
    return new Date(Number(asString) * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const truncateAddress = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—")

const getRpcProvider = () => {
  const rpcUrl = import.meta.env.VITE_RPC_URL
  if (!rpcUrl) throw new Error("VITE_RPC_URL is not set")
  return new ethers.JsonRpcProvider(rpcUrl)
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  pending: { label: "Pending", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
}

const StatusBadge = ({ status = "pending" }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const StatCard = ({ icon, label, value, sub, accent = false }) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-1 border ${accent ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-gray-200"}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${accent ? "bg-teal-500" : "bg-teal-50"}`}>
      <span className={accent ? "text-white" : "text-teal-600"}>{icon}</span>
    </div>
    <p className={`text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
    <p className={`text-xs font-medium ${accent ? "text-teal-100" : "text-gray-500"}`}>{label}</p>
    {sub && <p className={`text-xs ${accent ? "text-teal-200" : "text-gray-400"}`}>{sub}</p>}
  </div>
)

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-3 border-b border-gray-100 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-44 shrink-0">{label}</span>
    <span className="text-sm text-gray-800">{value}</span>
  </div>
)

const QuickActionButton = ({ icon, label, description, onClick, variant = "default" }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all group hover:shadow-sm ${
      variant === "primary"
        ? "bg-teal-600 border-teal-600 hover:bg-teal-700 text-white"
        : "bg-white border-gray-200 hover:border-teal-300 text-gray-800"
    }`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${variant === "primary" ? "bg-teal-500" : "bg-teal-50"}`}>
      <span className={variant === "primary" ? "text-white" : "text-teal-600"}>{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold leading-tight ${variant === "primary" ? "text-white" : "text-gray-900"}`}>
        {label}
      </p>
      <p className={`text-xs mt-0.5 ${variant === "primary" ? "text-teal-200" : "text-gray-500"}`}>
        {description}
      </p>
    </div>
    <svg
      className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${variant === "primary" ? "text-teal-200" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
)

const ProgressBar = ({ raisedAmount, goalAmount }) => {
  const raised = Number(ethers.formatUnits((raisedAmount ?? "0").toString(), 6))
  const goal = Number(ethers.formatUnits((goalAmount ?? "0").toString(), 6))
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{raised.toLocaleString()} USDC raised</span>
        <span className="font-semibold text-teal-700">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">Goal: {goal.toLocaleString()} USDC</p>
    </div>
  )
}

const ConfirmModal = ({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CampaignManagement ───────────────────────────────────────────────────────
const CampaignManagement = ({ campaign, onStatusChange }) => {
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmClose, setConfirmClose] = useState(false)

  if (campaign.status === "completed" || campaign.status === "closed") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Campaign Management</h2>
        <p className="text-xs text-gray-400">
          This campaign is <span className="font-medium">{campaign.status}</span> and can no longer be modified.
        </p>
      </div>
    )
  }

  const handleClose = async () => {
    setActionLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()

      const contract = new ethers.Contract(campaign.campaignAddress, HOPECampaignABI.abi, signer)
      const tx = await contract.closeCampaign()
      await tx.wait()

      try {
        await updateDoc(doc(db, "campaigns", campaign.id), { status: "closed" })
        onStatusChange("closed")
      } catch {
        setError("Campaign was closed on-chain but Firestore update failed. Refresh the page.")
      }
    } catch (err) {
      console.error(err)
      setError(err?.reason || err?.shortMessage || err?.message || "Transaction failed.")
    } finally {
      setActionLoading(false)
      setConfirmClose(false)
    }
  }

  return (
    <>
      <ConfirmModal
        open={confirmClose}
        title="Close this campaign?"
        message="Closing is permanent. Donations will be disabled and the campaign cannot be reopened from this UI."
        confirmLabel="Yes, Close Campaign"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleClose}
        onCancel={() => setConfirmClose(false)}
        loading={actionLoading}
      />

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Campaign Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            This action calls the smart contract and then updates Firestore.
          </p>
        </div>

        <button
          onClick={() => setConfirmClose(true)}
          disabled={actionLoading}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-sm font-medium transition-all disabled:opacity-60"
        >
          <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </span>
          <div className="text-left">
            <p className="font-semibold text-red-900">Close Campaign</p>
            <p className="text-xs text-red-500 font-normal">Permanently end this campaign</p>
          </div>
        </button>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>
    </>
  )
}

const Icons = {
  money: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
      />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857"
      />
    </svg>
  ),
  donors: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  claimed: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
  ),
  target: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5"
      />
    </svg>
  ),
  register: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3"
      />
    </svg>
  ),
  view: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20H7" />
    </svg>
  ),
  claim: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
  ),
  copy: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6"
      />
    </svg>
  ),
}

// ─── Main Component ───────────────────────────────────────────────────────────
const PartnerCampaignDetail = () => {
  const { campaignAddress } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [campaign, setCampaign] = useState(null)
  const [stats, setStats] = useState({
    raisedAmount: "0",
    beneficiaryCount: 0,
    donorCount: 0,
    claimedCount: 0,
    goalAmount: "0",
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleStatusChange = (newStatus) => {
    setCampaign((prev) => ({ ...prev, status: newStatus }))
  }

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignAddress || !user?.uid) {
        setLoading(false)
        return
      }

      try {
        const q = query(collection(db, "campaigns"), where("campaignAddress", "==", campaignAddress))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setCampaign(null)
          return
        }

        const data = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        }

        if (data.partnerUid !== user.uid) {
          navigate("/partner/campaigns", { replace: true })
          return
        }

        const provider = getRpcProvider()
        const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider)

        const details = await contract.getCampaignDetails()

        const donationFilter = contract.filters.DonationReceived()
        const donationEvents = await contract.queryFilter(donationFilter, 0, "latest")

        const uniqueDonors = new Set(
          donationEvents.map((event) => event.args.donor.toLowerCase())
        ).size

        const derivedStatus =
          details._isActive
            ? (data.status === "closed" ? "closed" : "active")
            : (data.status || "completed")

        setCampaign({
          ...data,
          campaignAddress,
          imageUrl: data.imageUrl || "",
          documentCID: details._documentCID || data.documentCID || "",
          partnerWallet: details._partner,
          status: derivedStatus,
          goalAmount: details._goalAmount.toString(),
          raisedAmount: details._raisedAmount.toString(),
          deadline: details._deadline.toString(),
          beneficiaryCount: Number(details._beneficiaryCount),
          claimedCount: Number(details._claimedCount),
          isActive: details._isActive,
        })

        setStats({
          raisedAmount: details._raisedAmount.toString(),
          beneficiaryCount: Number(details._beneficiaryCount),
          donorCount: uniqueDonors,
          claimedCount: Number(details._claimedCount),
          goalAmount: details._goalAmount.toString(),
        })
      } catch (err) {
        console.error("Failed to fetch partner campaign detail:", err)
        setCampaign(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()
  }, [campaignAddress, user?.uid, navigate])

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(campaignAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-56 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20">
        <p className="text-gray-500">Campaign not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-teal-600 text-sm underline">
          Go back
        </button>
      </div>
    )
  }

  const goal = Number(ethers.formatUnits((stats.goalAmount ?? "0").toString(), 6))
  const claimPct =
    stats.beneficiaryCount > 0
      ? ((stats.claimedCount / stats.beneficiaryCount) * 100).toFixed(0)
      : 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Campaigns
      </button>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {campaign.imageUrl && (
          <div className="h-56 overflow-hidden">
            <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{campaign.title}</h1>
              {campaign.location && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
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
                </p>
              )}
            </div>
            <StatusBadge status={campaign.status} />
          </div>

          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 font-mono">
              {campaignAddress}
            </code>
            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-teal-300 hover:text-teal-600 text-gray-500 transition-all"
            >
              {Icons.copy}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <ProgressBar raisedAmount={campaign.raisedAmount} goalAmount={campaign.goalAmount} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Icons.money}
          label="Raised (USDC)"
          value={formatUSDC(stats.raisedAmount)}
          sub={`of ${goal.toLocaleString()} USDC goal`}
          accent
        />
        <StatCard
          icon={Icons.users}
          label="Beneficiaries"
          value={stats.beneficiaryCount.toLocaleString()}
          sub="registered"
        />
        <StatCard
          icon={Icons.donors}
          label="Unique Donors"
          value={stats.donorCount.toLocaleString()}
          sub="wallets donated"
        />
        <StatCard
          icon={Icons.claimed}
          label="Aid Claimed"
          value={stats.claimedCount.toLocaleString()}
          sub={`${claimPct}% of beneficiaries`}
        />
        <StatCard
          icon={Icons.target}
          label="Target"
          value={goal.toLocaleString()}
          sub="USDC goal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {campaign.description && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">About this Campaign</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{campaign.description}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Campaign Details</h2>
            <div className="divide-y divide-gray-50">
              <DetailRow label="Category" value={campaign.category ?? "—"} />
              <DetailRow label="Created At" value={formatDate(campaign.createdAt)} />
              <DetailRow label="Deadline" value={formatDate(campaign.deadline)} />
              <DetailRow
                label="Partner Wallet"
                value={
                  campaign.partnerWallet ? (
                    <span className="font-mono text-xs text-gray-500">{campaign.partnerWallet}</span>
                  ) : "—"
                }
              />
              <DetailRow
                label="Campaign Address"
                value={<span className="font-mono text-xs text-gray-500">{campaignAddress}</span>}
              />
              {campaign.documentCID && (
                <DetailRow
                  label="IPFS Document"
                  value={
                    <a
                      href={`https://ipfs.io/ipfs/${campaign.documentCID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-600 hover:underline text-xs font-mono"
                    >
                      {truncateAddress(campaign.documentCID)}
                    </a>
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
            <div className="space-y-3">
              <QuickActionButton
                icon={Icons.register}
                label="Register Beneficiaries"
                description="Add beneficiaries and submit the registration batch"
                onClick={() => navigate(`/partner/campaigns/${campaignAddress}/beneficiaries/register`)}
                variant="primary"
              />

              <QuickActionButton
                icon={Icons.view}
                label="View Registered Beneficiaries"
                description="See all beneficiaries already recorded for this campaign"
                onClick={() => navigate(`/partner/campaigns/${campaignAddress}/beneficiaries`)}
              />

              <QuickActionButton
                icon={Icons.claim}
                label="Manage Aid Claims"
                description="Review and process aid claims"
                onClick={() => navigate(`/partner/claims`)}
              />
            </div>
          </div>

          <CampaignManagement campaign={campaign} onStatusChange={handleStatusChange} />

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Claim Progress</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {stats.claimedCount} of {stats.beneficiaryCount} claimed
                </span>
                <span className="font-semibold text-teal-700">{claimPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${claimPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {Math.max(stats.beneficiaryCount - stats.claimedCount, 0)} beneficiaries yet to claim
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PartnerCampaignDetail