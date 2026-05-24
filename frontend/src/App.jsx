import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DataUsageMonitor from './components/DataUsageMonitor';
import WebAppShell from './components/WebAppShell';
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

function App() {
  useEffect(() => {
    localStorage.removeItem('creatorName');
    localStorage.removeItem('user_details');
  }, []);

  return (
    <>
      <DataUsageMonitor />
      {/* Web-first: all routes render as full-width desktop experience */}
      <Routes>
        {/* Main dashboard */}
        <Route path="/" element={<WebDashboardPage />} />
        <Route path="/dashboard" element={<WebDashboardPage />} />
        <Route path="/dashboard/*" element={<WebDashboardPage />} />

        {/* Web pages wrapped for responsive rendering */}
        <Route path="/auth" element={<WebAppShell><AuthPage /></WebAppShell>} />
        <Route path="/onboarding" element={<WebAppShell><OnboardingPage /></WebAppShell>} />
        <Route path="/map" element={<WebAppShell><MapPage /></WebAppShell>} />
        <Route path="/saved" element={<WebAppShell><SavedPage /></WebAppShell>} />
        <Route path="/activity" element={<WebAppShell><ActivityPage /></WebAppShell>} />
        <Route path="/profile" element={<WebAppShell><ProfilePage /></WebAppShell>} />
        <Route path="/settings" element={<WebAppShell><SettingsPage /></WebAppShell>} />
        <Route path="/library" element={<WebAppShell><LibraryPage /></WebAppShell>} />
        <Route path="/government" element={<WebAppShell><GovernmentPortalPage /></WebAppShell>} />
        <Route path="/generate" element={<WebAppShell><GeneratePage /></WebAppShell>} />
        <Route path="/drivers" element={<WebAppShell><DriversPage /></WebAppShell>} />
        <Route path="/navigate" element={<WebAppShell><DriversPage /></WebAppShell>} />
        <Route path="/agents" element={<WebAppShell><AgentsPage /></WebAppShell>} />
        <Route path="/tracking" element={<WebAppShell><TrackingPage /></WebAppShell>} />
        <Route path="/emergency" element={<WebAppShell><EmergencyPage /></WebAppShell>} />
        <Route path="/business" element={<WebAppShell><BusinessDashboardPage /></WebAppShell>} />
        <Route path="/p/:code" element={<WebAppShell><AddressPage /></WebAppShell>} />
        <Route path="/:code" element={<WebAppShell><AddressPage /></WebAppShell>} />
        <Route path="/ussd" element={<WebAppShell><USSDAccessPage /></WebAppShell>} />

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
    </>
  );
}

export default App;
