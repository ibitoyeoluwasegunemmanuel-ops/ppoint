import { useState, useRef, useEffect, useCallback } from 'react';
import MapboxMap, { Marker, Popup, Source, Layer, MapViewToggle } from '../components/MapboxMap';
import {
  Navigation, Search, LocateFixed, Car, Bike, Footprints,
  Bus, X, Maximize2, CheckCircle2, MapPin, Zap, AlertTriangle,
  Volume2, VolumeX, Navigation2
} from 'lucide-react';
import api from '../services/api';

// ─── Icons ────────────────────────────────────────────────────────────────────

function DriverMarkerPin() {
  return (
    <div style={{
      width: 28, height: 28, background: '#3b82f6', border: '3px solid white',
      borderRadius: '50%', boxShadow: '0 0 0 4px rgba(59,130,246,0.3),0 0 12px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L8 10H16L12 2Z"/><circle cx="12" cy="16" r="4"/></svg>
    </div>
  );
}

function DestinationPin({ placeType }) {
  const emojiMap = {
    House: '🏠', Shop: '🛍', Office: '🏢', School: '🎓', Hospital: '🏥',
    Hotel: '🏨', 'Police Station': '🚓', Church: '⛪', Mosque: '🕌',
    Warehouse: '📦', Market: '🛒', 'Government Office': '🏛',
    'Estate Gate': '🚪', Barracks: '🪖', Other: '📍',
  };
  const emoji = emojiMap[placeType] || '📍';
  return <div style={{ fontSize: 32, lineHeight: 1, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}>{emoji}</div>;
}

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

// Distance from driver to closest point on route polyline
function distanceToRoute(driverLat, driverLng, routePolyline) {
  if (!routePolyline || routePolyline.length < 2) return Infinity;
  let minDist = Infinity;
  for (const [lat, lng] of routePolyline) {
    const d = haversineM(driverLat, driverLng, lat, lng);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Generate a random session ID
function genSessionId() {
  return `nav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Route Confidence Badge component
function ConfidenceBadge({ confidence }) {
  if (!confidence) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-2.5 backdrop-blur-sm"
      title={`Confidence factors: ${JSON.stringify(confidence.factors)}`}
    >
      <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: confidence.color }} />
      <span className="text-xs font-bold text-white">Route Confidence</span>
      <span className="ml-auto text-sm font-black" style={{ color: confidence.color }}>
        {confidence.score}%
      </span>
      <span className="text-xs font-semibold" style={{ color: confidence.color }}>{confidence.label}</span>
    </div>
  );
}

// Africa routing hint banner
function AfricaHintBanner({ hint }) {
  if (!hint) return null;
  const { mode_recommendation, traffic_hint } = hint;
  if (!mode_recommendation && !traffic_hint) return null;
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm">
      {traffic_hint && <p className="text-amber-200">🚦 {traffic_hint}</p>}
      {mode_recommendation && (
        <p className="mt-1 font-semibold text-amber-300">
          💡 {mode_recommendation.reason}
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Route GeoJSON line layer for Mapbox
function RouteLayer({ route }) {
  if (!route || route.length === 0) return null;
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: route.map(([lat, lng]) => [lng, lat]),
    },
  };
  return (
    <Source id="route-driver" type="geojson" data={geojson}>
      <Layer id="route-driver-casing" type="line" paint={{
        'line-color': '#000000', 'line-width': 10, 'line-opacity': 0.3
      }} layout={{ 'line-join': 'round', 'line-cap': 'round' }} />
      <Layer id="route-driver-line" type="line" paint={{
        'line-color': '#f59e0b', 'line-width': 6, 'line-opacity': 0.9
      }} layout={{ 'line-join': 'round', 'line-cap': 'round' }} />
    </Source>
  );
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
  const [autoFollow, setAutoFollow] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [navViewMode, setNavViewMode] = useState('hybrid');

  // Auto-follow effect for map tracking driver
  useEffect(() => {
    if (navigating && autoFollow && driverPos && navMapRef.current) {
      navMapRef.current.flyTo(driverPos.lng, driverPos.lat);
    }
  }, [driverPos, navigating, autoFollow]);

  // ─── Driver Intelligence State ─────────────────────────────────────────────
  const [routeConfidence, setRouteConfidence] = useState(null);
  const [africaHint, setAfricaHint] = useState(null);
  const [sessionId] = useState(() => genSessionId());
  const [deviationCount, setDeviationCount] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [positionLog, setPositionLog] = useState([]); // for learned route submission

  const watchRef = useRef(null);
  const navMapRef = useRef(null);
  const previewMapRef = useRef(null);
  const positionIntervalRef = useRef(null); // interval for sending positions to backend
  const MAP_DEFAULT_LNG = 3.3792;
  const MAP_DEFAULT_LAT = 6.5244;

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
      // Confidence comes bundled with the route response
      if (data.confidence) setRouteConfidence(data.confidence);
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

  // ─── Route Confidence + Africa Hints ─────────────────────────────────────

  const fetchConfidenceAndHints = useCallback(async (sLat, sLng, eLat, eLng, mode, polyline) => {
    try {
      const [confRes, hintsRes] = await Promise.all([
        api.post('/driver/route/confidence', {
          start_lat: sLat, start_lng: sLng,
          end_lat: eLat, end_lng: eLng,
          mode, polyline,
        }).catch(() => null),
        api.post('/driver/route/hints', {
          start_lat: sLat, start_lng: sLng,
          end_lat: eLat, end_lng: eLng,
          mode,
        }).catch(() => null),
      ]);
      if (confRes?.data?.success) setRouteConfidence(confRes.data.data);
      if (hintsRes?.data?.success) setAfricaHint(hintsRes.data.data);
    } catch { /* non-critical */ }
  }, []);

  // ─── Start Intelligence Session ───────────────────────────────────────────

  const startIntelligenceSession = useCallback(async (sLat, sLng, eLat, eLng, mode) => {
    try {
      await api.post('/driver/session/start', {
        session_id: sessionId,
        start_lat: sLat, start_lng: sLng,
        end_lat: eLat, end_lng: eLng,
        mode,
      });
    } catch { /* non-critical */ }
  }, [sessionId]);

  // ─── Position Reporting to Backend (every 10s) ───────────────────────────

  const startPositionReporting = useCallback((sid) => {
    if (positionIntervalRef.current) clearInterval(positionIntervalRef.current);
    positionIntervalRef.current = setInterval(() => {
      setDriverPos(pos => {
        if (pos) {
          api.post(`/driver/session/${sid}/position`, { lat: pos.lat, lng: pos.lng }).catch(() => {});
          setPositionLog(prev => [...prev.slice(-200), [pos.lat, pos.lng]]);
        }
        return pos;
      });
    }, 10000);
  }, []);

  const stopPositionReporting = useCallback(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  }, []);

  // ─── Complete Session ─────────────────────────────────────────────────────

  const completeIntelligenceSession = useCallback(async (reason = 'arrived') => {
    stopPositionReporting();
    try {
      await api.post(`/driver/session/${sessionId}/complete`, { reason });
      if (deviationCount > 0 && positionLog.length >= 2 && destination) {
        await api.post('/driver/route/learn', {
          start_lat: positionLog[0][0], start_lng: positionLog[0][1],
          end_lat: destination.lat, end_lng: destination.lng,
          mode: transportMode,
          path: positionLog,
          duration_s: 0,
        }).catch(() => {});
      }
    } catch { /* non-critical */ }
  }, [sessionId, deviationCount, positionLog, destination, transportMode, stopPositionReporting]);


  // ─── Deviation Detection ──────────────────────────────────────────────────
  // If driver is >80m off route, recalculate automatically
  useEffect(() => {
    if (!navigating || !driverPos || !route.length || arrived || isRecalculating) return;
    const dist = distanceToRoute(driverPos.lat, driverPos.lng, route);
    if (dist > 80) { // 80m off route = deviation
      setDeviationCount(d => d + 1);
      setIsRecalculating(true);
      // Record deviation in backend
      const closestPoint = route.reduce((best, pt) => {
        const d = haversineM(driverPos.lat, driverPos.lng, pt[0], pt[1]);
        return d < best.d ? { d, lat: pt[0], lng: pt[1] } : best;
      }, { d: Infinity, lat: route[0]?.[0], lng: route[0]?.[1] });
      api.post(`/driver/session/${sessionId}/deviation`, {
        driver_lat: driverPos.lat, driver_lng: driverPos.lng,
        expected_lat: closestPoint.lat, expected_lng: closestPoint.lng,
      }).catch(() => {});
      // Instant recalculation
      calcRoute(driverPos.lat, driverPos.lng, destination.lat, destination.lng)
        .finally(() => setIsRecalculating(false));
    }
  }, [driverPos, navigating, route, arrived, isRecalculating, destination, sessionId]); // eslint-disable-line

  // ─── Fly map to driver position when navigating ───────────────────────────
  useEffect(() => {
    if (navigating && driverPos && navMapRef.current) {
      navMapRef.current.flyTo(driverPos.lng, driverPos.lat, 17);
    }
  }, [driverPos, navigating]);

  // ─── Fit preview map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigating && driverPos && destination && previewMapRef.current) {
      previewMapRef.current.fitBounds(
        [[Math.min(driverPos.lng, destination.lng) - 0.01, Math.min(driverPos.lat, destination.lat) - 0.01],
         [Math.max(driverPos.lng, destination.lng) + 0.01, Math.max(driverPos.lat, destination.lat) + 0.01]],
        { padding: 60, maxZoom: 16 }
      );
    } else if (!navigating && destination && previewMapRef.current) {
      previewMapRef.current.flyTo(destination.lng, destination.lat, 15);
    }
  }, [driverPos, destination, navigating]);

  // ─── Fetch confidence + hints after route calculated ─────────────────────
  useEffect(() => {
    if (routeInfo && driverPos && destination) {
      fetchConfidenceAndHints(
        driverPos.lat, driverPos.lng,
        destination.lat, destination.lng,
        transportMode,
        route,
      );
    }
  }, [routeInfo]); // eslint-disable-line

  const startNavigation = async () => {
    if (!driverPos) { startGPS(); return; }
    if (destination && (!route.length || !routeInfo)) {
      await calcRoute(driverPos.lat, driverPos.lng, destination.lat, destination.lng);
    }
    // Start intelligence session
    await startIntelligenceSession(
      driverPos.lat, driverPos.lng,
      destination.lat, destination.lng,
      transportMode,
    );
    startPositionReporting(sessionId);
    setNavigating(true);
    setIsFullscreen(true);
    setCurrentStep(0);
    setArrived(false);
    setDeviationCount(0);
    setPositionLog([]);
    setNavViewMode('hybrid');
  };

  // ─── On arrival ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (arrived && navigating) {
      completeIntelligenceSession('arrived');
    }
  }, [arrived]); // eslint-disable-line

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopPositionReporting();
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [stopPositionReporting]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full flex flex-col bg-stone-900 overflow-hidden">
      {/* ── FULLSCREEN MAP ── */}
      <div className="absolute inset-0 z-0">
        <MapboxMap
          ref={navigating ? navMapRef : previewMapRef}
          center={driverPos ? [driverPos.lng, driverPos.lat] : [MAP_DEFAULT_LNG, MAP_DEFAULT_LAT]}
          zoom={driverPos ? (navigating ? 16 : 14) : 5}
          defaultViewMode={navViewMode}
          defaultTheme="dark"
          showViewToggle={false}
          onDragStart={() => setAutoFollow(false)}
          style={{ height: '100%', width: '100%' }}
        >
          {route && <RouteLayer route={route} />}
          {driverPos && (
             <Marker longitude={driverPos.lng} latitude={driverPos.lat} anchor="center">
                <DriverMarkerPin />
             </Marker>
          )}
          {destination && (
             <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
                <DestinationPin placeType={destination.placeType} />
             </Marker>
          )}
        </MapboxMap>
      </div>

      {/* ── FLOATING TOP CONTROLS ── */}
      <div className="absolute top-4 inset-x-4 z-10 flex flex-col gap-3 max-w-xl mx-auto pointer-events-none">
        {navigating ? (
          <div className="flex flex-col gap-3 pointer-events-auto">
             <NextManeuverCard step={routeInfo?.steps?.[currentStep]} distanceAhead={0} />
          </div>
        ) : (
          <div className="flex gap-2 pointer-events-auto">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && searchCode()}
              placeholder="Search Destination Code..."
              className="flex-1 rounded-[1.5rem] border border-white/20 bg-stone-950/80 px-5 py-4 font-bold text-white shadow-xl backdrop-blur-xl outline-none placeholder:text-stone-400 focus:border-amber-400/50"
            />
            <button
              onClick={searchCode}
              disabled={searchLoading || !code.trim()}
              className="flex items-center justify-center rounded-[1.5rem] bg-amber-400 px-5 py-4 font-black text-stone-950 shadow-xl transition hover:bg-amber-300 disabled:opacity-50"
            >
              {searchLoading ? <span className="animate-spin text-xl">⌛</span> : <Search size={24} />}
            </button>
          </div>
        )}

        {searchError && !navigating && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/80 p-3 text-sm font-semibold text-white shadow-lg backdrop-blur pointer-events-auto flex items-center gap-2">
            <AlertTriangle size={16} /> {searchError}
          </div>
        )}
        {locationError && !navigating && (
           <div className="rounded-2xl border border-amber-500/30 bg-amber-500/80 p-3 text-sm font-semibold text-stone-900 shadow-lg backdrop-blur pointer-events-auto flex items-center gap-2">
             <AlertTriangle size={16} /> {locationError}
           </div>
        )}
      </div>

      {/* ── INTELLIGENCE ALERTS & RECALCULATING OVERLAY ── */}
      <div className="absolute top-24 inset-x-4 z-10 flex flex-col gap-2 max-w-xl mx-auto pointer-events-none">
        {isRecalculating && (
           <div className="flex items-center gap-3 rounded-2xl border border-blue-400/30 bg-blue-500/80 px-4 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-md pointer-events-auto">
             <span className="animate-spin">↻</span> Rerouting to a better path...
           </div>
        )}
        {navigating && routeConfidence && <div className="pointer-events-auto"><ConfidenceBadge confidence={routeConfidence} /></div>}
        {navigating && africaHint && <div className="pointer-events-auto"><AfricaHintBanner hint={africaHint} /></div>}
        {navigating && deviationCount > 0 && (
           <div className="flex items-center gap-2 rounded-2xl border border-purple-400/30 bg-purple-500/80 px-4 py-2 text-xs font-bold text-white shadow-lg pointer-events-auto">
             Learning new route pattern ({deviationCount} reroute{deviationCount > 1 ? 's' : ''})
           </div>
        )}
      </div>

      {/* ── FLOATING RIGHT CONTROLS ── */}
      <div className="absolute right-4 bottom-56 z-10 flex flex-col gap-3 pointer-events-none">
        {navigating && (
          <>
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-stone-950/80 text-white shadow-xl backdrop-blur-xl hover:bg-stone-900 pointer-events-auto transition"
            >
              {voiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} className="text-stone-500" />}
            </button>
            {!autoFollow && (
              <button
                onClick={() => setAutoFollow(true)}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-400/90 text-stone-950 shadow-xl backdrop-blur-xl hover:bg-amber-400 pointer-events-auto transition animate-pulse"
                title="Recenter"
              >
                <Navigation2 size={24} />
              </button>
            )}
          </>
        )}
        {!navigating && (
          <button
            onClick={startGPS}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-stone-950/80 text-amber-400 shadow-xl backdrop-blur-xl hover:bg-stone-900 pointer-events-auto transition"
            title="Locate Me"
          >
            <LocateFixed size={24} />
          </button>
        )}
      </div>

      {/* ── BOTTOM ACTION PANEL ── */}
      <div className="absolute inset-x-4 bottom-8 z-10 mx-auto max-w-xl flex flex-col gap-3 transition-transform duration-300 pointer-events-none">
        
        {/* Destination Pre-Navigation Card */}
        {destinationData && !navigating && (
          <div className="rounded-[1.75rem] border border-white/20 bg-stone-950/80 p-5 shadow-2xl backdrop-blur-xl pointer-events-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">Destination</p>
                <h2 className="mt-1 text-4xl font-black text-white">{destinationData.code}</h2>
                <p className="text-sm text-stone-400 mt-1">{destinationData.city}, {destinationData.state}</p>
              </div>
              <button onClick={() => setTransportMode('motorcycle')} className={`p-3 rounded-2xl transition ${transportMode === 'motorcycle' ? 'bg-amber-400 text-stone-950' : 'bg-white/10 text-white'}`}><Zap size={24} /></button>
              <button onClick={() => setTransportMode('driving-car')} className={`p-3 rounded-2xl transition ${transportMode === 'driving-car' ? 'bg-amber-400 text-stone-950' : 'bg-white/10 text-white'}`}><Car size={24} /></button>
            </div>
            
            <button
              onClick={startNavigation}
              disabled={routeLoading || !route}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 py-4 text-xl font-black text-stone-950 shadow-xl shadow-amber-400/20 transition hover:bg-amber-300 disabled:opacity-50"
            >
              <Navigation size={24} /> {routeLoading ? 'Calculating Route...' : 'Start Driving'}
            </button>
          </div>
        )}

        {/* Live Navigation Cards */}
        {navigating && (
          <div className="space-y-3 pointer-events-auto">
            {arrived && (
              <div className="flex items-center gap-4 rounded-[1.75rem] border border-emerald-400/30 bg-emerald-500/90 p-6 shadow-2xl backdrop-blur-xl">
                <CheckCircle2 size={40} className="text-white" />
                <div>
                  <p className="text-2xl font-black text-white">You have arrived</p>
                  <p className="text-sm font-semibold text-emerald-100">{destinationData?.code}</p>
                </div>
              </div>
            )}
            <div className="rounded-[1.75rem] border border-white/20 bg-stone-950/90 p-4 shadow-2xl backdrop-blur-xl">
               <RouteInfoBar routeInfo={routeInfo} remainingStep={currentStep} />
               <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => { setNavigating(false); completeIntelligenceSession('cancelled'); }}
                    className="flex-1 rounded-2xl bg-red-500/20 py-3 font-bold text-red-400 hover:bg-red-500/30 transition shadow-lg"
                  >
                    End Navigation
                  </button>
                  <div className="flex items-center overflow-hidden rounded-2xl bg-stone-800 pointer-events-auto w-fit px-1">
                     <MapViewToggle viewMode={navViewMode} onChange={setNavViewMode} theme="dark" />
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}