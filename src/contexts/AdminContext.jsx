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
  loading: true,
  error: null,
  stats: {
    campaigns: { active: 0, pending: 0, completed: 0, blocked: 0 },
    partners: { pending: 0, reviewing: 0, approved: 0, rejected: 0 },
  },
};

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  UPDATE_CAMPAIGN_FILTERS:'UPDATE_CAMPAIGN_FILTERS',
  UPDATE_CAMPAIGN_STATUS: 'UPDATE_CAMPAIGN_STATUS',
  UPDATE_PARTNER_FILTERS: 'UPDATE_PARTNER_FILTERS',
  UPDATE_PARTNER_STATUS:  'UPDATE_PARTNER_STATUS',
};

function adminReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.value, error: null };

    case ACTIONS.SET_DATA:
      return {
        ...state,
        campaigns: action.payload.campaigns || state.campaigns,
        partners: action.payload.partners || state.partners,
        stats: {
          campaigns: calculateCampaignStats(action.payload.campaigns || state.campaigns),
          partners: calculatePartnerStats(action.payload.partners || state.partners),
        },
        loading: false,
      };

    case ACTIONS.SET_ERROR:
      return { ...state, loading: false, error: action.error };

    case ACTIONS.UPDATE_CAMPAIGN_FILTERS:
      return { ...state, campaignFilters: { ...state.campaignFilters, ...action.filters } };

    case ACTIONS.UPDATE_PARTNER_FILTERS:
      return { ...state, partnerFilters: { ...state.partnerFilters, ...action.filters } };

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
      };

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
      };

    default:
      return state;
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
    if (authLoading || !isAdmin) return;

    dispatch({ type: ACTIONS.SET_LOADING, value: true });

    const partnersUnsubscribe = onSnapshot(
      collection(db, 'partner-requests'),
      (snapshot) => {
        const partners = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        dispatch({ type: ACTIONS.SET_DATA, payload: { partners } });
      },
      (error) => {
        console.error('Error listening to partner requests:', error);
        dispatch({ type: ACTIONS.SET_ERROR, error: 'Failed to load partners.' });
      }
    );

    const campaignsUnsubscribe = onSnapshot(
      collection(db, 'campaigns'),
      (snapshot) => {
        const campaigns = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        dispatch({ type: ACTIONS.SET_DATA, payload: { campaigns } });
      },
      (error) => {
        console.error('Error listening to campaigns:', error);
        dispatch({ type: ACTIONS.SET_ERROR, error: 'Failed to load campaigns.' });
      }
    );

    return () => {
      partnersUnsubscribe();
      campaignsUnsubscribe();
    };
  }, [isAdmin, authLoading]);


  const actions = {
    updateCampaignFilters: (filters) => {
      dispatch({ type: ACTIONS.UPDATE_CAMPAIGN_FILTERS, filters })
    },

    blockCampaign: async (campaignId) => {
      try {
        // Find campaign to get address
        const campaign = state.campaigns.find(c => c.id === campaignId)
        if (!campaign) throw new Error('Campaign not found')

        const currentUser = getAuth().currentUser
        if (!currentUser) throw new Error('Not authenticated')

        const idToken = await currentUser.getIdToken()

        const response = await fetch(
          `${BACKEND_URL}/api/campaigns/${campaign.campaignAddress}/hold`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          }
        )

        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to hold campaign')

        // Update local state
        dispatch({ type: ACTIONS.UPDATE_CAMPAIGN_STATUS, campaignId, status: 'on_hold' })
        return { success: true }
      } catch (error) {
        console.error('Error holding campaign:', error)
        throw error
      }
    },

    unblockCampaign: async (campaignId) => {
      try {
        // Find campaign to get address
        const campaign = state.campaigns.find(c => c.id === campaignId)
        if (!campaign) throw new Error('Campaign not found')

        const currentUser = getAuth().currentUser
        if (!currentUser) throw new Error('Not authenticated')

        const idToken = await currentUser.getIdToken()

        const response = await fetch(
          `${BACKEND_URL}/api/campaigns/${campaign.campaignAddress}/unhold`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          }
        )

        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Failed to resume campaign')

        // Update local state
        dispatch({ type: ACTIONS.UPDATE_CAMPAIGN_STATUS, campaignId, status: 'active' })
        return { success: true }
      } catch (error) {
        console.error('Error resuming campaign:', error)
        throw error
      }
    },

    approveCampaignClosure: (campaignId) => {
      dispatch({ type: ACTIONS.UPDATE_CAMPAIGN_STATUS, campaignId, status: 'closed' })
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

    rejectPartner: async (partnerId, rejectionReason) => {
      try {
        if (!rejectionReason || !String(rejectionReason).trim()) {
          throw new Error('Rejection reason is required.')
        }

        const currentUser = getAuth().currentUser
        if (!currentUser) throw new Error('No authenticated user found.')

        const idToken = await currentUser.getIdToken()

        const response = await fetch(`${BACKEND_URL}/api/reject-partner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ partnerId, rejectionReason }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to reject partner.')

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
