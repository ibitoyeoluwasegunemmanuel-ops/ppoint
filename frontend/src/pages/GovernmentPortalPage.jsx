import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { PP } from '../styles/tokens';

// ── Pan-African Government Hierarchy ──────────────────────────────────────────
const africaHierarchy = {
  Nigeria: {
    emoji: '🇳🇬',
    states: {
      Lagos: { lgas: ['Ikeja', 'Yaba', 'Ikoyi', 'VI'] },
      Abuja: { lgas: ['Garki', 'Wuse', 'Asokoro'] },
      Kano: { lgas: ['Mundubawa', 'Nasarawa', 'Tarauni'] },
    },
  },
  Kenya: {
    emoji: '🇰🇪',
    states: {
      Nairobi: { lgas: ['Westlands', 'CBD', 'Makadara'] },
      Mombasa: { lgas: ['Kisauni', 'Likoni'] },
      Kiambu: { lgas: ['Limuru', 'Ruiru'] },
    },
  },
  Ghana: {
    emoji: '🇬🇭',
    states: {
      Accra: { lgas: ['Ashanti', 'Dansoman', 'Osu'] },
      Kumasi: { lgas: ['Asante Akim', 'Bosomtwe'] },
    },
  },
  'South Africa': {
    emoji: '🇿🇦',
    states: {
      'Gauteng': { lgas: ['Johannesburg', 'Pretoria', 'Ekurhuleni'] },
      'Western Cape': { lgas: ['Cape Town', 'Stellenbosch'] },
    },
  },
  Ethiopia: {
    emoji: '🇪🇹',
    states: {
      'Addis Ababa': { lgas: ['Bole', 'Nifas Silk', 'Yeka'] },
      'Amhara': { lgas: ['Bahir Dar', 'Gondar'] },
    },
  },
};

// ── Government Roles ──────────────────────────────────────────────────────────
const governmentRoles = [
  { emoji: '🏛️', name: 'National Admin', description: 'Cross-country oversight' },
  { emoji: '📊', name: 'Infrastructure Analyst', description: 'Coverage & data' },
  { emoji: '🚨', name: 'Emergency Admin', description: 'Dispatch & alerts' },
  { emoji: '🏗️', name: 'Urban Planning', description: 'Zone & growth' },
  { emoji: '💰', name: 'Tax/FIRS', description: 'Registry & compliance' },
];

// ── KPI Cards mock data ──────────────────────────────────────────────────────
const kpiData = [
  { label: 'Total Addresses', value: '2.4M', change: '+12%', icon: '📍' },
  { label: 'Coverage %', value: '87%', change: '+3%', icon: '🗺️' },
  { label: 'Active Agents', value: '1,243', change: '+28%', icon: '👥' },
  { label: 'Emergency Dispatches', value: '4,821', change: '+18%', icon: '🚨' },
  { label: 'Verified Properties', value: '1.8M', change: '+8%', icon: '✅' },
  { label: 'Unverified Zones', value: '312', change: '-5%', icon: '❓' },
];

// ── Cross-country stats ──────────────────────────────────────────────────────
const countryStats = [
  { country: 'Nigeria', emoji: '🇳🇬', addresses: 1_200_000, coverage: 92 },
  { country: 'Kenya', emoji: '🇰🇪', addresses: 580_000, coverage: 78 },
  { country: 'Ghana', emoji: '🇬🇭', addresses: 340_000, coverage: 65 },
  { country: 'South Africa', emoji: '🇿🇦', addresses: 210_000, coverage: 88 },
  { country: 'Ethiopia', emoji: '🇪🇹', addresses: 70_000, coverage: 32 },
];

