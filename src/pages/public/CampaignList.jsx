import { useState } from 'react'
import { Pagination } from '../../components/ui'
import SearchBar from '../../components/forms/SearchBar'
import FilterPanel from '../../components/forms/FilterPanel'
import { CampaignListItem, StatCard } from '../../components/common'

function CampaignList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: [],
    fundingLevel: [],
    region: []
  })

  const dashboardStats = [
    {
      label: 'Total Campaigns Hosted',
      value: '0',
      detail: 'Campaigns currently active on platform'
    },
    {
      label: 'Active Campaigns',
      value: '0',
      detail: 'Currently accepting donations'
    },
    {
      label: 'Total Raised',
      value: '$0',
      detail: 'Across all campaigns'
    }
  ]

  const allCampaigns = []

  // Helper function to calculate funding percentage
  const getFundingPercentage = (raised, target) => {
    const raisedNum = parseFloat(raised.replace(/[$KM,]/g, '')) * (raised.includes('M') ? 1000000 : raised.includes('K') ? 1000 : 1)
    const targetNum = parseFloat(target.replace(/[$KM,]/g, '')) * (target.includes('M') ? 1000000 : target.includes('K') ? 1000 : 1)
    return (raisedNum / targetNum) * 100
  }

  // Helper function to get region from location
  const getRegion = (location) => {
    const regionMap = {
      'Somalia': 'Africa',
      'Kenya': 'Africa', 
      'Uganda': 'Africa',
      'Bangladesh': 'Asia',
      'Nepal': 'Asia',
      'Haiti': 'Americas',
      'Philippines': 'Asia',
      'Yemen': 'Middle East'
    }
    return regionMap[location] || 'Other'
  }

  const filteredCampaigns = allCampaigns.filter((campaign) => {
    // Search filter
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter
    const matchesStatus = filters.status.length === 0 || 
      filters.status.some(status => {
        if (status.toLowerCase() === 'active') return campaign.status === 'active'
        if (status.toLowerCase() === 'closed') return campaign.status === 'closed'
        if (status.toLowerCase() === 'planned') return campaign.status === 'planned'
        return false
      })
    
    // Funding level filter
    const matchesFundingLevel = filters.fundingLevel.length === 0 ||
      filters.fundingLevel.some(level => {
        const percentage = getFundingPercentage(campaign.raised, campaign.target)
        if (level === '0-50%') return percentage >= 0 && percentage < 50
        if (level === '50-75%') return percentage >= 50 && percentage < 75
        if (level === '75-100%') return percentage >= 75 && percentage < 100
        if (level === '100%+') return percentage >= 100
        return false
      })
    
    // Region filter
    const matchesRegion = filters.region.length === 0 ||
      filters.region.includes(getRegion(campaign.location))
    
    return matchesSearch && matchesStatus && matchesFundingLevel && matchesRegion
  })

  const itemsPerPage = 8
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="py-8">
      {/* Platform Analytics Dashboard - Same as Home */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard label="Total Campaigns Hosted" value="0" detail="Campaigns currently active on platform" />
            <StatCard label="Active Campaigns" value="0" detail="Currently accepting donations" />
            <StatCard label="Partners Collaborated" value="0" detail="Verified humanitarian organizations" />
            <StatCard label="Beneficiaries Onboarded" value="0" detail="People reached through our network" />
          </div>
        </div>
      </section>

      {/* Campaign List Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          All Campaigns
        </h1>
        <p className="mt-1 text-slate-600">
          Browse active and completed humanitarian initiatives
        </p>
      </div>

        <div className="mb-8 relative">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <SearchBar 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <div className="relative z-10">
              <FilterPanel filters={filters} onFilterChange={setFilters} />
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{paginatedCampaigns.length}</span> of{' '}
            <span className="font-semibold">{filteredCampaigns.length}</span> campaigns
          </p>
          {totalPages > 0 && (
            <div className="text-xs text-slate-500">Page {currentPage} of {totalPages}</div>
          )}
        </div>

        {allCampaigns.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-300 border-dashed rounded-lg"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No campaigns available yet</h3>
            <p className="text-base text-slate-600 mb-1">Campaigns will appear here once they are created and approved.</p>
            <p className="text-sm text-slate-500">Check back soon for humanitarian initiatives to support.</p>
          </div>
        ) : paginatedCampaigns.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedCampaigns.map((campaign) => (
                <CampaignListItem key={campaign.title} {...campaign} />
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-base text-slate-600">No campaigns found matching your search.</p>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search terms.</p>
          </div>
        )}
    </div>
    
    
  )
}

export default CampaignList
