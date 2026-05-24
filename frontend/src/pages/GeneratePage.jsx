import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import api from '../services/api';
import { PP } from '../styles/tokens';

const PLACE_TYPES = [
  { id: 'house', label: 'House', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'apartment', label: 'Apartment', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'estate', label: 'Estate Gate', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 21v-9l7-4 7 4v9M5 21h14M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'shop', label: 'Shop', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 8l2-4h14l2 4M3 8h18v12H3V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'office', label: 'Office', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'school', label: 'School', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 10v6c0 1.5 3 3 6 3s6-1.5 6-3v-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'hospital', label: 'Hospital', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M12 10v6M9 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M8 6V3h8v3" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'church', label: 'Church', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M10 4h4M5 21v-9l7-4 7 4v9M5 21h14M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { id: 'mosque', label: 'Mosque', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21V11c3-2 5-6 9-6s6 4 9 6v10M3 21h18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 21v-5h4v5" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'hotel', label: 'Hotel', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v6M15 3v6" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'warehouse', label: 'Warehouse', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 20V8l10-5 10 5v12H2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'market', label: 'Market', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M5 6l1-3h12l1 3M5 6l-1 6h16l-1-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M3 12v8h18v-8" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { id: 'restaurant', label: 'Restaurant', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 2v20M14 2c0 4 4 4 4 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M6 2v6a3 3 0 0 0 6 0V2M9 8v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'fuel', label: 'Fuel Station', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M4 10h12M8 6h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'event', label: 'Event Center', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 4V2M16 4V2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { id: 'other', label: 'Other', icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg> },
];

const I = {
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  arrow: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  target: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 1v3M12 20v3M23 12h-3M4 12H1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  house: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  pin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  nav: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  wa: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
};

function StepHeader({ step, total = 5, title, sub, onBack, onClose }) {
  return (
    <div style={{ padding: '52px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.back()}</button>
        <span style={{ fontSize: 13, color: PP.text3, fontWeight: 600 }}>Step {step} of {total}</span>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.close()}</button>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 3,
            background: i < step ? PP.yellow : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{title}</div>
        {sub && <div style={{ fontSize: 14, color: PP.text3, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 54, borderRadius: 18, border: 'none',
      background: disabled ? 'rgba(255,199,44,0.3)' : `linear-gradient(135deg, ${PP.yellow} 0%, #FFB400 100%)`,
      color: '#0A0B0D', fontFamily: PP.font, fontWeight: 700, fontSize: 15,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : `0 8px 20px rgba(255,199,44,0.25)`,
      transition: 'all 0.15s',
    }}>{children}</button>
  );
}

function Field({ label, placeholder, value, onChange, multiline }) {
  const style = {
    width: '100%', background: PP.card,
    border: `1px solid ${value ? 'rgba(255,199,44,0.25)' : PP.line}`,
    borderRadius: 14, padding: '0 14px',
    fontSize: 14, color: value ? PP.text : PP.text3,
    fontFamily: PP.font, outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };
  return (
    <div>
      <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600, marginBottom: 8, letterSpacing: 0.1 }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            style={{ ...style, padding: '12px 14px', resize: 'none', lineHeight: 1.5 }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...style, height: 50, display: 'flex', alignItems: 'center' }} />
      }
    </div>
  );
}

export default function GeneratePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);

  const initState = location.state || {};
  const [step, setStep] = useState(1);
  const [selectedPos, setSelectedPos] = useState(
    initState.lat ? { lat: initState.lat, lng: initState.lng } : null
  );
  const [mapCenter, setMapCenter] = useState(
    initState.lat ? [initState.lat, initState.lng] : [6.5244, 3.3792]
  );
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [placeType, setPlaceType] = useState('house');
  const [customType, setCustomType] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [street, setStreet] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (step === 1) navigate(-1);
    else setStep(s => s - 1);
  };
  const handleClose = () => navigate('/');

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setSelectedPos(pos);
        setMapCenter([pos.lat, pos.lng]);
        setGpsAccuracy(coords.accuracy);
        mapRef.current?.flyTo(pos.lng, pos.lat, 18);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true },
    );
  };

  const generatePpoint = async () => {
    if (!selectedPos) { setError('Please select a location first'); return; }
    setLoading(true);
    setError('');
    try {
      const finalType = placeType === 'other' ? customType : placeType;
      const res = await api.post('/platform/community/addresses/generate', {
        latitude: selectedPos.lat,
        longitude: selectedPos.lng,
        placeType: finalType,
        buildingName,
        landmark,
        description: notes,
      });
      setResult(res.data.data);
      setStep(6);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareToWhatsApp = (code) => {
    const text = encodeURIComponent(`📍 PPOINNT Address:\n${code}\n\n${window.location.origin}/p/${code}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const selectedType = PLACE_TYPES.find(t => t.id === placeType);

  // Step 6 = Success
  if (step === 6 && result) {
    return (
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '52px 20px 0' }}>
        {/* Confetti dots */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${[12,80,20,70,40,90,5,60,30,75,50,15][i]}%`,
              top: `${[28,26,40,43,22,36,48,26,35,30,42,33][i]}%`,
              width: 6, height: 6, borderRadius: 2,
              background: [PP.yellow, PP.blue, PP.green][i % 3],
              opacity: 0.8,
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleClose} style={{
            width: 38, height: 38, borderRadius: 12, border: 'none',
            background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>{I.close()}</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>Address generated!</div>
          <div style={{ fontSize: 13, color: PP.text3, marginTop: 6 }}>You can navigate, share, or save it.</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '28px 0 22px' }}>
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            background: `linear-gradient(180deg, ${PP.green} 0%, #1FB872 100%)`,
            boxShadow: `0 16px 40px rgba(35,197,122,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l5 5 9-11" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div style={{ background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 20, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: PP.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Your PPOINNT</div>
          <div style={{ fontSize: 20, fontFamily: PP.mono, fontWeight: 800, letterSpacing: 0.5, marginBottom: 14 }}>
            {result.code}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>Accuracy</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: PP.green, marginTop: 2 }}>High · ±3m</div>
            </div>
            <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>Type</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{selectedType?.label}</div>
            </div>
            <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>City</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{result.city}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 36 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => shareToWhatsApp(result.code)} style={{
              width: 54, height: 54, borderRadius: 16, border: 'none',
              background: 'rgba(37,211,102,0.14)', color: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}>{I.wa()}</button>
            <button onClick={() => navigate(`/drivers?code=${result.code}`)} style={{
              flex: 1, height: 54, borderRadius: 16, border: 'none',
              background: PP.blue, color: '#fff', fontFamily: PP.font, fontWeight: 700, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            }}>{I.nav()} Navigate Now</button>
          </div>
          <button onClick={handleClose} style={{
            width: '100%', padding: '14px 0', background: 'none', border: 'none',
            color: PP.text3, fontFamily: PP.font, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: PP.bg }}>

      {/* Step 1 — Detect location */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <StepHeader step={1} title="Detect your location" sub="We'll find your current position on the map." onBack={handleBack} onClose={handleClose} />
          <div style={{ flex: 1, padding: '4px 20px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, borderRadius: 22, overflow: 'hidden', position: 'relative', border: `1px solid ${PP.line}` }}>
              <MapboxMap
                ref={mapRef}
                center={[mapCenter[1], mapCenter[0]]}
                zoom={16}
                defaultViewMode="standard"
                style={{ height: '100%', width: '100%' }}
              >
                {selectedPos && (
                  <Marker longitude={selectedPos.lng} latitude={selectedPos.lat} anchor="center">
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', inset: -12, borderRadius: '50%',
                        background: `radial-gradient(closest-side, rgba(46,107,255,0.4), transparent)`,
                      }} />
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: PP.blue, border: '3px solid #fff',
                        boxShadow: `0 4px 10px rgba(46,107,255,0.5)`,
                      }} />
                    </div>
                  </Marker>
                )}
              </MapboxMap>

              {/* GPS badge */}
              {selectedPos && (
                <div style={{
                  position: 'absolute', left: 14, top: 14,
                  background: 'rgba(10,11,13,0.82)', backdropFilter: 'blur(12px)',
                  padding: '8px 12px', borderRadius: 12, border: `1px solid ${PP.line}`,
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PP.green, boxShadow: `0 0 12px ${PP.green}` }} />
                  GPS locked · {gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : '±4m'}
                </div>
              )}
            </div>

            {selectedPos && (
              <div style={{
                marginTop: 12, background: PP.card, border: `1px solid ${PP.line}`,
                borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600 }}>Accuracy</div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: PP.green }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: PP.green }}>High</div>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <PrimaryBtn onClick={() => { if (!selectedPos) detectLocation(); else setStep(2); }} disabled={detecting}>
                {detecting ? 'Detecting…' : selectedPos ? <>{I.check()} Use this location</> : <>{I.target()} Detect my location</>}
              </PrimaryBtn>
              {selectedPos && (
                <button onClick={detectLocation} style={{
                  width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, color: PP.text3, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
                }}>{I.refresh()} Detect again</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Move pin */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <StepHeader step={2} title="Move pin to exact location" sub="Drag the pin to your entrance or gate." onBack={handleBack} onClose={handleClose} />
          <div style={{ flex: 1, padding: '4px 20px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, borderRadius: 22, overflow: 'hidden', position: 'relative', border: `1px solid ${PP.line}` }}>
              <MapboxMap
                ref={mapRef}
                center={selectedPos ? [selectedPos.lng, selectedPos.lat] : [3.3792, 6.5244]}
                zoom={18}
                defaultViewMode="satellite"
                onClick={(lat, lng) => setSelectedPos({ lat, lng })}
                style={{ height: '100%', width: '100%' }}
              >
                {selectedPos && (
                  <Marker
                    longitude={selectedPos.lng} latitude={selectedPos.lat} anchor="bottom"
                    draggable onDragEnd={({ lngLat: { lng, lat } }) => setSelectedPos({ lat, lng })}
                  >
                    <div>
                      <div style={{
                        position: 'absolute', left: '50%', top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 100, height: 100, borderRadius: '50%',
                        border: `2px dashed rgba(255,199,44,0.4)`,
                        pointerEvents: 'none',
                      }} />
                      <svg width="44" height="52" viewBox="0 0 40 48">
                        <path d="M20 47s-15-16-15-27a15 15 0 1 1 30 0c0 11-15 27-15 27z" fill={PP.yellow} stroke="#0A0B0D" strokeWidth="1.2"/>
                        <circle cx="20" cy="19" r="6" fill="#0A0B0D"/>
                      </svg>
                    </div>
                  </Marker>
                )}
              </MapboxMap>

              {/* Tip banner at bottom of map */}
              <div style={{
                position: 'absolute', left: 12, right: 12, bottom: 12,
                background: 'rgba(10,11,13,0.88)', backdropFilter: 'blur(20px)',
                padding: '12px 14px', borderRadius: 14, border: `1px solid ${PP.line}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, background: PP.yellowSoft,
                  color: PP.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{I.house()}</div>
                <div style={{ fontSize: 12.5, color: PP.text2, lineHeight: 1.4 }}>
                  For best accuracy, stand near your <strong style={{ color: PP.text }}>entrance or gate</strong>.
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <PrimaryBtn onClick={() => setStep(3)} disabled={!selectedPos}>
                Next {I.arrow()}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Select place type */}
      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <StepHeader step={3} title="Select place type" sub="What kind of place is this?" onBack={handleBack} onClose={handleClose} />
          <div style={{ flex: 1, padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLACE_TYPES.map((t) => (
                <button key={t.id} onClick={() => setPlaceType(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  background: placeType === t.id ? PP.yellowSoft : PP.card,
                  border: `1px solid ${placeType === t.id ? 'rgba(255,199,44,0.32)' : PP.line}`,
                  borderRadius: 14, cursor: 'pointer', width: '100%', textAlign: 'left',
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: placeType === t.id ? PP.yellow : 'rgba(255,255,255,0.05)',
                    color: placeType === t.id ? '#0A0B0D' : PP.text2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><t.icon /></div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: PP.text }}>{t.label}</div>
                  {placeType === t.id && (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: PP.yellow,
                      color: '#0A0B0D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{I.check()}</div>
                  )}
                </button>
              ))}

              {placeType === 'other' && (
                <div style={{ marginTop: 4 }}>
                  <Field label="Custom place type" placeholder="e.g. Cinema, Gym, Salon…" value={customType} onChange={setCustomType} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <PrimaryBtn onClick={() => setStep(4)} disabled={placeType === 'other' && !customType}>
                Next {I.arrow()}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Add details */}
      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <StepHeader step={4} title="Add details" sub="Help others find this place. All fields optional." onBack={handleBack} onClose={handleClose} />
          <div style={{ flex: 1, padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Building / place name" placeholder="e.g. Emmanuel House" value={buildingName} onChange={setBuildingName} />
              <Field label="Nearest landmark" placeholder="e.g. Beside GTBank" value={landmark} onChange={setLandmark} />
              <Field label="Street / road" placeholder="e.g. 15, Ajani Street" value={street} onChange={setStreet} />
              <Field label="Additional notes" placeholder="e.g. House has brown gate, blue door" value={notes} onChange={setNotes} multiline />
            </div>
            <div style={{ marginTop: 14 }}>
              <PrimaryBtn onClick={() => setStep(5)}>
                Next {I.arrow()}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* Step 5 — Review & Generate */}
      {step === 5 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <StepHeader step={5} title="Review & generate" sub="Confirm everything before creating." onBack={handleBack} onClose={handleClose} />
          <div style={{ flex: 1, padding: '8px 20px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {[
                { k: 'Type', v: selectedType?.label, icon: I.house },
                { k: 'Location', v: selectedPos ? `${selectedPos.lat.toFixed(5)}, ${selectedPos.lng.toFixed(5)}` : '—', icon: I.pin },
                buildingName && { k: 'Building', v: buildingName, icon: I.house },
                landmark && { k: 'Landmark', v: landmark, icon: I.target },
                street && { k: 'Street', v: street, icon: I.nav },
                notes && { k: 'Notes', v: notes, icon: I.pin },
              ].filter(Boolean).map((r, i) => (
                <div key={i} style={{
                  background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 14,
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'rgba(255,255,255,0.04)', color: PP.text3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}><r.icon /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600 }}>{r.k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.v}</div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: PP.redSoft, border: `1px solid rgba(229,72,77,0.3)`, marginTop: 10 }}>
                <span style={{ fontSize: 13, color: PP.red, fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <PrimaryBtn onClick={generatePpoint} disabled={loading}>
                {loading ? 'Generating…' : <>{I.check()} Generate PPOINNT</>}
              </PrimaryBtn>
              <button onClick={() => setStep(4)} style={{
                width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none',
                color: PP.text3, fontFamily: PP.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Edit details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
