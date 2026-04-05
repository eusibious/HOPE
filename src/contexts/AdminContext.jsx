import { createContext, useContext, useReducer, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const initialState = {
  campaigns: [],
  campaignFilters: { search: '', partner: '', status: '' },
  partners: [],
  partnerFilters: { search: '', status: '' },
  loading: { campaigns: false, partners: false },
  stats: {
    campaigns: { active: 0, pending: 0, completed: 0, blocked: 0 },
    partners: { pending: 0, reviewing: 0, approved: 0, rejected: 0 },
  },
}

const ACTIONS = {
  SET_LOADING:            'SET_LOADING',
  SET_CAMPAIGNS:          'SET_CAMPAIGNS',
  SET_PARTNERS:           'SET_PARTNERS',
  UPDATE_CAMPAIGN_FILTERS:'UPDATE_CAMPAIGN_FILTERS',
  UPDATE_CAMPAIGN_STATUS: 'UPDATE_CAMPAIGN_STATUS',
  UPDATE_PARTNER_FILTERS: 'UPDATE_PARTNER_FILTERS',
  UPDATE_PARTNER_STATUS:  'UPDATE_PARTNER_STATUS',
}

function adminReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: { ...state.loading, [action.target]: action.value } }

    case ACTIONS.SET_CAMPAIGNS:
      return {
        ...state,
        campaigns: action.campaigns,
        stats: { ...state.stats, campaigns: calculateCampaignStats(action.campaigns) },
      }

    case ACTIONS.SET_PARTNERS:
      return {
        ...state,
        partners: action.partners,
        stats: { ...state.stats, partners: calculatePartnerStats(action.partners) },
      }

    case ACTIONS.UPDATE_CAMPAIGN_FILTERS:
      return { ...state, campaignFilters: { ...state.campaignFilters, ...action.filters } }

    case ACTIONS.UPDATE_PARTNER_FILTERS:
      return { ...state, partnerFilters: { ...state.partnerFilters, ...action.filters } }

    case ACTIONS.UPDATE_CAMPAIGN_STATUS:
      return {
        ...state,
        campaigns: state.campaigns.map(c =>
          c.id === action.campaignId ? { ...c, status: action.status } : c
        ),
        stats: {
          ...state.stats,
          campaigns: calculateCampaignStats(
            state.campaigns.map(c =>
              c.id === action.campaignId ? { ...c, status: action.status } : c
            )
          ),
        },
      }

    case ACTIONS.UPDATE_PARTNER_STATUS:
      return {
        ...state,
        partners: state.partners.map(p =>
          p.id === action.partnerId ? { ...p, status: action.status } : p
        ),
        stats: {
          ...state.stats,
          partners: calculatePartnerStats(
            state.partners.map(p =>
              p.id === action.partnerId ? { ...p, status: action.status } : p
            )
          ),
        },
      }

    default:
      return state
  }
}

function calculateCampaignStats(campaigns) {
  return campaigns.reduce(
    (acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc },
    { active: 0, pending: 0, completed: 0, blocked: 0 }
  )
}

function calculatePartnerStats(partners) {
  return partners.reduce(
    (acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc },
    { pending: 0, reviewing: 0, approved: 0, rejected: 0 }
  )
}

const AdminContext = createContext()

