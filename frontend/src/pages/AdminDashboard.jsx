import { useEffect, useState } from 'react';
import { MapPin, Building2, Globe } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ppoint_admin_token') || import.meta.env.VITE_ADMIN_TOKEN || '');

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        setError('Enter an admin token to load dashboard data.');
        return;
      }

      try {
        setError(null);
        localStorage.setItem('ppoint_admin_token', token);
        const [statsRes, hierarchyRes] = await Promise.all([
          api.get('/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get('/admin/hierarchy', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setStats(statsRes.data.data);
        setHierarchy(hierarchyRes.data.data);
      } catch {
        setError('Failed to fetch admin data. Check the admin token and backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/6 p-8 text-white backdrop-blur">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-3 text-stone-300">Set an admin token to connect this dashboard to the protected backend endpoints.</p>
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste admin token"
          className="mt-6 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-stone-400"
        />
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center p-12 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-stone-300">Operational visibility for active coverage, hierarchy, and address volume.</p>
        </div>
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none md:w-80"
          placeholder="Admin token"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-white/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Addresses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalAddresses || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Cities</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.cityBreakdown?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Globe className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Coverage</p>
              <p className="text-2xl font-bold text-gray-900">Nigeria</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Geographic Hierarchy</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {hierarchy.map((item, idx) => (
            <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <span className="text-2xl">NG</span>
                <div>
                  <p className="font-medium text-gray-900">{item.city_name || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{item.state_name}, {item.country_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-gray-600">{item.city_code}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-600 w-20 text-right">
                  {item.address_count || 0} addresses
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}