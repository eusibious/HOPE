import React, { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import FilterBar from '../../components/forms/FilterBar';
import ActionDropdown from '../../components/common/ActionDropdown';
import StatCard from '../../components/common/StatCard';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import HOPECampaignABI from '../../abi/HOPECampaign.json';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  on_hold: 'bg-rose-50 text-rose-700 border-rose-100',
};

const StatusPill = ({ status }) => {
  const normalized = String(status || '').toLowerCase();
  const styles = STATUS_STYLES[normalized] || STATUS_STYLES.closed;
  const label = normalized.replace('_', ' ') || 'unknown';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>
      {label}
    </span>
  );
};

const DonationsPill = ({ show, open }) => {
  if (!show) return null;

  return open ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-50 text-green-700 border-green-100">
      Accepting donations
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-100">
      Donations closed
    </span>
  );
};

const AdminCampaignCard = ({ campaign, onView, actions }) => {
  const raised = Number.isFinite(campaign.amountRaised) ? campaign.amountRaised : 0;
  const goal = Number.isFinite(campaign.goalAmount) ? campaign.goalAmount : 0;
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const handleCardClick = () => {
    if (!campaign.campaignAddress) return;
    onView?.();
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all hover:shadow-md hover:border-teal-200 ${
        campaign.campaignAddress ? 'cursor-pointer' : 'opacity-70'
      }`}
      onClick={handleCardClick}
      role={campaign.campaignAddress ? 'button' : undefined}
      tabIndex={campaign.campaignAddress ? 0 : -1}
      onKeyDown={(e) => {
        if (!campaign.campaignAddress) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {campaign.imageUrl ? (
        <div className="h-40 overflow-hidden bg-gray-100">
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
              {campaign.title}
            </p>
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {campaign.partnerName}
              {campaign.location ? ` • ${campaign.location}` : ''}
            </p>
          </div>

          <div className="flex items-start gap-2 shrink-0">
            <div className="flex flex-col gap-1 items-end">
              <StatusPill status={campaign.status} />
              <DonationsPill show={campaign.status === 'active'} open={campaign.donationsOpen} />
            </div>

            {actions?.length ? (
              <div onClick={(e) => e.stopPropagation()}>
                <ActionDropdown actions={actions} />
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>${raised.toLocaleString()}</span>
            <span>${goal.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{pct.toFixed(1)}% funded</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          disabled={!campaign.campaignAddress}
          className="w-full px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:border-gray-200 disabled:hover:text-gray-700"
        >
          View details
        </button>
      </div>
    </div>
  );
};

const AdminCampaigns = () => {
  const {
    campaigns,
    loading,
    error,
    blockCampaign,
    unblockCampaign,
    approveCampaignClosure,
    campaignFilters,
    updateCampaignFilters,
  } = useAdmin();
  const navigate = useNavigate();
  const [enrichedCampaigns, setEnrichedCampaigns] = useState([]);
  const [enriching, setEnriching] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending Closure' },
    { value: 'closed', label: 'Closed' },
    { value: 'on_hold', label: 'On Hold' },
  ];

  const getRpcProvider = () => {
    const rpcUrl = import.meta.env.VITE_RPC_URL;
    if (!rpcUrl) throw new Error('VITE_RPC_URL is not set');
    return new ethers.JsonRpcProvider(rpcUrl);
  };

  const normalizeStatus = (rawStatus, liveIsActive) => {
    const status = String(rawStatus || '').toLowerCase();

    if (status === 'blocked') return 'on_hold';
    if (status === 'completed') return 'closed';
    if (['active', 'pending', 'closed', 'on_hold'].includes(status)) return status;

    return liveIsActive ? 'active' : 'closed';
  };

  const toNumberAmount = (value) => {
    if (value === null || value === undefined) return 0;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  // All hooks must be called unconditionally before any conditional rendering
  useEffect(() => {
    const enrich = async () => {
      if (!campaigns.length) {
        setEnrichedCampaigns([]);
        return;
      }

      setEnriching(true);

      try {
        const provider = getRpcProvider();

        const fetchLiveCampaignData = async (campaignAddress) => {
          try {
            const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider);
            const details = await contract.getCampaignDetails();

            return {
              goalAmount: Number(ethers.formatUnits(details._goalAmount.toString(), 6)),
              raisedAmount: Number(ethers.formatUnits(details._raisedAmount.toString(), 6)),
              isActive: details._isActive,
              donationsOpen: Boolean(details[13] || false),
            };
          } catch (fetchError) {
            console.error(`Failed to fetch on-chain campaign data for ${campaignAddress}:`, fetchError);
            return {
              goalAmount: null,
              raisedAmount: null,
              isActive: null,
              donationsOpen: false,
            };
          }
        };

        const mapped = await Promise.all(
          campaigns.map(async (campaign) => {
              const live = campaign.campaignAddress
                ? await fetchLiveCampaignData(campaign.campaignAddress)
                : { goalAmount: null, raisedAmount: null, isActive: null, donationsOpen: false };

              const status = normalizeStatus(campaign.status, live.isActive);
              const goalAmount =
                live.goalAmount ??
                toNumberAmount(campaign.goalAmount ? toNumberAmount(campaign.goalAmount) / 1e6 : 0);
              const amountRaised =
                live.raisedAmount ??
                toNumberAmount(campaign.amountRaised ? toNumberAmount(campaign.amountRaised) / 1e6 : campaign.raisedAmount);

              return {
                id: campaign.id,
                campaignAddress: campaign.campaignAddress,
                title: campaign.title || campaign.campaignName || 'Untitled Campaign',
                partnerName:
                  campaign.partnerName || campaign.partner || campaign.organizationName || 'Unknown Partner',
                location: campaign.location || '',
                imageUrl: campaign.imageUrl || '',
                amountRaised,
                goalAmount,
                status,
                rawStatus: campaign.status,
                donationsOpen: live.donationsOpen,
              };
            })
        );

        const withAddress = mapped.filter((item) => item.campaignAddress);
        const withoutAddress = mapped.filter((item) => !item.campaignAddress);

        const unique = Array.from(
          new Map(withAddress.map((item) => [item.campaignAddress.toLowerCase(), item])).values()
        );

        setEnrichedCampaigns([...unique, ...withoutAddress]);
      } catch (enrichError) {
        console.error('Error enriching admin campaign list:', enrichError);
        setEnrichedCampaigns([]);
      } finally {
        setEnriching(false);
      }
    };

    enrich();
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const search = (campaignFilters.search || '').trim().toLowerCase();
    const statusFilter = campaignFilters.status || '';

    return enrichedCampaigns.filter((campaign) => {
      const matchesSearch =
        !search ||
        campaign.title.toLowerCase().includes(search) ||
        campaign.partnerName.toLowerCase().includes(search);

      const matchesStatus =
        !statusFilter ||
        campaign.status === statusFilter ||
        (statusFilter === 'closed' && campaign.status === 'closed') ||
        (statusFilter === 'on_hold' && campaign.status === 'on_hold');

      return matchesSearch && matchesStatus;
    });
  }, [campaignFilters.search, campaignFilters.status, enrichedCampaigns]);

  const activeCampaignsCount = enrichedCampaigns.filter((campaign) => campaign.status === 'active').length;
  const closedCampaignsCount = enrichedCampaigns.filter((campaign) => campaign.status === 'closed').length;
  const onHoldCampaignsCount = enrichedCampaigns.filter((campaign) => campaign.status === 'on_hold').length;
  const pendingClosureCount = enrichedCampaigns.filter((campaign) => campaign.status === 'pending').length;

  const filters = [
    {
      label: 'Filter by Status',
      value: campaignFilters.status,
      onChange: (event) => updateCampaignFilters({ status: event.target.value }),
      options: statusOptions,
      placeholder: 'All statuses',
    },
  ];

  const getActions = (campaign) => {
    const actions = [
      {
        label: 'View Details',
        onClick: () => navigate(`/admin/campaigns/${campaign.campaignAddress}`),
      },
    ];

    if (campaign.status === 'active') {
      actions.push({
        label: 'Hold Campaign',
        onClick: () => blockCampaign(campaign.id),
      });
    }

    if (campaign.status === 'on_hold') {
      actions.push({
        label: 'Un-hold Campaign',
        onClick: () => unblockCampaign(campaign.id),
      });
    }

    if (campaign.status === 'pending') {
      actions.push({
        label: 'Approve Closure',
        onClick: () => approveCampaignClosure(campaign.id),
      });
    }

    return actions;
  };

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 mb-6">
          <p className="text-red-800 font-semibold">Error loading campaigns</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {!loading && (
        <>
          <h1 className="text-3xl font-bold mb-4">Campaign Management</h1>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Campaigns"
              value={activeCampaignsCount}
              detail="Currently accepting donations"
              variant="success"
            />
            <StatCard
              label="Closed Campaigns"
              value={closedCampaignsCount}
              detail="Completed or closed campaigns"
              variant="info"
            />
            <StatCard
              label="Admin-Held Campaigns"
              value={onHoldCampaignsCount}
              detail="Campaigns put on hold by admin"
              variant="warning"
            />
            <StatCard
              label="Awaiting Closure Approval"
              value={pendingClosureCount}
              detail="Closure requests pending admin action"
              variant="danger"
            />
          </div>
          <FilterBar
            searchPlaceholder="Search campaigns by title or partner"
            searchValue={campaignFilters.search}
            onSearchChange={(event) => updateCampaignFilters({ search: event.target.value })}
            filters={filters}
            showResults
            resultsCount={filteredCampaigns.length}
            totalCount={enrichedCampaigns.length}
          />

          {enriching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-1.5 bg-gray-100 rounded-full" />
                    <div className="h-9 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-gray-900">No campaigns found</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or status filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCampaigns.map((campaign) => (
                <AdminCampaignCard
                  key={campaign.campaignAddress || campaign.id}
                  campaign={campaign}
                  actions={campaign.campaignAddress ? getActions(campaign) : []}
                  onView={() => navigate(`/admin/campaigns/${campaign.campaignAddress}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCampaigns;

