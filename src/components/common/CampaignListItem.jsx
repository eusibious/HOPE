import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'
import { VerifiedBadge } from '../common'

function CampaignListItem({ title, location, raised, target, ngo, verified, status }) {
  const navigate = useNavigate()
  const progress = Math.min(Math.round((parseInt(raised.replace(/\D/g, '')) / parseInt(target.replace(/\D/g, ''))) * 100), 100)

  const handleViewCampaign = () => {
    // Create a simple ID from the title (replace spaces with hyphens and lowercase)
    const campaignId = title.toLowerCase().replace(/\s+/g, '-')
    navigate(`/campaigns/${campaignId}`)
  }

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-2">{title}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : status === 'closed' 
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {status || 'Active'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{location}</p>
        </div>
        {verified && <VerifiedBadge />}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900">{raised}</span>
          <span className="text-slate-500">{target}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0EA5E9] transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-600">{progress}% funded</p>
      </div>

      <p className="mt-3 text-xs text-slate-500">{ngo}</p>

      <Button variant="ghost" className="mt-4 w-full" onClick={handleViewCampaign}>
        View campaign
      </Button>
    </article>
  )
}

export default CampaignListItem
