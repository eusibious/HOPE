import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { 
    stats, 
    campaigns, 
    partners, 
    loading, 
    error,
    approvePartner,
    blockCampaign,
    unblockCampaign,
    approveCampaignClosure
  } = useAdmin();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const pendingPartnersCount = partners.filter(p => p.status === 'pending').length;
  const approvedPartnersCount = partners.filter(p => p.status === 'approved').length;
  const pendingCampaignsCount = campaigns.filter(c => c.status === 'pending').length;
  const closedCampaignsCount = campaigns.filter(c => c.status === 'closed' || c.status === 'completed').length;
  const adminHeldCount = campaigns.filter(c => c.status === 'on_hold' || c.status === 'blocked').length;

  const dashboardStats = [
    {
      label: 'Pending Partner Approvals',
      value: pendingPartnersCount,
      detail: 'Awaiting review',
      variant: 'warning',
    },
    {
      label: 'Campaigns Awaiting Closure',
      value: pendingCampaignsCount,
      detail: 'Closure requests pending',
      variant: 'danger',
    },
    {
      label: 'Active Campaigns',
      value: campaigns.filter(c => c.status === 'active').length,
      detail: 'Accepting donations',
      variant: 'success',
    },
    {
      label: 'Admin-Held Campaigns',
      value: adminHeldCount,
      detail: 'On hold by admin',
      variant: 'info',
    },
    {
      label: 'Approved Partners',
      value: approvedPartnersCount,
      detail: 'Active partners',
      variant: 'success',
    },
    {
      label: 'Closed Campaigns',
      value: closedCampaignsCount,
      detail: 'Completed or closed',
      variant: 'info',
    },
  ];

  const recentPendingPartners = partners
    .filter(p => p.status === 'pending')
    .slice(0, 5);

  const campaignsAwaitingClosure = campaigns
    .filter(c => c.status === 'pending')
    .slice(0, 5);

  const adminHeldCampaigns = campaigns
    .filter(c => c.status === 'on_hold' || c.status === 'blocked')
    .slice(0, 5);

  const partnerColumns = [
    {
      key: 'organizationName',
      label: 'Partner Name',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, partner) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => approvePartner(partner.id)}
            className="rounded px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => navigate('/admin/partners')}
            className="rounded px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Review
          </button>
        </div>
      ),
    },
  ];

  const campaignClosureColumns = [
    {
      key: 'title',
      label: 'Campaign Title',
    },
    {
      key: 'partnerName',
      label: 'Partner',
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, campaign) => (
        <button
          onClick={() => approveCampaignClosure(campaign.id)}
          className="rounded px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Approve Closure
        </button>
      ),
    },
  ];

  const adminHeldCampaignColumns = [
    {
      key: 'title',
      label: 'Campaign Title',
    },
    {
      key: 'partnerName',
      label: 'Partner',
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, campaign) => (
        <button
          onClick={() => unblockCampaign(campaign.id)}
          className="rounded px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          Release Hold
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {dashboardStats.map(stat => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            detail={stat.detail}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Tables Section */}
      <div className="space-y-8">
        {/* Pending Partners */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Partner Applications</h2>
          <DataTable
            columns={partnerColumns}
            data={recentPendingPartners}
            loading={loading}
            emptyState={{
              title: 'No pending applications',
              description: 'All partner applications have been reviewed.',
            }}
          />
        </div>

        {/* Campaigns Awaiting Closure */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Campaigns Awaiting Closure Approval</h2>
          <DataTable
            columns={campaignClosureColumns}
            data={campaignsAwaitingClosure}
            loading={loading}
            emptyState={{
              title: 'No pending closures',
              description: 'No campaigns are awaiting closure approval.',
            }}
          />
        </div>

        {/* Admin-Held Campaigns */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin-Held Campaigns</h2>
          <DataTable
            columns={adminHeldCampaignColumns}
            data={adminHeldCampaigns}
            loading={loading}
            emptyState={{
              title: 'No held campaigns',
              description: 'No campaigns are currently on hold.',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

