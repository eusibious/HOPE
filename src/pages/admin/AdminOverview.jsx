import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import PageContainer from '../../components/common/PageContainer'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAdmin } from '../../contexts/AdminContext'

function AdminOverview() {
  const { stats, campaigns, partners, loading } = useAdmin()

  const adminStats = [
    {
      label: 'Pending Partner Requests',
      value: stats.partners.pending.toString(),
      detail: `${stats.partners.reviewing} under review`,
    },
    {
      label: 'Active Campaigns',
      value: stats.campaigns.active.toString(),
      detail: 'All verified and monitored',
    },
    {
      label: 'Blocked Campaigns',
      value: stats.campaigns.blocked.toString(),
      detail: stats.campaigns.blocked > 0 ? 'Requires attention' : 'Clean security status',
    },
    {
      label: 'Total Fundraising',
      value: '$0',
      detail: '+$0 this month',
    },
  ]

  // Keep recent activity blank for now - will show system changes when available
  const recentActivity = []

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div>
          <div className="font-medium text-slate-900">{value}</div>
          <div className="text-xs text-slate-500 capitalize">{row.type}</div>
        </div>
      )
    },
    {
      key: 'partner',
      label: 'Partner/Email',
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
      key: 'amount',
      label: 'Amount',
      render: (value) => (
        <div className="text-sm font-semibold text-slate-900">{value}</div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => (
        <div className="text-sm text-slate-600">{value}</div>
      )
    }
  ]

  return (
    <PageContainer
      subtitle="Administration"
      title="Master Admin Dashboard"
    >
      <div className="mb-8">
        <p className="text-sm text-slate-600">
          Monitor and manage all humanitarian campaigns, partner requests, and platform operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <DataTable
        title="Recent Activity"
        description="System changes and platform activities will be displayed here"
        columns={columns}
        data={recentActivity}
        loading={false}
        emptyState={{
          title: 'No recent activity',
          description: 'System changes and platform activities will appear here when available.'
        }}
      />
    </PageContainer>
  )
}

export default AdminOverview