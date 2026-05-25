import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

// ── Navigation Items ──────────────────────────────────────────────────────────
const NAV_SECTIONS = {
  main: [
    { icon: '▦', label: 'Overview', id: 'overview' },
    { icon: '📍', label: 'Addresses', id: 'addresses' },
    { icon: '🗺️', label: 'Live Map', id: 'map' },
  ],
  operations: [
    { icon: '👥', label: 'Agents', id: 'agents' },
    { icon: '🚨', label: 'Emergency', id: 'emergency' },
    { icon: '📍', label: 'Tracking', id: 'tracking' },
  ],
  enterprise: [
    { icon: '🏛️', label: 'Government', id: 'government' },
    { icon: '💼', label: 'Business', id: 'business' },
    { icon: '🏢', label: 'Corporate', id: 'corporate' },
  ],
  platform: [
    { icon: '</>', label: 'Developers', id: 'developers' },
    { icon: '💳', label: 'Billing', id: 'billing' },
    { icon: '⚙️', label: 'Settings', id: 'settings' },
  ],
};

// ── Mock Data ─────────────────────────────────────────────────────────────────
const mockAddresses = [
  { code: 'PPT-NG-LAG-IKD-1234', name: 'Beside GTBank', street: '15, Ajayi Street', country: 'Nigeria', verified: true, accuracy: 99, created: '2h ago' },
  { code: 'PPT-NG-LAG-IKD-1235', name: '24 Olabisi Street', street: '24, Olabisi Street', country: 'Nigeria', verified: true, accuracy: 98, created: '3h ago' },
  { code: 'PPT-KE-NRB-GKD-5678', name: 'Nairobi Plaza', street: '5, Mombasa Road', country: 'Kenya', verified: true, accuracy: 97, created: '4h ago' },
];

const mockAgents = [
  { rank: 1, name: 'Adaeze N.', country: 'Nigeria', created: 184, accuracy: 99, earnings: 38400, status: 'Active' },
  { rank: 2, name: 'Tunde A.', country: 'Nigeria', created: 156, accuracy: 98, earnings: 22100, status: 'Active' },
  { rank: 3, name: 'Emmanuel O.', country: 'Nigeria', created: 128, accuracy: 97, earnings: 24650, status: 'Active' },
];

const mockIncidents = [
  { type: 'Medical', location: 'PP-NG-LAG-IKD-1234', time: '15 min ago', status: 'ACTIVE' },
  { type: 'Fire', location: 'PP-NG-LAG-VI-5678', time: '45 min ago', status: 'DISPATCHED' },
];

