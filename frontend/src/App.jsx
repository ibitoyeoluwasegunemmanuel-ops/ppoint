import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import DataUsageMonitor from './components/DataUsageMonitor';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import SavedPage from './pages/SavedPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';
import GeneratePage from './pages/GeneratePage';
import DriversPage from './pages/DriversPage';
import AgentsPage from './pages/AgentsPage';
import AddressPage from './pages/AddressPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminGovernmentPage from './pages/AdminGovernmentPage';
import AdminModerationPage from './pages/AdminModerationPage';
import USSDAccessPage from './pages/USSDAccessPage';
import DevelopersPage from './pages/DevelopersPage';
import TrackingPage from './pages/TrackingPage';
import EmergencyPage from './pages/EmergencyPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import SettingsPage from './pages/SettingsPage';
import LibraryPage from './pages/LibraryPage';
import GovernmentPortalPage from './pages/GovernmentPortalPage';
import WebDashboardPage from './pages/WebDashboardPage';

// Detect desktop vs mobile and route to the right experience
function RootRedirect() {
  const isDesktop = window.innerWidth >= 768;
  return isDesktop ? <WebDashboardPage /> : <HomePage />;
}

function App() {
  useEffect(() => {
    localStorage.removeItem('creatorName');
    localStorage.removeItem('user_details');
  }, []);

  return (
    <>
      <DataUsageMonitor />
      <AppShell>
        <Routes>
        {/* Root: desktop → web dashboard, mobile → home app */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/government" element={<GovernmentPortalPage />} />

        {/* Auth + Onboarding */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Full-screen flows */}
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/navigate" element={<DriversPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/business" element={<BusinessDashboardPage />} />

        {/* Address lookup */}
        <Route path="/p/:code" element={<AddressPage />} />
        <Route path="/:code" element={<AddressPage />} />

        {/* USSD + SMS Access */}
        <Route path="/ussd" element={<USSDAccessPage />} />

        {/* Web/Desktop dashboard */}
        <Route path="/dashboard" element={<WebDashboardPage />} />
        <Route path="/dashboard/*" element={<WebDashboardPage />} />

        {/* Admin & developer (separate UX) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/moderation" element={<AdminModerationPage />} />
        <Route path="/admin/government" element={<AdminGovernmentPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/developer/dashboard" element={<DevelopersPage />} />
        </Routes>
      </AppShell>
    </>
  );
}

export default App;
