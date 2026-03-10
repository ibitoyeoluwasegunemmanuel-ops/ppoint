import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AddressPage from './pages/AddressPage';
import AdminDashboard from './pages/AdminDashboard';
import DevelopersPage from './pages/DevelopersPage';
import AgentsPage from './pages/AgentsPage';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/developer/dashboard" element={<DevelopersPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/:code" element={<AddressPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
