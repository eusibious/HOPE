import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import HOPECampaignABI from '../../abi/HOPECampaign.json';
import { getAuth } from 'firebase/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  on_hold: { label: 'On Hold', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  completed: { label: 'Completed', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  closed: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  pending: { label: 'Pending', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const StatusBadge = ({ status = 'pending' }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const formatUSDC = (baseUnits) =>
  Number(ethers.formatUnits((baseUnits ?? '0').toString(), 6)).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return '—';

  if (value?.seconds || value?._seconds) {
    const seconds = value.seconds ?? value._seconds;
    return new Date(seconds * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const asString = value.toString();
  if (/^\d+$/.test(asString)) {
    return new Date(Number(asString) * 1000).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const truncateAddress = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—');

const truncateMiddle = (value, start = 10, end = 8) => {
  if (!value) return '—';
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
};

const maskIdNumber = (value) => {
  if (!value) return '—';
  if (value.length <= 4) return value;
  return `${'*'.repeat(Math.max(value.length - 4, 1))}${value.slice(-4)}`;
};

const getRpcProvider = () => {
  const rpcUrl = import.meta.env.VITE_RPC_URL;
  if (!rpcUrl) throw new Error('VITE_RPC_URL is not set');
  return new ethers.JsonRpcProvider(rpcUrl);
};

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-4">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-3 border-b border-gray-100 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-48 shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-800">{value}</span>
  </div>
);

const ConfirmModal = ({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminCampaignDetail = () => {
  const { campaignAddress } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { blockCampaign, unblockCampaign } = useAdmin();

  const [campaign, setCampaign] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmHold, setConfirmHold] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [copiedValue, setCopiedValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignAddress || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // Fetch campaign + beneficiaries via backend (Admin SDK), avoids client Firestore rule issues.
        const currentUser = getAuth().currentUser;
        if (!currentUser) throw new Error('Not authenticated');
        const idToken = await currentUser.getIdToken();

        const response = await fetch(`${BACKEND_URL}/api/admin/campaigns/${campaignAddress}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = payload?.message || payload?.error || 'Failed to fetch campaign detail.';
          throw new Error(msg);
        }

        const firestoreData = payload.campaign;
        const beneficiariesData = Array.isArray(payload.beneficiaries) ? payload.beneficiaries : [];

        // Fetch on-chain data
        const provider = getRpcProvider();
        const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider);
        const details = await contract.getCampaignDetails();

        const derivedStatus = details._isActive
          ? (firestoreData.status === 'closed' ? 'closed' : firestoreData.status || 'active')
          : (firestoreData.status || 'completed');

        setCampaign({
          ...firestoreData,
          campaignAddress,
          status: derivedStatus,
          partnerWallet: details._partner,
          isActive: details._isActive,
          isPaused: details._isPaused,
          beneficiariesLocked: details._beneficiariesLocked,
          raisedAmount: details._raisedAmount.toString(),
          goalAmount: details._goalAmount.toString(),
          deadline: details._deadline.toString(),
          beneficiaryCount: Number(details._beneficiaryCount),
          claimedCount: Number(details._claimedCount),
        });

        setBeneficiaries(beneficiariesData);
      } catch (err) {
        console.error('Failed to fetch campaign detail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignAddress, user?.uid]);

  const handleCopy = async (value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setTimeout(() => setCopiedValue(''), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleHoldCampaign = async () => {
    setActionLoading(true);
    try {
      await blockCampaign(campaign.id);
      setCampaign(prev => ({ ...prev, status: 'on_hold' }));
      setConfirmHold(false);
    } catch (err) {
      console.error('Error holding campaign:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeCampaign = async () => {
    setActionLoading(true);
    try {
      await unblockCampaign(campaign.id);
      setCampaign(prev => ({ ...prev, status: 'active' }));
    } catch (err) {
      console.error('Error resuming campaign:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48" />
        <div className="h-12 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20">
        <p className="text-gray-500">{error || 'Campaign not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 text-sm underline">
          Go back
        </button>
      </div>
    );
  }

  const raised = formatUSDC(campaign.raisedAmount);
  const goal = formatUSDC(campaign.goalAmount);
  const progress = Number(campaign.goalAmount) > 0
    ? Math.min((Number(campaign.raisedAmount) / Number(campaign.goalAmount)) * 100, 100).toFixed(1)
    : 0;

  const claimProgress = campaign.beneficiaryCount > 0
    ? ((campaign.claimedCount / campaign.beneficiaryCount) * 100).toFixed(0)
    : 0;

  const createdValue =
    campaign.createdAt ||
    campaign.createdOn ||
    campaign.submittedAt ||
    campaign.submittedOn ||
    campaign.createdDate ||
    null;
  const hasCampaignCreated = Boolean(createdValue);
  const hasBeneficiaryCreated = beneficiaries.some((b) => Boolean(b.createdAt));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ConfirmModal
        open={confirmHold}
        title="Put campaign on hold?"
        message="This will pause all donations and beneficiary registration. Donors and partners will not be able to interact with this campaign."
        confirmLabel="Yes, Put On Hold"
        confirmClass="bg-amber-600 hover:bg-amber-700"
        onConfirm={handleHoldCampaign}
        onCancel={() => setConfirmHold(false)}
        loading={actionLoading}
      />

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Campaigns
        </button>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            {campaign.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          <div className="flex flex-wrap items-center gap-2">
            <code className="text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 font-mono">
              {campaignAddress}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(campaignAddress)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-500 transition-all"
            >
              Copy
            </button>
          </div>

          {campaign.description && (
            <p className="text-sm text-gray-600 mt-2">{campaign.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Raised"
          value={raised}
          sub={`of ${goal} USDC goal`}
        />
        <StatCard
          label="Progress"
          value={`${progress}%`}
          sub="towards goal"
        />
        <StatCard
          label="Beneficiaries"
          value={campaign.beneficiaryCount}
          sub="registered on-chain"
        />
        <StatCard
          label="Claimed"
          value={`${claimProgress}%`}
          sub={`${campaign.claimedCount} of ${campaign.beneficiaryCount}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Campaign Details</h2>
            <div className="divide-y divide-gray-100">
              <DetailRow label="Category" value={campaign.category ?? '—'} />
              {hasCampaignCreated && <DetailRow label="Created" value={formatDate(createdValue)} />}
              <DetailRow label="Deadline" value={formatDate(campaign.deadline)} />
              <DetailRow label="Status" value={campaign.status === 'on_hold' ? '🟡 On Hold' : campaign.status} />
              <DetailRow label="Active On-Chain" value={campaign.isActive ? 'Yes' : 'No'} />
              <DetailRow label="Paused On-Chain" value={campaign.isPaused ? 'Yes' : 'No'} />
              <DetailRow label="Beneficiaries Locked" value={campaign.beneficiariesLocked ? 'Yes' : 'No'} />
              <DetailRow
                label="Partner Wallet"
                value={campaign.partnerWallet ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{campaign.partnerWallet}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(campaign.partnerWallet)}
                      className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                    >
                      {copiedValue === campaign.partnerWallet ? 'Copied' : 'Copy'}
                    </button>
                  </span>
                ) : '—'}
              />
              {campaign.documentCID && (
                <DetailRow
                  label="Document CID"
                  value={
                    <a
                      href={`https://ipfs.io/ipfs/${campaign.documentCID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs font-mono"
                    >
                      {truncateAddress(campaign.documentCID)}
                    </a>
                  }
                />
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Registered Beneficiaries</h2>
                <p className="text-xs text-gray-500 mt-1">Full beneficiary records (read-only).</p>
              </div>
              <div className="text-xs text-gray-400">{beneficiaries.length} records</div>
            </div>
            {beneficiaries.length === 0 ? (
              <p className="text-sm text-gray-500">No beneficiaries registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Beneficiary</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Identity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Record Trail</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      {hasBeneficiaryCreated && (
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {beneficiaries.map((b) => (
                      <tr key={b.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            {b.photoUrls?.selfie ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto(b.photoUrls.selfie)}
                                className="h-11 w-11 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                              >
                                <img
                                  src={b.photoUrls.selfie}
                                  alt={b.fullName || 'Beneficiary'}
                                  className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                              </button>
                            ) : (
                              <div className="h-11 w-11 rounded-lg border border-gray-200 bg-gray-100" />
                            )}

                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {b.fullName || '—'}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                Age: {b.age ?? '—'} • Gender: {b.gender || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div>{b.idType || '—'}</div>
                          <div className="mt-1 text-xs text-gray-500 break-all">
                            {maskIdNumber(b.idNumber || b.normalizedIdNumber)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs text-gray-700">
                          <div className="space-y-2">
                            <div>
                              <div className="text-[11px] text-gray-400">Beneficiary CID</div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono break-all">{b.beneficiaryCID || '—'}</span>
                                {b.beneficiaryCID && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(b.beneficiaryCID)}
                                    className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                                  >
                                    {copiedValue === b.beneficiaryCID ? 'Copied' : 'Copy'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-gray-400">Manifest CID</div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono break-all">
                                  {b.finalManifestCID || b.manifestCID || '—'}
                                </span>
                                {(b.finalManifestCID || b.manifestCID) && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(b.finalManifestCID || b.manifestCID)}
                                    className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                                  >
                                    {copiedValue === (b.finalManifestCID || b.manifestCID) ? 'Copied' : 'Copy'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              b.status === 'claimed'
                                ? 'bg-green-50 text-green-700'
                                : b.status === 'registered'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {b.status || 'draft'}
                            </span>
                            <span className="text-[11px] text-gray-500">On-chain: {b.onChainRegistered ? 'Yes' : 'No'}</span>
                            {b.registrationTxHash && (
                              <span className="text-[11px] font-mono text-gray-400 break-all">
                                Tx: {truncateMiddle(b.registrationTxHash, 12, 8)}
                              </span>
                            )}
                          </div>
                        </td>

                        {hasBeneficiaryCreated && (
                          <td className="px-4 py-4 text-xs text-gray-600">
                            {formatDate(b.createdAt)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Admin Actions</h2>
            <div className="space-y-3">
              {campaign.status === 'active' ? (
                <button
                  onClick={() => setConfirmHold(true)}
                  disabled={actionLoading || campaign.status !== 'active'}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium transition-all disabled:opacity-60"
                >
                  <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  <div className="text-left">
                    <p className="font-semibold text-amber-900">Put On Hold</p>
                    <p className="text-xs text-amber-600 font-normal">Pause donations & registration</p>
                  </div>
                </button>
              ) : campaign.status === 'on_hold' ? (
                <button
                  onClick={handleResumeCampaign}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-800 text-sm font-medium transition-all disabled:opacity-60"
                >
                  <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <p className="font-semibold text-green-900">Resume Campaign</p>
                    <p className="text-xs text-green-600 font-normal">Re-enable donations & registration</p>
                  </div>
                </button>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-600">
                    Cannot modify {campaign.status} campaigns.
                  </p>
                </div>
              )}
            </div>
          </div>

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
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow"
            >
              ×
            </button>

            <img
              src={selectedPhoto}
              alt="Beneficiary"
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignDetail;
