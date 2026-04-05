import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'

function AdminCampaignMonitorRow({ campaignName, partner, goal, raised, status, createdDate }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const statusStyles = {
    active: 'bg-[#059669]/10 text-[#059669]',
    blocked: 'bg-red-100 text-red-700',
    completed: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
    pending: 'bg-amber-100 text-amber-700',
  }

  const handleBlock = () => {
    console.log('Blocking campaign:', campaignName)
    setIsDropdownOpen(false)
  }

  const handleUnblock = () => {
    console.log('Unblocking campaign:', campaignName)
    setIsDropdownOpen(false)
  }

  const handleViewDetails = () => {
    // Create a simple ID from the campaign name (replace spaces with hyphens and lowercase)
    const campaignId = campaignName.toLowerCase().replace(/\s+/g, '-')
    navigate(`/admin/campaigns/${campaignId}`)
    setIsDropdownOpen(false)
  }

  const handleEditCampaign = () => {
    console.log('Editing campaign:', campaignName)
    setIsDropdownOpen(false)
  }

  const progressPercentage = Math.round((parseInt(raised.replace(/\$|,|K/g, '')) / parseInt(goal.replace(/\$|,|K/g, ''))) * 100)

  return (
    <tr className="border-b border-slate-200 transition-all hover:bg-slate-50">
      <td className="px-6 py-4 text-sm font-medium text-slate-900">{campaignName}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{partner}</td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{goal}</td>
      <td className="px-6 py-4">
        <div className="text-sm font-semibold text-slate-900">{raised}</div>
        <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#0EA5E9] transition-all"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-slate-500">{progressPercentage}%</div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{createdDate}</td>
      <td className="px-6 py-4 text-right">
        <div className="relative">
          <Button
            variant="ghost"
            className="px-3 py-1 text-xs"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            Actions
            <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </Button>
          
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="py-1">
                  <button
                    onClick={handleViewDetails}
                    className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                  <button
                    onClick={handleEditCampaign}
                    className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Campaign
                  </button>
                  {status === 'blocked' ? (
                    <button
                      onClick={handleUnblock}
                      className="flex w-full items-center px-4 py-2 text-sm font-semibold text-[#059669] hover:bg-[#059669]/5 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={handleBlock}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      Block
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default AdminCampaignMonitorRow