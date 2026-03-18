import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBuildings() {
      setLoading(true);
      try {
        const res = await api.get('/admin/buildings');
        setBuildings(res.data.data || []);
      } catch (err) {
        setError('Failed to load buildings');
      }
      setLoading(false);
    }
    fetchBuildings();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  // Action handlers
  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/buildings/${id}/approve`);
      setBuildings(buildings => buildings.map(b => b.id === id ? { ...b, status: 'verified' } : b));
    } catch {
      alert('Failed to approve building');
    }
  };
  const handleRemove = async (id) => {
    if (!window.confirm('Remove this building?')) return;
    try {
      await api.post(`/admin/buildings/${id}/remove`);
      setBuildings(buildings => buildings.filter(b => b.id !== id));
    } catch {
      alert('Failed to remove building');
    }
  };
  const handleEdit = async (id) => {
    // For demo: just prompt for city/state/country/ppoint_code
    const city = prompt('City?');
    const state = prompt('State?');
    const country = prompt('Country?');
    const ppoint_code = prompt('PPOINNT Code?');
    if (!city || !state || !country || !ppoint_code) return;
    try {
      await api.post(`/admin/buildings/${id}/edit`, { city, state, country, ppoint_code });
      setBuildings(buildings => buildings.map(b => b.id === id ? { ...b, city, state, country, ppoint_code } : b));
    } catch {
      alert('Failed to edit building');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Detected Buildings</h1>
      <table className="w-full border rounded bg-white shadow">
        <thead>
          <tr className="bg-stone-100">
            <th className="p-2">PPOINNT Code</th>
            <th className="p-2">Location</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {buildings.map(b => (
            <tr key={b.id} className="border-t">
              <td className="p-2 font-mono">{b.ppoint_code}</td>
              <td className="p-2">{b.city}, {b.state}, {b.country}</td>
              <td className="p-2 capitalize">{b.status}</td>
              <td className="p-2">
                <button onClick={() => handleApprove(b.id)} className="bg-green-600 text-white px-3 py-1 rounded mr-2">Approve</button>
                <button onClick={() => handleEdit(b.id)} className="bg-blue-600 text-white px-3 py-1 rounded mr-2">Edit</button>
                <button onClick={() => handleRemove(b.id)} className="bg-red-600 text-white px-3 py-1 rounded">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
