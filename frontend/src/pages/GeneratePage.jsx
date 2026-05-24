import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import api from '../services/api';
import { PP } from '../styles/tokens';

const PLACE_TYPES = [
  { id: 'house',      label: 'House',        icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'apartment',  label: 'Apartment',    icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'estate',     label: 'Estate Gate',  icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 21v-9l7-4 7 4v9M5 21h14M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'shop',       label: 'Shop',         icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 8l2-4h14l2 4M3 8h18v12H3V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'office',     label: 'Office',       icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'school',     label: 'School',       icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 10v6c0 1.5 3 3 6 3s6-1.5 6-3v-6" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'hospital',   label: 'Hospital',     icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M12 10v6M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'church',     label: 'Church',       icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M10 4h4M5 21v-9l7-4 7 4v9M5 21h14M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'mosque',     label: 'Mosque',       icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 21V11c3-2 5-6 9-6s6 4 9 6v10M3 21h18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'market',     label: 'Market',       icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M5 6l1-3h12l1 3M5 6l-1 6h16l-1-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'restaurant', label: 'Restaurant',   icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 2v20M14 2c0 4 4 4 4 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6 2v6a3 3 0 0 0 6 0V2M9 8v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'hotel',      label: 'Hotel',        icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M9 3v6M15 3v6" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'warehouse',  label: 'Warehouse',    icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 20V8l10-5 10 5v12H2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'fuel',       label: 'Fuel Station', icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'event',      label: 'Event Center', icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 4V2M16 4V2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'other',      label: 'Other',        icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg> },
];

const I = {
  back:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  arrow:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  target:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 1v3M12 20v3M23 12h-3M4 12H1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  nav:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  share:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 11l7-4M8.5 13l7 4" stroke="currentColor" strokeWidth="1.6"/></svg>,
  wa:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
  copy:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  plus:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  chevD:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ── Smaller, precise map pin ──────────────────────────────────────────────────
function PrecisionPin({ pulse = true }) {
  return (
    <div style={{ position: 'relative', transform: 'translate(-12px, -28px)', cursor: 'move', touchAction: 'none' }}>
      {pulse && <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 36, height: 36, marginTop: -14, marginLeft: -18,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, rgba(255,199,44,0.3), transparent)`,
        animation: 'pin-pulse 1.8s ease-out infinite',
        pointerEvents: 'none',
      }} />}
      <svg width="24" height="30" viewBox="0 0 24 30">
        <path d="M12 29s-10-10-10-17a10 10 0 1 1 20 0c0 7-10 17-10 17z" fill={PP.yellow} stroke="rgba(0,0,0,0.3)" strokeWidth="0.8"/>
        <circle cx="12" cy="12" r="4" fill="#0A0B0D"/>
      </svg>
    </div>
  );
}

function ProgressBar({ step, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 3,
          background: i < step ? PP.yellow : 'rgba(255,255,255,0.1)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

function Sheet({ children, style }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20,
      background: PP.bg,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: '8px 20px 0',
      ...style,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.15)' }} />
      </div>
      {children}
    </div>
  );
}

function SheetNav({ step, total, onBack, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${PP.line}`, background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{I.back()}</button>
      <span style={{ fontSize: 12, color: PP.text3, fontWeight: 600 }}>Step {step} of {total}</span>
      <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${PP.line}`, background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{I.close()}</button>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 52, borderRadius: 16, border: 'none',
      background: disabled ? 'rgba(255,199,44,0.25)' : `linear-gradient(135deg, ${PP.yellow} 0%, #FFB400 100%)`,
      color: '#0A0B0D', fontFamily: PP.font, fontWeight: 700, fontSize: 15,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : `0 6px 18px rgba(255,199,44,0.22)`,
    }}>{children}</button>
  );
}