// ── Icon Functions ───────────────────────────────────────────────────────────
const Icons = {
  grid: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="1.8"/></svg>,
  search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  bell: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8"/></svg>,
  check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8"/></svg>,
  arrow: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ── Application Modal ──────────────────────────────────────────────────────
function ApplicationModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Nigeria',
    state: '',
    experience: '0',
    references: '',
    documents: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/agent-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          experience: parseInt(formData.experience, 10)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: '#13141A', borderRadius: 16, padding: '40px', textAlign: 'center', maxWidth: 400, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>Application Submitted!</div>
          <div style={{ fontSize: 13, color: '#A1A1A6', marginBottom: 20 }}>Your application has been received. We'll review it and get back to you soon.</div>
          <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
      <div style={{ background: '#13141A', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.3s ease' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>Apply as Agent</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#A1A1A6', cursor: 'pointer', fontSize: 18 }}>
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#0F1015', color: '#FFFFFF', fontSize: 13, padding: '0 12px', fontFamily: PP.font }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#0F1015', color: '#FFFFFF', fontSize: 13, padding: '0 12px', fontFamily: PP.font }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#0F1015', color: '#FFFFFF', fontSize: 13, padding: '0 12px', fontFamily: PP.font }}
            />
          </div>

          {/* Country & State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>Country *</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#0F1015', color: '#FFFFFF', fontSize: 13, padding: '0 12px', fontFamily: PP.font, cursor: 'pointer' }}
              >
                <option value="Nigeria">Nigeria</option>
                <option value="Kenya">Kenya</option>
                <option value="Ghana">Ghana</option>
                <option value="South Africa">South Africa</option>
                <option value="Ethiopia">Ethiopia</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>State/Province *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="e.g., Lagos"
                style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#0F1015', color: '#FFFFFF', fontSize: 13, padding: '0 12px', fontFamily: PP.font }}
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>Years of Experience *</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#0F1015', color: '#FFFFFF', fontSize: 13, padding: '0 12px', fontFamily: PP.font, cursor: 'pointer' }}
            >
              {[0, 1, 2, 3, 4, 5, 10, 15, 20].map(y => (
                <option key={y} value={y}>{y === 0 ? 'Less than 1 year' : y === 20 ? '20+ years' : y + ' years'}</option>
              ))}
            </select>
          </div>

          {/* References */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>References (one per line)</label>
            <textarea
              name="references"
              value={formData.references}
              onChange={handleChange}
              placeholder="Company name, individual, or organization&#10;One per line"
              style={{ width: '100%', height: 80, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: '#0F1015', color: '#FFFFFF', fontSize: 13, padding: '10px 12px', fontFamily: PP.mono, resize: 'none' }}
            />
          </div>

          {/* Documents */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', display: 'block', marginBottom: 6 }}>Documents (optional)</label>
            <div style={{ borderRadius: 10, border: '2px dashed rgba(255,255,255,0.07)', padding: '20px', textAlign: 'center', background: '#0F1015', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 14 }}>📄</div>
              <div style={{ fontSize: 12, color: '#A1A1A6', marginTop: 8 }}>Click to upload files (mock)</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 4 }}>License, certifications, ID documents</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#F871711A', border: '1px solid #F87171', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#F87171', fontWeight: 700 }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 44, borderRadius: 10, border: 'none', background: '#FFC72C', color: '#0A0B0D',
              fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? '⏳ Submitting...' : '✓ Submit Application'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Overview View ──────────────────────────────────────────────────────────
function OverviewView({ selectedAddress, setSelectedAddress }) {
  const [timeFilter, setTimeFilter] = useState('Week');

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Territory Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Ikorodu Territory</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', background: '#34D39918', padding: '2px 8px', borderRadius: 6 }}>LIVE</span>
            </div>
            <div style={{ fontSize: 12, color: '#A1A1A6' }}>Lagos, Nigeria • Updated 2 min ago</div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#13141A', borderRadius: 10, padding: 4 }}>
            {['Today', 'Week', 'Month', 'All time'].map(f => (
              <button key={f} onClick={() => setTimeFilter(f)} style={{
                padding: '5px 12px', borderRadius: 7, border: 'none',
                background: timeFilter === f ? '#FFFFFF0F' : 'transparent',
                color: timeFilter === f ? '#FFFFFF' : '#A1A1A6',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>PPOINNTs Created</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>128</div>
            <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>+12% week</div>
          </div>
          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>Verified</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>94</div>
            <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>+8% week</div>
          </div>
          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>Earnings</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>₦24,650</div>
            <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>+₦2,100 week</div>
          </div>
          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>Accuracy</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>98%</div>
            <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>↑ 3 ranks</div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div style={{ background: '#0E1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, height: 280, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1A6' }}>
          Map View (Ikorodu Territory)
        </div>

        {/* Recent Addresses */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>Recent PPOINNTs</div>
          {mockAddresses.map((p, i) => (
            <div key={i} onClick={() => setSelectedAddress(p)} style={{
              background: selectedAddress?.code === p.code ? '#FFC72C0A' : 'transparent',
              border: `1px solid ${selectedAddress?.code === p.code ? 'rgba(255,199,44,0.20)' : 'transparent'}`,
              borderRadius: 11, padding: '12px 14px', marginBottom: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.verified ? '#34D399' : '#F59E0B' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', fontFamily: PP.mono }}>{p.code}</div>
                <div style={{ fontSize: 11, color: '#A1A1A6' }}>{p.name} • {p.street}</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>{p.created}</div>
            </div>
          ))}
        </div>

        {/* Agent Leaderboard */}
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 70px 90px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['#', 'Agent', 'Created', 'Accuracy', 'Earnings'].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.30)', textAlign: i > 1 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {mockAgents.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 70px 90px', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: a.rank === 1 ? '#FFC72C' : '#A1A1A6' }}>{a.rank}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{a.name}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>{a.created}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399', textAlign: 'right' }}>{a.accuracy}%</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>₦{a.earnings.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspector Panel */}
      {selectedAddress && (
        <div style={{ width: 260, flexShrink: 0, background: '#0F1015', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '20px 18px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.40)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Inspector</div>
          <div style={{ fontSize: 13, fontFamily: PP.mono, fontWeight: 700, color: '#FFC72C', marginBottom: 8 }}>{selectedAddress.code}</div>
          <div style={{ fontSize: 12, color: '#A1A1A6', marginBottom: 16 }}>{selectedAddress.street}</div>
          <button style={{ width: '100%', height: 36, borderRadius: 10, border: 'none', background: '#FFC72C', color: '#0A0B0D', fontWeight: 800, cursor: 'pointer', marginBottom: 12 }}>Navigate</button>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>Type: {selectedAddress.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 8 }}>Accuracy: {selectedAddress.accuracy}%</div>
        </div>
      )}
    </div>
  );
}

// ── Addresses View ────────────────────────────────────────────────────────────
function AddressesView() {
  const [search, setSearch] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search address, code..." style={{
          flex: 1, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
          background: '#13141A', color: '#FFFFFF', fontSize: 13, padding: '0 14px', fontFamily: PP.font,
        }} />
        <button style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: '#FFC72C', color: '#0A0B0D', fontWeight: 800, cursor: 'pointer' }}>Export CSV</button>
      </div>

      <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 100px 80px 100px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {['Code', 'Name/Street', 'Type', 'Country', 'Verified', 'Created'].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.30)' }}>{h}</div>
          ))}
        </div>
        {mockAddresses.map((a, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 100px 80px 100px', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 12, fontFamily: PP.mono, fontWeight: 700, color: '#FFC72C' }}>{a.code}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>{a.name}</div>
            <div style={{ fontSize: 12, color: '#A1A1A6' }}>House</div>
            <div style={{ fontSize: 12, color: '#A1A1A6' }}>{a.country}</div>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: a.verified ? '#34D399' : '#F59E0B' }} />
            <div style={{ fontSize: 12, color: '#A1A1A6' }}>{a.created}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Agents View ──────────────────────────────────────────────────────────────
function AgentsView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [approvedAgents, setApprovedAgents] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/agent-applications/stats');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      setStats(statsData.data || { pending: 0, approved: 0, rejected: 0, total: 0 });

      // Fetch approved agents
      const agentsRes = await fetch('/api/agent-applications?status=approved');
      if (!agentsRes.ok) throw new Error('Failed to fetch approved agents');
      const agentsData = await agentsRes.json();
      const agents = (agentsData.data || [])
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3)
        .map((agent, index) => ({
          ...agent,
          rank: index + 1
        }));
      setApprovedAgents(agents);

      // Fetch pending applications
      const pendingRes = await fetch('/api/agent-applications?status=pending');
      if (!pendingRes.ok) throw new Error('Failed to fetch pending applications');
      const pendingData = await pendingRes.json();
      setPendingApplications((pendingData.data || []).slice(0, 5));
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error fetching agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const SkeletonCard = () => (
    <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', animation: 'pulse 2s ease-in-out infinite' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8, height: 12, background: '#1F2027', borderRadius: 4, width: '60%' }} />
      <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', height: 28, background: '#1F2027', borderRadius: 4 }} />
    </div>
  );

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          [
            { label: 'Total Agents', value: stats.total.toString() },
            { label: 'Approved', value: stats.approved.toString() },
            { label: 'Pending', value: stats.pending.toString() },
            { label: 'Total Earnings', value: '₦2.4M' }
          ].map((s, i) => (
            <div key={i} style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{s.value}</div>
            </div>
          ))
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ background: '#F871711A', border: '1px solid #F87171', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#F87171', fontWeight: 700 }}>⚠ {error}</div>
          <button onClick={fetchData} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#F87171', color: '#FFFFFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* Top Agents */}
      <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>🏆 Top Approved Agents</div>
          <button onClick={() => setShowApplicationModal(true)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#FFC72C', color: '#0A0B0D', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            + Apply as Agent
          </button>
        </div>
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', height: 60, background: '#0F1015' }} />
          ))
        ) : approvedAgents.length === 0 ? (
          <div style={{ padding: '16px', color: '#A1A1A6', fontSize: 12, textAlign: 'center' }}>No approved agents yet</div>
        ) : (
          approvedAgents.map((a, i) => (
            <div key={i} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#13141A'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{a.rank}. {a.name}</div>
                <div style={{ fontSize: 11, color: '#A1A1A6' }}>{a.country} • {a.experience} years experience</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>⭐ Score: {a.score || 0}</div>
                <div style={{ fontSize: 11, color: '#A1A1A6' }}>Applied {new Date(a.appliedDate).toLocaleDateString()}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Applications */}
      <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>📋 Pending Applications ({stats.pending})</div>
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', height: 60, background: '#0F1015' }} />
          ))
        ) : pendingApplications.length === 0 ? (
          <div style={{ padding: '16px', color: '#A1A1A6', fontSize: 12, textAlign: 'center' }}>No pending applications</div>
        ) : (
          pendingApplications.map((app, i) => (
            <div key={i} style={{ padding: '16px', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{app.name}</div>
                <div style={{ fontSize: 11, color: '#A1A1A6' }}>{app.country} • {app.experience} years • Score: {app.score || 0}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, background: '#FFC72C18', color: '#FFC72C', padding: '4px 8px', borderRadius: 6 }}>PENDING</div>
            </div>
          ))
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#34D399', color: '#0A0B0D', padding: '12px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, animation: 'slideIn 0.3s ease' }}>
          {toastMessage}
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {
            setShowApplicationModal(false);
            setToastMessage('Application submitted successfully!');
            setTimeout(() => setToastMessage(''), 3000);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ── Incident Modal ──────────────────────────────────────────────────────────
function IncidentModal({ incident, onClose, onAssign, onStatusChange }) {
  const [assignDispatcher, setAssignDispatcher] = useState('');
  const [dispatcherName, setDispatcherName] = useState('');
  const [loading, setLoading] = useState(false);

  const getSeverityColor = (sev) => {
    const colors = { critical: '#F87171', high: '#FB923C', medium: '#FCD34D', low: '#A1E804' };
    return colors[sev] || '#FFC72C';
  };

  const handleAssign = async () => {
    if (!assignDispatcher || !dispatcherName) return;
    setLoading(true);
    try {
      await onAssign(incident.id, assignDispatcher, dispatcherName);
      setAssignDispatcher('');
      setDispatcherName('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0A0B0D', borderRadius: 14, padding: 20, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Incident Details
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: '#13141A', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>ID: {incident.id}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{incident.incident_type}</div>
            </div>
            <div style={{ background: getSeverityColor(incident.severity), color: '#000', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
              {incident.severity.toUpperCase()}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#A1A1A6', marginBottom: 8 }}>{incident.location}</div>
          <div style={{ fontSize: 13, color: '#FFFFFF' }}>{incident.description}</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 700 }}>REPORTER</div>
          <div style={{ fontSize: 13, color: '#FFFFFF' }}>{incident.reporter_name} • {incident.reporter_phone}</div>
        </div>

        {!incident.dispatcher_id ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 700 }}>ASSIGN DISPATCHER</div>
            <input type="text" placeholder="Dispatcher ID" value={assignDispatcher} onChange={(e) => setAssignDispatcher(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#FFFFFF', marginBottom: 8, fontSize: 12 }} />
            <input type="text" placeholder="Dispatcher Name" value={dispatcherName} onChange={(e) => setDispatcherName(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#FFFFFF', marginBottom: 8, fontSize: 12 }} />
            <button onClick={handleAssign} disabled={loading || !assignDispatcher || !dispatcherName} style={{ width: '100%', padding: '10px', background: '#FFC72C', color: '#0A0B0D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: loading || !assignDispatcher || !dispatcherName ? 0.5 : 1 }}>
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 14, background: '#13141A', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 700 }}>ASSIGNED TO</div>
            <div style={{ fontSize: 13, color: '#34D399' }}>{incident.dispatcher_name}</div>
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: '#13141A', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Emergency View ───────────────────────────────────────────────────────────
function EmergencyView() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterStatus, setFilterStatus] = useState('reported');

  useEffect(() => {
    fetchIncidents();
    fetchStats();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`/api/emergency-dispatch/incidents?status=${filterStatus}`);
      const data = await res.json();
      if (data.success) {
        setIncidents(data.data);
        setError(null);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      setError(e.message);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/emergency-dispatch/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async (incidentId, dispatcherId, dispatcherName) => {
    try {
      const res = await fetch(`/api/emergency-dispatch/incidents/${incidentId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatcherId, dispatcherName })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIncident(null);
        fetchIncidents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats?.total || 0, color: '#A1A1A6' },
          { label: 'Active', value: stats?.reported || 0, color: '#F87171' },
          { label: 'Dispatched', value: stats?.assigned || 0, color: '#FFC72C' },
          { label: 'Resolved', value: stats?.closed || 0, color: '#34D399' }
        ].map((s, i) => (
          <div key={i} style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['reported', 'assigned', 'in_progress', 'closed'].map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '8px 14px', borderRadius: 8, border: filterStatus === status ? '2px solid #FFC72C' : '1px solid rgba(255,255,255,0.07)', background: filterStatus === status ? '#FFC72C' : '#13141A', color: filterStatus === status ? '#0A0B0D' : '#FFFFFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#F87171', color: '#000', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
          {error}
          <button onClick={fetchIncidents} style={{ marginLeft: 'auto', background: '#000', color: '#F87171', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Retry</button>
        </div>
      )}

      <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#A1A1A6' }}>Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#A1A1A6' }}>No incidents</div>
        ) : (
          incidents.map((inc, i) => (
            <div key={i} onClick={() => setSelectedIncident(inc)} style={{ padding: '14px 16px', borderBottom: i < incidents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#16171D'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: inc.severity === 'critical' ? '#F87171' : inc.severity === 'high' ? '#FB923C' : '#FCD34D' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{inc.incident_type}</div>
                <div style={{ fontSize: 11, color: '#A1A1A6' }}>{inc.location}</div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{new Date(inc.created_at).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>

      {selectedIncident && (
        <IncidentModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} onAssign={handleAssign} />
      )}
    </div>
  );
}

// ── Government View ──────────────────────────────────────────────────────────
function GovernmentView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/government-portal/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Countries', value: stats?.countries || 0, color: '#FFC72C' },
          { label: 'Total Addresses', value: (stats?.coverage?.totalAddresses || 0).toLocaleString(), color: '#34D399' },
          { label: 'Verified', value: `${stats?.coverage?.verificationRate || 0}%`, color: '#60A5FA' },
          { label: 'Admins', value: stats?.administration?.totalAdmins || 0, color: '#FB923C' },
          { label: 'Regions', value: stats?.infrastructure?.totalRegions || 0, color: '#A78BFA' }
        ].map((k, i) => (
          <div key={i} style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#F87171', color: '#000', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
          {error}
          <button onClick={fetchStats} style={{ marginLeft: 'auto', background: '#000', color: '#F87171', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Retry</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Coverage by Level</div>
          {loading ? (
            <div style={{ color: '#A1A1A6', fontSize: 12 }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { level: 'States', count: stats?.infrastructure?.states || 0 },
                { level: 'Cities', count: stats?.infrastructure?.cities || 0 },
                { level: 'Total Addresses', count: (stats?.coverage?.totalAddresses || 0).toLocaleString() }
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#A1A1A6' }}>{s.level}</span>
                  <span style={{ color: '#FFC72C', fontWeight: 700 }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Admin Roles</div>
          {loading ? (
            <div style={{ color: '#A1A1A6', fontSize: 12 }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { role: 'National Admin', count: stats?.administration?.totalAdmins || 0 },
                { role: 'Infrastructure', count: Math.round((stats?.administration?.totalAdmins || 0) * 0.3) },
                { role: 'Emergency', count: Math.round((stats?.administration?.totalAdmins || 0) * 0.2) }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#A1A1A6' }}>{r.role}</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Pan-African Coverage Map</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {(stats?.countries || ['NG', 'KE', 'GH', 'ZA', 'EG']).slice(0, 5).map((country, i) => (
            <div key={i} style={{ background: '#16171D', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700 }}>{country}</div>
              <div style={{ fontSize: 10, color: '#34D399', marginTop: 4 }}>✓ Active</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Business View ────────────────────────────────────────────────────────────
function BusinessView() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/business/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const devCount = stats?.developers?.total || 0;
  const freeCount = stats?.developers?.free || 0;
  const proCount = stats?.developers?.pro || 0;
  const enterpriseCount = stats?.developers?.enterprise || 0;
  const totalRequests = (stats?.apiUsage?.free?.requests || 0) + (stats?.apiUsage?.pro?.requests || 0) + (stats?.apiUsage?.enterprise?.requests || 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Developers', value: devCount, color: '#FFC72C' },
          { label: 'API Requests', value: totalRequests.toLocaleString(), color: '#34D399' },
          { label: 'Pro Tier', value: proCount, color: '#FB923C' },
          { label: 'Enterprise', value: enterpriseCount, color: '#A78BFA' }
        ].map((s, i) => (
          <div key={i} style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#13141A', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {['Overview', 'By Tier', 'Top Developers', 'Performance'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none',
            background: tab === t ? '#FFFFFF0F' : 'transparent',
            color: tab === t ? '#FFFFFF' : '#A1A1A6',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#F87171', color: '#000', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
          {error}
          <button onClick={fetchStats} style={{ marginLeft: 'auto', background: '#000', color: '#F87171', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Retry</button>
        </div>
      )}

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Free Tier</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Users</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFC72C' }}>{freeCount}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Requests</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFC72C' }}>{(stats?.apiUsage?.free?.requests || 0).toLocaleString()}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Avg Response</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFC72C' }}>{stats?.apiUsage?.free?.avgResponseTime || 0}ms</div></div>
            </div>
          </div>
          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Pro Tier</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Users</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FB923C' }}>{proCount}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Requests</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FB923C' }}>{(stats?.apiUsage?.pro?.requests || 0).toLocaleString()}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Avg Response</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FB923C' }}>{stats?.apiUsage?.pro?.avgResponseTime || 0}ms</div></div>
            </div>
          </div>
        </div>
      )}
      {tab === 'By Tier' && (
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Tier Distribution</div>
          {['Free', 'Pro', 'Enterprise'].map((tier, i) => {
            const count = tier === 'Free' ? freeCount : tier === 'Pro' ? proCount : enterpriseCount;
            const percent = devCount > 0 ? (count / devCount * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#FFFFFF' }}>{tier}</span>
                  <span style={{ fontSize: 12, color: '#A1A1A6' }}>{count} ({percent.toFixed(0)}%)</span>
                </div>
                <div style={{ height: 4, background: '#1A1B21', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: tier === 'Free' ? '#FFC72C' : tier === 'Pro' ? '#FB923C' : '#A78BFA', width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Corporate View ───────────────────────────────────────────────────────────
function CorporateView() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 20 }}>Enterprise Accounts</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[{ name: 'Logistics Co', seats: '5/10', usage: '67%' }, { name: 'Tech Startup', seats: '2/5', usage: '42%' }, { name: 'Gov Agency', seats: '8/15', usage: '88%' }].map((c, i) => (
          <div key={i} style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFC72C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 }}>🏢</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#A1A1A6', marginBottom: 8 }}>{c.seats} seats</div>
            <div style={{ height: 4, background: '#1A1B21', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#FFC72C', width: c.usage }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Developers View ──────────────────────────────────────────────────────────
function DevelopersView() {
  const [tab, setTab] = useState('Developers');
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDev, setSelectedDev] = useState(null);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      const res = await fetch('/api/business/developers');
      const data = await res.json();
      if (data.success) {
        setDevelopers(data.data.developers || []);
        setError(null);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      setError(e.message);
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getTierColor = (tier) => {
    const colors = { free: '#FFC72C', pro: '#FB923C', enterprise: '#A78BFA' };
    return colors[tier] || '#FFC72C';
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[{ label: 'Total Developers', value: developers.length, icon: '👥' }, { label: 'API Keys Active', value: developers.filter(d => d.status === 'active').length, icon: '🔑' }, { label: 'Avg Response', value: '45ms', icon: '⚡' }].map((s, i) => (
          <div key={i} style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFC72C' }}>{s.value}</div>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#13141A', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {['Developers', 'API Docs', 'Webhooks', 'Logs'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none',
            background: tab === t ? '#FFFFFF0F' : 'transparent',
            color: tab === t ? '#FFFFFF' : '#A1A1A6',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#F87171', color: '#000', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
          {error}
          <button onClick={fetchDevelopers} style={{ marginLeft: 'auto', background: '#000', color: '#F87171', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Retry</button>
        </div>
      )}

      {tab === 'Developers' && (
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#A1A1A6' }}>Loading developers...</div>
          ) : developers.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#A1A1A6' }}>No developers yet</div>
          ) : (
            developers.map((dev, i) => (
              <div key={i} onClick={() => setSelectedDev(dev)} style={{ padding: '14px 16px', borderBottom: i < developers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#16171D'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{dev.business_name}</div>
                  <div style={{ fontSize: 11, color: '#A1A1A6' }}>{dev.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: getTierColor(dev.tier), color: '#000', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                    {dev.tier.toUpperCase()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {tab === 'API Docs' && (
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', fontFamily: PP.mono, fontSize: 12, color: '#34D399' }}>
          <div>// ppoint API SDK</div>
          <div>import ppoint from "@ppoint/sdk"</div>
          <div><br /></div>
          <div>const client = ppoint.Client({`{`}</div>
          <div style={{ paddingLeft: 20 }}>apiKey: "ppt_live_xxxxx"</div>
          <div>{`}`})</div>
          <div><br /></div>
          <div>// Reverse geocoding example</div>
          <div>const address = await client.address.reverse({`{`}</div>
          <div style={{ paddingLeft: 20 }}>lat: 6.5244, lng: 3.3792</div>
          <div>{`}`})</div>
        </div>
      )}
      {tab === 'Webhooks' && (
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', color: '#A1A1A6' }}>
          Configure webhooks to receive real-time updates on address verifications, agent applications, and emergency incidents.
        </div>
      )}

      {selectedDev && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0A0B0D', borderRadius: 14, padding: 20, maxWidth: 500, width: '90%', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              {selectedDev.business_name}
              <button onClick={() => setSelectedDev(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: '#A1A1A6', marginBottom: 4 }}>EMAIL</div><div style={{ fontSize: 12, color: '#FFFFFF' }}>{selectedDev.email}</div></div>
            <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: '#A1A1A6', marginBottom: 4 }}>TIER</div><div style={{ background: getTierColor(selectedDev.tier), color: '#000', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, display: 'inline-block' }}>{selectedDev.tier.toUpperCase()}</div></div>
            <div style={{ marginBottom: 16 }}><div style={{ fontSize: 11, color: '#A1A1A6', marginBottom: 4 }}>API KEY</div><div style={{ background: '#1A1B21', padding: 10, borderRadius: 8, fontFamily: PP.mono, fontSize: 11, color: '#FFC72C', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{selectedDev.api_key}<button onClick={() => copyToClipboard(selectedDev.api_key)} style={{ background: 'none', border: 'none', color: '#FFC72C', cursor: 'pointer', fontSize: 12 }}>📋</button></div></div>
            <button onClick={() => setSelectedDev(null)} style={{ width: '100%', padding: '10px', background: '#FFC72C', color: '#0A0B0D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Billing View ─────────────────────────────────────────────────────────────
function BillingView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('Overview');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/payments/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
        setError(null);
      } else {
        throw new Error(data.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: `₦${(metrics?.payments?.totalRevenue || 0).toLocaleString()}`, color: '#34D399' },
          { label: 'MRR', value: `₦${(metrics?.subscriptions?.mrr || 0).toLocaleString()}`, color: '#FFC72C' },
          { label: 'Active Subs', value: metrics?.subscriptions?.totalActive || 0, color: '#60A5FA' },
          { label: 'Pending', value: `₦${(metrics?.invoices?.pendingAmount || 0).toLocaleString()}`, color: '#F87171' }
        ].map((s, i) => (
          <div key={i} style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#13141A', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {['Overview', 'Payments', 'Invoices', 'Subscriptions'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none',
            background: tab === t ? '#FFFFFF0F' : 'transparent',
            color: tab === t ? '#FFFFFF' : '#A1A1A6',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#F87171', color: '#000', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
          {error}
          <button onClick={fetchMetrics} style={{ marginLeft: 'auto', background: '#000', color: '#F87171', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Retry</button>
        </div>
      )}

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Transactions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Total</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFC72C' }}>{metrics?.payments?.totalTransactions || 0}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Failed</div><div style={{ fontSize: 18, fontWeight: 800, color: '#F87171' }}>{metrics?.payments?.failedCount || 0}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Avg Amount</div><div style={{ fontSize: 18, fontWeight: 800, color: '#34D399' }}>₦{(metrics?.payments?.avgTransaction || 0).toLocaleString()}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Pending</div><div style={{ fontSize: 18, fontWeight: 800, color: '#FCD34D' }}>{metrics?.payments?.pendingCount || 0}</div></div>
            </div>
          </div>

          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Invoice Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Total</div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{metrics?.invoices?.total || 0}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Paid</div><div style={{ fontSize: 16, fontWeight: 800, color: '#34D399' }}>₦{(metrics?.invoices?.paidAmount || 0).toLocaleString()}</div></div>
              <div><div style={{ fontSize: 11, color: '#A1A1A6' }}>Overdue</div><div style={{ fontSize: 16, fontWeight: 800, color: '#F87171' }}>₦{(metrics?.invoices?.overdueAmount || 0).toLocaleString()}</div></div>
            </div>
          </div>

          <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Revenue Trend</div>
            {!loading && metrics?.monthlyTrend && metrics.monthlyTrend.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {metrics.monthlyTrend.slice(0, 6).map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#A1A1A6' }}>{new Date(m.month).toLocaleDateString('en-US', { year: '2-digit', month: 'short' })}</span>
                    <span style={{ color: '#34D399', fontWeight: 700 }}>₦{(m.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#A1A1A6', fontSize: 12 }}>No revenue data yet</div>
            )}
          </div>
        </div>
      )}

      {tab === 'Payments' && (
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', color: '#A1A1A6', textAlign: 'center' }}>
          Payment management coming soon. View and reconcile payments here.
        </div>
      )}

      {tab === 'Invoices' && (
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', color: '#A1A1A6', textAlign: 'center' }}>
          Invoice management coming soon. Create and send invoices here.
        </div>
      )}

      {tab === 'Subscriptions' && (
        <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px', color: '#A1A1A6', textAlign: 'center' }}>
          Subscription management coming soon. Manage subscriptions and tiers here.
        </div>
      )}
    </div>
  );
}

// ── Settings View ────────────────────────────────────────────────────────────
function SettingsView() {
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Profile</div>
        <div style={{ fontSize: 12, color: '#A1A1A6', marginBottom: 8 }}>Name: Emmanuel O.</div>
        <div style={{ fontSize: 12, color: '#A1A1A6', marginBottom: 8 }}>Email: emmanuel@ppoint.africa</div>
        <div style={{ fontSize: 12, color: '#A1A1A6' }}>Tier: 🛡 Agent</div>
      </div>

      <div style={{ background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>Preferences</div>
        {['Email alerts', 'SMS notifications', 'Emergency alerts', 'Weekly digest'].map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 12, color: '#FFFFFF' }}>{p}</span>
            <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function WebDashboardPage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [search, setSearch] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);

  const renderView = () => {
    const props = { selectedAddress, setSelectedAddress };
    switch (activeView) {
      case 'overview': return <OverviewView {...props} />;
      case 'addresses': return <AddressesView />;
      case 'agents': return <AgentsView />;
      case 'emergency': return <EmergencyView />;
      case 'government': return <GovernmentView />;
      case 'business': return <BusinessView />;
      case 'corporate': return <CorporateView />;
      case 'developers': return <DevelopersView />;
      case 'billing': return <BillingView />;
      case 'settings': return <SettingsView />;
      default: return <OverviewView {...props} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', background: '#0A0B0D', fontFamily: PP.font, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: '#0A0B0D', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '20px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: '#FFC72C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#0A0B0D' }}>P</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>PPOINNT</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>ppoint.africa</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1 }}>
          {Object.entries(NAV_SECTIONS).map(([section, items]) => (
            <div key={section} style={{ marginBottom: 16 }}>
              {section !== 'main' && (
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', padding: '12px 10px 6px', letterSpacing: 0.8 }}>
                  {section}
                </div>
              )}
              {items.map(item => (
                <button key={item.id} onClick={() => setActiveView(item.id)} style={{
                  width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none',
                  background: activeView === item.id ? '#FFC72C18' : 'transparent',
                  color: activeView === item.id ? '#FFC72C' : 'rgba(255,255,255,0.55)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, fontWeight: activeView === item.id ? 700 : 600, fontFamily: PP.font,
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: activeView === item.id ? '2px solid #FFC72C' : '2px solid transparent',
                }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FFC72C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#FFC72C' }}>E</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>Emmanuel O.</div>
            <div style={{ fontSize: 10, color: '#FFC72C', fontWeight: 600 }}>🛡 Agent</div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{ height: 56, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, maxWidth: 360, height: 36, background: '#13141A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.40)' }}>{Icons.search()}</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PPOINNT, address..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#FFFFFF', fontSize: 13, fontFamily: PP.font }} />
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#13141A', color: 'rgba(255,255,255,0.60)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            {Icons.bell()}
            <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: '#F87171' }} />
          </button>
          <button style={{ height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#FFC72C', color: '#0A0B0D', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            + Generate PPOINNT
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
