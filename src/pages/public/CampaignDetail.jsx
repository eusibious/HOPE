import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import PreviewModal from '../../components/common/PreviewModal'
import { Button } from '../../components/ui'
import { VerifiedBadge, ProgressStat, TransactionRow } from '../../components/common'
import { useNavigate } from 'react-router-dom'
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

  const raised = campaign?.raisedAmount
    ? Number(ethers.formatUnits(campaign.raisedAmount, 6))
    : 0

  const target = campaign?.goalAmount
    ? Number(ethers.formatUnits(campaign.goalAmount, 6))
    : 0

  const progress = target > 0
    ? Math.min(Math.round((raised / target) * 100), 100)
    : 0

  // Fetch data from onchain
  const fetchOnChainData = async (address) => {
      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL
        if (!rpcUrl) {
          throw new Error("VITE_RPC_URL is not set")
        }
    
        const provider = new ethers.JsonRpcProvider(rpcUrl)
          
        await provider.getNetwork()
         
        //new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_API_KEY') Mainnet
        //new ethers.JsonRpcProvider('https://polygon-mumbai.infura.io/v3/YOUR_API_KEY') Mumbai Testnet


        const contract = new ethers.Contract(
          address,
          HOPECampaignABI.abi,
          provider
        )

        const details = await contract.getCampaignDetails()

        return {
          raisedAmount: details._raisedAmount.toString(), // 1e6,
          goalAmount: details._goalAmount.toString(), // 1e6, Number(ethers.formatUnits(data.goalAmount.toString(), 6)),
          isActive: details._isActive,
          beneficiaryCount: Number(details._beneficiaryCount)
        }

      } catch (err) {
        console.error("Blockchain fetch failed:", err)
      }
    }

    //recent activity fetch

    const fetchRecentActivity = async (campaignAddress) => {
      try {
        const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL)
        const contract = new ethers.Contract(campaignAddress, HOPECampaignABI.abi, provider)

        const donationFilter = contract.filters.DonationReceived()

        const latestBlock = await provider.getBlockNumber()
        const fromBlock = Math.max(0, latestBlock - 20)

        const events = await contract.queryFilter(
          donationFilter,
          fromBlock,
          latestBlock
        )

        const items = await Promise.all(
          events.slice().reverse().map(async (event) => {
            const block = await provider.getBlock(event.blockNumber)

            return {
              date: block?.timestamp
                ? new Date(block.timestamp * 1000).toLocaleDateString("en-IN")
                : "N/A",
              campaign: "Donation",
              from: event.args.donor,
              to: campaignAddress,
              amount: `$${Number(ethers.formatUnits(event.args.amount, 6)).toLocaleString()}`,
              txHash: event.transactionHash,
              status: "Confirmed",
            }
          })
        )

        setRecentTransactions(items)
      } catch (err) {
        console.error("Recent activity fetch failed:", err)
        setRecentTransactions([])
      }
    }


  useEffect(() => {
    //let intervalId
    const fetchCampaign = async () => {
      try {
        const snapshot = await getDocs(collection(db, "campaigns"))

        const found = snapshot.docs.find(doc => {
          return doc.data().campaignAddress === address
        })

        if (found) {
          const data = found.data()
          const baseData = {
            title: data.title,
            location: data.location,
            description: data.description,
            imageUrl: data.imageUrl,
            goalAmount: data.goalAmount, // 1e6, Number(ethers.formatUnits(data.goalAmount.toString(), 6)),
            createdBy: data.createdBy,
            campaignAddress: data.campaignAddress,
            category: data.category,
            deadline: data.deadline,
            documentCID: data.documentCID,
            createdAt: data.createdAt,
          }
          //fetching recent activity from blockchain
          await fetchRecentActivity(data.campaignAddress)

          //  Fetch blockchain data
          const chainData = await fetchOnChainData(data.campaignAddress)

          setCampaign({
            ...baseData,
            raisedAmount: chainData?.raisedAmount || "0",
            goalAmount: chainData?.goalAmount || baseData.goalAmount || "0",
            isActive: chainData?.isActive ,
            beneficiaryCount: chainData?.beneficiaryCount || 0
          })
         

        } else {
          console.error("Campaign not found")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()

   // intervalId = setInterval(fetchCampaign, 30000) // Refresh every 30 seconds
   // return () => clearInterval(intervalId)
  }, [address])

    //Loading states
  if (loading) return <div>Loading...</div>
  if (!campaign) return <div>Campaign not found</div>

  const progressStats = [
    { label: 'Raised', value: `$${raised.toLocaleString()}` },
    { label: 'Target', value: `$${target.toLocaleString()}` },
    { label: 'Progress', value: `${progress}%` },
    { label: 'Beneficiaries', value: campaign.beneficiaryCount || 0 },
  ]


  return (
    <div className="min-h-screen py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Campaign Image */}
          <div className="h-64 w-full overflow-hidden">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <span className={`px-2 py-1 text-xs rounded-full ${
              campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {campaign.isActive ? 'Active' : 'Closed'}
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
                  <span className="text-sm text-slate-600">
                    {campaign.createdBy}
                  </span>
                </div>
              </div>

              <Button onClick={() => navigate(`/donate/${address}`)}>
                Donate now
              </Button>
            </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-5">
              {progressStats.map((stat) => (
                <ProgressStat key={stat.label} {...stat} />
              ))}
            </div>
            
            {/* METADATA */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

                <div>
                  <p className="text-slate-500">Campaign Address</p>
                  <p className="font-mono break-all">{campaign.campaignAddress}</p>
                </div>

                <div>
                  <p className="text-slate-500">Deadline</p>
                  <p>{campaign.deadline
                    ? new Date(campaign.deadline).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"
                  }
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Created At</p>
                  <p>
                    {campaign.createdAt?.toDate?.().toLocaleString?.() || "N/A"}
                  </p>
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

            {/* <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
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
            </div> */}
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
                        Addresses
                      </th>
                      <th className="px-6 py-3 font-semibold text-slate-600 sm:px-8">
                        Amount / Transaction
                      </th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-600 sm:px-8">
                        Status
                      </th>
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
