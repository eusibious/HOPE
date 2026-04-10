import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { AdminProvider } from './contexts/AdminContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import AdminLayout from './components/admin/AdminLayout'
import PartnerLayout from './components/partner/PartnerLayout'
import AdminRoute from './components/admin/AdminRoute'
import PartnerRoute from './components/admin/PartnerRoute'
import Home from './pages/public/Home'
import CampaignList from './pages/public/CampaignList'
import CampaignDetail from './pages/public/CampaignDetail'
import DonatePage from './pages/public/DonatePage'
import About from './pages/public/About'
import Login from './pages/auth/Login'
import AdminLogin from './pages/auth/AdminLogin'
import PartnerLogin from './pages/auth/PartnerLogin'
import { Footer } from './components/common'
import AdminOverview from './pages/admin/AdminOverview'
import AdminPartnerRequests from './pages/admin/AdminPartnerRequests'
import AdminCampaignMonitor from './pages/admin/AdminCampaignMonitor'
import AdminCampaignDetail from './pages/admin/AdminCampaignDetail'
import PartnerRegistration from './pages/partner/PartnerRegistration'
import PartnerDashboard from './pages/partner/PartnerDashboard'
import PartnerCampaigns from './pages/partner/PartnerCampaigns'
import PartnerCreateCampaign from './pages/partner/PartnerCreateCampaign'
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
              {/* Admin Routes - No Navbar */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminOverview />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/partners" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminPartnerRequests />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/campaigns" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminCampaignMonitor />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/campaigns/:id" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminCampaignDetail />
                  </AdminLayout>
                </AdminRoute>
              } />

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
              <Route path="/partner/create" element={
                <PartnerRoute>
                  <PartnerLayout>
                    <PartnerCreateCampaign />
                  </PartnerLayout>
                </PartnerRoute>
              } />
              <Route path="/partner/beneficiaries" element={
                <PartnerRoute>
                  <PartnerLayout>
                    <div className="p-6"><h1 className="text-2xl font-bold">Beneficiaries</h1><p className="text-gray-600 mt-2">Manage beneficiaries here.</p></div>
                  </PartnerLayout>
                </PartnerRoute>
              } />
              <Route path="/partner/claims" element={
                <PartnerRoute>
                  <PartnerLayout>
                    <div className="p-6"><h1 className="text-2xl font-bold">Claims</h1><p className="text-gray-600 mt-2">View and manage claims here.</p></div>
                  </PartnerLayout>
                </PartnerRoute>
              } />
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
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/partner/login" element={<PartnerLogin />} />

              {/* Public Routes - With Navbar */}
              <Route path="/*" element={
                <>
                  <Navbar />
                  <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/campaigns" element={<CampaignList />} />
                      <Route path="/campaigns/:address" element={<CampaignDetail />} />
                      <Route path="/donate/:address" element={<DonatePage />} />
                      <Route path="/about" element={<About />} />
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
