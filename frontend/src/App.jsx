import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AddressPage from './pages/AddressPage';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:code" element={<AddressPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Layout>
  );
}

export default App;
