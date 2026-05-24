import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import api from '../services/api';
import { PP } from '../styles/tokens';

// ── Icons ─────────────────────────────────────────────────────────────────────
const I = {
  search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  mic: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  plus: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  arrow: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  nav: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  share: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 11l7-4M8.5 13l7 4" stroke="currentColor" strokeWidth="1.6"/></svg>,
  scan: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  house: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  shop: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 8l2-4h14l2 4M3 8h18v12H3V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 1v3M12 20v3M23 12h-3M4 12H1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  layers: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  wa: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
};

function CodeChip({ code }) {
  const parts = code.split('-');
  return (
    <span style={{ fontFamily: PP.mono, fontWeight: 700, letterSpacing: 0.4 }}>
      {parts.map((p, i) => (
        <span key={i}>
          <span style={{ color: i === parts.length - 1 ? PP.yellow : PP.text }}>{p}</span>
          {i < parts.length - 1 && <span style={{ color: PP.text3 }}>-</span>}
        </span>
      ))}
    </span>
  );
}

const PLACE_TYPE_ICONS = {
  House: I.house, Shop: I.shop,
};
function PlaceIcon({ type }) {
  const Ic = PLACE_TYPE_ICONS[type] || I.house;
  return <Ic />;
}

export default function HomePage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [position, setPosition] = useState([6.5244, 3.3792]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');
  const [showGuidance, setShowGuidance] = useState(true);
  const [viewMode, setViewMode] = useState('standard');
  const [recentPpoints, setRecentPpoints] = useState([
    { code: 'PPT-NG-LAG-IKD-1234', name: '15, Abraham Adesanya, Lekki', time: '2 min ago', type: 'House' },
    { code: 'PPT-NG-LAG-YBA-5678', name: '23, Kudirat Abiola Way, Oregun', time: '1 hr ago', type: 'Shop' },
    { code: 'PPT-NG-ABJ-GRK-9012', name: 'Block 12, Garki, Abuja', time: 'Yesterday', type: 'House' },
  ]);

  useEffect(() => {
    const t = setTimeout(() => setShowGuidance(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setPosition([lat, lng]);
        setSelectedPosition({ lat, lng });
        mapRef.current?.flyTo(lng, lat, 17);
        setLoading(false);
      },
      () => setLoading(false),
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
        setResult(addr);
        setSelectedPosition({ lat: Number(addr.latitude), lng: Number(addr.longitude) });
        setPosition([Number(addr.latitude), Number(addr.longitude)]);
        mapRef.current?.flyTo(Number(addr.longitude), Number(addr.latitude), 18);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  const shareToWhatsApp = (code) => {
    const text = encodeURIComponent(`📍 PPOINNT Address:\n${code}\n\n${window.location.origin}/p/${code}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: PP.bg }}>

      {/* ── MAP ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapboxMap
          ref={mapRef}
          center={[position[1], position[0]]}
          zoom={15}
          defaultViewMode={viewMode}
          onClick={(lat, lng) => {
            setSelectedPosition({ lat, lng });
            setPosition([lat, lng]);
            setResult(null);
          }}
          style={{ height: '100%', width: '100%' }}
        >
          {selectedPosition && (
            <Marker
              longitude={selectedPosition.lng}
              latitude={selectedPosition.lat}
              anchor="bottom"
              draggable
              onDragEnd={({ lngLat: { lng, lat } }) => setSelectedPosition({ lat, lng })}
            >
              <div style={{ position: 'relative', cursor: 'move' }}>
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: '50%',
                  background: `radial-gradient(closest-side, ${PP.yellowGlow}, transparent)`,
                  animation: 'pulse-ring 1.5s ease-out infinite',
                }} />
                <svg width="44" height="52" viewBox="0 0 40 48">
                  <path d="M20 47s-15-16-15-27a15 15 0 1 1 30 0c0 11-15 27-15 27z" fill={PP.yellow} stroke="#0A0B0D" strokeWidth="1.2"/>
                  <circle cx="20" cy="19" r="6" fill="#0A0B0D"/>
                </svg>
              </div>
            </Marker>
          )}
        </MapboxMap>
      </div>

      {/* ── GRADIENT OVERLAY at bottom ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', zIndex: 1,
        background: `linear-gradient(to bottom, rgba(10,11,13,0) 0%, rgba(10,11,13,0.75) 30%, #0A0B0D 60%)`,
        pointerEvents: 'none',
      }} />

      {/* ── TOP BAR ── */}
      <div style={{ position: 'relative', zIndex: 5, padding: '52px 16px 0' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, height: 46, borderRadius: 14,
            background: 'rgba(20,22,28,0.82)', backdropFilter: 'blur(20px)',
            border: `1px solid ${PP.lineStrong || 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
          }}>
            <span style={{ color: PP.text3 }}>{I.search()}</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PPOINNT or place…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: PP.text, fontSize: 14, fontFamily: PP.font,
              }}
            />
            {loading
              ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${PP.yellow}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              : <button type="submit" style={{
                width: 28, height: 28, borderRadius: 8, background: PP.yellow,
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0A0B0D', cursor: 'pointer',
              }}>{I.mic()}</button>
            }
          </div>
        </form>

        {/* Guidance banner */}
        {showGuidance && !selectedPosition && (
          <div className="animate-fade-in" style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 12,
            background: 'rgba(255,199,44,0.08)',
            border: `1px solid rgba(255,199,44,0.18)`,
            backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: PP.yellow }}>{I.target()}</span>
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
              Stand near your entrance for the most accurate PPOINNT.
            </span>
          </div>
        )}
      </div>

      {/* ── FLOATING MAP CONTROLS ── */}
      <div style={{ position: 'absolute', right: 16, top: 180, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: I.layers, action: () => setViewMode(v => v === 'standard' ? 'satellite' : v === 'satellite' ? 'hybrid' : 'standard') },
          { icon: I.target, action: detectLocation },
        ].map(({ icon: Ic, action }, i) => (
          <button key={i} onClick={action} style={{
            width: 42, height: 42, borderRadius: 13,
            border: `1px solid ${PP.line}`,
            background: 'rgba(20,22,28,0.88)', backdropFilter: 'blur(20px)',
            color: i === 1 && loading ? PP.yellow : PP.text2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}><Ic /></button>
        ))}
      </div>

      {/* ── BOTTOM SHEET ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10,
        background: PP.bg,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingTop: 6,
      }}>
        {/* grab handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 14px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {result ? (
          /* ── SUCCESS STATE ── */
          <div className="animate-fade-in" style={{ padding: '0 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PP.green, boxShadow: `0 0 8px ${PP.green}` }} />
                <span style={{ fontSize: 12, color: PP.green, fontWeight: 700 }}>Address Generated</span>
              </div>
              <button onClick={() => { setResult(null); setSelectedPosition(null); }} style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: PP.card, color: PP.text3, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{I.close()}</button>
            </div>

            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 20,
              padding: '16px 18px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: PP.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Your PPOINNT</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 18 }}><CodeChip code={result.code} /></div>
                <button onClick={async () => {
                  await navigator.clipboard.writeText(result.code);
                  setNotice('Copied!');
                  setTimeout(() => setNotice(''), 2000);
                }} style={{
                  width: 32, height: 32, borderRadius: 9, border: 'none',
                  background: notice ? PP.greenSoft : 'rgba(255,255,255,0.05)',
                  color: notice ? PP.green : PP.text3, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{notice ? I.check() : I.copy()}</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>Accuracy</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: PP.green, marginTop: 2 }}>High · ±3m</div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>Type</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{result.display_place_type || result.place_type}</div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>City</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{result.city}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => shareToWhatsApp(result.code)} style={{
                width: 52, height: 52, borderRadius: 16, border: 'none',
                background: 'rgba(37,211,102,0.14)', color: '#25D366',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>{I.wa()}</button>
              <button onClick={() => navigate(`/drivers?code=${result.code}`)} style={{
                flex: 1, height: 52, borderRadius: 16, border: 'none',
                background: PP.blue, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, fontFamily: PP.font, fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}>{I.nav()} Navigate Now</button>
            </div>
          </div>
        ) : selectedPosition ? (
          /* ── PIN PLACED — QUICK GENERATE ── */
          <div className="animate-fade-in" style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14, letterSpacing: -0.3 }}>Pin placed</div>
            <button onClick={() => navigate('/generate', { state: { lat: selectedPosition.lat, lng: selectedPosition.lng } })} style={{
              width: '100%', height: 54, borderRadius: 18, border: 'none',
              background: `linear-gradient(135deg, ${PP.yellow} 0%, #FFB400 100%)`,
              color: '#0A0B0D', fontFamily: PP.font, fontWeight: 800, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', boxShadow: `0 12px 28px rgba(255,199,44,0.22)`,
            }}>
              {I.plus()} Generate PPOINNT {I.arrow()}
            </button>
            <button onClick={() => setSelectedPosition(null)} style={{
              width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none',
              color: PP.text3, fontFamily: PP.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Clear pin</button>
          </div>
        ) : (
          /* ── DEFAULT HOME CONTENT ── */
          <>
            <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: PP.text3, fontWeight: 500 }}>{greeting}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2, letterSpacing: -0.3 }}>Where to?</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: PP.card, border: `1px solid ${PP.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', cursor: 'pointer', color: PP.text2,
              }}>
                {I.bell()}
                <span style={{
                  position: 'absolute', top: 8, right: 9, width: 7, height: 7,
                  borderRadius: '50%', background: PP.yellow, border: `2px solid ${PP.bg}`,
                }} />
              </div>
            </div>

            {/* Generate CTA */}
            <div style={{ padding: '0 20px 14px' }}>
              <button onClick={() => navigate('/generate')} style={{
                width: '100%', background: `linear-gradient(135deg, ${PP.yellow} 0%, #FFB400 100%)`,
                borderRadius: 20, padding: '16px 18px', border: 'none',
                display: 'flex', alignItems: 'center', gap: 14,
                color: '#0A0B0D', cursor: 'pointer',
                boxShadow: `0 12px 28px rgba(255,199,44,0.22)`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: -10, bottom: -14, opacity: 0.14 }}>
                  <svg width="90" height="108" viewBox="0 0 40 48"><path d="M20 47s-15-16-15-27a15 15 0 1 1 30 0c0 11-15 27-15 27z" fill="#0A0B0D"/><circle cx="20" cy="19" r="6" fill="#FFC72C"/></svg>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(10,11,13,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{I.plus()}</div>
                <div style={{ flex: 1, textAlign: 'left', position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>Generate PPOINNT</div>
                  <div style={{ fontSize: 12.5, opacity: 0.7, fontWeight: 500, marginTop: 2 }}>Pin your exact entrance</div>
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>{I.arrow()}</div>
              </button>
            </div>

            {/* Quick actions */}
            <div style={{ padding: '0 20px 18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Navigate', icon: I.nav, accent: PP.blue, soft: PP.blueSoft, onClick: () => navigate('/drivers') },
                { label: 'Share', icon: I.share, accent: PP.text2, soft: 'rgba(255,255,255,0.05)', onClick: () => {} },
                { label: 'Scan', icon: I.scan, accent: PP.text2, soft: 'rgba(255,255,255,0.05)', onClick: () => {} },
              ].map((a, i) => (
                <button key={i} onClick={a.onClick} style={{
                  background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
                  padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, background: a.soft,
                    color: a.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><a.icon /></div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: PP.text2 }}>{a.label}</div>
                </button>
              ))}
            </div>

            {/* Recent PPOINNTs */}
            <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.8 }}>Recent</div>
              <div style={{ fontSize: 12, color: PP.yellow, fontWeight: 600, cursor: 'pointer' }}>View all</div>
            </div>

            <div style={{ padding: '4px 20px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentPpoints.slice(0, 2).map((r) => (
                <button key={r.code} onClick={() => navigate(`/p/${r.code}`)} style={{
                  background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 14,
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: PP.yellowSoft, color: PP.yellow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}><PlaceIcon type={r.type} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12 }}><CodeChip code={r.code} /></div>
                    <div style={{ fontSize: 12, color: PP.text3, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: PP.text3, whiteSpace: 'nowrap', flexShrink: 0 }}>{r.time}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
