import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { AdminProvider } from './contexts/AdminContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import AdminLayout from './components/admin/AdminLayout'
import PartnerLayout from './components/partner/PartnerLayout'
import AdminRoute from './components/admin/AdminRoute'
import PartnerRoute from './components/admin/PartnerRoute'
import Home from './pages/public/Home'
import CampaignList from './pages/public/CampaignList'
import CampaignDetail from './pages/public/CampaignDetail'
import DonatePage from './pages/public/DonatePage'
import About from './pages/public/About'
import Blog from './pages/public/Blog'
import HowItWorks from './pages/public/HowItWorks'
import Privacy from './pages/public/Privacy'
import Terms from './pages/public/Terms'
import AdminLogin from './pages/auth/AdminLogin'
import PartnerLogin from './pages/auth/PartnerLogin'
import { Footer } from './components/common'
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPartners from './pages/admin/AdminPartners';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminCampaignDetail from './pages/admin/AdminCampaignDetail';
import PartnerRegistration from './pages/partner/PartnerRegistration'
import PartnerDashboard from './pages/partner/PartnerDashboard'
import PartnerCampaigns from './pages/partner/PartnerCampaigns'
import PartnerCampaignDetail from './pages/partner/PartnerCampaignDetail'
import PartnerCreateCampaign from './pages/partner/PartnerCreateCampaign'
import PartnerBeneficiaries from './pages/partner/PartnerBeneficiaries'
import PartnerBeneficiaryRegister from './pages/partner/PartnerBeneficiaryRegister'
import PartnerBeneficiaryClaims from './pages/partner/PartnerBeneficiaryClaims'
import Logout from './pages/auth/Logout'
import PartnerProfile from './pages/partner/PartnerProfile'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminProvider>
          <Router>
            <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900"
            >
              Skip to content
            </a>
            
            <Routes>
              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/partners" element={<AdminPartners />} />
                  <Route path="/admin/campaigns" element={<AdminCampaigns />} />
                  <Route path="/admin/campaigns/:campaignAddress" element={<AdminCampaignDetail />} />
                </Route>
              </Route>

              {/* Partner Routes - No Navbar */}
              <Route path="/partner" element={
                <PartnerRoute>
                  <PartnerLayout>
                    <PartnerDashboard />
                  </PartnerLayout>
                </PartnerRoute>
              } />

              <Route path="/partner/campaigns" element={
                 <PartnerRoute>
                  <PartnerLayout>
                    <PartnerCampaigns />
                  </PartnerLayout>
                </PartnerRoute>
              } />

              <Route path="/partner/campaigns/:campaignAddress" element={
                    <PartnerRoute>
                      <PartnerLayout>
                        <PartnerCampaignDetail />
                      </PartnerLayout>
                    </PartnerRoute>
                  }
                />

              <Route path="/partner/create" element={
                <PartnerRoute>
                  <PartnerLayout>
                    <PartnerCreateCampaign />
                  </PartnerLayout>
                </PartnerRoute>
              } />

              <Route
                path="/partner/campaigns/:campaignAddress/beneficiaries/register"
                element={
                  <PartnerRoute>
                    <PartnerLayout>
                      <PartnerBeneficiaryRegister />
                    </PartnerLayout>
                  </PartnerRoute>
                }
              />

              <Route
                path="/partner/campaigns/:campaignAddress/beneficiaries"
                element={
                  <PartnerRoute>
                    <PartnerLayout>
                      <PartnerBeneficiaries />
                    </PartnerLayout>
                  </PartnerRoute>
                }
              />

              <Route
                path="/partner/campaigns/:campaignAddress/claims"
                element={
                  <PartnerRoute>
                    <PartnerLayout>
                      <PartnerBeneficiaryClaims />
                    </PartnerLayout>
                  </PartnerRoute>
                }
              />
              
              <Route path="/partner/analytics" element={
                <PartnerRoute>
                  <PartnerLayout>
                    <div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-gray-600 mt-2">View analytics and reports here.</p></div>
                  </PartnerLayout>
                </PartnerRoute>
              } />
              <Route path="/partner/profile" element={
                <PartnerRoute>
                  <PartnerLayout>
                     <PartnerProfile />
                  </PartnerLayout>
                </PartnerRoute>
              } />

              {/* Login Routes - No Navbar or Footer */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/partner/login" element={<PartnerLogin />} />

              {/* Public Routes - Without Navbar */}
              <Route path="/*" element={
                <>
                  <main id="main-content">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/campaigns" element={<CampaignList />} />
                      <Route path="/campaigns/:address" element={<CampaignDetail />} />
                      <Route path="/donate/:address" element={<DonatePage />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/partner-register" element={<PartnerRegistration />} />
                      <Route path="/logout" element={<Logout />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
            </div>
          </Router>
        </AdminProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}



export default App
