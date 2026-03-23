import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

// Layouts
import PublicLayout from './components/PublicLayout'
import DashboardLayout from './components/DashboardLayout'
import AdminLayout from './components/AdminLayout'

// Auth
import Auth from './pages/Auth'

// Public pages
import Home from './pages/Home'
import Countries from './pages/Countries'
import Cities from './pages/Cities'
import CityDetail from './pages/CityDetail'
import Guides from './pages/Guides'
import GuideProfile from './pages/GuideProfile'
import Experiences from './pages/Experiences'
import ExperienceDetail from './pages/ExperienceDetail'
import VerificationExplainer from './pages/VerificationExplainer'

// Guide dashboard pages
import GuideOverview from './pages/guide/GuideOverview'
import GuideProfilePage from './pages/guide/GuideProfile'
import GuideVerification from './pages/guide/GuideVerification'
import GuideExperiences from './pages/guide/GuideExperiences'
import GuideAvailability from './pages/guide/GuideAvailability'
import GuideBookingRequests from './pages/guide/GuideBookingRequests'
import GuideReviews from './pages/guide/GuideReviews'
import GuideSettings from './pages/guide/GuideSettings'
import GuideTranslator from './pages/guide/GuideTranslator'

// Admin pages
import AdminGuides from './pages/admin/AdminGuides'
import AdminVerifications from './pages/admin/AdminVerifications'
import AdminExperiences from './pages/admin/AdminExperiences'
import AdminReviews from './pages/admin/AdminReviews'
import AdminAudit from './pages/admin/AdminAudit'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />

            {/* Public discovery */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/countries" element={<Countries />} />
              <Route path="/cities" element={<Cities />} />
              <Route path="/cities/:slug" element={<CityDetail />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:guideId" element={<GuideProfile />} />
              <Route path="/experiences" element={<Experiences />} />
              <Route path="/experiences/:slug" element={<ExperienceDetail />} />
              <Route path="/verification" element={<VerificationExplainer />} />
            </Route>

            {/* Guide dashboard */}
            <Route path="/guide" element={<DashboardLayout />}>
              <Route index element={<GuideOverview />} />
              <Route path="profile" element={<GuideProfilePage />} />
              <Route path="verification" element={<GuideVerification />} />
              <Route path="experiences" element={<GuideExperiences />} />
              <Route path="availability" element={<GuideAvailability />} />
              <Route path="bookings" element={<GuideBookingRequests />} />
              <Route path="reviews" element={<GuideReviews />} />
              <Route path="translator" element={<GuideTranslator />} />
              <Route path="settings" element={<GuideSettings />} />
            </Route>

            {/* Admin panel */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminGuides />} />
              <Route path="guides" element={<AdminGuides />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="experiences" element={<AdminExperiences />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
