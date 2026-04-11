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
      }
    } catch (err) {
      console.error(`Failed to fetch on-chain data for ${campaignAddress}:`, err)
      return {
        goalAmount: 0,
        raisedAmount: 0,
        isActive: false,
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
      <div className="py-8 min-h-[70vh] flex items-center justify-center">
        <p className="text-slate-600">Loading campaigns...</p>
      </div>
    )
  }

  return (
    <div className="py-8">
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
              <CampaignListItem
                key={campaign.id}
                title={campaign.title}
                location={campaign.location}
                raisedAmount={campaign.raisedAmount}
                goalAmount={campaign.goalAmount}
                status={campaign.status}
                campaignAddress={campaign.campaignAddress}
                imageUrl={campaign.imageUrl}
              />
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
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  )
}

export default CampaignList