import { useState } from 'react'
import PageContainer from '../../components/common/PageContainer'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import SearchBar from '../../components/forms/SearchBar'
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
      detail: 'Awaiting admin action',
      variant: 'warning',
    },
    {
      label: 'Approved',
      value: stats.partners.approved.toString(),
      detail: 'Active partners',
      variant: 'success',
    },
    {
      label: 'Rejected',
      value: stats.partners.rejected.toString(),
      detail: 'Not approved',
      variant: 'danger',
    },
  ]

  const statusFilters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
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
      maxWidth="full"
    >
      <div className="mb-8 max-w-3xl">
        <p className="text-sm text-slate-600">
          Review and manage partnership applications from humanitarian organizations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statusCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Partner queue</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Keep the review list fast and focused</h2>
            <p className="mt-2 text-sm text-slate-600">
              Search by organization or email, then narrow the queue with a single status filter.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[20rem] lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Showing</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {filteredPartners.length} of {partners.length}
              </p>
              <p className="text-sm text-slate-600">partner applications</p>
            </div>

            <button
              type="button"
              onClick={() => updatePartnerFilters({ search: '', status: '' })}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                partnerFilters.search || partnerFilters.status
                  ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-default'
              }`}
              disabled={!partnerFilters.search && !partnerFilters.status}
            >
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Quick reset</span>
              <span className="mt-1 block font-medium">Clear search and status filters</span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_auto] xl:items-end">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Search
            </label>
            <SearchBar
              placeholder="Search organizations or emails..."
              value={partnerFilters.search}
              onChange={(e) => updatePartnerFilters({ search: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => {
                const isActive = partnerFilters.status === status.value

                return (
                  <button
                    key={status.value || 'all'}
                    type="button"
                    onClick={() => updatePartnerFilters({ status: status.value })}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {status.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
      </section>

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