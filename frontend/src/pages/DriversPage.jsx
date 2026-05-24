import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MapboxMap, { Marker, Source, Layer } from '../components/MapboxMap';
import api from '../services/api';
import { PP } from '../styles/tokens';

// ── Icons ─────────────────────────────────────────────────────────────────────
const I = {
  nav:       () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  phone:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  wa:        () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
  volume:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" opacity="0.5"/><path d="M16 8a5 5 0 0 1 0 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 5a8 8 0 0 1 0 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  volumeX:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" opacity="0.5"/><path d="M18 6l-6 6m0 0l6 6m-6-6l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  minimize:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m6-5h3a2 2 0 0 1 2 2v3m0 6v3a2 2 0 0 1-2 2h-3m-6 0H5a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  maximize:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m6-5h3a2 2 0 0 1 2 2v3m0 6v3a2 2 0 0 1-2 2h-3m-6 0H5a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chrono:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  arrow:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

function DriverMarkerPin({ bearing = 0 }) {
  return (
    <div style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.3s ease-out', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(46,107,255,0.4), transparent)', animation: 'pulse-ring 1.5s ease-out infinite' }} />
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

// ── Math helpers ──────────────────────────────────────────────────────────────
function haversineM(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || lat2 === undefined || lng2 === undefined) return Infinity;
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  return `${mins}m`;
}

