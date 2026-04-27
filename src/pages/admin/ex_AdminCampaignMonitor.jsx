import { useNavigate } from 'react-router-dom'
import PageContainer from '../../components/common/PageContainer'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import FilterBar from '../../components/forms/FilterBar'
import StatusBadge from '../../components/ui/StatusBadge'
import ActionDropdown from '../../components/common/ActionDropdown'
import { useAdmin } from '../../contexts/AdminContext'

function AdminCampaignMonitor() {
  const navigate = useNavigate()
  const { 
    stats, 
    campaignFilters, 
    filteredCampaigns, 
    campaigns, 
    loading,
    updateCampaignFilters,
    blockCampaign,
    unblockCampaign
  } = useAdmin()

  const statusCards = [
    {
      label: 'Active',
      value: stats.campaigns.active.toString(),
      detail: 'Currently fundraising',
    },
    {
      label: 'Pending',
      value: stats.campaigns.pending.toString(),
      detail: 'Awaiting approval',
    },
    {
      label: 'Completed',
      value: stats.campaigns.completed.toString(),
      detail: 'Successfully funded',
    },
    {
      label: 'Blocked',
      value: stats.campaigns.blocked.toString(),
      detail: 'Security concerns',
    },
  ]

  // Get unique partners for filter dropdown
  const uniquePartners = [...new Set(campaigns.map(campaign => campaign.partner))].sort()
  const partnerOptions = [
    { value: '', label: 'All Partners' },
    ...uniquePartners.map(partner => ({ value: partner, label: partner }))
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'blocked', label: 'Blocked' },
  ]

  const filters = [
    {
      label: 'Filter by Partner',
      value: campaignFilters.partner,
      onChange: (value) => updateCampaignFilters({ partner: value }),
      options: partnerOptions,
      placeholder: 'All partners'
    },
    {
      label: 'Filter by Status',
      value: campaignFilters.status,
      onChange: (value) => updateCampaignFilters({ status: value }),
      options: statusOptions,
      placeholder: 'All statuses'
    }
  ]

  const getActions = (campaign) => [
    {
      label: 'View Details',
      variant: 'default',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: () => {
        const campaignId = campaign.campaignName.toLowerCase().replace(/\s+/g, '-')
        navigate(`/admin/campaigns/${campaignId}`)
      }
    },
    {
      label: 'Edit Campaign',
      variant: 'default',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => console.log('Edit campaign:', campaign.campaignName)
    },
    campaign.status === 'blocked' ? {
      label: 'Unblock',
      variant: 'success',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => unblockCampaign(campaign.id)
    } : {
      label: 'Block',
      variant: 'danger',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      onClick: () => blockCampaign(campaign.id)
    }
  ]

  const columns = [
    {
      key: 'campaignName',
      label: 'Campaign Name',
      render: (value) => (
        <div className="font-medium text-slate-900">{value}</div>
      )
    },
    {
      key: 'partner',
      label: 'Partner',
      render: (value) => (
        <div className="text-sm text-slate-600">{value}</div>
      )
    },
    {
      key: 'goal',
      label: 'Goal',
      render: (value) => (
        <div className="text-sm font-semibold text-slate-900">{value}</div>
      )
    },
    {
      key: 'raised',
      label: 'Raised',
      render: (value, campaign) => {
        const progressPercentage = Math.round((parseInt(value.replace(/\$|,|K/g, '')) / parseInt(campaign.goal.replace(/\$|,|K/g, ''))) * 100)
        return (
          <div>
            <div className="text-sm font-semibold text-slate-900">{value}</div>
            <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#0EA5E9] transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">{progressPercentage}%</div>
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      render: (value) => (
        <div className="text-sm text-slate-600">{value}</div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, campaign) => (
        <ActionDropdown actions={getActions(campaign)} />
      )
    }
  ]

  return (
    <PageContainer
      subtitle="Administration"
      title="Campaign Monitor"
    >
      <div className="mb-8">
        <p className="text-sm text-slate-600">
          Monitor and manage all humanitarian campaigns with advanced filtering and controls.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statusCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mb-6">
        <FilterBar
          searchPlaceholder="Search campaigns or partners..."
          searchValue={campaignFilters.search}
          onSearchChange={(e) => updateCampaignFilters({ search: e.target.value })}
          filters={filters}
          showResults={true}
          resultsCount={filteredCampaigns.length}
          totalCount={campaigns.length}
        />
      </div>

      <DataTable
        title="Campaign Monitoring Dashboard"
        description="Comprehensive oversight of all humanitarian campaigns"
        columns={columns}
        data={filteredCampaigns}
        loading={loading.campaigns}
        emptyState={{
          title: 'No campaigns found',
          description: 'No campaigns match your current filters.'
        }}
      />
    </PageContainer>
  )
}

export default AdminCampaignMonitor