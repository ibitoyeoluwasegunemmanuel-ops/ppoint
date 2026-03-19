import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, Polyline, Polygon, useMap } from 'react-leaflet';
import {
  Copy, Navigation, QrCode, Save, Share2, Car, Bike, Footprints,
  Bus, X, LocateFixed, AlertTriangle, CheckCircle2, Zap,
  ChevronRight, Clock, MapPin, Building2, ArrowLeft,
} from 'lucide-react';
import QRCode from 'qrcode';
import api from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Icons ─────────────────────────────────────────────────────────────────

const getDestinationIcon = (placeType) => {
  const emojiMap = {
    House: '🏠', Shop: '🛍', Office: '🏢', School: '🎓', Hospital: '🏥',
    Hotel: '🏨', 'Police Station': '🚓', Church: '⛪', Mosque: '🕌',
    Warehouse: '📦', Market: '🛒', 'Government Office': '🏛',
    'Estate Gate': '🚪', Barracks: '🪖', 'Public Building': '🏛', Other: '📍',
  };
  const emoji = emojiMap[placeType] || '📍';
  return L.divIcon({
    html: `<div style="font-size:36px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));transform:translateY(-18px);text-align:center;line-height:1">${emoji}</div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
};

const driverIcon = L.divIcon({
  html: `<div style="width:26px;height:26px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.35),0 2px 12px rgba(0,0,0,0.4)"></div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const entranceIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#22c55e;border:2px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,0.3)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ─── Helpers ────────────────────────────────────────────────────────────────

const TRANSPORT_MODES = [
  { id: 'driving-car', label: 'Car', Icon: Car },
  { id: 'motorcycle', label: 'Moto', Icon: Zap },
  { id: 'walking', label: 'Walk', Icon: Footprints },
  { id: 'bike', label: 'Bike', Icon: Bike },
  { id: 'public-transport', label: 'Transit', Icon: Bus },
];

function haversineM(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  const R = 6371000, toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
function fmtDur(s) {
  const mins = Math.floor(s / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function MapController({ driverPos, center, navigating }) {
  const map = useMap();
  useEffect(() => {
    if (navigating && driverPos) {
      map.flyTo(driverPos, 17, { animate: true, duration: 1.2 });
    } else if (center) {
      map.flyTo(center, 15, { animate: true, duration: 1 });
    }
  }, [driverPos, center, navigating, map]);
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AddressPage() {
  const { code: rawCode } = useParams();
  const code = String(rawCode || '').toUpperCase();
  const [address, setAddress] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation state
  const [navigating, setNavigating] = useState(false);
  const [transportMode, setTransportMode] = useState('driving-car');
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [followDriver, setFollowDriver] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showBuildingPolygon, setShowBuildingPolygon] = useState(true);

  const watchIdRef = useRef(null);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${code}`
    : `https://ppoint.online/${code}`;

  // ─── Fetch address ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await api.get(`/addresses/${code}`);
        setAddress(res.data.data);
      } catch (e) {
        let msg = e.response?.data?.error || e.response?.data?.message || 'Address not found.';
        if (typeof msg !== 'string') msg = JSON.stringify(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [code]);

  useEffect(() => {
    if (!address) return;
    QRCode.toDataURL(shareUrl, { width: 220, margin: 1 })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(''));
  }, [address, shareUrl]);

  // ─── GPS watch ────────────────────────────────────────────────────────────

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported.'); return; }
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      pos => setDriverPos([pos.coords.latitude, pos.coords.longitude]),
      () => setLocationError('Could not get location. Check browser permissions.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        
        // Road Snap (Map Matching) every few seconds
        try {
          const snapRes = await api.post('/snap', { lat: rawLat, lng: rawLng });
          if (snapRes.data.success && snapRes.data.data.snapped) {
            setDriverPos([snapRes.data.data.latitude, snapRes.data.data.longitude]);
          } else {
            setDriverPos([rawLat, rawLng]);
          }
        } catch {
          setDriverPos([rawLat, rawLng]);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  }, []);

  useEffect(() => () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  // ─── Route calculation ────────────────────────────────────────────────────

  const calcRoute = useCallback(async (startPos, address, mode) => {
    if (!startPos || !address) return;
    setRouteLoading(true);
    setRouteError(null);
    setCurrentStep(0);
    const destLat = address.entrance_latitude ?? address.latitude;
    const destLng = address.entrance_longitude ?? address.longitude;
    try {
      const res = await api.post('/route', {
        start_lat: startPos[0], start_lng: startPos[1],
        end_lat: destLat, end_lng: destLng,
        mode,
      });
      setRouteData(res.data.data);
    } catch {
      setRouteError('Route calculation failed. Showing straight-line estimate.');
      // fallback straight line
      setRouteData({
        polyline: [startPos, [destLat, destLng]],
        distance: haversineM(startPos[0], startPos[1], destLat, destLng),
        duration: haversineM(startPos[0], startPos[1], destLat, destLng) / 10,
        steps: [],
        source: 'estimated',
      });
    } finally {
      setRouteLoading(false);
    }
  }, []);

  // Recalculate when mode changes during navigation
  useEffect(() => {
    if (navigating && driverPos && address) {
      calcRoute(driverPos, address, transportMode);
    }
  }, [transportMode]); // eslint-disable-line

  // Arrival detection
  useEffect(() => {
    if (!navigating || !driverPos || !address) return;
    const destLat = address.entrance_latitude ?? address.latitude;
    const destLng = address.entrance_longitude ?? address.longitude;
    const dist = haversineM(driverPos[0], driverPos[1], destLat, destLng);
    setArrived(dist <= 20);

    // Step advance
    if (routeData?.steps && currentStep < routeData.steps.length - 1) {
      const step = routeData.steps[currentStep];
      if (step.location) {
        const sd = haversineM(driverPos[0], driverPos[1], step.location[0], step.location[1]);
        if (sd < 30) setCurrentStep(s => Math.min(s + 1, routeData.steps.length - 1));
      }
    }
  }, [driverPos, navigating, address, routeData, currentStep]);

  const handleStartNavigation = async () => {
    startGPS();
    setNavigating(true);
    setArrived(false);
    // Use current or freshly acquired position
    const pos = driverPos || await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        p => resolve([p.coords.latitude, p.coords.longitude]),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
    if (pos) calcRoute(pos, address, transportMode);
  };

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopyState(key);
    setTimeout(() => setCopyState(''), 2000);
  };

  // ─── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <p className="text-stone-400">Loading PPOINNT address…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md rounded-[2rem] border border-red-400/30 bg-red-500/10 p-10 text-center">
          <AlertTriangle size={40} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-black text-red-300">Address Not Found</h2>
          <p className="mt-3 text-sm text-red-200">{error}</p>
          <Link to="/" className="mt-6 inline-block rounded-2xl bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const position = [Number(address.latitude), Number(address.longitude)];
  const destLat = address.entrance_latitude ?? address.latitude;
  const destLng = address.entrance_longitude ?? address.longitude;
  const destPos = [Number(destLat), Number(destLng)];
  const hasEntrance = address.entrance_latitude && address.entrance_longitude
    && (Number(address.entrance_latitude) !== Number(address.latitude)
      || Number(address.entrance_longitude) !== Number(address.longitude));
  const buildingPolygon = address.building_polygon || address.address_metadata?.building_polygon || [];

  // WhatsApp message (PART 6)
  const whatsappMsg =
    `My PPOINNT delivery address:\n\n${address.ppoint_code || address.code}\n` +
    `${[address.building_name, address.city, address.state].filter(Boolean).join(', ')}\n\n` +
    `Open location:\n${shareUrl}`;

  const deliveryMessage = [
    'Delivery destination', '',
    `PPOINNT Code: ${address.ppoint_code || address.code}`,
    address.display_place_type ? `Place Type: ${address.display_place_type}` : null,
    `Place: ${[address.house_number, address.building_name || address.landmark || 'Saved address'].filter(Boolean).join(' ')}`,
    address.community_name ? `Community: ${address.community_name}` : null,
    address.entrance_label ? `Access Point: ${address.entrance_label}` : null,
    `City: ${address.city}, ${address.state}, ${address.country}`,
    `Link: ${shareUrl}`,
  ].filter(Boolean).join('\n');

  // ─── Full-screen Navigation Mode ─────────────────────────────────────────

  if (navigating) {
    const nextStep = routeData?.steps?.[currentStep];
    const maneuverIcon = {
      turn: '↪', continue: '↑', arrive: '🏁', depart: '🚦',
      roundabout: '🔄', merge: '⤴', fork: '⑂',
    }[nextStep?.maneuver_type] || '↑';

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-stone-950">
        {/* Map */}
        <div className="relative flex-1 overflow-hidden">
          <MapContainer
            center={driverPos || destPos}
            zoom={driverPos ? 17 : 15}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap &amp; CartoDB"
            />
            <MapController
              driverPos={followDriver ? driverPos : null}
              center={followDriver ? null : destPos}
              navigating
            />

            {/* Building polygon */}
            {showBuildingPolygon && buildingPolygon.length >= 3 && (
              <Polygon
                positions={buildingPolygon.map(p => [p.latitude, p.longitude])}
                pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 2 }}
              />
            )}

            {/* Destination */}
            <Marker position={destPos} icon={getDestinationIcon(address.place_type)}>
              <Popup>{address.ppoint_code || address.code}</Popup>
            </Marker>

            {/* Entrance */}
            {hasEntrance && (
              <Marker position={[Number(address.entrance_latitude), Number(address.entrance_longitude)]} icon={entranceIcon}>
                <Popup>🚪 {address.entrance_label || 'Entrance'}</Popup>
              </Marker>
            )}

            {/* Driver */}
            {driverPos && (
              <Marker position={driverPos} icon={driverIcon}>
                <Popup>Your location</Popup>
              </Marker>
            )}

            {/* Route polyline */}
            {routeData?.polyline?.length > 0 && (
              <Polyline positions={routeData.polyline} color="#f59e0b" weight={6} opacity={0.85} />
            )}
          </MapContainer>

          {/* Top-left controls */}
          <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={() => { setNavigating(false); setRouteData(null); setArrived(false); }}
              className="flex items-center gap-2 rounded-2xl bg-stone-900/90 px-4 py-3 font-semibold text-white shadow-xl backdrop-blur-sm"
            >
              <X size={18} /> Exit
            </button>
          </div>

          {/* Follow/Unfollow */}
          <button
            onClick={() => setFollowDriver(f => !f)}
            className={`absolute right-4 top-4 z-[1000] rounded-2xl p-3 shadow-xl backdrop-blur-sm transition ${followDriver ? 'bg-amber-400 text-stone-950' : 'bg-stone-900/90 text-white'}`}
          >
            <LocateFixed size={20} />
          </button>

          {/* Transport mode */}
          <div className="absolute right-4 top-16 z-[1000] flex flex-col gap-1 rounded-2xl border border-white/10 bg-stone-900/90 p-1.5 shadow-xl backdrop-blur-sm">
            {TRANSPORT_MODES.slice(0, 4).map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => setTransportMode(id)}
                className={`rounded-xl p-2.5 transition ${transportMode === id ? 'bg-amber-400 text-stone-950' : 'text-stone-400 hover:text-white'}`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom panel */}
        <div className="space-y-3 bg-stone-950 p-4 pb-6">
          {arrived ? (
            <div className="flex items-center gap-4 rounded-3xl bg-emerald-600 p-5 shadow-xl">
              <CheckCircle2 size={36} className="flex-shrink-0 text-white" />
              <div>
                <p className="text-xl font-black text-white">You have arrived!</p>
                <p className="text-sm text-emerald-100">{address.building_name || address.ppoint_code || address.code}</p>
              </div>
            </div>
          ) : nextStep ? (
            <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-stone-900/95 p-5 shadow-2xl">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-3xl shadow-lg">
                {maneuverIcon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-black text-white">{nextStep.instruction}</p>
                {nextStep.name && <p className="mt-0.5 truncate text-sm text-stone-400">{nextStep.name}</p>}
                <p className="mt-1 text-sm font-semibold text-amber-400">{fmtDist(nextStep.distance || 0)}</p>
              </div>
            </div>
          ) : routeLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-stone-900 p-4 text-stone-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              Calculating route…
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-stone-900 p-4 text-sm text-stone-400">
              {locationError || 'Waiting for GPS…'}
            </div>
          )}

          {/* ETA / Distance bar */}
          {routeData && !arrived && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Distance', value: fmtDist(routeData.distance) },
                { label: 'ETA', value: fmtDur(routeData.duration) },
                { label: 'Arrive', value: new Date(Date.now() + routeData.duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-stone-900/80 p-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{label}</p>
                  <p className="mt-1 text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Normal Address Page ──────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-400 hover:text-white transition">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Map Column ── */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            <div className="h-[480px]">
              <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Building polygon footprint */}
                {showBuildingPolygon && buildingPolygon.length >= 3 && (
                  <Polygon
                    positions={buildingPolygon.map(p => [p.latitude, p.longitude])}
                    pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.18, weight: 2 }}
                  />
                )}
                <Marker position={destPos} icon={getDestinationIcon(address.place_type)}>
                  <Popup>{address.ppoint_code || address.code}</Popup>
                </Marker>
                {hasEntrance && (
                  <Marker position={[Number(address.entrance_latitude), Number(address.entrance_longitude)]} icon={entranceIcon}>
                    <Popup>🚪 {address.entrance_label || 'Entrance'}</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>

          {/* Map controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStartNavigation}
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-amber-400 px-6 py-5 text-lg font-black text-stone-950 shadow-xl shadow-amber-400/30 transition hover:bg-amber-300"
            >
              <Navigation size={22} /> Start Live Navigation
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-5 font-bold text-white hover:bg-blue-500 transition"
            >
              Google Maps
            </a>
            <a
              href={`https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-5 font-bold text-white hover:bg-purple-500 transition"
            >
              Waze
            </a>
          </div>

          {/* Transport mode selector */}
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Navigation Mode</p>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_MODES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTransportMode(id)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
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

          {/* Building polygon toggle */}
          {buildingPolygon.length >= 3 && (
            <button
              onClick={() => setShowBuildingPolygon(v => !v)}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-300 transition hover:text-white"
            >
              <Building2 size={16} />
              {showBuildingPolygon ? 'Hide Building Footprint' : 'Show Building Footprint'}
            </button>
          )}
        </div>

        {/* ── Info Column ── */}
        <div className="space-y-6">
          {/* Code card */}
          <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">PPOINNT Address</p>
            <h1 className="mt-3 text-4xl font-black text-stone-950">{address.ppoint_code || address.code}</h1>

            {address.display_place_type && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{address.display_place_type}</p>
            )}
            {(address.house_number || address.building_name) && (
              <p className="mt-2 text-lg font-bold text-stone-900">
                {[address.house_number, address.building_name].filter(Boolean).join(' ')}
              </p>
            )}
            {address.structured_address_line && (
              <p className="mt-1 text-sm text-stone-700">{address.structured_address_line}</p>
            )}
            {address.community_name && (
              <p className="mt-1 text-sm text-stone-600">📍 {address.community_name}</p>
            )}
            {address.landmark && (
              <p className="mt-1 text-sm text-stone-600">🗺 Near {address.landmark}</p>
            )}
            <p className="mt-2 text-base font-semibold text-stone-700">{address.city}, {address.state}, {address.country}</p>
            <p className="mt-1 font-mono text-xs text-stone-400">{Number(address.latitude).toFixed(6)}, {Number(address.longitude).toFixed(6)}</p>

            {address.entrance_label && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                🚪 Access point: {address.entrance_label}
              </div>
            )}

            {/* Confidence score */}
            {address.confidence_score > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-stone-500">Location Accuracy</span>
                  <span className={`text-xs font-bold ${address.confidence_score >= 80 ? 'text-emerald-600' : address.confidence_score >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                    {address.confidence_score}/100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`h-2 rounded-full transition-all ${address.confidence_score >= 80 ? 'bg-emerald-500' : address.confidence_score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${address.confidence_score}%` }}
                  />
                </div>
                {address.confidence_guidance && (
                  <p className="mt-1.5 text-xs text-stone-500">{address.confidence_guidance}</p>
                )}
              </div>
            )}

            <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              Created by {address.created_by || 'Community'} · {address.moderation_status || 'active'}
            </p>
          </div>

          {/* WhatsApp sharing (PART 6) */}
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-stone-400">Share Address</p>
            <div className="mb-4 rounded-2xl bg-black/30 p-4">
              <p className="whitespace-pre-line font-mono text-sm text-stone-300 leading-6">{whatsappMsg}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`, '_blank', 'noopener,noreferrer')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 font-bold text-white shadow-lg shadow-[#25D366]/20 transition hover:bg-[#20b858]"
              >
                <Share2 size={18} /> Share via WhatsApp
              </button>
              <button
                onClick={() => window.open(`sms:?body=${encodeURIComponent(deliveryMessage)}`, '_self')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold text-white transition hover:bg-white/10"
              >
                <Share2 size={18} /> Share via SMS
              </button>
              <button
                onClick={() => copyToClipboard(deliveryMessage, 'message')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                <Copy size={16} /> {copyState === 'message' ? '✓ Copied' : 'Copy Message'}
              </button>
              <button
                onClick={() => copyToClipboard(address.ppoint_code || address.code, 'code')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 py-4 font-semibold text-white border border-stone-700 transition hover:bg-stone-900"
              >
                <Copy size={16} /> {copyState === 'code' ? '✓ Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* QR + Link */}
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-400">Shareable Link</p>
              <button
                onClick={() => setShowQrCode(v => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-stone-300 hover:text-white transition"
              >
                <QrCode size={14} /> {showQrCode ? 'Hide QR' : 'Show QR'}
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
              <p className="flex-1 break-all font-mono text-sm text-stone-300">{shareUrl}</p>
              <button
                onClick={() => copyToClipboard(shareUrl, 'link')}
                className="flex-shrink-0 rounded-xl bg-white/10 p-2 text-stone-300 hover:text-white transition"
              >
                <Copy size={16} />
              </button>
            </div>
            {copyState === 'link' && <p className="mt-2 text-xs text-emerald-400">✓ Link copied!</p>}

            {showQrCode && qrCodeUrl && (
              <div className="mt-4 flex justify-center">
                <div className="rounded-2xl bg-white p-3 shadow-xl">
                  <img src={qrCodeUrl} alt={`QR code for ${address.code}`} className="h-48 w-48 rounded-xl" />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const saved = JSON.parse(localStorage.getItem('ppoint_saved_addresses') || '[]');
                const next = [{ label: address.building_name || address.code, ...address }, ...saved.filter(i => i.code !== address.code)];
                localStorage.setItem('ppoint_saved_addresses', JSON.stringify(next));
                setCopyState('saved');
                setTimeout(() => setCopyState(''), 2000);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-stone-300 transition hover:text-white"
            >
              <Save size={16} /> {copyState === 'saved' ? '✓ Saved Offline' : 'Save for Offline Use'}
            </button>
          </div>

          {/* API resolve card for developers */}
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Developer API</p>
            <div className="rounded-2xl bg-black/40 p-4 font-mono text-xs text-stone-300 overflow-x-auto">
              <p className="text-amber-400">GET /api/resolve/{address.ppoint_code || address.code}</p>
              <p className="mt-2 text-stone-500">→ Returns coordinates, confidence score, entrance, and metadata.</p>
            </div>
            <button
              onClick={() => copyToClipboard(`GET ${window.location.origin.replace(':5173', ':3000').replace(':5174', ':3000')}/api/resolve/${address.ppoint_code || address.code}`, 'api')}
              className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-white transition"
            >
              <Copy size={12} /> {copyState === 'api' ? '✓ Copied' : 'Copy API URL'}
            </button>
          </div>

          {/* Claim prompt */}
          {(address.status === 'unverified' || address.status === 'claimed') && (
            <a
              href={`/claim-building?buildingId=${address.id}`}
              className="block w-full rounded-2xl bg-yellow-500/20 border border-yellow-500/30 px-5 py-4 text-center font-bold text-yellow-300 hover:bg-yellow-500/30 transition"
            >
              {address.status === 'claimed' ? '⚠ This address is already claimed' : '🏢 Claim this PPOINNT address'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}