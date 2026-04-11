import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'
import { VerifiedBadge } from '../common'

function CampaignListItem({
  title,
  location,
  raisedAmount = 0,
  goalAmount = 0,
  status = 'active',
  campaignAddress,
  imageUrl,
}) {
  const navigate = useNavigate()

  const progress =
    goalAmount > 0
      ? Math.min(Math.round((raisedAmount / goalAmount) * 100), 100)
      : 0

  const handleViewCampaign = () => {
    navigate(`/campaigns/${campaignAddress}`)
  }

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md overflow-hidden">
      <div className="h-40 w-full bg-slate-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900 line-clamp-2">{title}</h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : status === 'closed' || status === 'completed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {status || 'active'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{location}</p>
          </div>
          <VerifiedBadge />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">
              ${raisedAmount.toLocaleString()}
            </span>
            <span className="text-slate-500">
              ${goalAmount.toLocaleString()}
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0EA5E9] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-slate-600">{progress}% funded</p>
        </div>

        <Button variant="ghost" className="mt-4 w-full" onClick={handleViewCampaign}>
          View campaign
        </Button>
      </div>
    </article>
  )
}

export default CampaignListItem