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
  donationsOpen = false,
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
    <article className="flex flex-col rounded-xl border border-[#1E2D42] bg-[#111827] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#2D4A6F] overflow-hidden">
      <div className="h-40 w-full bg-[#1E2D42] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#2D4A6F]">
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
              <h3 className="text-base font-semibold text-[#E8EDF5] line-clamp-2">{title}</h3>
              <div className="flex items-center gap-1 flex-wrap">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    status === 'active'
                      ? 'bg-[#4FC3A1]/15 text-[#4FC3A1]'
                      : status === 'closed' || status === 'completed'
                      ? 'bg-[#6B8CAE]/15 text-[#6B8CAE]'
                      : 'bg-[#6B8CAE]/15 text-[#6B8CAE]'
                  }`}
                >
                  {status || 'active'}
                </span>
                {status === 'active' && !donationsOpen && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/15 text-amber-400 whitespace-nowrap">
                    Donations closed
                  </span>
                )}
                {status === 'active' && donationsOpen && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/15 text-green-400 whitespace-nowrap">
                    Accepting donations
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-[#6B8CAE]">{location}</p>
          </div>
          <VerifiedBadge />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#E8EDF5]">
              ${raisedAmount.toLocaleString()}
            </span>
            <span className="text-[#6B8CAE]">
              ${goalAmount.toLocaleString()}
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-[#1E2D42] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#4FC3A1] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-[#6B8CAE]">{progress}% funded</p>
        </div>

        <Button variant="ghost" className="mt-4 w-full text-[#4FC3A1] hover:text-[#E8EDF5] hover:bg-[#1E2D42]" onClick={handleViewCampaign}>
          View campaign
        </Button>
      </div>
    </article>
  )
}

export default CampaignListItem