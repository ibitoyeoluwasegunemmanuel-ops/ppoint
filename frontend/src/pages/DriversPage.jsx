import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MapboxMap, { Marker, Source, Layer } from '../components/MapboxMap';
import {
  Navigation, Search, LocateFixed, Car, Zap, Footprints,
  CheckCircle2, Compass, ArrowLeft, ArrowUpRight, 
  ArrowUpLeft, ArrowUp, RotateCcw, AlertCircle,
  Volume2, VolumeX, Share2
} from 'lucide-react';
import api from '../services/api';

// ─── Shared Components ────────────────────────────────────────────────────────

function DriverMarkerPin({ bearing = 0 }) {
  return (
    <div className="relative" style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.3s ease-out' }}>
       <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
       <div className="relative h-12 w-12 flex items-center justify-center rounded-full border-[3px] border-white bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
          <Navigation size={24} className="text-white fill-white" />
       </div>
    </div>
  );
}

function DestinationPin({ placeType }) {
  const emojiMap = {
    House: '🏠', Shop: '🛍', Office: '🏢', School: '🎓', Hospital: '🏥',
    Hotel: '🏨', 'Police Station': '🚓', Church: '⛪', Mosque: '🕌',
    Warehouse: '📦', Market: '🛒', 'Government Office': '🏛', Other: '📍',
  };
  return (
    <div className="text-5xl filter drop-shadow-xl animate-bounce">
      {emojiMap[placeType] || '📍'}
    </div>
  );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function haversineM(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getPointDistanceToLine(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) {
    xx = x1; yy = y1;
  } else if (param > 1) {
    xx = x2; yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DriversPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [destination, setDestination] = useState(null);
  const [destinationData, setDestinationData] = useState(null);
  
  const [rawDriverPos, setRawDriverPos] = useState(null);
  const [displayPos, setDisplayPos] = useState(null); 
  const [bearing, setBearing] = useState(0);
  
  const [route, setRoute] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isNearFinal, setIsNearFinal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'system', text: 'Welcome to PPOINNT Dispatch Chat.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  const navMapRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastSpokenRef = useRef('');

  const sendMessage = (text = null) => {
    const msg = text || chatInput;
    if (!msg.trim()) return;
    setChatMessages([...chatMessages, { id: Date.now(), sender: 'driver', text: msg }]);
    setChatInput('');
  };

  const speak = (text) => {
    if (!voiceEnabled || !text || text === lastSpokenRef.current) return;
    
    // Enrich with Landmark if near
    let enrichedText = text;
    if (isNearFinal && destinationData?.landmark) {
       enrichedText = `${text}. Destination is near ${destinationData.landmark}.`;
    }

    const utterance = new SpeechSynthesisUtterance(enrichedText);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = text;
  };

  const [isLowNetwork, setIsLowNetwork] = useState(false);
  useEffect(() => {
    const checkNetwork = () => {
      if (navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType === '2g')) {
        setIsLowNetwork(true);
      } else {
        setIsLowNetwork(false);
      }
    };
    checkNetwork();
    if (navigator.connection) navigator.connection.addEventListener('change', checkNetwork);
    return () => navigator.connection?.removeEventListener('change', checkNetwork);
  }, []);

  // ─── GPS & SMOOTHING ────────────────────────────────────────────────────────

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, heading } = pos.coords;
        const newPos = { lat, lng };
        
        setRawDriverPos((prev) => {
          if (prev && navigating) {
            // Calculate bearing if not provided by GPS
            if (heading === null || heading === undefined) {
              const dy = lat - prev.lat;
              const dx = lng - prev.lng;
              if (Math.abs(dx) > 0.00001 || Math.abs(dy) > 0.00001) {
                const angle = Math.atan2(dx, dy) * (180 / Math.PI);
                setBearing(angle);
              }
            } else {
              setBearing(heading);
            }
          }
          return newPos;
        });

        // Initialize display pos if null
        setDisplayPos((prev) => prev || newPos);
      },
      (err) => console.error('GPS Error:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
  }, [navigating]);

  useEffect(() => {
    startTracking();
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [startTracking]);

  // Smooth lerp for marker
  useEffect(() => {
    if (!rawDriverPos || !displayPos) return;
    const lerp = () => {
      setDisplayPos((prev) => {
        if (!prev) return rawDriverPos;
        const lat = prev.lat + (rawDriverPos.lat - prev.lat) * 0.15;
        const lng = prev.lng + (rawDriverPos.lng - prev.lng) * 0.15;
        return { lat, lng };
      });
    };
    const id = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(id);
  }, [rawDriverPos, displayPos]);

  // ─── ROUTING LOGIC ──────────────────────────────────────────────────────────

  const calcRoute = async (isRecalc = false) => {
    if (!rawDriverPos || !destination) return;
    if (isRecalc) setRecalculating(true); else setLoading(true);
    
    try {
      const response = await api.post('/route', {
        start_lat: rawDriverPos.lat,
        start_lng: rawDriverPos.lng,
        end_lat: destination.lat,
        end_lng: destination.lng,
        mode: searchParams.get('mode') || 'motorcycle',
      });
      
      const data = response.data.data;
      setRoute(data.polyline || []);
      setRouteInfo(data);
      setSteps(data.steps || []);
      setCurrentStepIndex(0);
      setArrived(false);
    } catch (err) {
      console.error('Routing Error:', err);
    } finally {
      setLoading(false);
      setRecalculating(false);
    }
  };

  // Initial search
  useEffect(() => {
    const fetchCode = async () => {
      if (!code) return;
      try {
        const res = await api.get(`/addresses/${code.toUpperCase()}`);
        const d = res.data.data;
        setDestinationData(d);
        setDestination({ lat: d.entrance_latitude || d.latitude, lng: d.entrance_longitude || d.longitude });
      } catch (err) { console.error('Address Fetch Error:', err); }
    };
    fetchCode();
  }, [code]);

  // Trigger route on destination set
  useEffect(() => {
    if (destination && rawDriverPos && !route.length) calcRoute();
  }, [destination, !!rawDriverPos]);

  // ─── TURN-BY-TURN ENGINE ───────────────────────────────────────────────────
  useEffect(() => {
    if (!navigating || !rawDriverPos || !route.length || recalculating || !destination) return;
    
    const distToDest = haversineM(rawDriverPos.lat, rawDriverPos.lng, destination.lat, destination.lng);
    
    // Check if we are too far from the line segments of the route
    let minLineDist = Infinity;
    if (route && route.length > 1) {
      for (let i = 0; i < route.length - 1; i++) {
        const point1 = route[i];
        const point2 = route[i + 1];
        if (point1 && point2 && point1.length >= 2 && point2.length >= 2) {
          const d = getPointDistanceToLine(rawDriverPos.lat, rawDriverPos.lng, point1[0], point1[1], point2[0], point2[1]);
          if (d < minLineDist) minLineDist = d;
        }
      }
    }

    // Approx 50m in lat/lng units (0.00045 degrees approx)
    if (minLineDist > 0.0005) {
      calcRoute(true);
      speak("You are off route. Recalculating.");
      return;
    }

    const nextStep = steps[currentStepIndex + 1];
    if (nextStep && nextStep.location) {
      const distToNextStep = haversineM(rawDriverPos.lat, rawDriverPos.lng, nextStep.location[0], nextStep.location[1]);
      
      // Advance step if we are close enough (within 25m)
      if (distToNextStep < 25) {
        setCurrentStepIndex(v => v + 1);
        const upcomingStep = steps[currentStepIndex + 2];
        speak(upcomingStep?.instruction || "Continue on path");
      } 
      // Voice triggers for upcoming turns (announce 100m before)
      else if (distToNextStep < 110 && distToNextStep > 90) {
        speak(`In 100 meters, ${nextStep.instruction}`);
      }
    } else if (nextStep && !nextStep.location) {
      // Fallback for steps without explicit location (e.g. synthetic routes)
      // Advance by distance to destination instead or keep it simple
      if (distToDest < 50 && steps.length > 1 && currentStepIndex === 0) {
        setCurrentStepIndex(1);
      }
    }

    // Final Approach detection (<30m)
    if (distToDest < 35 && !isNearFinal) {
      setIsNearFinal(true);
      speak(`You are very close. Destination is near ${destinationData?.landmark || 'the marked point'}.`);
    }

    if (distToDest < 15 && !arrived) {
      setArrived(true);
      speak("You have arrived at your PPOINNT destination.");
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    }

  }, [rawDriverPos, route, navigating, steps, currentStepIndex, isNearFinal, arrived, destination, destinationData]);

  // Map Follow
  useEffect(() => {
    if (navigating && autoFollow && displayPos && navMapRef.current) {
      navMapRef.current.easeTo({
        center: [displayPos.lng, displayPos.lat],
        zoom: isNearFinal ? 19.5 : 18,
        pitch: isNearFinal ? 0 : 60, // Top-down for final precision
        bearing: bearing,
        duration: 1000
      });
    }
  }, [displayPos, navigating, autoFollow, bearing, isNearFinal]);

  // ─── RENDERING ──────────────────────────────────────────────────────────────

  const currentStepData = steps[currentStepIndex] || null;

  return (
    <div className="relative h-screen w-full bg-stone-950 font-sans overflow-hidden">
      
      {/* ── MAP ── */}
      <div className="absolute inset-0">
        <MapboxMap
          ref={navMapRef}
          center={displayPos ? [displayPos.lng, displayPos.lat] : [3.3792, 6.5244]}
          zoom={14}
          defaultViewMode="hybrid"
          onDragStart={() => setAutoFollow(false)}
          style={{ height: '100%', width: '100%' }}
        >
          {isNearFinal && destination && (
            <Source id="final-circle" type="geojson" data={{
              type: 'Feature', geometry: { type: 'Point', coordinates: [destination.lng, destination.lat] }
            }}>
              <Layer 
                id="final-pulse" 
                type="circle" 
                paint={{ 
                  'circle-radius': 40, 
                  'circle-color': '#fbbf24', 
                  'circle-opacity': 0.2,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#fbbf24'
                }} 
              />
            </Source>
          )}
          {route.length > 0 && (
            <Source id="nav-route" type="geojson" data={{
              type: 'Feature', geometry: { type: 'LineString', coordinates: route.map(([lat, lng]) => [lng, lat]) }
            }}>
              <Layer id="route-line-bg" type="line" paint={{ 'line-color': '#2563eb', 'line-width': 12, 'line-opacity': 0.3 }} layout={{ 'line-join': 'round', 'line-cap': 'round' }} />
              <Layer id="route-line-main" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 8 }} layout={{ 'line-join': 'round', 'line-cap': 'round' }} />
            </Source>
          )}
          {displayPos && (
             <Marker longitude={displayPos.lng} latitude={displayPos.lat} anchor="center">
                <DriverMarkerPin bearing={bearing} />
             </Marker>
          )}
          {destination && (
             <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
                <DestinationPin placeType={destinationData?.place_type} />
             </Marker>
          )}
        </MapboxMap>
      </div>

      {/* ── TOP NAV UI ── */}
      <div className="absolute top-6 inset-x-4 z-20 pointer-events-none">
        {navigating ? (
          <div className="mx-auto max-w-xl rounded-3xl bg-stone-900/95 p-6 shadow-2xl pointer-events-auto border border-white/10 backdrop-blur-3xl animate-in slide-in-from-top-4">
             <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/20">
                  {currentStepData?.maneuver_modifier?.includes('left') ? <ArrowUpLeft size={48} className="text-white" /> :
                   currentStepData?.maneuver_modifier?.includes('right') ? <ArrowUpRight size={48} className="text-white" /> :
                   <ArrowUp size={48} className="text-white" />}
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-blue-400 uppercase tracking-widest">
                        {isNearFinal ? 'Final Approach' : `${Math.round(currentStepData?.distance || 0)}m`}
                      </span>
                   </div>
                   <h2 className="text-3xl font-black text-white leading-none tracking-tighter mt-1">
                     {currentStepData?.instruction || 'Continue straight'}
                   </h2>
                </div>
             </div>
             {recalculating && (
               <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-orange-500/10 py-2 border border-orange-500/20">
                  <RotateCcw size={16} className="animate-spin text-orange-400" />
                  <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Off-Route • Rerouting...</span>
               </div>
             )}
          </div>
        ) : (
          <div className="mx-auto max-w-xl flex gap-3 pointer-events-auto">
            <button onClick={() => navigate(-1)} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-stone-900 border border-white/10 text-white shadow-xl">
              <ArrowLeft size={24} />
            </button>
            <div className="relative flex-1">
              <input 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="PPOINNT Destination" 
                className="h-14 w-full rounded-2xl border border-white/10 bg-stone-900 px-6 font-black text-white outline-none focus:border-blue-500 shadow-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT CONTROLS ── */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        {navigating && (
          <>
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all ${voiceEnabled ? 'bg-amber-400 text-stone-950' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}
            >
              {voiceEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
            </button>
            {!autoFollow && (
              <button 
                onClick={() => setAutoFollow(true)}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xl animate-pulse"
              >
                <LocateFixed size={32} />
              </button>
            )}
          </>
        )}
      </div>

        {/* ── LOW NETWORK BANNER ── */}
      {isLowNetwork && (
        <div className="absolute top-[140px] inset-x-8 z-30 animate-in slide-in-from-top-2">
           <div className="mx-auto max-w-sm rounded-full bg-orange-500 p-2 px-4 shadow-xl flex items-center justify-center gap-2">
              <Zap size={14} className="text-white animate-pulse" />
              <span className="text-[10px] font-black uppercase text-white tracking-widest">Low signal • Offline Nav active</span>
           </div>
        </div>
      )}

      {/* ── BOTTOM NAV UI ── */}
      <div className="absolute bottom-10 right-4 lg:right-10 z-20 pointer-events-none">
        {arrived ? (
          <div className="max-w-[320px] rounded-[2.5rem] bg-emerald-500 p-6 text-center shadow-3xl pointer-events-auto border-b-4 border-emerald-700 animate-in slide-in-from-right-10">
             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow-lg">
               <CheckCircle2 size={32} />
             </div>
             <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Goal Reached!</h2>
             <p className="mt-1 text-xs font-black text-emerald-100 uppercase tracking-[0.2em]">{destinationData?.code}</p>
             
             <div className="mt-6 flex flex-col gap-2">
                <button 
                  onClick={() => {
                    const text = encodeURIComponent(`I have arrived at PPOINNT: ${destinationData?.code}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="w-full rounded-2xl bg-[#25D366] py-4 text-sm font-black text-white shadow-lg active:scale-95 transition"
                >
                  WhatsApp Arrival
                </button>
                <button 
                  onClick={() => {
                    setNavigating(false);
                    setArrived(false);
                    setDestination(null);
                    setDestinationData(null);
                    navigate('/');
                  }} 
                  className="w-full rounded-2xl bg-black/20 py-3 text-xs font-black text-white hover:bg-black/30 transition"
                >
                  CLOSE TRIP
                </button>
             </div>
          </div>
        ) : navigating ? (
          <div className="mx-auto max-w-xl rounded-3xl bg-stone-900/90 p-6 flex flex-col gap-4 border border-white/10 shadow-3xl backdrop-blur-xl pointer-events-auto overflow-hidden">
             
             {isNearFinal && (destinationData?.landmark || destinationData?.description) && (
               <div className="rounded-2xl bg-amber-400 p-4 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={14} className="text-stone-950" />
                    <p className="text-[10px] font-black text-stone-950 uppercase tracking-widest">Human Instruction</p>
                  </div>
                  <p className="text-lg font-black text-stone-950 leading-tight">
                    {destinationData.landmark && <span>🚩 Near: {destinationData.landmark}</span>}
                    {destinationData.description && <span className="block mt-1 italic opacity-80">"{destinationData.description}"</span>}
                  </p>
               </div>
             )}

             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-white">
                    {Math.ceil((routeInfo?.duration || 0) / 60)} min
                  </span>
                  <span className="text-sm font-bold text-stone-500">
                    {routeInfo?.distance_km} km • ETA {new Date(Date.now() + (routeInfo?.duration || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button onClick={() => setNavigating(false)} className="h-14 px-8 rounded-2xl bg-red-600 font-black text-white shadow-lg active:scale-95 transition">
                  CANCEL
                </button>
             </div>
          </div>
        ) : destination && (
          <div className="mx-auto max-w-xl rounded-[2.5rem] bg-white p-8 shadow-2xl pointer-events-auto border border-stone-200">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <div className={`h-2 w-2 rounded-full ${destinationData?.confidence_score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                        {destinationData?.confidence_score > 80 ? 'High Confidence' : 'Medium Precision'}
                      </p>
                   </div>
                   <h1 className="text-4xl font-black text-stone-950 leading-none tracking-tighter italic">{destinationData?.code}</h1>
                   <p className="text-sm font-bold text-stone-500 mt-1 uppercase tracking-widest">{destinationData?.place_type}</p>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-stone-950">{routeInfo?.distance_km} km</p>
                   <p className="text-sm font-bold text-stone-500">~ {Math.ceil((routeInfo?.duration || 0) / 60)} mins</p>
                </div>
             </div>
             <button 
                onClick={() => setNavigating(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-4 rounded-3xl bg-blue-600 py-6 font-black text-white text-2xl shadow-xl hover:bg-blue-500 active:scale-95 disabled:opacity-50"
             >
                <Navigation size={32} />
                {loading ? 'CALCULATING...' : 'START'}
             </button>
          </div>
        )}
      </div>

      {/* ── CHAT SYSTEM ── */}
      {navigating && !arrived && (
        <button 
          onClick={() => setShowChat(true)}
          className="absolute right-6 bottom-48 z-50 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400 text-stone-950 shadow-2xl shadow-amber-400/20 active:scale-95 transition-all pointer-events-auto"
        >
          <MessageSquare size={28} />
          {chatMessages.length > 1 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">{chatMessages.length - 1}</span>
          )}
        </button>
      )}

      {showChat && (
        <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 transition-all animate-in fade-in duration-300 pointer-events-auto">
           <div className="w-full max-w-xl rounded-[2.5rem] bg-stone-900 border border-white/10 shadow-3xl animate-in slide-in-from-bottom-5 duration-500 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-stone-950">
                    <MessageSquare size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Dispatch Chat</h2>
                </div>
                <button onClick={() => setShowChat(false)} className="rounded-full bg-white/5 p-2 text-white hover:bg-white/10">
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="h-[300px] overflow-y-auto p-6 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-bold ${msg.sender === 'driver' ? 'bg-blue-600 text-white' : 'bg-white/10 text-stone-300'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20">
                <div className="flex gap-2">
                  <input 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-bold text-white outline-none focus:border-amber-400"
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <button onClick={() => sendMessage()} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-amber-400 text-stone-950 shadow-lg active:scale-95 transition">
                    <Send size={18} />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                   {['I am outside', 'Traffic is heavy', 'Almost there'].map(t => (
                     <button key={t} onClick={() => sendMessage(t)} className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-stone-400 border border-white/10 hover:border-amber-400 hover:text-white transition uppercase">
                       {t}
                     </button>
                   ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Error Fallback */}
      {recalculating && !navigating && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-md">
            <div className="text-center">
               <RotateCcw size={48} className="mx-auto animate-spin text-blue-500 mb-4" />
               <p className="font-black text-white text-xl">LOCKING ON SATELLITES...</p>
            </div>
          </div>
      )}

    </div>
  );
}