import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { 
  ArrowRight, LocateFixed, MapPinned, Users, Check, 
  ShieldCheck, TrendingUp, DollarSign, Zap, Layers, X
} from 'lucide-react';
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

const inputClassName = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-amber-400/50 transition-all';

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
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const loadAgents = async () => {
    const response = await api.get('/platform/agents');
    const data = response.data.data || [];
    setAgents(data);
    if (!agentId && data[0]?.id) setAgentId(String(data[0].id));
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
    if (agentId) loadDashboard(agentId).catch(() => setError('Failed to load field agent dashboard.'));
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
      setNotice(`Field agent registered. Agent ID: ${nextAgent.id}`);
      setActiveTab('dashboard'); // Switch to work after registration
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to register field agent.');
    } finally {
      setLoading(false);
    }
  };

  const createMappedAddress = async (event) => {
    event.preventDefault();
    if (!agentId) return setError('Choose an active identity first.');
    if (!selectedPosition) return setError('Tap the map to place a pin first.');
    if (addressSettings.requireBuildingName && !mappingForm.buildingName.trim()) return setError('Building Name is required.');
    if (!mappingForm.placeType) return setError('Select a place type.');
    if (mappingForm.placeType === 'Other' && !mappingForm.customPlaceType.trim()) return setError('Enter the custom place type.');

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
      setNotice('Success! PPOINNT node created and activated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Creation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── HEADER & TAB SWITCHER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-white/5">
        <div>
           <h1 className="text-4xl font-black text-white italic tracking-tighter">AGENT HUB</h1>
           <p className="text-stone-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Scale the logistics network</p>
        </div>
        
        <div className="flex items-center gap-1 rounded-2l bg-white/5 p-1 border border-white/10 w-fit">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-amber-400 text-stone-950 shadow-xl shadow-amber-400/20' : 'text-stone-400 hover:text-white'}`}
          >
            <TrendingUp size={12} /> WORKSPACE
          </button>
          <button 
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'identity' ? 'bg-amber-400 text-stone-950 shadow-xl shadow-amber-400/20' : 'text-stone-400 hover:text-white'}`}
          >
            <Users size={12} /> MY IDENTITY
          </button>
        </div>
      </div>

      {(error || notice) && (
        <div className={`rounded-2xl border p-4 text-sm font-bold flex items-center justify-between animate-in zoom-in-95 ${error ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>
          <div className="flex items-center gap-3">
            {error ? <X size={18} /> : <Check size={18} />}
            {error || notice}
          </div>
          <button onClick={() => { setError(''); setNotice(''); }} className="opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      <section>
        {activeTab === 'identity' ? (
           <div className="grid gap-8 lg:grid-cols-2">
             <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
               <h2 className="text-2xl font-black text-white italic tracking-tighter mb-6">FIELD REGISTRATION</h2>
               <form onSubmit={registerAgent} className="space-y-4">
                 <input value={agentForm.fullName} onChange={(e) => setAgentForm({ ...agentForm, fullName: e.target.value })} className={inputClassName} placeholder="Full Legal Name" />
                 <input value={agentForm.phoneNumber} onChange={(e) => setAgentForm({ ...agentForm, phoneNumber: e.target.value })} className={inputClassName} placeholder="Phone Number" />
                 <input value={agentForm.email} onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })} className={inputClassName} placeholder="Email Address" />
                 <div className="grid grid-cols-2 gap-4">
                   <input value={agentForm.state} onChange={(e) => setAgentForm({ ...agentForm, state: e.target.value })} className={inputClassName} placeholder="Region / State" />
                   <input value={agentForm.city} onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })} className={inputClassName} placeholder="City" />
                 </div>
                 <input value={agentForm.territory} onChange={(e) => setAgentForm({ ...agentForm, territory: e.target.value })} className={inputClassName} placeholder="Assigned Territory (e.g. Lagos Island)" />
                 <button disabled={loading} className="w-full rounded-2xl bg-white py-4 font-black text-stone-950 hover:bg-stone-200 transition">REGISTER PERSONNEL</button>
               </form>
             </div>

             <div className="rounded-[2.5rem] border border-stone-800 bg-stone-950 p-8">
               <h3 className="text-xl font-black text-white italic tracking-tighter mb-4">ACTIVE IDENTITY</h3>
               <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Select Agent Profile</p>
                 <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className={`${inputClassName} bg-stone-900`}>
                   <option value="" className="bg-stone-900">Choose identity...</option>
                   {agents.map((agent) => (
                     <option key={agent.id} value={agent.id} className="bg-stone-900 text-white font-bold">{agent.ppoint_agent_id || `AGT-${agent.id}`} • {agent.full_name}</option>
                   ))}
                 </select>
               </div>
             </div>
           </div>
        ) : (
           <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-8">
                 {/* Map Section */}
                 <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-3xl">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                       <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">MAP TERMINAL</h3>
                       <button onClick={detectLocation} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black text-white hover:bg-white/10 transition">
                          <LocateFixed size={14} /> GPS LOCATE
                       </button>
                    </div>
                    <div className="h-[400px]">
                      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapViewportController position={selectedPosition || position} />
                        <MapClickHandler onSelect={(pos) => { setSelectedPosition(pos); setPosition(pos); }} />
                        {selectedPosition && <Marker position={selectedPosition} />}
                      </MapContainer>
                    </div>
                 </div>

                 {/* Stats Section */}
                 <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-blue-400 p-8 text-stone-950 shadow-xl">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Mapped Nodes</p>
                       <p className="text-5xl font-black italic tracking-tighter mt-2">{recentAddresses.length}</p>
                       <p className="text-xs font-bold mt-4 border-t border-black/10 pt-4 flex items-center gap-2">
                          <ShieldCheck size={14} /> Confidence Score: 98%
                       </p>
                    </div>
                    <div className="rounded-3xl bg-emerald-400 p-8 text-stone-950 shadow-xl">
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Earnings (In-Hand)</p>
                       <p className="text-5xl font-black italic tracking-tighter mt-2">₦{(activeAgent?.earnings_balance || 0).toLocaleString()}</p>
                       <p className="text-xs font-bold mt-4 border-t border-black/10 pt-4">Agents collect cash directly in Phase 1</p>
                    </div>
                 </div>
              </div>

              {/* Mapping Form */}
              <div className="rounded-[2.5rem] border border-white/10 bg-stone-950/40 p-8 backdrop-blur-2xl">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center text-stone-950">
                       <MapPinned size={22} />
                    </div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">NEW PIN DATA</h3>
                 </div>

                 <form onSubmit={createMappedAddress} className="space-y-4">
                    <div className="relative">
                       <select 
                         value={mappingForm.placeType} 
                         onChange={(e) => setMappingForm({ ...mappingForm, placeType: e.target.value })} 
                         className={`${inputClassName} appearance-none bg-stone-900`}
                       >
                          <option value="" className="bg-stone-900">Select place type...</option>
                          {PLACE_TYPES.map(type => <option key={type} value={type} className="bg-stone-900 text-white font-bold">{type}</option>)}
                       </select>
                       <Layers size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                    </div>

                    {mappingForm.placeType === 'Other' && <input value={mappingForm.customPlaceType} onChange={(e) => setMappingForm({ ...mappingForm, customPlaceType: e.target.value })} className={inputClassName} placeholder="Custom Category (e.g. Cinema)" />}
                    <input value={mappingForm.buildingName} onChange={(e) => setMappingForm({ ...mappingForm, buildingName: e.target.value })} className={inputClassName} placeholder="Building Name" />
                    <input value={mappingForm.landmark} onChange={(e) => setMappingForm({ ...mappingForm, landmark: e.target.value })} className={inputClassName} placeholder="Nearest Landmark" />
                    
                    <button type="button" onClick={() => setShowMoreDetails(!showMoreDetails)} className="text-[10px] font-black text-stone-500 uppercase tracking-widest hover:text-white transition">
                       {showMoreDetails ? '[-] Hide Fields' : '[+] Show Advanced Fields'}
                    </button>

                    {showMoreDetails && (
                       <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                          <input value={mappingForm.houseNumber} onChange={(e) => setMappingForm({ ...mappingForm, houseNumber: e.target.value })} className={inputClassName} placeholder="House Number" />
                          <input value={mappingForm.district} onChange={(e) => setMappingForm({ ...mappingForm, district: e.target.value })} className={inputClassName} placeholder="District" />
                          <textarea value={mappingForm.streetDescription} onChange={(e) => setMappingForm({ ...mappingForm, streetDescription: e.target.value })} className={`${inputClassName} min-h-[100px]`} placeholder="Street Hint (e.g. Beside the big transformer)" />
                       </div>
                    )}

                    <button disabled={loading} className="w-full rounded-[1.5rem] bg-amber-400 py-5 font-black text-stone-950 uppercase tracking-widest shadow-xl shadow-amber-400/20 active:scale-95 transition flex items-center justify-center gap-2">
                       {loading ? <Zap size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                       {loading ? 'SECURING NODE...' : 'ACTIVATE PPOINNT'}
                    </button>
                 </form>

                 {/* Recent Activity */}
                 <div className="mt-12">
                    <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Latest Mappings</h4>
                    <div className="space-y-3">
                       {recentAddresses.slice(0, 3).map(addr => (
                          <div key={addr.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/5">
                             <div>
                                <p className="font-black text-white text-sm italic">{addr.code}</p>
                                <p className="text-[10px] text-stone-500 font-bold uppercase">{addr.building_name || 'Generic Node'}</p>
                             </div>
                             <div className="text-stone-400"><TrendingUp size={14} /></div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}
      </section>
    </div>
  );
}