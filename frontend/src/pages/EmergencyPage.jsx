import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

// ─── Keyframe injection ───────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes pulseRing {
  0%   { transform: scale(1);    opacity: 1; }
  100% { transform: scale(1.4);  opacity: 0; }
}
@keyframes sosBg {
  0%, 100% { background-color: #1a0000; }
  50%       { background-color: #3d0000; }
}
@keyframes sosText {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%       { transform: scale(1.08); opacity: 0.88; }
}
@keyframes etaBar {
  0%   { width: 0%; }
  100% { width: 72%; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes bannerPulse {
  0%, 100% { border-color: rgba(229,72,77,0.6); }
  50%       { border-color: rgba(229,72,77,1); }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function coordsToCode(lat, lng) {
  const zone = lat > 6.5 ? 'LAG' : lat > 9 ? 'ABJ' : 'KAN';
  const suffix = Math.abs(Math.round(lat * 1000 + lng * 100)) % 9999;
  return `PP-${zone}-${suffix.toString().padStart(4, '0')}`;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const SERVICES = [
  { id: 'ambulance', name: 'Ambulance',      icon: '🚑', eta: '~8 min' },
  { id: 'fire',      name: 'Fire Service',   icon: '🚒', eta: '~12 min' },
  { id: 'police',    name: 'Police',         icon: '🚔', eta: '~6 min' },
  { id: 'flood',     name: 'Flood Response', icon: '🌊', eta: '~20 min' },
];

const INITIAL_CONTACTS = [
  { id: 1, name: 'Mum',     phone: '+234 803 000 0001', active: true  },
  { id: 2, name: 'Brother', phone: '+234 806 000 0002', active: false },
];

const HISTORY = [
  { id: 1, type: 'Ambulance', date: '2024-05-22', status: 'resolved', ppoinnt: 'PP-LAG-4821' },
  { id: 2, type: 'Police',    date: '2024-05-10', status: 'resolved', ppoinnt: 'PP-LAG-3991' },
  { id: 3, type: 'Fire',      date: '2024-04-28', status: 'resolved', ppoinnt: 'PP-LAG-5512' },
];

// ─── Toast sub-component ──────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', bottom: 96, right: 16, zIndex: 9999,
      background: PP.yellow, color: '#000',
      padding: '10px 16px', borderRadius: 12,
      fontWeight: 700, fontSize: 13, fontFamily: PP.font,
      boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
      animation: 'toastIn 0.3s ease',
    }}>
      {message}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EmergencyPage() {
  const navigate = useNavigate();

  // Location state
  const [ppoinnt, setPpoinnt]       = useState('PP-LAG-0000');
  const [coords, setCoords]         = useState({ lat: null, lng: null });
  const [accuracy, setAccuracy]     = useState(null);
  const [locLoading, setLocLoading] = useState(true);

  // Service selection + dispatch
  const [selected, setSelected]   = useState(null);
  const [dispatched, setDispatched] = useState(false);

  // SOS mode
  const [sosMode, setSosMode]           = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const sosHoldTimer                    = useRef(null);
  const countdownRef                    = useRef(null);

  // Silent mode
  const [silent, setSilent] = useState(false);

  // Family contacts
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);

  // History accordion
  const [historyOpen, setHistoryOpen] = useState(false);

  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Toast queue
  const [toasts, setToasts] = useState([]);

  // ── Geolocation ─────────────────────────────────────────────────────────────
  const fetchLocation = () => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      const lat = 6.5244, lng = 3.3792;
      setCoords({ lat, lng });
      setAccuracy(null);
      setPpoinnt(coordsToCode(lat, lng));
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        setCoords({ lat, lng });
        setAccuracy(Math.round(acc));
        setPpoinnt(coordsToCode(lat, lng));
        setLocLoading(false);
      },
      () => {
        const lat = 6.5244, lng = 3.3792;
        setCoords({ lat, lng });
        setAccuracy(null);
        setPpoinnt(coordsToCode(lat, lng));
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    fetchLocation();
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── SOS countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sosMode) {
      setSosCountdown(5);
      clearInterval(countdownRef.current);
      return;
    }
    setSosCountdown(5);
    countdownRef.current = setInterval(() => {
      setSosCountdown((c) => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [sosMode]);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const addToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Dispatch ─────────────────────────────────────────────────────────────────
  const handleDispatch = () => {
    if (!selected || dispatched) return;
    setDispatched(true);
    addToast(`${SERVICES.find((s) => s.id === selected)?.icon} Dispatching…`);
  };

  // ── Contact toggle ───────────────────────────────────────────────────────────
  const toggleContact = (id) => {
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  // ── SOS hold handlers ────────────────────────────────────────────────────────
  const startSosHold = () => {
    sosHoldTimer.current = setTimeout(() => {
      setSosMode(true);
      contacts.filter((c) => c.active).forEach((c) => {
        console.log(`Alerting ${c.name} at ${c.phone}`);
        addToast(`Alerting ${c.name}…`);
      });
    }, 3000);
  };

  const cancelSosHold = () => {
    clearTimeout(sosHoldTimer.current);
  };

  const cancelSos = () => {
    setSosMode(false);
    clearInterval(countdownRef.current);
  };

  const selectedService = SERVICES.find((s) => s.id === selected);

  // ─── SOS MODE ────────────────────────────────────────────────────────────────
  if (sosMode) {
    return (
      <>
        <style>{KEYFRAMES}</style>

        <div style={{
          minHeight: '100dvh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'sosBg 1.4s ease-in-out infinite',
          padding: '28px 20px', position: 'relative',
          fontFamily: PP.font,
        }}>
          {/* Silent mode toggle — top right */}
          <button
            onClick={() => setSilent((s) => !s)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: silent ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 40, padding: '8px 14px',
              color: '#fff', fontSize: 18, cursor: 'pointer',
              lineHeight: 1,
            }}
            title={silent ? 'Silent mode ON — no audio/vibration' : 'Silent mode OFF'}
          >
            {silent ? '🔇' : '🔔'}
          </button>

          {/* Large SOS text */}
          <div style={{
            fontSize: 72, fontWeight: 900, color: '#FFFFFF',
            letterSpacing: 10, lineHeight: 1,
            animation: 'sosText 1.2s ease-in-out infinite',
            marginBottom: 18,
            textShadow: '0 0 48px rgba(255,80,80,0.95)',
          }}>
            SOS
          </div>

          {/* Status / countdown line */}
          <div style={{
            fontSize: 16, color: 'rgba(255,255,255,0.88)',
            marginBottom: 32, fontWeight: 600, textAlign: 'center',
          }}>
            {sosCountdown > 0
              ? `Auto-connecting in ${sosCountdown}…`
              : 'Contacting emergency services…'}
          </div>

          {/* Location card */}
          <div style={{
            background: 'rgba(0,0,0,0.50)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 18, padding: '22px 28px',
            width: '100%', maxWidth: 380,
            marginBottom: 28, textAlign: 'center',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
              color: 'rgba(255,255,255,0.50)', marginBottom: 8, textTransform: 'uppercase',
            }}>
              Your Location
            </div>
            <div style={{
              fontFamily: PP.mono, fontSize: 24, fontWeight: 700,
              color: PP.yellow, letterSpacing: 2.5, marginBottom: 10,
            }}>
              {ppoinnt}
            </div>
            {coords.lat !== null && (
              <div style={{
                fontFamily: PP.mono, fontSize: 12,
                color: 'rgba(255,255,255,0.55)', marginBottom: 8,
              }}>
                {coords.lat.toFixed(5)}°N,&nbsp;{Math.abs(coords.lng).toFixed(5)}°E
              </div>
            )}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              📍 Lagos, Nigeria
            </div>
          </div>

          {/* Silent mode status line */}
          <div style={{
            fontSize: 14, color: 'rgba(255,255,255,0.68)',
            marginBottom: 44, textAlign: 'center', lineHeight: 1.6,
            maxWidth: 300,
          }}>
            {silent
              ? '🔇 Silent mode active — no audio or vibration'
              : '📡 Transmitting your location to emergency services'}
          </div>

          {/* Cancel button */}
          <button
            onClick={cancelSos}
            style={{
              padding: '14px 52px',
              background: 'transparent',
              border: '2px solid rgba(255,255,255,0.72)',
              borderRadius: 50, color: '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: PP.font,
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}
          >
            Cancel
          </button>
        </div>

        {toasts.map((t) => (
          <Toast key={t.id} message={t.msg} onDone={() => removeToast(t.id)} />
        ))}
      </>
    );
  }

  // ─── NORMAL MODE ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{KEYFRAMES}</style>

      <div style={{
        minHeight: '100dvh',
        background: PP.bg,
        color: PP.text,
        fontFamily: PP.font,
        maxWidth: 480,
        margin: '0 auto',
        paddingBottom: 100,
        animation: 'fadeIn 0.3s ease',
      }}>

        {/* ── Low-network banner ───────────────────────────────────────────── */}
        {!isOnline && (
          <div style={{
            background: '#7C2D12',
            padding: '10px 16px',
            fontSize: 13, fontWeight: 600,
            color: '#FEF3C7',
            display: 'flex', alignItems: 'flex-start', gap: 8,
            lineHeight: 1.55,
          }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>
              Low network mode — SMS fallback active. Dial&nbsp;
              <strong>*767#</strong> for USSD emergency.
            </span>
          </div>
        )}

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 14px',
          borderBottom: `1px solid ${PP.line}`,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none',
              color: PP.text, fontSize: 22,
              cursor: 'pointer', padding: '2px 8px 2px 0',
              lineHeight: 1,
            }}
          >
            ←
          </button>

          <span style={{
            fontSize: 17, fontWeight: 700,
            color: PP.red, letterSpacing: 0.4,
          }}>
            Emergency
          </span>

          <button
            onClick={() => setSilent((s) => !s)}
            style={{
              background: silent ? PP.redSoft : 'transparent',
              border: `1px solid ${silent ? PP.red : PP.line}`,
              borderRadius: 40, padding: '6px 12px',
              color: silent ? PP.red : PP.text3,
              fontSize: 16, cursor: 'pointer',
              lineHeight: 1,
            }}
            title={silent ? 'Silent mode ON' : 'Silent mode OFF'}
          >
            {silent ? '🔇' : '🔔'}
          </button>
        </div>

        {/* ── Active emergency banner ───────────────────────────────────────── */}
        {dispatched && selectedService && (
          <div style={{
            margin: '12px 16px 0',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #7f1d1d 0%, #292000 100%)',
            border: `1px solid ${PP.red}`,
            padding: '14px 16px',
            animation: 'fadeIn 0.35s ease, bannerPulse 1.8s ease-in-out infinite',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            }}>
              <span style={{ fontSize: 26 }}>{selectedService.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                  {selectedService.name} Dispatched
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: PP.yellow }}>
                  ETA {selectedService.eta}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: 0.8,
                background: PP.red, color: '#fff',
                padding: '3px 8px', borderRadius: 20,
                textTransform: 'uppercase',
              }}>
                LIVE
              </span>
            </div>
            {/* ETA progress bar */}
            <div style={{
              height: 4, background: 'rgba(255,255,255,0.12)',
              borderRadius: 4, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: PP.yellow,
                animation: 'etaBar 12s linear forwards',
              }} />
            </div>
          </div>
        )}

        {/* ── Service selector ─────────────────────────────────────────────── */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: PP.text3, letterSpacing: 1.2,
            marginBottom: 12, textTransform: 'uppercase',
          }}>
            Select Service
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          }}>
            {SERVICES.map((svc) => {
              const isActive = selected === svc.id;
              return (
                <button
                  key={svc.id}
                  onClick={() => { setSelected(svc.id); setDispatched(false); }}
                  style={{
                    background: isActive ? PP.redSoft : PP.card,
                    border: `${isActive ? 2 : 1}px solid ${isActive ? PP.red : PP.line}`,
                    borderRadius: 16, padding: '20px 12px',
                    cursor: 'pointer', textAlign: 'center',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8,
                    transition: 'border-color 0.18s, background 0.18s',
                  }}
                >
                  <span style={{ fontSize: 48, lineHeight: 1 }}>{svc.icon}</span>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: PP.text,
                  }}>
                    {svc.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: PP.green, display: 'inline-block',
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11, color: PP.green, fontWeight: 600 }}>
                      Available
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: PP.text3 }}>{svc.eta}</div>
                </button>
              );
            })}
          </div>

          {selected && (
            <button
              onClick={handleDispatch}
              disabled={dispatched}
              style={{
                marginTop: 14, width: '100%', padding: '14px',
                background: dispatched ? PP.card : PP.red,
                border: `1px solid ${dispatched ? PP.line : PP.red}`,
                borderRadius: 14,
                color: dispatched ? PP.text3 : '#fff',
                fontWeight: 700, fontSize: 15,
                cursor: dispatched ? 'not-allowed' : 'pointer',
                fontFamily: PP.font, transition: 'all 0.2s',
              }}
            >
              {dispatched
                ? `✓ ${selectedService?.name} Dispatched`
                : `🚨 Dispatch ${selectedService?.name}`}
            </button>
          )}
        </div>

        {/* ── Location section ──────────────────────────────────────────────── */}
        <div style={{ margin: '22px 16px 0' }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: PP.text3, letterSpacing: 1.2,
            marginBottom: 12, textTransform: 'uppercase',
          }}>
            Your Location
          </div>

          <div style={{
            background: PP.card,
            border: `1px solid ${PP.line}`,
            borderRadius: 16, padding: '16px',
          }}>
            {/* PPOINNT code row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
            }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{
                  fontSize: 10, color: PP.text3,
                  fontWeight: 700, letterSpacing: 1, marginBottom: 3,
                  textTransform: 'uppercase',
                }}>
                  PPOINNT Code
                </div>
                <div style={{
                  fontFamily: PP.mono, fontSize: 17, fontWeight: 700,
                  color: PP.yellow, letterSpacing: 2.2,
                }}>
                  {locLoading ? '…detecting…' : ppoinnt}
                </div>
              </div>
            </div>

            {/* Coordinates */}
            {coords.lat !== null && (
              <div style={{
                display: 'flex', gap: 10, marginBottom: 12,
                fontFamily: PP.mono, fontSize: 12, color: PP.text3,
              }}>
                <span>Lat: {coords.lat.toFixed(5)}</span>
                <span style={{ color: PP.line }}>|</span>
                <span>Lng: {coords.lng.toFixed(5)}</span>
              </div>
            )}

            {/* Accuracy meter */}
            {accuracy !== null && (
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginBottom: 5,
                }}>
                  <span style={{ fontSize: 11, color: PP.text3 }}>GPS Accuracy</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: accuracy < 30 ? PP.green : PP.yellow,
                  }}>
                    ±{accuracy}m
                  </span>
                </div>
                <div style={{
                  height: 3, background: 'rgba(255,255,255,0.08)',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: accuracy < 30 ? PP.green : PP.yellow,
                    width: `${Math.max(10, 100 - Math.min(accuracy, 100))}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Nearest landmark */}
            <div style={{
              fontSize: 12, color: PP.text3, marginBottom: 14, lineHeight: 1.5,
            }}>
              🏙️ Nearest landmark: Ikeja City Mall, Lagos
            </div>

            <button
              onClick={fetchLocation}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent',
                border: `1px solid ${PP.line}`,
                borderRadius: 10, color: PP.text,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: PP.font,
              }}
            >
              🔄 Update Location
            </button>
          </div>
        </div>

        {/* ── SOS Button ────────────────────────────────────────────────────── */}
        <div style={{
          margin: '30px 16px 0', textAlign: 'center',
        }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Pulse ring layer 1 */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 100, height: 100, borderRadius: '50%',
              border: '3px solid rgba(229,72,77,0.65)',
              animation: 'pulseRing 1.6s ease-out infinite',
              pointerEvents: 'none',
            }} />
            {/* Pulse ring layer 2 — offset delay */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 100, height: 100, borderRadius: '50%',
              border: '3px solid rgba(229,72,77,0.40)',
              animation: 'pulseRing 1.6s ease-out 0.55s infinite',
              pointerEvents: 'none',
            }} />
            {/* SOS circle button */}
            <button
              onMouseDown={startSosHold}
              onMouseUp={cancelSosHold}
              onMouseLeave={cancelSosHold}
              onTouchStart={(e) => { e.preventDefault(); startSosHold(); }}
              onTouchEnd={cancelSosHold}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: PP.red,
                border: '4px solid rgba(255,255,255,0.22)',
                color: '#fff', fontSize: 17, fontWeight: 900,
                cursor: 'pointer', letterSpacing: 2.5,
                boxShadow: '0 0 36px rgba(229,72,77,0.60)',
                fontFamily: PP.font,
                userSelect: 'none', WebkitUserSelect: 'none',
                position: 'relative', zIndex: 1,
              }}
            >
              SOS
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: PP.text3 }}>
            Hold 3 seconds to activate
          </div>
        </div>

        {/* ── Family Alerts ─────────────────────────────────────────────────── */}
        <div style={{ margin: '26px 16px 0' }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: PP.text3, letterSpacing: 1.2,
            marginBottom: 12, textTransform: 'uppercase',
          }}>
            Family Alerts
          </div>

          <div style={{
            background: PP.card,
            border: `1px solid ${PP.line}`,
            borderRadius: 16, overflow: 'hidden',
          }}>
            {contacts.map((contact, i) => (
              <div
                key={contact.id}
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: i < contacts.length - 1
                    ? `1px solid ${PP.line}`
                    : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 17,
                    flexShrink: 0,
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: PP.text, marginBottom: 2,
                    }}>
                      {contact.name}
                    </div>
                    <div style={{
                      fontSize: 12, color: PP.text3, fontFamily: PP.mono,
                    }}>
                      {contact.phone}
                    </div>
                  </div>
                </div>

                {/* Toggle switch */}
                <div
                  onClick={() => toggleContact(contact.id)}
                  style={{
                    width: 44, height: 25, borderRadius: 13,
                    cursor: 'pointer',
                    background: contact.active ? PP.green : 'rgba(255,255,255,0.12)',
                    position: 'relative', transition: 'background 0.22s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3,
                    left: contact.active ? 22 : 3,
                    width: 19, height: 19, borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.22s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                  }} />
                </div>
              </div>
            ))}

            {/* Share live location */}
            <div style={{
              padding: '12px 16px',
              borderTop: `1px solid ${PP.line}`,
            }}>
              <button
                onClick={() => addToast('Opening WhatsApp…')}
                style={{
                  width: '100%', padding: '11px',
                  background: '#128C7E', border: 'none',
                  borderRadius: 10, color: '#fff',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: PP.font,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>💬</span>
                Share Live Location via WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* ── Emergency History accordion ───────────────────────────────────── */}
        <div style={{ margin: '22px 16px 0' }}>
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            style={{
              width: '100%', background: PP.card,
              border: `1px solid ${PP.line}`,
              borderRadius: historyOpen ? '16px 16px 0 0' : 16,
              padding: '14px 16px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer', color: PP.text,
              fontFamily: PP.font, transition: 'border-radius 0.2s',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>Emergency History</span>
            <span style={{
              fontSize: 14, color: PP.text3,
              display: 'inline-block',
              transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s',
            }}>
              ▾
            </span>
          </button>

          {historyOpen && (
            <div style={{
              background: PP.card,
              border: `1px solid ${PP.line}`,
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              animation: 'fadeIn 0.25s ease',
            }}>
              {HISTORY.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    padding: '13px 16px',
                    borderTop: `1px solid ${PP.line}`,
                    borderBottom: i < HISTORY.length - 1
                      ? `1px solid ${PP.line}`
                      : 'none',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: PP.text, marginBottom: 3,
                    }}>
                      {item.type}
                    </div>
                    <div style={{
                      fontSize: 11, color: PP.text3, fontFamily: PP.mono,
                    }}>
                      {item.ppoinnt} · {item.date}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: 0.6,
                    color: item.status === 'resolved' ? PP.green : PP.yellow,
                    background: item.status === 'resolved'
                      ? PP.greenSoft
                      : PP.yellowSoft,
                    padding: '3px 10px', borderRadius: 20,
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Toast queue ───────────────────────────────────────────────────────── */}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.msg} onDone={() => removeToast(t.id)} />
      ))}
    </>
  );
}
