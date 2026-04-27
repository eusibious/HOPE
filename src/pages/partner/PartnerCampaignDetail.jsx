import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, collectionGroup } from "firebase/firestore";
import { ethers } from "ethers";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import HOPECampaignABI from "../../abi/HOPECampaign.json";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatUSDC = (value) => {
  try {
    return Number(ethers.formatUnits(value?.toString() || "0", 6)).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  } catch {
    return "0";
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const asString = value.toString();
  if (/^\d+$/.test(asString)) {
    return new Date(Number(asString) * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const truncateAddress = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—");

const getRpcProvider = () => {
  const rpcUrl = import.meta.env.VITE_RPC_URL;
  if (!rpcUrl) throw new Error("VITE_RPC_URL is not set");
  return new ethers.JsonRpcProvider(rpcUrl);
};

const readableError = (error) => {
  if (error?.code === 4001) return "Transaction rejected by user.";
  if (error?.info?.error?.message) return error.info.error.message;
  if (error?.reason) return error.reason;
  if (error?.shortMessage) return error.shortMessage;
  if (error?.message) return error.message;
  return "Operation failed.";
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Completed", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  pending: { label: "Pending", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const StatusBadge = ({ status = "pending" }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const StatCard = ({ icon, label, value, sub, accent = false }) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-1 border ${accent ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-gray-200"}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${accent ? "bg-teal-500" : "bg-teal-50"}`}>
      <span className={accent ? "text-white" : "text-teal-600"}>{icon}</span>
    </div>
    <p className={`text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
    <p className={`text-xs font-medium ${accent ? "text-teal-100" : "text-gray-500"}`}>{label}</p>
    {sub && <p className={`text-xs ${accent ? "text-teal-200" : "text-gray-400"}`}>{sub}</p>}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-3 border-b border-gray-100 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-44 shrink-0">{label}</span>
    <span className="text-sm text-gray-800">{value}</span>
  </div>
);

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
);

const ProgressBar = ({ raisedAmount, goalAmount }) => {
  const raised = Number(ethers.formatUnits((raisedAmount ?? "0").toString(), 6));
  const goal = Number(ethers.formatUnits((goalAmount ?? "0").toString(), 6));
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

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
  );
};

const ConfirmModal = ({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) => {
  if (!open) return null;

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
  );
};

const PasswordConfirmModal = ({
  open,
  onConfirm,
  onCancel,
  loading,
  title,
  message,
  buttonText
}) => {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
    }
  }, [open]);

  if (!open) return null;

  const handleCancel = () => {
    setPassword("");
    onCancel();
  };

  const handleConfirm = () => {
    const value = password.trim();
    if (!value) return;

    setPassword("");
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div>
          <p className="font-semibold text-gray-900">
            {title || "Confirm with Password"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {message || "Enter your account password to proceed."}
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="Your password"
          autoComplete="new-password"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm disabled:bg-gray-50"
        />

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !password.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Processing…" : buttonText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

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
};

// ─── CampaignManagement ───────────────────────────────────────────────────────
const CampaignManagement = ({ campaign, stats, onCloseSuccess }) => {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // "lock" or "close"

  if (campaign.status === "completed" || campaign.status === "closed") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Campaign Management</h2>
        <p className="text-xs text-gray-400">
          This campaign is <span className="font-medium">{campaign.status}</span> and can no longer be modified.
        </p>
      </div>
    );
  }



  const handleLockAndOpenDonations = async (password) => {
    setActionLoading(true);
    setError(null);

    try {
      // Re-authenticate with Firebase
      const { reauthenticateWithPassword } = await import("../../services/authService");
      const reAuthResult = await reauthenticateWithPassword(password);
      if (!reAuthResult.success) {
        throw new Error( "Incorrect password. Please try again.");
      }

      if (!window.ethereum) {
        throw new Error("MetaMask not found.");
      }

      if (!backendUrl) {
        throw new Error("VITE_BACKEND_URL is not set.");
      }

      const idToken = await user.getIdToken();

      // Step 1: Prepare beneficiary data from backend
      const prepareResponse = await fetch(`${backendUrl}/api/beneficiaries/prepare-final-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignAddress: campaign.campaignAddress,
        }),
      });

      const prepared = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(prepared.message || prepared.error || "Failed to prepare beneficiaries.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const signerAddress = await signer.getAddress();
      if (
        campaign.partnerWallet &&
        signerAddress.toLowerCase() !== campaign.partnerWallet.toLowerCase()
      ) {
        throw new Error("Connected wallet does not match the campaign partner wallet.");
      }

      const contract = new ethers.Contract(campaign.campaignAddress, HOPECampaignABI.abi, signer);

      // Step 2: Call combined function to register, lock, and open donations in one transaction
      console.log("Registering beneficiaries, locking, and opening donations...");
      const tx = await contract.registerLockAndOpenDonations(
        prepared.claimHashes || [],
        prepared.finalManifestCID || "",
        prepared.count || 0
      );
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // Step 3A: Commit beneficiary registration to Firestore
      const finalBatchCommitResponse = await fetch(`${backendUrl}/api/beneficiaries/commit-final-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignAddress: campaign.campaignAddress,
          batchId: prepared.batchId,
          txHash,
        }),
      });

      const finalBatchCommitted = await finalBatchCommitResponse.json();

      if (!finalBatchCommitResponse.ok) {
        throw new Error(
          `${finalBatchCommitted.message || finalBatchCommitted.error || "Final batch commit failed."} If blockchain transaction succeeded, treat this as reconciliation-required.`
        );
      }

      // Step 3B: Commit lock/open donation state to Firestore
      const lockCommitResponse = await fetch(`${backendUrl}/api/beneficiaries/commit-lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignAddress: campaign.campaignAddress,
          txHash,
        }),
      });

      const lockCommitted = await lockCommitResponse.json();

      if (!lockCommitResponse.ok) {
        throw new Error(
          `${lockCommitted.message || lockCommitted.error || "Lock commit failed."} If blockchain transaction succeeded, treat this as reconciliation-required.`
        );
      }

      onCloseSuccess({
        status: "active",
        isActive: true,
        beneficiariesLocked: true,
        donationsOpen: true,
      });
    } catch (err) {
      console.error(err);
      setError(readableError(err));
    } finally {
      setActionLoading(false);
      setShowPasswordModal(false);
    }
  };

  const handleCloseCampaign = async (password) => {
    setActionLoading(true);
    setError(null);

    try {
      // Re-authenticate with Firebase
      const { reauthenticateWithPassword } = await import("../../services/authService");
      const reAuthResult = await reauthenticateWithPassword(password);
      if (!reAuthResult.success) {
        throw new Error(reAuthResult.error || "Password is incorrect.");
      }

      if (!window.ethereum) {
        throw new Error("MetaMask not found.");
      }

      const idToken = await user.getIdToken();

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const signerAddress = await signer.getAddress();
      if (
        campaign.partnerWallet &&
        signerAddress.toLowerCase() !== campaign.partnerWallet.toLowerCase()
      ) {
        throw new Error("Connected wallet does not match the campaign partner wallet.");
      }

      const contract = new ethers.Contract(campaign.campaignAddress, HOPECampaignABI.abi, signer);

      // Close campaign on-chain (will also close donations automatically)
      console.log("Closing campaign and donations...");
      const tx = await contract.closeCampaign();
      const receipt = await tx.wait();
      const txHash = receipt.hash;

      // Commit close to backend / firestore
      const commitResponse = await fetch(`${backendUrl}/api/campaigns/commit-close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignAddress: campaign.campaignAddress,
          closeSessionId: Date.now().toString(),
          closeTxHash: txHash,
        }),
      });

      const committed = await commitResponse.json();

      if (!commitResponse.ok) {
        throw new Error(
          `${committed.message || committed.error || "Commit close failed."} If blockchain transaction succeeded, treat as reconciliation-required.`
        );
      }

      onCloseSuccess({
        status: "closed",
        isActive: false,
        donationsOpen: false,
      });
    } catch (err) {
      console.error(err);

      // The blockchain tx may have succeeded before the error was thrown
      // (e.g. server was down when commit-close was called, or MetaMask
      // threw after the tx was already mined). Re-read on-chain state to check.
      try {
        const readProvider = new ethers.BrowserProvider(window.ethereum);
        const readContract = new ethers.Contract(
          campaign.campaignAddress,
          HOPECampaignABI.abi,
          readProvider
        );
        const details = await readContract.getCampaignDetails();
        const isStillActive = details[10]; // index 10 = isActive

        if (!isStillActive) {
          // Campaign is already closed on-chain — just need to sync Firestore.
          setError("Campaign closed on-chain but sync incomplete. Retrying sync...");
          const freshToken = await user.getIdToken(true); // force refresh
          const retryResponse = await fetch(`${backendUrl}/api/campaigns/commit-close`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${freshToken}`,
            },
            body: JSON.stringify({
              campaignAddress: campaign.campaignAddress,
              closeSessionId: Date.now().toString(),
              closeTxHash: txHash || "reconciled",
            }),
          });

          if (retryResponse.ok) {
            setError("");
            onCloseSuccess({
              status: "closed",
              isActive: false,
              donationsOpen: false,
            });
            return;
          }

          // Retry also failed — tell the user to contact support
          setError(
            "Campaign is closed on-chain but Firestore sync failed twice. " +
            `Please contact support with campaign address: ${campaign.campaignAddress}`
          );
          return;
        }
      } catch (reconcileErr) {
        console.error("Reconciliation check failed:", reconcileErr);
        // Fall through to show the original error
      }

      setError(readableError(err));
    } finally {
      setActionLoading(false);
      setShowPasswordModal(false);
    }
  };


  return (
    <>
      <PasswordConfirmModal
        open={showPasswordModal}
        onConfirm={(password) => {
          if (pendingAction === "lock") {
            handleLockAndOpenDonations(password);
          } else if (pendingAction === "close") {
            handleCloseCampaign(password);
          }
        }}
        onCancel={() => {
          setShowPasswordModal(false);
          setPendingAction(null);
        }}
        loading={actionLoading}
        title={pendingAction === "lock" ? "Register & Lock Beneficiaries" : "Close Campaign"}
        message={
          pendingAction === "lock"
            ? "Enter your password to register and lock beneficiaries on-chain. This will open the donation window."
            : "Enter your password to close this campaign. This action is permanent and will stop all donations."
        }
        buttonText={pendingAction === "lock" ? "Register & Lock" : "Close Campaign"}
      />

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Campaign Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Register and lock beneficiaries to open the donation window.
          </p>
        </div>

        {stats.draftBeneficiaryCount + stats.beneficiaryCount === 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900 font-medium">No beneficiaries registered</p>
            <p className="text-xs text-blue-700 mt-1">
              Add beneficiaries to the draft list first, then register and lock them on-chain to open donations.
            </p>
          </div>
        )}

        {stats.draftBeneficiaryCount + stats.beneficiaryCount > 0 && !campaign.donationsOpen && (
          <button
            onClick={() => {
              setPendingAction("lock");
              setShowPasswordModal(true);
            }}
            disabled={actionLoading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-sm font-medium transition-all disabled:opacity-60"
          >
            <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </span>
            <div className="text-left">
              <p className="font-semibold text-teal-900">Register & Lock Beneficiaries</p>
              <p className="text-xs text-teal-700 font-normal">
                Lock {stats.draftBeneficiaryCount} beneficiaries on-chain and open donations
              </p>
            </div>
          </button>
        )}

        {campaign.donationsOpen && (
          <button
            onClick={() => {
              setPendingAction("close");
              setShowPasswordModal(true);
            }}
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
              <p className="text-xs text-red-700 font-normal">
                Close campaign and stop donations
              </p>
            </div>
          </button>
        )}

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
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PartnerCampaignDetail = () => {
  const { campaignAddress } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState({
    raisedAmount: "0",
    beneficiaryCount: 0,
    draftBeneficiaryCount: 0,
    donorCount: 0,
    claimedAmount: 0,
    claimedCount: 0,
    goalAmount: "0",
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const handleCloseSuccess = (patch) => {
    setCampaign((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignAddress || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "campaigns"), where("campaignAddress", "==", campaignAddress));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setCampaign(null);
          setStatsError("Campaign not found in database");
          setLoading(false);
          return;
        }

        const data = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };

        if (data.partnerUid !== user.uid) {
          navigate("/partner/campaigns", { replace: true });
          return;
        }

        setCampaign({
          ...data,
          campaignAddress,
          imageUrl: data.imageUrl || "",
          documentCID: data.documentCID || "",
          status: data.status || "pending",
        });

        // Fetch on-chain data separately to better handle errors
        try {
          const provider = getRpcProvider();
          const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider);

          console.log("Fetching campaign details for:", campaignAddress);
          const details = await contract.getCampaignDetails();
          console.log("Campaign details retrieved:", details);
          
          // Extract values using positional indexing (most reliable with ethers v6)
          const partner = details[0];
          const title = details[1];
          const location = details[2];
          const goalAmount = details[3];
          const raisedAmount = details[4];
          const claimedAmount = details[5];   // new field
          const remainingAmount = details[6]; // new field
          const deadline = details[7];        // was [5]
          const beneficiaryCount = details[8]; // was [6]
          const claimedCount = details[9];     // was [7]
          const isActive = details[10];        // was [8]
          const isPaused = details[11];        // was [9]
          const beneficiariesLocked = details[12]; // was [10]
          const donationsOpen = details[13];   // was [11]
          const documentCID = details[14];     // was [12]
          
          // Log individual fields to verify they're accessible
          console.log("Extracted values:", {
            partner,
            title,
            beneficiaryCount: beneficiaryCount?.toString?.() || beneficiaryCount,
            raisedAmount: raisedAmount?.toString?.() || raisedAmount,
            isActive,
          });

          const donationFilter = contract.filters.DonationReceived();
          const donationEvents = await contract.queryFilter(donationFilter, 0, "latest");

          const uniqueDonors = new Set(
            donationEvents.map((event) => event.args.donor.toLowerCase())
          ).size;

          const derivedStatus =
            isActive
              ? (data.status === "closed" ? "closed" : "active")
              : (data.status || "completed");

          const onChainData = {
            documentCID: documentCID || data.documentCID || "",
            partnerWallet: partner,
            status: derivedStatus,
            goalAmount: goalAmount.toString(),
            raisedAmount: raisedAmount.toString(),
            claimedAmount: claimedAmount.toString(),
            deadline: deadline.toString(),
            beneficiaryCount: Number(beneficiaryCount),
            claimedCount: Number(claimedCount),
            isActive: isActive,
            isPaused: isPaused,
            beneficiariesLocked: beneficiariesLocked,
            donationsOpen: donationsOpen,
          };

          console.log("On-chain data to set:", onChainData);

          setCampaign((prev) => (prev ? { ...prev, ...onChainData } : prev));

          // Fetch draft beneficiaries count
          let draftCount = 0;
          try {
            const beneficiariesRef = collection(db, "campaigns", data.id, "beneficiaries");
            const beneficiariesSnapshot = await getDocs(beneficiariesRef);
            draftCount = beneficiariesSnapshot.docs.filter(
              (doc) => doc.data().status === "draft"
            ).length;
            console.log("Draft beneficiaries count:", draftCount);
            console.log({
              claimedAmount: claimedAmount.toString(),
              claimedCount: claimedCount.toString()
            });
          } catch (draftErr) {
            console.warn("Failed to fetch draft beneficiaries:", draftErr);
          }

          setStats({
            raisedAmount: raisedAmount.toString(),
            beneficiaryCount: Number(beneficiaryCount),
            claimedAmount: claimedAmount.toString(),
            draftBeneficiaryCount: draftCount,
            donorCount: uniqueDonors,
            claimedCount: Number(claimedCount),
            goalAmount: goalAmount.toString(),
          });

          setStatsError(null);

        } catch (onChainErr) {
          console.error("Failed to fetch on-chain campaign data:", onChainErr);
          setStatsError(`Failed to fetch on-chain data: ${onChainErr.message}`);
        }
      } catch (err) {
        console.error("Failed to fetch partner campaign detail:", err);
        setCampaign(null);
        setStatsError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignAddress, user?.uid, navigate]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(campaignAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

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
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20">
        <p className="text-gray-500">
          {statsError || "Campaign not found."}
        </p>
        <button onClick={() => navigate(-1)} className="mt-4 text-teal-600 text-sm underline">
          Go back
        </button>
      </div>
    );
  }

  const goal = Number(ethers.formatUnits((stats.goalAmount ?? "0").toString(), 6));
  const claimPct =
    stats.beneficiaryCount > 0
      ? ((stats.claimedCount / stats.beneficiaryCount) * 100).toFixed(0)
      : 0;

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

      {statsError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-900">Unable to fetch on-chain data</p>
            <p className="text-xs text-amber-700 mt-0.5">{statsError}</p>
            <p className="text-xs text-amber-600 mt-1">Displaying cached data. Try refreshing the page.</p>
          </div>
        </div>
      )}

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
          sub={`${stats.draftBeneficiaryCount.toLocaleString()} draft registrations`}
        />
        <StatCard
          icon={Icons.donors}
          label="Unique Donors"
          value={stats.donorCount.toLocaleString()}
          sub="wallets donated"
        />
        <StatCard
          icon={Icons.claimed}
          label="Amount Claimed"
          value={formatUSDC(stats.claimedAmount )}
          sub={`${stats.claimedCount.toLocaleString()} beneficiaries claimed`}
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
              <DetailRow
                label="Beneficiaries Locked"
                value={campaign.beneficiariesLocked ? "Yes" : "No"}
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
                description="Add beneficiaries as drafts for this campaign"
                onClick={() => navigate(`/partner/campaigns/${campaignAddress}/beneficiaries/register`)}
                variant="primary"
              />

              <QuickActionButton
                icon={Icons.view}
                label="View Registered Beneficiaries"
                description="See all beneficiary draft and finalized records for this campaign"
                onClick={() => navigate(`/partner/campaigns/${campaignAddress}/beneficiaries`)}
              />

              <QuickActionButton
                icon={Icons.claim}
                label="Process Claims"
                description="Review and process aid claims"
                onClick={() => navigate(`/partner/campaigns/${campaignAddress}/claims`)}
              />
            </div>
          </div>

          <CampaignManagement campaign={campaign} stats={stats} onCloseSuccess={handleCloseSuccess} />

          {/* <div className="bg-white border border-gray-200 rounded-2xl p-5">
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
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default PartnerCampaignDetail;