function getTurnIcon(instruction) {
  if (!instruction) return '📍';
  const inst = instruction.toLowerCase();
  if (inst.includes('left')) return '↙️';
  if (inst.includes('right')) return '↘️';
  if (inst.includes('straight') || inst.includes('continue')) return '↑️';
  if (inst.includes('arrive')) return '🎯';
  if (inst.includes('u-turn')) return '↩️';
  return '📍';
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DriversPage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [destination, setDestination] = useState(null);
  const [destinationData, setDestinationData] = useState(null);
  const [displayPos, setDisplayPos] = useState(null);
  const [bearing, setBearing] = useState(0);
  const [route, setRoute] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [distanceToDest, setDistanceToDest] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [lowDistraction, setLowDistraction] = useState(false);
  const [distanceToNextStep, setDistanceToNextStep] = useState(null);
  const [isNearEntrance, setIsNearEntrance] = useState(false);

  const navMapRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastSpokenRef = useRef('');

  const speak = (text) => {
    if (!voiceEnabled || !text || text === lastSpokenRef.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = text;
  };

  // GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, heading } = pos.coords;
        setDisplayPos({ lat, lng });
        if (heading !== null && heading !== undefined) setBearing(heading);
      },
      (err) => console.error('GPS Error:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    startTracking();
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [startTracking]);

  // Fetch destination
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

  // Calculate route
  const calcRoute = useCallback(async () => {
    if (!displayPos || !destination) return;
    try {
      const response = await api.post('/route', {
        start_lat: displayPos.lat,
        start_lng: displayPos.lng,
        end_lat: destination.lat,
        end_lng: destination.lng,
        mode: searchParams.get('mode') || 'motorcycle',
      });
      const data = response.data.data;
      setRoute(data.polyline || []);
      setSteps(data.steps || []);
      setCurrentStepIndex(0);
      setArrived(false);
    } catch (err) { console.error('Routing Error:', err); }
  }, [displayPos, destination, searchParams]);

  useEffect(() => {
    if (destination && displayPos && !route.length && navigating) calcRoute();
  }, [destination, displayPos, navigating, route.length, calcRoute]);

  // Turn-by-turn engine
  useEffect(() => {
    if (!navigating || !displayPos || !route.length || !destination) return;

    const distToDest = haversineM(displayPos.lat, displayPos.lng, destination.lat, destination.lng);
    setDistanceToDest(distToDest);
    setEtaSeconds((distToDest / (25 / 3.6)));

    if (distToDest < 30 && !isNearEntrance) {
      setIsNearEntrance(true);
      speak(`You are approaching the entrance. Destination is near ${destinationData?.landmark || 'the marked point'}.`);
    }

    if (distToDest < 15 && !arrived) {
      setArrived(true);
      speak('You have arrived at your destination.');
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    }

    const nextStep = steps[currentStepIndex];
    if (nextStep && nextStep.location) {
      const distToStep = haversineM(displayPos.lat, displayPos.lng, nextStep.location[0], nextStep.location[1]);
      setDistanceToNextStep(distToStep);
      if (distToStep < 25) {
        setCurrentStepIndex(i => i + 1);
        const upcomingStep = steps[currentStepIndex + 1];
        if (upcomingStep) speak(`${getTurnIcon(upcomingStep.instruction)} ${upcomingStep.instruction}`);
      } else if (distToStep < 110 && distToStep > 90) {
        speak(`In 100 meters, ${nextStep.instruction}`);
      }
    }
  }, [displayPos, route, navigating, destination, steps, currentStepIndex, isNearEntrance, arrived, destinationData]);

  // Map follow
  useEffect(() => {
    if (navigating && displayPos && navMapRef.current) {
      navMapRef.current.easeTo({
        center: [displayPos.lng, displayPos.lat],
        zoom: isNearEntrance ? 19.5 : 18,
        pitch: isNearEntrance ? 0 : 50,
        bearing: bearing,
        duration: 1000
      });
    }
  }, [displayPos, navigating, bearing, isNearEntrance]);

  const currentStep = steps[currentStepIndex] || null;

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', height: '100dvh', display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden', fontFamily: PP.font }}>

      {/* Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapboxMap ref={navMapRef} center={displayPos ? [displayPos.lng, displayPos.lat] : [3.3792, 6.5244]} zoom={14} style={{ height: '100%', width: '100%' }}>
          {displayPos && <Marker longitude={displayPos.lng} latitude={displayPos.lat} anchor="center"><DriverMarkerPin bearing={bearing} /></Marker>}
          {destination && <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom"><DestinationPin /></Marker>}
          {route.length > 0 && (
            <Source id="route" type="geojson" data={{ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route }, properties: {} }] }}>
              <Layer id="route" type="line" paint={{ 'line-color': PP.yellow, 'line-width': 5, 'line-opacity': 0.7 }} />
            </Source>
          )}
        </MapboxMap>
      </div>

      {/* Code search (when not navigating) */}
      {!navigating && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '52px 16px 16px', background: 'linear-gradient(to bottom, rgba(10,11,13,0.95), transparent)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="PPT-NG-LAG-XY-1234" style={{
              flex: 1, padding: '14px 16px', borderRadius: 14, background: PP.card, border: `1px solid ${PP.line}`,
              color: PP.yellow, fontFamily: PP.mono, fontWeight: 700, fontSize: 13, outline: 'none',
            }} />
            <button onClick={() => code && setNavigating(true)} style={{
              width: 52, height: 52, borderRadius: 14, border: 'none', background: PP.yellow, color: '#0A0B0D',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}>{I.arrow()}</button>
          </div>
        </div>
      )}

      {/* Navigation mode */}
      {navigating && (
        <>
          {/* Top: ETA + controls */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 15, padding: '52px 16px 12px', background: 'linear-gradient(to bottom, rgba(10,11,13,0.88), transparent)', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {etaSeconds && <div style={{ fontSize: 13, color: PP.text3, fontWeight: 600 }}>ETA</div>}
                {etaSeconds && <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: PP.yellow, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {I.chrono()} {formatDuration(etaSeconds)}
                </div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setVoiceEnabled(!voiceEnabled)} style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.12)', color: voiceEnabled ? PP.yellow : PP.text3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>{voiceEnabled ? I.volume() : I.volumeX()}</button>
                <button onClick={() => setLowDistraction(!lowDistraction)} style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none', background: lowDistraction ? PP.yellowSoft : 'rgba(255,255,255,0.12)', color: lowDistraction ? PP.yellow : PP.text3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>{lowDistraction ? I.minimize() : I.maximize()}</button>
                <button onClick={() => setNavigating(false)} style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.12)', color: PP.text3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20,
                }}>✕</button>
              </div>
            </div>
          </div>

          {/* Bottom: Immersive cards */}
          {!lowDistraction && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '16px', background: 'linear-gradient(to top, rgba(10,11,13,0.95), transparent)' }}>
              {arrived ? (
                <div style={{ background: PP.greenSoft, borderRadius: 20, border: `2px solid ${PP.green}`, padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: PP.green, marginBottom: 8 }}>Arrived!</div>
                  <div style={{ fontSize: 13, color: PP.text3, marginBottom: 16 }}>{destinationData?.address || 'Your destination'}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { const url = `tel:${destinationData?.phone || '+234'}`; window.location.href = url; }} style={{
                      flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: PP.green, color: '#0A0B0D', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>{I.phone()} Call</button>
                    <button onClick={() => window.open(`https://wa.me/${destinationData?.phone || ''}`, '_blank')} style={{
                      flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: '#25D366', color: '#fff', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>{I.wa()} WhatsApp</button>
                  </div>
                </div>
              ) : isNearEntrance ? (
                <div style={{ background: PP.yellowSoft, borderRadius: 20, border: `2px solid ${PP.yellow}`, padding: '20px', textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: PP.yellow, marginBottom: 4 }}>Look for the entrance</div>
                  {destinationData?.landmark && <div style={{ fontSize: 13, color: PP.text3 }}>Near {destinationData.landmark}</div>}
                  {distanceToDest && <div style={{ fontSize: 14, fontWeight: 700, color: PP.yellow, marginTop: 8 }}>📍 {Math.round(distanceToDest)}m away</div>}
                </div>
              ) : currentStep ? (
                <div style={{ background: PP.card, borderRadius: 20, border: `1px solid ${PP.lineStrong}`, padding: '24px 20px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 18, background: PP.blueSoft, color: PP.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
                      {getTurnIcon(currentStep.instruction)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: PP.text3, fontWeight: 600, marginBottom: 4 }}>Next turn</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: PP.text, lineHeight: 1.3 }}>
                        {currentStep.instruction || 'Continue ahead'}
                      </div>
                      {distanceToNextStep && (
                        <div style={{ fontSize: 12, color: PP.yellow, fontWeight: 700, marginTop: 6 }}>
                          📏 {Math.round(distanceToNextStep)}m
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: 14 }}>
                    <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600, marginBottom: 4 }}>Distance to destination</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: PP.yellow }}>
                      {distanceToDest ? `${Math.round(distanceToDest / 1000 * 10) / 10} km` : '—'}
                    </div>
                  </div>
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { const url = `tel:${destinationData?.phone || '+234'}`; window.location.href = url; }} style={{
                  flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: PP.card, color: PP.text, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>{I.phone()} Call Recipient</button>
                <button onClick={() => window.open(`https://wa.me/${destinationData?.phone || ''}`, '_blank')} style={{
                  flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>{I.wa()} WhatsApp Chat</button>
              </div>
            </div>
          )}

          {/* Low distraction mode */}
          {lowDistraction && (
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10, padding: '16px', background: 'rgba(46,107,255,0.15)', borderRadius: 16, border: `1px solid ${PP.blue}`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: PP.text3 }}>Distance</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: PP.blue }}>{distanceToDest ? `${Math.round(distanceToDest)}m` : '—'}</div>
              </div>
              <div style={{ width: 1, height: 40, background: PP.blue + '40' }} />
              <div>
                <div style={{ fontSize: 12, color: PP.text3 }}>ETA</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: PP.yellow }}>{etaSeconds ? formatDuration(etaSeconds) : '—'}</div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
    </div>
  );
}
