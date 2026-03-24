import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import { 
  Search, MapPin, Navigation, Share2, 
  Layers, LocateFixed, X, Check, Copy,
  ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import api from '../services/api';
import { PLACE_TYPES } from '../constants/placeTypes';

// ─── Design System ───────────────────────────────────────────────────────────

const SCREENS = {
  HOME: 'home',
  GENERATING: 'generating',
  RESULT: 'result'
};

function GlassCard({ children, className = '' }) {
  return (
    <div className={`glass-card rounded-[2.5rem] p-8 ${className}`}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, variant = 'primary', className = '', disabled = false }) {
  const base = "flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-black transition-all active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-xl shadow-amber-400/20",
    secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  
  const [currentScreen, setCurrentScreen] = useState(SCREENS.HOME);
  const [position, setPosition] = useState([6.5244, 3.3792]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // PPOINNT Creation States
  const [placeType, setPlaceType] = useState(PLACE_TYPES[0]); // Default to 'House'
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [note, setNote] = useState(''); // Formerly extraDirections
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // Renamed from draftAddress
  const [notice, setNotice] = useState(''); // For success messages like "Copied!"
  const [showGuidance, setShowGuidance] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Repeating Guidance Logic: Fade in (1s), Stay (4s), Repeat gap (10s)
  useEffect(() => {
    if (hasInteracted) {
      setShowGuidance(false);
      return;
    }
    const interval = setInterval(() => {
      if (!hasInteracted && !selectedPosition) { // Only show if no pin is placed
        setShowGuidance(true);
        setTimeout(() => setShowGuidance(false), 5000); // 1s fade + 4s stay
      }
    }, 15000); // 5s active + 10s gap
    return () => clearInterval(interval);
  }, [hasInteracted, selectedPosition]);

  const mapRef = useRef(null);

  // ─── Core Logic ─────────────────────────────────────────────────────────────

  const detectLocation = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const newPos = { lat, lng };
        setPosition([lat, lng]);
        setSelectedPosition(newPos);
        
        // Auto-scroll map to location
        if (mapRef.current) {
          mapRef.current.flyTo(lng, lat, 17);
        }
        
        setLoading(false);
        setHasInteracted(true);
      },
      (err) => {
        setError('Location permission denied. Please enable GPS.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const generatePpoint = async () => {
    if (!selectedPosition) {
      setError('Select a location first');
      return;
    }
    if (!placeType) {
      setError('Please select a Place Type');
      return;
    }

    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await api.post('/platform/community/addresses/generate', {
        latitude: selectedPosition.lat,
        longitude: selectedPosition.lng,
        placeType: placeType,
        customPlaceType: placeType === 'Other' ? note : null,
        buildingName,
      });

      setResult(response.data.data);
      setCurrentScreen(SCREENS.RESULT); // Move to Result screen
      setHasInteracted(true);
    } catch (err) {
      if (err.response?.status === 402) {
        setShowPaymentModal(true);
      } else {
        setError(err.response?.data?.message || 'Failed to generate PPOINNT. Please try again.');
        setCurrentScreen(SCREENS.HOME);
      }
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    setPaymentLoading(true);
    try {
      // Simulate Payment Verification (e.g. Paystack/Flutterwave)
      await api.post('/payments/verify-ppoint-fee', { reference: 'PAY-' + Date.now() });
      setShowPaymentModal(false);
      // Retry generation as paid
      await generatePpointAsPaid();
    } catch (err) {
      setError('Payment verification failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const generatePpointAsPaid = async () => {
    setLoading(true);
    try {
      const response = await api.post('/platform/community/addresses/generate', {
        latitude: selectedPosition.lat,
        longitude: selectedPosition.lng,
        placeType,
        customPlaceType: placeType === 'Other' ? note : null,
        buildingName,
        isPaid: true // Tell backend payment is done
      });
      setResult(response.data.data);
      setCurrentScreen(SCREENS.RESULT);
    } catch (err) {
      setError(err.response?.data?.message || 'PPOINNT generation failed even after payment.');
    } finally {
      setLoading(false);
    }
  };

  const updatePpoint = async () => {
    if (!result?.code) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.put(`/addresses/${result.code}`, { // Assuming a PUT endpoint for updates
        landmark,
        description: note, // Using 'description' for Note
      });
      setResult(response.data.data); // Update result with new data
      setNotice('PPOINNT improved with extra details!');
    } catch (err) {
      setError('Optional update failed, but your PPOINNT is still valid.');
    } finally {
      setLoading(false);
    }
  };

  const shareToWhatsapp = (code) => {
    const text = encodeURIComponent(`📍 PPOINNT Delivery Address:\nCode: ${code}\nLocation: ${result?.city || ''}\n\nLink: ${window.location.origin}/${code}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/address/search', { params: { code: searchQuery.trim().toUpperCase() } });
      const foundAddress = response.data.data;
      setResult(foundAddress);
      setSelectedPosition({ lat: Number(foundAddress.latitude), lng: Number(foundAddress.longitude) });
      setPosition([Number(foundAddress.latitude), Number(foundAddress.longitude)]);
      
      if (mapRef.current) {
        mapRef.current.flyTo(Number(foundAddress.longitude), Number(foundAddress.latitude), 18);
      }
      
      setCurrentScreen(SCREENS.RESULT);
      setHasInteracted(true);
    } catch (err) {
      setError('PPOINNT code not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render Functions ──────────────────────────────────────────────────────

  const renderHomeScreen = () => {
    if (selectedPosition && !result) { // Only show initial capture if a pin is placed and no result yet
      return (
        <div className="absolute left-8 bottom-24 z-10 w-full max-w-[300px] animate-in slide-in-from-left-5 duration-500">
          <GlassCard className="p-6 border border-white/10 shadow-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-white italic tracking-tighter">NEW PPOINNT</h2>
              <button onClick={() => setSelectedPosition(null)} className="text-stone-500 hover:text-white"><X size={16} /></button>
            </div>
    
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-white outline-none focus:border-amber-400"
                >
                  {PLACE_TYPES.map(type => (
                    <option key={type} value={type} className="bg-stone-900 font-bold">{type}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-500">
                  <Layers size={12} />
                </div>
              </div>

              {placeType === 'Other' && (
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter Place Type (e.g. Cinema)"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white outline-none focus:border-amber-400/50 animate-in zoom-in-95"
                />
              )}
    
              <input 
                type="text"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder="Building Name (Optional)"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white outline-none focus:border-amber-400/50"
              />
            </div>
    
            <PrimaryButton 
              onClick={generatePpoint}
              disabled={loading || !placeType}
              className="w-full mt-4 py-3 text-xs shadow-none border-t border-white/5 rounded-2xl"
            >
              {loading ? <Zap size={18} className="animate-spin" /> : <Layers size={18} />}
              {loading ? 'GENERATING...' : 'GENERATE PPOINNT'}
            </PrimaryButton>
    
            {error && <p className="mt-3 text-[10px] font-bold text-red-500">{error}</p>}
          </GlassCard>
        </div>
      );
    }
    return null;
  };

  const renderGeneratingScreen = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-2xl">
      <div className="text-center">
        <div className="mx-auto h-24 w-24 relative mb-6">
           <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20" />
           <div className="relative h-24 w-24 animate-spin rounded-full border-[6px] border-amber-400 border-t-transparent shadow-[0_0_50px_hsla(38,92%,50%,0.4)]" />
        </div>
        <h3 className="text-4xl font-black text-white italic tracking-tighter">CALIBRATING GRID...</h3>
        <p className="mt-2 font-bold text-stone-400 uppercase tracking-widest text-sm">Synchronizing hex-coordinates to network</p>
      </div>
    </div>
  );

  const renderResultScreen = () => (
    <div className="absolute left-8 bottom-24 z-20 w-full max-w-[350px] animate-in slide-in-from-left-5 duration-700">
      <GlassCard className="p-6 border-t-4 border-emerald-500">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
             <ShieldCheck size={14} /> Verified Active
          </div>
          <button onClick={() => { setCurrentScreen(SCREENS.HOME); setResult(null); setSelectedPosition(null); setLandmark(''); setNote(''); setBuildingName(''); setPlaceType(PLACE_TYPES[0]); }} className="text-stone-500 hover:text-white transition"><X size={18} /></button>
        </div>
        
        <div className="flex items-center gap-3 mb-6">
           <h2 className="text-4xl font-black text-white tracking-tighter italic">{result?.code}</h2>
           <button 
             onClick={async () => { await navigator.clipboard.writeText(result.code); setNotice('Code copied!'); setTimeout(()=>setNotice(''), 2000); }} 
             className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-stone-400 hover:bg-white/10"
           >
              {notice === 'Code copied!' ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
           </button>
        </div>

        <div className="space-y-2 mb-6 text-white/90">
           <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Location</p>
              <p className="text-xs font-bold flex items-center gap-2"><MapPin size={12} className="text-amber-400"/> {result?.city}, {result?.state}</p>
           </div>
           <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Category</p>
              <p className="text-xs font-bold flex items-center gap-2 uppercase"><Layers size={12} className="text-amber-400"/> {result?.display_place_type || result?.place_type}</p>
           </div>
           {result?.buildingName && (
             <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Building</p>
                <p className="text-xs font-bold flex items-center gap-2">{result.buildingName}</p>
             </div>
           )}
        </div>

        {/* Enrichment Phase */}
        <div className="mt-6 space-y-3 pt-4 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Boost Accuracy (Optional)</p>
          
          <input 
            placeholder="Landmark (e.g. Near Big Gate)"
            value={landmark}
            onChange={e => setLandmark(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-white outline-none placeholder:text-white/20 focus:border-amber-400/50"
          />
          
          <textarea 
            placeholder="Note / Door description"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows="2"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-white outline-none placeholder:text-white/20 focus:border-amber-400/50 resize-none"
          />

          <PrimaryButton 
            onClick={updatePpoint}
            disabled={loading}
            className="w-full py-3 text-xs shadow-none border-t border-white/5 rounded-2xl"
          >
            {loading ? 'SAVING...' : 'SAVE ENRICHMENT'}
          </PrimaryButton>
          {notice === 'PPOINNT improved with extra details!' && <p className="mt-2 text-[10px] font-bold text-emerald-400">{notice}</p>}
          {error && <p className="mt-2 text-[10px] font-bold text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex gap-2">
          <button 
            onClick={() => shareToWhatsapp(result?.code)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg hover:scale-105 transition active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
          <PrimaryButton 
            onClick={() => navigate(`/drivers?code=${result?.code}`)}
            className="flex-1 py-3 text-xs shadow-lg shadow-blue-600/20"
          >
            <Navigation size={14} /> NAVIGATE
          </PrimaryButton>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="relative h-screen w-full flex flex-col bg-stone-950 overflow-hidden font-sans">
      
      {/* ── FLOATING GUIDANCE ── */}
      {showGuidance && currentScreen === SCREENS.HOME && !selectedPosition && (
        <div className="absolute top-24 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="flex items-center gap-3 rounded-full bg-white/10 border border-white/20 p-2 px-6 backdrop-blur-2xl shadow-2xl pointer-events-auto">
              <p className="text-[11px] font-black text-white italic tracking-tighter">
                For best accuracy, stand at your entrance or move the pin
              </p>
           </div>
        </div>
      )}

      {/* ── MAP CONTAINER ── */}
      <div className="absolute inset-0 z-0">
        <MapboxMap
          ref={mapRef}
          center={[position[1], position[0]]}
          zoom={15}
          defaultViewMode="hybrid" // High-contrast design for Hybrid
          onClick={(lat, lng) => {
            if (currentScreen === SCREENS.HOME) {
              setSelectedPosition({ lat, lng });
              setPosition([lat, lng]);
              setHasInteracted(true);
            }
          }}
          style={{ height: '100%', width: '100%' }}
        >
          {selectedPosition && (
            <Marker 
              longitude={selectedPosition.lng} 
              latitude={selectedPosition.lat} 
              anchor="bottom"
              draggable
              onDragEnd={(evt) => {
                const { lng, lat } = evt.lngLat;
                setSelectedPosition({ lat, lng });
              }}
            >
              <div className="relative group flex items-center justify-center h-8 w-8 cursor-move transition-transform active:scale-125">
                 {/* Precision Shadow & Pulse */}
                 <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20" />
                 <div className="absolute h-full w-full rounded-full bg-black/40 blur-[4px] translate-y-2 scale-x-75" />
                 
                 {/* Surgical Pin Body */}
                 <div className="relative h-full w-full flex items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-xl overflow-hidden">
                   {/* Center Dot for Precision */}
                   <div className="h-2 w-2 rounded-full bg-stone-950 border border-white/50" />
                 </div>
              </div>
            </Marker>
          )}
        </MapboxMap>
      </div>

      {/* ── SEARCH BAR ── */}
      {currentScreen !== SCREENS.GENERATING && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-[400px] px-4">
          <form onSubmit={handleSearch} className="relative group">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PPOINNT..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-12 py-4 font-black text-white shadow-2xl backdrop-blur-xl outline-none focus:border-amber-400/50 transition-all text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
            {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />}
          </form>
        </div>
      )}

      {/* ── FLOATING TARGET BUTTON ── */}
      {currentScreen === SCREENS.HOME && (
        <button 
          onClick={detectLocation}
          className={`absolute right-6 bottom-[120px] z-20 flex h-14 w-14 items-center justify-center rounded-2xl shadow-3xl transition-all active:scale-90 ${loading ? 'bg-amber-400 animate-pulse' : 'bg-stone-900 border border-white/10 text-amber-400 hover:bg-stone-800'}`}
        >
          <LocateFixed size={28} />
        </button>
      )}

      {/* ── UI OVERLAYS ── */}
      {currentScreen === SCREENS.HOME && renderHomeScreen()}
      {currentScreen === SCREENS.GENERATING && renderGeneratingScreen()}
      {currentScreen === SCREENS.RESULT && renderResultScreen()}

      {/* ── BRANDING ── */}
      <div className="absolute top-2 left-6 z-10 select-none grayscale opacity-30 pointer-events-none">
         <span className="text-6xl font-black italic tracking-tighter text-white">PPOINT</span>
      </div>

      {/* ── PAYMENT MODAL ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-stone-950/40 backdrop-blur-xl p-4">
           <div className="w-full max-w-sm rounded-[2.5rem] bg-stone-900 border border-white/10 p-8 shadow-3xl animate-in slide-in-from-bottom-5">
              <div className="flex justify-center mb-6">
                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-stone-950 shadow-xl shadow-amber-400/20">
                    <DollarSign size={32} />
                 </div>
              </div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter text-center">LIMIT REACHED</h2>
              <p className="mt-4 text-center text-sm font-bold text-stone-400 leading-relaxed uppercase tracking-widest">
                First 3 PPOINNTs are free. To generate this new precision code, a small fee of <span className="text-amber-400">₦50</span> applies.
              </p>
              
              <div className="mt-8 space-y-3">
                 <PrimaryButton 
                   onClick={processPayment}
                   disabled={paymentLoading}
                   className="w-full"
                 >
                   {paymentLoading ? 'PROCESSING...' : 'PAY ₦50 & GENERATE'}
                 </PrimaryButton>
                 <button 
                   onClick={() => setShowPaymentModal(false)}
                   className="w-full py-3 text-[10px] font-black uppercase text-stone-500 hover:text-white"
                 >
                   CANCEL
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function DollarSign({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}