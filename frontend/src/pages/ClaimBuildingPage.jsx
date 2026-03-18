import { useState } from 'react';
import api from '../services/api';

export default function ClaimBuildingPage({ buildingId }) {
  const [form, setForm] = useState({
    building_name: '',
    business_name: '',
    delivery_instructions: '',
    landmark: '',
    phone_number: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/buildings/${buildingId}/claim`, form);
      setSuccess(true);
    } catch {
      setError('Failed to submit claim');
    }
  };

  if (success) return <div className="p-8 text-center text-green-700">Claim submitted! An admin will review your request.</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Claim this PPOINNT Address</h1>
      <label className="block mb-2">Building Name
        <input name="building_name" value={form.building_name} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
      </label>
      <label className="block mb-2">Business Name
        <input name="business_name" value={form.business_name} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
      </label>
      <label className="block mb-2">Delivery Instructions
        <textarea name="delivery_instructions" value={form.delivery_instructions} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
      </label>
      <label className="block mb-2">Landmark
        <input name="landmark" value={form.landmark} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
      </label>
      <label className="block mb-4">Phone Number
        <input name="phone_number" value={form.phone_number} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
      </label>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold">Submit Claim</button>
    </form>
  );
}
