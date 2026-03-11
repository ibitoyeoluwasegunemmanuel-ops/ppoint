import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ArrowRight, LocateFixed, MapPinned, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { PLACE_TYPES } from '../constants/placeTypes';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const initialAgentForm = {
  fullName: '',
  phoneNumber: '',
  email: '',
  country: 'Nigeria',
  state: '',
  city: '',
  territory: '',
};

const initialAddressForm = {
  placeType: '',
  customPlaceType: '',
  buildingName: '',
  houseNumber: '',
  landmark: '',
  district: '',
  streetDescription: '',
  phoneNumber: '',
};

const inputClassName = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-stone-500';

const getAddressSettings = (publicConfig) => ({
  requireBuildingName: publicConfig?.address_settings?.require_building_name !== false,
  showLandmark: publicConfig?.address_settings?.show_landmark !== false,
  showStreetDescription: publicConfig?.address_settings?.show_street_description !== false,
  showPhoneNumber: publicConfig?.address_settings?.show_phone_number !== false,
  enableHouseNumber: publicConfig?.address_settings?.enable_house_number !== false,
  enableDistrict: publicConfig?.address_settings?.enable_district !== false,
});

function MapViewportController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}

export default function AgentsPage() {
  const [agentForm, setAgentForm] = useState(initialAgentForm);
  const [mappingForm, setMappingForm] = useState(initialAddressForm);
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [position, setPosition] = useState([6.5244, 3.3792]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [publicConfig, setPublicConfig] = useState(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const addressSettings = getAddressSettings(publicConfig);

  const activeAgent = dashboard?.agent || null;
  const recentAddresses = useMemo(() => dashboard?.addresses || [], [dashboard]);
  const activeMappedCount = useMemo(() => recentAddresses.filter((address) => ['active', 'verified_business'].includes(address.moderation_status)).length, [recentAddresses]);
  const flaggedMappedCount = useMemo(() => recentAddresses.filter((address) => ['flagged', 'suspicious', 'reported'].includes(address.moderation_status)).length, [recentAddresses]);

  const loadAgents = async () => {
    const response = await api.get('/platform/agents');
    const data = response.data.data || [];
    setAgents(data);
    if (!agentId && data[0]?.id) {
      setAgentId(String(data[0].id));
    }
  };

  const loadDashboard = async (nextAgentId = agentId) => {
    if (!nextAgentId) {
      setDashboard(null);
      return;
    }

    const response = await api.get(`/platform/agents/${nextAgentId}/dashboard`);
    setDashboard(response.data.data);
  };

  useEffect(() => {
    loadAgents().catch(() => setError('Failed to load field agents.'));
    api.get('/platform/system/public-config')
      .then((response) => setPublicConfig(response.data.data || null))
      .catch(() => setPublicConfig(null));
  }, []);

  useEffect(() => {
    if (agentId) {
      loadDashboard(agentId).catch(() => setError('Failed to load field agent dashboard.'));
    }
  }, [agentId]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextPosition = [coords.latitude, coords.longitude];
        setSelectedPosition(nextPosition);
        setPosition(nextPosition);
        setError('');
      },
      () => setError('Unable to detect location. Select the point on the map instead.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const registerAgent = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const response = await api.post('/platform/agents/register', agentForm);
      const nextAgent = response.data.data;
      await loadAgents();
      setAgentId(String(nextAgent.id));
      setAgentForm(initialAgentForm);
      setNotice(`Field agent registered. Agent code: ${nextAgent.agent_code}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to register field agent.');
    } finally {
      setLoading(false);
    }
  };

  const createMappedAddress = async (event) => {
    event.preventDefault();
    if (!agentId) {
      setError('Choose an agent first.');
      return;
    }

    if (!selectedPosition) {
      setError('Select a map point before creating an agent address.');
      return;
    }

    if (addressSettings.requireBuildingName && !mappingForm.buildingName.trim()) {
      setError('Building / Place Name is required.');
      return;
    }

    if (!mappingForm.placeType) {
      setError('Select a place type before creating the PPOINNT address.');
      return;
    }

    if (mappingForm.placeType === 'Other' && !mappingForm.customPlaceType.trim()) {
      setError('Enter the custom place type when selecting Other.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      await api.post(`/platform/agents/${agentId}/addresses`, {
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
        placeType: mappingForm.placeType,
        customPlaceType: mappingForm.customPlaceType,
        buildingName: mappingForm.buildingName,
        houseNumber: mappingForm.houseNumber,
        landmark: mappingForm.landmark,
        district: mappingForm.district,
        streetDescription: mappingForm.streetDescription,
        phoneNumber: mappingForm.phoneNumber,
      });
      await loadDashboard(agentId);
      setMappingForm(initialAddressForm);
      setShowMoreDetails(false);
      setNotice('Agent-mapped address created and activated for delivery use.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create mapped address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Field Agent System</p>
          <h1 className="mt-4 text-4xl font-black text-white">Agent Mapping Dashboard</h1>
          <p className="mt-4 text-lg leading-8 text-stone-200">Register field agents, assign mapping territories, and let them create PPOINNT addresses for underserved or unmapped communities.</p>

          {error && <div className="mt-6 rounded-2xl border border-red-200/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
          {notice && <div className="mt-6 rounded-2xl border border-emerald-200/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{notice}</div>}

          <form onSubmit={registerAgent} className="mt-6 space-y-4 rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
            <h2 className="text-xl font-bold text-white">Register Field Agent</h2>
            <input value={agentForm.fullName} onChange={(event) => setAgentForm({ ...agentForm, fullName: event.target.value })} className={inputClassName} placeholder="Full Name" />
            <input value={agentForm.phoneNumber} onChange={(event) => setAgentForm({ ...agentForm, phoneNumber: event.target.value })} className={inputClassName} placeholder="Phone Number" />
            <input value={agentForm.email} onChange={(event) => setAgentForm({ ...agentForm, email: event.target.value })} className={inputClassName} placeholder="Email (optional)" />
            <div className="grid gap-4 md:grid-cols-2">
              <input value={agentForm.country} onChange={(event) => setAgentForm({ ...agentForm, country: event.target.value })} className={inputClassName} placeholder="Country" />
              <input value={agentForm.state} onChange={(event) => setAgentForm({ ...agentForm, state: event.target.value })} className={inputClassName} placeholder="State" />
              <input value={agentForm.city} onChange={(event) => setAgentForm({ ...agentForm, city: event.target.value })} className={inputClassName} placeholder="City" />
              <input value={agentForm.territory} onChange={(event) => setAgentForm({ ...agentForm, territory: event.target.value })} className={inputClassName} placeholder="Territory / Coverage Area" />
            </div>
            <button disabled={loading} className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-stone-950 disabled:opacity-50">{loading ? 'Saving...' : 'Register Agent'}</button>
          </form>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
            <div className="flex items-center gap-3">
              <Users className="text-sky-300" />
              <h2 className="text-xl font-bold text-white">Available Agents</h2>
            </div>
            <select value={agentId} onChange={(event) => setAgentId(event.target.value)} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
              <option value="">Select registered agent</option>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.agent_code} • {agent.full_name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-stone-950/60 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Mapping Console</p>
                <h3 className="mt-1 text-2xl font-bold text-white">Capture rural and urban points</h3>
              </div>
              <button onClick={detectLocation} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"><LocateFixed size={16} className="inline mr-2" />Detect My Location</button>
            </div>
            <div className="h-[460px]">
              <MapContainer center={position} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapViewportController position={selectedPosition || position} />
                <MapClickHandler onSelect={(nextPosition) => { setSelectedPosition(nextPosition); setPosition(nextPosition); setError(''); }} />
                {selectedPosition && <Marker position={selectedPosition}><Popup>Mapped point</Popup></Marker>}
              </MapContainer>
            </div>
          </div>

          <form onSubmit={createMappedAddress} className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <MapPinned className="text-amber-300" />
              <h3 className="text-2xl font-black text-white">Create Agent Address</h3>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Start with the building name and optional landmark. Extra details stay hidden unless the agent needs them.
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <select value={mappingForm.placeType} onChange={(event) => setMappingForm({ ...mappingForm, placeType: event.target.value, customPlaceType: event.target.value === 'Other' ? mappingForm.customPlaceType : '' })} className={inputClassName}>
                <option value="">Select place type</option>
                {PLACE_TYPES.map((placeType) => <option key={placeType} value={placeType}>{placeType}</option>)}
              </select>
              {mappingForm.placeType === 'Other' && <input value={mappingForm.customPlaceType} onChange={(event) => setMappingForm({ ...mappingForm, customPlaceType: event.target.value })} className={inputClassName} placeholder="Custom place type" />}
              <input value={mappingForm.buildingName} onChange={(event) => setMappingForm({ ...mappingForm, buildingName: event.target.value })} className={inputClassName} placeholder="Building / Place Name" />
              {addressSettings.showLandmark && <input value={mappingForm.landmark} onChange={(event) => setMappingForm({ ...mappingForm, landmark: event.target.value })} className={inputClassName} placeholder="Nearest Landmark (optional)" />}
              {addressSettings.showStreetDescription && <textarea value={mappingForm.streetDescription} onChange={(event) => setMappingForm({ ...mappingForm, streetDescription: event.target.value })} className={`${inputClassName} min-h-28 md:col-span-2`} placeholder="Street Description (optional)" />}
              {addressSettings.showPhoneNumber && <input value={mappingForm.phoneNumber} onChange={(event) => setMappingForm({ ...mappingForm, phoneNumber: event.target.value })} className={`${inputClassName} md:col-span-2`} placeholder="Phone Number (optional)" />}
            </div>
            <button
              type="button"
              onClick={() => setShowMoreDetails((current) => !current)}
              className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
            >
              {showMoreDetails ? 'Hide more details' : 'Add more details'}
            </button>
            {showMoreDetails && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {addressSettings.enableHouseNumber && <input value={mappingForm.houseNumber} onChange={(event) => setMappingForm({ ...mappingForm, houseNumber: event.target.value })} className={inputClassName} placeholder="House Number" />}
                {addressSettings.enableDistrict && <input value={mappingForm.district} onChange={(event) => setMappingForm({ ...mappingForm, district: event.target.value })} className={inputClassName} placeholder="District" />}
              </div>
            )}
            <button disabled={loading} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-stone-950 disabled:opacity-50"><ArrowRight size={16} />{loading ? 'Submitting...' : 'Create Agent Address'}</button>
          </form>

          {activeAgent && (
            <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/20">
              <h3 className="text-2xl font-black text-stone-950">{activeAgent.agent_code}</h3>
              <p className="mt-2 text-stone-600">{activeAgent.full_name} • {activeAgent.territory}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">Mapped Addresses</p>
                  <p className="mt-2 text-3xl font-black text-stone-950">{activeAgent.total_addresses}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">Active for Delivery</p>
                  <p className="mt-2 text-3xl font-black text-stone-950">{activeMappedCount}</p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">Flagged</p>
                  <p className="mt-2 text-3xl font-black text-stone-950">{flaggedMappedCount}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {recentAddresses.length ? recentAddresses.map((address) => (
                  <div key={address.id} className="rounded-2xl border border-stone-200 p-4">
                    <p className="font-semibold text-stone-950">{address.code}</p>
                    <p className="mt-1 text-sm text-stone-600">{[address.house_number, address.building_name || address.landmark || 'Mapped address'].filter(Boolean).join(' ')} • {address.city}, {address.state}</p>
                    {address.structured_address_line && <p className="mt-1 text-sm text-stone-500">{address.structured_address_line}</p>}
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">{address.moderation_status}</p>
                  </div>
                )) : <p className="text-sm text-stone-500">No mapped addresses yet for this agent.</p>}
              </div>

              <div className="mt-6 rounded-2xl bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-700">Support</p>
                <p className="mt-2 text-sm text-stone-600">{publicConfig?.support_contacts?.support_email || 'support@ppoinnt.africa'} • {publicConfig?.support_contacts?.support_phone_number || '+234-800-PPOINNT'}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}