import { Button } from '../../components/ui'
import { VerifiedBadge, ProgressStat, TimelineItem, TransactionRow } from '../../components/common'
import { useNavigate } from 'react-router-dom'

function CampaignDetail() {
  const navigate = useNavigate()
  const campaign = {
    title: 'Horn of Africa Drought Response',
    location: 'Ethiopia · Kenya · Somalia',
    ngo: 'International Humanitarian Alliance',
    banner:
      'https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=1200&h=400&fit=crop',
    description:
      'The Horn of Africa is facing an unprecedented drought crisis, affecting millions of people across pastoral and farming communities. This campaign provides immediate emergency relief including water, food, and medical supplies, while supporting long-term resilience through livestock protection and community water infrastructure.',
    raised: '$0',
    target: '$0',
    progress: 0,
    beneficiaries: '0',
    duration: '6 months',
    verified: true,
  }

  const progressStats = [
    { label: 'Raised', value: campaign.raised },
    { label: 'Target', value: campaign.target },
    { label: 'Progress', value: `${campaign.progress}%` },
    { label: 'Beneficiaries', value: campaign.beneficiaries },
  ]

  const timeline = [
    {
      date: 'Feb 2026',
      title: 'Campaign launched',
      description: 'Global appeal issued with verified needs assessment',
      status: 'completed',
    },
    {
      date: 'Feb 2026',
      title: 'Initial funding received',
      description: '$0 in first week from 0 donors',
      status: 'completed',
    },
    {
      date: 'Mar 2026',
      title: 'Field deployment',
      description: 'Water trucks and medical teams deployed to 12 locations',
      status: 'current',
    },
    {
      date: 'Apr-May 2026',
      title: 'Infrastructure setup',
      description: 'Community water points and health centers established',
      status: 'pending',
    },
    {
      date: 'Jun 2026',
      title: 'Impact assessment',
      description: 'Independent verification and final reporting',
      status: 'pending',
    },
  ]

  const recentTransactions = [
    {
      date: '2026-02-19 14:32',
      campaign: 'Horn of Africa Drought Response',
      amount: '$0',
      status: 'completed',
      type: 'outbound',
    },
    {
      date: '2026-02-18 16:53',
      campaign: 'Horn of Africa Drought Response',
      amount: '$0',
      status: 'completed',
      type: 'inbound',
    },
    {
      date: '2026-02-17 11:22',
      campaign: 'Horn of Africa Drought Response',
      amount: '$0',
      status: 'completed',
      type: 'outbound',
    },
    {
      date: '2026-02-16 09:18',
      campaign: 'Horn of Africa Drought Response',
      amount: '$0',
      status: 'completed',
      type: 'inbound',
    },
    {
      date: '2026-02-15 14:45',
      campaign: 'Horn of Africa Drought Response',
      amount: '$0',
      status: 'completed',
      type: 'outbound',
    },
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {campaign.location}
                </p>
                <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                  {campaign.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <VerifiedBadge />
                  <span className="text-sm text-slate-600">{campaign.ngo}</span>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  className="w-full sm:w-auto"
                  onClick={() => navigate('/donate')}
                >
                  Donate now
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-5">
              {progressStats.map((stat) => (
                <ProgressStat key={stat.label} {...stat} />
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900">
                Funding progress
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#0EA5E9] transition-all"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {campaign.progress}%
                </span>
              </div>
            </div>
          </article>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">About this campaign</h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              {campaign.description}
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Transparency commitment
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#059669]" />
                  <span>Real-time fund tracking with on-chain verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#059669]" />
                  <span>Monthly impact reports with location and beneficiary data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#059669]" />
                  <span>Independent third-party audits at key milestones</span>
                </li>
              </ul>
            </div>
          </div>

          {/* <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Campaign timeline</h2>
            <div className="mt-6 border-l-2 border-slate-200 pl-0">
              {timeline.map((item, idx) => (
                <div key={idx} className="-ml-[9px] mb-6">
                  <TimelineItem {...item} />
                </div>
              ))}
            </div>
          </div> */}

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4 sm:px-8">
              <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-600">
                All verified fund movements for this campaign
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-600 sm:px-8">
                      Date
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600 sm:px-8">
                      Campaign
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600 sm:px-8">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-600 sm:px-8">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx, idx) => (
                    <TransactionRow key={idx} {...tx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
   
  )
}

export default CampaignDetail
