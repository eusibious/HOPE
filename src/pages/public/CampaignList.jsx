import { useState, useEffect } from 'react'
import { Pagination } from '../../components/ui'
import SearchBar from '../../components/forms/SearchBar'
import { CampaignListItem } from '../../components/common'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { ethers } from 'ethers'
import HOPECampaignABI from '../../abi/HOPECampaign.json'

function CampaignList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [allCampaigns, setAllCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const getRpcProvider = () => {
    const rpcUrl = import.meta.env.VITE_RPC_URL
    if (!rpcUrl) throw new Error('VITE_RPC_URL is not set')
    return new ethers.JsonRpcProvider(rpcUrl)
  }

  const fetchLiveCampaignData = async (campaignAddress, provider) => {
    try {
      const contract = new ethers.Contract(
        campaignAddress,
        HOPECampaignABI.abi,
        provider
      )

      const details = await contract.getCampaignDetails()

      return {
        goalAmount: Number(ethers.formatUnits(details._goalAmount.toString(), 6)),
        raisedAmount: Number(ethers.formatUnits(details._raisedAmount.toString(), 6)),
        isActive: details._isActive,
        donationsOpen: details[13] || false,
      }
    } catch (err) {
      console.error(`Failed to fetch on-chain data for ${campaignAddress}:`, err)
      return {
        goalAmount: 0,
        raisedAmount: 0,
        isActive: false,
        donationsOpen: false,
      }
    }
  }

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'campaigns'))
        const provider = getRpcProvider()

        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const enrichedCampaigns = await Promise.all(
          docs.map(async (campaign) => {
            const live = campaign.campaignAddress
              ? await fetchLiveCampaignData(campaign.campaignAddress, provider)
              : { goalAmount: 0, raisedAmount: 0, isActive: false }

            return {
              id: campaign.id,
              title: campaign.title || 'Untitled Campaign',
              location: campaign.location || 'Unknown Location',
              category: campaign.category || 'Uncategorized',
              imageUrl: campaign.imageUrl || '',
              campaignAddress: campaign.campaignAddress,
              goalAmount: live.goalAmount || Number(campaign.goalAmount || 0) / 1e6,
              raisedAmount: live.raisedAmount || 0,
              status: live.isActive ? 'active' : 'completed',
              donationsOpen: live.donationsOpen || false,
            }
          })
        )

        const uniqueCampaigns = Array.from(
          new Map(
            enrichedCampaigns
              .filter((item) => item.campaignAddress)
              .map((item) => [item.campaignAddress.toLowerCase(), item])
          ).values()
        )

        setAllCampaigns(uniqueCampaigns)
      } catch (err) {
        console.error('Error fetching campaigns:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const filteredCampaigns = allCampaigns.filter((campaign) => {
    const q = searchQuery.toLowerCase().trim()

    if (!q) return true

    return (
      campaign.title.toLowerCase().includes(q) ||
      campaign.location.toLowerCase().includes(q)
    )
  })

  const itemsPerPage = 8
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="w-screen bg-[#0A0F1E] font-sans min-h-screen flex items-center justify-center">
        <p className="text-[#6B8CAE] text-lg">Loading campaigns...</p>
      </div>
    )
  }

  return (
    <div className="w-screen bg-[#0A0F1E] font-sans min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-[#E8EDF5] mb-3">
            All Campaigns
          </h1>
          <p className="text-[#6B8CAE] text-lg">
            Browse active and completed humanitarian initiatives
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
          />
        </div>

        {/* Stats Section */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-[#6B8CAE]">
            Showing <span className="font-semibold text-[#E8EDF5]">{paginatedCampaigns.length}</span> of{' '}
            <span className="font-semibold text-[#E8EDF5]">{filteredCampaigns.length}</span> campaigns
          </p>
          {totalPages > 0 && (
            <div className="text-xs text-[#6B8CAE]">Page {currentPage} of {totalPages}</div>
          )}
        </div>

        {/* Campaigns Grid or Empty State */}
        {allCampaigns.length === 0 ? (
          <div className="rounded-xl border border-[#1E2D42] bg-[#111827] p-16 text-center">
            <div className="w-16 h-16 bg-[#1E2D42] rounded-full mx-auto mb-6 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#2D4A6F] border-dashed rounded-lg"></div>
            </div>
            <h3 className="text-lg font-semibold text-[#E8EDF5] mb-2">No campaigns available yet</h3>
            <p className="text-base text-[#6B8CAE] mb-1">Campaigns will appear here once they are created and approved.</p>
            <p className="text-sm text-[#6B8CAE]">Check back soon for humanitarian initiatives to support.</p>
          </div>
        ) : paginatedCampaigns.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
              {paginatedCampaigns.map((campaign) => (
                <CampaignListItem
                  key={campaign.id}
                  title={campaign.title}
                  location={campaign.location}
                  raisedAmount={campaign.raisedAmount}
                  goalAmount={campaign.goalAmount}
                  status={campaign.status}
                  campaignAddress={campaign.campaignAddress}
                  imageUrl={campaign.imageUrl}
                  donationsOpen={campaign.donationsOpen}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-[#1E2D42] bg-[#111827] p-12 text-center">
            <p className="text-base text-[#6B8CAE]">No campaigns found matching your search.</p>
            <p className="mt-1 text-sm text-[#6B8CAE]">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CampaignList