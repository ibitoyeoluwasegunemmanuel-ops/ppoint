import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import api from '../services/api';
import { PP } from '../styles/tokens';

const I = {
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  share: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 11l7-4M8.5 13l7 4" stroke="currentColor" strokeWidth="1.6"/></svg>,
  nav: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  thumbUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 9V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-.5-5M20 7l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  thumbDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 15v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-10a2 2 0 0 0-2 2l.5 5M4 17l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  flag: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 15s1-1 5-1 8 1 11 0V4s-1 1-5 1-8-1-11 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 4v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  pin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
};

function ConfidenceBadge({ score, level }) {
  const colors = {
    high: { bg: PP.greenSoft, text: PP.green, label: 'High' },
    medium: { bg: PP.yellowSoft, text: PP.yellow, label: 'Medium' },
    low: { bg: PP.redSoft, text: PP.red, label: 'Low' },
  };
  const color = colors[level] || colors.low;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 10,
      background: color.bg, color: color.text, fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color.text }} />
      {color.label} · {score}%
    </div>
  );
}

function CodeChip({ code }) {
  const parts = code.split('-');
  return (
    <span style={{ fontFamily: PP.mono, fontWeight: 700, fontSize: 14, letterSpacing: 0.4 }}>
      {parts.map((p, i) => (
        <span key={i}>
          <span style={{ color: i === parts.length - 1 ? PP.yellow : PP.text }}>{p}</span>
          {i < parts.length - 1 && <span style={{ color: PP.text3 }}>-</span>}
        </span>
      ))}
    </span>
  );
}