// ── Icons ─────────────────────────────────────────────────────────────────
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Coverage Heatmap Grid ─────────────────────────────────────────────────────
function CoverageHeatmap() {
  const rows = 8;
  const cols = 10;
  const cells = Array.from({ length: rows * cols }).map(() => Math.random() * 100);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Coverage Density Map
      </div>
      <div style={{
        background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: 16, display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4,
      }}>
        {cells.map((density, i) => {
          let bgColor = '#1A1B21';
          if (density > 75) bgColor = '#FFC72C';
          else if (density > 50) bgColor = '#34D399';
          else if (density > 25) bgColor = '#3B82F6';

          return (
            <div
              key={i}
              style={{
                width: '100%',
                paddingBottom: '100%',
                background: bgColor,
                borderRadius: 6,
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8,
                color: 'rgba(0,0,0,0.3)',
                fontWeight: 700,
              }}>
                {Math.round(density)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quick Actions Grid ────────────────────────────────────────────────────────
function QuickActions() {
  const actions = [
    { icon: '📥', label: 'Import Registry', action: 'import' },
    { icon: '📤', label: 'Export Report', action: 'export' },
    { icon: '🚨', label: 'Emergency Override', action: 'override' },
    { icon: '📊', label: 'Generate Report', action: 'report' },
    { icon: '🔍', label: 'Investigate Dispute', action: 'investigate' },
    { icon: '🗺️', label: 'View Heatmap', action: 'heatmap' },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Quick Actions
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      }}>
        {actions.map((a, i) => (
          <button
            key={i}
            style={{
              borderRadius: 12, border: 'none',
              background: '#13141A', color: '#FFFFFF',
              padding: '16px', textAlign: 'center', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 8, fontSize: 13, fontWeight: 600, fontFamily: PP.font,
              transition: 'all 0.2s',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}
            onMouseEnter={(e) => e.target.style.background = '#1A1B21'}
            onMouseLeave={(e) => e.target.style.background = '#13141A'}
          >
            <div style={{ fontSize: 20 }}>{a.icon}</div>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Pan-African Stats ────────────────────────────────────────────────────────
function PanAfricanStats() {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Across Africa
      </div>
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
      }}>
        {countryStats.map((s, i) => (
          <div
            key={i}
            style={{
              minWidth: 140, width: 140, flexShrink: 0,
              background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
            <div style={{ fontSize: 16 }}>{s.emoji}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
                {s.country}
              </div>
              <div style={{ fontSize: 11, color: '#A1A1A6' }}>
                {(s.addresses / 1000).toFixed(0)}K addresses
              </div>
              <div style={{
                fontSize: 11, color: '#34D399', fontWeight: 600, marginTop: 4,
              }}>
                {s.coverage}% coverage
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GovernmentPortalPage() {
  const { user, isGovernment } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('Nigeria');
  const [selectedState, setSelectedState] = useState('Lagos');
  const [selectedRole, setSelectedRole] = useState('National Admin');

  const countries = Object.keys(africaHierarchy);
  const currentCountryData = africaHierarchy[selectedCountry];
  const states = Object.keys(currentCountryData.states);
  const lgas = selectedState ? currentCountryData.states[selectedState]?.lgas : [];

  // If not government user, show access request screen
  if (!isGovernment) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#0A0B0D', padding: '60px 32px',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', fontFamily: PP.font,
      }}>
        <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.5 }}>🏛️</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 10, letterSpacing: -0.3 }}>
          Government Access
        </div>
        <div style={{ fontSize: 14, color: '#A1A1A6', lineHeight: 1.6, marginBottom: 32, maxWidth: 280 }}>
          This portal is for authorized government officials only. Request access to unlock pan-African infrastructure management.
        </div>
        <button style={{
          width: '100%', maxWidth: 280, height: 50, borderRadius: 14, border: 'none',
          background: '#FFC72C', color: '#0A0B0D',
          fontSize: 15, fontWeight: 800, fontFamily: PP.font, cursor: 'pointer',
        }}>
          Request Access
        </button>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0A0B0D', fontFamily: PP.font,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          fontSize: 22, fontWeight: 800, color: '#FFFFFF',
          letterSpacing: -0.3, marginBottom: 16,
        }}>
          Africa Infrastructure
        </div>

        {/* Selectors */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
        }}>
          {/* Country */}
          <div>
            <label style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
              display: 'block', marginBottom: 6, textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedState(Object.keys(africaHierarchy[e.target.value].states)[0]);
              }}
              style={{
                width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                background: '#13141A', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                fontFamily: PP.font, padding: '0 12px', cursor: 'pointer',
              }}
            >
              {countries.map(c => (
                <option key={c} value={c}>{africaHierarchy[c].emoji} {c}</option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
              display: 'block', marginBottom: 6, textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>State/Province</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                background: '#13141A', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                fontFamily: PP.font, padding: '0 12px', cursor: 'pointer',
              }}
            >
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* LGA */}
          <div>
            <label style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
              display: 'block', marginBottom: 6, textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>LGA/District</label>
            <select
              defaultValue={lgas[0]}
              style={{
                width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                background: '#13141A', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                fontFamily: PP.font, padding: '0 12px', cursor: 'pointer',
              }}
            >
              {lgas.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
      }}>
        {/* Government Roles */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
          }}>
            Your Role
          </div>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          }}>
            {governmentRoles.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedRole(r.name)}
                style={{
                  minWidth: 110, flexShrink: 0,
                  padding: '12px 14px', borderRadius: 12, border: 'none',
                  background: selectedRole === r.name ? '#FFC72C' : '#13141A',
                  color: selectedRole === r.name ? '#0A0B0D' : '#A1A1A6',
                  fontSize: 12, fontWeight: 700, fontFamily: PP.font,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, borderTop: selectedRole === r.name ? 'none' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div style={{ fontSize: 16 }}>{r.emoji}</div>
                <div style={{ textAlign: 'center', lineHeight: 1.2 }}>{r.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
          }}>
            Key Metrics
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
          }}>
            {kpiData.map((kpi, i) => (
              <div
                key={i}
                style={{
                  background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ fontSize: 20 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 12, color: '#34D399', fontWeight: 700 }}>{kpi.change}</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#A1A1A6' }}>{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coverage Heatmap */}
        <CoverageHeatmap />

        {/* Quick Actions */}
        <QuickActions />

        {/* Pan-African Stats */}
        <PanAfricanStats />
      </div>
    </div>
  );
}
