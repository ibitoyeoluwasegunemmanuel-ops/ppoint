import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import api from '../services/api';
import { PP } from '../styles/tokens';

const I = {
  search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  layers: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 1v3M12 20v3M23 12h-3M4 12H1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

const VIEW_MODES = ['standard', 'satellite', 'hybrid'];
const VIEW_LABELS = { standard: 'Map', satellite: 'Satellite', hybrid: 'Hybrid' };

export default function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [center] = useState([6.5244, 3.3792]);
  const [viewMode, setViewMode] = useState('standard');
  const [selectedPos, setSelectedPos] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const cycleView = () => {
    const idx = VIEW_MODES.indexOf(viewMode);
    setViewMode(VIEW_MODES[(idx + 1) % VIEW_MODES.length]);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo(coords.longitude, coords.latitude, 17);
      },
      () => {},
      { enableHighAccuracy: true },
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.get('/address/search', { params: { code: searchQuery.trim().toUpperCase() } });
      const addr = res.data.data;
      if (addr) {
        setResolvedAddress(addr);
        setSelectedPos({ lat: Number(addr.latitude), lng: Number(addr.longitude) });
        mapRef.current?.flyTo(Number(addr.longitude), Number(addr.latitude), 18);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Full map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapboxMap
          ref={mapRef}
          center={[center[1], center[0]]}
          zoom={13}
          defaultViewMode={viewMode}
          onClick={(lat, lng) => {
            setSelectedPos({ lat, lng });
            setResolvedAddress(null);
          }}
          style={{ height: '100%', width: '100%' }}
        >
          {selectedPos && (
            <Marker longitude={selectedPos.lng} latitude={selectedPos.lat} anchor="bottom">
              <svg width="44" height="52" viewBox="0 0 40 48">
                <path d="M20 47s-15-16-15-27a15 15 0 1 1 30 0c0 11-15 27-15 27z" fill={PP.yellow} stroke="#0A0B0D" strokeWidth="1.2"/>
                <circle cx="20" cy="19" r="6" fill="#0A0B0D"/>
              </svg>
            </Marker>
          )}
        </MapboxMap>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', zIndex: 5, padding: '52px 16px 0' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, height: 46, borderRadius: 14,
            background: 'rgba(20,22,28,0.9)', backdropFilter: 'blur(20px)',
            border: `1px solid rgba(255,255,255,0.1)`,
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
          }}>
            <span style={{ color: PP.text3 }}>{I.search()}</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Enter PPOINNT code…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: PP.text, fontSize: 14, fontFamily: PP.font,
              }}
            />
            {loading && <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${PP.yellow}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />}
          </div>
          <button type="submit" style={{
            width: 46, height: 46, borderRadius: 14, border: 'none',
            background: PP.yellow, color: '#0A0B0D',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>{I.search()}</button>
        </form>
      </div>

      {/* Map controls */}
      <div style={{ position: 'absolute', right: 14, top: 170, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={cycleView} style={{
          width: 42, height: 42, borderRadius: 13,
          border: `1px solid ${PP.line}`, background: 'rgba(20,22,28,0.9)', backdropFilter: 'blur(20px)',
          color: PP.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.layers()}</button>
        <button onClick={detectLocation} style={{
          width: 42, height: 42, borderRadius: 13,
          border: `1px solid ${PP.line}`, background: 'rgba(20,22,28,0.9)', backdropFilter: 'blur(20px)',
          color: PP.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.target()}</button>
      </div>

      {/* View mode badge */}
      <div style={{
        position: 'absolute', left: 14, top: 110, zIndex: 5,
        background: 'rgba(20,22,28,0.88)', backdropFilter: 'blur(20px)',
        border: `1px solid ${PP.line}`, borderRadius: 10,
        padding: '6px 12px', fontSize: 11, fontWeight: 700, color: PP.text2,
      }}>{VIEW_LABELS[viewMode]}</div>

      {/* Bottom card when pin placed */}
      {selectedPos && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10,
          background: PP.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '20px 20px 24px',
        }} className="animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {resolvedAddress ? resolvedAddress.code : 'Location selected'}
            </div>
            <button onClick={() => { setSelectedPos(null); setResolvedAddress(null); }} style={{
              width: 32, height: 32, borderRadius: 10, border: 'none',
              background: PP.card, color: PP.text3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>{I.close()}</button>
          </div>
          {resolvedAddress && (
            <div style={{ fontSize: 13, color: PP.text3, marginBottom: 14 }}>
              {resolvedAddress.city}, {resolvedAddress.state}
            </div>
          )}
          <button onClick={() => navigate('/generate', { state: { lat: selectedPos.lat, lng: selectedPos.lng } })} style={{
            width: '100%', height: 50, borderRadius: 16, border: 'none',
            background: PP.yellow, color: '#0A0B0D',
            fontSize: 15, fontWeight: 700, fontFamily: PP.font,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer',
          }}>{I.plus()} Generate PPOINNT here</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
