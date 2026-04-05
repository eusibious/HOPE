import { useState } from 'react'
import PageContainer from '../../components/common/PageContainer'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import FilterBar from '../../components/forms/FilterBar'
import StatusBadge from '../../components/ui/StatusBadge'
import PartnerDetailsModal from '../../components/admin/PartnerDetailsModal'
import { useAdmin } from '../../contexts/AdminContext'

function AdminPartnerRequests() {
  const [selectedPartner, setSelectedPartner] = useState(null)
  
  const { 
    stats, 
    partnerFilters, 
    filteredPartners, 
    partners, 
    loading,
    updatePartnerFilters,
    approvePartner,
    rejectPartner
  } = useAdmin()

  const statusCards = [
    {
      label: 'Pending Review',
      value: stats.partners.pending.toString(),
      detail: 'Awaiting evaluation',
    },
    {
      label: 'Under Review',
      value: stats.partners.reviewing.toString(),
      detail: 'Currently evaluating',
    },
    {
      label: 'Approved',
      value: stats.partners.approved.toString(),
      detail: 'Active partners',
    },
    {
      label: 'Rejected',
      value: stats.partners.rejected.toString(),
      detail: 'Not approved',
    },
  ]

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  const filters = [
    {
      label: 'Filter by Status',
      value: partnerFilters.status,
      onChange: (value) => updatePartnerFilters({ status: value }),
      options: statusOptions,
      placeholder: 'All statuses'
    }
  ]

  const getActions = (partner) => [
    {
      label: 'Approve',
      variant: 'success',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      onClick: () => approvePartner(partner.id),
      disabled: partner.status === 'approved'
    },
    {
      label: 'Reject',
      variant: 'danger',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      onClick: () => rejectPartner(partner.id),
      disabled: partner.status === 'rejected'
    },
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
        setSelectedPartner(partner)
      }
    }
  ]

  const columns = [
    {
      key: 'organizationName',
      label: 'Organization Name',
      render: (value) => (
        <div className="font-medium text-slate-900">{value}</div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="text-sm text-slate-600">{value}</div>
      )
    },
    // {
    //   key: 'walletAddress',
    //   label: 'Wallet Address',
    //   render: (value) => (
    //     <div className="text-sm font-mono text-slate-600">
    //       {`${value.slice(0, 8)}...${value.slice(-6)}`}
    //     </div>
    //   )
    // },
    {
      key: 'submittedDate',
      label: 'Submitted Date',
      render: (value) => (
        <div className="text-sm text-slate-600">{value}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, partner) => (
        <button
          onClick={() => setSelectedPartner(partner)}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        >
          View Details
        </button>
      )
    }
  ]

  return (
    <PageContainer
      subtitle="Administration"
      title="Partner Requests"
    >
      <div className="mb-8">
        <p className="text-sm text-slate-600">
          Review and manage partnership applications from humanitarian organizations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statusCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mb-6">
        <FilterBar
          searchPlaceholder="Search organizations or emails..."
          searchValue={partnerFilters.search}
          onSearchChange={(e) => updatePartnerFilters({ search: e.target.value })}
          filters={filters}
          showResults={true}
          resultsCount={filteredPartners.length}
          totalCount={partners.length}
        />
      </div>

      <DataTable
        title="Partnership Applications"
        description="Review credentials and approve qualified humanitarian organizations"
        columns={columns}
        data={filteredPartners}
        loading={loading.partners}
        emptyState={{
          title: 'No partner requests found',
          description: 'No partnership applications match your current filters.'
        }}
      />

      {/* Partner Details Modal */}
      <PartnerDetailsModal
        isOpen={!!selectedPartner}
        partner={selectedPartner}
        onClose={() => setSelectedPartner(null)}
        onApprove={approvePartner}
        onReject={rejectPartner}
      />
    </PageContainer>
  )
}

export default AdminPartnerRequests