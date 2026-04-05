import { useState } from 'react'
import { Button } from '../ui'

function AdminPartnerRow({ organizationName, email, walletAddress, submittedDate, status }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const statusStyles = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-[#059669]/10 text-[#059669]',
    rejected: 'bg-red-100 text-red-700',
    reviewing: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
  }

  const handleApprove = () => {
    console.log('Approving:', organizationName)
    setIsDropdownOpen(false)
    // In a real app, this would make an API call
  }

  const handleReject = () => {
    console.log('Rejecting:', organizationName)
    setIsDropdownOpen(false)
    // In a real app, this would make an API call
  }

  const handleViewDetails = () => {
    console.log('Viewing details:', organizationName)
    setIsDropdownOpen(false)
    // In a real app, this would navigate to a detail page
  }

  const truncatedWallet = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`

  return (
    <tr className="border-b border-slate-200 transition-all hover:bg-slate-50">
      <td className="px-6 py-4 text-sm font-medium text-slate-900">{organizationName}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{email}</td>
      <td className="px-6 py-4 text-sm font-mono text-slate-600">{truncatedWallet}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{submittedDate}</td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
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
                    onClick={handleApprove}
                    className="flex w-full items-center px-4 py-2 text-sm font-semibold text-[#059669] hover:bg-[#059669]/5 transition-colors"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
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
                </div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default AdminPartnerRow