export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(adminReducer, initialState)

  // Get auth state — only load data when admin is confirmed logged in
  const { isAuthenticated, role, loading: authLoading } = useAuth()
  const isAdmin = isAuthenticated && String(role) === '1'

  // ── Real-time listener for partner requests ────────────────────────────────
  // Uses onSnapshot so the admin panel updates instantly when a new
  // partner submits a request — no need to refresh the page
  useEffect(() => {
    if (authLoading || !isAdmin) return

    dispatch({ type: ACTIONS.SET_LOADING, target: 'partners', value: true })

    const unsubscribe = onSnapshot(
      collection(db, 'partner-requests'),
      (snapshot) => {
        const partners = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        dispatch({ type: ACTIONS.SET_PARTNERS, partners })
        dispatch({ type: ACTIONS.SET_LOADING, target: 'partners', value: false })
      },
      (error) => {
        console.error('Error listening to partner requests:', error)
        dispatch({ type: ACTIONS.SET_LOADING, target: 'partners', value: false })
      }
    )

    return () => unsubscribe()
  }, [isAdmin, authLoading])

  // ── Load campaigns ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !isAdmin) return

    dispatch({ type: ACTIONS.SET_LOADING, target: 'campaigns', value: true })
    try {
      // TODO: implement when campaigns collection is ready
      dispatch({ type: ACTIONS.SET_CAMPAIGNS, campaigns: [] })
    } catch (error) {
      console.error('Error loading campaigns:', error)
      dispatch({ type: ACTIONS.SET_CAMPAIGNS, campaigns: [] })
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, target: 'campaigns', value: false })
    }
  }, [isAdmin, authLoading])

  const actions = {
    updateCampaignFilters: (filters) => {
      dispatch({ type: ACTIONS.UPDATE_CAMPAIGN_FILTERS, filters })
    },

    blockCampaign: (campaignId) => {
      dispatch({ type: ACTIONS.UPDATE_CAMPAIGN_STATUS, campaignId, status: 'blocked' })
    },

    unblockCampaign: (campaignId) => {
      dispatch({ type: ACTIONS.UPDATE_CAMPAIGN_STATUS, campaignId, status: 'active' })
    },

    updatePartnerFilters: (filters) => {
      dispatch({ type: ACTIONS.UPDATE_PARTNER_FILTERS, filters })
    },

    approvePartner: async (partnerId) => {
      try {
        // Step 1 — update Firestore status
        const partnerRef = doc(db, 'partner-requests', partnerId)
        await updateDoc(partnerRef, {
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          accountCreated: false,
        })

        dispatch({ type: ACTIONS.UPDATE_PARTNER_STATUS, partnerId, status: 'approved' })

        // Step 2 — get admin ID token and call backend
        const currentUser = getAuth().currentUser
        if (!currentUser) throw new Error('No authenticated user found.')

        const idToken = await currentUser.getIdToken()

        const response = await fetch(`${BACKEND_URL}/api/approve-partner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ partnerId }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Backend account creation failed.')

        console.log('Partner account created successfully.', result)
        return { success: true }

      } catch (error) {
        console.error('Error approving partner:', error)
        throw error
      }
    },

    rejectPartner: async (partnerId) => {
      try {
        const partnerRef = doc(db, 'partner-requests', partnerId)
        await updateDoc(partnerRef, {
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
        })
        dispatch({ type: ACTIONS.UPDATE_PARTNER_STATUS, partnerId, status: 'rejected' })
      } catch (error) {
        console.error('Error rejecting partner:', error)
        throw error
      }
    },
  }

  const computed = {
    filteredCampaigns: state.campaigns.filter(campaign => {
      const matchesSearch =
        campaign.campaignName?.toLowerCase().includes(state.campaignFilters.search.toLowerCase()) ||
        campaign.partner?.toLowerCase().includes(state.campaignFilters.search.toLowerCase())
      const matchesPartner =
        !state.campaignFilters.partner || campaign.partner === state.campaignFilters.partner
      const matchesStatus =
        !state.campaignFilters.status || campaign.status === state.campaignFilters.status
      return matchesSearch && matchesPartner && matchesStatus
    }),

    filteredPartners: state.partners.filter(partner => {
      const matchesSearch =
        partner.organizationName?.toLowerCase().includes(state.partnerFilters.search.toLowerCase()) ||
        partner.email?.toLowerCase().includes(state.partnerFilters.search.toLowerCase())
      const matchesStatus =
        !state.partnerFilters.status || partner.status === state.partnerFilters.status
      return matchesSearch && matchesStatus
    }),
  }

  return (
    <AdminContext.Provider value={{ ...state, ...actions, ...computed }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within an AdminProvider')
  return context
}

export default AdminContext
