import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MapboxMap, { Marker, Source, Layer } from '../components/MapboxMap';
import api from '../services/api';
import { PP } from '../styles/tokens';

function DriverMarkerPin({ bearing = 0 }) {
  return (
    <div style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.3s ease-out', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: -8, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(46,107,255,0.4), transparent)',
        animation: 'pulse-ring 1.5s ease-out infinite',
      }} />
      <svg width="34" height="34" viewBox="0 0 32 32">
        <path d="M16 2 L26 28 L16 22 L6 28 Z" fill={PP.blue} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function DestinationPin() {
  return (
    <svg width="44" height="52" viewBox="0 0 40 48">
      <path d="M20 47s-15-16-15-27a15 15 0 1 1 30 0c0 11-15 27-15 27z" fill={PP.yellow} stroke="#0A0B0D" strokeWidth="1.2"/>
      <circle cx="20" cy="19" r="6" fill="#0A0B0D"/>
    </svg>
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
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden', fontFamily: PP.font }}>

      {/* ── MAP ── */}
      <div style={{ position: 'absolute', inset: 0 }}>
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

      {/* ── TOP INSTRUCTION / SEARCH ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '52px 14px 0' }}>
        {navigating ? (
          <div style={{
            background: 'rgba(20,22,28,0.94)', backdropFilter: 'blur(24px)',
            borderRadius: 20, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            border: `1px solid ${PP.line}`,
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: PP.blue, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                {currentStepData?.maneuver_modifier?.includes('left')
                  ? <path d="M22 22L10 14 L22 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  : currentStepData?.maneuver_modifier?.includes('right')
                  ? <path d="M10 22L22 14 L10 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  : <path d="M16 24V8M10 14l6-6 6 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                }
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: PP.blue, fontWeight: 700, marginBottom: 4 }}>
                {isNearFinal ? 'Final Approach' : `${Math.round(currentStepData?.distance || 0)} m`}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.2 }}>
                {currentStepData?.instruction || 'Continue straight'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{
              width: 46, height: 46, borderRadius: 14, border: `1px solid ${PP.line}`,
              background: 'rgba(20,22,28,0.9)', backdropFilter: 'blur(20px)',
              color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Enter PPOINNT code…"
              style={{
                flex: 1, height: 46, borderRadius: 14,
                background: 'rgba(20,22,28,0.9)', backdropFilter: 'blur(20px)',
                border: `1px solid rgba(255,255,255,0.1)`,
                color: PP.text, fontSize: 15, fontWeight: 700, fontFamily: PP.font,
                padding: '0 16px', outline: 'none',
              }}
            />
          </div>
        )}

        {/* Low network */}
        {isLowNetwork && (
          <div style={{
            marginTop: 10, padding: '8px 14px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
            backdropFilter: 'blur(20px)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: PP.amber }}>
              <path d="M3 3l18 18M5 12.5a13 13 0 0 1 4-2.5M19 12.5a13 13 0 0 0-6-3.4M9 16.5a6 6 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="12" cy="20" r="1" fill="currentColor"/>
            </svg>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Low network · using offline maps</span>
          </div>
        )}

        {/* Recalculating */}
        {recalculating && (
          <div style={{
            marginTop: 10, padding: '8px 14px',
            background: 'rgba(229,72,77,0.1)', border: `1px solid rgba(229,72,77,0.25)`,
            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${PP.red}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 12, color: PP.red, fontWeight: 700 }}>Off route · Recalculating…</span>
          </div>
        )}
      </div>

      {/* ── RIGHT CONTROLS ── */}
      {navigating && (
        <div style={{ position: 'absolute', right: 14, top: '45%', zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} style={{
            width: 44, height: 44, borderRadius: 14, border: 'none',
            background: voiceEnabled ? PP.yellow : PP.redSoft,
            color: voiceEnabled ? '#0A0B0D' : PP.red,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            {voiceEnabled
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4zM23 9l-6 6M17 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            }
          </button>
          {!autoFollow && (
            <button onClick={() => setAutoFollow(true)} style={{
              width: 44, height: 44, borderRadius: 14, border: 'none',
              background: PP.blue, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 1v3M12 20v3M23 12h-3M4 12H1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
      )}

      {/* ── BOTTOM CARD ── */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
        {arrived ? (
          <div style={{
            background: PP.green, padding: '20px 20px 36px', textAlign: 'center',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke={PP.green} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>You have arrived!</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 20 }}>{destinationData?.code}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 4px' }}>
              <button onClick={() => {
                const text = encodeURIComponent(`I have arrived at PPOINNT: ${destinationData?.code}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }} style={{
                width: '100%', height: 50, borderRadius: 16, border: 'none',
                background: '#25D366', color: '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
              }}>Share arrival on WhatsApp</button>
              <button onClick={() => { setNavigating(false); setArrived(false); setDestination(null); navigate('/'); }} style={{
                width: '100%', height: 46, borderRadius: 16, border: 'none',
                background: 'rgba(0,0,0,0.2)', color: '#fff',
                fontSize: 14, fontWeight: 600, fontFamily: PP.font, cursor: 'pointer',
              }}>Close trip</button>
            </div>
          </div>
        ) : navigating ? (
          <div style={{
            background: PP.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: '18px 20px 32px', borderTop: `1px solid ${PP.line}`,
          }}>
            {isNearFinal && (destinationData?.landmark || destinationData?.description) && (
              <div style={{
                background: PP.yellow, borderRadius: 16, padding: '12px 14px', marginBottom: 14,
                color: '#0A0B0D',
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Entrance hint</div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                  {destinationData.landmark && `Near: ${destinationData.landmark}`}
                  {destinationData.description && ` · ${destinationData.description}`}
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { v: `${(routeInfo?.distance_km || 0)}`, u: 'km', l: 'Distance' },
                { v: `${Math.ceil((routeInfo?.duration || 0) / 60)}`, u: 'min', l: 'ETA', highlight: true },
                { v: new Date(Date.now() + (routeInfo?.duration || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), u: '', l: 'Arrival' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.highlight ? PP.yellow : PP.text }}>{s.v}</div>
                    {s.u && <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600 }}>{s.u}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: PP.text3, marginTop: 2, fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setNavigating(false)} style={{
                flex: 1, height: 50, borderRadius: 16, border: 'none',
                background: PP.red, color: '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
              }}>End trip</button>
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} style={{
                width: 50, height: 50, borderRadius: 16, border: `1px solid ${PP.line}`,
                background: PP.card, color: PP.text2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/></svg>
              </button>
            </div>
          </div>
        ) : destination ? (
          <div style={{
            background: PP.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: '20px 20px 36px', borderTop: `1px solid ${PP.line}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: (destinationData?.confidence_score || 0) > 80 ? PP.green : PP.amber }} />
                  <span style={{ fontSize: 11, color: PP.text3, fontWeight: 700 }}>
                    {(destinationData?.confidence_score || 0) > 80 ? 'High confidence' : 'Medium precision'}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: PP.mono }}>{destinationData?.code}</div>
                <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>{destinationData?.place_type} · {destinationData?.city}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{routeInfo?.distance_km} km</div>
                <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>~{Math.ceil((routeInfo?.duration || 0) / 60)} min</div>
              </div>
            </div>
            <button onClick={() => setNavigating(true)} disabled={loading} style={{
              width: '100%', height: 54, borderRadius: 18, border: 'none',
              background: loading ? PP.blueSoft : PP.blue, color: '#fff',
              fontSize: 16, fontWeight: 700, fontFamily: PP.font, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/></svg>
              {loading ? 'Calculating route…' : 'Start navigation'}
            </button>
          </div>
        ) : null}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
    </div>
  );
}