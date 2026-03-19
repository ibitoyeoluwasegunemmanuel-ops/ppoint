import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import {
  Navigation, Search, LocateFixed, Car, Bike, Footprints,
  Bus, X, Maximize2, Minimize2, ChevronRight, Clock, Route,
  AlertTriangle, CheckCircle2, ArrowLeft, MapPin, Zap
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

const driverIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 0 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L8 10H16L12 2Z"/><circle cx="12" cy="16" r="4"/></svg>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const getDestinationIcon = (placeType) => {
  const emojiMap = {
    House: '🏠', Shop: '🛍', Office: '🏢', School: '🎓', Hospital: '🏥',
    Hotel: '🏨', 'Police Station': '🚓', Church: '⛪', Mosque: '🕌',
    Warehouse: '📦', Market: '🛒', 'Government Office': '🏛',
    'Estate Gate': '🚪', Barracks: '🪖', Other: '📍',
  };
  const emoji = emojiMap[placeType] || '📍';
  return L.divIcon({
    html: `<div style="font-size:34px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));transform:translateY(-17px);text-align:center;line-height:1">${emoji}</div>`,
    className: '',
    iconSize: [40, 42],
    iconAnchor: [20, 42],
  });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineM(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function formatDuration(s) {
  if (s < 60) return `${Math.round(s)}s`;
  const mins = Math.floor(s / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

const TRANSPORT_MODES = [
  { id: 'driving-car', label: 'Car', Icon: Car },
  { id: 'motorcycle', label: 'Moto', Icon: Zap },
  { id: 'walking', label: 'Walk', Icon: Footprints },
  { id: 'bike', label: 'Bike', Icon: Bike },
  { id: 'public-transport', label: 'Transit', Icon: Bus },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MapController({ driverPos, destination, navigating }) {
  const map = useMap();
  useEffect(() => {
    if (navigating && driverPos) {
      map.flyTo([driverPos.lat, driverPos.lng], 17, { animate: true, duration: 1.2 });
    } else if (destination && driverPos) {
      const bounds = L.latLngBounds([
        [driverPos.lat, driverPos.lng],
        [destination.lat, destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (destination) {
      map.flyTo([destination.lat, destination.lng], 15, { animate: true });
    }
  }, [driverPos, destination, navigating, map]);
  return null;
}

function NextManeuverCard({ step, distanceAhead }) {
  if (!step) return null;
  const icon = {
    turn: '↪',
    continue: '↑',
    arrive: '🏁',
    depart: '🚦',
    roundabout: '🔄',
    merge: '⤴',
    fork: '⑂',
  }[step.maneuver_type] || '↑';

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-stone-900/95 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-3xl shadow-lg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-black text-white">{step.instruction}</p>
        {step.name && <p className="mt-0.5 truncate text-sm text-stone-400">{step.name}</p>}
        <p className="mt-1 text-sm font-semibold text-amber-400">{formatDistance(step.distance || distanceAhead)}</p>
      </div>
    </div>
  );
}

function RouteInfoBar({ routeInfo, remainingStep }) {
  if (!routeInfo) return null;
  const remainingDist =
    remainingStep !== null && routeInfo.steps
      ? routeInfo.steps.slice(remainingStep).reduce((sum, s) => sum + (s.distance || 0), 0)
      : routeInfo.distance;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Distance', value: formatDistance(remainingDist || routeInfo.distance) },
        { label: 'ETA', value: formatDuration(routeInfo.duration) },
        { label: 'Arrive', value: routeInfo.estimated_arrival ? new Date(routeInfo.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-stone-900/80 p-3 text-center backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{label}</p>
          <p className="mt-1 text-lg font-black text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DriversPage() {
  const [code, setCode] = useState('');
  const [destination, setDestination] = useState(null);
  const [destinationData, setDestinationData] = useState(null);

  const [driverPos, setDriverPos] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const [route, setRoute] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [transportMode, setTransportMode] = useState('driving-car');
  const [navigating, setNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const watchRef = useRef(null);
  const MAP_DEFAULT = [6.5244, 3.3792]; // Lagos

  // ─── GPS ─────────────────────────────────────────────────────────────────

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser.');
      return;
    }
    setLocationError(null);

    // One-shot initial fix
    navigator.geolocation.getCurrentPosition(
      pos => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => setLocationError('Unable to detect your location. Check browser permissions.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Continuous updates every ~2s during navigation
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        
        // Road Snap (Map Matching)
        try {
          const snapRes = await api.post('/snap', { lat: rawLat, lng: rawLng });
          if (snapRes.data.success && snapRes.data.data.snapped) {
            setDriverPos({
              lat: snapRes.data.data.latitude,
              lng: snapRes.data.data.longitude,
              accuracy: pos.coords.accuracy,
              snapped: true,
              road_name: snapRes.data.data.road_name
            });
          } else {
            setDriverPos({ lat: rawLat, lng: rawLng, accuracy: pos.coords.accuracy, snapped: false });
          }
        } catch {
          setDriverPos({ lat: rawLat, lng: rawLng, accuracy: pos.coords.accuracy, snapped: false });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  }, []);

  useEffect(() => {
    startGPS();
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [startGPS]);

  // ─── Arrival detection ────────────────────────────────────────────────────

  useEffect(() => {
    if (navigating && driverPos && destination) {
      const dist = haversineM(driverPos.lat, driverPos.lng, destination.lat, destination.lng);
      setArrived(dist <= 20);

      // Advance turn-by-turn step when close enough to the step's location
      if (routeInfo?.steps && currentStep < routeInfo.steps.length - 1) {
        const step = routeInfo.steps[currentStep];
        if (step.location) {
          const stepDist = haversineM(driverPos.lat, driverPos.lng, step.location[0], step.location[1]);
          if (stepDist < 30) setCurrentStep(s => Math.min(s + 1, routeInfo.steps.length - 1));
        }
      }
    }
  }, [driverPos, navigating, destination, routeInfo, currentStep]);

  // ─── Search ───────────────────────────────────────────────────────────────

  const searchCode = async () => {
    if (!code.trim()) return;
    setSearchError(null);
    setDestination(null);
    setDestinationData(null);
    setRoute([]);
    setRouteInfo(null);
    setArrived(false);
    setCurrentStep(0);
    setSearchLoading(true);

    try {
      const response = await api.get(`/addresses/${code.trim().toUpperCase()}`);
      const data = response.data.data;
      const lat = data.entrance_latitude ?? data.latitude;
      const lng = data.entrance_longitude ?? data.longitude;
      setDestination({ lat, lng, code: data.ppoint_code || data.code, placeType: data.place_type });
      setDestinationData(data);

      if (driverPos) await calcRoute(driverPos.lat, driverPos.lng, lat, lng);
    } catch {
      setSearchError('PPOINNT code not found. Check the code and try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // ─── Route Calculation ────────────────────────────────────────────────────

  const calcRoute = useCallback(async (startLat, startLng, endLat, endLng) => {
    setRouteLoading(true);
    setRouteError(null);
    setCurrentStep(0);
    try {
      const response = await api.post('/route', {
        start_lat: startLat, start_lng: startLng,
        end_lat: endLat, end_lng: endLng,
        mode: transportMode,
      });
      const data = response.data.data;
      setRoute(data.polyline || []);
      setRouteInfo(data);
    } catch {
      setRouteError('Could not calculate route. Check your connection.');
    } finally {
      setRouteLoading(false);
    }
  }, [transportMode]);

  // Re-calculate when mode changes
  useEffect(() => {
    if (driverPos && destination) {
      calcRoute(driverPos.lat, driverPos.lng, destination.lat, destination.lng);
    }
  }, [transportMode]); // eslint-disable-line

  const startNavigation = async () => {
    if (!driverPos) { startGPS(); return; }
    if (destination && (!route.length || !routeInfo)) {
      await calcRoute(driverPos.lat, driverPos.lng, destination.lat, destination.lng);
    }
    setNavigating(true);
    setIsFullscreen(true);
    setCurrentStep(0);
    setArrived(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen bg-stone-950 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* ── Fullscreen Navigation Mode ── */}
      {navigating && isFullscreen ? (
        <div className="flex h-screen flex-col">
          {/* Map fills most of the screen */}
          <div className="relative flex-1">
            <MapContainer
              center={driverPos ? [driverPos.lat, driverPos.lng] : MAP_DEFAULT}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController driverPos={driverPos} destination={destination} navigating />
              {driverPos && <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}><Popup>You</Popup></Marker>}
              {destination && (
                <Marker position={[destination.lat, destination.lng]} icon={getDestinationIcon(destination.placeType)}>
                  <Popup>{destination.code}</Popup>
                </Marker>
              )}
              {route.length > 0 && <Polyline positions={route} color="#f59e0b" weight={6} opacity={0.85} />}
            </MapContainer>

            {/* Exit button */}
            <button
              onClick={() => { setNavigating(false); setIsFullscreen(false); }}
              className="absolute top-4 left-4 z-[1000] flex items-center gap-2 rounded-2xl bg-stone-900/90 px-4 py-3 font-semibold text-white shadow-xl backdrop-blur-sm"
            >
              <X size={18} /> Exit
            </button>
          </div>

          {/* Bottom panel */}
          <div className="space-y-3 bg-stone-950 p-4">
            {arrived ? (
              <div className="flex items-center gap-4 rounded-3xl bg-emerald-600 p-5 shadow-xl">
                <CheckCircle2 size={40} className="flex-shrink-0 text-white" />
                <div>
                  <p className="text-xl font-black text-white">You have arrived!</p>
                  <p className="text-sm text-emerald-100">{destination?.code}</p>
                </div>
              </div>
            ) : (
              <NextManeuverCard step={routeInfo?.steps?.[currentStep]} distanceAhead={0} />
            )}
            <RouteInfoBar routeInfo={routeInfo} remainingStep={currentStep} />
          </div>
        </div>
      ) : (
        /* ── Normal Setup Mode ── */
        <div className="mx-auto max-w-2xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">PPOINNT</p>
            <h1 className="mt-2 text-4xl font-black text-white">Driver Navigation</h1>
            <p className="mt-2 text-stone-400">Enter a PPOINNT code to get turn-by-turn directions to any address in Africa.</p>
          </div>

          {/* GPS Status */}
          <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${driverPos ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
            <LocateFixed size={20} className={driverPos ? 'text-emerald-400' : 'text-stone-500'} />
            {driverPos ? (
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-300">GPS Active</p>
                <p className="text-xs text-stone-400">{driverPos.lat.toFixed(6)}, {driverPos.lng.toFixed(6)}{driverPos.accuracy ? ` · ±${Math.round(driverPos.accuracy)}m` : ''}</p>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-sm font-semibold text-stone-300">{locationError || 'Detecting location…'}</p>
              </div>
            )}
            <button onClick={startGPS} className="rounded-xl bg-stone-800 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-700 transition">
              Refresh
            </button>
          </div>

          {/* PPOINNT Code Search */}
          <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Search PPOINNT Destination</p>
            <div className="flex gap-3">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && searchCode()}
                placeholder="e.g. PPT-NG-LAG-IKD-U658KY"
                className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-stone-600 focus:border-amber-400/50"
              />
              <button
                onClick={searchCode}
                disabled={searchLoading || !code.trim()}
                className="flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-stone-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 disabled:opacity-50"
              >
                {searchLoading ? <span className="animate-spin text-xs">⌛</span> : <Search size={18} />}
                {searchLoading ? 'Searching…' : 'Search'}
              </button>
            </div>
            {searchError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                <AlertTriangle size={16} /> {searchError}
              </div>
            )}
          </div>

          {/* Transport Mode */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Transport Mode</p>
            <div className="flex gap-2 flex-wrap">
              {TRANSPORT_MODES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTransportMode(id)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    transportMode === id
                      ? 'border-amber-400 bg-amber-400 text-stone-950'
                      : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/20'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            <div className="h-80">
              <MapContainer
                center={driverPos ? [driverPos.lat, driverPos.lng] : MAP_DEFAULT}
                zoom={driverPos ? 13 : 5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController driverPos={driverPos} destination={destination} navigating={false} />
                {driverPos && <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}><Popup>Your location</Popup></Marker>}
                {destination && (
                  <Marker position={[destination.lat, destination.lng]} icon={getDestinationIcon(destination.placeType)}>
                    <Popup>{destination.code}</Popup>
                  </Marker>
                )}
                {route.length > 0 && <Polyline positions={route} color="#f59e0b" weight={5} opacity={0.9} />}
              </MapContainer>
            </div>
            <button
              onClick={() => setIsFullscreen(f => !f)}
              className="absolute bottom-3 right-3 z-[1000] rounded-xl bg-stone-900/80 p-2 text-white backdrop-blur-sm transition hover:bg-stone-800"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Destination Info */}
          {destinationData && (
            <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Destination</p>
              <h2 className="mt-2 text-3xl font-black text-amber-400">{destinationData.ppoint_code || destinationData.code}</h2>
              {destinationData.building_name && <p className="mt-1 text-lg text-white">{destinationData.building_name}</p>}
              {destinationData.display_place_type && <p className="mt-1 text-sm text-stone-400">{destinationData.display_place_type}</p>}
              <p className="mt-1 text-stone-400">{destinationData.city}, {destinationData.state}, {destinationData.country}</p>
              {destinationData.entrance_label && (
                <p className="mt-2 text-sm font-semibold text-emerald-400">🚪 {destinationData.entrance_label}</p>
              )}
              {destinationData.confidence_score > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-800">
                    <div
                      className={`h-2 rounded-full transition-all ${destinationData.confidence_score >= 80 ? 'bg-emerald-400' : destinationData.confidence_score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${destinationData.confidence_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-stone-400">{destinationData.confidence_score}/100</span>
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${destination?.lat},${destination?.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 transition"
                >
                  Google Maps
                </a>
                <a
                  href={`https://waze.com/ul?ll=${destination?.lat},${destination?.lng}&navigate=yes`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 transition"
                >
                  Waze
                </a>
              </div>
            </div>
          )}

          {/* Route Info */}
          {routeLoading && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-stone-400">
              <span className="animate-spin text-lg">⌛</span> Calculating best route…
            </div>
          )}

          {routeInfo && !routeLoading && (
            <div className="mb-6 space-y-4">
              <RouteInfoBar routeInfo={routeInfo} remainingStep={null} />
              {routeInfo.source === 'estimated' && (
                <p className="text-xs text-amber-400">⚠ Estimated route — no Internet connection to routing engine.</p>
              )}

              {/* Turn-by-turn steps */}
              {routeInfo.steps?.length > 0 && (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Turn-by-Turn Directions</p>
                  <ol className="space-y-3">
                    {routeInfo.steps.slice(0, 10).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-amber-400">{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-white">{step.instruction}</p>
                          {(step.distance || step.duration) && (
                            <p className="mt-0.5 text-xs text-stone-500">
                              {step.distance ? formatDistance(step.distance) : ''}{step.distance && step.duration ? ' · ' : ''}{step.duration ? formatDuration(step.duration) : ''}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                    {routeInfo.steps.length > 10 && (
                      <li className="text-xs text-stone-500">…and {routeInfo.steps.length - 10} more steps</li>
                    )}
                  </ol>
                </div>
              )}
            </div>
          )}

          {routeError && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertTriangle size={16} /> {routeError}
            </div>
          )}

          {/* Start Navigation CTA */}
          {destination && (
            <button
              onClick={startNavigation}
              disabled={routeLoading}
              className="flex w-full items-center justify-center gap-3 rounded-3xl bg-amber-400 px-8 py-6 text-2xl font-black text-stone-950 shadow-2xl shadow-amber-400/30 transition hover:bg-amber-300 disabled:opacity-50"
            >
              <Navigation size={28} /> Start Live Navigation
            </button>
          )}
        </div>
      )}
    </div>
  );
}