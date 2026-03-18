import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap } from 'react-leaflet';
import { Copy, Navigation, QrCode, Save, Share2, Car, Bike, Footprints, Bus, X, Loader2, LocateFixed } from 'lucide-react';
import QRCode from 'qrcode';
import api from '../services/api';
import L from 'leaflet';

/** Custom Mapping Utilities **/
const getDestinationIcon = (placeType) => {
  const emojiMap = {
    House: '🏠', Shop: '🛍', Office: '🏢', School: '🎓', Hospital: '🏥',
    Hotel: '🏨', 'Police Station': '🚓', Church: '⛪', Mosque: '🕌',
    Warehouse: '📦', Market: '🛒', 'Government Office': '🏛',
    'Estate Gate': '🚪', Barracks: '🪖', 'Public Building': '🏛', Other: '📍'
  };
  const emoji = emojiMap[placeType] || '📍';
  
  return L.divIcon({
    html: `<div style="font-size: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); transform: translateY(-16px); text-align: center;">${emoji}</div>`,
    className: 'custom-destination-icon bg-transparent border-none',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
};

const driverIcon = L.divIcon({
  html: `<div style="width: 22px; height: 22px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  className: 'driver-marker bg-transparent',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

function MapRefresher({ center, zoom, followDriver }) {
  const map = useMap();
  useEffect(() => {
    if (center && followDriver) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, followDriver, map]);
  return null;
}

export default function AddressPage() {
  const { code } = useParams();
  const [address, setAddress] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publicConfig, setPublicConfig] = useState(null);
  
  // Navigation State
  const [navigating, setNavigating] = useState(false);
  const [transportMode, setTransportMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [driverPos, setDriverPos] = useState(null);
  const [driverLocationError, setDriverLocationError] = useState(null);
  const [followDriver, setFollowDriver] = useState(true);
  const watchIdRef = useRef(null);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${code}` : `https://ppoint.africa/${code}`;

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await api.get(`/address/${code}`);
        setAddress(response.data.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Address not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
    api.get('/platform/system/public-config')
      .then((response) => setPublicConfig(response.data.data || null))
      .catch(() => setPublicConfig(null));
  }, [code]);

  useEffect(() => {
    if (!address) return;
    QRCode.toDataURL(shareUrl, { width: 220, margin: 1 })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(''));
  }, [address, shareUrl]);

  // Handle Route Calculation when destination/start/mode changes
  useEffect(() => {
    if (!navigating || !address || !driverPos) return;

    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const p = transportMode === 'public' ? 'driving' : transportMode;
        const response = await fetch(`https://router.project-osrm.org/route/v1/${p}/${driverPos[1]},${driverPos[0]};${Number(address.longitude)},${Number(address.latitude)}?overview=full&geometries=geojson`);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteData({
            distance: route.distance,
            duration: route.duration,
            coordinates: route.geometry.coordinates.map(c => [c[1], c[0]])
          });
        }
      } catch (e) {
        console.error('Routing error:', e);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [navigating, address, driverPos, transportMode]);

  // Handle GPS Tracking
  useEffect(() => {
    if (navigating) {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            setDriverPos([pos.coords.latitude, pos.coords.longitude]);
            setDriverLocationError(null);
          },
          (err) => {
            setDriverLocationError('Unable to detect live location');
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      } else {
        setDriverLocationError('Geolocation not supported');
      }
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setDriverPos(null);
      setRouteData(null);
    }
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [navigating]);

  if (loading) {
    return <div className="flex items-center justify-center p-16 text-white">Loading address...</div>;
  }

  if (error) {
    return <div className="rounded-[2rem] border border-red-200/30 bg-red-500/10 p-10 text-center text-red-100">{error}</div>;
  }

  const position = [Number(address.latitude), Number(address.longitude)];
  const deliveryMessage = [
    'Delivery destination',
    '',
    `PPOINNT Code: ${address.code}`,
    address.display_place_type ? `Place type: ${address.display_place_type}` : null,
    `Place: ${[address.house_number, address.building_name || address.landmark || address.description || 'Saved address'].filter(Boolean).join(' ')}`,
    address.structured_address_line ? `Address line: ${address.structured_address_line}` : null,
    `City: ${address.city}, ${address.state}, ${address.country}`,
    `Share Link: ${shareUrl}`,
  ].filter(Boolean).join('\n');

  const sendToDriver = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(deliveryMessage)}`, '_blank', 'noopener,noreferrer');
  };

  const sendBySms = () => {
    window.open(`sms:?body=${encodeURIComponent(deliveryMessage)}`, '_self');
  };

  if (navigating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 font-sans">
        <div className="absolute left-6 top-6 z-[1000] flex flex-col gap-4">
          <button onClick={() => setNavigating(false)} className="rounded-full bg-white/10 p-4 text-white hover:bg-white/20 shadow-lg backdrop-blur">
            <X size={24} />
          </button>
        </div>

        <div className="absolute right-6 top-6 z-[1000] w-fit rounded-[2rem] border border-white/10 bg-black/60 p-2 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2">
            {[ 
              { mode: 'driving', icon: Car, label: 'Car' }, 
              { mode: 'bike', icon: Bike, label: 'Motorcycle' }, 
              { mode: 'public', icon: Bus, label: 'Public Transport' },
              { mode: 'foot', icon: Footprints, label: 'Walking' }
            ].map((t) => (
              <button
                key={t.mode}
                onClick={() => setTransportMode(t.mode)}
                className={`flex rounded-2xl p-4 transition ${transportMode === t.mode ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-transparent text-white hover:bg-white/10'}`}
                title={t.label}
              >
                <t.icon size={22} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <MapContainer center={driverPos || position} zoom={driverPos ? 17 : 14} zoomControl={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap & CartoDB' />
            <MapRefresher center={driverPos || null} zoom={18} followDriver={followDriver} />
            
            {driverPos && (
               <Marker position={driverPos} icon={driverIcon}><Popup>Your live location</Popup></Marker>
            )}

            <Marker position={position} icon={getDestinationIcon(address.place_type || address.custom_place_type || 'Other')}><Popup>{address.building_name || 'Destination'}</Popup></Marker>

            {routeData && routeData.coordinates && (
              <Polyline positions={routeData.coordinates} color="#3b82f6" weight={7} opacity={0.8} lineCap="round" lineJoin="round" />
            )}
          </MapContainer>
          
          <button onClick={() => setFollowDriver(prev => !prev)} className={`absolute bottom-36 right-6 z-[1000] rounded-full p-4 shadow-xl transition ${followDriver ? 'bg-amber-400 text-black' : 'bg-stone-800 text-white'}`}>
               <LocateFixed size={24} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-[1000] rounded-t-[3rem] border-t border-white/10 bg-black/90 px-8 py-8 backdrop-blur-xl shadow-2xl">
          {routeLoading ? (
             <div className="flex items-center gap-3 text-amber-400"><Loader2 className="animate-spin" size={24} /> Calculating optimal route...</div>
          ) : routeData ? (
             <div className="flex items-center justify-between text-white">
               <div>
                 <p className="text-5xl font-black">{Math.ceil(routeData.duration / 60)}<span className="text-2xl font-semibold opacity-70 ml-1">min</span></p>
                 <p className="mt-2 text-stone-400 tracking-wide font-medium">{(routeData.distance / 1000).toFixed(1)} km • {transportMode.toUpperCase()}</p>
               </div>
               <div className="text-right">
                  <p className="text-xl font-bold text-emerald-400">Arrival {new Date(Date.now() + routeData.duration * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p className="text-stone-400 mt-1 font-mono">{address.code}</p>
               </div>
             </div>
          ) : (
             <div className="text-stone-400">
                {driverLocationError ? <span className="text-red-400">{driverLocationError}</span> : 'Waiting for GPS signal to calculate route...'}
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/20">
        <div className="h-[520px] relative">
          <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position} icon={getDestinationIcon(address.place_type || address.custom_place_type || 'Other')}><Popup>{address.code}</Popup></Marker>
          </MapContainer>
        </div>
        <div className="p-6 bg-white border-t border-stone-200">
           <button onClick={() => setNavigating(true)} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 px-6 py-5 text-lg font-black text-stone-950 shadow-xl shadow-amber-400/20 hover:bg-amber-300 transition">
             <Navigation size={24} />
             Start Live Navigation
           </button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500">PPOINT Address</p>
        <h1 className="mt-3 text-4xl font-black text-stone-950">{address.code}</h1>
        <p className="mt-3 text-lg text-stone-600">{address.city}, {address.state}, {address.country}</p>
        {address.display_place_type && <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{address.display_place_type}</p>}
        {(address.house_number || address.building_name) && <p className="mt-2 text-sm font-semibold text-stone-800">{[address.house_number, address.building_name].filter(Boolean).join(' ')}</p>}
        {address.structured_address_line && <p className="mt-2 text-sm font-medium text-stone-800">{address.structured_address_line}</p>}
        {address.landmark && <p className="mt-2 text-sm font-medium text-stone-700">Nearby landmark: {address.landmark}</p>}
        {address.district && <p className="mt-2 text-sm font-medium text-stone-700">District: {address.district}</p>}
        {address.street_description && <p className="mt-2 text-sm text-stone-600">{address.street_description}</p>}
        {address.description && <p className="mt-2 text-sm text-stone-600">{address.description}</p>}
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-stone-500">Created by {address.created_by || 'Community'} • {address.moderation_status || 'active'}</p>
        <p className="mt-3 font-mono text-sm text-stone-500">{position[0].toFixed(6)}, {position[1].toFixed(6)}</p>

        <div className="mt-6 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-700">Send to Driver</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">{deliveryMessage}</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button onClick={sendToDriver} className="rounded-2xl bg-[#25D366] px-5 py-3 text-center font-semibold text-white cursor-pointer">
            <Share2 size={16} className="inline mr-2" />WhatsApp
          </button>
          <button onClick={sendBySms} className="rounded-2xl bg-stone-100 px-5 py-3 text-center font-semibold text-stone-900 cursor-pointer">
            <Share2 size={16} className="inline mr-2" />SMS
          </button>
          <button onClick={async () => { await navigator.clipboard.writeText(deliveryMessage); setCopyState('message'); setTimeout(() => setCopyState(''), 1800); }} className="rounded-2xl bg-stone-100 px-5 py-3 font-semibold text-stone-900">
            <Copy size={16} className="inline mr-2" />{copyState === 'message' ? 'Copied Message' : 'Copy Message'}
          </button>
          <button onClick={async () => { await navigator.clipboard.writeText(address.code); setCopyState('code'); setTimeout(() => setCopyState(''), 1800); }} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">
            <Copy size={16} className="inline mr-2" />{copyState === 'code' ? 'Copied Code' : 'Copy Code'}
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <button onClick={async () => { await navigator.clipboard.writeText(shareUrl); setCopyState('link'); setTimeout(() => setCopyState(''), 1800); }} className="rounded-2xl bg-stone-100 px-5 py-3 font-semibold text-stone-900">
            <Copy size={16} className="inline mr-2" />{copyState === 'link' ? 'Copied Link' : 'Copy Link'}
          </button>
          <button onClick={() => setShowQrCode((current) => !current)} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white cursor-pointer">
            <QrCode size={16} className="inline mr-2" />Generate QR
          </button>
          <button onClick={() => setNavigating(true)} className="rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-stone-950 shadow-lg shadow-amber-400/20 md:col-span-3 lg:col-span-1">
             <Navigation size={16} className="inline mr-2" />Navigate
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-700">Permanent code</p>
          <p className="mt-2 text-sm leading-7 text-stone-600">This PPOINT code is permanently linked to this saved location and can be reused in maps, logistics, emergency response, and business systems.</p>
        </div>

        {address.status === 'unverified' || address.status === 'claimed' ? (
          <div className="mt-6">
            <a
              href={`/claim-building?buildingId=${address.id}`}
              className="block w-full rounded-2xl bg-yellow-500 px-5 py-4 text-center font-bold text-white text-lg shadow-md mt-2"
            >
              {address.status === 'claimed' ? 'This building is already claimed' : 'This building already exists. Claim this PPOINNT address.'}
            </a>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-700">Shareable link</p>
            <p className="mt-2 break-all font-mono text-sm text-stone-900">{shareUrl}</p>
            <button onClick={() => {
              const saved = JSON.parse(localStorage.getItem('ppoint_saved_addresses') || '[]');
              const nextSaved = [{ label: 'Saved Address', ...address }, ...saved.filter((item) => item.code !== address.code)];
              localStorage.setItem('ppoint_saved_addresses', JSON.stringify(nextSaved));
            }} className="mt-4 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"><Save size={14} className="inline mr-2" />Save Offline</button>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4 text-center">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700"><QrCode size={16} />QR Code</p>
            {showQrCode && qrCodeUrl && <img src={qrCodeUrl} alt={`QR for ${address.code}`} className="mx-auto mt-3 h-44 w-44 rounded-xl bg-white p-2" />}
          </div>
        </div>
      </div>
    </div>
  );
}