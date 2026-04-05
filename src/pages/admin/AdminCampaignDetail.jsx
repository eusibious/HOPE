import { useParams, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import ProgressStat from '../../components/common/ProgressStat'
import TransactionRow from '../../components/common/TransactionRow'
import PageContainer from '../../components/common/PageContainer'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAdmin } from '../../contexts/AdminContext'

function AdminCampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { blockCampaign, unblockCampaign } = useAdmin()

  // Mock data - in a real app, this would fetch based on the ID
  const campaignData = {
    'emergency-food-aid': {
      id: 'camp-001',
      title: 'Emergency Food Aid',
      partner: 'World Food Program',
      goal: '$0',
      raised: '$0',
      status: 'active',
      createdDate: '2026-02-15',
      description: 'Providing emergency food assistance to displaced families in Somalia affected by severe drought conditions.',
      beneficiaries: '0',
      duration: '6 months',
      location: 'Somalia',
    },
    'clean-water-wells': {
      id: 'camp-002',
      title: 'Clean Water Wells',
      partner: 'Water for Life',
      goal: '$0',
      raised: '$0',
      status: 'active',
      createdDate: '2026-02-12',
      description: 'Building sustainable water infrastructure in rural Kenya to provide clean drinking water access.',
      beneficiaries: '0',
      duration: '4 months',
      location: 'Kenya',
    },
    'school-supplies': {
      id: 'camp-003',
      title: 'School Supplies',
      partner: 'Education First',
      goal: '$0',
      raised: '$0',
      status: 'active',
      createdDate: '2026-02-10',
      description: 'Providing essential educational materials and supplies to children in underserved communities.',
      beneficiaries: '0',
      duration: '3 months',
      location: 'Bangladesh',
    },
    'medical-clinic': {
      id: 'camp-004',
      title: 'Medical Clinic',
      partner: 'Doctors Without Borders',
      goal: '$0',
      raised: '$0',
      status: 'active',
      createdDate: '2026-02-08',
      description: 'Establishing a mobile medical clinic to provide healthcare services in remote areas affected by recent disasters.',
      beneficiaries: '0',
      duration: '8 months',
      location: 'Haiti',
    },
    'refugee-support-fund': {
      id: 'camp-005',
      title: 'Refugee Support Fund',
      partner: 'UNHCR',
      goal: '$0', 
      raised: '$0',
      status: 'pending',
      createdDate: '2026-02-19',
      description: 'Comprehensive support program for refugee communities including shelter, food, and integration services.',
      beneficiaries: '0',
      duration: '12 months',
      location: 'Jordan',
    },
    'fraudulent-aid-scheme': {
      id: 'camp-006',
      title: 'Fraudulent Aid Scheme',
      partner: 'Suspicious Organization',
      goal: '$0',
      raised: '$0',
      status: 'blocked',
      createdDate: '2026-02-01',
      description: 'SECURITY ALERT: This campaign has been blocked due to suspicious activity and potential fraud indicators.',
      beneficiaries: '0',
      duration: 'Unknown',
      location: 'Unknown',
    },
  }

  const campaign = campaignData[id] || {
    id: 'unknown',
    title: 'Campaign Not Found',
    partner: 'Unknown',
    goal: '$0',
    raised: '$0',
    status: 'unknown',
    createdDate: 'Unknown',
    description: 'Campaign details not available.',
    beneficiaries: '0',
    duration: 'Unknown',
    location: 'Unknown',
  }

  const progress = Math.round((parseInt(campaign.raised.replace(/\$|,/g, '')) / parseInt(campaign.goal.replace(/\$|,/g, ''))) * 100)

  const progressStats = [
    { label: 'Raised', value: campaign.raised },
    { label: 'Goal', value: campaign.goal },
    { label: 'Progress', value: `0%` },
    { label: 'Beneficiaries', value: campaign.beneficiaries },
  ]

  const donationStats = [
    { label: 'Total Donors', value: '0', detail: '+0 this week' },
    { label: 'Average Donation', value: '$0', detail: 'Median: $0' },
    { label: 'Largest Donation', value: '$0', detail: 'No donations yet' },
    { label: 'Recent Activity', value: '0', detail: 'No donations' },
  ]

  const recentTransactions = [
    {
      date: '2026-02-20 09:45',
      campaign: campaign.title,
      amount: '$0',
      status: 'completed',
      type: 'inbound',
    },
    {
      date: '2026-02-20 06:22',
      campaign: campaign.title,
      amount: '$0',
      status: 'completed',
      type: 'inbound',
    },
    {
      date: '2026-02-19 18:15',
      campaign: campaign.title,
      amount: '$0',
      status: 'completed',
      type: 'inbound',
    },
    {
      date: '2026-02-19 14:33',
      campaign: campaign.title,
      amount: '$0',
      status: 'processing',
      type: 'inbound',
    },
    {
      date: '2026-02-19 11:28',
      campaign: campaign.title,
      amount: '$0',
      status: 'completed',
      type: 'inbound',
    },
  ]

  const handleBlock = () => {
    blockCampaign(campaign.id)
    alert(`Campaign "${campaign.title}" has been blocked.`)
  }

  const handleUnblock = () => {
    unblockCampaign(campaign.id)
    alert(`Campaign "${campaign.title}" has been unblocked.`)
  }

  const breadcrumb = (
    <Button variant="ghost" onClick={() => navigate('/admin/campaigns')}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Campaign Monitor
    </Button>
  )

  return (
    <PageContainer
      subtitle="Campaign Details"
      title={campaign.title}
      breadcrumb={breadcrumb}
    >
      {/* Campaign Header Card */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{campaign.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{campaign.location}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">{campaign.partner}</span>
                  <StatusBadge status={campaign.status} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">{campaign.description}</p>
          </div>
          
          <div className="w-full lg:w-auto">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900">{campaign.raised}</span>
                <span className="text-slate-500">of {campaign.goal}</span>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-slate-200 lg:w-64">
                <div
                  className="h-full rounded-full bg-[#0EA5E9] transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">0% of goal reached</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {progressStats.map((stat) => (
            <ProgressStat key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          {/* Donation Stats Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Donation Statistics</h3>
            <p className="mt-1 text-sm text-slate-600">Detailed insights into donation patterns and performance</p>
            
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {donationStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-600">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
              <p className="mt-1 text-sm text-slate-600">
                Latest donation activity for this campaign
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-600">Date</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Campaign</th>
                    <th className="px-6 py-3 font-semibold text-slate-600">Amount</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction, index) => (
                    <TransactionRow key={index} {...transaction} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Admin Action Panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Admin Actions</h3>
            <p className="mt-1 text-sm text-slate-600">
              Campaign management and security controls
            </p>
            
            <div className="mt-6 space-y-4">
              {campaign.status === 'blocked' ? (
                <Button 
                  variant="primary" 
                  className="w-full bg-[#059669] hover:bg-[#059669]/90 focus-visible:outline-[#059669]"
                  onClick={handleUnblock}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Unblock Campaign
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full bg-red-600 hover:bg-red-700 focus-visible:outline-red-600"
                  onClick={handleBlock}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  Block Campaign
                </Button>
              )}
              
              {/* <Button variant="ghost" className="w-full">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Campaign
              </Button> */}
              
              <Button variant="ghost" className="w-full">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-4 w-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Security Notice</p>
                <p className="mt-1 text-xs text-amber-700">
                  All administrative actions are logged and auditable. Use blocking functionality only for security violations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default AdminCampaignDetail