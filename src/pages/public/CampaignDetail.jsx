import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import PreviewModal from '../../components/common/PreviewModal'
import { Button } from '../../components/ui'
import { VerifiedBadge, ProgressStat } from '../../components/common'
import { ethers } from 'ethers'
import HOPECampaignABI from '../../abi/HOPECampaign.json'

function CampaignDetail() {
  const navigate = useNavigate()
  const { address } = useParams()

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showImage, setShowImage] = useState(false)
  const [showDoc, setShowDoc] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState([])

  const getRpcProvider = () => {
    const rpcUrl = import.meta.env.VITE_RPC_URL
    if (!rpcUrl) {
      throw new Error('VITE_RPC_URL is not set')
    }
    return new ethers.JsonRpcProvider(rpcUrl)
  }

  const formatUSDC = (baseUnits) =>
    Number(ethers.formatUnits((baseUnits ?? '0').toString(), 6))

  const formatDate = (value) => {
    if (!value) return 'N/A'

    if (value?.seconds) {
      return new Date(value.seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }

    const asString = value.toString()

    // unix timestamp from chain
    if (/^\d+$/.test(asString)) {
      return new Date(Number(asString) * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getDisplayStatus = (firestoreStatus, isActive) => {
    if (firestoreStatus === 'paused') return 'paused'
    if (firestoreStatus === 'closed') return 'closed'
    if (firestoreStatus === 'completed') return 'completed'
    if (isActive === false) return 'completed'
    return 'active'
  }

  const fetchOnChainData = async (campaignAddress) => {
    try {
      const provider = getRpcProvider()
      await provider.getNetwork()

      const contract = new ethers.Contract(
        campaignAddress,
        HOPECampaignABI.abi,
        provider
      )

      const details = await contract.getCampaignDetails()

      return {
        raisedAmount: details._raisedAmount.toString(),
        goalAmount: details._goalAmount.toString(),
        deadline: details._deadline.toString(),
        isActive: details._isActive,
        beneficiaryCount: Number(details._beneficiaryCount),
        claimedCount: Number(details._claimedCount),
        documentCID: details._documentCID,
      }
    } catch (err) {
      console.error('Blockchain fetch failed:', err)
      return null
    }
  }

  const fetchRecentActivity = async (campaignAddress) => {
    try {
      const provider = getRpcProvider()
      const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider)

      const donationFilter = contract.filters.DonationReceived()

      const events = await contract.queryFilter(donationFilter, 0, 'latest')

      const items = await Promise.all(
        events.slice().reverse().map(async (event) => {
          const block = await provider.getBlock(event.blockNumber)

          return {
            date: block?.timestamp
              ? new Date(block.timestamp * 1000).toLocaleDateString('en-IN')
              : 'N/A',
            from: event.args.donor,
            to: campaignAddress,
            amount: `+$${formatUSDC(event.args.amount).toLocaleString()}`,
            txHash: event.transactionHash,
            status: 'Received',
          }
        })
      )

      setRecentTransactions(items)
    } catch (err) {
      console.error('Recent activity fetch failed:', err)
      setRecentTransactions([])
    }
  }

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'campaigns'))

        const found = snapshot.docs.find((docSnap) => {
          return docSnap.data().campaignAddress === address
        })

        if (!found) {
          console.error('Campaign not found')
          setCampaign(null)
          return
        }

        const data = found.data()

        const baseData = {
          title: data.title,
          location: data.location,
          description: data.description,
          imageUrl: data.imageUrl,
          goalAmount: data.goalAmount || '0',
          createdBy: data.createdBy,
          campaignAddress: data.campaignAddress,
          category: data.category,
          deadline: data.deadline,
          documentCID: data.documentCID,
          createdAt: data.createdAt,
          status: data.status || 'active',
        }

        await fetchRecentActivity(data.campaignAddress)

        const chainData = await fetchOnChainData(data.campaignAddress)

        const displayStatus = getDisplayStatus(
          baseData.status,
          chainData?.isActive
        )

        setCampaign({
          ...baseData,
          raisedAmount: chainData?.raisedAmount || '0',
          goalAmount: chainData?.goalAmount || baseData.goalAmount || '0',
          deadline: chainData?.deadline || baseData.deadline,
          documentCID: chainData?.documentCID || baseData.documentCID,
          isActive: chainData?.isActive ?? false,
          beneficiaryCount: chainData?.beneficiaryCount || 0,
          claimedCount: chainData?.claimedCount || 0,
          status: displayStatus,
        })
      } catch (err) {
        console.error(err)
        setCampaign(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()
  }, [address])

  const raised = useMemo(
    () => (campaign?.raisedAmount ? formatUSDC(campaign.raisedAmount) : 0),
    [campaign]
  )

  const target = useMemo(
    () => (campaign?.goalAmount ? formatUSDC(campaign.goalAmount) : 0),
    [campaign]
  )

  const progress = target > 0
    ? Math.min(Math.round((raised / target) * 100), 100)
    : 0

  const donateDisabled =
    !campaign ||
    campaign.status === 'paused' ||
    campaign.status === 'closed' ||
    campaign.status === 'completed' ||
    campaign.isActive === false

  const donateButtonLabel =
    campaign?.status === 'paused'
      ? 'Campaign Paused'
      : campaign?.status === 'closed'
      ? 'Campaign Closed'
      : campaign?.status === 'completed' || campaign?.isActive === false
      ? 'Campaign Ended'
      : 'Donate now'

  const statusBadgeClass =
    campaign?.status === 'active'
      ? 'bg-green-100 text-green-800'
      : campaign?.status === 'paused'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-gray-100 text-gray-800'

  const progressStats = [
    { label: 'Raised', value: `$${raised.toLocaleString()}` },
    { label: 'Target', value: `$${target.toLocaleString()}` },
    { label: 'Progress', value: `${progress}%` },
    { label: 'Beneficiaries', value: campaign?.beneficiaryCount || 0 },
    { label: 'Claims', value: campaign?.claimedCount || 0 },
  ]

  if (loading) return <div>Loading...</div>
  if (!campaign) return <div>Campaign not found</div>

  return (
    <div className="min-h-screen py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="h-64 w-full overflow-hidden rounded-2xl relative">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-3 right-3 px-2 py-1 text-xs rounded-full ${statusBadgeClass}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500">{campaign.category}</p>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-2">
                    {campaign.title}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">{campaign.location}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <VerifiedBadge />
                    <span className="text-sm text-slate-600 break-all">
                      {campaign.createdBy}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/donate/${address}`)}
                  disabled={donateDisabled}
                  className={donateDisabled ? 'opacity-60 cursor-not-allowed' : ''}
                >
                  {donateButtonLabel}
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-5">
              {progressStats.map((stat) => (
                <ProgressStat key={stat.label} {...stat} />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Campaign Address</p>
                <p className="font-mono break-all">{campaign.campaignAddress}</p>
              </div>

              <div>
                <p className="text-slate-500">Deadline</p>
                <p>{formatDate(campaign.deadline)}</p>
              </div>

              <div>
                <p className="text-slate-500">Created At</p>
                <p>{formatDate(campaign.createdAt)}</p>
              </div>

              <div>
                <p className="text-slate-500">Category</p>
                <p>{campaign.category}</p>
              </div>

              <div>
                <p className="text-slate-500">Campaign Image</p>
                <button
                  onClick={() => setShowImage(true)}
                  className="text-blue-600 underline text-sm"
                >
                  View Image
                </button>
              </div>

              <div>
                <p className="text-slate-500">Verification Document</p>
                <button
                  onClick={() => setShowDoc(true)}
                  className="text-blue-600 underline text-sm"
                >
                  View Document
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900">
                Funding progress
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#0EA5E9] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {progress}%
                </span>
              </div>
            </div>
          </article>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">About this campaign</h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              {campaign.description}
            </p>
          </div>

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
                    <th className="px-6 py-3 font-semibold text-slate-600 sm:px-8">Date</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 sm:px-8">Addresses</th>
                    <th className="px-6 py-3 font-semibold text-slate-600 sm:px-8">Amount / Transaction</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-600 sm:px-8">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx, idx) => (
                      <tr key={tx.txHash || idx} className="border-b border-slate-100 last:border-0">
                        <td className="px-6 py-4 text-slate-700 sm:px-8 align-top">
                          {tx.date}
                        </td>

                        <td className="px-6 py-4 text-slate-700 sm:px-8 align-top">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-slate-500">From</p>
                              <p className="font-mono text-xs break-all">{tx.from}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">To</p>
                              <p className="font-mono text-xs break-all">{tx.to}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 sm:px-8 align-top">
                          <div className="space-y-2">
                            <p className="font-semibold text-emerald-600">{tx.amount}</p>
                            <div>
                              <p className="text-xs text-slate-500">Tx Hash</p>
                              <p className="font-mono text-xs break-all">{tx.txHash}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right sm:px-8 align-top">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-6 text-sm text-slate-500 sm:px-8">
                        No donation activity available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <PreviewModal
        isOpen={showImage}
        onClose={() => setShowImage(false)}
        title="Campaign Image"
      >
        <img
          src={campaign.imageUrl}
          alt="Campaign"
          className="w-full rounded-lg"
        />
      </PreviewModal>

      <PreviewModal
        isOpen={showDoc}
        onClose={() => setShowDoc(false)}
        title="Verification Document"
      >
        <iframe
          src={`https://ipfs.io/ipfs/${campaign.documentCID}`}
          title="IPFS Document"
          className="w-full h-[70vh] rounded-lg"
        />
      </PreviewModal>
    </div>
  )
}

export default CampaignDetail