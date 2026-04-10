import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { useAuth } from "../../contexts/AuthContext"

const PartnerCampaigns = () => {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user?.uid) return

      try {
        const q = query(
          collection(db, "campaigns"),
          where("partnerUid", "==", user.uid)
        )

        const snapshot = await getDocs(q)

        setCampaigns(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [user?.uid])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">My Campaigns</h1>

      {loading ? (
        <p>Loading...</p>
      ) : campaigns.length === 0 ? (
        <p>No campaigns found</p>
      ) : (
        <div className="space-y-4">
          {campaigns.map(c => (
            <div
              key={c.id}
              className="border p-4 rounded-lg bg-white"
            >
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-gray-500">{c.location}</p>
              <p className="text-sm">
                Goal: {Number(c.goalAmount) / 1e6} USDC
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PartnerCampaigns