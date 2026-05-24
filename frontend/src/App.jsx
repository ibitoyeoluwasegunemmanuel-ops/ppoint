import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
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
import DevelopersPage from './pages/DevelopersPage';

function App() {
  useEffect(() => {
    localStorage.removeItem('creatorName');
    localStorage.removeItem('user_details');
  }, []);

  return (
    <AppShell>
      <Routes>
        {/* Main mobile app */}
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Full-screen flows */}
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/navigate" element={<DriversPage />} />
        <Route path="/agents" element={<AgentsPage />} />

        {/* Address lookup */}
        <Route path="/p/:code" element={<AddressPage />} />
        <Route path="/:code" element={<AddressPage />} />

        {/* Admin & developer (separate UX) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/developer/dashboard" element={<DevelopersPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