function FloatGuidance({ text, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', top: 68, left: 16, right: 16, zIndex: 15,
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(255,199,44,0.08)', backdropFilter: 'blur(16px)',
      border: `1px solid rgba(255,199,44,0.18)`,
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'fade-in 0.4s ease-out',
    }}>
      <span style={{ color: PP.yellow, fontSize: 14 }}>📍</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

function AccuracyBadge({ accuracy }) {
  const color = accuracy < 10 ? PP.green : accuracy < 30 ? PP.yellow : PP.red;
  const label = accuracy < 10 ? 'Excellent' : accuracy < 30 ? 'Good' : 'Low';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: color + '18', color, fontSize: 12, fontWeight: 700 }}>
      {label} ±{Math.round(accuracy)}m
    </span>
  );
}

// QR Code placeholder — real impl uses qrcode.react or similar
function QRPlaceholder({ code }) {
  return (
    <div style={{
      width: 90, height: 90, background: PP.card, borderRadius: 12,
      border: `1px solid ${PP.line}`, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 4,
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2" stroke={PP.yellow} strokeWidth="2"/>
        <rect x="5" y="5" width="8" height="8" fill={PP.yellow} rx="1"/>
        <rect x="24" y="2" width="14" height="14" rx="2" stroke={PP.yellow} strokeWidth="2"/>
        <rect x="27" y="5" width="8" height="8" fill={PP.yellow} rx="1"/>
        <rect x="2" y="24" width="14" height="14" rx="2" stroke={PP.yellow} strokeWidth="2"/>
        <rect x="5" y="27" width="8" height="8" fill={PP.yellow} rx="1"/>
        <rect x="24" y="24" width="4" height="4" fill={PP.yellow} rx="1"/>
        <rect x="30" y="24" width="4" height="4" fill={PP.yellow} rx="1"/>
        <rect x="24" y="30" width="4" height="4" fill={PP.yellow} rx="1"/>
        <rect x="30" y="30" width="4" height="4" fill={PP.yellow} rx="1"/>
      </svg>
      <div style={{ fontSize: 9, color: PP.text3, letterSpacing: 0.3 }}>QR CODE</div>
    </div>
  );
}

export default function GeneratePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);

  const initState = location.state || {};
  const [step, setStep] = useState(initState.lat ? 2 : 1);
  const [pos, setPos] = useState(initState.lat ? { lat: initState.lat, lng: initState.lng } : null);
  const [mapCenter] = useState(initState.lat ? [initState.lat, initState.lng] : [6.5244, 3.3792]);
  const [accuracy, setAccuracy] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [placeType, setPlaceType] = useState('house');
  const [customType, setCustomType] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [street, setStreet] = useState('');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleBack = () => { if (step <= 1) navigate(-1); else setStep(s => s - 1); };
  const handleClose = () => navigate('/');

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = { lat: coords.latitude, lng: coords.longitude };
        setPos(p);
        setAccuracy(coords.accuracy);
        mapRef.current?.flyTo(p.lng, p.lat, 18);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true },
    );
  };

  const generate = async () => {
    if (!pos) { setError('Please select a location'); return; }
    setLoading(true); setError('');
    try {
      const finalType = placeType === 'other' ? customType : placeType;
      const res = await api.post('/platform/community/addresses/generate', {
        latitude: pos.lat, longitude: pos.lng,
        placeType: finalType, buildingName, landmark,
        street, description: notes,
      });
      setResult(res.data.data);
      setStep(6);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Try again.');
    } finally { setLoading(false); }
  };

  const copyCode = async () => {
    if (!result?.code) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!result?.code) return;
    const text = encodeURIComponent(`📍 My PPOINNT:\n${result.code}\n\n${window.location.origin}/p/${result.code}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (step === 6 && result) {
    return (
      <div style={{ position: 'relative', height: '100dvh', background: PP.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        {/* Confetti dots */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${10 + Math.random() * 80}%`,
            top: `${5 + Math.random() * 40}%`,
            width: 6, height: 6, borderRadius: '50%',
            background: i % 3 === 0 ? PP.yellow : i % 3 === 1 ? PP.green : PP.blue,
            animation: `confetti-${i % 3} ${1 + Math.random()}s ease-out forwards`,
            opacity: 0.7,
          }} />
        ))}

        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(35,197,122,0.14)', border: `2px solid ${PP.green}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 32,
        }}>✓</div>

        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' }}>Address Generated!</div>
        <div style={{ fontSize: 14, color: PP.text3, marginBottom: 28, textAlign: 'center' }}>Your PPOINNT is live and ready to share.</div>

        <div style={{
          width: '100%', background: PP.card, borderRadius: 20, border: `1px solid ${PP.line}`,
          padding: '20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <QRPlaceholder code={result.code} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: PP.text3, fontWeight: 700, letterSpacing: 0.6, marginBottom: 6 }}>YOUR PPOINNT</div>
              <div style={{ fontFamily: PP.mono, fontSize: 16, fontWeight: 700, letterSpacing: 0.5, color: PP.yellow, lineHeight: 1.3 }}>{result.code}</div>
              <div style={{ fontSize: 12, color: PP.text3, marginTop: 6 }}>{result.place_type} · High accuracy</div>
            </div>
          </div>

          <button onClick={copyCode} style={{
            width: '100%', padding: '11px 0', borderRadius: 12,
            background: copied ? PP.greenSoft : 'rgba(255,255,255,0.05)',
            color: copied ? PP.green : PP.text2,
            border: `1px solid ${copied ? PP.green + '40' : PP.line}`,
            fontFamily: PP.font, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {copied ? I.check() : I.copy()}
            {copied ? 'Copied!' : 'Copy PPOINNT Code'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%', marginBottom: 16 }}>
          <button onClick={shareWhatsApp} style={{
            width: 52, height: 52, borderRadius: 16, border: 'none',
            background: 'rgba(37,211,102,0.12)', color: '#25D366',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>{I.wa()}</button>
          <button onClick={() => navigate(`/drivers?code=${result.code}`)} style={{
            flex: 1, height: 52, borderRadius: 16, border: 'none',
            background: PP.blue, color: '#fff', fontFamily: PP.font, fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
          }}>{I.nav()} Navigate Here</button>
        </div>

        <button onClick={() => navigate('/')} style={{
          width: '100%', padding: '14px 0', borderRadius: 16,
          background: 'none', border: `1px solid ${PP.line}`,
          color: PP.text2, fontFamily: PP.font, fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Done</button>

        <style>{`
          @keyframes confetti-0 { to { transform: translateY(-60px) rotate(180deg); opacity: 0; } }
          @keyframes confetti-1 { to { transform: translateY(-80px) rotate(-120deg); opacity: 0; } }
          @keyframes confetti-2 { to { transform: translateY(-50px) rotate(90deg); opacity: 0; } }
        `}</style>
      </div>
    );
  }

  // ── MAP-FIRST LAYOUT ────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden', background: PP.bg }}>
      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapboxMap
          ref={mapRef}
          center={[mapCenter[1], mapCenter[0]]}
          zoom={pos ? 18 : 14}
          onClick={(lat, lng) => { if (step === 2) { setPos({ lat, lng }); setAccuracy(null); } }}
          style={{ height: '100%', width: '100%' }}
        >
          {pos && (
            <Marker
              longitude={pos.lng} latitude={pos.lat}
              anchor="bottom"
              draggable={step === 2}
              onDragEnd={({ lngLat: { lng, lat } }) => { setPos({ lat, lng }); setAccuracy(null); }}
            >
              <PrecisionPin pulse={step === 2} />
            </Marker>
          )}
        </MapboxMap>
      </div>

      {/* Top close button */}
      <div style={{ position: 'absolute', top: 52, right: 16, zIndex: 15 }}>
        <button onClick={handleClose} style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(16,17,20,0.88)', backdropFilter: 'blur(16px)',
          border: `1px solid ${PP.lineStrong}`, color: PP.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.close()}</button>
      </div>

      {/* Contextual floating guidance */}
      <FloatGuidance
        text={step === 1 ? 'Stand near your entrance for best accuracy.' : 'Drag the pin to the exact gate or entrance.'}
        show={step <= 2 && !detecting}
      />
      {accuracy && step === 2 && (
        <div style={{ position: 'absolute', top: 68, left: 16, zIndex: 15 }}>
          <AccuracyBadge accuracy={accuracy} />
        </div>
      )}

      {/* ── STEP 1: DETECT ── */}
      {step === 1 && (
        <Sheet>
          <SheetNav step={1} total={5} onBack={handleBack} onClose={handleClose} />
          <ProgressBar step={1} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6 }}>Detect your location</div>
          <div style={{ fontSize: 13, color: PP.text3, marginBottom: 22, lineHeight: 1.5 }}>
            We'll find your current position. Stand near your entrance.
          </div>
          <PrimaryBtn onClick={detectLocation} disabled={detecting}>
            {detecting ? (
              <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #0A0B0D', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Detecting…</>
            ) : (
              <>{I.target()} Detect My Location {I.arrow()}</>
            )}
          </PrimaryBtn>
          {pos && (
            <button onClick={() => setStep(2)} style={{ width: '100%', marginTop: 12, padding: '12px 0', background: 'none', border: 'none', color: PP.yellow, fontFamily: PP.font, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Use pinned position instead
            </button>
          )}
          <div style={{ height: 24 }} />
        </Sheet>
      )}

      {/* ── STEP 2: PIN ── */}
      {step === 2 && (
        <Sheet>
          <SheetNav step={2} total={5} onBack={handleBack} onClose={handleClose} />
          <ProgressBar step={2} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6 }}>Move pin to entrance</div>
          <div style={{ fontSize: 13, color: PP.text3, marginBottom: 20, lineHeight: 1.5 }}>
            Drag the yellow pin to your exact gate or front entrance.
          </div>
          {accuracy && <div style={{ marginBottom: 16 }}><AccuracyBadge accuracy={accuracy} /></div>}
          <PrimaryBtn onClick={() => setStep(3)} disabled={!pos}>
            Use This Location {I.arrow()}
          </PrimaryBtn>
          <button onClick={detectLocation} style={{ width: '100%', marginTop: 12, padding: '12px 0', background: 'none', border: 'none', color: PP.text3, fontFamily: PP.font, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {I.target()} Re-detect GPS
          </button>
          <div style={{ height: 24 }} />
        </Sheet>
      )}

      {/* ── STEP 3: PLACE TYPE ── */}
      {step === 3 && (
        <Sheet style={{ maxHeight: '72vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SheetNav step={3} total={5} onBack={handleBack} onClose={handleClose} />
          <ProgressBar step={3} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginBottom: 16 }}>What type of place is this?</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
              {PLACE_TYPES.map((t) => {
                const active = placeType === t.id;
                return (
                  <button key={t.id} onClick={() => setPlaceType(t.id)} style={{
                    padding: '13px 12px', borderRadius: 14,
                    background: active ? PP.yellow : PP.card,
                    border: `1px solid ${active ? PP.yellow : PP.line}`,
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ color: active ? '#0A0B0D' : PP.text3, flexShrink: 0 }}>{t.icon()}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#0A0B0D' : PP.text }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            {placeType === 'other' && (
              <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Describe the place type" style={{
                width: '100%', padding: '12px 14px', borderRadius: 14,
                background: PP.card, border: `1px solid ${PP.line}`,
                color: PP.text, fontSize: 14, fontFamily: PP.font, outline: 'none', boxSizing: 'border-box',
                marginBottom: 16,
              }} />
            )}
            <PrimaryBtn onClick={() => setStep(4)} disabled={!placeType || (placeType === 'other' && !customType)}>
              Next {I.arrow()}
            </PrimaryBtn>
            <div style={{ height: 24 }} />
          </div>
        </Sheet>
      )}

      {/* ── STEP 4: DETAILS ── */}
      {step === 4 && (
        <Sheet style={{ maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SheetNav step={4} total={5} onBack={handleBack} onClose={handleClose} />
          <ProgressBar step={4} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6 }}>Add details</div>
          <div style={{ fontSize: 13, color: PP.text3, marginBottom: 20, lineHeight: 1.5 }}>Optional — helps people find this place.</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!showDetails ? (
              <>
                <input value={buildingName} onChange={e => setBuildingName(e.target.value)} placeholder="Building or place name (optional)" style={{
                  width: '100%', padding: '13px 14px', borderRadius: 14,
                  background: PP.card, border: `1px solid ${buildingName ? 'rgba(255,199,44,0.25)' : PP.line}`,
                  color: PP.text, fontSize: 14, fontFamily: PP.font, outline: 'none', boxSizing: 'border-box', marginBottom: 12,
                }} />
                <button onClick={() => setShowDetails(true)} style={{
                  width: '100%', padding: '12px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)', border: `1px dashed ${PP.line}`,
                  color: PP.text3, fontFamily: PP.font, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16,
                }}>
                  {I.plus()} Add more details
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {[
                  { v: buildingName, s: setBuildingName, p: 'Building / place name' },
                  { v: landmark, s: setLandmark, p: 'Nearest landmark (e.g. beside GTBank)' },
                  { v: street, s: setStreet, p: 'Street / road name' },
                  { v: notes, s: setNotes, p: 'Delivery note (e.g. Gate is black)' },
                ].map(({ v, s, p }, i) => (
                  <input key={i} value={v} onChange={e => s(e.target.value)} placeholder={p} style={{
                    width: '100%', padding: '13px 14px', borderRadius: 14,
                    background: PP.card, border: `1px solid ${v ? 'rgba(255,199,44,0.25)' : PP.line}`,
                    color: PP.text, fontSize: 14, fontFamily: PP.font, outline: 'none', boxSizing: 'border-box',
                  }} />
                ))}
              </div>
            )}
            <PrimaryBtn onClick={() => setStep(5)}>
              Review & Generate {I.arrow()}
            </PrimaryBtn>
            <div style={{ height: 24 }} />
          </div>
        </Sheet>
      )}

      {/* ── STEP 5: REVIEW ── */}
      {step === 5 && (
        <Sheet style={{ maxHeight: '72vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SheetNav step={5} total={5} onBack={handleBack} onClose={handleClose} />
          <ProgressBar step={5} />
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginBottom: 16 }}>Review & Generate</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ background: PP.card, borderRadius: 16, border: `1px solid ${PP.line}`, overflow: 'hidden', marginBottom: 16 }}>
              {[
                ['Location', pos ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : '—'],
                ['GPS Accuracy', accuracy ? `±${Math.round(accuracy)}m` : 'Pinned manually'],
                ['Place Type', PLACE_TYPES.find(t => t.id === placeType)?.label || customType],
                ...(buildingName ? [['Building', buildingName]] : []),
                ...(landmark ? [['Landmark', landmark]] : []),
                ...(street ? [['Street', street]] : []),
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${PP.line}` : 'none' }}>
                  <div style={{ width: 80, fontSize: 12, color: PP.text3, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: PP.text }}>{v}</div>
                </div>
              ))}
            </div>

            {error && <div style={{ padding: '12px 14px', borderRadius: 12, background: PP.redSoft, color: PP.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <PrimaryBtn onClick={generate} disabled={loading}>
              {loading ? (
                <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #0A0B0D', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
              ) : (
                <>Generate PPOINNT {I.arrow()}</>
              )}
            </PrimaryBtn>
            <div style={{ height: 24 }} />
          </div>
        </Sheet>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pin-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