export default function AddressPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [address, setAddress] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const addrRes = await api.get(`/address/search`, { params: { code: code?.toUpperCase() } });
        const addr = addrRes.data.data;
        setAddress(addr);

        const confRes = await api.get(`/platform/addresses/${code?.toUpperCase()}/confidence`);
        setConfidence(confRes.data.data);
      } catch (err) {
        setError('Address not found');
      } finally {
        setLoading(false);
      }
    };
    if (code) fetchData();
  }, [code]);

  const handleVerify = async (action) => {
    setVerifying(action);
    try {
      await api.post(`/platform/addresses/${code?.toUpperCase()}/verify`, { action });
      setConfidence(c => ({
        ...c,
        verification_count: (c.verification_count || 0) + 1,
        community_rating: action === 'upvote' ? (c.community_rating || 0) + 1 : (c.community_rating || 0) - 1,
      }));
    } catch (err) {
      console.error('Verification failed', err);
    }
    setVerifying(null);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = encodeURIComponent(`📍 PPOINNT Address:\n${code}\n\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PP.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', border: `3px solid ${PP.yellow}`,
            borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', margin: '0 auto',
          }} />
          <div style={{ marginTop: 12, fontSize: 13, color: PP.text3 }}>Loading address...</div>
        </div>
      </div>
    );
  }

  if (error || !address) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: PP.bg, padding: 20 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16, background: PP.redSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: PP.red, fontSize: 28, marginBottom: 20,
        }}>❌</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Address Not Found</div>
        <div style={{ fontSize: 13, color: PP.text3, marginBottom: 20 }}>This PPOINNT code doesn't exist yet.</div>
        <button onClick={() => navigate('/')} style={{
          padding: '12px 24px', borderRadius: 14, border: 'none',
          background: PP.yellow, color: '#0A0B0D', fontFamily: PP.font, fontWeight: 700, cursor: 'pointer',
        }}>Go Home</button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.back()}</button>
        <div style={{ fontSize: 14, color: PP.text3, fontWeight: 600 }}>PPOINNT Code</div>
        <button onClick={handleCopy} style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: copied ? PP.green : PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{copied ? I.check() : I.copy()}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {/* Map */}
        <div style={{ height: 240, borderRadius: 20, overflow: 'hidden', marginBottom: 16, border: `1px solid ${PP.line}` }}>
          <MapboxMap
            ref={mapRef}
            center={[Number(address.longitude), Number(address.latitude)]}
            zoom={18}
            defaultViewMode="standard"
            style={{ height: '100%', width: '100%' }}
          >
            {address && (
              <Marker longitude={Number(address.longitude)} latitude={Number(address.latitude)} anchor="bottom">
                <svg width="44" height="52" viewBox="0 0 40 48">
                  <path d="M20 47s-15-16-15-27a15 15 0 1 1 30 0c0 11-15 27-15 27z" fill={PP.yellow} stroke="#0A0B0D" strokeWidth="1.2"/>
                  <circle cx="20" cy="19" r="6" fill="#0A0B0D"/>
                </svg>
              </Marker>
            )}
          </MapboxMap>
        </div>

        {/* Code Card */}
        <div style={{
          background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 18,
          padding: '18px 16px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: PP.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Code</div>
          <div style={{ fontSize: 16 }}><CodeChip code={address.code} /></div>
        </div>

        {/* Confidence Scoring */}
        {confidence && (
          <div style={{
            background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 18,
            padding: '16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4 }}>Accuracy</div>
              <ConfidenceBadge score={confidence.confidence_score} level={confidence.confidence_level} />
            </div>

            {/* Progress bar */}
            <div style={{
              height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 14,
            }}>
              <div style={{
                width: `${confidence.confidence_score}%`, height: '100%',
                background: confidence.confidence_level === 'high' ? PP.green : confidence.confidence_level === 'medium' ? PP.yellow : PP.red,
                transition: 'width 0.3s',
              }} />
            </div>

            {/* Verification count & rating */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>Verified</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{confidence.verification_count || 0}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>Community</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: confidence.community_rating > 0 ? PP.green : confidence.community_rating < 0 ? PP.red : PP.text }}>
                  {confidence.community_rating > 0 ? '+' : ''}{confidence.community_rating || 0}
                </div>
              </div>
            </div>

            {/* Guidance */}
            <div style={{
              fontSize: 12, color: PP.text3, lineHeight: 1.5,
              padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
            }}>
              {confidence.confidence_guidance}
            </div>
          </div>
        )}

        {/* Location Details */}
        <div style={{
          background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 18,
          padding: '16px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Details</div>
          {[
            { icon: I.pin, label: 'Type', value: address.display_place_type || address.place_type || 'Location' },
            address.landmark && { icon: I.shield, label: 'Landmark', value: address.landmark },
            address.city && { icon: I.nav, label: 'City', value: `${address.city}, ${address.state}` },
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: i < 2 ? `1px solid ${PP.line}` : 'none',
            }}>
              <span style={{ color: PP.text2, display: 'flex' }}>{item.icon()}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Community Verification */}
        <div style={{
          background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 18,
          padding: '16px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Is this address accurate?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => handleVerify('upvote')} disabled={verifying} style={{
              flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${PP.line}`,
              background: PP.card, color: PP.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, fontFamily: PP.font, fontWeight: 600, fontSize: 12, cursor: verifying ? 'not-allowed' : 'pointer',
              opacity: verifying ? 0.5 : 1,
            }}>
              {I.thumbUp()} Yes
            </button>
            <button onClick={() => handleVerify('downvote')} disabled={verifying} style={{
              flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${PP.line}`,
              background: PP.card, color: PP.red, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, fontFamily: PP.font, fontWeight: 600, fontSize: 12, cursor: verifying ? 'not-allowed' : 'pointer',
              opacity: verifying ? 0.5 : 1,
            }}>
              {I.thumbDown()} No
            </button>
            <button onClick={() => handleVerify('flag')} disabled={verifying} style={{
              flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${PP.line}`,
              background: PP.card, color: PP.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, fontFamily: PP.font, fontWeight: 600, fontSize: 12, cursor: verifying ? 'not-allowed' : 'pointer',
              opacity: verifying ? 0.5 : 1,
            }}>
              {I.flag()} Report
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={handleShare} style={{
            flex: 1, padding: '14px', borderRadius: 14, border: 'none',
            background: PP.card, color: PP.text2, fontFamily: PP.font, fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
          }}>
            {I.share()} Share
          </button>
          <button onClick={() => navigate(`/drivers?code=${code}`)} style={{
            flex: 1, padding: '14px', borderRadius: 14, border: 'none',
            background: PP.blue, color: '#fff', fontFamily: PP.font, fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
          }}>
            {I.nav()} Navigate
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
